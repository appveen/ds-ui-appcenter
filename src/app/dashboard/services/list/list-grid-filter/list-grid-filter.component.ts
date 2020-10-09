import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  KeyValueDiffer,
  KeyValueDiffers
} from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-list-grid-filter',
  templateUrl: './list-grid-filter.component.html',
  styleUrls: ['./list-grid-filter.component.scss']
})
export class ListGridFilterComponent implements OnInit, OnDestroy {

  @Input() definition: Definition;
  @Input() filterQuery: any;
  @Output() filterQueryChange: EventEmitter<any>;
  value: any;
  private subscriptions: any;
  private relatedDefinition: any;
  private searchOnlyId: boolean;
  private paths: Array<string>;
  private differ: KeyValueDiffer<string, any>;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private differs: KeyValueDiffers) {
    const self = this;
    self.subscriptions = {};
    self.relatedDefinition = {};
    self.filterQueryChange = new EventEmitter();
    self.filterQuery = {
      $and: []
    };
    self.paths = [];
  }

  ngOnInit() {
    const self = this;
    if (self.definition.properties.relatedTo) {
      self.fetchRelatedSchema();
    }
    self.differ = self.differs.find(self.filterQuery).create();
    self.appService.clearFilterEvent.subscribe(() => {
      self.value = null;
    });
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
        self.subscriptions[key] = null;
      }
    });
  }

 

  onChange(value) {
    const self = this;
    const temp = {};
    self.paths = [];
    if (self.definition.type === 'Relation') {
      self.paths.push(self.definition.dataKey + '._id');
      self.paths.push(self.definition.dataKey + '.' + self.definition.properties.relatedSearchField);
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
          } else {
            tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = '/' + value + '/';
          }
        }
        // else {
        //   tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = '/' + value + '/';
        // }
        temp['$or'].push(tempObj);
      }
    } else if (self.definition.type === 'User') {
      self.paths.push(self.definition.dataKey + '._id');
      self.paths.push(self.definition.dataKey + '.' + self.definition.properties.relatedSearchField);
      temp['$or'] = [];

      if (self.definition.properties
        && self.definition.properties.relatedSearchField
        && self.definition.properties.relatedSearchField !== '_id') {
        const tempObj = {};
        tempObj[self.definition.dataKey + '.' + self.definition.properties.relatedSearchField] = '/' + value + '/';
        temp['$or'].push(tempObj);
        console.log(temp);
      }
      else {
        temp['$or'].push(Object.defineProperty({}, self.definition.dataKey + '._id', {
          value: '/' + value + '/',
          enumerable: true,
          configurable: true,
          writable: true
        }));
      }
    } else if (self.definition.type === 'Geojson') {
      self.paths.push(self.definition.dataKey + '.formattedAddress');
      temp[self.definition.dataKey + '.formattedAddress'] = '/' + value + '/';
    } else if (self.definition.type === 'File') {
      self.paths.push(self.definition.dataKey + '.metadata.filename');
      temp[self.definition.dataKey + '.metadata.filename'] = '/' + value + '/';
    } else if (self.definition.type === 'Number') {
      self.paths.push(self.definition.dataKey);
      temp[self.definition.dataKey] = +value;
    } else if (self.definition.type === 'Date') {
      self.paths.push(self.definition.dataKey);
      temp[self.definition.dataKey] = self.getDateQuery(value);
      // if (self.dateType === 'date') {
      //   temp[self.definition.dataKey] = self.getDateQuery(value);
      // } else if (self.definition.dataKey === '_metadata.createdAt' || self.definition.dataKey === '_metadata.lastUpdated') {
      //   temp[self.definition.dataKey] = self.getDateQuery(value);
      // } else {
      //   temp[self.definition.dataKey] = self.getDateTimeQuery(value);
      // }
    } else if (self.definition.type === 'Boolean') {
      self.paths.push(self.definition.dataKey);
      if (value === 'true') {
        temp[self.definition.dataKey] = true;
      } else if (value === 'false') {
        temp[self.definition.dataKey] = false;
      }
    } else if (self.definition.type === 'Array') {
      self.paths.push(self.definition.dataKey);
      temp[self.definition.dataKey] = value;
    } else if (self.definition.type === 'String' && self.definition.properties.password) {
      self.paths.push(self.definition.dataKey);
      temp[self.definition.dataKey + '.value'] = value;
    } else {
      self.paths.push(self.definition.dataKey);
      temp[self.definition.dataKey] = '/' + value + '/';
    }
    if (!self.filterQuery['$and']) {
      self.filterQuery['$and'] = [];
    }
    self.cleanFilterQuery();
    if (value) {
      self.filterQuery['$and'].push(temp);
    } else {
      self.value = null;
    }
    self.filterQueryChange.emit(self.filterQuery);
  }

  cleanFilterQuery() {
    const self = this;
    const filterArr: Array<any> = self.filterQuery['$and'];
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
    indexToRemove.sort().reverse().forEach(i => {
      filterArr.splice(i, 1);
    });
    self.filterQuery['$and'] = filterArr;
  }

  fetchRelatedSchema() {
    const self = this;
    if (!self.appService.servicesMap || !self.appService.servicesMap[self.definition.properties.relatedTo]) {
      if (self.subscriptions['fetchRelatedSchema_' + self.definition.properties.relatedTo]) {
        self.subscriptions['fetchRelatedSchema_' + self.definition.properties.relatedTo].unsubscribe();
      }
      self.subscriptions['fetchRelatedSchema_' + self.definition.properties.relatedTo] = self.commonService
        .get('sm', '/service/' + self.definition.properties.relatedTo, {
          select: 'definition'
        }).subscribe(res => {
          self.searchOnlyId = false;
          self.appService.servicesMap[res._id] = self.appService.cloneObject(res);
          if (res.definition) {
            self.relatedDefinition = JSON.parse(res.definition);
          }
        }, err => {
          self.searchOnlyId = true;
        });
    } else {
      self.searchOnlyId = false;
      const temp = self.appService.servicesMap[self.definition.properties.relatedTo];
      // self.relatedDefinition = JSON.parse(temp.definition);
      if (temp.definition) {
        self.relatedDefinition = JSON.parse(temp.definition);
      }
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
