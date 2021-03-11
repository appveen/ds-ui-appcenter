import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { AgGridColumn } from 'ag-grid-angular';
import * as _ from 'lodash';

import { CommonService } from 'src/app/service/common.service';
import { ValueRendererComponent } from '../value-renderer/value-renderer.component';
import { AppService } from 'src/app/service/app.service';
import { ResolveCellComponent } from '../resolve-cell/resolve-cell.component';

@Component({
  selector: 'odp-conflict-resolve',
  templateUrl: './conflict-resolve.component.html',
  styleUrls: ['./conflict-resolve.component.scss']
})
export class ConflictResolveComponent implements OnInit, OnDestroy {
  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean>;
  @Input() schema: any;
  @Input() transfersData: any;
  @Input() update: Array<number>;
  @Output() updateChange: EventEmitter<Array<number>>;
  subscriptions: any;
  apiCalls: any;
  columnDef: AgGridColumn[];
  conflictRecords: Array<any>;
  api: string;
  totalCount: number;
  totalRecords: number;
  rowClassRules: any;
  conflictIds: Array<number>;
  constructor(private commonService: CommonService, private appService: AppService, private dropdownConfig: NgbDropdownConfig) {
    const self = this;
    self.update = [];
    self.toggleChange = new EventEmitter();
    self.updateChange = new EventEmitter();
    self.subscriptions = {};
    self.apiCalls = {};
    self.conflictRecords = [];
    self.rowClassRules = {};
    self.conflictIds = [];
    self.dropdownConfig.placement = 'bottom-right';
  }

  ngOnInit() {
    const self = this;
    self.appService.fileMapperComponnets.conflictResolve = true;
    self.api = '/' + self.schema.app + self.schema.api;
    self.importConflictRecords();
    self.rowClassRules = {
      'bg-primary-0-1': params => {
        return params.data._bgColor;
      },
      'bg-white': params => {
        return !params.data._bgColor;
      }
    };
  }

  ngOnDestroy() {
    const self = this;
    delete self.appService.fileMapperComponnets.conflictResolve;
  }

  fixSchema(parsedDef) {
    const self = this;
    parsedDef.forEach(def => {
      if (def.properties && def.properties.relatedTo) {
        def.type = 'Relation';
        def.properties._typeChanged = 'Relation';
        delete def.definition;
      } else if (def.properties && def.properties.password) {
        def.type = 'String';
        def.properties._typeChanged = 'String';
        delete def.definition;
      } else if (def.properties && def.properties.geoType) {
        def.type = 'Geojson';
        def.properties._typeChanged = 'Geojson';
        delete def.definition;
      } else if (def.type === 'Array') {
        self.fixSchema(def.definition);
      } else if (def.type === 'Object') {
        self.fixSchema(def.definition);
      }
    });
  }

  importConflictRecords() {
    const self = this;
    self.apiCalls.importConflictRecords = true;
    const opt = {
      filter: { conflict: true, status: 'Duplicate' },
      count: -1,
      sort: 'data._id,sNo'
    };
    self.subscriptions['importConflictRecords'] = self.commonService
      .get('api', self.api + '/utils/fileMapper/' + self.transfersData.fileId, opt)
      .subscribe(
        res => {
          self.apiCalls.importConflictRecords = false;
          self.conflictRecords = res;
          self.totalCount = self.conflictRecords.length;
          self.conflictRecords.forEach((item, i) => {
            if (self.update.indexOf(item.sNo) > -1) {
              item._selected = true;
            }
            if (self.conflictIds.indexOf(item.sNo) === -1) {
              self.conflictIds.push(item.sNo);
            }
            if (i > 0) {
              const prevItem = self.conflictRecords[i - 1];
              if (item.data._id === prevItem.data._id) {
                item._bgColor = prevItem._bgColor;
              } else {
                item._bgColor = (prevItem._bgColor + 1) % 2;
              }
            } else {
              item._bgColor = 1;
            }
          });
          self.importOriginalRecords();
        },
        err => {
          self.apiCalls.importConflictRecords = false;
          self.commonService.errorToast(err, 'Unable to get the records,please try again later');
        }
      );
  }

