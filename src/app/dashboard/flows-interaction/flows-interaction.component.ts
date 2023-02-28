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
  subscription: any = {};
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
    // self.savedViews = [];
    // self.savedViewApiConfig = {
    //   page: 1,
    //   count: 10
    // };
    this.noRowsTemplate = '<span>No Interaction Found.</span>';
    this.apiConfig = {
      sort: '-_metadata.createdAt',
      count: 30,
      page: 1
    }
   }

  ngOnInit(): void {
    const self=this;
    this.route.params.subscribe(params => {
      this.flowId=params.flowId;
      this.resetFilter();
    });
    this.configureColumns();
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscription).forEach(key => {
      if (self.subscription[key]) {
        self.subscription[key].unsubscribe();
      }
    });
  }

  selectSavedView(evnt) {
    const view = evnt.query || evnt;
    const self = this;
    if (!environment.production) {
      console.log('selectSavedView', view);
    }
    const allColumns = this.agGrid.columnApi.getAllColumns();
    this.agGrid.columnApi.setColumnsVisible(allColumns, false);
    const select=view.select?.split(',');
    select?.forEach((selectItem, index) => {
      const column = allColumns.find(col => {
        const colId = col.getColId();
        return selectItem === colId || selectItem.indexOf(colId + '.') === 0;
      });
      if (!!column) {
        this.agGrid.columnApi.setColumnVisible(column, true);
        Object.keys(column).forEach(e=>this.agGrid.columnApi.moveColumn(e, index));
      }
    });

    if(view.filter){
      var filter=[]
      view.filter?.forEach(e=>{
        filter.push(e.filterObject)
      })
      console.log(filter)

      if (filter.length > 0) {
        self.apiConfig.filter = { $and: filter };
        self.filterModel = self.apiConfig.filter;
      } else {
        this.filterModel=null;
      }
      self.getRecordsCount();
    }

    if (view.filter || view.sort || view.select) {
      self.selectedSavedView = { value: view };
      self.listFilters.selectFilter({ value: view }, true);
      self.appService.existingFilter = { value: view };
    }
    if (evnt.close) {
      self.advanceFilter = false;
    }
  }

  onRefine(event) {
    this.agGrid.api.refreshInfiniteCache();
    this.selectSavedView(event);

  }

  resetFilter() {
    const self = this;
    self.apiConfig.filter = null;
    self.filterModel = null;
    self.agGrid?.api?.setFilterModel(null);
    this.flowsService?.onFloatingFilterChange(null);
    this.agGrid?.api?.refreshInfiniteCache()
    self.sortModel = null;
    self.filterModel=null;
    self.flowsService.inlineFilterActive = null;
    self.flowsService.selectedSavedView = null;
    self.apiConfig.sort = '-_metadata.createdAt';
    this.flowsService.setSortModel(self.apiConfig.sort)
    self.agGrid?.api?.setSortModel(null);
    const columnIds = self.agGrid?.columnApi?.getAllColumns().map(e => e.getColId());
    self.agGrid?.columnApi?.setColumnsVisible(columnIds, true);
    columnIds?.forEach((e, i) => {
      self.agGrid.columnApi.moveColumn(e, i);
    });
    self.selectedSavedView = null;
    self.appService.existingFilter = null;
    this.getRecordsCount();
    // self.initRows();
    // self.savedViews = [];
    // self.advanceFilter = showAdvancedFilter;
    // self.selectedSearch = null;
    // if (self.lastFilterAppliedPrefId) {
    //   self.deleteLastFilterApplied();
    // }
    // self.filterSavedViews();
  }

  clearFilter(clearGridModel = true) {
    const self = this;
    self.apiConfig.filter = null;
    self.filterModel = null;
    if (clearGridModel) {
      self.agGrid?.api?.setFilterModel(null);
    }
  }

  configureColumns() {
    const filterOp = {
      filterOptions: [
        'contains', 'notContains', 'equals', 'notEqual'
      ],
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
        key: 'headers.content-length',
        dataKey: 'headers.content-length',
        type: 'length',
        properties: {
          name: 'Payload Size'
        },
        dataType: 'select'
      },
      {
        field : '_metadata.createdAt',
        headerName : 'Start Time',
        sortable : true,
        filter : 'agDateColumnFilter',
        filterParams: { filterOptions: [
          'equals', 'greaterThan', 'lessThan', 'inRange'
        ],
          suppressAndOrCondition: true
        },
        resizable : true,
        suppressMovable : true,
        valueFormatter : (params) => {
          return this.datePipe.transform(params.data?._metadata.createdAt, 'yyyy MMM dd, HH:mm:ss')||'';
        },
        key: '_metadata.createdAt',
        dataKey: '_metadata.createdAt',
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

  filterModified(event, modFilter?) {
    const self = this;
    const filter = [];
    const filterModel = self.agGrid && self.agGrid.api && self.agGrid.api.getFilterModel();
    if (filterModel) {
      Object.keys(filterModel).forEach(key => {
        try {
          if (filterModel[key].filter) {
            var temp = JSON.stringify(filterModel[key].filter);
            let tempData = JSON.parse(temp)
            if (filterModel[key].type == "contains") {
              filter.push({ [key]: '/' + tempData + '/' });
            } else if (filterModel[key].type == "notContains") {
              filter.push({ [key]: { $not: '/' + tempData + '/' } });
            } else if (filterModel[key].type == "equals") {
              filter.push({ [key]: tempData });
            } else if (filterModel[key].type == "notEqual") {
              filter.push({ [key]: { $ne: tempData } });
            }
          }else if(filterModel[key].filterType=='date'){
            const dateFrom= new Date(filterModel[key].dateFrom)
            const toDate=new Date(filterModel[key].dateFrom);
            toDate.setDate(toDate.getDate() + 1);
            const frmDateZone=dateFrom.getTimezoneOffset()
            const toDateZone=toDate.getTimezoneOffset()
            dateFrom.setHours(Math.floor(Math.abs(frmDateZone)/60), Math.abs(frmDateZone)%60, 0, 0);
            toDate.setHours(Math.floor(Math.abs(toDateZone)/60), Math.abs(toDateZone)%60, 0, 0);
            toDate.setMilliseconds(toDate.getMilliseconds() - 1);
            if(filterModel[key].type=="equals"){
              filter.push({[key]:{"$gte":dateFrom,"$lte":toDate}});
            }else if(filterModel[key].type=="greaterThan"){
              filter.push({[key]:{"$gt":dateFrom}});
            }else if(filterModel[key].type=="lessThan"){
              filter.push({[key]:{"$lt":dateFrom}});
            }else if(filterModel[key].type=="inRange"){
              const dateTo=new Date(filterModel[key].dateTo)
              const dateToZone=dateTo.getTimezoneOffset()
              dateTo.setHours(Math.floor(Math.abs(dateToZone)/60), Math.abs(dateToZone)%60, 0, 0);
              filter.push({[key]:{"$gte":dateFrom,"$lte":dateTo}});
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
      this.filterModel = null;
    }
    if (!environment.production) {
      console.log('Filter Modified', filterModel);
    }
    self.getRecordsCount()
  }
  
  getInteractions(flowId: string) {
    if (!this.filterModel) {
      delete this.apiConfig.filter
    }
    if (!environment.production) {
      console.log(this.filterModel)
    }
    console.log(this.apiConfig)
    return this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${flowId}`, this.apiConfig)
  }

  getRecordsCount() {
    var filter = {}
    if (this.filterModel) {
      filter = this.apiConfig.filter
    }
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${this.flowId}?countOnly=true`, { filter, expand: true })
      .subscribe(res => {
        this.currentRecordsCount = res;
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
