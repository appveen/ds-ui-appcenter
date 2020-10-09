import { Component, OnInit, Input, EventEmitter, Output, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { IDatasource, IGetRowsParams } from 'ag-grid-community';
import { AgGridColumn, AgGridAngular } from 'ag-grid-angular';
import { map, distinctUntilChanged } from 'rxjs/operators';

import { AgGridFiltersComponent } from './ag-grid-filters/ag-grid-filters.component';
import { AgGridCellComponent } from './ag-grid-cell/ag-grid-cell.component';
import { GetOptions, CommonService } from 'src/app/service/common.service';
import { WorkflowAgGridService } from './workflow-ag-grid.service';
import { FormService } from 'src/app/service/form.service';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-workflow-ag-grid',
  templateUrl: './workflow-ag-grid.component.html',
  styleUrls: ['./workflow-ag-grid.component.scss']
})
export class WorkflowAgGridComponent implements OnInit {
  @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
  @ViewChild('agGrid', { static: false }) agGrid: AgGridAngular;
  @Input() schema: any;
  @Input() columns: Array<any>;
  @Input() applySavedView: EventEmitter<any>;
  @Input() srvcId: string;
  @Input() selectAll: EventEmitter<any>;
  @Input() approversList: Array<any>;
  @Output() removedSavedView: EventEmitter<any>;
  @Output() selectedRecords: EventEmitter<Array<any>>;
  @Output() viewRecord: EventEmitter<any>;
  @Output() recordsInfo: EventEmitter<any>;
  @Output() rightClick: EventEmitter<any>;
  @Output() scroll: EventEmitter<boolean>;
  @Output() view: EventEmitter<string>;
  clearFilterModalRef: NgbModalRef;
  currentRecordsCountPromise: Promise<any>;
  columnDefs: AgGridColumn[];
  dataSource: IDatasource;
  apiConfig: GetOptions;
  subscription: any;
  currentRecordsCount;
  totalRecordsCount;
  expandList: Array<any>
  filterModel: any;
  noRowsTemplate
  constructor(
    private gridService: WorkflowAgGridService,
    private commonService: CommonService,
    private appService: AppService,
    private formService: FormService,
    private modalService: NgbModal
  ) {
    const self = this;
    self.selectAll = new EventEmitter();
    self.applySavedView = new EventEmitter();
    self.removedSavedView = new EventEmitter();
    self.selectedRecords = new EventEmitter();
    self.viewRecord = new EventEmitter();
    self.recordsInfo = new EventEmitter();
    self.rightClick = new EventEmitter();
    self.scroll = new EventEmitter();
    self.rightClick = new EventEmitter();
    self.scroll = new EventEmitter();
    self.view = new EventEmitter();

    self.columnDefs = [];
    self.expandList = [];
    self.subscription = {};
    self.noRowsTemplate = '<span>No records to display</span>';
  }

