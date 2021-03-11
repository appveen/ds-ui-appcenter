import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AgGridColumn } from 'ag-grid-angular';
import * as _ from 'lodash';

import { CommonService } from 'src/app/service/common.service';
import { ValueRendererComponent } from '../value-renderer/value-renderer.component';

@Component({
  selector: 'odp-error-records',
  templateUrl: './error-records.component.html',
  styleUrls: ['./error-records.component.scss']
})
export class ErrorRecordsComponent implements OnInit {
  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean>;
  @Input() schema: any;
  @Input() transfersData: any;
  subscriptions: any;
  apiCalls: any;
  columnDef: AgGridColumn[];
  errorRecords: Array<any>;
  api: string;
  constructor(private commonService: CommonService) {
    const self = this;
    self.toggleChange = new EventEmitter();
    self.subscriptions = {};
    self.apiCalls = {};
    self.errorRecords = [];
  }

  ngOnInit() {
    const self = this;
    self.api = '/' + self.schema.app + self.schema.api;
    self.importErrorRecords();
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

  importErrorRecords() {
    const self = this;
    self.apiCalls.importErrorRecords = true;
    const opt = {
      filter: { status: 'Error' },
      count: -1
    };
    self.subscriptions['importErrorRecords'] = self.commonService
      .get('api', self.api + '/utils/fileMapper/' + self.transfersData.fileId, opt)
      .subscribe(
        res => {
          self.apiCalls.importErrorRecords = false;
          self.errorRecords = res;
          self.errorRecords = self.errorRecords.sort((a, b) => {
            if (a.sNo > b.sNo) {
              return 1;
            } else if (a.sNo < b.sNo) {
              return -1;
            } else {
              return 0;
            }
          });
          let definition = self.schema.definition;
          self.fixSchema(definition);
          self.populateMetaColumns();
          self.columnDef = self.columnDef.concat(self.parseDefinition(definition));
        },
        err => {
          self.apiCalls.importErrorRecords = false;
          self.commonService.errorToast(err, 'Unable to get the records,please try again later');
        }
      );
  }

  populateMetaColumns() {
    const self = this;
    self.columnDef = [];
    const col1 = new AgGridColumn();
    col1.field = 'sNo';
    col1.headerName = 'Sheet Row No.';
    col1.width = 120;
    col1.resizable = true;
    col1.cellRendererFramework = ValueRendererComponent;
    self.columnDef.push(col1);
    const col2 = new AgGridColumn();
    col2.field = 'message';
    col2.headerName = 'Error Message';
    col2.cellRendererFramework = ValueRendererComponent;
    col2.width = 240;
    col2.resizable = true;
    self.columnDef.push(col2);
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
    self.toggle = false;
    self.toggleChange.emit(self.toggle);
  }

  get apiCallsPending() {
    const self = this;
    if (Object.values(self.apiCalls).length > 0) {
      return Object.values(self.apiCalls).every(e => e);
    }
    return false;
  }
}
