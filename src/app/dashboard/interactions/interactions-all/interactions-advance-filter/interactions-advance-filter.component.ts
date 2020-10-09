import { Component, OnInit, Input, Output, EventEmitter, ViewChild, TemplateRef } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';

import * as _ from 'lodash';
import { InteractionsService } from '../../interactions.service';

@Component({
  selector: 'odp-interactions-advance-filter',
  templateUrl: './interactions-advance-filter.component.html',
  styleUrls: ['./interactions-advance-filter.component.scss']
})
export class InteractionsAdvanceFilterComponent implements OnInit {

  @ViewChild('clearFilterModal') clearFilterModal: TemplateRef<HTMLElement>;
  @Input() toggleFilter: any;
  @Output() toggleFilterChange: EventEmitter<any>;
  @Input() filterQuery: any;
  @Output() filterQueryChange: EventEmitter<any>;
  @Input() filterData: any;
  @Output() filterDataChange: EventEmitter<any>;
  possibleValues: any;
  clearFilterModalRef: NgbModalRef;
  constructor(private commonService: CommonService,
    private appService: AppService,
    private flowService: InteractionsService,
    private modalService: NgbModal) {
    const self = this;
    self.toggleFilterChange = new EventEmitter();
    self.filterQueryChange = new EventEmitter();
    self.filterDataChange = new EventEmitter();
    self.possibleValues = {
      status: ['ERROR', 'SUCCESS', 'PENDING', 'UNKNOWN', 'QUEUED'],
      'flowData.direction': ['Inbound', 'Outbound'],
      type: [
        { 'flowData.inputType': 'FILE', 'flowData.outputType': 'FILE' },
        { 'flowData.inputType': 'FILE', 'flowData.outputType': 'API' },
        { 'flowData.inputType': 'API', 'flowData.outputType': 'API' },
        { 'flowData.inputType': 'API', 'flowData.outputType': 'FILE' }
      ]
    };
    self.filterData = {
      status: [false, false, false, false, false],
      'flowData.direction': [false, false],
      type: [false, false, false, false]
    };
  }

  ngOnInit() {
    const self = this;
    if (!self.filterData) {
      self.resetFilters();
    }
  }

  resetFilters() {
    const self = this;
    self.filterQuery = null;
    self.filterData = {
      status: [false, false, false, false, false],
      'flowData.direction': [false, false],
      type: [false, false, false, false],
      fromDate: null,
      toDate: null
    };
  }

  applyFilters() {
    const self = this;
    if (self.flowService.filterApplied && self.flowService.filterApplied === 'inline') {
      self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
      self.clearFilterModalRef.result.then(close => {
        if (close) {
          self.flowService.filterApplied = 'advance';
          self.filterQueryChange.emit(self.filterQuery);
          self.filterDataChange.emit(self.filterData);
          self.flowService.applyingFilter.emit('advance');
          // self.appService.clearFilterEvent.emit(true);
        }
      }, dismiss => { });
    } else {
      self.flowService.filterApplied = 'advance';
      self.filterQueryChange.emit(self.filterQuery);
      self.filterDataChange.emit(self.filterData);
    }
  }

  close() {
    const self = this;
    self.filterDataChange.emit(self.filterData);
    self.toggleFilterChange.emit(false);
  }

  calcFilters() {
    const self = this;
    const andGroup = [];
    let values;
    values = self.possibleValues.status.map((e, i) => self.filterData.status[i] ? e : null).filter(e => e);
    if (values && values.length > 0) {
      andGroup.push({ status: { $in: values } });
    }
    values = self.possibleValues['flowData.direction'].map((e, i) => self.filterData['flowData.direction'][i] ? e : null).filter(e => e);
    if (values && values.length > 0) {
      andGroup.push({ 'flowData.direction': { $in: values } });
    }
    values = self.possibleValues.type.map((e, i) => self.filterData.type[i] ? e : null).filter(e => e);
    if (values && values.length > 0) {
      andGroup.push({ $or: values });
    }
    const temp = {};
    if (self.filterData.fromDate) {
      temp['$gte'] = new Date(self.filterData.fromDate).toISOString();
    }
    if (self.filterData.toDate) {
      temp['$lte'] = new Date(self.filterData.toDate).toISOString();
    }
    if (Object.keys(temp).length > 0) {
      andGroup.push({ createTimestamp: temp });
    }
    if (andGroup.length > 0) {
      self.filterQuery = { $and: andGroup };
    } else {
      self.filterQuery = null;
    }
    self.filterDataChange.emit(self.filterData);
  }

  quickTime(duration: number) {
    const self = this;
    const fromDate = new Date();
    self.filterData.toDate = moment(new Date()).format('YYYY-MM-DDTHH:mm');
    fromDate.setHours(fromDate.getHours() - duration);
    self.filterData.fromDate = moment(fromDate).format('YYYY-MM-DDTHH:mm');
    self.calcFilters();
  }
}
