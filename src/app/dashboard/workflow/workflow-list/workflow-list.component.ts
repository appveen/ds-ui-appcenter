import { animate, keyframes, state, style, transition, trigger } from '@angular/animations';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { FormControl } from '@angular/forms';
import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { FormService } from 'src/app/service/form.service';
import { SessionService } from 'src/app/service/session.service';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';
import { WorkflowRespondViewComponent } from 'src/app/utils/workflow-respond-view/workflow-respond-view.component';
import { environment } from 'src/environments/environment';
import { WorkflowService } from '../workflow.service';
import { WorkflowAgGridComponent } from './workflow-ag-grid/workflow-ag-grid.component';
import { WorkflowAgGridService } from './workflow-ag-grid/workflow-ag-grid.service';
import * as _ from 'lodash'
import { WorkflowFilterComponent } from '../workflow-filter/workflow-filter.component';


@Component({
  selector: 'odp-workflow-list',
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.scss'],
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
export class WorkflowListComponent implements OnInit, OnDestroy {
  @ViewChild('listGrid', { static: false }) listGrid: WorkflowAgGridComponent;
  @ViewChild('respondView', { static: false })
  respondView: WorkflowRespondViewComponent;
  @ViewChild('confirmDeleteModal', { static: false })
  confirmDeleteModal: TemplateRef<HTMLElement>;
  @ViewChild('dataContainer', { static: false }) dataContainer: ElementRef;
  @ViewChild('wfFilter') wfFilter: WorkflowFilterComponent;
  confirmDeleteModalRef: NgbModalRef;
  clearFilterModalRef: NgbModalRef;
  // applySavedView: EventEmitter<any>;
  subscriptions: any;
  config: GetOptions;
  srvcId: string;
  showfilterOptions: boolean;
  activeTab = 0;
  loading: any;
  schema: any;
  expandList: Array<any>;
  columnDefs: Array<any>;
  totalRecords;
  newRecordCount: number;
  updatedRecordCount: number;
  deleteRecordCount: number;
  draftRecordCount: number;
  isfilterApplied: boolean;
  // checkAll: boolean;
  respondedByList: Array<any>;
  requestedByList: Array<any>;
  dataColumns: Array<any>;
  allFilters: Array<any>;
  showSearchFilter: boolean;
  showFilterList: boolean;
  placeHoldertext: string;
  allFiltersListed: boolean;
  filterPlaceHolder: Array<any>;
  showWorkflowData: boolean;
  selectAll: EventEmitter<any>;
  loadedRecordsCount: number;
  selectedRows: Array<any>;
  currentTotalCount: number;
  filterConfig: {
    filter: any;
  };
  lastFilterAppliedPrefId: string;
  selectedSavedView: any;
  deleteModal: {
    title: string;
    message: string;
  };
  showRespondPannel: boolean;
  selectedData: any;
  showActnButtons: any;
  hoveredRow: any;
  workflowUploadedFiles: Array<any>;
  workflowFilesList: Array<any>;
  respondControl: FormControl;

  workflowApi: string;
  activeId: string;
  workflowList: Array<any>;
  breadcrumb: Array<any>;
  constructor(
    private commonService: CommonService,
    private appService: AppService,
    private sessionService: SessionService,
    private router: Router,
    private route: ActivatedRoute,
    private formService: FormService,
    public wfService: WorkflowService,
    private ts: ToastrService,
    private modalService: NgbModal,
    private gridService: WorkflowAgGridService,
    private shortcutService: ShortcutService
  ) {
    this.subscriptions = {};
    this.config = {
      page: 1,
      count: 30,
      serviceId: ''
    };
    this.loading = {};
    this.expandList = [];
    this.columnDefs = [];
    this.allFilters = [];
    // this.applySavedView = new EventEmitter();
    this.selectAll = new EventEmitter();
    this.filterConfig = {
      filter: {}
    };
    this.placeHoldertext = 'Saved Views';
    this.deleteModal = {
      title: '',
      message: ''
    };
    this.selectedRows = [];
    this.showActnButtons = {};
    this.workflowUploadedFiles = [];
    this.workflowFilesList = [];

    this.respondControl = new FormControl();
    this.workflowList = [];

  }

  ngOnInit() {

    this.route.data.subscribe(data => {
      if (data.breadcrumb) {
        this.breadcrumb = _.cloneDeep(data.breadcrumb)
      }

    })
    this.subscriptions['routeParams'] = this.route.params.subscribe(params => {
      this.appService.serviceId = params.serviceId;
      this.config.serviceId = params.serviceId;
      this.srvcId = params.serviceId;
      this.showfilterOptions = false;
      this.appService.serviceId = params.serviceId;
      this.config.serviceId = params.serviceId;
      this.lastFilterAppliedPrefId = null;
      this.fetchSchema(params.serviceId);
      this.filterOperation();
      this.appService.workflowFilter = null;
      this.wfService.showFilterIcon = true;
    });


    if (this.appService.workflowTab) {
      this.activeTab = this.appService.workflowTab;
    }

    this.gridService.responded.subscribe(_ => {
      this.getCounts();
      this.appService.refreshCount(this.schema)
    })
    this.appService.workflowTab = this.activeTab;
    this.subscriptions['routeParams'] = this.gridService.respond.subscribe(data => {
      const wfData = data;
      this.selectedData = wfData;
      this.appService.showWorkflowDocument.next({
        data: wfData,
        value: wfData.data
      });
      // this.viewWF(this.selectedRows.filter(e => e._checked)[0]);
      this.showRespondPannel = true;
    });
    // this.setupShortcuts();
    // this.setActiveId(this.router.url);
    // this.router.events.pipe(
    //   filter(e => e instanceof NavigationEnd)
    // ).subscribe((event: NavigationEnd) => {
    //   this.setActiveId(event.url)
    // });
  }

  // setActiveId(url: string) {
  //   const segments = url.split('/');
  //   if (segments.length > 2) {
  //     this.activeId = segments[3];
  //   }
  //   this.getWorkflowItems();
  // }

  // getWorkflowItems() {
  //   this.commonService.getService(this.activeId).then(res => {
  //     this.schema = res;
  //     this.appService.serviceAPI = '/' + this.commonService.app._id + res.api;
  //     this.workflowApi = `/${this.commonService.app._id}${res.api}/utils/workflow`;
  //     this.commonService.get('api', this.workflowApi, { count: 30 }).subscribe(res => {
  //       this.workflowList = res;
  //     }, err => {
  //       console.error(err);
  //       this.commonService.errorToast(err, 'Unable to fetch Workflow Items');
  //     })
  //   }).catch(err => {
  //     console.error(err);
  //     this.commonService.errorToast(err, 'Unable to fetch Data Service');
  //   });
  // }

  // setupShortcuts() {
  //   this.shortcutService.unregisterAllShortcuts(690);

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Next Page',
  //     keys: ['Shift', '>']
  //   });
  //   this.subscriptions['nextPage'] = this.shortcutService.shiftDotKey
  //     .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
  //     .subscribe(() => {
  //       const scrollElement = this.dataContainer?.nativeElement?.querySelector(
  //         'odp-workflow-ag-grid>ag-grid-angular>.ag-root-wrapper>.ag-root-wrapper-body>.ag-root>.ag-body-viewport'
  //       );
  //       if (!!scrollElement) {
  //         scrollElement.scrollTop += scrollElement.clientHeight;
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Previous Page',
  //     keys: ['Shift', '<']
  //   });
  //   this.subscriptions['prevPage'] = this.shortcutService.shiftDotKey
  //     .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
  //     .subscribe(() => {
  //       const scrollElement = this.dataContainer?.nativeElement?.querySelector(
  //         'odp-workflow-ag-grid>ag-grid-angular>.ag-root-wrapper>.ag-root-wrapper-body>.ag-root>.ag-body-viewport'
  //       );
  //       if (!!scrollElement) {
  //         scrollElement.scrollTop -= scrollElement.clientHeight;
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Focus on Next Record',
  //     keys: ['Down']
  //   });
  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Focus on Previous Record',
  //     keys: ['Up']
  //   });
  //   this.subscriptions['focusRecord'] = this.shortcutService.key
  //     .pipe(filter(event => event.key === 'ArrowUp' || event.key === 'ArrowDown'))
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const focusedCell = gridApi?.getFocusedCell();
  //       if (!focusedCell) {
  //         gridApi?.setFocusedCell(0, 'workflowId');
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Select Focused Record',
  //     keys: ['S']
  //   });
  //   this.subscriptions['selectRecord'] = this.shortcutService.key
  //     .pipe(
  //       filter(
  //         event =>
  //           document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'S'
  //       )
  //     )
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const focusedCell = gridApi?.getFocusedCell();
  //       if (!!focusedCell) {
  //         const node = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //         if (!!node && !!node.data && node.data.status === 'Pending' && this.canRespond(node.data)) {
  //           node.setSelected(true);
  //         }
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Unselect Focused Record',
  //     keys: ['U']
  //   });
  //   this.subscriptions['unselectRecord'] = this.shortcutService.key
  //     .pipe(
  //       filter(
  //         event =>
  //           document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'U'
  //       )
  //     )
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const focusedCell = gridApi?.getFocusedCell();
  //       if (!!focusedCell) {
  //         const node = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //         node.setSelected(false);
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Select Next Record',
  //     keys: ['K']
  //   });
  //   this.subscriptions['selectNextRecord'] = this.shortcutService.key
  //     .pipe(
  //       filter(
  //         event =>
  //           document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'K'
  //       )
  //     )
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const focusedCell = gridApi?.getFocusedCell();
  //       const nextRowIndex = !!focusedCell ? focusedCell.rowIndex + 1 : 0;
  //       if (nextRowIndex <= gridApi?.getLastDisplayedRow()) {
  //         const nextNode = gridApi?.getDisplayedRowAtIndex(nextRowIndex);
  //         gridApi?.setFocusedCell(nextRowIndex, '_id');
  //         if (!!nextNode && !!nextNode.data && nextNode.data.status === 'Pending' && this.canRespond(nextNode.data)) {
  //           nextNode.setSelected(true);
  //         }
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Select Previous Record',
  //     keys: ['J']
  //   });
  //   this.subscriptions['selectPrevRecord'] = this.shortcutService.key
  //     .pipe(
  //       filter(
  //         event =>
  //           document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'J'
  //       )
  //     )
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const focusedCell = gridApi?.getFocusedCell();
  //       const prevRowIndex = !!focusedCell ? focusedCell.rowIndex - 1 : 0;
  //       if (prevRowIndex >= 0) {
  //         const prevNode = gridApi?.getDisplayedRowAtIndex(prevRowIndex);
  //         gridApi?.setFocusedCell(prevRowIndex, '_id');
  //         if (!!prevNode && !!prevNode.data && prevNode.data.status === 'Pending' && this.canRespond(prevNode.data)) {
  //           prevNode?.setSelected(true);
  //         }
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Select All Records',
  //     keys: ['Ctrl', 'A']
  //   });
  //   this.subscriptions['selectAll'] = this.shortcutService.ctrlAKey.subscribe(() => {
  //     const gridApi = this.listGrid?.agGrid?.api;
  //     gridApi?.forEachNode(node => {
  //       if (!!node.data && node.data.status === 'Pending' && this.canRespond(node.data)) {
  //         node.setSelected(true);
  //       }
  //     });
  //   });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Unselect All Records',
  //     keys: ['Esc']
  //   });
  //   this.subscriptions['selectNone'] = this.shortcutService.key
  //     .pipe(filter(event => event.key.toUpperCase() === 'ESCAPE'))
  //     .subscribe(() => {
  //       if (this.showFilterList) {
  //         this.showFilterList = false;
  //       } else if (this.showfilterOptions && this.wfService.showFilterIcon) {
  //         this.toggleFilterOptions();
  //       } else if (this.showRespondPannel) {
  //         this.respondView.expandWflist();
  //       } else {
  //         const gridApi = this.listGrid?.agGrid?.api;
  //         gridApi?.forEachNode(node => node.setSelected(false));
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'View Focused Record',
  //     keys: ['Enter']
  //   });
  //   this.shortcutService.registerShortcut({
  //     section: 'Table',
  //     label: 'Close Record',
  //     keys: ['Esc']
  //   });
  //   this.subscriptions['openRecord'] = this.shortcutService.key.pipe(filter(event => event.key.toUpperCase() === 'ENTER')).subscribe(() => {
  //     const gridApi = this.listGrid?.agGrid?.api;
  //     const focusedCell = gridApi?.getFocusedCell();
  //     if (!!focusedCell) {
  //       const row = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //       this.listGrid?.rowDoubleClicked(row);
  //     }
  //   });

  //   this.shortcutService.registerShortcut({
  //     section: 'Filters',
  //     label: 'Show Advanced Filters',
  //     keys: ['Shift', 'F']
  //   });
  //   this.shortcutService.registerShortcut({
  //     section: 'Filters',
  //     label: 'Hide Advanced Filters',
  //     keys: ['Esc']
  //   });
  //   this.subscriptions['openFilter'] = this.shortcutService.shiftFKey
  //     .pipe(
  //       filter(
  //         () => this.wfService.showFilterIcon && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'
  //       )
  //     )
  //     .subscribe(() => {
  //       this.toggleFilterOptions();
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Filters',
  //     label: 'Show Saved Views',
  //     keys: ['Alt', 'Shift', 'F']
  //   });
  //   this.shortcutService.registerShortcut({
  //     section: 'Filters',
  //     label: 'Hide Saved Views',
  //     keys: ['Esc']
  //   });
  //   this.subscriptions['openSavedView'] = this.shortcutService.altShiftFKey.subscribe(() => {
  //     this.showFilterList = true;
  //   });

  //   this.shortcutService.registerShortcut({
  //     section: 'Filters',
  //     label: 'Clear/Reset Filters',
  //     keys: ['Shift', 'X']
  //   });
  //   this.subscriptions['resetFilter'] = this.shortcutService.shiftXKey
  //     .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
  //     .subscribe(() => {
  //       if (this.hasFilters) {
  //         this.clearFilters();
  //       } else if (this.selectedSavedView) {
  //         this.resetFilter();
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Workflow',
  //     label: 'Open Respond Box',
  //     keys: ['R']
  //   });
  //   this.shortcutService.registerShortcut({
  //     section: 'Workflow',
  //     label: 'Close Respond Box',
  //     keys: ['Esc']
  //   });
  //   this.subscriptions['respond'] = this.shortcutService.key
  //     .pipe(
  //       filter(event => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key === 'r')
  //     )
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const selectedNodes = gridApi?.getSelectedNodes();
  //       if (selectedNodes?.length > 0) {
  //         this.respondToMultipleWorkflow();
  //       } else {
  //         const focusedCell = gridApi?.getFocusedCell();
  //         if (!!focusedCell) {
  //           const row = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //           if (row.data.status === 'Pending' && this.canRespond(row.data)) {
  //             this.gridService.respond.emit(row.data);
  //           }
  //         }
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Workflow',
  //     label: 'Instant Approve',
  //     keys: ['Shift', 'A']
  //   });
  //   this.subscriptions['approve'] = this.shortcutService.shiftAKey
  //     .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const selectedNodes = gridApi?.getSelectedNodes();
  //       if (selectedNodes?.length > 0) {
  //         this.respondToMultipleWorkflow();
  //         setTimeout(() => {
  //           this.respondView.createControl('approve');
  //         });
  //       } else {
  //         const focusedCell = gridApi?.getFocusedCell();
  //         if (!!focusedCell && !this.showRespondPannel) {
  //           const row = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //           if (row.data.status === 'Pending' && this.canRespond(row.data)) {
  //             this.gridService.respond.emit(row.data);
  //             setTimeout(() => {
  //               this.respondView.createControl('approve');
  //             });
  //           }
  //         }
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Workflow',
  //     label: 'Instant Reject',
  //     keys: ['Shift', 'R']
  //   });
  //   this.subscriptions['reject'] = this.shortcutService.shiftRKey
  //     .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const selectedNodes = gridApi?.getSelectedNodes();
  //       if (selectedNodes?.length > 0) {
  //         this.respondToMultipleWorkflow();
  //         setTimeout(() => {
  //           this.respondView.createControl('reject');
  //         });
  //       } else {
  //         const focusedCell = gridApi?.getFocusedCell();
  //         if (!!focusedCell && !this.showRespondPannel) {
  //           const row = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //           if (row.data.status === 'Pending' && this.canRespond(row.data)) {
  //             this.gridService.respond.emit(row.data);
  //             setTimeout(() => {
  //               this.respondView.createControl('reject');
  //             });
  //           }
  //         }
  //       }
  //     });

  //   this.shortcutService.registerShortcut({
  //     section: 'Workflow',
  //     label: 'Instant Rework',
  //     keys: ['Shift', 'W']
  //   });
  //   this.subscriptions['rework'] = this.shortcutService.shiftWKey
  //     .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
  //     .subscribe(() => {
  //       const gridApi = this.listGrid?.agGrid?.api;
  //       const selectedNodes = gridApi?.getSelectedNodes();
  //       if (selectedNodes?.length > 0) {
  //         this.respondToMultipleWorkflow();
  //         setTimeout(() => {
  //           this.respondView.createControl('rework');
  //         });
  //       } else {
  //         const focusedCell = gridApi?.getFocusedCell();
  //         if (!!focusedCell && !this.showRespondPannel) {
  //           const row = gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex);
  //           if (row.data.status === 'Pending' && this.canRespond(row.data)) {
  //             this.gridService.respond.emit(row.data);
  //             setTimeout(() => {
  //               this.respondView.createControl('rework');
  //             });
  //           }
  //         }
  //       }
  //     });
  // }

  fetchSchema(serviceId: string) {
    if (this.subscriptions['getSchema_' + serviceId]) {
      this.subscriptions['getSchema_' + serviceId].unsubscribe();
      this.subscriptions['getSchema_' + serviceId] = null;
    }
    this.loading.serviceDetails = true;
    this.subscriptions['getSchema_' + serviceId] = this.commonService.get('sm', `/${this.commonService.app._id}/service/` + serviceId, { filter: { app: this.commonService.app._id } }).subscribe(
      res => {
        this.schema = res;
        if (this.breadcrumb) {
          this.breadcrumb.push(res.name)
          this.commonService.breadcrumbPush(this.breadcrumb)
        }
        this.appService.serviceAPI = '/' + this.commonService.app._id + res.api;
        this.workflowApi = `/${this.commonService.app._id}${res.api}/utils/workflow`;
        const parsedDef = this.schema.definition;
        this.wfService.serviceColumns = this.schema.definition;
        // this.recordIdName = parsedDef[0].properties.name;
        this.formService.patchType(parsedDef);
        this.formService.fixReadonly(parsedDef);
        this.getExpandList(parsedDef);
        // parsedDef._id = {
        //   type: 'String',
        //   properties: parsedDef._id.properties
        // };
        this.schema.definition = JSON.parse(JSON.stringify(parsedDef));
        this.config.filter = {
          serviceId,
        };
        this.config.page = 1;
        this.createColumnDefs();
        this.getTotalRecords();
        this.getCounts();
        this.getReqAndResUsers(serviceId);
        this.loading.serviceDetails = false;
        this.appService.navigateToWorkflow.emit(this.config.serviceId);
      },
      err => {
        this.loading.serviceDetails = false;
        this.commonService.errorToast(err, 'Unable to get the service details, please try again later');
      }
    );
  }
  createColumnDefs() {
    this.columnDefs = [
      {
        show: true,
        key: '_checkbox',
        dataKey: '_checkbox',
        type: 'Checkbox',
        width: 48,
        definition: [],
        properties: {
          name: '#'
        },
        dataType: 'Checkbox',
        checkbox: true
      },
      {
        show: true,
        key: '_id',
        dataKey: 'workflowId',
        type: 'workflowId',
        width: 145,
        properties: {
          name: 'Workflow Id'
        },
        dataType: 'text'
      },

      {
        show: true,
        key: 'requestedBy',
        dataKey: 'requestedBy',
        type: 'req',
        width: 170,
        properties: {
          name: 'Requested By'
        },
        dataType: 'select'
      },
      {
        show: true,
        key: 'respondedBy',
        dataKey: 'respondedBy',
        type: 'res',
        width: 170,
        properties: {
          name: 'Responded By'
        },
        dataType: 'select'
      },
      {
        show: true,
        key: '_metadata.createdAt',
        dataKey: '_metadata.createdAt',
        type: 'date',
        properties: {
          name: 'Requested on'
        },
        dataType: 'date'
      },
      {
        show: true,
        key: 'status',
        dataKey: 'status',
        type: 'status',
        properties: {
          name: 'Status'
        },
        dataType: 'select'
      },
      {
        show: true,
        key: 'checkerStep',
        dataKey: 'checkerStep',
        type: 'checkerStep',
        properties: {
          name: 'Checker Step'
        },
        dataType: 'select'
      },
      {
        show: true,
        key: 'action',
        dataKey: 'action',
        type: 'action',
        properties: {
          name: 'Action'
        },
        dataType: 'action'
      }
    ];
    this.dataColumns = this.parseDefinition(this.schema.definition);
    let prefix = 'data.new.';
    if (this.appService.workflowTab === 1 || this.appService.workflowTab === 2) {
      prefix = 'data.old.';
    }
    this.dataColumns.forEach(e => (e.dataKey = prefix + e.dataKey));
    this.columnDefs = this.columnDefs.concat(this.dataColumns);
  }
  parseDefinition(def, parentKey?: string, parentName?: string): Definition[] {
    let tempArr: Definition[] = [];
    def.forEach(defObj => {
      const temp: Definition = {};
      temp.show = true;
      if (defObj.key === '_id') {
        temp.key = 'documentId';
        temp.dataKey = 'documentId';
        temp.type = 'docId';
        temp.properties = { name: defObj.properties.name };
        temp.properties.type = defObj.type;
        temp.definition = [];
        temp.dataType = 'text';
        tempArr.unshift(temp);
      } else {
        if (defObj.type === 'Object') {
          const tempName = parentName ? parentName + '.' + defObj.properties.name : defObj.properties.name;
          const tempKey = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          tempArr = tempArr.concat(this.parseDefinition(defObj.definition, tempKey, tempName));
        } else {
          temp.key = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          temp.dataKey = parentKey ? parentKey + '.' + defObj.key : defObj.key;
          temp.type = defObj.type;
          temp.properties = defObj.properties;
          temp.properties.name = parentName ? parentName + '.' + temp.properties.name : temp.properties.name;
          temp.properties.type = defObj.type;
          temp.definition = defObj.definition ? this.parseDefinition(defObj.definition, temp.key, defObj.properties.name) : [];
          temp.dataType = 'others';
          tempArr.push(temp);
        }
      }
    });
    return tempArr;
  }

  getExpandList(parsedDef, parent?) {
    if (parsedDef) {
      parsedDef.forEach(def => {
        if (def.type && (def.type === 'Relation' || def.type === 'User')) {
          if (def.properties.relatedViewFields.length) {
            def.properties.relatedViewFields.forEach(ele => {
              if (parent) {
                this.expandList.push(parent + '.' + def.properties.dataKey + '.' + ele.key);
              } else {
                this.expandList.push(def.properties.dataKey + '.' + ele.key);
              }
            });
          }
          if (def.properties.relatedSearchField !== '_id') {
            if (parent) {
              this.expandList.push(parent + '.' + def.properties.dataKey + '.' + def.properties.relatedSearchField);
            } else {
              this.expandList.push(def.properties.dataKey + '.' + def.properties.relatedSearchField);
            }
          }
        } else if (def.type && def.type === 'Array') {
          let par = def.key;
          if (parent) {
            par = def.key + parent;
          }
          const selfObj = def.definition[0] || {};
          if (selfObj.type === 'Relation' || def.type === 'User') {
            selfObj.properties.relatedViewFields.forEach(ele => {
              this.expandList.push(def.properties.dataKey + '.' + ele.key);
            });
            if (selfObj.properties.relatedSearchField !== '_id') {
              this.expandList.push(def.properties.dataKey + '.' + selfObj.properties.relatedSearchField);
            }
          } else if (selfObj.type === 'Object') {
            this.getExpandList(selfObj.definition, par);
          }
        } else if (def.type && def.type === 'Object') {
          this.getExpandList(def.definition, def.key);
        }
      });
    }
  }

  resetFilter() {
    if (this.listGrid) {
      this.listGrid.clearSavedView();
    }
    this.placeHoldertext = 'Saved Views';
    // this.savedViews = [];
    // this.advanceFilter = false;
    this.selectedSavedView = null;
    this.appService.workflowFilter = null;
    if (this.lastFilterAppliedPrefId) {
      this.deleteLastFilterApplied();
    }
    this.listGrid.toggleClear();
    this.clearFilters();
    this.listGrid.apiConfig['filter'] = null
    this.listGrid.apiConfig['columns'] = null
    this.listGrid.apiConfig['select'] = ''
    this.wfFilter.clearFilter(true)
    this.listGrid.gridApi.refreshInfiniteCache()
    // this.filterSavedViews();
  }

  selectOperation(activateTab) {
    this.activeTab = activateTab;
    this.appService.workflowTab = activateTab;
    this.appService.workflowTabChange.emit(activateTab);
    // this.createColumnDefs();
    this.getTotalRecords();
  }

  getCounts() {
    this.getNewRecordsCount();
    this.getUpdatedRecordsCount();
    this.getDeleteRecordsCount();
    this.getDraftRecordsCount();
  }
  getTotalRecords() {
    this.loading.serviceDetails = true;
    this.totalRecords = 0;
    const filter = {
      serviceId: this.srvcId,
    };
    this.subscriptions['getTotalRecords'] = this.commonService
      .get('api', this.workflowApi + '/count', { filter, serviceId: this.srvcId })
      .subscribe(count => {
        this.loading.serviceDetails = false;
        this.totalRecords = count;
        this.getLastFilterApplied();
      });
  }
  getNewRecordsCount() {
    const filter = {
      serviceId: this.srvcId,
      operation: 'POST',
      status: 'Pending'
    };
    this.subscriptions['getNewRecordsCount'] = this.commonService
      .get('api', this.workflowApi + '/count', { filter, serviceId: this.srvcId })
      .subscribe(count => {
        this.newRecordCount = count;
      });
  }
  getUpdatedRecordsCount() {
    const filter = {
      serviceId: this.srvcId,
      operation: 'PUT',
      status: 'Pending'
    };
    this.subscriptions['getUpdatedRecordsCount'] = this.commonService
      .get('api', this.workflowApi + '/count', { filter, serviceId: this.srvcId })
      .subscribe(count => {
        this.updatedRecordCount = count;
      });
  }
  getDeleteRecordsCount() {
    const filter = {
      serviceId: this.srvcId,
      operation: 'DELETE',
      status: 'Pending'
    };
    this.subscriptions['getDeleteRecordsCount'] = this.commonService
      .get('api', this.workflowApi + '/count', { filter, serviceId: this.srvcId })
      .subscribe(count => {
        this.deleteRecordCount = count;
      });
  }
  getDraftRecordsCount() {
    const filter = {
      serviceId: this.srvcId,
      status: 'Draft'
    };
    this.subscriptions['getDraftRecordsCount'] = this.commonService
      .get('api', this.workflowApi + '/count', { filter, serviceId: this.srvcId })
      .subscribe(count => {
        this.draftRecordCount = count;
      });
  }
  toggleFilterOptions() {
    this.showfilterOptions = !this.showfilterOptions;
    this.wfService.showActionItems = !this.showfilterOptions;
  }
  get customFilterApplied() {
    let customFilterApplied = true;

    if (!this.appService.workflowFilter || JSON.stringify(this.appService.workflowFilter) === JSON.stringify({ filter: {} })) {
      customFilterApplied = false;
    }
    return customFilterApplied;
  }

  selectSavedView(evnt) {
    const view = evnt.view || evnt;
    if (!environment.production) {
      console.log('selectSavedView', view);
    }
    if (view._id) {
      this.setLastFilterApplied(view);
      this.selectedSavedView = view;
      this.listGrid.applySavedView(view);
      this.wfFilter.selectFilter(view);
      this.appService.workflowFilter = view;
    } else {
      this.selectedSavedView = { value: view };
      this.listGrid.applySavedView({ value: view });
      this.appService.workflowFilter = { value: view };
      this.wfFilter.selectFilter({ value: view });
    }


    const cols = view.columns || view.value?.columns
    if (cols && cols.length > 0) {
      this.listGrid.toggleColumns(view, this.dataColumns)
    }
    else {
      this.listGrid.toggleClear()
    }
    this.listGrid.agGrid.api.refreshCells({ force: true })

    if (evnt.close) {
      this.showfilterOptions = false;
    }
  }

  view(event) {
    if (event) {
      this.gridService.respond.emit(event);
      this.router.navigate(['/', this.commonService.app._id, 'workflow', this.appService.serviceId, event._id]);
    } else {
      return;
    }
  }
  filterAllFilter(type) {
    if (type === 'public') {
      this.allFilters = this.filterPlaceHolder.filter(e => !e.private);
      this.allFiltersListed = true;
    } else if (type === 'private') {
      this.allFilters = this.filterPlaceHolder.filter(e => e.createdBy === this.sessionService.getUser(true)._id && e.private);
      this.allFiltersListed = false;
    }
  }

  selectedRecords(records) {
    this.selectedRows = records;
  }
  filterOperation(data?) {
    if (data) {
      this.filterConfig.filter = {
        serviceId: data._id,
      };
    } else {
      this.filterConfig.filter = {
        serviceId: this.appService.serviceId,
      };
    }
    this.filterConfig.filter.type = 'workflow';
    this.getAllFilters();
  }
  getAllFilters() {
    this.commonService.get('user', '/data/filter/', this.filterConfig).subscribe(_filter => {
      this.allFilters = _filter;
      this.allFilters.forEach(e => {
        e['showOptions'] = false;
        e['hasOptions'] = e.createdBy === this.commonService.userDetails._id;
        this.getUsrName(e.createdBy, e);
      });
      this.filterPlaceHolder = this.allFilters;
      this.allFilters = this.allFilters = this.filterPlaceHolder.filter(
        e => e.createdBy === this.sessionService.getUser(true)._id && e.private
      );
    });
  }
  getUsrName(userId, filter) {
    this.commonService
      .getUser(userId)
      .then(user => {
        filter['user'] = user.basicDetails.name;
      })
      .catch(err => {
        if (!environment.production) {
          console.error(err);
        }
        // this.commonService.errorToast(err, 'Unable to fetch User with ID: ' + userId);
      });
  }
  setLastFilterApplied(data: any) {
    let response;
    const payload = {
      userId: this.commonService.userDetails._id,
      type: 'workflow-last-filter',
      key: this.schema._id,
      value: JSON.stringify(data)
    };
    if (this.lastFilterAppliedPrefId) {
      response = this.commonService.put('user', '/data/preferences/' + this.lastFilterAppliedPrefId, payload);
    } else {
      response = this.commonService.post('user', '/data/preferences', payload);
    }
    response.subscribe(
      prefRes => {
        this.lastFilterAppliedPrefId = prefRes._id;
      },
      prefErr => {
        this.commonService.errorToast(prefErr, 'Unable to save preference');
      }
    );
  }

  deleteLastFilterApplied() {
    if (this.lastFilterAppliedPrefId) {
      this.commonService.delete('user', '/data/preferences/' + this.lastFilterAppliedPrefId).subscribe(
        prefRes => {
          this.lastFilterAppliedPrefId = null;
        },
        prefErr => {
          this.commonService.errorToast(prefErr, 'Unable to update preference');
        }
      );
    }
  }

  getLastFilterApplied() {
    const options: GetOptions = {
      filter: {
        userId: this.commonService.userDetails._id,
        type: 'workflow-last-filter',
        key: this.schema._id
      }
    };
    this.commonService.get('user', '/data/preferences', options).subscribe(
      prefRes => {
        try {
          if (prefRes && prefRes.length > 0) {
            this.lastFilterAppliedPrefId = prefRes[0]._id;
            if (typeof prefRes[0].value === 'string') {
              prefRes[0].value = JSON.parse(prefRes[0].value);
            }
            const view = prefRes[0].value;
            this.appService.workflowFilter = view;
            this.selectedSavedView = view;
            this.listGrid.applySavedView(view);
          } else if (!!this.appService.workflowFilter) {
            this.selectedSavedView = this.appService.workflowFilter;
            this.listGrid.applySavedView(this.appService.workflowFilter);
          } else {
            this.selectedSavedView = null;
          }
        } catch (e) {
          console.error(e);
        }
      },
      prefErr => {
        this.commonService.errorToast(prefErr, 'Unable to save preference');
      }
    );
  }
  deleteFilter(filter) {
    const currentUser = this.sessionService.getUser(true);
    if (!filter.private && (currentUser.isSuperAdmin || currentUser._id === filter.createdBy)) {
      this.filterDeleteApiCall(filter);
      this.resetFilter();
    } else if (filter.private && currentUser._id === filter.createdBy) {
      this.filterDeleteApiCall(filter);
      this.resetFilter();
    } else {
      this.ts.warning('Either this is a Private filter or You don\'t have enough permission');
    }
  }
  filterDeleteApiCall(filter) {
    this.deleteModal.title = 'Delete Filter';
    this.deleteModal.message = `Are you sure you want to delete filter ${filter.name}?`;
    this.confirmDeleteModalRef = this.modalService.open(this.confirmDeleteModal, { centered: true });
    this.confirmDeleteModalRef.result.then(
      close => {
        if (close) {
          this.subscriptions['deleteFilter'] = this.commonService.delete('user', `/data/filter/${filter._id}`).subscribe(
            res => {
              this.ts.success('Filter Deleted.');
              // this.savedViews = [];
              this.getAllFilters();
            },
            err => {
              this.commonService.errorToast(err, 'Unable to delete, please try again later');
            }
          );
        }
      },
      dismiss => { }
    );
  }
  editFilter(filter) {
    this.showfilterOptions = true;
    this.showFilterList = false;
    this.appService.workflowFilter = filter;
    this.wfFilter.selectFilter(filter)
    this.wfFilter.showFilter()
  }
  changeFilterType(filter, type) {
    if (filter.private && type === 'private') {
      return;
    } else if (!filter.private && type === 'public') {
      return;
    } else {
      const currentUser = this.sessionService.getUser(true);
      if (!filter.private && (currentUser.isSuperAdmin || currentUser._id === filter.createdBy)) {
        filter.private = type === 'private';
        this.subscriptions['filterType'] = this.commonService.put('user', `/data/filter/${filter._id}`, filter).subscribe(() => {
          this.ts.success('Filter type Updated');
          this.showFilterList = false;
          this.getAllFilters();
        });
      } else if (filter.private && currentUser._id === filter.createdBy) {
        filter.private = type === 'private';
        this.subscriptions['filterType'] = this.commonService.put('user', `/data/filter/${filter._id}`, filter).subscribe(() => {
          this.ts.success('Filter type Updated');
          this.showFilterList = false;
          this.getAllFilters();
        });
      } else {
        this.ts.warning('You don\'t have enough permission');
      }
    }
  }
  get allCheckedRecords() {
    let rowData = [];
    if (this.listGrid) {
      this.listGrid?.agGrid?.api?.forEachNode(node => rowData.push(node.data));
    }
    return rowData.filter(e => e && e._checked).length;
    // return this.selectedRows.filter(e => e._checked).length;
  }

  get allCheckedRecordIds() {
    return this.selectedRows.filter(e => e && e._checked).map(x => x._id);
  }
  get pendingRecords() {
    let rowData = [];
    if (this.listGrid) {
      this.listGrid?.agGrid?.api?.forEachNode(node => rowData.push(node.data));
    }
    return rowData.filter(e => e && e.status === 'Pending' && this.canRespond(e)).length;
  }
  get checkAll() {
    let rowData = [];
    if (this.listGrid) {
      this.listGrid?.agGrid?.api?.forEachNode(node => rowData.push(node.data));

      if (rowData.length > 0) {
        return rowData.filter(e => e && e.status === 'Pending' && this.canRespond(e)).every(e => e._checked);
      }
    }
    return false;
  }

  set checkAll(val) {
    if (this.listGrid) {
      this.listGrid?.agGrid?.api?.forEachNode(node => {
        if (!!node.data && node.data.status === 'Pending' && this.canRespond(node.data)) {
          node.setSelected(val);
        }
      });
    }
  }

  respondToWorkflow(index, data) {
    const wfData = this.selectedRows[index];
    this.selectedData = wfData;
    this.appService.showWorkflowDocument.next({
      data: wfData,
      value: wfData.data
    });
    this.selectedRows[index]._checked = true;
    // this.viewWF(this.selectedRows.filter(e => e._checked)[0]);
    this.showRespondPannel = true;
  }

  canRespond(selectedData) {
    let audit;
    if (selectedData && selectedData.audit) {
      audit = selectedData.audit[selectedData.audit.length - 1];
    }
    if (selectedData && selectedData.requestedBy == this.commonService.userDetails._id) {
      return false;
    }
    if (audit && audit.id == this.commonService.userDetails._id) {
      return false;
    }
    if (selectedData && selectedData.status !== 'Pending') {
      return false;
    }
    if (!this.commonService.canRespondToWF(this.schema, selectedData.checkerStep)) {
      return false;
    }
    return true;
  }
  respondToMultipleWorkflow() {
    let rowData = [];
    if (this.listGrid) {
      this.listGrid.agGrid.api.forEachNode(node => rowData.push(node.data));
    }
    const wfData = rowData.find(e => !!e._checked);
    const selectedRecords = rowData.filter(e => !!e._checked);
    this.selectedData = wfData;
    this.appService.showWorkflowDocument.next({
      data: wfData,
      value: wfData.data,
      multi: true,
      selectedRecords
    });
    this.showRespondPannel = true;
  }

  onAction(event) {
    this.showRespondPannel = !this.showRespondPannel;
    this.respondControl.patchValue(event.respondControl);
    if (event && event.refereshRequired) {
      this.getTotalRecords();
    }
    this.wfService.showActionItems = true;
    this.getCounts();
  }

  addUserDetails(user: any) {
    this.commonService
      .getUser(user._id)
      .then(res => {
        user.name = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
      })
      .catch(err => {
        user.name = 'ERROR';
      });
  }

  getReqAndResUsers(serviceId) {
    const options = {
      filter: {
        serviceId
      },
      serviceId
    };
    this.subscriptions['getReqAndResUsers'] = this.commonService
      .get('api', this.workflowApi + '/users', options).subscribe(res => {
        this.requestedByList = res.requestedBy;
        this.respondedByList = res.respondedBy;
        this.gridService.requestedByList = this.requestedByList;
        this.gridService.respondedByList = this.respondedByList;
      });
  }
  ngOnDestroy() {
    this.appService.workflowFilter = null;
    Object.keys(this.subscriptions).forEach(key => {
      this.subscriptions[key].unsubscribe();
    });
  }
  clearFilters() {
    if (this.listGrid) {
      this.listGrid.clearFilter();
    }
  }
  removedSavedView(event) {
    this.selectedSavedView = null;
    this.appService.existingFilter = null;
  }

  get hasFilters() {
    if (this.listGrid && !_.isEmpty(this.listGrid.filterModel)) {
      return true;
    }
    return false;
  }

  get hasWorkflow() {
    if (this.schema) {
      return this.commonService.hasWorkflow(this.schema)
    }
    return false;
  }
}
