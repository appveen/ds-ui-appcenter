import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import * as _ from 'lodash';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-validation-result',
  templateUrl: './validation-result.component.html',
  styleUrls: ['./validation-result.component.scss']
})
export class ValidationResultComponent implements OnInit {

  @Input() schema: any;
  @Input() transfersData: any;
  @Input() update: Array<any>;
  @Output() updateChange: EventEmitter<Array<any>>;
  @Input() create: Array<number>;
  @Output() createChange: EventEmitter<Array<number>>;
  @Output() importData: EventEmitter<any>;
  api: string;
  showErrorRecords: boolean;
  showValidRecords: boolean;
  showConflictRecords: boolean;
  showDuplicateRecords: boolean;
  subscriptions: any;
  apiCalls: any;
  uniqueFirst: Array<number>;
  duplicateIds: Array<number>;
  conflictIds: Array<number>;
  fileCorrupted: boolean;
  totalRecords: number;
  constructor(private commonService: CommonService) {
    const self = this;
    self.subscriptions = {};
    self.apiCalls = {};
    self.transfersData = {};
    self.schema = {};
    self.uniqueFirst = [];
    self.duplicateIds = [];
    self.conflictIds = [];
    self.update = [];
    self.updateChange = new EventEmitter();
    self.create = [];
    self.createChange = new EventEmitter();
    self.importData = new EventEmitter();
    self.fileCorrupted = true;
  }

  ngOnInit() {
    const self = this;
    self.api = '/' + self.schema.app + self.schema.api;
    if (self.transfersData.validCount > 0 || self.transfersData.conflictCount > 0 || self.transfersData.duplicateCount > 0) {
      self.fileCorrupted = false;
    }
    self.totalRecords = self.transfersData.validCount
      + self.transfersData.conflictCount
      + self.transfersData.errorCount
      + self.transfersData.duplicateCount;
  }

  ignoreConflictRecords() {
    const self = this;
    self.conflictIds.forEach(item => {
      const index = self.update.indexOf(item);
      if (index > -1) {
        self.update.splice(index, 1);
      }
    });
    self.conflictIds = [];
    self.update.splice(0);
    self.onUpdateChange([]);
  }

  ignoreDuplicateRecords() {
    const self = this;
    self.duplicateIds.forEach(item => {
      const index = self.create.indexOf(item);
      if (index > -1) {
        self.create.splice(index, 1);
      }
    });
    self.duplicateIds = [];
    self.create.splice(0);
    self.onCreateChange([]);
  }

  updateExistingRecords() {
    const self = this;
    self.apiCalls.updateExistingRecords = true;
    const opt = {
      filter: { conflict: true, status: 'Duplicate' },
      count: -1,
      select: 'sNo,data._id',
      sort: 'sNo'
    };
    self.subscriptions['fileMapperCreate'] = self.commonService
      .get('api', self.api + '/utils/fileMapper/' + self.transfersData.fileId, opt)
      .subscribe(res => {
        self.apiCalls.updateExistingRecords = false;
        // self.conflictIds = res.map(e => e.sNo);
        self.conflictIds = _.uniqBy(res, 'data._id').map(e => e.sNo);
        self.update.splice(0);
        self.onUpdateChange(self.conflictIds);
      }, err => {
        self.apiCalls.updateExistingRecords = false;
        self.commonService.errorToast(err, 'Unable to get the records,please try again later');
      });
  }

  importFirstOccurance() {
    const self = this;
    self.apiCalls.importFirstOccurance = true;
    const opt = {
      filter: { conflict: false, status: 'Duplicate' },
      count: -1,
      select: 'sNo, data._id',
      sort: 'sNo'
    };
    self.subscriptions['fileMapperCreate'] = self.commonService
      .get('api', self.api + '/utils/fileMapper/' + self.transfersData.fileId, opt)
      .subscribe(res => {
        self.apiCalls.importFirstOccurance = false;
        self.duplicateIds = res.map(e => e.sNo);
        self.uniqueFirst = _.uniqBy(res, 'data._id').map(e => e.sNo);
        self.create.splice(0);
        self.onCreateChange(self.uniqueFirst);
      }, err => {
        self.apiCalls.importFirstOccurance = false;
        self.commonService.errorToast(err, 'Unable to get the records,please try again later');
      });
  }

  importRecords() {
    const self = this;
    self.update = _.uniq(self.update.filter(e => e !== 'Original'));
    self.updateChange.emit(self.update);
    self.create = _.uniq(self.create);
    self.createChange.emit(self.create);
    self.importData.emit();
  }

  onUpdateChange(event) {
    const self = this;
    self.update = self.update.concat(event);
    self.update = _.uniq(self.update);
    self.updateChange.emit(self.update);
  }

  onCreateChange(event) {
    const self = this;
    self.create = self.create.concat(event);
    self.create = _.uniq(self.create);
    self.createChange.emit(self.create);
  }

  get apiCallsPending() {
    const self = this;
    if (Object.values(self.apiCalls).length > 0) {
      return Object.values(self.apiCalls).every(e => e);
    }
    return false;
  }

  get selectedDuplicates() {
    const self = this;
    return self.create.length;
  }

  get selectedConflicts() {
    const self = this;
    return self.update.filter(e => e !== 'Original').length;
  }
}
