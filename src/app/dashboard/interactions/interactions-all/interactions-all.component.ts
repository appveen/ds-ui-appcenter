import { Component, OnInit, OnDestroy, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AgGridColumn, AgGridAngular } from 'ag-grid-angular';
import { IDatasource, IGetRowsParams, RowDoubleClickedEvent } from 'ag-grid-community';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { distinctUntilChanged, debounceTime, filter, take } from 'rxjs/operators';
import * as _ from 'lodash';
import { Location } from "@angular/common";

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { InteractionsService } from '../interactions.service';
import { InteractionGridCellComponent } from './interaction-grid-cell/interaction-grid-cell.component';
import { environment } from 'src/environments/environment';
import { InteractionGridFilterComponent } from './interaction-grid-filter/interaction-grid-filter.component';
import { PreferenceService } from 'src/app/preference.service';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';

@Component({
  selector: 'odp-interactions-all',
  templateUrl: './interactions-all.component.html',
  styleUrls: ['./interactions-all.component.scss']
})
export class InteractionsAllComponent implements OnInit, OnDestroy {

  @ViewChild('agGrid') agGrid: AgGridAngular;
  @ViewChild('reDownloadModal') reDownloadModal: TemplateRef<HTMLElement>;
  @ViewChild('dataContainer', { static: false }) dataContainer: ElementRef;
  columnDefs: Array<AgGridColumn>;
  dataSource: IDatasource;
  totalCountPromise: Promise<any>;
  totalCount: number;
  loadedCount: number;
  filteredCount: number;
  apiConfig: GetOptions;
  gridStatePrefId: string;
  gridFilterPrefId: string;
  sortModel: any;
  filterModel: any;
  subscriptions: any;
  columns: Array<any>;
  selectedData: Array<any>;
  advanceFilterQuery: any;
  advanceFilterData: any;
  advanceFilterToggle: boolean;
  reDownloadModalRef: NgbModalRef;
  subject: Subject<any>;
  showColumns: boolean;
  gridState: any;
  noRowsTemplate;
  hasFilterFromUrl = false;

