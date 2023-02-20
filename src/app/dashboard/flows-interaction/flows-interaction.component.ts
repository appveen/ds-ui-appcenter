import { DatePipe } from '@angular/common';
import { Component, EventEmitter, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridColumn, AgGridAngular } from 'ag-grid-angular';
import { GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import * as moment from 'moment';

import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { FlowsInteractionService } from './flows-interaction.service';
import { FloatingFilterComponent } from 'ag-grid-community/dist/lib/components/framework/componentTypes';
import { FlowsFiltersComponent } from './flows-filters/flows-filters.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { SessionService } from 'src/app/service/session.service';
import { validJSON, validSearch } from '../services/list/list.component';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-flows-interaction',
  templateUrl: './flows-interaction.component.html',
  styleUrls: ['./flows-interaction.component.scss'],
  providers: [DatePipe, FileSizePipe]
})
export class FlowsInteractionComponent implements OnInit {

  interactionList: Array<any>;
  columnDefs: Array<any>;
  apiConfig: GetOptions;
  @ViewChild('agGrid', { static: false }) agGrid: AgGridAngular;
  @ViewChild('listFilters', { static: false })
  listFilters: FlowsFiltersComponent;
  gridOptions: GridOptions
  flowId;
  dataSource: IDatasource;
  showLoading: boolean;
  subscription: any={};
  noRowsTemplate;
  currentRecordsCount: number;
  sortModel: any;
  filterModel: any;
  hasFilterFromUrl: boolean;
  showSaveViewDropDown: boolean;
  savedViews: Array<any>;
  allFilters: Array<any>;
  showSearchSavedView: boolean;
  selectedSavedView: any;
  showPrivateViews: boolean;
  savedViewApiConfig: GetOptions;
  loadFilter: boolean;
  searchForm: FormGroup;
  filterPayload: any;
  filterId: any;
  filterCreatedBy: any;
  isCollapsed: any;
  selectedSearch: any;
  savedViewSearchTerm: any;
  advanceFilter: boolean;
  constructor(private commonService: CommonService,
    private route: ActivatedRoute,
    private flowsService: FlowsInteractionService,
    private datePipe: DatePipe,
    private fileSizePipe: FileSizePipe,
    private router: Router,
    private fb: FormBuilder,
    private sessionService: SessionService,
    public appService: AppService,) {
    const self=this;
    this.interactionList = [];
    this.columnDefs = [];
    // self.applySavedView = new EventEmitter();
    self.savedViews = [];
    // self.selectedRows = [];
    // self.totalRecords = 0;
    self.savedViewApiConfig = {
      page: 1,
      count: 10
    };
    this.noRowsTemplate = '<span>No Interaction Found.</span>';
    this.apiConfig={
      sort:'-_metadata.createdAt',
      count : 30,
      page:1,
    }
    // self.searchForm = self.fb.group({
    //   name: ['', [Validators.required]],
    //   filter: ['{}', [validJSON()]],
    //   project: ['{}', [validJSON(), validSearch('project')]],
    //   sort: ['{}', [validJSON(), validSearch('sort')]],
    //   private: [false, [Validators.required]],
    //   count: ['', Validators.min(1)],
    //   page: ['', Validators.min(1)]
    // });
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

  ngOnInit(): void {
    const self=this;
    this.route.params.subscribe(params => {
      this.flowId=params.flowId;
      this.agGrid?.api?.setFilterModel(null);
      this.agGrid?.api?.setSortModel(null);
      this.getRecordsCount();
    });
    this.configureColumns();

    this.flowsService.filterSubject.subscribe(data => {
      this.clearFilter(false);
      let final = {};
      const filter = self.apiConfig.filter || self.flowsService.filter;
      console.log()
      const temp = filter?.['$and'] || filter?.['$or'] || [];
      if (data) {
        if (temp && temp.length > 0) {
          if (temp.find(ele => Object.keys(ele)[0] === Object.keys(data)[0])) {
            temp.forEach(ele => {
              if (Object.keys(ele)[0] === Object.keys(data)[0]) {
                ele = data
              }
            })
          }
          else {
            let tempData = data['$or']?.length > 0 ? data['$or'] : data
            if (Array.isArray(tempData) && tempData.length === 1) {
              tempData = tempData[0];
            }
            temp.push(tempData);
            final['$and'] = temp
          }
        }
        else {
          const tempData = data['$or']?.length > 0 ? data['$or'] : data
          temp.push(tempData)
          final['$and'] = temp
        }
      }
      this.filterModified(null, final)
    })
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscription).forEach(key => {
      if (self.subscription[key]) {
        self.subscription[key].unsubscribe();
      }
    });
  }

