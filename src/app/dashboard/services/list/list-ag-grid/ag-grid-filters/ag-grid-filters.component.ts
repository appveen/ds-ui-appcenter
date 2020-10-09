import { Component, OnInit, EventEmitter, ElementRef, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilterParams, Column, FilterChangedEvent, GridApi, IFloatingFilter, IFilterComp, TextFilter } from 'ag-grid-community';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { ListAgGridService } from '../list-ag-grid.service';

@Component({
  selector: 'odp-ag-grid-filters',
  templateUrl: './ag-grid-filters.component.html',
  styleUrls: ['./ag-grid-filters.component.scss']
})
export class AgGridFiltersComponent implements OnInit, IFloatingFilter, AgFrameworkComponent<IFloatingFilterParams> {

  @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
  api: GridApi;
  column: Column;
  params: IFloatingFilterParams;
  filterModel: any;
  definition: any;
  filterQuery: any;
  filterQueryChange: EventEmitter<any>;
  value: any;
  clearFilterModalRef: NgbModalRef;
  private relatedDefinition: any;
  private searchOnlyId: boolean;
  constructor(private element: ElementRef,
    private appService: AppService,
    private commonService: CommonService,
    private gridService: ListAgGridService,
    private modalService: NgbModal) {
    const self = this;
    self.relatedDefinition = {};
    self.filterQueryChange = new EventEmitter();
    self.filterQuery = {
      $and: []
    };
    self.filterModel = {};
    self.element.nativeElement.classList.add('w-100');
    self.element.nativeElement.style.marginTop = '6px';
  }

  ngOnInit() {
    const self = this;
    if (self.definition.properties.relatedTo) {
      self.fetchRelatedSchema();
    }
    self.appService.clearFilterEvent.subscribe(() => {
      self.value = null;
      self.definition.value = null;
    });
  }

  agInit(params: IFloatingFilterParams) {
    const self = this;
    self.params = params;
    self.column = params.column;
    self.api = params.api;
    self.definition = self.column.getColDef().refData;
    self.value = self.definition.value;
  }

  onParentModelChanged(parentModel: any, filterChangedEvent?: FilterChangedEvent): void {
    const self = this;
    const filterModel = self.api.getFilterModel();
    if (Object.getOwnPropertyNames(filterModel).indexOf(self.definition.dataKey) === -1) {
      self.value = null;
      self.definition.value = self.value;
    }
  }

