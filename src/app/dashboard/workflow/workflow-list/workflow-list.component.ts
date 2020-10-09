import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Component, OnInit, ViewChild, EventEmitter, TemplateRef } from '@angular/core';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { WorkflowAgGridComponent } from './workflow-ag-grid/workflow-ag-grid.component';
import { WorkflowAgGridService } from './workflow-ag-grid/workflow-ag-grid.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { SessionService } from 'src/app/service/session.service';
import { environment } from 'src/environments/environment';
import { Definition } from 'src/app/interfaces/definition';
import { FormService } from 'src/app/service/form.service';
import { AppService } from 'src/app/service/app.service';
import { WorkflowService } from '../workflow.service';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'odp-workflow-list',
  templateUrl: './workflow-list.component.html',
  styleUrls: ['./workflow-list.component.scss'],
  animations: [trigger('slideIn', [
    state('void', style({
      transform: 'translateX(20px)'
    })),
    transition('void => *', [
      animate('600ms cubic-bezier(0.86, 0, 0.07, 1)', keyframes([
        style({
          opacity: 0,
          transform: 'translateX(20px)'
        }),
        style({
          opacity: .5,
          transform: 'translateX(10px)'
        }),
        style({
          opacity: 1,
          transform: 'translateX(0)'
        })
      ]))
    ]),
    transition('* => void', [
      animate('600ms cubic-bezier(0.86, 0, 0.07, 1)', keyframes([
        style({
          opacity: .7,
          transform: 'translateX(10px)'
        }),
        style({
          opacity: .5,
          transform: 'translateX(15px)'
        }),
        style({
          opacity: 0,
          transform: 'translateX(20px)'
        })
      ]))
    ])
  ])]
})
export class WorkflowListComponent implements OnInit {
  @ViewChild('listGrid', { static: false }) listGrid: WorkflowAgGridComponent;
  @ViewChild('confirmDeleteModal', { static: false }) confirmDeleteModal: TemplateRef<HTMLElement>;
  confirmDeleteModalRef: NgbModalRef;
  clearFilterModalRef: NgbModalRef;
  applySavedView: EventEmitter<any>;
  subscriptions: any;
  config: GetOptions;
  srvcId: string;
  showfilterOptions: Boolean;
  activeTab = 0;
  loading: any;
  schema: any;
  approversList: Array<any>;
  expandList: Array<any>;
  columnDefs: Array<any>;
  totalRecords;
  newRecordCount: Number;
  updatedRecordCount: Number;
  deleteRecordCount: Number;
  draftRecordCount: Number;
  isfilterApplied: Boolean;
  // checkAll: Boolean;
  respondedByList: Array<any>;
  requestedByList: Array<any>;
  dataColumns: Array<any>;
  allFilters: Array<any>;
  showSearchFilter: Boolean;
  showFilterList: Boolean;
  placeHoldertext: string;
  allFiltersListed: Boolean;
  filterPlaceHolder: Array<any>;
  showWorkflowData: boolean;
  selectAll: EventEmitter<any>;
  loadedRecordsCount: number;
  selectedRows: Array<any>;
  currentTotalCount: Number;
  filterConfig: {
    filter: any;
  };
  lastFilterAppliedPrefId: string;
  selectedSavedView: any;
  deleteModal: {
    title: string,
    message: string
  };
  showRespondPannel: Boolean;
  selectedData: any;
  showActnButtons: any;
  hoveredRow: any;
  workflowUploadedFiles: Array<any>;
  workflowFilesList: Array<any>;
  respondControl: FormControl;
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
    private gridService: WorkflowAgGridService) {
    const self = this;
    self.subscriptions = {};
    self.config = {
      page: 1,
      count: 30,
      serviceId: ''
    };
    self.loading = {};
    self.approversList = [];
    self.expandList = [];
    self.columnDefs = [];
    self.allFilters = [];
    self.applySavedView = new EventEmitter();
    self.selectAll = new EventEmitter();
    self.filterConfig = {
      filter: {}
    };
    self.placeHoldertext = 'Saved Views';
    self.deleteModal = {
      title: '',
      message: ''
    };
    self.selectedRows = [];
    self.showActnButtons = {};
    self.workflowUploadedFiles = [];
    self.workflowFilesList = [];
  
    self.respondControl = new FormControl();
  }

  ngOnInit() {
    const self = this;
    self.subscriptions['routeParams'] = self.route.params.subscribe(params => {
      self.appService.serviceId = params.serviceId;
      self.config.serviceId = params.serviceId;
      self.srvcId = params.serviceId;
      self.showfilterOptions = false;
      self.appService.serviceId = params.serviceId;
      self.config.serviceId = params.serviceId;
      self.lastFilterAppliedPrefId = null;
      self.fetchSchema(params.serviceId);
      self.getCounts()
      self.filterOperation();
      self.appService.workflowFilter = null;
      self.wfService.showFilterIcon = true;
    });
    if (self.appService.workflowTab) {
      self.activeTab = self.appService.workflowTab;
    }
    self.appService.workflowTab = self.activeTab;
    self.subscriptions['routeParams'] = self.gridService.respond.subscribe(data => {
      const self = this;
      const wfData = data
      self.selectedData = wfData;
      self.appService.showWorkflowDocument.next({ data: wfData, value: wfData.data });

      // self.viewWF(self.selectedRows.filter(e => e._checked)[0]);
      self.showRespondPannel = true;
    })
  }

  fetchSchema(serviceId: string) {
    const self = this;
    if (self.subscriptions['getSchema_' + serviceId]) {
      self.subscriptions['getSchema_' + serviceId].unsubscribe();
      self.subscriptions['getSchema_' + serviceId] = null;
    }
    self.loading.serviceDetails = true;
    self.subscriptions['getSchema_' + serviceId] = self.commonService.get('sm', '/service/' + serviceId).subscribe(res => {
      self.loading.serviceDetails = false;
      self.schema = res;
      self.appService.serviceAPI = '/' + self.commonService.app._id + res.api;
      const parsedDef = JSON.parse(self.schema.definition);

      // self.recordIdName = parsedDef['_id'].properties.name;
      self.formService.patchType(parsedDef);
      self.formService.fixReadonly(parsedDef);
      self.getExpandList(parsedDef);
      parsedDef._id = { type: 'String', properties: parsedDef._id.properties };
      self.schema.definition = JSON.stringify(parsedDef);
      self.config.filter = {
        serviceId,
        app: self.commonService.app._id,
      };
      self.config.page = 1;

      self.getApprovers();
      self.createColumnDefs();
      self.getTotalRecords();
      self.getReqAndResUsers(serviceId);


      self.appService.navigateToWorkflow.emit(self.config.serviceId);
    }, err => {
      self.loading.serviceDetails = false;
      self.commonService.errorToast(err, 'Unable to get the service details, please try again later');
    });
  }
  createColumnDefs() {
    const self = this;
    self.columnDefs = [
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
        key: 'action',
        dataKey: 'action',
        type: 'action',
        properties: {
          name: 'Action'
        },
        dataType: 'action'
      }
    ];
    self.dataColumns = self.parseDefinition(JSON.parse(self.schema.definition));
    let prefix = 'data.new.';
    if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
      prefix = 'data.old.';
    }
    self.dataColumns.forEach(e => e.dataKey = prefix + e.dataKey);
    self.columnDefs = self.columnDefs.concat(self.dataColumns);


  }
  getApprovers() {
    const self = this;
    self.subscriptions['getApprovers'] = self.commonService
      .get('user', `/approvers?entity=${self.schema._id}&app=${self.commonService.app._id}`)
      .subscribe(res => {
        self.approversList = res.approvers;
        self.gridService.approversList = self.approversList;
      },
        err => { });
  }
  parseDefinition(def, parentKey?: string, parentName?: string): Definition[] {
    const self = this;
    let tempArr: Definition[] = [];
    Object.keys(def).forEach(key => {
      const temp: Definition = {};
      temp.show = true;
      if (key === '_id') {
        temp.key = 'documentId';
        temp.dataKey = 'documentId';
        temp.type = 'docId';
        temp.properties = { name: def[key].properties.name };
        temp.properties.type = def[key].type;
        temp.definition = [];
        temp.dataType = 'text';
        tempArr.unshift(temp);

      } else {
        if (def[key].type === 'Object') {
          const tempName = parentName ? parentName + '.' + def[key].properties.name : def[key].properties.name;
          const tempKey = parentKey ? parentKey + '.' + key : key;
          tempArr = tempArr.concat(self.parseDefinition(def[key].definition, tempKey, tempName));
        } else {
          temp.key = parentKey ? parentKey + '.' + key : key;
          temp.dataKey = parentKey ? parentKey + '.' + key : key;
          temp.type = def[key].type;
          temp.properties = def[key].properties;
          temp.properties.name = parentName ? parentName + '.' + temp.properties.name : temp.properties.name;
          temp.properties.type = def[key].type;
          temp.definition = def[key].definition ? self.parseDefinition(def[key].definition, temp.key, def[key].properties.name) : [];
          temp.dataType = 'others';
          tempArr.push(temp);
        }
      }
    });
    return tempArr;
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


  resetFilter() {
    const self = this;
    if (self.listGrid) {
      self.listGrid.clearSavedView();
    }
    self.placeHoldertext = 'Saved Views';
    // self.savedViews = [];
    // self.advanceFilter = false;
    self.selectedSavedView = null;
    self.appService.workflowFilter = null;
    if (self.lastFilterAppliedPrefId) {
      self.deleteLastFilterApplied();
    }
    // self.filterSavedViews();
  }
  refreshFilter() {

  }
  selectOperation(activateTab) {
    const self = this;
    self.activeTab = activateTab;
    self.appService.workflowTab = activateTab;
    self.appService.workflowTabChange.emit(activateTab)
    self.createColumnDefs();
    self.getTotalRecords();
  }




  getCounts() {
    const self = this;
    self.getNewRecordsCount();
    self.getUpdatedRecordsCount();
    self.getDeleteRecordsCount();
    self.getDraftRecordsCount();

  }
  getTotalRecords() {
    const self = this;
    self.totalRecords = 0;
    const filter = {
      serviceId: self.srvcId,
      app: self.commonService.app._id,
    };
    self.subscriptions['getTotalRecords'] = self.commonService
      .get('wf', '/count', { filter: filter, serviceId: self.srvcId }).subscribe(count => {
        self.totalRecords = count;
        self.getLastFilterApplied();
      })
  }
  getNewRecordsCount() {
    const self = this;
    const filter = {
      serviceId: self.srvcId,
      app: self.commonService.app._id,
      operation: 'POST',
      status: 'Pending',

    };
    self.subscriptions['getNewRecordsCount'] = self.commonService
      .get('wf', '/count', { filter: filter, serviceId: self.srvcId }).subscribe(count => {
        self.newRecordCount = count;
      })
  }
  getUpdatedRecordsCount() {
    const self = this;
    const filter = {
      serviceId: self.srvcId,
      app: self.commonService.app._id,
      operation: 'PUT',
      status: 'Pending',
    };
    self.subscriptions['getUpdatedRecordsCount'] = self.commonService
      .get('wf', '/count', { filter: filter, serviceId: self.srvcId }).subscribe(count => {
        self.updatedRecordCount = count;
      })
  }
  getDeleteRecordsCount() {
    const self = this;
    const filter = {
      serviceId: self.srvcId,
      app: self.commonService.app._id,
      operation: 'DELETE',
      status: 'Pending',
    };
    self.subscriptions['getDeleteRecordsCount'] = self.commonService
      .get('wf', '/count', { filter: filter, serviceId: self.srvcId }).subscribe(count => {
        self.deleteRecordCount = count;
      })
  }
  getDraftRecordsCount() {
    const self = this;
    const filter = {
      serviceId: self.srvcId,
      app: self.commonService.app._id,
      status: "Draft"
    };
    self.subscriptions['getDraftRecordsCount'] = self.commonService
      .get('wf', '/count', { filter: filter, serviceId: self.srvcId }).subscribe(count => {
        self.draftRecordCount = count;
      })
  }
  toggleFilterOptions() {
    const self = this;
    self.showfilterOptions = !self.showfilterOptions;
    self.wfService.showActionItems = !self.showfilterOptions;
  }
  get customFilterApplied() {
    const self = this;
    let customFilterApplied = true;

    if (!self.appService.workflowFilter || JSON.stringify(self.appService.workflowFilter) === JSON.stringify({ filter: {} })) {
      customFilterApplied = false;
    }
    return customFilterApplied;
  }

  selectSavedView(evnt) {
    const self = this;
    const view = evnt.view
    if (!environment.production) {
      console.log('selectSavedView', view);
    }
    if (view._id) {
      self.setLastFilterApplied(view);
      self.selectedSavedView = view;
      self.applySavedView.emit(view);
      self.appService.workflowFilter = view;
    } else {
      self.selectedSavedView = { value: view };
      self.applySavedView.emit({ value: view });
      self.appService.workflowFilter = { value: view };
    }

    if(evnt.close){
      self.showfilterOptions =false;
    }
  }

  view(id?) {
    const self = this;
    if (id) {
      self.router.navigate(['/~/workflow', self.appService.serviceId, id]);
    } else {
      return;
    }
  }
  filterAllFilter(type) {
    const self = this;
    if (type === 'public') {
      self.allFilters = self.filterPlaceHolder.filter(e => !e.private);
      self.allFiltersListed = true;
    } else if (type === 'private') {
      self.allFilters = self.filterPlaceHolder.filter(e => e.createdBy === self.sessionService.getUser(true)._id && e.private);
      self.allFiltersListed = false;
    }
  }

  selectedRecords(records) {
    const self = this;
    self.selectedRows = records;
  }
  filterOperation(data?) {
    const self = this;
    if (data) {
      self.filterConfig.filter = {
        serviceId: data._id,
        app: self.commonService.app._id
      };
    } else {
      self.filterConfig.filter = {
        serviceId: self.appService.serviceId,
        app: self.commonService.app._id
      };
    }
    self.filterConfig.filter.type = 'workflow';
    self.getAllFilters();
  }
  getAllFilters() {
    const self = this;
    self.commonService.get('user', '/filter/', self.filterConfig)
      .subscribe(_filter => {
        self.allFilters = _filter;
        self.allFilters.forEach(e => {
          e['showOptions'] = false;
          self.getUsrName(e.createdBy, e);
        });
        self.filterPlaceHolder = self.allFilters;
        self.allFilters = self.allFilters = self.filterPlaceHolder.filter(e => e.createdBy === self.sessionService.getUser(true)._id && e.private);
      });
  }
  getUsrName(userId, filter) {
    const self = this;
    self.commonService.getUser(userId).then(user => {
      filter['user'] = user.basicDetails.name;
    }).catch(err => {
      self.commonService.errorToast(err, 'Unable to fetch User with ID: ' + userId);
    });
  }
  setLastFilterApplied(data: any) {
    const self = this;
    let response;
    const payload = {
      userId: self.commonService.userDetails._id,
      type: 'workflow-last-filter',
      key: self.schema._id,
      value: JSON.stringify(data)
    };
    if (self.lastFilterAppliedPrefId) {
      response = self.commonService.put('user', '/preferences/' + self.lastFilterAppliedPrefId, payload);
    } else {
      response = self.commonService.post('user', '/preferences', payload);
    }
    response.subscribe(prefRes => {
      self.lastFilterAppliedPrefId = prefRes._id;
    }, prefErr => {
      self.commonService.errorToast(prefErr, 'Unable to save preference');
    });
  }

  deleteLastFilterApplied() {
    const self = this;
    if (self.lastFilterAppliedPrefId) {
      self.commonService.delete('user', '/preferences/' + self.lastFilterAppliedPrefId).subscribe(prefRes => {
        self.lastFilterAppliedPrefId = null;
      }, prefErr => {
        self.commonService.errorToast(prefErr, 'Unable to update preference');
      });
    }
  }

  getLastFilterApplied() {
    const self = this;
    const options: GetOptions = {
      filter: {
        userId: self.commonService.userDetails._id,
        type: 'workflow-last-filter',
        key: self.schema._id
      }
    };
    self.commonService.get('user', '/preferences', options).subscribe(prefRes => {
      try {
        if (prefRes && prefRes.length > 0) {
          self.lastFilterAppliedPrefId = prefRes[0]._id;
          if (typeof prefRes[0].value === 'string') {
            prefRes[0].value = JSON.parse(prefRes[0].value);
          }
          const view = prefRes[0].value;
          self.appService.workflowFilter = view;
          self.selectedSavedView = view;
          self.applySavedView.emit(view);
        } else {
          self.selectedSavedView = null;
        }
      } catch (e) {
        console.error(e);
      }
    }, prefErr => {
      self.commonService.errorToast(prefErr, 'Unable to save preference');
    });
  }
  deleteFilter(filter) {
    const self = this;
    const currentUser = self.sessionService.getUser(true);
    if ((!filter.private) && (currentUser.isSuperAdmin || (currentUser._id === filter.createdBy))) {
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
    self.confirmDeleteModalRef.result.then(close => {
      if (close) {
        self.subscriptions['deleteFilter'] = self.commonService.delete('user', `/filter/${filter._id}`).subscribe(res => {
          self.ts.success('Filter Deleted.');
          // self.savedViews = [];
          self.getAllFilters();
        }, err => {
          self.commonService.errorToast(err, 'Unable to delete, please try again later');
        });
      }
    }, dismiss => { });
  }
  editFilter(filter) {
    const self = this;
    self.showfilterOptions = true;
    // self.showFilterList = false;
    self.appService.workflowFilter = filter;
  }
  changeFilterType(filter, type) {
    const self = this;
    if (filter.private && type === 'private') {
      return;
    } else if (!filter.private && type === 'public') {
      return;
    } else {
      const currentUser = self.sessionService.getUser(true);
      if ((!filter.private) && (currentUser.isSuperAdmin || (currentUser._id === filter.createdBy))) {
        filter.private = type === 'private';
        self.subscriptions['filterType'] = self.commonService.put('user', `/filter/${filter._id}`, filter).subscribe(() => {
          self.ts.success('Filter type Updated');
          self.getAllFilters();
        });
      } else if (filter.private && (currentUser._id === filter.createdBy)) {
        filter.private = type === 'private';
        self.subscriptions['filterType'] = self.commonService.put('user', `/filter/${filter._id}`, filter).subscribe(() => {
          self.ts.success('Filter type Updated');
          self.getAllFilters();
        });
      } else {
        self.ts.warning('You don\'t have enough permission');
      }
    }
  }
  get allCheckedRecords() {
    const self = this;
    let rowData = [];
    if (self.listGrid) {
      self.listGrid.agGrid.api.forEachNode(node => rowData.push(node.data));
    }
    return rowData.filter(e => e && e._checked).length;
    // return self.selectedRows.filter(e => e._checked).length;
  }


  get allCheckedRecordIds() {
    const self = this;
    return self.selectedRows.filter(e => e && e._checked).map(x => x._id);

  }
  get pendingRecords() {
    const self = this;
    let rowData = [];
    if (self.listGrid) {
      self.listGrid.agGrid.api.forEachNode(node => rowData.push(node.data));
    }
    return rowData.filter(e => e && e.status === 'Pending' && self.canRespond(e)).length;
  }
  get checkAll() {
    const self = this;
    let rowData = [];
    if (self.listGrid) {
      self.listGrid.agGrid.api.forEachNode(node => rowData.push(node.data));

      if (rowData.length > 0) {
        return rowData.filter(e => e && e.status === 'Pending' && self.canRespond(e)).every(e => e._checked);
      }
    }
    return false;
  }


  set checkAll(val) {
    const self = this;
    if (self.listGrid) {
      self.listGrid.agGrid.api.forEachNode(node => {
        if (!!node.data && node.data.status === 'Pending' && self.canRespond(node.data)) {
          node.setSelected(val);
        }
      });
    }
  }

  respondToWorkflow(index, data) {
    const self = this;
    const wfData = self.selectedRows[index];
    self.selectedData = wfData;
    self.appService.showWorkflowDocument.next({ data: wfData, value: wfData.data });
    self.selectedRows[index]._checked = true;
    // self.viewWF(self.selectedRows.filter(e => e._checked)[0]);
    self.showRespondPannel = true;
  }


  canRespond(selectedData) {
    const self = this;
    let flag = false;
    let audit;
    if (selectedData && selectedData.audit) {
      audit = selectedData.audit[selectedData.audit.length - 1];
    }
    if (selectedData && selectedData.requestedBy !== self.commonService.userDetails._id) {
      flag = true;
    }
    if (audit && audit.id !== self.commonService.userDetails._id && audit.action !== 'Error') {
      flag = true;
    }
    if (selectedData && selectedData.status !== 'Pending') {
      flag = false;
    }
    if (!self.approversList.find(e => e === self.commonService.userDetails._id)) {
      flag = false;
    }
    return flag;
  }
  respondToMultipleWorkflow() {
    const self = this;
    let rowData = [];
    if (self.listGrid) {
      self.listGrid.agGrid.api.forEachNode(node => rowData.push(node.data));
    }
    const wfData = rowData.find(e => !!e._checked);
    const selectedRecords = rowData.filter(e => !!e._checked);
    self.selectedData = wfData;
    self.appService.showWorkflowDocument.next({ data: wfData, value: wfData.data, multi: true, selectedRecords });
    self.showRespondPannel = true;
  }


  onAction(event) {
    const self = this;
    self.showRespondPannel = !self.showRespondPannel;
    self.respondControl.patchValue(event.respondControl);
    if (event && event.refereshRequired) {
      self.getTotalRecords();
    }
    self.wfService.showActionItems = true;
    self.getCounts();
  }

  addUserDetails(user: any) {
    const self = this;
    self.commonService.getUser(user._id).then(res => {
      user.name = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
    }).catch(err => {
      user.name = 'ERROR';
    });
  }

  getReqAndResUsers(serviceId) {
    const self = this;
    const options = {
      filter: {
        serviceId: serviceId
      },
      serviceId: serviceId
    };
    self.subscriptions['getReqAndResUsers'] = self.commonService
      .get('wf', '/utils/users', options)
      .subscribe(res => {
        self.requestedByList = res.requestedBy;
        self.respondedByList = res.respondedBy;
        self.gridService.requestedByList = self.requestedByList;
        self.gridService.respondedByList = self.respondedByList;
      })
  }
  ngOnDestroy() {
    const self = this;
    self.appService.workflowFilter = null;
    Object.keys(self.subscriptions).forEach(key => {
      self.subscriptions[key].unsubscribe();
    });
  }
  clearFilters() {
    const self = this;
    if (self.listGrid) {
      self.listGrid.clearFilter();
    }
  }
  removedSavedView(event) {
    const self = this;
    self.selectedSavedView = null;
    self.appService.existingFilter = null;
  }

  get hasFilters() {
    const self = this;
    if (!self.selectedSavedView && self.listGrid && self.listGrid.filterModel) {
      return true;
    }
    return false;
  }
}