  filterModified(event, modFilter?) {
    const self = this;
    const filter = [];
    const filterModel = self.agGrid && self.agGrid.api && self.agGrid.api.getFilterModel();
    if (filterModel) {
      Object.keys(filterModel).forEach(key => {
        try {
          if (filterModel[key].filter) {
            let tempData = JSON.parse(filterModel[key].filter)
            if (tempData['$or'] && tempData['$or'].length === 1) {
              tempData = tempData['$or'][0]
            }
            filter.push(tempData);
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
    if (filter.length > 0) {
      self.apiConfig.filter = { $and: filter };
      self.flowsService.inlineFilterActive = true;
    } else {
      self.flowsService.inlineFilterActive = false;
      self.apiConfig.filter = modFilter;
    }
    if (!environment.production) {
      console.log('Filter Modified', filterModel);
    }
    self.filterModel = self.apiConfig.filter || modFilter;
    // this.initRows()
  }

  selectSavedView(evnt) {
    const view = evnt.query || evnt;
    const self = this;
    if (!environment.production) {
      console.log('selectSavedView', view);
    }

    if (view._id) {
      self.setLastFilterApplied(view);
      self.selectedSavedView = view;
      // self.agGrid.applyView(view);
      self.listFilters.selectFilter(view, true);
      self.appService.existingFilter = view;
    } else {
      if (view.filter || view.sort || view.select) {
        self.selectedSavedView = { value: view };
        // self.agGrid.applyView({ value: view });
        self.listFilters.selectFilter({ value: view }, true);
        self.appService.existingFilter = { value: view };
      }
    }
    if (evnt.close) {
      self.advanceFilter = false;
    }
  }

  setLastFilterApplied(data: any) {
    const self = this;
    let response;
    const payload = {
      // userId: self.commonService.userDetails._id,
      // type: 'last-filter',
      // key: self.schema._id,
      // value: JSON.stringify(data)
    };
    // if (self.lastFilterAppliedPrefId) {
    //   response = self.commonService.put('user', '/data/preferences/' + self.lastFilterAppliedPrefId, payload);
    // } else {
    //   response = self.commonService.post('user', '/data/preferences', payload);
    // }
    // response.subscribe(
    //   prefRes => {
    //     self.lastFilterAppliedPrefId = prefRes._id;
    //   },
    //   prefErr => {
    //     self.commonService.errorToast(prefErr, 'Unable to save preference');
    //   }
    // );
  }

  onRefine(event) {
    if (event.refresh) {
      this.getSavedViews(true);
    }
    if (!event.query.filter) {
      this.hasFilterFromUrl = false;

    }
    this.agGrid.api.refreshInfiniteCache();
    this.selectSavedView(event);

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

  getSavedViews(getAll?: boolean) {
    const self = this;
    if (!!self.savedViewApiConfig?.filter?.createdBy) {
      delete self.savedViewApiConfig.filter.createdBy;
    }
    self.savedViewApiConfig.filter = {
      // serviceId: self.schema._id,
      // app: self.commonService.app._id,
      // type: { $ne: 'workflow' }
    };
    this.loadFilter = true;
    if (true) {
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
        self.commonService.get('user', '/data/filter/', self.savedViewApiConfig).subscribe(data => {
          self.savedViews = [];
          data.forEach(view => {
            self.fixSavedView(view);
            if (view.value && view.type === 'dataService') {
              if (typeof view.value === 'string') {
                view.value = JSON.parse(view.value);
              }
              if (view.value.filter && view.value.filter.length > 0) {
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
          this.loadFilter = false;

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
          self.commonService.get('user', '/data/filter/', self.savedViewApiConfig).subscribe(data => {
            data.forEach(view => {
              self.fixSavedView(view);
              if (view.value && view.type === 'dataService') {
                if (typeof view.value === 'string') {
                  view.value = JSON.parse(view.value);
                }
                if (view.value.filter && view.value.filter.length > 0) {
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
        this.loadFilter = false;
      }
    }
    // else {
    //   self.savedViewApiConfig.filter.createdBy = self.sessionService.getUser(true)._id;
    //   self.savedViewApiConfig.filter.private = true;
    //   self.savedViewApiConfig.filter.name = self.savedViewSearchTerm;

    //   let publicSavedViewConfig = JSON.parse(JSON.stringify(self.savedViewApiConfig));
    //   publicSavedViewConfig.filter.private = false;
    //   delete publicSavedViewConfig.filter.createdBy;
    //   let privateSavedViewApi = self.commonService.get('user', '/data/filter/', self.savedViewApiConfig);
    //   let publicSavedViewApipublic = self.commonService.get('user', '/data/filter/', publicSavedViewConfig);

    //   forkJoin([privateSavedViewApi, publicSavedViewApipublic]).subscribe((data) => {
    //     self.savedViews = [];

    //     let allViews = [...data[0], ...data[1]];
    //     allViews.forEach(view => {
    //       self.fixSavedView(view);
    //       if (view.value && view.type === 'dataService') {
    //         if (typeof view.value === 'string') {
    //           view.value = JSON.parse(view.value);
    //         }
    //         if (view.value.filter && view.value.filter.length > 0) {
    //           view.value.filter.forEach(item => {
    //             item.dataKey = item.dataKey;
    //             delete item.headerName;
    //             delete item.fieldName;
    //             delete item.fieldType;
    //           });
    //         }
    //       }
    //       self.getUserName(view);
    //       if (!self.savedViews.length || self.savedViews.every(itm => itm._id !== view._id)) {
    //         self.savedViews.push(view);
    //       }
    //     });

    //   })
    //   this.loadFilter = false;
    // }

  }
  
  resetFilter(){
    
  }

  fixSavedView(viewData) {
    const self = this;
    if (!viewData.type) {
      self.commonService.put('user', `/data/filter/${viewData._id}`, { type: 'dataService' }).subscribe(
        res => { },
        err => {
          console.error('Unable to Update Filter:', viewData.name);
        }
      );
    }
    if (!viewData.value) {
      self.commonService.delete('user', `/data/filter/${viewData._id}`).subscribe(
        res => { },
        err => {
          console.error('Unable to Delete Filter:', viewData.name);
        }
      );
    }
    viewData.hasOptions = viewData.createdBy === this.commonService.userDetails._id;
    // Sort Fix code for later release
    if (viewData.value) {
      if (typeof viewData.value === 'string') {
        viewData.value = JSON.parse(viewData.value);
      }
      self.commonService.delete('user', `/data/filter/${viewData._id}`).subscribe((res) => { }, err => {
        console.error('Unable to Delete Filter:', viewData.name);
      });
    }
  }


  configureColumns() {
    const filterOp={
      // filterOptions:[
      //   'contains','notContains','equals','notEqual'
      // ],
      suppressAndOrCondition: true
    };
    this.columnDefs=[
      {
        field : '_id',
        headerName : 'ID',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        cellClass : 'fw-500',
        show: true,
        key: '_id',
        dataKey: '_id',
        type: '_id',
        width: 120,
        properties: {
          name: '_id'
        },
        dataType: 'text'
      },
      {
        field : 'headers.data-stack-txn-id',
        headerName : 'Txn ID',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        width : 360,
        valueFormatter : (params) => {
          return params.data?.headers['data-stack-txn-id'] || '';
        },
        show: true,
        key: 'headers.data-stack-txn-id',
        dataKey: 'headers.data-stack-txn-id',
        type: '_id',
        properties: {
          name: 'Txn ID'
        },
        dataType: 'text'
      },
      {
        field : 'headers.data-stack-remote-txn-id',
        headerName : 'Remote ID',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        width : 360,
        valueFormatter : (params) => {
          return params.data?.headers['data-stack-remote-txn-id'] || ''
        },
        show: true,
        key: 'headers.data-stack-remote-txn-id',
        dataKey: 'headers.data-stack-remote-txn-id',
        type: '_id',
        properties: {
          name: 'Remote ID'
        },
        dataType: 'text'
      },
      {
        field : 'status',
        headerName : 'Status',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        width : 140,
        cellClass : (params) => {
          if(params.data){
            return this.getStatusClass(params.data) + ' fw-500';
          }
        },
        show: true,
        key: 'status',
        dataKey: 'status',
        type: 'status',
        properties: {
          name: 'status'
        },
        dataType: 'select'
      },
      {
        field : 'headers.content-type',
        headerName : 'Payload Type',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        width : 140,
        valueFormatter : (params) => {
          return this.getContentType(params.data?.headers['content-type'] || '');
        },
        show: true,
        key: 'headers.content-type',
        dataKey: 'headers.content-type',
        type: 'Payload',
        properties: {
          name: 'Payload Type'
        },
        dataType: 'select'
      },
      {
        field : 'headers.content-length',
        headerName : 'Payload Size',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        width : 140,
        valueFormatter : (params) => {
          return this.fileSizePipe.transform(params.data?.headers['content-length'] || '');
        },
        show: true,
        key: 'headers.content-length',
        dataKey: 'headers.content-length',
        type: 'length',
        properties: {
          name: 'Payload Size'
        },
        dataType: 'select'
      },
      {
        field : '_metadata.createAt',
        headerName : 'Start Time',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        valueFormatter : (params) => {
          return this.datePipe.transform(params.data?._metadata.createdAt, 'yyyy MMM dd, HH:mm:ss')||'';
        },
        show: true,
        key: '_metadata.createAt',
        dataKey: '_metadata.createAt',
        type: 'Date',
        properties: {
          name: 'Start Time'
        },
        dataType: 'Date'
      },
      {
        field : 'duration',
        headerName : 'Duration',
        sortable : true,
        filter : 'agTextColumnFilter',
        filterParams: filterOp,
        resizable : true,
        suppressMovable : true,
        valueFormatter : (params) => {
          return this.getDuration(params.data)||'';
        },
        show: true,
        key: 'duration',
        dataKey: 'duration',
        type: 'Date',
        properties: {
          name: 'Duration'
        },
        dataType: 'Date'
      }
    ]
  }

  sortChanged(event) {
    const self = this;
    const sortModel = self.agGrid?.api?.getSortModel();
    console.log(sortModel)
    let sort = '';
    if (sortModel) {
      sort = sortModel.map(e => (e.sort === 'asc' ? '' : '-') + e.colId).join(',');
    }
    self.apiConfig.sort = sort;
    self.sortModel = sort;
    if (!environment.production) {
      console.log('Sort Modified', sortModel);
    }
  }

  filterChanged(event, modFilter?) {
    const self = this;
    const filter = [];
    const filterModel = self.agGrid && self.agGrid.api && self.agGrid.api.getFilterModel();
    if (filterModel) {
      Object.keys(filterModel).forEach(key => {
        try {
          if (filterModel[key].filter) {
            var temp = JSON.stringify(filterModel[key].filter);
            let tempData = JSON.parse(temp)
            if (tempData['$or'] && tempData['$or'].length === 1) {
              tempData = tempData['$or'][0]
            }
            if(filterModel[key].type=="contains"){
              filter.push({[key]:'/'+tempData+'/'});
            }else if(filterModel[key].type=="notContains"){
              filter.push({[key]:{$not:'/'+tempData+'/'}});
            }else if(filterModel[key].type=="equals"){
              filter.push({[key]:tempData});
            } else if(filterModel[key].type=="notEqual"){
              filter.push({[key]:{$ne:tempData}});
            }
          }
        } catch (e) {
          console.error(e);
        }
      });
    }
    if (filter.length > 0) {
      self.apiConfig.filter = { $and: filter };
      self.filterModel = self.apiConfig.filter;
    } else {
      this.filterModel=null;
    }
    if (!environment.production) {
      console.log('Filter Modified', filterModel);
    }
    self.getRecordsCount()
  }

  clearFilter(clearGridModel = true) {
    const self = this;
    self.apiConfig.filter = null;
    self.filterModel = null;
    if (clearGridModel) {
      self.agGrid.api.setFilterModel(null);
    }
    // self.initRows(true);
  }

  getInteractions(flowId: string) {
    if(!this.filterModel){
      delete this.apiConfig.filter
    }
    if(!environment.production){
      console.log(this.filterModel)
    }
    console.log(this.apiConfig)
    return this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${flowId}`, this.apiConfig)
  }

  getRecordsCount(){
    var filter={}
    if(this.filterModel){
      filter = this.apiConfig.filter
    }
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${this.flowId}?countOnly=ture`,{ filter, expand: true })
    .subscribe(res => {
      this.currentRecordsCount=res;
      this.onGridReady();
      if (!environment.production) {
        console.log(this.currentRecordsCount);
      }
    })
  }

  onGridReady(event?) {
    const self = this;
    self.dataSource = {
      getRows: (params: IGetRowsParams) => {
        if (!environment.production) {
          console.log('getRows', params);
        }
        self.agGrid?.api?.showLoadingOverlay();
        self.showLoading = true;
        self.apiConfig.page = Math.ceil(params.endRow / 30);
        self.subscription['records'] = self.getInteractions(this.flowId).subscribe(records => {
          if (params.endRow - 30 < self.currentRecordsCount) {
            let loaded = params.endRow;
            if (loaded > self.currentRecordsCount) {
              loaded = self.currentRecordsCount;
            }
            self.agGrid?.api?.hideOverlay();
            self.showLoading = false;
            if (loaded === self.currentRecordsCount) {
              params.successCallback(records, self.currentRecordsCount);
            } else {
              params.successCallback(records, loaded + 1);
            }
          } else {
            self.agGrid?.api?.hideOverlay();
            if (self.currentRecordsCount == 0) {
              self.agGrid?.api?.showNoRowsOverlay();
            }
            params.successCallback([], self.currentRecordsCount);
          }
        }, err => {
          self.commonService.errorToast(err);
          self.showLoading = false;
          self.agGrid?.api?.hideOverlay();
          self.currentRecordsCount = 0;
          self.agGrid?.api?.showNoRowsOverlay();
        });
      }
    };
  }

  getContentType(contentType: string) {
    return this.flowsService.getContentType(contentType);
  }

  getStatusClass(item: any) {
    return this.flowsService.getStatusClass(item);
  }

  getDuration(item: any) {
    let text = '';
    if (item && item._metadata && item._metadata.createdAt && item._metadata.lastUpdated) {
      let startTime = new Date(item._metadata.createdAt).getTime();
      let endTime = new Date(item._metadata.lastUpdated).getTime();
      const duration = moment.duration(endTime - startTime);
      text = duration.minutes() + ' min, ' + duration.seconds() + ' sec, ' + duration.milliseconds() + ' ms';
      if (duration.hours() > 0) {
        text = `${duration.hours()} hr, ` + text;
      }
      return text;
    }
    return '-';
  }

  rowDoubleClicked(event: any) {
    this.router.navigate([event.data._id], { relativeTo: this.route });
  }
}
