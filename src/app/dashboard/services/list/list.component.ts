import { Component, OnInit, ViewChild, OnDestroy, TemplateRef, ElementRef, EventEmitter, ViewEncapsulation } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Validators, FormControl, FormBuilder, FormGroup, AbstractControl, ValidatorFn } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { NgbModal, NgbModalRef, NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { take, filter } from 'rxjs/operators';
import * as _ from 'lodash';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { Definition, DateType } from 'src/app/interfaces/definition';
import { environment } from 'src/environments/environment';
import { SessionService } from 'src/app/service/session.service';
import { ListAgGridComponent } from './list-ag-grid/list-ag-grid.component';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { ListFiltersComponent } from './list-filters/list-filters.component';
import { forkJoin, Observable } from 'rxjs';

@Component({
  selector: 'odp-list',
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
  encapsulation: ViewEncapsulation.None,
  animations: [
    trigger('slideIn', [
      state(
        'void',
        style({
          transform: 'translateX(20px)'
        })
      ),
      transition('void => *', [
        animate(
          '600ms cubic-bezier(0.86, 0, 0.07, 1)',
          keyframes([
            style({
              opacity: 0,
              transform: 'translateX(20px)'
            }),
            style({
              opacity: 0.5,
              transform: 'translateX(10px)'
            }),
            style({
              opacity: 1,
              transform: 'translateX(0)'
            })
          ])
        )
      ]),
      transition('* => void', [
        animate(
          '600ms cubic-bezier(0.86, 0, 0.07, 1)',
          keyframes([
            style({
              opacity: 0.7,
              transform: 'translateX(10px)'
            }),
            style({
              opacity: 0.5,
              transform: 'translateX(15px)'
            }),
            style({
              opacity: 0,
              transform: 'translateX(20px)'
            })
          ])
        )
      ])
    ])
  ]
})
export class ListComponent implements OnInit, OnDestroy {
  @ViewChild('listGrid', { static: false }) listGrid: ListAgGridComponent;
  @ViewChild('listFilters', { static: false })
  listFilters: ListFiltersComponent;
  @ViewChild('customizeModalTemplate', { static: false })
  customizeModalTemplate: TemplateRef<HTMLElement>;
  @ViewChild('confirmDeleteModal', { static: false })
  confirmDeleteModal: TemplateRef<HTMLElement>;
  @ViewChild('workflowModal', { static: false })
  workflowModal: TemplateRef<HTMLElement>;
  @ViewChild('createNewFilter', { static: false })
  createNewFilter: TemplateRef<ElementRef>;
  createNewFilterRef: NgbModalRef;
  @ViewChild('clearFilterModal', { static: false })
  clearFilterModal: TemplateRef<ElementRef>;
  @ViewChild('dataContainer', { static: false }) dataContainer: ElementRef;
  clearFilterModalRef: NgbModalRef;
  confirmDeleteModalRef: NgbModalRef;
  workflowModalRef: NgbModalRef;
  lastFilterAppliedPrefId: string;
  schema: any;
  api: string;
  definition: Definition[];
  totalRecords: number;
  apiCalls: any;
  subscriptions: any;
  workflowModalOptions: any;
  workflowData: Array<any>;
  workflowUploadedFiles: Array<any>;
  workflowFilesList: Array<any>;
  selectedRows: Array<any>;
  selectedColumns: string;
  appCenterStyle: any;
  advanceFilter: boolean;
  showSaveViewDropDown: boolean;
  savedViews: Array<any>;
  allFilters: Array<any>;
  showSearchSavedView: boolean;
  selectedSavedView: any;
  showPrivateViews: boolean;
  savedViewApiConfig: GetOptions;
  savedViewSearchTerm: string;
  deleteModal: {
    title: string;
    message: string;
  };
  respondControl: any;
  currentTotalCount: number;
  loadedRecordsCount: number;
  applySavedView: EventEmitter<any>;
  selectAll: EventEmitter<any>;
  checkAll: boolean;
  selectedRow: any;
  showContextMenu: boolean;
  hasFilterFromUrl = false;
  isSchemaFree = false;
  searchForm: FormGroup;
  filterPayload: any;
  filterId: any;
  filterCreatedBy: any;
  isCollapsed: any;
  selectedSearch: any;
  constructor(
    private appService: AppService,
    private route: ActivatedRoute,
    private commonService: CommonService,
    private sessionService: SessionService,
    private modalService: NgbModal,
    private router: Router,
    private ts: ToastrService,
    private shortcutService: ShortcutService,
    private ngbToolTipConfig: NgbTooltipConfig,
    private activatedRoute: ActivatedRoute,
    private fb: FormBuilder,
  ) {
    const self = this;
    self.workflowModalOptions = {};
    self.workflowUploadedFiles = [];
    self.workflowFilesList = [];
    self.workflowData = [];
    self.deleteModal = {
      title: 'Delete Record(s)',
      message: 'Are you sure, you want to delete these record(s)?'
    };
    self.subscriptions = {};
    self.apiCalls = {};
    self.definition = [];
    self.respondControl = new FormControl('', Validators.required);
    self.selectAll = new EventEmitter();
    self.applySavedView = new EventEmitter();
    self.savedViews = [];
    self.selectedRows = [];
    self.totalRecords = 0;
    self.savedViewApiConfig = {
      page: 1,
      count: 10
    };
    self.searchForm = self.fb.group({
      name: ['', [Validators.required]],
      filter: ['{}', [validJSON()]],
      project: ['{}', [validJSON(), validSearch('project')]],
      sort: ['{}', [validJSON(), validSearch('sort')]],
      private: [false, [Validators.required]],
      count: ['', Validators.min(1)],
      page: ['', Validators.min(1)]
    });
    self.filterPayload = {
      serviceId: '',
      name: '',
      private: false,
      value: '',
      app: self.commonService.app._id,
      createdBy: self.sessionService.getUser(true)._id,
      type: 'dataService'
    };
    self.filterId = null;
    self.isCollapsed = true;
    self.selectedSearch = "";
  }

  ngOnInit() {
    const self = this;
    self.appCenterStyle = self.commonService.app.appCenterStyle;
    self.ngbToolTipConfig.container = 'body';
    self.subscriptions['serviceChange'] = self.appService.serviceChange.subscribe(data => {
      self.unSubcribeApis();
      self.lastFilterAppliedPrefId = null;
      self.fetchSchema(data._id);
      self.checkAll = false;
    });

    this.setupShortcuts();

    const waitForServiceId = setInterval(() => {
      if (self.appService.serviceId) {
        self.fetchSchema(self.appService.serviceId);
        clearInterval(waitForServiceId);
      }
    }, 100);

    this.commonService.notification.fileImport
      .pipe(filter(data => data?.status === 'Created'))
      .subscribe(() => {
        this.getRecordsCount();
      })
  }

  ngOnDestroy() {
    const self = this;
    self.advanceFilter = false;
    if (self.confirmDeleteModalRef) {
      self.confirmDeleteModalRef.close();
    }
    if (self.workflowModalRef) {
      self.workflowModalRef.close();
    }
    if (self.clearFilterModalRef) {
      self.clearFilterModalRef.close();
    }
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  setupShortcuts() {
    const self = this;
    this.shortcutService.unregisterAllShortcuts(357);

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Next Page',
      keys: ['Shift', '>']
    });
    self.subscriptions['nextPage'] = self.shortcutService.shiftDotKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        const scrollElement = self.dataContainer?.nativeElement?.querySelector(
          'odp-list-ag-grid>ag-grid-angular>.ag-root-wrapper>.ag-root-wrapper-body>.ag-root>.ag-body-viewport'
        );
        if (!!scrollElement) {
          scrollElement.scrollTop += scrollElement.clientHeight;
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Previous Page',
      keys: ['Shift', '<']
    });
    self.subscriptions['prevPage'] = self.shortcutService.shiftCommaKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        const scrollElement = self.dataContainer?.nativeElement?.querySelector(
          'odp-list-ag-grid>ag-grid-angular>.ag-root-wrapper>.ag-root-wrapper-body>.ag-root>.ag-body-viewport'
        );
        if (!!scrollElement) {
          scrollElement.scrollTop -= scrollElement.clientHeight;
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Focus on Next Record',
      keys: ['Down']
    });
    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Focus on Previous Record',
      keys: ['Up']
    });
    self.subscriptions['focusRecord'] = self.shortcutService.key
      .pipe(filter(event => event.key === 'ArrowUp' || event.key === 'ArrowDown'))
      .subscribe(() => {
        const gridApi = this.listGrid?.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        if (!focusedCell) {
          gridApi?.setFocusedCell(0, '_id');
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Select Focused Record',
      keys: ['S']
    });
    self.subscriptions['selectRecord'] = self.shortcutService.key
      .pipe(
        filter(
          event =>
            document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'S'
        )
      )
      .subscribe(() => {
        const gridApi = this.listGrid?.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        if (!!focusedCell) {
          gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex).setSelected(true);
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Unselect Focused Record',
      keys: ['U']
    });
    self.subscriptions['unselectRecord'] = self.shortcutService.key
      .pipe(
        filter(
          event =>
            document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'U'
        )
      )
      .subscribe(() => {
        const gridApi = this.listGrid?.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        if (!!focusedCell) {
          gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex).setSelected(false);
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Select Next Record',
      keys: ['K']
    });
    self.subscriptions['selectNextRecord'] = self.shortcutService.key
      .pipe(
        filter(
          event =>
            document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'K'
        )
      )
      .subscribe(() => {
        const gridApi = this.listGrid?.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        const nextRowIndex = !!focusedCell ? focusedCell.rowIndex + 1 : 0;
        if (nextRowIndex <= gridApi?.getLastDisplayedRow()) {
          const nextNode = gridApi?.getDisplayedRowAtIndex(nextRowIndex);
          gridApi?.setFocusedCell(nextRowIndex, '_id');
          nextNode?.setSelected(true);
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Select Previous Record',
      keys: ['J']
    });
    self.subscriptions['selectPrevRecord'] = self.shortcutService.key
      .pipe(
        filter(
          event =>
            document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'J'
        )
      )
      .subscribe(() => {
        const gridApi = this.listGrid?.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        const prevRowIndex = !!focusedCell ? focusedCell.rowIndex - 1 : 0;
        if (prevRowIndex >= 0) {
          const prevNode = gridApi?.getDisplayedRowAtIndex(prevRowIndex);
          gridApi?.setFocusedCell(prevRowIndex, '_id');
          prevNode?.setSelected(true);
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Select All Records',
      keys: ['Ctrl', 'A']
    });
    self.subscriptions['selectAll'] = self.shortcutService.ctrlAKey.subscribe(() => {
      const gridApi = this.listGrid?.agGrid?.api;
      gridApi?.forEachNode(node => node.setSelected(true));
    });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Unselect All Records',
      keys: ['Esc']
    });
    self.subscriptions['selectNone'] = self.shortcutService.key
      .pipe(filter(event => event.key.toUpperCase() === 'ESCAPE'))
      .subscribe(() => {
        if (this.showSaveViewDropDown) {
          this.showSaveViewDropDown = false;
        } else if (this.advanceFilter) {
          this.advanceFilter = false;
        } else {
          const gridApi = this.listGrid?.agGrid?.api;
          gridApi?.forEachNode(node => node.setSelected(false));
        }
      });

    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'View Focused Record',
      keys: ['Enter']
    });
    this.shortcutService.registerShortcut({
      section: 'Table',
      label: 'Close Record',
      keys: ['Esc']
    });
    self.subscriptions['openRecord'] = self.shortcutService.key.pipe(filter(event => event.key.toUpperCase() === 'ENTER')).subscribe(() => {
      const gridApi = this.listGrid?.agGrid?.api;
      const row = gridApi?.getDisplayedRowAtIndex(gridApi?.getFocusedCell()?.rowIndex);
      this.listGrid?.rowDoubleClicked(row);
    });

    this.shortcutService.registerShortcut({
      section: 'Filters',
      label: 'Show Advanced Filters',
      keys: ['Shift', 'F']
    });
    this.shortcutService.registerShortcut({
      section: 'Filters',
      label: 'Hide Advanced Filters',
      keys: ['Esc']
    });
    self.subscriptions['openFilter'] = self.shortcutService.shiftFKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        this.advanceFilter = true;
      });

    this.shortcutService.registerShortcut({
      section: 'Filters',
      label: 'Show Saved Views',
      keys: ['Alt', 'Shift', 'F']
    });
    this.shortcutService.registerShortcut({
      section: 'Filters',
      label: 'Hide Saved Views',
      keys: ['Esc']
    });
    self.subscriptions['openSavedView'] = self.shortcutService.altShiftFKey.subscribe(() => {
      this.showSaveViewDropDown = true;
    });

    this.shortcutService.registerShortcut({
      section: 'Filters',
      label: 'Clear/Reset Filters',
      keys: ['Shift', 'X']
    });
    self.subscriptions['resetFilter'] = self.shortcutService.shiftXKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        if (this.hasFilters) {
          this.clearFilters();
        } else if (this.selectedSavedView) {
          this.resetFilter();
        }
      });
  }

  unSubcribeApis() {
    const self = this;
    if (self.confirmDeleteModalRef) {
      self.confirmDeleteModalRef.close();
    }
    if (self.workflowModalRef) {
      self.workflowModalRef.close();
    }
    if (self.clearFilterModalRef) {
      self.clearFilterModalRef.close();
    }
    Object.keys(self.subscriptions)
      .filter(
        key =>
          ![
            'serviceChange',
            'filterCleared',
            'nextPage',
            'prevPage',
            'focusRecord',
            'selectNextRecord',
            'selectPrevRecord',
            'selectRecord',
            'unselectRecord',
            'selectAll',
            'selectNone',
            'openRecord',
            'openFilter',
            'openSavedView',
            'resetFilter'
          ].includes(key)
      )
      .forEach((key: string) => {
        if (self.subscriptions[key]) {
          self.subscriptions[key].unsubscribe();
        }
      });
  }

  resetFilter(showAdvancedFilter = false) {
    const self = this;
    this.hasFilterFromUrl = false;
    if (self.listGrid) {
      self.listGrid.clearSavedView();
    }
    self.savedViews = [];
    self.advanceFilter = showAdvancedFilter;
    self.selectedSavedView = null;
    self.selectedSearch = null;
    self.appService.existingFilter = null;
    if (self.lastFilterAppliedPrefId) {
      self.deleteLastFilterApplied();
    }
    if(self.schema.schemaFree){
      self.searchForm.patchValue({
        name: '',
        filter: '{}',
        project: '{}',
        sort: '{}',
        count: '',
        page: '',
        private: false
      });
    }
    self.filterSavedViews();
  }

  fetchSchema(serviceId: string) {
    const self = this;
    self.filterPayload.serviceId = serviceId;
    const options: GetOptions = {
      filter: { status: 'Active', app: self.commonService.app._id }
    };
    if (self.subscriptions['getSchema_' + serviceId]) {
      self.subscriptions['getSchema_' + serviceId].unsubscribe();
      self.subscriptions['getSchema_' + serviceId] = null;
    }
    self.apiCalls.fetchingSchema = true;
    self.subscriptions['getSchema_' + serviceId] = self.commonService.get('sm', '/service/' + serviceId, options).subscribe(
      res => {
        self.apiCalls.fetchingSchema = false;
        if (!res.definition) {
          self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
            state: {
              noRedirect: true,
              serviceId: null
            }
          });
        } else {
          const parsedDef = res.definition;
          self.fixSchema(parsedDef);
          res.definition = JSON.parse(JSON.stringify(parsedDef));
          self.checkAll = false;
          self.api = '/' + self.commonService.app._id + res.api;
          self.appService.serviceAPI = self.api;
          self.schema = res;
          // self.isSchemaFree = true;
          if (res.schemaFree) {
            self.isSchemaFree = res.schemaFree;
          }
          self.resetFilter();
          self.buildColumns();
          self.refineByPermissions();
          self.getSavedViews(true);
          self.getRecordsCount();
          this.activatedRoute.queryParams.pipe(take(1)).subscribe(queryParams => {
            this.hasFilterFromUrl = !!queryParams && (!!queryParams.filter || !!queryParams.sort || !!queryParams.select);
          });
        }
      },
      err => {
        self.apiCalls.fetchingSchema = false;
        if (err.status === 403) {
          self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
            state: {
              noRedirect: true,
              serviceId
            }
          });
        } else if (err.status === 404) {
          self.router.navigate(['/', this.commonService.app._id]);
        } else {
          self.commonService.errorToast(err, 'Unable to fetch details');
        }
      }
    );
  }

  onRefine(event) {
    if (event.refresh) {
      this.getSavedViews(true);
    }
    this.selectSavedView(event);
  }

  getSavedViews(getAll?: boolean) {
    const self = this;
    if (!!self.savedViewApiConfig?.filter?.createdBy) {
      delete self.savedViewApiConfig.filter.createdBy;
    }
    self.savedViewApiConfig.filter = {
      serviceId: self.schema._id,
      app: self.commonService.app._id,
      type: { $ne: 'workflow' }
    };

    if (!self.schema.schemaFree) {
      if (!getAll) {
        if (self.showPrivateViews) {
          self.savedViewApiConfig.filter.createdBy = self.sessionService.getUser(true)._id;
          self.savedViewApiConfig.filter.private = true;
        } else {
          self.savedViewApiConfig.filter.private = false;
        }
        if (self.savedViewSearchTerm) {
          self.savedViewApiConfig.filter.name = self.savedViewSearchTerm;
        }
        self.commonService.get('user', '/filter/', self.savedViewApiConfig).subscribe(data => {
          self.savedViews = [];
          data.forEach(view => {
            self.fixSavedView(view);
            if (view.value && view.type === 'dataService') {
              if (typeof view.value === 'string') {
                view.value = JSON.parse(view.value);
              }
              if (!self.isSchemaFree && view.value.filter && view.value.filter.length > 0) {
                view.value.filter.forEach(item => {
                  item.dataKey = item.dataKey;
                  delete item.headerName;
                  delete item.fieldName;
                  delete item.fieldType;
                });
              }
            }
            self.getUserName(view);
            if (!self.savedViews.length || self.savedViews.every(itm => itm._id !== view._id)) {
              self.savedViews.push(view);
            }
          });
          if (self.showPrivateViews) {
            const publicViews = self.allFilters.filter(f => !f.private);
            self.allFilters = [...self.savedViews, ...publicViews];
          } else {
            const privateViews = self.allFilters.filter(f => f.private);
            self.allFilters = [...privateViews, ...self.savedViews];
          }
        });
      } else {
        for (let i = 0; i < 2; i++) {
          if (i === 0) {
            self.savedViewApiConfig.filter.createdBy = self.sessionService.getUser(true)._id;
            self.savedViewApiConfig.filter.private = true;
            self.savedViews = [];
            self.allFilters = [];
          } else {
            self.savedViewApiConfig.filter.private = false;
          }
          self.commonService.get('user', '/filter/', self.savedViewApiConfig).subscribe(data => {
            data.forEach(view => {
              self.fixSavedView(view);
              if (view.value && view.type === 'dataService') {
                if (typeof view.value === 'string') {
                  view.value = JSON.parse(view.value);
                }
                if (!self.isSchemaFree && view.value.filter && view.value.filter.length > 0) {
                  view.value.filter.forEach(item => {
                    item.dataKey = item.dataKey;
                    delete item.headerName;
                    delete item.fieldName;
                    delete item.fieldType;
                  });
                }
              }
              self.getUserName(view);
              self.allFilters.push(view);
              if (i === 0 && self.showPrivateViews && (!self.savedViews.length || self.savedViews.every(itm => itm._id !== view._id))) {
                self.savedViews.push(view);
              }
              if (i === 1 && !self.showPrivateViews && (!self.savedViews.length || self.savedViews.every(itm => itm._id !== view._id))) {
                self.savedViews.push(view);
              }
            });
          });
        }
      }
    }
    else {
      self.savedViewApiConfig.filter.createdBy = self.sessionService.getUser(true)._id;
      self.savedViewApiConfig.filter.private = true;
      self.savedViewApiConfig.filter.name = self.savedViewSearchTerm;

      let publicSavedViewConfig = JSON.parse(JSON.stringify(self.savedViewApiConfig));
      publicSavedViewConfig.filter.private = false;
      delete publicSavedViewConfig.filter.createdBy;
      let privateSavedViewApi = self.commonService.get('user', '/filter/', self.savedViewApiConfig);
      let publicSavedViewApipublic = self.commonService.get('user', '/filter/', publicSavedViewConfig);

      forkJoin([privateSavedViewApi, publicSavedViewApipublic]).subscribe((data) => {
        self.savedViews = [];

        let allViews = [...data[0], ...data[1]];
        allViews.forEach(view => {
          self.fixSavedView(view);
          if (view.value && view.type === 'dataService') {
            if (typeof view.value === 'string') {
              view.value = JSON.parse(view.value);
            }
            if (!self.isSchemaFree && view.value.filter && view.value.filter.length > 0) {
              view.value.filter.forEach(item => {
                item.dataKey = item.dataKey;
                delete item.headerName;
                delete item.fieldName;
                delete item.fieldType;
              });
            }
          }
          self.getUserName(view);
          if (!self.savedViews.length || self.savedViews.every(itm => itm._id !== view._id)) {
            self.savedViews.push(view);
          }
        });

      })
    }

  }

  fixSavedView(viewData) {
    const self = this;
    if (!viewData.type) {
      self.commonService.put('user', `/filter/${viewData._id}`, { type: 'dataService' }).subscribe(
        res => { },
        err => {
          console.error('Unable to Update Filter:', viewData.name);
        }
      );
    }
    if (!viewData.value) {
      self.commonService.delete('user', `/filter/${viewData._id}`).subscribe(
        res => { },
        err => {
          console.error('Unable to Delete Filter:', viewData.name);
        }
      );
    }
    viewData.hasOptions = viewData.createdBy === this.commonService.userDetails._id;
    // Sort Fix code for later release
    // if (viewData.value) {
    //   if (typeof viewData.value === 'string') {
    //     viewData.value = JSON.parse(viewData.value);
    //   }
    //   self.commonService.delete('user', `/filter/${viewData._id}`).subscribe((res) => { }, err => {
    //     console.error('Unable to Delete Filter:', viewData.name);
    //   });
    // }
  }

  fixSchema(parsedDef) {
    parsedDef.forEach(def => {
      if (def.properties && def.properties.relatedTo) {
        def.type = 'Relation';
        def.properties._typeChanged = 'Relation';
        delete def.definition;
      } else if (def.properties && def.properties.password) {
        def.type = 'String';
        def.properties._typeChanged = 'String';
        delete def.definition;
      } else if (def.properties && def.properties.geoType) {
        def.type = 'Geojson';
        def.properties._typeChanged = 'Geojson';
        delete def.definition;
      } else if (def.type === 'Array') {
        this.fixSchema(def.definition);
      } else if (def.type === 'Object') {
        this.fixSchema(def.definition);
      }
    });
  }

  getUserName(filter) {
    const self = this;
    self.commonService
      .getUser(filter.createdBy)
      .then(user => {
        filter.user = user.basicDetails.name;
      })
      .catch(err => {
        filter.user = filter.createdBy;
        console.error('Unable to fetch name of User:', filter.createdBy);
      });
  }

  getRecordsCount() {
    const self = this;
    self.apiCalls.fetchingCount = true;
    self.commonService.get('api', self.api + '/utils/count').subscribe(
      count => {
        self.apiCalls.fetchingCount = false;
        self.totalRecords = count;
        self.getLastFilterApplied();
      },
      err => {
        self.apiCalls.fetchingCount = false;
        if (err.status === 403) {
          self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
            state: {
              noRedirect: true,
              serviceId: null
            }
          });
        } else {
          self.commonService.errorToast(err, 'Unable to fetch count');
        }
      }
    );
  }

  buildColumns() {
    const self = this;
    const temp = self.parseDefinition(self.schema.definition);
    temp.unshift({
      show: true,
      key: '_checkbox',
      dataKey: '_checkbox',
      type: 'Checkbox',
      width: 48,
      definition: [],
      properties: {
        name: '#'
      },
      checkbox: true
    });
    if (self.isSchemaFree) {
      temp.push({
        show: true,
        key: 'Data',
        dataKey: 'Data',
        definition: [],
        properties: {
          name: 'Data',
          type: 'schemafree'
        }
      });
    }

    temp.push({
      show: true,
      key: '_metadata.createdAt',
      dataKey: '_metadata.createdAt',
      type: 'Date',
      definition: [],
      properties: {
        name: 'Created',
        dateType: DateType.datetime,
        type: 'Date'
      }
    });
    temp.push({
      show: true,
      key: '_metadata.lastUpdated',
      dataKey: '_metadata.lastUpdated',
      type: 'Date',
      definition: [],
      properties: {
        name: 'Last Updated',
        dateType: DateType.datetime,
        type: 'Date'
      }
    });
    self.definition = temp;
  }

  parseDefinition(def, parentKey?: string, parentName?: string): Definition[] {
    const self = this;
    let tempArr: Definition[] = [];
    def.forEach(defObj => {
      const temp: Definition = {};
      temp.show = true;
      if (defObj.key === '_id') {
        temp.key = defObj.key;
        temp.dataKey = defObj.key;
        temp.type = 'Identifier';
        temp.properties = { name: defObj.properties.name };
        temp.properties.type = defObj.type;
        temp.definition = [];
        tempArr.unshift(temp);
      } else {
        if (defObj.type === 'Object') {
          const tempName = parentName ? parentName + '.' + defObj.properties.name : defObj.properties.name;
          const tempKey = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          tempArr = tempArr.concat(self.parseDefinition(defObj.definition, tempKey, tempName));
        } else {
          temp.key = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          temp.dataKey = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          temp.type = defObj.type;
          temp.properties = defObj.properties;
          temp.properties.name = parentName ? parentName + '.' + temp.properties.name : temp.properties.name;
          temp.properties.type = defObj.type;
          temp.definition = defObj.definition ? self.parseDefinition(defObj.definition, temp.key, defObj.properties.name) : [];
          tempArr.push(temp);
        }
      }
    });
    return tempArr;
  }

  refineByPermissions() {
    const self = this;
    if (!(self.hasPermission('POST') && self.hasPermission('PUT') && self.hasPermission('DELETE'))) {
      // const fieldsList: any[] = self.commonService.getViewFieldsList(self.schema._id);
      const originalFields = self.schema.role.fields;
      const roles: any[] = self.schema.role.roles;
      const fields = roles.reduce((prev, role) => {
        const temp = {};
        Object.keys(originalFields)
          .filter(key => !!originalFields[key]._p)
          .forEach(key => {
            if (!!prev[key]?._p) {
              const tag1 = prev[key]?._p.charCodeAt(0);
              const tag2 = originalFields[key]._p[role.id].charCodeAt(0);
              temp[key] = {
                _p: String.fromCharCode(Math.max(tag1, tag2))
              }
            } else {
              temp[key] = {
                _p: originalFields[key]._p[role.id]
              }
            }
          });
        return temp;
      }, {});
      self.configureByPermission(self.flattenPermission(fields), self.definition);
    }
  }

  flattenPermission(permission) {
    let temp = {};
    Object.keys(permission).forEach(key => {
      if (permission[key]._p) {
        temp[key] = permission[key];
      } else {
        const tempPer = Object.assign.apply(
          {},
          Object.keys(permission[key]).map(objKey =>
            Object.defineProperty({}, key + '.' + objKey, {
              value: permission[key][objKey],
              enumerable: true,
              configurable: true,
              writable: true
            })
          )
        );
        temp = Object.assign(temp, tempPer);
      }
    });
    return temp;
  }

  configureByPermission(permission, definition) {
    const self = this;
    for (const key in permission) {
      if (permission[key]._p === 'N') {
        const index = definition.findIndex(def => def.key === key);
        if (index > -1) {
          definition.splice(index, 1);
        }
      }
    }
  }

  getLastFilterApplied() {
    const self = this;
    const options: GetOptions = {
      filter: {
        userId: self.commonService.userDetails._id,
        type: 'last-filter',
        key: self.schema._id
      }
    };
    self.commonService.get('user', '/preferences', options).subscribe(
      prefRes => {
        try {
          if (prefRes && prefRes.length > 0) {
            self.lastFilterAppliedPrefId = prefRes[0]._id;
            if (typeof prefRes[0].value === 'string') {
              prefRes[0].value = JSON.parse(prefRes[0].value);
            }
            const view = prefRes[0].value;
            self.appService.existingFilter = view;
            self.selectedSavedView = view;
            self.selectedSearch = view;
            if (self.isSchemaFree) {
              self.selectSearch(view);
            }
            else {
              self.applySavedView.emit(view);
            }
          }
        } catch (e) {
          console.error(e);
        }
      },
      prefErr => {
        self.commonService.errorToast(prefErr, 'Unable to save preference');
      }
    );
  }

  setLastFilterApplied(data: any) {
    const self = this;
    let response;
    const payload = {
      userId: self.commonService.userDetails._id,
      type: 'last-filter',
      key: self.schema._id,
      value: JSON.stringify(data)
    };
    if (self.lastFilterAppliedPrefId) {
      response = self.commonService.put('user', '/preferences/' + self.lastFilterAppliedPrefId, payload);
    } else {
      response = self.commonService.post('user', '/preferences', payload);
    }
    response.subscribe(
      prefRes => {
        self.lastFilterAppliedPrefId = prefRes._id;
      },
      prefErr => {
        self.commonService.errorToast(prefErr, 'Unable to save preference');
      }
    );
  }

  deleteLastFilterApplied() {
    const self = this;
    if (self.lastFilterAppliedPrefId) {
      self.commonService.delete('user', '/preferences/' + self.lastFilterAppliedPrefId).subscribe(
        prefRes => {
          self.lastFilterAppliedPrefId = null;
        },
        prefErr => {
          self.commonService.errorToast(prefErr, 'Unable to update preference');
        }
      );
    }
  }

  selectAllRecords() {
    const self = this;
    self.checkAll = !self.checkAll;
    self.selectAll.emit(self.checkAll);
    // self.appService.selectAll.emit(self.checkAll);
  }

  clearFilters() {
    const self = this;
    if (self.listGrid) {
      self.listGrid.clearFilter();
    }
  }

  clearSort() {
    const self = this;
    if (self.listGrid) {
      self.listGrid.clearSort();
    }
  }

  hasPermission(method?: string): boolean {
    const self = this;
    if (self.schema) {
      return self.commonService.hasPermission(self.schema._id, self.schema.role.roles, method);
    }
    return false;
  }

  workflowAlert(id?) {
    const self = this;
    if (self.hasWorkflow) {
      self.workflowModalOptions.requestedBy = self.commonService.userDetails.username;
      if (self.commonService.userDetails.basicDetails.name) {
        self.workflowModalOptions.requestedBy = self.commonService.userDetails.basicDetails.name;
      }
      if (id) {
        self.workflowModalOptions._id = id;
      } else {
        self.workflowModalOptions._id = self.selectedRows
          .filter(e2 => !(e2._metadata && e2._metadata.workflow))
          .map(e3 => e3._id)
          .join(', ');
      }
      self.workflowModalOptions.operation = 'DELETE';
      self.workflowModalOptions.fields = 'Delete document(s)';
      self.workflowModalRef = self.modalService.open(self.workflowModal, {
        centered: true
      });
      self.workflowModalRef.result.then(
        close => {
          if (close) {
            self.deleteAlert(id);
          }
        },
        dismiss => {
          self.respondControl.markAllAsTouched();
        }
      );
    } else {
      self.deleteAlert(id);
    }
  }

  deleteAlert(id?) {
    const self = this;
    if (self.hasWorkflow) {
      self.deleteRequest(id);
    } else {
      self.confirmDeleteModalRef = self.modalService.open(self.confirmDeleteModal, { centered: true });
      self.confirmDeleteModalRef.result.then(
        close => {
          if (close) {
            self.deleteRequest(id);
          }
        },
        dismiss => { }
      );
    }
  }

  deleteRequest(id?) {
    const self = this;
    let ids = [];
    if (!id) {
      ids = self.selectedRows.filter(e2 => !(e2._metadata && e2._metadata.workflow)).map(e3 => e3._id);
    } else {
      ids.push(id);
    }
    if (self.subscriptions['bulkDelete']) {
      self.subscriptions['bulkDelete'].unsubscribe();
      self.subscriptions['bulkDelete'] = null;
    }
    self.apiCalls.deleteRequest = true;
    self.commonService.delete('api', self.api + '/utils/bulkDelete', { ids }).subscribe(
      res => {
        self.apiCalls.deleteRequest = false;
        if (res._workflow) {
          self.workflowData = res._workflow;
          self.submitWorkflowFiles();
        } else {
          self.ts.success('Deleted.');
          self.checkAll = false;
          self.getRecordsCount();
        }
      },
      err => {
        self.commonService.errorToast(err, 'Unable to delete, please try again later');
        self.checkAll = false;
        self.apiCalls.deleteRequest = false;
      }
    );
  }

  filterSavedViews() {
    const self = this;
    self.savedViewApiConfig.page = 1;
    self.savedViews = [];
    self.getSavedViews();
  }

  loadMoreSavedViews() {
    const self = this;
    self.savedViewApiConfig.page += 1;
    self.getSavedViews();
  }

  selectSavedView(evnt) {
    const view = evnt.query;
    const self = this;
    if (!environment.production) {
      console.log('selectSavedView', view);
    }
    if (view._id) {
      self.setLastFilterApplied(view);
      self.selectedSavedView = view;
      self.applySavedView.emit(view);
      self.appService.existingFilter = view;
    } else {
      self.selectedSavedView = { value: view };
      self.applySavedView.emit({ value: view });
      self.appService.existingFilter = { value: view };
    }
    if (evnt.close) {
      self.advanceFilter = false;
    }
  }

  removedSavedView(event) {
    const self = this;
    self.selectedSavedView = null;
    self.appService.existingFilter = null;
    // if (self.listGrid) {
    //   self.listGrid.clearSavedView();
    // }
  }

  changeFilterType(filter, type) {
    const self = this;
    if (filter.private && type === 'private') {
      return;
    } else if (!filter.private && type === 'public') {
      return;
    } else {
      const currentUser = self.sessionService.getUser(true);
      if (!filter.private && (currentUser.isSuperAdmin || currentUser._id === filter.createdBy)) {
        filter.private = type === 'private';
        let tempFilter = this.appService.cloneObject(filter);
        tempFilter.value = JSON.stringify(tempFilter.value);
        self.subscriptions['filterType'] = self.commonService.put('user', `/filter/${filter._id}`, tempFilter).subscribe(() => {
          self.ts.success('Filter type Updated');
          self.getSavedViews();
        });
      } else if (filter.private && currentUser._id === filter.createdBy) {
        filter.private = type === 'private';
        let tempFilter = this.appService.cloneObject(filter);
        tempFilter.value = JSON.stringify(tempFilter.value);
        self.subscriptions['filterType'] = self.commonService.put('user', `/filter/${filter._id}`, tempFilter).subscribe(() => {
          self.ts.success('Filter type Updated');
          self.getSavedViews();
        });
      } else {
        self.ts.warning('You don\'t have enough permission');
      }
    }
  }

  editFilter(filter) {
    this.showSaveViewDropDown = false;
    this.appService.existingFilter = filter;
    if (this.advanceFilter) {
      this.advanceFilter = false;
    }
    setTimeout(() => {
      this.advanceFilter = true;
    });
    setTimeout(() => {
      if (!!this.listFilters) {
        this.listFilters.showSaveDiv = true;
      }
    }, 100);
  }

  deleteFilter(filter) {
    const self = this;
    const currentUser = self.sessionService.getUser(true);
    if (!filter.private && (currentUser.isSuperAdmin || currentUser._id === filter.createdBy)) {
      self.filterDeleteApiCall(filter);
      self.resetFilter();
    } else if (filter.private && currentUser._id === filter.createdBy) {
      self.filterDeleteApiCall(filter);
      self.resetFilter();
    } else {
      self.ts.warning('Either this is a Private filter or You don\'t have enough permission');
    }
  }

  filterDeleteApiCall(filter) {
    const self = this;
    self.deleteModal.title = 'Delete Filter';
    self.deleteModal.message = `Are you sure you want to delete filter ${filter.name}?`;
    self.confirmDeleteModalRef = self.modalService.open(self.confirmDeleteModal, { centered: true });
    self.confirmDeleteModalRef.result.then(
      close => {
        if (close) {
          self.subscriptions['deleteFilter'] = self.commonService.delete('user', `/filter/${filter._id}`).subscribe(
            res => {
              self.ts.success('Filter Deleted.');
              self.savedViews = [];
              self.getSavedViews();
              self.selectedSearch = null;
              self.clearSearch();
            },
            err => {
              self.commonService.errorToast(err, 'Unable to delete, please try again later');
            }
          );
        }
      },
      dismiss => { }
    );
  }

  view(id?) {
    const self = this;
    if (!id && self.selectedRows) {
      id = self.selectedRows[0]._id;
    }
    if (id) {
      self.router.navigate(['/', this.commonService.app._id, 'services', self.appService.serviceId, 'view', id]);
    } else {
      return;
    }
  }

  edit(id?) {
    const self = this;
    if (!id && self.selectedRows[0]) {
      id = self.selectedRows[0]._id;
    }
    if (id) {
      self.router.navigate(['/', this.commonService.app._id, 'services', self.appService.serviceId, 'manage', id]);
    } else {
      return;
    }
  }

  bulkEdit() {
    const self = this;
    if (self.recordChecked > 1) {
      const ids = self.selectedRows.filter(e2 => !(e2._metadata && e2._metadata.workflow)).map(e3 => e3._id);
      self.appService.bulkEditIds = ids;
      self.router.navigate(['/', this.commonService.app._id, 'services', self.appService.serviceId, 'bulk-update']);
    } else {
      return;
    }
  }

  closeModal() {
    const self = this;
    if (self.respondControl.invalid) {
      self.respondControl.markAllAsTouched();
      return;
    } else {
      self.workflowModalRef.close(true);
    }
  }

  uploadWorkflowFile(uiEvent) {
    const self = this;
    const file = uiEvent.target.files[0];
    const formData: FormData = new FormData();
    formData.append('file', file);

    const indexOfValue = self.workflowFilesList.findIndex(val => val.name === file.name);
    if (indexOfValue < 0) {
      self.subscriptions['uploadFile_' + file.name] = self.commonService
        .upload('api', this.api, formData, false).subscribe(event => {
          if (event.type === HttpEventType.UploadProgress) {
            // self.processing.progress = Math.floor(event.loaded / event.total * 100);
          }
          if (event.type === HttpEventType.Response) {
            if (self.workflowFilesList.length === 0) {
              self.workflowFilesList.push(file);
            } else {
              const indexValue = self.workflowFilesList.findIndex(val => val.name === file.name);
              if (indexValue < 0) {
                self.workflowFilesList.push(file);
              }
            }
            self.workflowUploadedFiles.push({
              timestamp: Date.now(),
              file: event.body,
              user: self.commonService.userDetails._id
            });
          }
        });
    }
  }

  submitWorkflowFiles() {
    const self = this;
    const payload = {
      audit: [
        {
          by: 'user',
          id: self.commonService.userDetails._id,
          action: 'Submit',
          remarks: self.respondControl.value,
          timestamp: Date.now(),
          attachments: self.workflowUploadedFiles.map(e1 => e1.file)
        }
      ]
    };
    for (const wf of self.workflowData) {
      self.subscriptions['updateWorkflow_' + wf._id] = self.commonService.put('api', '/utils/workflow' + wf._id, payload).subscribe(
        res => {
          self.ts.success('Sent for review.');
          self.router.navigate(['/', this.commonService.app._id, 'workflow', self.schema._id], {
            relativeTo: self.route
          });
        },
        err => { }
      );
    }
  }

  removeWorkflowFile(index: number) {
    const self = this;
    self.workflowUploadedFiles.splice(index, 1);
    self.workflowFilesList.splice(index, 1);
  }

  exportData(id?) {
    try {
      const self = this;
      let reqBody = {};
      let filter = null;
      if (self.recordChecked > 0) {
        filter = {
          _id: {
            $in: self.selectedRows.map(e2 => e2._id)
          }
        };
      }

      let totalRecords = self.currentTotalCount;
      if (self.recordChecked > 0) {
        totalRecords = self.recordChecked;
      }
      if (id) {
        totalRecords = 1;
        filter = {
          _id: id
        };
      }
      let url = self.api + '/utils/export';
      const query = [];
      reqBody['timezone'] = new Date().getTimezoneOffset();
      // query.push(`timezone=${new Date().getTimezoneOffset()}`);
      if (filter) {
        // query.push(`filter=${JSON.stringify(filter)}`);
        reqBody['filter'] = filter;
      } else if (self.listGrid.apiConfig.filter) {
        reqBody['filter'] = self.listGrid.apiConfig.filter;
        // query.push(`filter=${JSON.stringify(self.listGrid.apiConfig.filter)}`);
      }
      if (self.listGrid.apiConfig.sort) {
        // query.push(`sort=${self.listGrid.apiConfig.sort}`);
        reqBody['sort'] = self.listGrid.apiConfig.sort;
      }
      if (self.listGrid.apiConfig.select) {
        let select = self.listGrid.apiConfig.select;
        select = `${select}`;
        select = select.replace(',_metadata.workflow', '');
        // query.push(`select=${select}`);
        reqBody['select'] = select;
      }
      // query.push(`totalRecords=${totalRecords}`);
      reqBody['totalRecords'] = totalRecords;
      reqBody['count'] = -1;
      // url += '?' + query.join('&') + '&count=-1';
      self.commonService.post('api', url, reqBody).subscribe(
        res => {
          self.ts.success(`Exporting ${totalRecords} records, please wait...`);
          self.commonService.notification.fileExport.emit({
            message: 'Export started'
          });
        },
        err => {
          self.commonService.errorToast(err, 'Unable to Export Data');
        }
      );
    } catch (e) {
      console.error(e);
    }
  }

  selectedRecords(records) {
    const self = this;
    if (records.length && self.loadedRecordsCount) {
      self.checkAll = records.length === self.loadedRecordsCount;
    }
    self.selectedRows = records;
  }

  onRightClick(event) {
    const self = this;
    self.selectedRow = event;
    self.showContextMenu = true;
  }
  closeContextMenu() {
    const self = this;
    self.showContextMenu = false;
  }

  getPosition() {
    const self = this;
    let position = {};
    let top = 290;
    if (self.recordChecked > 1) {
      top = 230;
    }

    if (self.selectedRow) {
      position = {
        top: self.selectedRow.event.y - top + 'px',
        left: self.selectedRow.event.x - 230 + 'px'
      };
    }
    return position;
  }
  cloneRecord(recordId) {
    const self = this;
    self.appService.cloneRecordId = recordId;
    self.router.navigate(['/', this.commonService.app._id, 'services', self.appService.serviceId, 'manage']);
  }
  get canEdit() {
    const self = this;
    if (self.selectedRows && self.selectedRows.length > 0 && self.selectedRows[0]._metadata && self.selectedRows[0]._metadata.workflow) {
      return false;
    }
    return true;
  }

  get recordChecked() {
    const self = this;
    return self.selectedRows.length;
  }

  get recordCheckedForDelete() {
    const self = this;
    return self.selectedRows.filter(e2 => !(e2._metadata && e2._metadata.workflow)).length;
  }

  get hasFilters() {
    const self = this;
    if (!self.selectedSavedView && self.listGrid && self.listGrid.filterModel) {
      return true;
    }
    return false;
  }

  get hasSort() {
    const self = this;
    if (!self.selectedSavedView && self.listGrid && self.listGrid.sortModel) {
      return true;
    }
    return false;
  }

  get requiredError() {
    const self = this;
    return self.respondControl.hasError('required') && self.respondControl.touched;
  }

  get apiCallsPending() {
    const self = this;
    return Object.values(self.apiCalls).filter(e => e).length > 0;
  }

  get selectedAppId() {
    return this.commonService.getCurrentAppId();
  }

  get hasWorkflow() {
    if (this.schema) {
      return this.commonService.hasWorkflow(this.schema)
    }
    return false;
  }

  selectSearch(filterValue?) {
    const self = this;
    if (!filterValue) {
      self.filterId = null;
      self.filterCreatedBy = '';
      self.selectedSearch = null;
      this.resetFilter();

    } else {
      self.filterId = filterValue._id;
      self.filterCreatedBy = filterValue.createdBy;
      self.selectedSearch = filterValue;
      self.setLastFilterApplied(filterValue);

      self.searchForm.patchValue({
        name: filterValue.name,
        filter: filterValue.value.filter,
        project: filterValue.value.project,
        sort: filterValue.value.sort,
        count: filterValue.value.count,
        page: filterValue.value.page,
        private: filterValue.private
      });
      self.applySavedView.emit({ value: filterValue });
    }

  }

  clearSearch() {
    const self = this;
    this.resetFilter();
  }

  saveSearchViewModal() {
    const self = this;
    self.createNewFilterRef = self.modalService.open(self.createNewFilter, { centered: true });
    self.createNewFilterRef.result.then(
      close => {
        if (close) {
          self.saveView();
        }
      },
      dismiss => { }
    );

  }

  saveView() {
    const self = this;
    const currentUser = self.sessionService.getUser(true);
    let data = self.searchForm.getRawValue();
    self.filterPayload.name = data['name'];
    self.filterPayload.private = data['private']
    delete data['name'];
    delete data['private'];
    self.filterPayload.value = JSON.stringify(data);
    let request: Observable<any>;
    if (self.filterId && (self.filterCreatedBy === currentUser._id)) {
      request = self.commonService.put('user', `/filter/${self.filterId}`, self.filterPayload);
    } else if ((self.filterId && (self.filterCreatedBy !== currentUser._id)) || (self.filterId === null || self.filterId === '' || self.filterId === undefined)) {
      self.filterId = null;
      request = self.commonService.post('user', '/filter/', self.filterPayload);
    }
    request.subscribe(res => {
      if (self.filterCreatedBy === currentUser._id) {
        self.ts.success('Filter Saved Successfully');
      } else {
        self.ts.success('New Filter created Successfully');
      }
      res.value = JSON.parse(res.value);
      self.filterId = res._id;
      self.filterCreatedBy = res.createdBy;
      self.applySavedView.emit({ value: res });
      if (!self.selectedSearch) {
        self.savedViews.push(res);
      } else {
        const viewIndex = self.savedViews.findIndex(view => view._id == res._id);
        if (viewIndex >= 0) {
          self.savedViews[viewIndex] = res;
        }
      }
      self.selectedSearch = res;
    }, err => self.commonService.errorToast(err));

  }
}

export interface RefineQuery {
  sort?: string;
  select?: string;
  filter?: any;
}

export function validJSON(): ValidatorFn {
  return (control: FormControl) => {
    if (!control.value) {
      return null;
    }

    try {
      if (JSON.parse(control.value)) {
        return null;
      }
    } catch (e) {
      return { validJSON: true };
    }
  }
  return null;
};

export function validSearch(type): ValidatorFn {
  return (control: FormControl) => {
    if (!control.value) {
      return null;
    }

    try {
      let search = JSON.parse(control.value);
      if (search) {
        if (type == 'project' && Object.values(search).filter((val) => (val != 1 && val != 0)).length > 0) {
          return { validSearch: true };
        }
        else if (type == 'sort' && Object.values(search).filter((val) => (val != 1 && val != -1)).length > 0) {
          return { validSearch: true };
        }
        return null
      }
    } catch (e) {
      return { validSearch: true };
    }
  }
  return null;
};