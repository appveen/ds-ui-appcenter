import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridColumn, AgGridAngular } from 'ag-grid-angular';
import { GridOptions, IDatasource, IGetRowsParams } from 'ag-grid-community';
import * as moment from 'moment';

import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { FlowsInteractionService } from './flows-interaction.service';

@Component({
  selector: 'odp-flows-interaction',
  templateUrl: './flows-interaction.component.html',
  styleUrls: ['./flows-interaction.component.scss'],
  providers: [DatePipe, FileSizePipe]
})
export class FlowsInteractionComponent implements OnInit {

  interactionList: Array<any>;
  columnDefs: Array<AgGridColumn>;
  apiConfig: GetOptions;
  @ViewChild('agGrid', { static: false }) agGrid: AgGridAngular;
  gridOptions: GridOptions
  flowId;
  dataSource: IDatasource;
  showLoading: boolean;
  subscription: any={};
  noRowsTemplate;
  currentRecordsCount: number;
  sortModel: any;
  constructor(private commonService: CommonService,
    private route: ActivatedRoute,
    private flowsService: FlowsInteractionService,
    private datePipe: DatePipe,
    private fileSizePipe: FileSizePipe,
    private router: Router) {
    this.interactionList = [];
    this.columnDefs = [];
    this.noRowsTemplate = '<span>No Interaction Found.</span>';
    this.apiConfig={
      sort:'-_metadata.createdAt',
      count : 30,
      page:1
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.flowId=params.flowId;
      this.getRecordsCount()
      this.onGridReady()
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

  configureColumns() {
    let col = new AgGridColumn();
    col.field = '_id';
    col.headerName = 'ID';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.cellClass = 'fw-500';
    col.width = 120;
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'headers';
    col.headerName = 'Txn ID';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.width = 360;
    col.valueFormatter = (params) => {
      return params.data?.headers['data-stack-txn-id'] || '';
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'headers';
    col.headerName = 'Remote ID';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.width = 360;
    col.valueFormatter = (params) => {
      return params.data?.headers['data-stack-remote-txn-id'] || ''
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'status';
    col.headerName = 'Status';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.width = 140;
    col.cellClass = (params) => {
      if(params.data){
        return this.getStatusClass(params.data) + ' fw-500';
      }
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'headers';
    col.headerName = 'Payload Type';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.width = 140;
    col.valueFormatter = (params) => {
      return this.getContentType(params.data?.headers['content-type'] || '');
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'headers';
    col.headerName = 'Payload Size';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.width = 140;
    col.valueFormatter = (params) => {
      return this.fileSizePipe.transform(params.data?.headers['content-length'] || '');
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = '_metadata.createAt';
    col.headerName = 'Start Time';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.valueFormatter = (params) => {
      return this.datePipe.transform(params.data?._metadata.createdAt, 'yyyy MMM dd, HH:mm:ss')||'';
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'duration';
    col.headerName = 'Duration';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.valueFormatter = (params) => {
      return this.getDuration(params.data)||'';
    }
    this.columnDefs.push(col);
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

  getInteractions(flowId: string) {
    console.log(this.apiConfig)
    return this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${flowId}`, this.apiConfig)
  }

  getRecordsCount(){
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${this.flowId}?countOnly=ture`)
    .subscribe(res => {
      this.currentRecordsCount=res;
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