  constructor(private commonService: CommonService,
    private appService: AppService,
    private flowService: InteractionsService,
    private router: Router,
    private modalService: NgbModal,
    private ts: ToastrService,
    private perferenceService: PreferenceService,
    private location: Location,
    private activatedRoute: ActivatedRoute,
    private shortcutService: ShortcutService) {
    const self = this;
    self.loadedCount = 0;
    self.totalCount = 0;
    self.filteredCount = 0;
    self.apiConfig = {};
    self.apiConfig.count = 30;
    self.apiConfig.page = 1;
    self.apiConfig.select = self.flowService.getInteractionSelect();
    self.subscriptions = {};
    self.selectedData = [];
    self.subject = new Subject();
    self.subject.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe((columnState) => {
      self.setGridState(columnState);
    });
    self.noRowsTemplate = '<span>No records to display</span>';
  }
  ngOnInit() {
    this.subscriptions['routerEvents'] = this.router.events
      .pipe(
        filter(ev => ev instanceof NavigationStart)
      )
      .subscribe((ev: NavigationStart) => {
        this.flowService.setWithinInteractions(!!ev.url && ev.url.includes('interactions'));
      });
    const self = this;
    self.appService.appChange.subscribe(() => {
      self.columnDefs = null;
      setTimeout(() => {
        self.createColumnDefs();
      }, 500);
    });
    self.columns = self.flowService.getInteractionColumns();
    self.totalCountPromise = self.getInteractionCount();
    self.flowService.applyingFilter.subscribe(type => {
      if (type === 'advance') {
        // self.clearInlineFilters();
        self.apiConfig.filter = null;
        self.filterModel = null;
        self.appService.clearFilterEvent.emit(true);
      } else if (type === 'inline') {
        // self.resetAdvanceFilters();
        self.advanceFilterQuery = null;
        self.apiConfig.filter = null;
      }
      self.setLastFilter();
    });
    self.totalCountPromise.then(count => {
      self.totalCount = count;
    }).catch(err => {
      if (err.status === 403) {
        self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
          state: {
            noRedirect: true,
            serviceId: null
          }
        });
      }
      if (!environment.production) {
        console.error(err);
      }
    });
    self.createColumnDefs();
    this.activatedRoute.queryParams.pipe(take(1)).subscribe(
      queryParams => {
        if (!!queryParams) {
          if (!!queryParams.filter || !!queryParams.sort || !!queryParams.hide) {
            this.hasFilterFromUrl = true;
          }
          if (!!queryParams.filter) {
            this.apiConfig.filter = JSON.parse(queryParams.filter);
          }
          if (!!queryParams.sort) {
            this.apiConfig.sort = JSON.parse(queryParams.sort);
          }
          setTimeout(() => {
            if (!!queryParams.sort) {
              const sortModel = [];
              const sortStr = JSON.parse(queryParams.sort)
              sortStr.split(',').forEach(item => {
                let colId = item;
                let sort = 'asc';
                if (item.includes('-')) {
                  colId = colId.substr(1, colId.length);
                  sort = 'desc';
                }
                sortModel.push({ colId, sort });
              });
              this.agGrid.api.setSortModel(sortModel);
            }
            if (!!queryParams.hide) {
              const hide: Array<string> = JSON.parse(queryParams.hide);
              this.agGrid.columnApi.setColumnsVisible(hide, false);
            }
          }, 1000);
        }
        self.getPrefrences();
        self.dataSource = {
          getRows: async (params: IGetRowsParams) => {
            try {
              self.agGrid.api.showLoadingOverlay();
              const count = await self.getInteractionCount();
              self.filteredCount = count;
              if (count > 0) {
                self.apiConfig.page = Math.ceil(params.endRow / 30);
                if (self.apiConfig.page === 1) {
                  self.loadedCount = 0;
                }
                if (self.subscriptions['getRecords_' + self.apiConfig.page]) {
                  self.subscriptions['getRecords_' + self.apiConfig.page].unsubscribe();
                }
                self.subscriptions['getRecords_' + self.apiConfig.page] = self.getInteraction().subscribe(docs => {
                  self.loadedCount += docs.length;
                  self.agGrid.api.hideOverlay();
                  if (self.loadedCount < self.filteredCount) {
                    params.successCallback(docs);
                  } else {
                    params.successCallback(docs, self.filteredCount);
                  }
                }, err => {
                  console.error(err);
                });
              } else {
                self.loadedCount = 0;
                self.agGrid.api.showNoRowsOverlay();
                params.successCallback([], 0);
              }
              if (!!this.apiConfig.filter || !!this.apiConfig.sort) {
                this.location.go(this.router.url.split('?')[0], this.getFilterUrlParams(this.apiConfig));
              } else {
                this.location.go(this.router.url.split('?')[0]);
              }
            } catch (e) {
              self.agGrid.api.hideOverlay();
              if (e.status === 403) {
                self.router.navigate(['/', this.commonService.app._id, 'no-access'], {
                  state: {
                    noRedirect: true,
                    serviceId: null
                  }
                });
              }
              if (!environment.production) {
                console.error(e);
              }
            }
          }
        };
        this.setupShortcuts();
      }
    );
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  setupShortcuts() {
    const self = this;
    this.shortcutService.unregisterAllShortcuts(357);

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Next Page', keys: ['Shift', '>'] });
    self.subscriptions['nextPage'] = self.shortcutService.shiftDotKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        const scrollElement = self.dataContainer?.nativeElement?.querySelector('ag-grid-angular>.ag-root-wrapper>.ag-root-wrapper-body>.ag-root>.ag-body-viewport');
        if (!!scrollElement) {
          scrollElement.scrollTop += scrollElement.clientHeight;
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Previous Page', keys: ['Shift', '<'] });
    self.subscriptions['prevPage'] = self.shortcutService.shiftCommaKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        const scrollElement = self.dataContainer?.nativeElement?.querySelector('ag-grid-angular>.ag-root-wrapper>.ag-root-wrapper-body>.ag-root>.ag-body-viewport');
        if (!!scrollElement) {
          scrollElement.scrollTop -= scrollElement.clientHeight;
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Focus on Next Record', keys: ['Down'] });
    this.shortcutService.registerShortcut({ section: 'Table', label: 'Focus on Previous Record', keys: ['Up'] });
    self.subscriptions['focusRecord'] = self.shortcutService.key
      .pipe(filter(event => event.key === 'ArrowUp' || event.key === 'ArrowDown'))
      .subscribe(() => {
        const gridApi = this.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        if (!focusedCell) {
          gridApi?.setFocusedCell(0, 'dataStackTxnId');
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Select Focused Record', keys: ['S'] });
    self.subscriptions['selectRecord'] = self.shortcutService.key
      .pipe(filter(event => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'S'))
      .subscribe(() => {
        const gridApi = this.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        if (!!focusedCell) {
          gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex).setSelected(true);
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Unselect Focused Record', keys: ['U'] });
    self.subscriptions['unselectRecord'] = self.shortcutService.key
      .pipe(filter(event => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'U'))
      .subscribe(() => {
        const gridApi = this.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        if (!!focusedCell) {
          gridApi.getDisplayedRowAtIndex(focusedCell.rowIndex).setSelected(false);
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Select Next Record', keys: ['K'] });
    self.subscriptions['selectNextRecord'] = self.shortcutService.key
      .pipe(filter(event => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'K'))
      .subscribe(() => {
        const gridApi = this.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        const nextRowIndex = !!focusedCell ? focusedCell.rowIndex + 1 : 0;
        if (nextRowIndex <= gridApi?.getLastDisplayedRow()) {
          const nextNode = gridApi?.getDisplayedRowAtIndex(nextRowIndex);
          gridApi?.setFocusedCell(nextRowIndex, '_id');
          nextNode?.setSelected(true);
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Select Previous Record', keys: ['J'] });
    self.subscriptions['selectPrevRecord'] = self.shortcutService.key
      .pipe(filter(event => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA' && event.key.toUpperCase() === 'J'))
      .subscribe(() => {
        const gridApi = this.agGrid?.api;
        const focusedCell = gridApi?.getFocusedCell();
        const prevRowIndex = !!focusedCell ? focusedCell.rowIndex - 1 : 0;
        if (prevRowIndex >= 0) {
          const prevNode = gridApi?.getDisplayedRowAtIndex(prevRowIndex);
          gridApi?.setFocusedCell(prevRowIndex, '_id');
          prevNode?.setSelected(true);
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Select All Records', keys: ['Ctrl', 'A'] });
    self.subscriptions['selectAll'] = self.shortcutService.ctrlAKey.subscribe(() => {
      const gridApi = this.agGrid?.api;
      gridApi?.forEachNode(node => node.setSelected(true));
    })

    this.shortcutService.registerShortcut({ section: 'Table', label: 'Unselect All Records', keys: ['Esc'] });
    self.subscriptions['selectNone'] = self.shortcutService.key
      .pipe(filter(event => event.key.toUpperCase() === 'ESCAPE'))
      .subscribe(() => {
        if (this.advanceFilterToggle) {
          this.advanceFilterToggle = false;
        } else {
          const gridApi = this.agGrid?.api;
          gridApi?.forEachNode(node => node.setSelected(false));
        }
      });

    this.shortcutService.registerShortcut({ section: 'Table', label: 'View Focused Record', keys: ['Enter'] });
    this.shortcutService.registerShortcut({ section: 'Table', label: 'Close Record', keys: ['Esc'] });
    self.subscriptions['openRecord'] = self.shortcutService.key
      .pipe(filter(event => event.key.toUpperCase() === 'ENTER'))
      .subscribe(() => {
        const gridApi = this.agGrid?.api;
        const row = gridApi?.getDisplayedRowAtIndex(gridApi?.getFocusedCell()?.rowIndex);
        this.rowDoubleClicked(row);
      });

    this.shortcutService.registerShortcut({ section: 'Filters', label: 'Show Advanced Filters', keys: ['Shift', 'F'] });
    this.shortcutService.registerShortcut({ section: 'Filters', label: 'Hide Advanced Filters', keys: ['Esc'] });
    self.subscriptions['openFilter'] = self.shortcutService.shiftFKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        this.advanceFilterToggle = true;
      });

    this.shortcutService.registerShortcut({ section: 'Filters', label: 'Clear/Reset Filters', keys: ['Shift', 'X'] });
    self.subscriptions['resetFilter'] = self.shortcutService.shiftXKey
      .pipe(filter(() => document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'))
      .subscribe(() => {
        if (this.hasFilters) {
          this.clearInlineFilters();
        } else if (this.advanceFilterQuery) {
          this.resetAdvanceFilters();
        }
      });
  }

  gridReady(event) {
    const self = this;
    if (self.gridState) {
      self.agGrid.columnApi.setColumnState(self.gridState);
    }
    if (self.filterModel) {
      self.agGrid.api.setFilterModel(self.filterModel);
    }
    self.agGrid.api.clearFocusedCell()
  }

  getFilterUrlParams(config: any, hideArray?: Array<string>) {
    let urlParams = '';
    if (!!config.filter) {
      urlParams += 'filter=' + JSON.stringify(config.filter);
    }
    if (!!config.sort) {
      urlParams += (!!urlParams ? '&sort=' : 'sort=') + JSON.stringify(config.sort);
    }
    if (!!hideArray && !!hideArray.length) {
      urlParams += (!!urlParams ? '&hide=' : 'hide=') + JSON.stringify(hideArray);
    }
    return urlParams;
  }

  createColumnDefs() {
    const self = this;
    const columns = [];
    self.columns.forEach(item => {
      const col = new AgGridColumn();
      col.field = item.key;
      col.headerName = item.label;
      col.width = item.width;
      if (item.key === '_checkbox') {
        col.pinned = 'left';
        col.checkboxSelection = true;
      } else {
        if (col.field !== 'duration'
          && col.field !== '_checkbox'
          && col.field !== 'type') {
          col.sortable = true;
        }
        if (col.field !== 'duration' && col.field !== '_checkbox') {
          col.filter = 'agTextColumnFilter';
          col.floatingFilterComponentFramework = InteractionGridFilterComponent;
        }
        col.suppressMenu = true;
        col.headerClass = 'hide-filter-icon';
        col.suppressMovable = true;
        col.resizable = true;
        col.cellRendererFramework = InteractionGridCellComponent;
      }
      columns.push(col);
    });
    self.columnDefs = columns;
  }

  getInteractionCount() {
    const self = this;
    return self.commonService.get('pm', `/${self.commonService.app._id}/interaction/count`, { filter: self.apiConfig.filter }).toPromise();
  }

  getInteraction() {
    const self = this;
    return self.commonService.get('pm', `/${self.commonService.app._id}/interaction`, self.apiConfig);
  }


  resetAdvanceFilters() {
    const self = this;
    if (this.hasFilterFromUrl) {
      this.clearSort();
      this.agGrid.columnApi.setColumnsVisible(this.columns.map(c => c.key), true);
    }
    this.hasFilterFromUrl = false;
    self.advanceFilterQuery = null;
    self.apiConfig.filter = null;
    self.flowService.filterApplied = null;
    self.agGrid.api.setFilterModel(null);
    if (self.gridFilterPrefId) {
      self.setLastFilter();
    }
  }

  applyAdvanceFilters(filter) {
    const self = this;
    self.advanceFilterQuery = filter;
    self.apiConfig.filter = filter;
    self.agGrid.api.setFilterModel(null);
    self.setLastFilter();
  }

  syncData() {
    const self = this;
    self.agGrid.api.purgeInfiniteCache();
    self.loadedCount = 0;
    self.getInteractionCount().then(count => {
      self.totalCount = count;
    });
  }

  triggerReDownload() {
    const self = this;
    let payload;
    const failedRecords = self.selectedData.filter(e => (e.status === 'ERROR' || e.status === 'UNKNOWN') && e.redownloadMeta);
    if (failedRecords.length > 0) {
      payload = failedRecords.map((e) => {
        const obj = {
          remoteTxnID: e.remoteTxnId,
          dataStackTxnId: e.dataStackTxnId
        };
        return obj;
      });
      self.reDownloadModalRef = self.modalService.open(self.reDownloadModal, { centered: true });
      self.reDownloadModalRef.result.then((close) => {
        if (close) {
          self.commonService.post('pm', `/${self.commonService.app._id}/interaction/redownloadFile`, payload).subscribe((res) => {
            self.ts.success(res.message);
          });
        }
      }, dismiss => { });
    }
  }


  getPrefrences() {
    const self = this;
    const key = `all-interaction-${self.commonService.app._id}`;
    const type = ['grid-state', 'filter'];
    self.perferenceService.getPrefrences(key, type).subscribe(prefRes => {
      try {
        const gridPref = prefRes.find(e => e.type === 'grid-state');
        const gridFilter = prefRes.find(e => e.type === 'filter');
        if (gridPref) {
          self.gridStatePrefId = gridPref._id;
          self.gridState = JSON.parse(gridPref.value);
        }
        if (gridFilter && this.flowService.isWithinInteractions() && !this.hasFilterFromUrl) {
          self.gridFilterPrefId = gridFilter._id;
          const filterData = JSON.parse(gridFilter.value);
          self.filterModel = filterData.filterModel;
          self.apiConfig.filter = filterData.filterQuery;
          self.advanceFilterData = filterData.advanceFilterData;
        }
        if (self.gridState) {
          self.agGrid.columnApi.setColumnState(self.gridState);
        }
        if (!this.hasFilterFromUrl) {
          if (self.filterModel) {
            self.agGrid.api.setFilterModel(self.filterModel);
            self.filterModified();
            self.agGrid.api.onFilterChanged();
          } else {
            self.clearInlineFilters();
            self.setLastFilter();
          }
        }
      } catch (e) {
        console.error(e);
      }
    }, prefErr => {
      self.commonService.errorToast(prefErr, 'Unable to load preference');
    });
  }

  setGridState(gridState: Array<any>) {
    const self = this;
    const key = `all-interaction-${self.commonService.app._id}`;
    const type = 'grid-state';
    self.perferenceService.setPrefrences(key, type, self.gridStatePrefId, gridState).subscribe((res) => {
      if (res._id) {
        self.gridStatePrefId = res._id;
      }
    }, err => {
      console.error(err.message, 'unable to save column width preference');
    });
  }

  setLastFilter() {
    const self = this;
    const key = `all-interaction-${self.commonService.app._id}`;
    const type = 'filter';
    const payload = {
      filterModel: self.filterModel,
      filterQuery: self.apiConfig.filter,
      advanceFilterData: self.advanceFilterData,
    };
    self.perferenceService.setPrefrences(key, type, self.gridFilterPrefId, payload).subscribe((res) => {
      if (res._id) {
        self.gridFilterPrefId = res._id;
      }
    }, err => {
      console.error(err.message, 'unable to save column width preference');
    });
  }

  rowDoubleClicked(event: any) {
    const self = this;
    self.appService.remoteTxnId = event.data.remoteTxnId;
    self.flowService.fromAllInteractions = true;
    self.router.navigate(['/', this.commonService.app._id, 'interactions',event.data.partnerId,event.data.flowId,event.data.dataStackTxnId]);
  }

  rowSelected(event) {
    const self = this;
    const selectedNodes = self.agGrid.api.getSelectedNodes();
    self.selectedData = selectedNodes.map(node => node.data);
  }

  sortChanged(event) {
    const self = this;
    const sortModel = self.agGrid.api.getSortModel();
    let sort = '';
    if (sortModel) {
      sort = sortModel.map(e => (e.sort === 'asc' ? '' : '-') + e.colId).join(',');
    }
    self.apiConfig.sort = sort;
    self.sortModel = sortModel;
    if (!environment.production) {
      console.log('Sort Modified', sortModel);
    }
  }

  clearSort() {
    const self = this;
    self.sortModel = null;
    self.apiConfig.sort = null;
    self.agGrid.api.setSortModel(null);
  }

  filterModified() {
    const self = this;
    const filter = [];
    const filterModel = self.agGrid.api.getFilterModel();
    if (filterModel) {
      Object.keys(filterModel).forEach(key => {
        try {
          if (filterModel[key].filter) {
            filter.push(JSON.parse(filterModel[key].filter));
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
    if (filter.length > 0) {
      self.apiConfig.filter = { $and: filter };
    } else {
      self.apiConfig.filter = null;
      self.flowService.filterApplied = null;
    }
    if (!environment.production) {
      console.log('Filter Modified', filterModel);
    }
    self.filterModel = filterModel;
    self.setLastFilter();
  }

  clearInlineFilters() {
    const self = this;
    self.apiConfig.filter = null;
    self.flowService.filterApplied = null;
    self.filterModel = null;
    self.agGrid.api.setFilterModel(null);
    self.appService.clearFilterEvent.emit(true);
    if (self.gridFilterPrefId) {
      self.setLastFilter();
    }
  }

  clearSavedView() {
    const self = this;
    self.filterModel = null;
    self.sortModel = null;
    self.apiConfig.filter = null;
    self.apiConfig.sort = null;
    self.agGrid.api.setFilterModel(null);
    self.agGrid.api.setSortModel(null);
    const columnIds = self.agGrid.columnApi.getAllColumns().map(e => e.getColId());
    self.agGrid.columnApi.setColumnsVisible(columnIds, true);
    self.columns.forEach((e, i) => {
      self.agGrid.columnApi.moveColumn(e.dataKey, i);
    });
  }

  columnResized(event) {
    const self = this;
    const columnState = self.agGrid.columnApi.getColumnState();
    self.subject.next(columnState);
  }

  columnVisible(event) {
    const self = this;
    const columnState = self.agGrid.columnApi.getColumnState();
    self.subject.next(columnState);
  }

  isColumnVisible(key: string) {
    const self = this;
    if (self.agGrid) {
      return self.agGrid.columnApi.getColumn(key).isVisible();
    }
    return false;
  }

  toggleColumn(key: string, value: any) {
    const self = this;
    if (self.agGrid) {
      self.agGrid.columnApi.setColumnVisible(key, value);
    }
    const hide = this.columns.map(col => col.key).reduce((pv, cv) => {
      if (!this.isColumnVisible(cv)) {
        return [...pv, cv];
      }
      return pv;
    }, []);
    this.location.go(this.router.url.split('?')[0], this.getFilterUrlParams(this.apiConfig, hide))
  }

  get hasFilters() {
    const self = this;
    if (self.filterModel && Object.keys(self.filterModel).length > 0) {
      return true;
    }
    return false;
  }

  get hasSort() {
    const self = this;
    if (self.sortModel && Object.keys(self.sortModel).length > 0) {
      return true;
    }
    return false;
  }

  get reDownloadCount() {
    const self = this;
    if (self.selectedData) {
      return self.selectedData.filter(e => (e.status === 'ERROR' || e.status === 'UNKNOWN') && e.redownloadMeta).length;
    }
    return 0;
  }

  get selectAll() {
    const self = this;
    if (self.loadedCount > 0) {
      return self.selectedData.length === self.loadedCount;
    }
    return false;
  }

  set selectAll(flag) {
    const self = this;
    self.agGrid.api.forEachNode((rowNode, index) => {
      rowNode.setSelected(flag);
      rowNode.data._checked = flag;
    });
  }
}