  importOriginalRecords() {
    const self = this;
    const ids = self.conflictRecords.map(e => e.data._id).filter(e => e);
    const opt = {
      filter: { _id: { $in: ids } },
      count: -1
    };
    self.apiCalls.importOriginalRecords = true;
    self.subscriptions['importOriginalRecords'] = self.commonService.get('api', self.api, opt).subscribe(
      res => {
        self.apiCalls.importOriginalRecords = false;
        const originalRecords = res.map((e, i) => {
          const temp: any = {};
          temp.data = e;
          temp.sNo = 'Original';
          return temp;
        });
        self.conflictRecords = self.conflictRecords.concat(originalRecords);
        self.conflictRecords = self.conflictRecords.sort((a, b) => {
          if (a.data._id > b.data._id) {
            return 1;
          } else if (a.data._id < b.data._id) {
            return -1;
          } else {
            a._bgColor = b._bgColor;
            return 0;
          }
        });
        self.totalRecords = self.conflictRecords.length;
        let definition = self.schema.definition;
        self.fixSchema(definition);
        self.populateMetaColumns();
        self.columnDef = self.columnDef.concat(self.parseDefinition(definition));
      },
      err => {
        self.apiCalls.importOriginalRecords = false;
        self.commonService.errorToast(err, 'Unable to get the records,please try again later');
      }
    );
  }

  updateExistingRecords() {
    const self = this;
    self.unSelectAll();
    const conflictIds = _.uniqBy(self.conflictRecords, 'data._id').map(e => e.sNo);
    self.conflictRecords.forEach((item, i) => {
      if (conflictIds.indexOf(item.sNo) > -1) {
        item._selected = true;
      }
    });
  }

  unSelectAll() {
    const self = this;
    self.conflictRecords.forEach((item, i) => {
      item._selected = false;
    });
    self.update.splice(0);
  }

  populateMetaColumns() {
    const self = this;
    self.columnDef = [];
    const col0 = new AgGridColumn();
    col0.field = '_resolve';
    col0.headerName = 'Select';
    col0.width = 80;
    col0.cellRendererFramework = ResolveCellComponent;
    self.columnDef.push(col0);
    const col1 = new AgGridColumn();
    col1.field = 'sNo';
    col1.headerName = 'Sheet Row No.';
    col1.width = 120;
    col1.resizable = true;
    col1.cellRendererFramework = ValueRendererComponent;
    self.columnDef.push(col1);
  }

  parseDefinition(definition: any, parentKey?: string, parentName?: string): AgGridColumn[] {
    const self = this;
    let columns: AgGridColumn[] = [];
    if (definition) {
      definition.forEach(def => {
        const col = new AgGridColumn();
        const dataKey = parentKey ? parentKey + '.' + def.key : def.key;
        let dataName;
        if (def.properties.label) {
          dataName = parentName ? parentName + '.' + def.properties.label : def.properties.label;
        } else {
          dataName = parentName ? parentName + '.' + def.properties.name : def.properties.name;
        }
        if (def.properties && def.properties.password) {
          col.field = 'data.' + dataKey + '.value';
        } else {
          col.field = 'data.' + dataKey;
        }
        col.headerName = dataName;
        col.refData = def;
        col.width = 200;
        col.resizable = true;
        col.cellRendererFramework = ValueRendererComponent;
        if (def.type === 'Object') {
          columns = columns.concat(self.parseDefinition(def.definition, dataKey, dataName));
        } else {
          columns.push(col);
        }
      });
    }
    return columns;
  }

  done() {
    const self = this;
    self.update.splice(0);
    self.conflictRecords.filter(e => e._selected).forEach(e => self.update.push(e.sNo));
    self.updateChange.emit(self.update);
    self.toggle = false;
    self.toggleChange.emit(self.toggle);
  }

  get uniqueRecords() {
    const self = this;
    return _.uniqBy(self.conflictRecords, 'data._id').length;
  }

  get selectedConflict() {
    const self = this;
    return self.conflictRecords.filter(e => e._selected && e.sNo !== 'Original');
  }

  get apiCallsPending() {
    const self = this;
    if (Object.values(self.apiCalls).length > 0) {
      return Object.values(self.apiCalls).every(e => e);
    }
    return false;
  }
}
