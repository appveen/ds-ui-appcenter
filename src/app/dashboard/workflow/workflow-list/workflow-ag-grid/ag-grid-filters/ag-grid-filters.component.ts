import { Component, OnInit, EventEmitter, ElementRef, ViewChild, TemplateRef } from '@angular/core';
import { IFloatingFilter, IFloatingFilterParams, FilterChangedEvent, GridApi, Column, IFilterComp, TextFilter } from 'ag-grid-community';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { WorkflowAgGridService } from '../workflow-ag-grid.service';
import { FormService } from 'src/app/service/form.service';

@Component({
  selector: 'odp-ag-grid-filters',
  templateUrl: './ag-grid-filters.component.html',
  styleUrls: ['./ag-grid-filters.component.scss']
})
export class AgGridFiltersComponent implements OnInit, IFloatingFilter, AgFrameworkComponent<IFloatingFilterParams> {
  @ViewChild('clearFilterModal', { static: false }) clearFilterModal: TemplateRef<ElementRef>;
  @ViewChild('toDateRef', { static: false}) toDateRef: ElementRef;
  api: GridApi;
  column: Column;
  params: IFloatingFilterParams;
  filterModel: any;
  definition: any;
  filterQuery: any;
  filterQueryChange: EventEmitter<any>;
  value: any;
  clearFilterModalRef: NgbModalRef;
  workflowFilter: string;
  private relatedDefinition: any;
  private searchOnlyId: boolean;
  col: any;
  subscriptions: any;
  paths: Array<any>;
  config: any;
  dateFilterType: string;
  fromDate: string;
  toDate: string;
  dateFilterSet: boolean;

  constructor(
    private appService: AppService,
    private commonService: CommonService,
    private gridService: WorkflowAgGridService,
    private element: ElementRef,
    private modalService: NgbModal,
    private formService: FormService
  ) {
    const self = this;
    self.subscriptions = {};
    self.config = {};
    self.element.nativeElement.classList.add('w-100');
    self.element.nativeElement.style.marginTop = '6px';
    this.dateFilterType = 'equals';
  }

  ngOnInit(): void {
    const self = this;
  }
  agInit(params: IFloatingFilterParams) {
    const self = this;
    self.params = params;
    self.column = params.column;
    self.api = params.api;
    self.definition = self.column.getColDef().refData;
    self.workflowFilter = self.definition.value;
    self.col = self.definition;
    if(this.type === 'Date' && !!this.workflowFilter && this.workflowFilter.indexOf('{') === 0) {
      const obj = JSON.parse(this.workflowFilter);
      this.dateFilterType = obj?.dateFilterType;
      this.fromDate = obj?.fromDate;
      this.toDate = obj?.toDate;
      this.dateFilterSet = true;
    }
    if (self.definition.properties.relatedTo) {
      self.fetchRelatedSchema();
    }
  }

