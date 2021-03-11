import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { NgbDropdownConfig } from '@ng-bootstrap/ng-bootstrap';
import { AgGridColumn } from 'ag-grid-angular';
import * as _ from 'lodash';

import { CommonService } from 'src/app/service/common.service';
import { ValueRendererComponent } from '../value-renderer/value-renderer.component';
import { ResolveCellComponent } from '../resolve-cell/resolve-cell.component';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-duplicate-resolve',
  templateUrl: './duplicate-resolve.component.html',
  styleUrls: ['./duplicate-resolve.component.scss']
})
export class DuplicateResolveComponent implements OnInit, OnDestroy {
  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean>;
  @Input() schema: any;
  @Input() transfersData: any;
  @Input() create: Array<number>;
  @Output() createChange: EventEmitter<Array<number>>;
  subscriptions: any;
  apiCalls: any;
  columnDef: AgGridColumn[];
  duplicateRecords: Array<any>;
  api: string;
  rowClassRules: any;
  uniqueFirst: Array<number>;
  constructor(private commonService: CommonService, private appService: AppService, private dropdownConfig: NgbDropdownConfig) {
    const self = this;
    self.create = [];
    self.toggleChange = new EventEmitter();
    self.createChange = new EventEmitter();
    self.subscriptions = {};
    self.apiCalls = {};
    self.duplicateRecords = [];
    self.rowClassRules = {};
    self.uniqueFirst = [];
    self.dropdownConfig.placement = 'bottom-right';
  }

  ngOnInit() {
    const self = this;
    self.appService.fileMapperComponnets.duplicateResolve = true;
    self.api = '/' + self.schema.app + self.schema.api;
    self.importDuplicateRecords();
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
    delete self.appService.fileMapperComponnets.duplicateResolve;
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

  importDuplicateRecords() {
    const self = this;
    self.apiCalls.importDuplicateRecords = true;
    const opt = {
      filter: { conflict: false, status: 'Duplicate' },
      count: -1,
      sort: 'data._id,sNo'
    };
    self.subscriptions['importDuplicateRecords'] = self.commonService
      .get('api', self.api + '/utils/fileMapper/' + self.transfersData.fileId, opt)
      .subscribe(
        res => {
          self.apiCalls.importDuplicateRecords = false;
          self.duplicateRecords = res;
          self.uniqueFirst = _.uniqBy(self.duplicateRecords, 'data._id').map(e => e.sNo);
          self.duplicateRecords.forEach((item, i) => {
            if (self.create.indexOf(item.sNo) > -1) {
              item._selected = true;
            }
            if (i > 0) {
              const prevItem = self.duplicateRecords[i - 1];
              if (item.data._id === prevItem.data._id) {
                item._bgColor = prevItem._bgColor;
              } else {
                item._bgColor = (prevItem._bgColor + 1) % 2;
              }
            } else {
              item._bgColor = 1;
            }
          });
          let definition = self.schema.definition;
          self.fixSchema(definition);
          self.populateMetaColumns();
          self.columnDef = self.columnDef.concat(self.parseDefinition(definition));
        },
        err => {
          self.apiCalls.importDuplicateRecords = false;
          self.commonService.errorToast(err, 'Unable to get the records,please try again later');
        }
      );
  }

  importFirstOccurance() {
    const self = this;
    self.unSelectAll();
    self.duplicateRecords.forEach((item, i) => {
      if (self.uniqueFirst.indexOf(item.sNo) > -1) {
        item._selected = true;
      }
    });
  }

  unSelectAll() {
    const self = this;
    self.duplicateRecords.forEach((item, i) => {
      item._selected = false;
    });
    self.create.splice(0);
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
    self.create.splice(0);
    self.duplicateRecords.filter(e => e._selected).forEach(e => self.create.push(e.sNo));
    self.createChange.emit(self.create);
    self.toggle = false;
    self.toggleChange.emit(self.toggle);
  }

  get uniqueRecords() {
    const self = this;
    return _.uniqBy(self.duplicateRecords, 'data._id').length;
  }

  get selectedDuplicates() {
    const self = this;
    return self.duplicateRecords.filter(e => e._selected);
  }

  get apiCallsPending() {
    const self = this;
    if (Object.values(self.apiCalls).length > 0) {
      return Object.values(self.apiCalls).every(e => e);
    }
    return false;
  }
}