  onChange(value) {
    const self = this;
    let temp = {};
    self.definition.value = self.value;
    if (self.definition.type === 'Relation') {
      temp['$or'] = [];
      temp['$or'].push(Object.defineProperty({}, self.definition.dataKey + '._id', {
        value: '/' + value + '/',
        enumerable: true,
        configurable: true,
        writable: true
      }));
      if (!self.searchOnlyId) {
        const tempObj = {};
        const def = self.relatedDef;
        if (def) {
          if (def.type === 'Number') {
            tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = value;
          } else if (def.type === 'Date') {
            tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = self.getDateQuery(value);
          } else if (def.type === 'String' && def.properties.password) {
            tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField + '.value'] = value;
          } else {
            tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = '/' + value + '/';
          }
        }
        temp['$or'].push(tempObj);
      }
    } else if (self.definition.type === 'User') {
      temp['$or'] = [];
      if (self.definition.properties
        && self.definition.properties.relatedSearchField
        && self.definition.properties.relatedSearchField !== '_id') {
        const tempObj = {};
        tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = '/' + value + '/';
        temp['$or'].push(tempObj);
      } else {
        temp['$or'].push(Object.defineProperty({}, self.definition.dataKey + '._id', {
          value: '/' + value + '/',
          enumerable: true,
          configurable: true,
          writable: true
        }));
      }
    } else if (self.definition.type === 'Geojson') {
      temp[self.definition.dataKey + '.formattedAddress'] = '/' + value + '/';
    } else if (self.definition.type === 'File') {
      temp[self.definition.dataKey + '.metadata.filename'] = '/' + value + '/';
    } else if (self.definition.type === 'Number') {
      temp[self.definition.dataKey] = +value;
    } else if (self.definition.type === 'Date') {
      temp[self.definition.dataKey] = self.getDateQuery(value);
    } else if (self.definition.type === 'Boolean') {
      if (typeof value === 'boolean') {
        temp[self.definition.dataKey] = value;
      } else {
        if (value === 'true') {
          temp[self.definition.dataKey] = true;
        } else {
          temp[self.definition.dataKey] = { $ne: true };
        }
      }
    } else if (self.definition.type === 'Array') {
      temp[self.definition.dataKey] = value;
    } else if (self.definition.type === 'String' && self.definition.properties.password) {
      temp[self.definition.dataKey + '.value'] = value;
    } else {
      temp[self.definition.dataKey] = '/' + value + '/';
    }
    if (!value || !value.trim()) {
      temp = null;
    }
    if (self.gridService.selectedSavedView) {
      self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, { centered: true });
      self.clearFilterModalRef.result.then((close) => {
        if (close) {
          self.gridService.selectedSavedView = null;
          self.params.parentFilterInstance(function (instance: IFilterComp) {
            (instance as TextFilter).onFloatingFilterChanged('like', temp ? JSON.stringify(temp) : '');
          });
        }
      }, dismiss => { });
    } else {
      self.params.parentFilterInstance(function (instance: IFilterComp) {
        (instance as TextFilter).onFloatingFilterChanged('like', temp ? JSON.stringify(temp) : '');
      });
    }
    // self.filterQueryChange.emit(self.filterQuery);
  }

  fetchRelatedSchema() {
    const self = this;
    self.commonService.getService(self.definition.properties.relatedTo).then(res => {
      if (res.definition) {
        self.searchOnlyId = false;
        self.relatedDefinition = JSON.parse(res.definition);
        self.fixSchema(self.relatedDefinition);
      }
    }).catch(err => {
      self.searchOnlyId = true;
      console.error('Unable to fetch Related Schema', self.definition.properties.relatedTo);
    });
  }

  fixSchema(parsedDef) {
    Object.keys(parsedDef).forEach(key => {
      if (parsedDef[key].properties && parsedDef[key].properties.relatedTo) {
        parsedDef[key].type = 'Relation';
        parsedDef[key].properties._typeChanged = 'Relation';
        delete parsedDef[key].definition;
      } else if (parsedDef[key].properties && parsedDef[key].properties.password) {
        parsedDef[key].type = 'String';
        parsedDef[key].properties._typeChanged = 'String';
        delete parsedDef[key].definition;
      } else if (parsedDef[key].type === 'Array') {
        this.fixSchema(parsedDef[key].definition);
      } else if (parsedDef[key].type === 'Object') {
        this.fixSchema(parsedDef[key].definition);
      }
    });
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
      toDate.setMilliseconds(999);
      obj['$gte'] = fromDate.toISOString();
      obj['$lte'] = toDate.toISOString();
    }
    return obj;
  }

  getDateTimeQuery(value) {
    const obj = {};
    if (value) {
      const fromDate = new Date(value);
      fromDate.setSeconds(0);
      fromDate.setMilliseconds(0);
      const toDate = new Date(value);
      toDate.setSeconds(59);
      toDate.setMilliseconds(999);
      obj['$gte'] = fromDate.toISOString();
      obj['$lte'] = toDate.toISOString();
    }
    return obj;
  }

  get type() {
    const self = this;
    if (self.definition.type === 'Relation' && self.relatedDef) {
      // console.log(self.relatedDef);
      const def = self.relatedDef;
      return def.type || 'String';
    }
    return self.definition.type;
  }

  get richText() {
    const self = this;
    return self.definition.properties.richText;
  }

  get longText() {
    const self = this;
    return self.definition.properties.longText;
  }

  get dateType() {
    const self = this;
    if (self.relatedDef) {
      return self.relatedDef.properties.dateType;
    }
    return self.definition.properties.dateType;
  }

  get checkbox() {
    const self = this;
    return self.definition.type === 'Checkbox';
  }

  get relatedDef() {
    const self = this;
    if (self.relatedDefinition && self.definition.properties.relatedSearchField) {
      const newpath = self.definition.properties.relatedSearchField.split('.').join('.definition.');
      return self.appService.getValue(newpath, self.relatedDefinition);
    }
    return null;
  }
}
