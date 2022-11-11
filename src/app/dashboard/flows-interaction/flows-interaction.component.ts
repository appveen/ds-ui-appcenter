import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AgGridColumn } from 'ag-grid-angular';
import * as moment from 'moment';

import { FileSizePipe } from 'src/app/pipes/file-size.pipe';
import { CommonService } from 'src/app/service/common.service';
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
  constructor(private commonService: CommonService,
    private route: ActivatedRoute,
    private flowsService: FlowsInteractionService,
    private datePipe: DatePipe,
    private fileSizePipe: FileSizePipe,
    private router: Router) {
    this.interactionList = [];
    this.columnDefs = [];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.getInteractions(params.flowId);
    });
    this.configureColumns();
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
    col.valueGetter = (params) => {
      return params.data.headers['data-stack-txn-id'];
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
    col.valueGetter = (params) => {
      return params.data.headers['data-stack-remote-txn-id']
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
      return this.getStatusClass(params.data) + ' fw-500';
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
    col.valueGetter = (params) => {
      return this.getContentType(params.data.headers['content-type']);
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
    col.valueGetter = (params) => {
      return this.fileSizePipe.transform(params.data.headers['content-length']);
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = '_metadata.createAt';
    col.headerName = 'Start Time';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.valueGetter = (params) => {
      return this.datePipe.transform(params.data._metadata.createdAt, 'yyyy MMM dd, HH:mm:ss');
    }
    this.columnDefs.push(col);
    col = new AgGridColumn();
    col.field = 'duration';
    col.headerName = 'Duration';
    col.sortable = true;
    col.filter = 'agTextColumnFilter';
    col.resizable = true;
    col.suppressMovable = true;
    col.valueGetter = (params) => {
      return this.getDuration(params.data);
    }
    this.columnDefs.push(col);
  }

  getInteractions(flowId: string) {
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${flowId}`, { sort: '-_metadata.createdAt', count: 50 }).subscribe(res => {
      this.interactionList = res;
      if (!environment.production) {
        console.log(res);
      }
    }, err => {
      console.error(err);
    })
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
