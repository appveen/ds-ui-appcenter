import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'odp-search-for-field',
  templateUrl: './search-for-field.component.html',
  styleUrls: ['./search-for-field.component.scss']
})
export class SearchForFieldComponent implements OnInit, OnDestroy {
  @ViewChild('filterTypeEle', { static: false })
  filterTypeEle: ElementRef<HTMLSelectElement>;
  @Input() columns: Definition[];
  @Input() filterModel: FilterModel;
  @Output() filterModelChange: EventEmitter<any>;
  toggleFromDate: boolean;
  toggleToDate: boolean;
  fromNumber: number;
  toNumber: number;
  private fromDate: Date;
  private toDate: Date;
  private searchOnlyId: boolean;
  private relatedDefinition: any;
  private subscriptions: any;
  dateObjIndex: number;
  duplicateInRangeDateField: boolean;
  dateFieldType: string;
  filterTypeOptions: Array<{ name: string; value: string }>;
  constructor(private commonService: CommonService, private appService: AppService, private ts: ToastrService) {
    const self = this;
    self.filterModelChange = new EventEmitter();
    self.subscriptions = {};
    self.filterModel = {
      filterObject: {}
    };
    self.dateObjIndex = -1;
    self.duplicateInRangeDateField = false;
    self.dateFieldType = 'date';
    self.filterTypeOptions = [];
  }