  ngOnInit(): void {
    const self = this;
    const parsedDef = JSON.parse(self.schema.definition);

    self.formService.patchType(parsedDef);
    self.formService.fixReadonly(parsedDef);
    self.getExpandList(parsedDef);
    self.apiConfig = {
      count: 30,
      page: 1,
      expand: true,
      filter: { 'serviceId': self.srvcId, 'app': self.commonService.app._id, '$and': [{ 'operation': 'POST', 'status': { '$ne': 'Draft' } }] },
      serviceId: self.srvcId

    };
    self.createColumnDefs();
    self.getRecordsCount(true);
    self.dataSource = {
      getRows: (params: IGetRowsParams) => {
        if (!environment.production) {
          console.log('getRows', params);
        }
        let definitionList = self.agGrid.columnApi.getAllColumns().filter(e => e.isVisible()).map(e => e.getColDef().refData);
        const cols = self.agGrid.columnApi.getAllGridColumns();
        const colToNameFunc = function (col, index) {
          return {
            index, colId: col.getId()
          };
        };
        const colNames = cols.map(colToNameFunc);
        const filteredColms = [];
        definitionList.forEach(element => {
          const obj = colNames.find(ele => ele.colId === element.dataKey);
          if (obj) {
            filteredColms.push(obj);
          }
        });
        const sc = [];
        filteredColms.sort((a, b) => a.index - b.index);
        filteredColms.forEach(ele => {
          const obj = definitionList.find(element => ele.colId === element.dataKey);
          if (obj) {
            sc.push(obj);
          }
        });
        definitionList = sc;
        // self.apiConfig.select = self.gridService.getSelect(definitionList);
        self.agGrid.api.showLoadingOverlay();
        self.selectedRecords.emit([]);
        self.currentRecordsCountPromise.then(count => {
          // self. arrangeFilter()
          if (params.endRow - 30 < self.currentRecordsCount) {
            self.apiConfig.page = Math.ceil(params.endRow / 30);
            if (self.subscription['getRecords_' + self.apiConfig.page]) {
              self.subscription['getRecords_' + self.apiConfig.page].unsubscribe();
            }
            self.subscription['getRecords_' + self.apiConfig.page] = self.getRecords().subscribe((records: any) => {
              let loaded = params.endRow;
              if (loaded > self.currentRecordsCount) {
                loaded = self.currentRecordsCount;
              }
              self.agGrid.api.hideOverlay();
              // self.agGrid.api.deselectAll();
              if (loaded === 0 && self.currentRecordsCount == 0) {
                self.agGrid.api.showNoRowsOverlay();
              }
              self.recordsInfo.emit({
                loaded,
                total: self.currentRecordsCount
              });
              records.forEach(user => {
                self.commonService.getUser(user.requestedBy).then(res => {
                  user.username = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
                }).catch(err => {
                  user.username = 'ERROR';
                });
              });
              records.forEach(record => {
                if (record.audit[record.audit.length - 1] && record.audit[record.audit.length - 1].action !== 'Draft' && record.audit[record.audit.length - 1].action !== 'Edit' && record.audit[record.audit.length - 1].action !== 'Submit') {
                  self.commonService.getUser(record.audit[record.audit.length - 1].id).then(res => {
                    record.respondedBy = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
                  }).catch(err => {
                    record.respondedBy = 'ERROR';
                  });
                } else {
                  record.respondedBy = 'N.A'
                }
              });
              if (loaded === self.currentRecordsCount) {
                params.successCallback(records, self.currentRecordsCount);
              } else {
                params.successCallback(records);
              }
              self.rowSelected(null);
            }, err => { });
          } else {
            self.agGrid.api.hideOverlay();
            if (self.currentRecordsCount == 0) {
              self.agGrid.api.showNoRowsOverlay();
            }
            params.successCallback([], self.currentRecordsCount);
          }
        });
      }
    };
    self.appService.workflowTabChange.pipe(
      distinctUntilChanged()
    ).subscribe(data => {
      self.setOldOrNew();

    });
    self.applySavedView.subscribe(data => {
      try {
        if (data.value) {
          if (typeof data.value === 'string') {
            data.value = JSON.parse(data.value);
          }
          const viewModel = data.value;
          const temp = self.agGrid.api.getFilterModel();
          console.log(temp);
          if (temp && Object.keys(temp).length > 0) {
            self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
            self.clearFilterModalRef.result.then((close) => {
              if (close) {
                self.gridService.selectedSavedView = viewModel;
                self.configureView(viewModel || {});
              }
            }, dismiss => { });
          } else {
            self.gridService.selectedSavedView = viewModel;
            self.configureView(viewModel || {});
          }
        }
      } catch (e) {
        console.error(e);
      }
    });
    self.selectAll.subscribe(flag => {
      self.agGrid.api.forEachNode((rowNode, index) => {
        if (rowNode.data.status === 'Pending' && self.canRespond(rowNode.data)) {
          rowNode.setSelected(flag);
          rowNode.data._checked = flag;
        }

      });
    });
  }


  initRows(nocount?: boolean) {
    const self = this;
    if (!nocount) {

      self.getRecordsCount();
    }
    self.apiConfig.page = 1;
  }

  getRecordsCount(first?: boolean) {
    const self = this;
    self.arrangeFilter();
    self.currentRecordsCountPromise = self.commonService.get('wf', '/count', { filter: self.apiConfig.filter, serviceId: self.srvcId }).pipe(
      map(count => {
        if (first) {
          self.totalRecordsCount = count;
        }
        self.currentRecordsCount = count;
        self.recordsInfo.emit({
          loaded: 0,
          total: count
        });
        return count;
      })
    ).toPromise();
  }

