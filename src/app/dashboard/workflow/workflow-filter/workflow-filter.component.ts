import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, TemplateRef } from '@angular/core';
import { trigger, state, style, transition, animate, keyframes } from '@angular/animations';
import { Observable, Subject, merge } from 'rxjs';
import { filter, debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';
import { NgbModal, NgbTypeahead, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { WorkflowService } from 'src/app/dashboard/workflow/workflow.service';
import { SessionService } from 'src/app/service/session.service';

interface FilterData {
  serviceId: string;
  name: string;
  private?: boolean;
  value: string;
  app: string;
  createdBy: string;
  type?: string;
  hasOptions?: boolean;
}
@Component({
  selector: 'odp-workflow-filter',
  templateUrl: './workflow-filter.component.html',
  styleUrls: ['./workflow-filter.component.scss'],
  animations: [
    trigger('toggleApplyFilter', [
      state(
        'void',
        style({
          display: 'block'
        })
      ),
      transition('void => *', [
        animate(
          '250ms ease-in',
          keyframes([
            style({
              opacity: 0,
              transform: 'translateY(-20px)'
            }),
            style({
              opacity: 1,
              transform: 'translateY(0px)'
            })
          ])
        )
      ]),
      transition('* => void', [
        animate(
          '250ms ease-in',
          keyframes([
            style({
              opacity: 0.7,
              transform: 'translateY(-10px)'
            }),
            style({
              opacity: 0.5,
              transform: 'translateY(-15px)'
            }),
            style({
              opacity: 0,
              transform: 'translateY(-20px)'
            })
          ])
        )
      ])
    ]),
    trigger('toggleSaveFilter', [
      state(
        'void',
        style({
          display: 'block'
        })
      ),
      transition('void => *', [
        animate(
          '250ms ease-in',
          keyframes([
            style({
              opacity: 0,
              transform: 'translateY(20px)'
            }),
            style({
              opacity: 1,
              transform: 'translateY(0px)'
            })
          ])
        )
      ]),
      transition('* => void', [
        animate(
          '250ms ease-in',
          keyframes([
            style({
              opacity: 0.7,
              transform: 'translateY(10px)'
            }),
            style({
              opacity: 0.5,
              transform: 'translateY(15px)'
            }),
            style({
              opacity: 0,
              transform: 'translateY(20px)'
            })
          ])
        )
      ])
    ]),
    trigger('filterList', [
      state(
        'void',
        style({
          transformOrigin: 'right top',
          transform: 'scale(0)'
        })
      ),
      transition('void => *', [
        animate(
          '250ms ease-in',
          style({
            transform: 'scale(1)'
          })
        )
      ]),
      transition('* => void', [
        style({ transformOrigin: 'right top' }),
        animate(
          '250ms ease-out',
          style({
            transform: 'scale(0)'
          })
        )
      ])
    ])
  ]
})
export class WorkflowFilterComponent implements OnInit, OnDestroy {
  @ViewChild('inputInstance', { static: false }) inputInstance: NgbTypeahead;
  @ViewChild('confirmDeleteModal', { static: false })
  confirmDeleteModal: TemplateRef<HTMLElement>;
  @Output() filterString: EventEmitter<any>;
  @Output() getAllfilters: EventEmitter<any>;
  @Output() clearFilters: EventEmitter<any>;
  @Input() allFilters: any;

  @Input() serviceId: string;
  @Input() definition: any;
  @Input('dataColumns') allColumns: Array<any>;
  confirmDeleteModalRef: NgbModalRef;
  deleteModal: {
    title: string;
    message: string;
  };
  config: any;
  filter: any;
  placeHolderText: string;
  filterHelperArr: Array<any>;
  sortingColumns: Array<any>;
  selectedColOrder: Array<any>;
  saveOrEditText: String;
  filterData: FilterData;
  invalidFilterName: boolean;
  showSaveDiv: boolean;
  showFilterList: boolean;
  filterId: string;
  filterCreatedBy: string;
  searchForColumn: Array<any>;
  sortingOptions: Array<any>;
  checked: boolean;
  subscriptions: any;
  statusArray: Array<any>;
  typeArray: Array<any>;
  name: string;
  focus$ = new Subject<string>();
  click$ = new Subject<string>();
  defaultColums: Array<any>;
  showSeparateCreateBtn: boolean;
  hasOptions = true;

  constructor(
    private appService: AppService,
    private ts: ToastrService,
    private modalService: NgbModal,
    private commonService: CommonService,
    private sessionService: SessionService,
    private wfService: WorkflowService
  ) {
    const self = this;
    self.placeHolderText = 'Select Filter';
    self.filterString = new EventEmitter<any>();
    self.getAllfilters = new EventEmitter<any>();
    self.clearFilters = new EventEmitter<any>();
    self.filter = {};
    self.filterHelperArr = [];
    self.sortingColumns = [];
    self.allColumns = [];
    self.selectedColOrder = [];
    self.saveOrEditText = '+Save As New View';
    self.showSeparateCreateBtn = false;
    self.filterData = {
      serviceId: self.appService.serviceId,
      name: '',
      private: true,
      value: '',
      app: self.commonService.app._id,
      createdBy: self.sessionService.getUser(true)._id
    };
    self.invalidFilterName = false;
    self.showSaveDiv = false;
    self.placeHolderText = 'Select Filter';
    self.showFilterList = false;
    self.filterId = null;
    self.searchForColumn = [];
    self.sortingOptions = [
      {
        name: 'Ascending',
        value: '1'
      },
      {
        name: 'Descending',
        value: '-1'
      }
    ];
    self.subscriptions = {};
    self.config = { filter: {} };
    self.typeArray = [];
    self.statusArray = [];
    self.deleteModal = {
      title: 'Delete column',
      message: 'Are you sure you want to delete this column?'
    };
    self.defaultColums = [
      {
        properties: { name: 'Workflow ID' },
        fieldType: 'String',
        fieldName: '_id'
      },
      {
        properties: { name: 'Record ID' },
        fieldType: 'String',
        fieldName: 'documentId'
      },
      {
        properties: { name: 'Submitted By' },
        fieldType: 'String',
        fieldName: 'requestedBy'
      },
      {
        properties: { name: 'Submitted On' },
        fieldType: 'Date',
        fieldName: '_metadata.lastUpdated'
      }
    ];
  }

  ngOnInit() {
    const self = this;
    if (self.appService.workflowFilter) {
      setTimeout(() => {
        self.selectFilter(self.appService.workflowFilter);
      }, 400);
    }
    self.subscriptions['refreshCall'] = self.wfService.refreshCall.subscribe(_refreshToken => {
      if (_refreshToken) {
        self.clearFilter();
      }
    });
  }

  applyFilter(close?: boolean) {
    const self = this;
    if (self.sortingColumns && Array.isArray(self.sortingColumns) && self.sortingColumns.length) {
      self.config.sort = self.sortingColumns;
    } else {
      delete self.config.sort;
    }
    if (self.config.filter && self.config.filter.$and && self.config.filter.$and.length < 1) {
      delete self.config.filter.$and;
    }
    // self.selectedColOrder.forEach(e => e.dataKey = e.dataKey.replace('data.new.', ''));
    // self.selectedColOrder.forEach(e => e.dataKey = e.dataKey.replace('data.old.', ''));
    self.config.columns = self.selectedColOrder;
    self.config.select = self.selectedColOrder.map(e => e.key).join(',');

    self.appService.workflowFilter = self.appService.cloneObject(self.config);
    self.filterString.emit({ view: self.config, close });
  }

  createSortQuery(item) {
    return item
      .map(e => {
        if (e.selectedOption === '1') {
          return e.name;
        } else if (e.selectedOption === '-1') {
          return '-' + e.name;
        }
      })
      .filter(e => e)
      .join(',');
  }

  filterChange(val, filterType, type) {
    const self = this;
    if (val) {
      if (filterType === 'status') {
        self.statusArray.push(type);
      } else {
        self.typeArray.push(type);
      }
    } else {
      if (filterType === 'status') {
        const index = self.statusArray.findIndex(e => e === type);
        if (index > -1) {
          self.statusArray.splice(index, 1);
        }
      } else {
        const index = self.typeArray.findIndex(e => e === type);
        if (index > -1) {
          self.typeArray.splice(index, 1);
        }
      }
    }
    let operationIndex = -1;
    let statusIndex = -1;
    if (self.config && self.config.filter && !self.config.filter.$and) {
      self.config.filter.$and = [];
    }
    self.config.filter.$and.forEach((element, index) => {
      const keys = Object.keys(element);
      const indx = keys.findIndex(e => e === 'operation');
      if (indx > -1) {
        operationIndex = index;
      }
      const indx1 = keys.findIndex(e => e === 'status');
      if (indx1 > -1) {
        statusIndex = index;
      }
    });

    if (statusIndex > -1 && self.statusArray.length > 0) {
      self.config.filter.$and[statusIndex]['status'] = {
        $in: self.statusArray
      };
    } else if (self.statusArray.length > 0) {
      self.config.filter.$and.push({ status: { $in: self.statusArray } });
    } else if (statusIndex > -1) {
      self.config.filter.$and.splice(statusIndex, 1);
    }
    if (operationIndex > -1 && self.typeArray.length > 0) {
      self.config.filter.$and[operationIndex]['operation'] = {
        $in: self.typeArray
      };
    } else if (self.typeArray.length > 0) {
      self.config.filter.$and.push({ operation: { $in: self.typeArray } });
    } else if (operationIndex > -1) {
      self.config.filter.$and.splice(operationIndex, 1);
    }
  }

  createNoDateFilter(item) {
    const self = this;
    if (item.filterType === 'equals' && item.filterValue) {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: item['filterValue'],
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj);
    } else if (item.filterType === 'contains' && item.filterValue) {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: `/${item['filterValue']}/`,
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj);
    } else if (item.filterType === 'notEqual' && item.filterValue) {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $ne: item['filterValue'] },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj);
    } else if (item.filterType === 'notContains' && item.filterValue) {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $not: `/${item['filterValue']}/` },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj);
    } else if (item.filterType === 'greaterThan' && item.filterValue) {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $gt: `/${item['filterValue']}/` },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj);
    } else if (item.filterType === 'lessThan' && item.filterValue) {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $lt: `/${item['filterValue']}/` },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj);
    }
  }

  createRelFilter(item) {
    const self = this;
    let prefix = 'data.new.';
    if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
      prefix = 'data.old.';
    }
    if (item.filterType === 'equals' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: item.filterValue };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (item.filterType === 'contains' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: `/${item['filterValue']}/` };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (item.filterType === 'notEqual' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }

      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol]: { $nin: [item['filterValue'], null] }
        };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (
      item.filterType === 'notContains' &&
      item.filterValue !== null &&
      item.filterValue !== 'undefined' &&
      item.filterValue !== ''
    ) {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol]: { $not: `/${item['filterValue']}/`, $ne: null }
        };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (
      item.filterType === 'greaterThan' &&
      item.filterValue !== null &&
      item.filterValue !== 'undefined' &&
      item.filterValue !== ''
    ) {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: { $gt: item['filterValue'] } };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (item.filterType === 'lessThan' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: { $lt: item['filterValue'] } };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    }
  }

  createDSColFilter(item) {
    const self = this;
    let prefix = 'data.new.';
    if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
      prefix = 'data.old.';
    }

    if (item.filterType === 'equals' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: item.filterValue };

        self.insertDataInHelperArr(tempObj1);
      });
    } else if (item.filterType === 'contains' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: `/${item['filterValue']}/` };
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (item.filterType === 'notEqual' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol]: { $nin: [item['filterValue'], null] }
        };
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (
      item.filterType === 'notContains' &&
      item.filterValue !== null &&
      item.filterValue !== 'undefined' &&
      item.filterValue !== ''
    ) {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol]: { $not: `/${item['filterValue']}/`, $ne: null }
        };
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (
      item.filterType === 'greaterThan' &&
      item.filterValue !== null &&
      item.filterValue !== 'undefined' &&
      item.filterValue !== ''
    ) {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: { $gt: item['filterValue'] } };
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (item.filterType === 'lessThan' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol]: { $lt: item['filterValue'] } };
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (
      item.filterType === 'inRange' &&
      item.fieldType === 'Number' &&
      item.fromNumber !== null &&
      item.fromNumber !== undefined &&
      item.toNumber !== null &&
      item.toNumber !== undefined
    ) {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol]: {
            $gte: item['fromNumber'],
            $lte: item['toNumber']
          }
        };
        self.insertDataInHelperArr(tempObj1);
      });
    }
  }

  createFilter(event) {
    const self = this;
    self.filterHelperArr = [];
    if (self.config && self.config.filter && self.config.filter.$and) {
      const tempArray = self.config.filter.$and;
      self.config.filter.$and = tempArray.filter(e => Object.keys(e)[0] === 'status' || Object.keys(e)[0] === 'operation');
    }
    event.forEach(item => {
      if (item.fieldType !== 'Date' && !item.serviceCol) {
        self.createNoDateFilter(item);
      } else if (item.serviceCol && item.fieldType === 'Relation') {
        self.createRelFilter(item);
      } else if (item.serviceCol && item.fieldType === 'secureText') {
        self.creatSecureTextFilter(item);
      } else if (item.serviceCol && item.fieldType !== 'Relation' && item.fieldType !== 'Date' && item.fieldName !== 'documentId') {
        self.createDSColFilter(item);
      } else if (item.serviceCol && item.fieldType !== 'Relation' && item.fieldType !== 'Date' && item.fieldName === 'documentId') {
        self.createNoDateFilter(item);
      } else if (item.serviceCol && item.fieldType === 'Date') {
        self.createRelDateFilter(item);
      } else if (item.fieldType === 'Date') {
        self.createDateFilter(item);
      }
    });
  }

  creatSecureTextFilter(item) {
    const self = this;
    let prefix = 'data.new.';
    if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
      prefix = 'data.old.';
    }

    if (item.filterType === 'equals' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol + '.value']: item.filterValue };
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (item.filterType === 'notEqual' && item.filterValue !== null && item.filterValue !== 'undefined' && item.filterValue !== '') {
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol + '.value']: { $nin: [item['filterValue'], null] }
        };
        self.insertDataInHelperArr(tempObj1);
      });
    }
  }
  createDateFilter(item) {
    const self = this;
    if (item.filterType === 'equals' && item['fromDate']) {
      const tempObj1 = Object.defineProperty({}, item['fieldName'], {
        value: self.getDateQuery(item['fromDate']),
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj1);
    } else if (item.filterType === 'greaterThan') {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $gt: item['fromDate'] },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj, true);
    } else if (item.filterType === 'lessThan') {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $lt: item['fromDate'] },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj, true);
    } else if (item.filterType === 'notEqual') {
      const tempObj = Object.defineProperty({}, item['fieldName'], {
        value: { $ne: item['fromDate'] },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj, true);
    } else if (item.filterType === 'inRange') {
      const tempObj1 = Object.defineProperty({}, item['fieldName'], {
        value: { $gte: item['fromDate'], $lt: item['toDate'] },
        writable: true,
        enumerable: true
      });
      self.insertDataInHelperArr(tempObj1, true, 'gte');
    }
  }
  createRelDateFilter(item) {
    const self = this;
    let prefix = 'data.new.';
    if (self.appService.workflowTab === 1 || self.appService.workflowTab === 2) {
      prefix = 'data.old.';
    }
    if (item.filterType === 'equals' && item['fromDate']) {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      const startD = new Date(item['fromDate']);
      const endD = new Date(item['fromDate']);
      if(item.dateFieldType === 'date') {
        startD.setHours(0, 0, 0);
        endD.setHours(23, 59, 59);
      }
      startD.setMilliseconds(0);
      endD.setMilliseconds(999);
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol + '.utc']: {
            $gte: startD.toISOString(),
            $lte: endD.toISOString()
          }
        };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (item.filterType === 'greaterThan') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      const date = new Date(item['fromDate']);
      if(item.dateFieldType === 'date') {
        date.setHours(23, 59, 59);
      }
      date.setMilliseconds(999);
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol + '.utc']: { $gt: date.toISOString()} };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(tempObj1);
      });
    } else if (item.filterType === 'lessThan') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      const date = new Date(item['fromDate']);
      if(item.dateFieldType === 'date') {
        date.setHours(0, 0, 0);
      }
      date.setMilliseconds(0);
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol + '.utc']: { $lt: date.toISOString() } };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (item.filterType === 'notEqual') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      const startD = new Date(item['fromDate']);
      const endD = new Date(item['fromDate']);
      if(item.dateFieldType === 'date') {
        startD.setHours(0, 0, 0);
        endD.setHours(23, 59, 59);
      }
      startD.setMilliseconds(0);
      endD.setMilliseconds(999);
      item.fieldName.forEach(_relCol => {
        const tempObj1 = { [prefix + _relCol + '.utc']: {$or: [{ $lt: startD.toISOString()}, {$gt: endD.toISOString()}]} };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(queryObj);
      });
    } else if (item.filterType === 'inRange') {
      const queryObj = {
        $or: []
      };
      if (!Array.isArray(item.fieldName)) {
        item.fieldName = item.fieldName.split();
      }
      const startD = new Date(item['fromDate']);
      const endD = new Date(item['toDate']);
      if(item.dateFieldType === 'date') {
        startD.setHours(0, 0, 0);
        endD.setHours(23, 59, 59);
      }
      startD.setMilliseconds(0);
      endD.setMilliseconds(999);
      item.fieldName.forEach(_relCol => {
        const tempObj1 = {
          [prefix + _relCol + '.utc']: { $gte: startD.toISOString(), $lt: endD.toISOString() }
        };
        queryObj['$or'].push(tempObj1);
        self.insertDataInHelperArr(tempObj1);
      });
    }
  }
  getDateQuery(value: any) {
    const obj = {};
    if (value) {
      const fromDate = new Date(value);
      fromDate.setHours(0);
      fromDate.setMinutes(0);
      fromDate.setSeconds(0);
      fromDate.setMilliseconds(0);
      const toDate = new Date(value);
      toDate.setHours(23);
      toDate.setMinutes(59);
      toDate.setSeconds(59);
      toDate.setMilliseconds(0);
      obj['$gte'] = fromDate.toISOString();
      obj['$lte'] = toDate.toISOString();
    }
    return obj;
  }
  insertDataInHelperArr(tempObj, dateData?, inRange?) {
    const self = this;
    const placeHolderArr = [];
    self.filterHelperArr = [];
    if (self.filterHelperArr.length > 0) {
      if (dateData) {
        const dateTypeFilter = tempObj[Object.keys(tempObj)[0]];
        self.filterHelperArr.forEach((_obj, index) => {
          const dateObj = _obj[Object.keys(_obj)[0]];
          let sameKeys = false;
          if (inRange && inRange === 'gte') {
            if (Object.keys(dateObj)[0] !== '$gte' && Object.keys(dateTypeFilter)[0] !== '$gte') {
              sameKeys = Object.keys(dateObj)[0] === Object.keys(dateTypeFilter)[0];
            }
          } else if (inRange && inRange === 'lte') {
            if (Object.keys(dateObj)[0] !== '$lte' && Object.keys(dateTypeFilter)[0] !== '$lte') {
              sameKeys = Object.keys(dateObj)[0] === Object.keys(dateTypeFilter)[0];
            }
          }
          if (sameKeys && _.isEqual(dateObj, dateTypeFilter)) {
            self.filterHelperArr[index] = tempObj;
          } else if (sameKeys && !_.isEqual(dateObj, dateTypeFilter)) {
            const obj = {
              index: index,
              value: tempObj
            };
            placeHolderArr.push(obj);
          } else {
            const obj = {
              index: index + 1,
              value: tempObj
            };
            placeHolderArr.push(obj);
          }
        });
      } else {
        self.filterHelperArr.forEach((_obj, index) => {
          Object.keys(_obj).forEach(_key => {
            if (_key === Object.keys(tempObj)[0]) {
              self.filterHelperArr[index] = tempObj;
            } else {
              const obj = {
                index: self.filterHelperArr.length,
                value: tempObj
              };
              placeHolderArr.push(obj);
            }
          });
        });
      }
    } else {
      self.filterHelperArr.push(tempObj);
    }
    if (placeHolderArr.length > 0) {
      placeHolderArr.forEach(e => {
        self.filterHelperArr[e.index] = e.value;
      });
    }
    if (self.filterHelperArr.length > 0) {
      // console.log(self.filterHelperArr);
      if (self.config && self.config.filter && !self.config.filter.$and) {
        self.config.filter.$and = [];
      }
      self.filterHelperArr.forEach(element => {
        const key = Object.keys(element)[0];
        const temp = {};
        temp[key] = element[key];
        const index = self.config.filter.$and.findIndex(ele => ele[key] === temp[key]);
        if (index < 0) {
          self.config.filter.$and.push(temp);
        }
        // self.config.filter[key] = element[key];
      });
    }
  }

  clearFilter() {
    const self = this;
    self.clearFilters.emit();
    self.filter = {};
    self.searchForColumn = [];
    self.config.filter = {};
    self.appService.workflowFilter = null;
    self.placeHolderText = 'Select Filter';
    self.saveOrEditText = '+Save As New View';
    self.showSeparateCreateBtn = false;
    self.selectedColOrder = [];
    self.hasOptions = true;
  }
  addColForSort() {
    const self = this;
    self.sortingColumns.push(
      self.appService.cloneObject({
        name: '_id',
        selectedOption: '1'
      })
    );
  }
  saveFilter() {
    const self = this;
    self.filterData.type = 'workflow';
    self.config.columns = self.selectedColOrder;
    self.config.sort = self.sortingColumns;
    // self.config.sort = self.createSortQuery(self.sortingColumns);
    self.config.select = self.selectedColOrder.map(e => e.key).join(',');
    if (self.filterData.name && self.filterData.name.length > 0) {
      if (self.filterData.value['filter'] === null || self.filterData.value['select'] === '' || self.filterData.value['sort'] === '') {
        self.ts.warning('Filter Appears empty');
      } else {
        self.invalidFilterName = false;
        // self.createQueryString();
        const currentUser = self.sessionService.getUser(true);
        self.filterData.value = JSON.stringify(self.config);
        // self.filterData.value['sort'] = self.sortingColumns;
        if (self.filterId && self.filterCreatedBy === currentUser._id) {
          self.commonService.put('user', `/filter/${self.filterId}`, self.filterData).subscribe(res => {
            self.showSaveDiv = false;
            self.applyFilter();
            self.filterId = res._id;
            res.hasOptions = res.createdBy === currentUser._id;
            self.selectFilter(res);
            self.getAllfilters.emit();
            self.ts.success('filter created successfully');
          });
        } else if (self.filterId && self.filterCreatedBy !== currentUser._id) {
          self.filterId = null;
          self.commonService.post('user', '/filter/', self.filterData).subscribe(res => {
            self.showSaveDiv = false;
            self.applyFilter();
            self.filterId = res._id;
            res.hasOptions = res.createdBy === currentUser._id;
            self.allFilters.push(res);
            self.selectFilter(res);
            self.getAllfilters.emit();
            self.saveOrEditText = '+Edit View';
            self.showSeparateCreateBtn = true;
            self.ts.success('New Filter created Successfully');
          });
        } else if (self.filterId === null || self.filterId === '') {
          self.commonService.post('user', '/filter/', self.filterData).subscribe(res => {
            self.showSaveDiv = false;
            self.applyFilter();
            self.filterId = res._id;
            res.hasOptions = res.createdBy === currentUser._id;
            self.allFilters.push(res);
            self.selectFilter(res);
            self.getAllfilters.emit();
            self.saveOrEditText = '+Edit View';
            self.showSeparateCreateBtn = true;
            self.ts.success('New Filter created Successfully');
          });
        }
      }
    } else {
      self.invalidFilterName = true;
      return;
    }
  }

  duplicateView() {
    this.filterData = {
      serviceId: this.appService.serviceId,
      name: '',
      private: true,
      value: '',
      app: this.commonService.app._id,
      createdBy: this.sessionService.getUser(true)._id,
      type: 'workflow'
    };
    this.invalidFilterName = false;
    this.showSaveDiv = true;
    this.placeHolderText = 'Select Filter';
    this.showFilterList = false;
    this.filterId = null;
  }

  selectFilter(filterValue) {
    const self = this;
    let filterVal;
    // self.appService.allFilters.selectedFilter = filterValue;
    // self.appService.allFilters.colNames = self.columnNames;
    self.hasOptions = filterValue.hasOptions;
    if (filterValue.value) {
      self.filterId = filterValue._id;
      self.filterCreatedBy = filterValue.createdBy;
      self.saveOrEditText = '+Edit View';
      self.showSeparateCreateBtn = true;
      self.placeHolderText = filterValue.name;
      self.filterData.name = filterValue.name;
      self.filterData.private = filterValue.private;
      if (typeof filterValue.value === 'string') {
        filterVal = JSON.parse(filterValue.value);
      } else {
        filterVal = filterValue.value;
      }
    } else {
      self.filterId = '';
      self.saveOrEditText = '+Save As New View';
      self.showSeparateCreateBtn = false;
      self.placeHolderText = 'Select Filter';
      self.filterData.name = '';
      self.filterData.private = true;
      filterVal = filterValue;
    }
    self.sortingColumns = [];
    // self.sortingColumns = filterVal.sort;
    self.showFilterList = false;
    // self.setTypeFilter(filterVal);
    self.setSort(filterVal);
    self.setColumns(filterVal);
    self.commonService.workflowfilterQuery.next(filterVal);
    self.config = filterVal;
    // self.applyFilter();
  }
  checkFilterName() {
    const self = this;
    self.invalidFilterName = !(self.filterData.name && self.filterData.name.length > 0);
  }

  setColumns(filterVal) {
    const self = this;
    self.selectedColOrder = filterVal.columns ? filterVal.columns : [];
  }
  setTypeFilter(filterVal) {
    const self = this;
    self.resetFilter();
    self.config = filterVal;
    if (filterVal.filter && filterVal.filter.$and && filterVal.filter.$and.findIndex(e => Object.keys(e)[0] === 'status') > -1) {
      const statusIndex = filterVal.filter.$and.findIndex(e => Object.keys(e)[0] === 'status');

      if (filterVal.filter.$and[statusIndex].status.$in.findIndex(e => e === 'Pending') > -1) {
        self.statusArray.push('Pending');
        self.filter.submitted = true;
      }
      if (filterVal.filter.$and[statusIndex].status.$in.findIndex(e => e === 'Rework') > -1) {
        self.filter.rework = true;
        self.statusArray.push('Rework');
      }
      if (filterVal.filter.$and[statusIndex].status.$in.findIndex(e => e === 'Discarded') > -1) {
        self.filter.discard = true;
        self.statusArray.push('Discarded');
      }
      if (filterVal.filter.$and[statusIndex].status.$in.findIndex(e => e === 'Approved') > -1) {
        self.filter.approved = true;
        self.statusArray.push('Approved');
      }
      if (filterVal.filter.$and[statusIndex].status.$in.findIndex(e => e === 'Rejected') > -1) {
        self.filter.rejected = true;
        self.statusArray.push('Rejected');
      }
      if (filterVal.filter.$and[statusIndex].status.$in.findIndex(e => e === 'Draft') > -1) {
        self.filter.draft = true;
        self.statusArray.push('Rework');
      }
    }
  }
  setSort(filterVal) {
    const self = this;
    if (!filterVal.sort) {
      this.sortingColumns = [];
    } else {
      self.sortingColumns = filterVal.sort;
    }
  }

  resetFilter() {
    const self = this;
    self.filter = {};
  }

  removeSortCols(index) {
    const self = this;
    self.sortingColumns.splice(index, 1);
  }

  search = (text$: Observable<string>) => {
    const debouncedText$ = text$.pipe(debounceTime(200), distinctUntilChanged());
    const clicksWithClosedPopup$ = this.click$.pipe(filter(() => !this.inputInstance.isPopupOpen()));
    const inputFocus$ = this.focus$;

    return merge(debouncedText$, inputFocus$, clicksWithClosedPopup$).pipe(
      map(term =>
        (term === ''
          ? this.allColumns
          : this.allColumns.filter(v => v.properties.name.toLowerCase().indexOf(term.toLowerCase()) > -1)
        ).slice(0, 10)
      )
    );
  };

  formatter = (x) => x.properties.label ? x.properties.label : x.properties.name 

  selectItem(val) {
    const self = this;
    const tempArr = [];
    val.preventDefault();
    const index1 = self.selectedColOrder.findIndex(e => e.properties.name === val.item.properties.name);
    if (index1 === -1) {
      self.selectedColOrder.push(val.item);
    } else {
      self.ts.warning('Column already added');
    }
    self.selectedColOrder.forEach(col => {
      // const temp = self.appService.cloneObject(col);
      if (col.type === 'File') {
        col.dataKey = col.dataKey + '.metadata.filename';
        // tempArr.push(temp);
      } else if (col.type === 'Geojson') {
        col.dataKey = col.dataKey + '.formattedAddress';
        // tempArr.push(temp);
      }
    });
    if (tempArr.length > 0) {
      self.selectedColOrder = [...self.selectedColOrder, ...tempArr];
    }
    self.name = '';
  }

  convertToColList() {
    const self = this;
    const tempArr = [];
    if (!self.definition) {
      return tempArr;
    }
    self.definition.forEach(def => {
      // const flag = self.selectColumns.find(e => e.key === key);
      // if (!flag) {
      let prefix = def.key;
      if (def.type === 'Array') {
        tempArr.push({
          show: true,
          key: def.key,
          dataKey: prefix,
          type: def.type,
          properties: def.properties,
          definition: def.definition,
          dataType: 'array'
        });
      } else {
        if (def.type === 'Relation') {
          prefix = def.key;
          // prefix += '.' + def.properties.relatedSearchField;
        } else if (def.type === 'File') {
          prefix += '.metadata.filename';
        } else if (def.type === 'Geojson') {
          prefix += '.formattedAddress';
        }
        if (def.key !== '_id') {
          tempArr.push({
            show: true,
            key: prefix,
            dataKey: prefix,
            type: def.type,
            properties: def.properties,
            definition: def.definition,
            dataType: 'others'
          });
        }
      }
      // }
    });
    return tempArr;
  }
  removeItem(index) {
    const self = this;
    self.confirmDeleteModalRef = self.modalService.open(self.confirmDeleteModal, { centered: true });
    self.confirmDeleteModalRef.result.then(
      close => {
        if (close) {
          self.allColumns.push(self.selectedColOrder[index]);
          self.selectedColOrder.splice(index, 1);
        }
      },
      dismiss => {}
    );
  }

  ngOnDestroy() {
    const self = this;
    if (self.subscriptions && Object.keys(self.subscriptions).length > 0) {
      Object.keys(self.subscriptions).forEach(key => {
        self.subscriptions[key].unsubscribe();
      });
    }
    if (self.confirmDeleteModalRef) {
      self.confirmDeleteModalRef.close();
    }
  }
}
