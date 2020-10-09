import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import * as moment from 'moment';

@Component({
  selector: 'odp-interaction-grid-cell',
  templateUrl: './interaction-grid-cell.component.html',
  styleUrls: ['./interaction-grid-cell.component.scss']
})
export class InteractionGridCellComponent implements OnInit, ICellRendererAngularComp {

  params: any;
  data: any;
  id: string;
  value: any;
  rawValue: any;
  field: string;
  direction: string;
  // inputType: string;
  // outputType: string;
  reDownloadAvaiable: boolean;
  constructor() { }

  ngOnInit(): void {
  }

  agInit(params: ICellRendererParams): void {
    const self = this;
    self.params = params;
    self.field = params.colDef.field;
    self.data = params.data || {};
    self.id = self.data._id;
    self.value = params.value;
    if (self.data && self.data.flowData) {
      self.direction = self.data.flowData.direction;
      if (!self.direction) {
        self.direction = 'Inbound';
      }
      if (self.data.redownloadMeta && self.data.status === 'ERROR') {
        self.reDownloadAvaiable = true;
      }
      self.rawValue = self.value;
      // self.inputType = self.data.flowData.inputType;
      // self.outputType = self.data.flowData.outputType;
      if (self.field === 'flowData.inputType') {
        self.value = self.inputType + '-' + self.outputType;
      } else if (self.field === 'duration') {
        self.value = '...';
        self.calculateDuration();
      } else if (self.field === 'status') {
        self.calculateStatus();
      }
    }
  }

  calculateDuration() {
    const self = this;
    let createdTime;
    let completedTime;
    if (self.data.createTimestamp) {
      createdTime = new Date(self.data.createTimestamp).getTime();
    }
    if (self.data.completedTimestamp) {
      completedTime = new Date(self.data.completedTimestamp).getTime();
    }
    if (createdTime && completedTime) {
      const interval = Math.abs(completedTime - createdTime);
      const duration = moment.duration(interval);
      self.value = duration.minutes() + ' min, ' + duration.seconds() + ' sec, ' + duration.milliseconds() + ' ms';
      if (duration.hours() > 0) {
        self.value = `${duration.hours()} hr, ` + self.value;
      }
    }
  }

  calculateStatus() {
    const self = this;
    switch (self.rawValue) {
      case 'SUCCESS':
        self.value = 'Successful';
        break;
      case 'ERROR':
        self.value = 'Failed';
        break;
      case 'PENDING':
        self.value = 'Pending';
        break;
      case 'QUEUED':
        self.value = 'Queued';
        break;
      case 'UNKNOWN':
        self.value = 'Unknown';
        break;
      default:
        self.rawValue = 'QUEUED';
        self.value = 'Queued';
    }
  }

  refresh(params: any): boolean {
    const self = this;
    return true;
  }

  afterGuiAttached(params?: IAfterGuiAttachedParams): void {
    const self = this;
  }

  get inputType() {
    const self = this;
    if (self.data && self.data.flowData) {
      return self.data.flowData.inputType;
    }
  }

  get outputType() {
    const self = this;
    if (self.data && self.data.flowData) {
      return self.data.flowData.outputType;
    }
  }

  get showCompletionTime() {
    const self = this;
    if (self.data && (self.data.status === 'ERROR' || self.data.status === 'SUCCESS')) {
      return true;
    }
    return false;
  }
}