  ngOnInit() {
    const self = this;
    self.setFilterTypeOptions();
    if (
      self.filterModel &&
      self.filterModel.dataKey &&
      self.filterModel.filterValue &&
      (!self.filterModel.filterObject || Object.keys(self.filterModel.filterObject).length === 0)
    ) {
      self.filterModel.filterObject = {};
      self.valueChange();
    }
    if (self.filterModel && self.filterModel.filterValue) {
      const temp = new Date(self.filterModel.filterValue);
      if (temp.toString() !== 'Invalid Date') {
        // self.filterModel.filterObject.forEach((e, i) => {
        let obj = self.filterModel.filterObject;
        for (const key in obj) {
          if (obj.hasOwnProperty(key) && obj[key] && (obj[key]['$gte'] || obj[key]['$gt'])) {
            // self.dateObjIndex = i;
            if (obj[key]['$gte']) {
              self.setStartDate(obj[key]['$gte']);
            } else if (obj[key]['$gt']) {
              self.setStartDate(obj[key]['$gt']);
            }
          } else if (obj.hasOwnProperty(key) && obj[key] && (obj[key]['$lt'] || obj[key]['$lte'])) {
            if (obj[key]['$lt']) {
              self.setEndDate(obj[key]['$lt']);
            } else {
              self.setEndDate(obj[key]['$lte']);
            }
          }
        }
        // });
      }
    }
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      self.subscriptions[key].unsubscribe();
    });
  }

  getDateText(type) {
    switch (type) {
      case 'equals': {
        return 'Date';
      }
      case 'greaterThan': {
        return 'Date';
      }
      case 'lessThan': {
        return 'Date';
      }
      case 'notEqual': {
        return 'Date';
      }
      default: {
        return 'From';
      }
    }
  }

  onFieldChange() {
    const self = this;
    if (self.selectedFieldDef.type === 'Relation') {
      self.fetchRelatedSchema();
    }
    Object.keys(self.filterModel.filterObject).forEach(key => {
      delete self.filterModel.filterObject[key];
    });
    self.filterModel.filterValue = null;
    self.appService.dataKeyForSelectedCols.forEach(e => {
      self.duplicateInRangeDateField = e === self.filterModel.dataKey;
    });
    self.filterModelChange.emit(self.filterModel);
    const fieldData = self.allFields.find(e => e.key === self.filterModel.dataKey);
    self.dateFieldType = fieldData.properties.dateType === 'date' ? 'date' : 'date-time';
    if (fieldData.dataKey === '_metadata.createdAt' || fieldData.dataKey === '_metadata.lastUpdated') {
      self.dateFieldType = 'date';
    }
    self.setFilterTypeOptions();
  }

  valueChange() {
    const self = this;
    if (self.filterTypeEle && self.filterTypeEle.nativeElement) {
      setTimeout(() => {
        self.filterTypeEle.nativeElement.value = self.filterModel.filterType;
      }, 100);
    }
    if (self.filterModel.filterValue === null || self.filterModel.filterValue === undefined) {
      Object.keys(self.filterModel.filterObject).forEach(key => {
        delete self.filterModel.filterObject[key];
      });
      if (self.selectedFieldType === 'Boolean') {
        self.filterModel.filterObject[self.filterModel.dataKey] = self.getFilterValue(self.selectedFieldType);
      }
      self.setFilterTypeOptions();
      self.filterModelChange.emit(self.filterModel);
      return true;
    }
    if (self.selectedFieldType === 'Relation') {
      const filterType = self.filterModel.filterType;
      if (filterType === 'notEqual' || filterType === 'notContains') {
        self.filterModel.filterObject['$and'] = [];
        self.filterModel.filterObject['$and'].push(
          Object.defineProperty({}, self.selectedFieldDef.dataKey + '._id', {
            value: self.getFilterValue('String'),
            enumerable: true,
            configurable: true,
            writable: true
          })
        );
        if (!self.searchOnlyId) {
          const tempObj = {};
          const def = self.relatedDef;
          if (def) {
            if (def.type === 'Number') {
              tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
                'Number'
              );
            } else if (def.type === 'Date') {
              tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
                'Date'
              );
            } else if (def.type === 'String' && def.properties.password) {
              tempObj[
                self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField + '.value'
              ] = self.getFilterValue(self.relatedDef.type);
            } else {
              tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
                self.relatedDef.type
              );
            }
          }
          self.filterModel.filterObject['$and'].push(tempObj);
        }
      } else {
        self.filterModel.filterObject['$or'] = [];
        self.filterModel.filterObject['$or'].push(
          Object.defineProperty({}, self.selectedFieldDef.dataKey + '._id', {
            value: self.getFilterValue('String'),
            enumerable: true,
            configurable: true,
            writable: true
          })
        );
        if (!self.searchOnlyId) {
          const tempObj = {};
          const def = self.relatedDef;
          if (def) {
            if (def.type === 'Number') {
              tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
                'Number'
              );
            } else if (def.type === 'Date') {
              tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
                'Date'
              );
            } else if (def.type === 'String' && def.properties.password) {
              tempObj[
                self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField + '.value'
              ] = self.getFilterValue(self.relatedDef.type);
            } else {
              tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
                self.relatedDef.type
              );
            }
          }
          self.filterModel.filterObject['$or'].push(tempObj);
        }
      }
    } else if (self.selectedFieldType === 'User') {
      const filterType = self.filterModel.filterType;
      if (filterType === 'notEqual' || filterType === 'notContains') {
        self.filterModel.filterObject['$and'] = [];
        self.filterModel.filterObject['$and'].push(
          Object.defineProperty({}, self.selectedFieldDef.dataKey + '._id', {
            value: self.getFilterValue('String'),
            enumerable: true,
            configurable: true,
            writable: true
          })
        );
        if (
          self.selectedFieldDef.properties &&
          self.selectedFieldDef.properties.relatedSearchField &&
          self.selectedFieldDef.properties.relatedSearchField !== '_id'
        ) {
          const tempObj = {};
          tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
            self.relatedDef.type
          );
          self.filterModel.filterObject['$and'].push(tempObj);
        }
      } else {
        self.filterModel.filterObject['$or'] = [];
        self.filterModel.filterObject['$or'].push(
          Object.defineProperty({}, self.selectedFieldDef.dataKey + '._id', {
            value: self.getFilterValue('String'),
            enumerable: true,
            configurable: true,
            writable: true
          })
        );
        if (
          self.selectedFieldDef.properties &&
          self.selectedFieldDef.properties.relatedSearchField &&
          self.selectedFieldDef.properties.relatedSearchField !== '_id'
        ) {
          const tempObj = {};
          tempObj[self.selectedFieldDef.dataKey + '.' + self.selectedFieldDef.properties.relatedSearchField] = self.getFilterValue(
            self.relatedDef.type
          );
          self.filterModel.filterObject['$or'].push(tempObj);
        }
      }
    } else if (self.selectedFieldType === 'Geojson') {
      self.filterModel.filterObject[self.filterModel.dataKey + '.formattedAddress'] = self.getFilterValue(self.selectedFieldType);
    } else if (self.selectedFieldType === 'File') {
      self.filterModel.filterObject[self.filterModel.dataKey + '.metadata.filename'] = self.getFilterValue(self.selectedFieldType);
    } else if (self.selectedFieldType === 'Boolean') {
      self.filterModel.filterObject[self.filterModel.dataKey] = self.getFilterValue(self.selectedFieldType);
    } else if (self.selectedFieldType === 'Date') {
      switch (self.filterModel.filterType) {
        case 'equals': {
          const startDate = new Date(self.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(self.startDate);
          endDate.setHours(23, 59, 59, 999);
          self.filterModel.filterObject = {
            [self.filterModel.dataKey]: {
              $gte: startDate.toISOString(),
              $lte: endDate.toISOString()
            }
          };
          break;
        }
        case 'notEqual': {
          const startDate = new Date(self.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(self.startDate);
          endDate.setHours(23, 59, 59, 999);
          self.filterModel.filterObject = {
            $or: [
              {
                [self.filterModel.dataKey]: {
                  $lt: startDate.toISOString()
                }
              },
              {
                [self.filterModel.dataKey]: {
                  $gt: endDate.toISOString()
                }
              }
            ]
          };
          break;
        }
        case 'greaterThan': {
          const date = new Date(self.startDate);
          date.setHours(23, 59, 59, 999);
          self.filterModel.filterObject = {
            [self.filterModel.dataKey]: {
              $gt: date.toISOString()
            }
          };
          break;
        }
        case 'lessThan': {
          const date = new Date(self.endDate);
          date.setHours(0, 0, 0, 0);
          self.filterModel.filterObject = {
            [self.filterModel.dataKey]: {
              $lt: date.toISOString()
            }
          };
          break;
        }
        case 'inRange': {
          const startDate = new Date(self.startDate);
          startDate.setHours(0, 0, 0, 0);
          const endDate = new Date(self.endDate);
          endDate.setHours(23, 59, 59, 999);
          self.filterModel.filterObject = {
            [self.filterModel.dataKey]: {
              $gte: startDate.toISOString(),
              $lte: endDate.toISOString()
            }
          };
          break;
        }
      }
    } else if (self.selectedFieldType === 'secureText') {
      let attr = self.filterModel.dataKey + '.value';
      self.filterModel.filterObject[attr] = self.getFilterValue(self.selectedFieldType);
    } else if (self.selectedFieldType === 'Number' && self.filterModel.filterType === 'inRange') {
      self.filterModel.filterObject = {
        [self.filterModel.dataKey]: {
          $gte: this.fromNumber,
          $lte: this.toNumber
        }
      };
    } else {
      self.filterModel.filterObject[self.filterModel.dataKey] = self.getFilterValue(self.selectedFieldType);
    }
    self.setFilterTypeOptions();
    self.filterModelChange.emit(self.filterModel);
  }

  setStartDate(e) {
    const self = this;
    self.startDate = new Date(e);
    self.filterModel.filterValue = self.startDate.toISOString();
    if (self.filterModel.filterType !== 'inRange') {
      self.valueChange();
    }
  }

  setEndDate(event) {
    const self = this;
    self.endDate = new Date(event);
    self.filterModel.filterValue = self.endDate.toISOString();
    if (!!self.startDate && self.endDate >= self.startDate) {
      self.valueChange();
    } else {
      self.ts.warning('To Date should be more than From Date');
      self.endDate = null;
      self.filterModel.filterValue = null;
    }
  }

  getFilterValue(type: string, filterType?: string) {
    const self = this;
    let value;
    if (self.filterModel.filterType === 'contains') {
      value = '/' + self.filterModel.filterValue + '/';
    } else if (self.filterModel.filterType === 'notContains') {
      value = { $not: '/' + self.filterModel.filterValue + '/' };
    } else if (self.filterModel.filterType === 'true' || self.filterModel.filterType === 'false') {
      if (self.filterModel.filterType === 'true') {
        value = true;
      } else if (self.filterModel.filterType === 'false') {
        value = { $ne: true };
      }
    } else if (self.filterModel.filterType === 'notEqual') {
      value = {};
      if (type === 'Number') {
        value['$ne'] = +self.filterModel.filterValue;
      } else if (type === 'Date' && filterType === '$gte') {
        value['$ne'] = self.startDate.toISOString();
      } else if (filterType !== '$lt') {
        value['$ne'] = self.filterModel.filterValue;
      }
    } else if (self.filterModel.filterType === 'greaterThan') {
      value = {};
      if (type === 'Number') {
        value['$gt'] = +self.filterModel.filterValue;
      } else if (type === 'Date' && filterType === '$gte') {
        // self.startDate.setDate(self.startDate.getDate() + 1);
        value['$gt'] = self.startDate.toISOString();
      } else if (filterType !== '$lt') {
        value['$gt'] = self.filterModel.filterValue;
      }
    } else if (self.filterModel.filterType === 'lessThan') {
      value = {};
      if (type === 'Number') {
        value['$lt'] = +self.filterModel.filterValue;
      } else if (type === 'Date' && filterType === '$lt') {
        value['$lt'] = self.endDate.toISOString();
      } else if (filterType !== '$gte') {
        value['$lt'] = self.filterModel.filterValue;
      }
    } else if (self.filterModel.filterType === 'inRange') {
      value = {};
      if (type === 'Date' && filterType === '$gte' && self.startDate) {
        value['$gte'] = self.startDate.toISOString();
      }
      if (type === 'Date' && filterType === '$lt' && self.endDate) {
        value['$lte'] = self.endDate.toISOString();
      }
    } else if (self.filterModel.filterType === 'equals') {
      value = self.filterModel.filterValue;
      if (type === 'Date') {
        value = {};
        if (filterType === '$gte') {
          value['$gte'] = self.startDate.toISOString();
        }
        if (filterType === '$lt') {
          const nextDay = new Date(self.startDate.toISOString());
          nextDay.setMilliseconds(999);
          value['$lt'] = nextDay.toISOString();
        }
      }
    } else {
      if (type === 'Number') {
        value = +self.filterModel.filterValue;
      } else {
        value = self.filterModel.filterValue;
      }
    }
    return value;
  }

  fetchRelatedSchema() {
    const self = this;
    if (!self.appService.servicesMap || !self.appService.servicesMap[self.selectedFieldDef.properties.relatedTo]) {
      if (self.subscriptions['fetchRelatedSchema_' + self.selectedFieldDef.properties.relatedTo]) {
        self.subscriptions['fetchRelatedSchema_' + self.selectedFieldDef.properties.relatedTo].unsubscribe();
      }
      self.subscriptions['fetchRelatedSchema_' + self.selectedFieldDef.properties.relatedTo] = self.commonService
        .get('sm', '/service/' + self.selectedFieldDef.properties.relatedTo, {
          select: 'definition'
        })
        .subscribe(
          res => {
            self.searchOnlyId = false;
            self.appService.servicesMap[res._id] = self.appService.cloneObject(res);
            self.relatedDefinition = res.definition;
            self.fixSchema(self.relatedDefinition);
          },
          err => {
            self.searchOnlyId = true;
          }
        );
    } else {
      self.searchOnlyId = false;
      const temp = self.appService.servicesMap[self.selectedFieldDef.properties.relatedTo];
      self.relatedDefinition = temp.definition;
      self.fixSchema(self.relatedDefinition);
    }
  }

  fixSchema(parsedDef) {
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
        this.fixSchema(def.definition);
      } else if (def.type === 'Object') {
        this.fixSchema(def.definition);
      }
    });
  }

  fromNumberChange() {
    this.toNumber = null;
    this.filterModel.filterValue = null;
  }

  toNumberChange() {
    if (this.fromNumber !== null && this.fromNumber !== undefined && this.toNumber !== null && this.toNumber !== undefined) {
      if (this.fromNumber <= this.toNumber) {
        this.filterModel.filterValue = this.toNumber;
        this.valueChange();
        return;
      } else {
        this.ts.warning('To value should be more than or equal to From value');
      }
    }
    this.filterModel.filterValue = null;
  }

  set startDate(val) {
    const self = this;
    self.fromDate = new Date(val);
    self.filterModel.filterValue = self.fromDate.toISOString();
  }

  get startDate() {
    const self = this;
    return self.fromDate;
  }

  set endDate(val) {
    const self = this;
    if (val) {
      self.toDate = new Date(val);
    } else {
      self.toDate = null;
    }
  }

  get endDate() {
    const self = this;
    return self.toDate;
  }

  get allFields() {
    const self = this;
    if (self.columns) {
      const colPlaceholderArr = [];
      self.columns.forEach(col => {
        if (col.type !== 'Array') {
          colPlaceholderArr.push(col);
        }
      });
      return colPlaceholderArr;
    }
    return [];
  }

  get selectedFieldType() {
    const self = this;
    let retValue = 'String';
    if (self.filterModel.dataKey) {
      const temp = self.allFields.find(e => e.key === self.filterModel.dataKey);
      if (temp && temp.properties && temp.properties.password) {
        retValue = 'secureText';
      } else if (temp) {
        retValue = temp.type;
      }
    }
    return retValue;
  }

  get selectedFieldDef() {
    const self = this;
    if (self.filterModel.dataKey) {
      return self.allFields.find(e => e.key === self.filterModel.dataKey);
    }
    return {};
  }

  get relatedDef() {
    const self = this;
    if (self.relatedDefinition && self.selectedFieldDef.properties.relatedSearchField) {
      const newpath = self.selectedFieldDef.properties.relatedSearchField
      return self.appService.getValueNew(newpath, self.relatedDefinition);
      // return self.appService.getValue(self.selectedFieldDef.properties.relatedSearchField, self.relatedDefinition);
    }
    return {};
  }

  setFilterTypeOptions() {
    const self = this;
    if (self.selectedFieldDef && self.selectedFieldDef.type === 'Date' && !self.duplicateInRangeDateField) {
      self.filterTypeOptions = [
        {
          name: 'Equals',
          value: 'equals'
        },
        {
          name: 'Greater than',
          value: 'greaterThan'
        },
        {
          name: 'Less than',
          value: 'lessThan'
        },
        {
          name: 'Not equal',
          value: 'notEqual'
        },
        {
          name: 'In range',
          value: 'inRange'
        }
      ];
    } else if (self.selectedFieldDef && self.selectedFieldDef.type === 'Date' && self.duplicateInRangeDateField) {
      self.filterTypeOptions = [
        {
          name: 'Equals',
          value: 'equals'
        },
        {
          name: 'Greater than',
          value: 'greaterThan'
        },
        {
          name: 'Less than',
          value: 'lessThan'
        },
        {
          name: 'Not equal',
          value: 'notEqual'
        }
      ];
    } else if (self.selectedFieldDef && self.selectedFieldDef.type === 'Number') {
      self.filterTypeOptions = [
        {
          name: 'Equals',
          value: 'equals'
        },
        {
          name: 'Greater than',
          value: 'greaterThan'
        },
        {
          name: 'Less than',
          value: 'lessThan'
        },
        {
          name: 'Not equal',
          value: 'notEqual'
        },
        {
          name: 'In range',
          value: 'inRange'
        }
      ];
    } else if (self.selectedFieldDef && self.selectedFieldDef.type === 'Boolean') {
      self.filterTypeOptions = [
        {
          name: 'Select',
          value: ''
        },
        {
          name: 'True',
          value: 'true'
        },
        {
          name: 'False',
          value: 'false'
        }
      ];
    } else if (self.selectedFieldDef && self.selectedFieldDef.properties && self.selectedFieldDef.properties.password) {
      self.filterTypeOptions = [
        {
          name: 'Equals',
          value: 'equals'
        },
        {
          name: 'Not equal',
          value: 'notEqual'
        }
      ];
    } else {
      self.filterTypeOptions = [
        {
          name: 'Equals',
          value: 'equals'
        },
        {
          name: 'Not equal',
          value: 'notEqual'
        },
        {
          name: 'Contains',
          value: 'contains'
        },
        {
          name: 'Not contains',
          value: 'notContains'
        }
      ];
    }
  }
}

export interface FilterModel {
  dataKey?: string;
  filterType?: string;
  filterValue?: any;
  filterObject?: any;
}