  onParentModelChanged(parentModel: any, filterChangedEvent?: FilterChangedEvent): void {
    const self = this;
    const filterModel = self.api.getFilterModel();
    if (Object.getOwnPropertyNames(filterModel).indexOf(self.definition.dataKey) === -1) {
      self.workflowFilter = null;
      self.fromDate = null;
      self.toDate = null;
      self.dateFilterSet = false;
      self.dateFilterType = 'equals';
      self.definition.value = self.workflowFilter;
    }
  }
  filterChange(event) {
    const self = this;
    let temp = {};
    if (self.col.dataType === 'text') {
      temp[self.col.key] = `/${event}/`;
    } else if (self.col.dataType === 'select') {
      temp[self.col.key] = event;
    } else if (self.col.dataType === 'date') {
      temp[self.col.key] = self.getDateQuery();
      if(!!this.fromDate && (this.dateFilterType !== 'inRange' || !!this.toDate)) {
        event = JSON.stringify({
          dateFilterType: this.dateFilterType,
          fromDate: this.fromDate,
          toDate: this.toDate
        })
      } else {
        event = null;
      }
    }
    if (!event || !event.trim()) {
      temp = null;
    }
    if (self.gridService.selectedSavedView) {
      self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, {
        centered: true
      });
      self.clearFilterModalRef.result.then(
        close => {
          if (close) {
            self.gridService.selectedSavedView = null;
            self.params.parentFilterInstance(function (instance: IFilterComp) {
              (instance as TextFilter).onFloatingFilterChanged('like', temp ? JSON.stringify(temp) : '');
            });
          }
        },
        dismiss => {}
      );
    } else {
      self.params.parentFilterInstance(function (instance: IFilterComp) {
        (instance as TextFilter).onFloatingFilterChanged('like', temp ? JSON.stringify(temp) : '');
      });
    }
  }

  getDateQuery() {
    const obj = {};
    let fromDate, toDate;
    if (!!this.fromDate && (this.dateFilterType !== 'inRange' || !!this.toDate)) {
      switch(this.dateFilterType) {
        case 'equals': {
          if(this.dateType === 'date') {
            fromDate = this.appService.getMomentInTimezone(new Date(this.fromDate), this.timezone || 'Zulu', 'time:start');
            toDate = this.appService.getMomentInTimezone(new Date(this.fromDate), this.timezone || 'Zulu', 'time:end');
          } else {
            fromDate = this.appService.getMomentInTimezone(new Date(this.fromDate + ':00'), this.timezone || 'Zulu', 'ms:start');
            toDate = this.appService.getMomentInTimezone(new Date(this.fromDate + ':59'), this.timezone || 'Zulu', 'ms:end');
          }
          obj['$gte'] = fromDate.toISOString();
          obj['$lte'] = toDate.toISOString();
        };
        break;
        case 'inRange': {
          if(this.dateType === 'date') {
            fromDate = this.appService.getMomentInTimezone(new Date(this.fromDate), this.timezone || 'Zulu', 'time:start');
            toDate = this.appService.getMomentInTimezone(new Date(this.toDate), this.timezone || 'Zulu', 'time:end');
          } else {
            fromDate = this.appService.getMomentInTimezone(new Date(this.fromDate + ':00'), this.timezone || 'Zulu', 'ms:start');
            toDate = this.appService.getMomentInTimezone(new Date(this.toDate + ':59'), this.timezone || 'Zulu', 'ms:end');
          }
          obj['$gte'] = fromDate.toISOString();
          obj['$lte'] = toDate.toISOString();
        };
        break;
        case 'lessThan': {
          if(this.dateType === 'date') {
            fromDate = this.appService.getMomentInTimezone(new Date(this.fromDate), this.timezone || 'Zulu', 'time:start');
          } else {
            fromDate = this.appService.getMomentInTimezone(new Date(this.fromDate + ':00'), this.timezone || 'Zulu', 'ms:start');
          }
          obj['$lt'] = fromDate.toISOString();
        };
        break;
        case 'greaterThan': {
          if(this.dateType === 'date') {
            toDate = this.appService.getMomentInTimezone(new Date(this.fromDate), this.timezone || 'Zulu', 'time:end');
          } else {
            toDate = this.appService.getMomentInTimezone(new Date(this.fromDate + ':59'), this.timezone || 'Zulu', 'ms:end');
          }
          obj['$gt'] = toDate.toISOString();
        };
        break;
      }
    }
    return obj;
  }

  onChange(value) {
    const self = this;
    let temp = {};
    self.paths = [];
    if (self.col.type === 'Relation') {
      self.paths.push(self.col.dataKey + '._id');
      self.paths.push(self.col.dataKey + '.' + self.col.properties.relatedSearchField);
      // temp[self.col.dataKey] = '/' + value + '/';
      temp['$or'] = [];

      temp['$or'].push(
        Object.defineProperty({}, self.col.dataKey + '._id', {
          value: '/' + value + '/',
          enumerable: true,
          configurable: true,
          writable: true
        })
      );
      if (!self.searchOnlyId) {
        let tempObj;
        const def = self.relatedDef;
        if (def) {
          tempObj = {};
          if (def.type === 'Number') {
            tempObj[self.col.dataKey + '.' + self.col.properties.relatedSearchField] = +value;
          } else if (def.type === 'Date') {
            tempObj[self.col.dataKey + '.' + self.col.properties.relatedSearchField + '.utc'] = self.getDateQuery();
            if(!!this.fromDate && (this.dateFilterType !== 'inRange' || !!this.toDate)) {
              value = JSON.stringify({
                dateFilterType: this.dateFilterType,
                fromDate: this.fromDate,
                toDate: this.toDate
              })
            } else {
              value = null;
            }
            this.workflowFilter = value;
          } else if (def.type === 'String' && def.properties.password) {
            tempObj[self.col.dataKey + '.' + self.col.properties.relatedSearchField + '.value'] = value;
          } else {
            tempObj[self.col.dataKey + '.' + self.col.properties.relatedSearchField] = '/' + value + '/';
          }
        }
        if(!!tempObj) {
          temp['$or'].push(tempObj);
        }
      }
    } else if (self.col.type === 'User') {
      self.paths.push(self.col.dataKey + '._id');
      self.paths.push(self.col.dataKey + '.' + self.col.properties.relatedSearchField);
      temp['$or'] = [];
      temp['$or'].push(
        Object.defineProperty({}, self.col.dataKey + '._id', {
          value: '/' + value + '/',
          enumerable: true,
          configurable: true,
          writable: true
        })
      );
      if (self.col.properties && self.col.properties.relatedSearchField && self.col.properties.relatedSearchField != '_id') {
        const tempObj = {};
        tempObj[self.col.dataKey + '.' + self.col.properties.relatedSearchField] = '/' + value + '/';
        temp['$or'].push(tempObj);
      }
    } else if (self.col.type === 'Geojson') {
      self.paths.push(self.col.dataKey + '.formattedAddress');
      temp[self.col.dataKey + '.formattedAddress'] = '/' + value + '/';
    } else if (self.col.type === 'File') {
      self.paths.push(self.col.dataKey + '.metadata.filename');
      temp[self.col.dataKey + '.metadata.filename'] = '/' + value + '/';
    } else if (self.col.type === 'Number') {
      self.paths.push(self.col.dataKey);
      temp[self.col.dataKey] = +value;
    } else if (self.col.type === 'Date') {
      self.paths.push(self.col.dataKey);
      temp[self.col.dataKey + '.utc'] = self.getDateQuery();
      if(!!this.fromDate && (this.dateFilterType !== 'inRange' || !!this.toDate)) {
        value = JSON.stringify({
          dateFilterType: this.dateFilterType,
          fromDate: this.fromDate,
          toDate: this.toDate
        })
      } else {
        value = null;
      }
      this.workflowFilter = value;
    } else if (self.col.type === 'Boolean') {
      self.paths.push(self.col.dataKey);
      if (value === 'true') {
        temp[self.col.dataKey] = true;
      } else if (value === 'false') {
        temp[self.col.dataKey] = { $ne: true };
      }
    } else if (self.col.type === 'Array') {
      self.paths.push(self.col.dataKey);
      temp[self.col.dataKey] = value;
    } else if (self.col.type === 'String' && self.col.properties.password) {
      self.paths.push(self.col.dataKey);
      temp[self.col.dataKey + '.value'] = value;
    } else {
      self.paths.push(self.col.dataKey);
      temp[self.col.dataKey] = '/' + value + '/';
    }

    if (!value || !value.trim()) {
      temp = null;
    }
    if (self.gridService.selectedSavedView) {
      self.clearFilterModalRef = self.modalService.open(self.clearFilterModal, {
        centered: true
      });
      self.clearFilterModalRef.result.then(
        close => {
          if (close) {
            self.gridService.selectedSavedView = null;
            self.params.parentFilterInstance(function (instance: IFilterComp) {
              (instance as TextFilter).onFloatingFilterChanged('like', temp ? JSON.stringify(temp) : '');
            });
          }
        },
        dismiss => {}
      );
    } else {
      self.params.parentFilterInstance(function (instance: IFilterComp) {
        (instance as TextFilter).onFloatingFilterChanged('like', temp ? JSON.stringify(temp) : '');
      });
    }
  }

  cleanFilterQuery() {
    const self = this;
    const filterArr: Array<any> = self.config.filter['$and'];
    let indexToRemove = [];
    self.paths.forEach(path => {
      filterArr.forEach((obj, i) => {
        if (path === Object.keys(obj)[0] || path + '.value' === Object.keys(obj)[0]) {
          indexToRemove.push(i);
        } else if (Object.keys(obj)[0] === '$or') {
          if (obj['$or'].find(e => path === Object.keys(e)[0])) {
            indexToRemove.push(i);
          }
        }
      });
    });
    indexToRemove = indexToRemove.filter((e, i, a) => a.indexOf(e) === i);
    indexToRemove
      .sort()
      .reverse()
      .forEach(i => {
        filterArr.splice(i, 1);
      });
    // self.config.filter['$and'] = filterArr;
  }

  fetchRelatedSchema() {
    const self = this;
    self.commonService
      .getService(self.definition.properties.relatedTo)
      .then(res => {
        if (res.definition) {
          self.searchOnlyId = false;
          self.relatedDefinition = res.definition;
          self.formService.patchType(self.relatedDefinition);
        }
      })
      .catch(err => {
        self.searchOnlyId = true;
        console.error('Unable to fetch Related Schema', self.definition.properties.relatedTo);
      });
  }

  get relatedDef() {
    const self = this;
    if (self.relatedDefinition && self.col.properties.relatedSearchField) {
      const newpath = self.col.properties.relatedSearchField;
      return self.appService.getValueNew(newpath, self.relatedDefinition);
    }
    return null;
  }
  get type() {
    const self = this;
    if (self.col.type === 'Relation' && self.relatedDef) {
      const def = self.relatedDef;
      return def.type || 'String';
    }
    return self.col.type;
  }

  get richText() {
    const self = this;
    return self.col.properties.richText;
  }

  get longText() {
    const self = this;
    return self.col.properties.longText;
  }

  get requestedByList() {
    const self = this;
    return self.gridService.requestedByList;
  }
  get respondedByList() {
    const self = this;
    return self.gridService.respondedByList;
  }

  get workflowtab() {
    const self = this;
    return self.appService.workflowTab;
  }

  get dateType() {
    const self = this;
    if (self.relatedDef) {
      return self.relatedDef.properties.dateType;
    }
    return self.col.properties.dateType;
  }

  get timezone() {
    const self = this;
    if (self.relatedDef) {
      return self.relatedDef.properties.defaultTimezone;
    }
    return self.col.properties.defaultTimezone;
  }

  get workflowSteps() {
    if (this.appService.serviceData && this.appService.serviceData.workflowConfig && this.appService.serviceData.workflowConfig.makerCheckers && this.appService.serviceData.workflowConfig.makerCheckers[0]) {
      return this.appService.serviceData.workflowConfig.makerCheckers[0].steps;
    }
    return [];
  }
}