  arrangeFilter() {
    const self = this;
    self.apiConfig.filter.$and.splice(0, 1);
    if (self.appService.workflowTab === 0) {
      self.apiConfig.filter.$and.unshift({ operation: 'POST', status: { '$ne': 'Draft' } });
    } else if (self.appService.workflowTab === 1) {
      self.apiConfig.filter.$and.unshift({ operation: 'PUT' });
    } else if (self.appService.workflowTab === 2) {
      self.apiConfig.filter.$and.unshift({ operation: 'DELETE' });
    } else if (self.appService.workflowTab === 3) {
      self.apiConfig.filter.$and.unshift({ status: 'Draft' });
    }
    let keys = [...new Set(self.expandList)];
    self.apiConfig.expandKeys = keys.join();
    self.apiConfig.serviceId = self.apiConfig.filter.serviceId;
  }
  getRecords() {
    const self = this;
    return self.commonService.get('wf', '', self.apiConfig);
  }
  createColumnDefs() {
    const self = this;
    self.columns.forEach((e, i) => {
      const temp = {} as AgGridColumn;
      if (e.properties) {
        if (e.properties.label) {
          temp.headerName = e.properties.label;
        } else {
          temp.headerName = e.properties.name;
        }
      }
      if (e.dataType !== 'others') {
        temp.field = e.dataKey;
      } else {
        temp.field = e.dataKey;
      }
      if (e.type === 'Checkbox') {
        temp.width = 40;
        temp.pinned = 'left';
      } else if (e.type === 'action') {
        temp.width = 130;
        temp.pinned = 'right';
      }

      else {
        temp.sortable = true;
        temp.filter = 'agTextColumnFilter';
        temp.suppressMenu = true;
        temp.headerClass = 'hide-filter-icon';
        temp.resizable = true;
        // temp.pinned = 'right';
        temp.floatingFilterComponentFramework = AgGridFiltersComponent;
        temp.filterParams = {
          caseSensitive: true,
          suppressAndOrCondition: true,
          suppressFilterButton: true,
        };
      }
      if (e.type === 'Relation') {
        temp.tooltipField = e.dataKey;
        // temp.tooltipComponentFramework = RelationTooltipComponent;
      }
      temp.cellRendererFramework = AgGridCellComponent;
      // e.approverList = self.approversList;
      temp.refData = e;
      temp.hide = !e.show;
      self.columnDefs.push(temp);

    });
    // self.arrangeFilter();
  }
  columnResized(event) {
    const self = this;
    // const columns = self.agGrid.columnApi.getAllColumns();
    // self.widthChange.next(columns);
  }
  columnMoved() {

  }
  scrollEvent() {
    const self = this;
    self.scroll.emit(true);
  }
  sortChanged(event) {
    const self = this;
    const sortModel = self.agGrid.api.getSortModel();
    let sort = '';
    if (sortModel) {
      sort = sortModel.map(e => (e.sort === 'asc' ? '' : '-') + e.colId).join(',');
    }
    self.apiConfig.sort = sort;
    // self.sortModel = sort;
    if (!environment.production) {
      console.log('Sort Modified', sortModel);
    }
  }
  rowSelected(event) {
    const self = this;
    if (!!event && !!event.data && self.canRespond(event.data)) {
      event.data._checked = !event.data._checked;
    } else if (!!event && !!event.node) {
      event.node.setSelected(false);
    }
    const selectedNodes = self.agGrid.api.getSelectedNodes();
    const selectedData = selectedNodes.map(node => node.data);
    self.selectedRecords.emit(selectedData);
  }
  rowDoubleClicked(event) {
    const self = this;
    self.viewRecord.emit(event.data);
  }
  filterModified(event) {
    const self = this;
    const filter = [];
    const columnIds = self.agGrid.columnApi.getAllColumns().map(e => e.getColId());
    self.agGrid.columnApi.setColumnsVisible(columnIds, true);
    self.columns.forEach((e, i) => {
      self.agGrid.columnApi.moveColumn(e.dataKey, i);
    });
    self.filterModel = self.agGrid.api.getFilterModel();
    if (self.filterModel) {
      Object.keys(self.filterModel).forEach(key => {
        try {
          if (self.filterModel[key].filter) {
            filter.push(JSON.parse(self.filterModel[key].filter));
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
    if (filter.length > 0) {
      self.apiConfig.filter = {
        'serviceId': self.srvcId,
        'app': self.commonService.app._id,
        '$and': [{ 'operation': 'POST', 'status': { '$ne': 'Draft' } }]
      };

      filter.forEach(element => {
        self.apiConfig.filter.$and.push(element);
      });

      self.gridService.inlineFilterActive = true;
    } else {
      self.gridService.inlineFilterActive = false;
      self.apiConfig.filter = {
        'serviceId': self.srvcId,
        'app': self.commonService.app._id,
        '$and': [{ 'operation': 'POST', 'status': { '$ne': 'Draft' } }]
      };
    }
    if (!environment.production) {
      console.log('Filter Modified', self.filterModel);
    }
    self.removedSavedView.emit(true);
    // self.filterModel = self.apiConfig.filter;
    self.initRows();
  }
  setOldOrNew() {
    const self = this;
    let prefix = 'data.new';
    if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
      prefix = 'data.old';
    }
    self.apiConfig.filter.$and.forEach(element => {
      self.renameKey(element, Object.keys(element)[0], Object.keys(element)[0].replace('data.new', prefix))
      self.renameKey(element, Object.keys(element)[0], Object.keys(element)[0].replace('data.old', prefix))
    });

  }

  renameKey(obj, old_key, new_key) {
    // check if old key = new key   
    if (old_key !== new_key) {
      Object.defineProperty(obj, new_key, // modify old key 
        // fetch description from object 
        Object.getOwnPropertyDescriptor(obj, old_key));
      delete obj[old_key];                // delete old key 
    }
  }
  configureView(viewModel) {
    const self = this;
    try {
      let reload = false;
      const filters = [];
      const sort = [];
      const sortModel = [];
      const workflowColumnIds = ['workflowId', 'requestedBy', 'respondedBy', '_metadata.createdAt', 'status', 'action']
      const columnIds = self.agGrid.columnApi.getAllColumns().map(e => e.getColId());
      if (viewModel.select && viewModel.select.split(',').length > 0) {
        let fields = viewModel.select.split(',');
        let prefix = 'data.new.';
        if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
          prefix = 'data.old.';
        }
        fields = fields.map(e => prefix + e);
        self.agGrid.columnApi.setColumnsVisible(columnIds, false);
        self.agGrid.columnApi.setColumnsVisible(workflowColumnIds, true);
        self.agGrid.columnApi.setColumnsVisible(fields, true);
        self.agGrid.columnApi.setColumnVisible('_checkbox', true);
        fields.forEach((key, i) => {
          self.agGrid.columnApi.moveColumn(key, 5 + i + 1);
        });
      } else {
        self.agGrid.columnApi.setColumnsVisible(columnIds, true);
      }

      if (viewModel.sort && viewModel.sort.length > 0) {
        viewModel.sort.forEach(item => {
          if (typeof item.selectedOption === 'string') {
            item.selectedOption = parseInt(item.selectedOption, 10);
          }
          sortModel.push({
            colId: item.name,
            sort: item.selectedOption === 1 ? 'asc' : 'desc'
          });
          sort.push((item.selectedOption === 1 ? '' : '-') + item.name);
        });
      }

      if (viewModel.filter && viewModel.filter.$and) {
        self.apiConfig.filter.$and = [self.apiConfig.filter.$and[0]]
        viewModel.filter.$and.forEach(element => {
          self.apiConfig.filter.$and.push(element);

        });
        reload = true;
        if (!environment.production) {
          console.log('Setting Filter Model');
        }
        self.agGrid.api.setFilterModel({
          _id: {
            filterType: 'text',
            type: '',
            filter: ''
          }
        });
      } else {
        // self.apiConfig.filter = null;
        reload = true;

        self.apiConfig.filter.$and = [self.apiConfig.filter.$and[0]]
        self.arrangeFilter();
        self.agGrid.api.setFilterModel(null);
      }
     
      if (sort.length > 0) {
        self.apiConfig.sort = sort.join(',');
        if (!environment.production) {
          console.log('Setting Sort Model');
        }
        reload = true;
        self.agGrid.api.setSortModel(sortModel);
      } else {
        self.apiConfig.sort = null;
        self.agGrid.api.setSortModel(null);
      }
      if (reload) {
        self.arrangeFilter()
        self.initRows();
      }
    } catch (e) {
      console.error(e);
    }
  }

  canRespond(selectedData) {
    const self = this;
    let flag = false;
    let audit;
    if (selectedData && selectedData.audit) {
      audit = selectedData.audit[selectedData.audit.length - 1];
    }
    if (selectedData.requestedBy !== self.commonService.userDetails._id) {
      flag = true;
    }
    if (audit && audit.id !== self.commonService.userDetails._id && audit.action !== 'Error') {
      flag = true;
    }
    if (selectedData.status !== 'Pending') {
      flag = false;
    }
    if (!self.approversList.find(e => e === self.commonService.userDetails._id)) {
      flag = false;
    }
    return flag;
  }
  clearSavedView() {
    const self = this;
    // self.filterModel = null;
    // self.sortModel = null;
    self.gridService.inlineFilterActive = null;
    self.gridService.selectedSavedView = null;
    self.apiConfig.filter.$and = [self.apiConfig.filter.$and[0]]
    self.arrangeFilter();
    self.apiConfig.sort = null;
    self.agGrid.api.setFilterModel(null);
    self.agGrid.api.setSortModel(null);
    const columnIds = self.agGrid.columnApi.getAllColumns().map(e => e.getColId());
    self.agGrid.columnApi.setColumnsVisible(columnIds, true);
    self.columns.forEach((e, i) => {
      self.agGrid.columnApi.moveColumn(e.dataKey, i);
    });
    self.initRows();
  }


  getExpandList(parsedDef, parent?) {
    const self = this;
    if (parsedDef) {
      Object.keys(parsedDef).forEach(element => {
        if (parsedDef[element].type && (parsedDef[element].type === 'Relation' || parsedDef[element].type === 'User')) {
          if (parsedDef[element].properties.relatedViewFields.length) {
            parsedDef[element].properties.relatedViewFields.forEach(ele => {
              if (parent) {
                self.expandList.push(parent + '.' + parsedDef[element].properties.dataKey + '.' + ele.key);
              } else {
                self.expandList.push(parsedDef[element].properties.dataKey + '.' + ele.key);
              }
            });

          }
          if (parsedDef[element].properties.relatedSearchField !== '_id') {
            if (parent) {
              self.expandList.push(parent + '.' + parsedDef[element].properties.dataKey + '.' + parsedDef[element].properties.relatedSearchField);

            } else {
              self.expandList.push(parsedDef[element].properties.dataKey + '.' + parsedDef[element].properties.relatedSearchField);
            }
          }
        } else if (parsedDef[element].type && parsedDef[element].type === 'Array') {
          let par = element;
          if (parent) {
            par = element + parent;
          }
          if (parsedDef[element].definition._self.type === 'Relation' || parsedDef[element].type === 'User') {
            parsedDef[element].definition._self.properties.relatedViewFields.forEach(ele => {
              self.expandList.push(parsedDef[element].properties.dataKey + '.' + ele.key);
            });
            if (parsedDef[element].definition._self.properties.relatedSearchField !== '_id') {
              self.expandList.push(parsedDef[element].properties.dataKey + '.' + parsedDef[element].definition._self.properties.relatedSearchField);

            }
          } else if (parsedDef[element].definition._self.type === 'Object') {
            self.getExpandList(parsedDef[element].definition._self.definition, par)
          }
        } else if (parsedDef[element].type && parsedDef[element].type === 'Object') {
          self.getExpandList(parsedDef[element].definition, element);
        }
      });
    }
  }

  clearFilter() {
    const self = this;
    if (self.appService.workflowTab === 0) {
      self.apiConfig.filter = { 'serviceId': self.srvcId, 'app': self.commonService.app._id, '$and': [{ operation: 'POST', status: { '$ne': 'Draft' } }] };
    } else if (self.appService.workflowTab === 1) {
      self.apiConfig.filter = { 'serviceId': self.srvcId, 'app': self.commonService.app._id, '$and': [{ operation: 'PUT' }] };
    } else if (self.appService.workflowTab === 2) {
      self.apiConfig.filter = { 'serviceId': self.srvcId, 'app': self.commonService.app._id, '$and': [{ operation: 'DELETE' }] };
    } else if (self.appService.workflowTab === 3) {
      self.apiConfig.filter = { 'serviceId': self.srvcId, 'app': self.commonService.app._id, '$and': [{ status: 'Draft' }] };
    }
    self.filterModel = null;
    self.agGrid.api.setFilterModel(null);
    self.initRows();
  }

  ngOnDestroy() {
    const self = this;
    if (self.clearFilterModalRef) {
      self.clearFilterModalRef.close();
    }
    Object.keys(self.subscription).forEach(key => {
      if (self.subscription[key]) {
        self.subscription[key].unsubscribe();
      }
    });
  }
}
