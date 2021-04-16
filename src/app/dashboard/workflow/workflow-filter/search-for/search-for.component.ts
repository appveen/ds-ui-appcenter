import { Component, OnInit, Output, EventEmitter, Input } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { WorkflowService } from 'src/app/dashboard/workflow/workflow.service';
import { WorkflowAgGridService } from '../../workflow-list/workflow-ag-grid/workflow-ag-grid.service';

@Component({
  selector: 'odp-search-for',
  templateUrl: './search-for.component.html',
  styleUrls: ['./search-for.component.scss']
})
export class SearchForComponent implements OnInit {
  @Output() searchForUpdate: EventEmitter<any>;
  @Input() searchForColumn: Array<any>;
  @Input() serviceId: string;
  tempSearchForColumn: Array<any>;
  allColumnsOfService: any;
  textOptions: Array<{ name: string, value: string }>;
  numbOptions: Array<{ name: string, value: string }>;
  dateOptions: Array<{ name: string, value: string }>;
  statusOptions: Array<{ name: string, value: string }>;
  booleanOptions: Array<{ name: string, value: boolean }>;
  secureTextOptions: Array<{ name: string, value: string }>;
  subscriptions: Array<Subscription>;
  // searchForColumn: Array<any>;
  combinedColumns: any;
  startDate: Date;
  endDate: Date;
  fromNumber: number;
  toNumber: number;
  filterConfig: any;
  tempArray: Array<any>;

  constructor(
    private appService: AppService,
    private ts: ToastrService,
    private commonService: CommonService,
    private wfService: WorkflowService,
    private gridService: WorkflowAgGridService,
  ) {
    const self = this;
    self.numbOptions = [
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
    self.textOptions = [
      {
        name: 'Equals',
        value: 'equals'
      }, {
        name: 'Not equal',
        value: 'notEqual'
      }, {
        name: 'Contains',
        value: 'contains'
      }, {
        name: 'Not contains',
        value: 'notContains'
      }
    ];
    self.secureTextOptions = [
      {
        name: 'Equals',
        value: 'equals'
      }, {
        name: 'Not equal',
        value: 'notEqual'
      }
    ];
    self.dateOptions = [
      {
        name: 'Equals',
        value: 'equals'
      }, {
        name: 'Greater than',
        value: 'greaterThan'
      }, {
        name: 'Less than',
        value: 'lessThan'
      }, {
        name: 'In range',
        value: 'inRange'
      }];
    self.booleanOptions = [
      {
        name: 'Select',
        value: null
      },
      {
        name: 'Yes',
        value: true
      }, {
        name: 'No',
        value: false
      }
    ];
    self.statusOptions = [
      {
        name: 'Pending Review',
        value: 'Pending'
      },
      {
        name: 'Discarded',
        value: 'Discarded'
      },
      {
        name: 'Rework',
        value: 'Rework'
      },
      {
        name: 'Approved',
        value: 'Approved'
      },
      {
        name: 'Rejected',
        value: 'rejected'
      }
    ]
      ;
    self.subscriptions = [];
    self.combinedColumns = [
      {
        headerName: 'Workflow ID',
        fieldType: 'String',
        fieldName: '_id',
        filterType: 'equals',
        filterValue: '',
        serviceCol: false
      },
      {
        headerName: 'Requested By',
        fieldType: 'requestSelect',
        fieldName: 'requestedBy',
        filterType: 'equals',
        filterValue: '',
        serviceCol: false
      },
      {
        headerName: 'Responded By',
        fieldType: 'respondSelect',
        fieldName: 'respondedBy',
        filterType: 'equals',
        filterValue: '',
        serviceCol: false
      },
      {
        headerName: 'Requested On',
        fieldType: 'Date',
        fieldName: '_metadata.createdAt',
        filterType: 'equals',
        fromDate: null,
        toDate: null,
        toggleFromDate: false,
        toggleToDate: false,
        serviceCol: false,
        dateFieldType: 'date-time',
        timezone: 'Zulu'
      },
      {
        headerName: 'Status',
        fieldType: 'statusSelect',
        fieldName: 'status',
        filterType: 'equals',
        filterValue: '',
        serviceCol: false
      },
    ];
    // self.searchForColumn = [];
    self.searchForUpdate = new EventEmitter<any>();
    self.tempArray = [];
  }

  ngOnInit() {
    const self = this;
    // self.subscriptions['clearqs'] = self.commonService.filterQueryCleared
    //   .subscribe(() => {
    //     self.searchForColumn = [];
    //     self.searchDataUpdated();
    //   });
    self.subscriptions['qsSubscription'] = self.commonService.workflowfilterQuery.subscribe(filter => {
      // self.searchForColumn = [];
      self.setSearchFor(filter);
    });
    // if (self.appService.workflowFilter) {
    //   self.setSearchFor(self.appService.workflowFilter);
    // }
    if (self.wfService.serviceColumns && self.wfService.serviceColumns.length > 0) {
      self.allColumnsOfService = self.wfService.serviceColumns;
      self.allColumnsOfService.forEach((col) => {
        let obj;

        if (col.type !== 'Relation') {

          if (col.properties && col.properties.password) {
            obj = {
              headerName: col.properties.name,
              fieldType: 'secureText',
              fieldName: col.key,
              filterType: 'equals',
              filterValue: '',
              serviceCol: true
            };
          } else {
            obj = {
              headerName: col.properties.name,
              fieldType: col.type ? col.type : 'String',
              fieldName: col.key,
              filterType: 'equals',
              filterValue: '',
              serviceCol: true,
              ...(col.type === 'Date'
                ? {
                    dateFieldType: col.properties.dateType === 'date' ? 'date' : 'date-time',
                    timezone: col.properties.defaultTimezone || 'Zulu'
                  }
                : {})
            };
          }
          // self.combinedColumns.push(obj); // If you are uncommenting below code, then remove this line of code
        }
        // This part will be commented for this release and will be documented as a known issue
        else if ( col.type === 'Relation') {
          obj = {
            headerName: col.properties.name,
            fieldType: col.type,
            fieldName: [col.key],
            filterType: 'equals',
            filterValue: '',
            serviceCol: true
          };
          if (col.properties.relatedViewFields && col.properties.relatedViewFields.length > 0) {
            const serviceDataKey = col.key.split('.')[0];
            col.properties.relatedViewFields.forEach((e) => {
              obj.fieldName.push(serviceDataKey + '.' + e.key);
            });
          }
        } else {
          obj = {
            headerName: 'Record Id',
            fieldType: 'String',
            fieldName: 'documentId',
            filterType: 'equals',
            filterValue: '',
            serviceCol: true
          };
        }
        self.combinedColumns.push(obj);
      });
      if (self.appService.workflowFilter) {
        self.setSearchFor(self.appService.workflowFilter);
      }
    
    }
  }

  searchDataUpdated() {
    const self = this;
    this.tempSearchForColumn = JSON.parse(JSON.stringify(this.searchForColumn))
    self.searchForUpdate.emit(this.tempSearchForColumn);
  }

  addColForSearch() {
    const self = this;

    self.searchForColumn.push(self.appService.cloneObject(self.combinedColumns[0]));
    self.searchDataUpdated();
  }
  updateType(e, index) {
    const self = this;
    const relIndex = e.target.value.indexOf(',');
    let tempCol;
    if (relIndex === -1) {
      tempCol = self.combinedColumns.find(col => col.fieldName === e.target.value);
    } else if (relIndex > -1) {
      const relVal = e.target.value.split(',');
      tempCol = self.combinedColumns.find(col => _.isEqual(col.fieldName, relVal));
    }
    if (!!tempCol) {
      self.searchForColumn.splice(index, 1, self.appService.cloneObject(tempCol));
    }
    self.searchDataUpdated();
  }
  getDateText(type) {
    return ['equals', 'greaterThan', 'lessThan', 'notEqual'].includes(type) ? 'Date' : 'From';
  }

  setStartDate(event, filter) {
    const self = this;
    self.startDate = new Date(event);
    filter.fromDate = self.startDate.toISOString();
    self.searchDataUpdated();
  }

  setEndDate(event, filter) {
    const self = this;
    self.endDate = new Date(event);
    filter.toDate = self.endDate.toISOString();
    if (filter.toDate < filter.fromDate) {
      self.ts.warning('To Date should be more than From Date');
      self.endDate = null;
      filter.toDate = null;
      return;
    }
    self.searchDataUpdated();
  }

  createFilterQuery() {
    const self = this;
    self.searchForColumn.forEach(element => {

    });
  }

  setSearchFor(filterVal) {
    const self = this;
    let isServiceCol = true;

    self.searchForColumn = [];
    let searchForFltr = [];
    if (filterVal && filterVal.filter && filterVal.filter.$and && filterVal.filter.$and.length) {
      const tempArray = filterVal.filter.$and;
      searchForFltr = tempArray
    }
    searchForFltr.forEach(element => {
      if (Object.keys(element)[0] !== '$or') {
        const key = Object.keys(element)[0];
        isServiceCol = true;
        let tempkey1 = key;
        if (key === 'status' || key === 'respondedBy' || key === 'requestedBy' || key === '_metadata.createdAt' || key === '_id') {
          isServiceCol = false
        }
        tempkey1 = tempkey1.replace('data.new.', '')
        tempkey1 = tempkey1.replace('data.old.', '')

        let colObj = self.combinedColumns.find(e => e.fieldName === tempkey1);
        if (!colObj) {
          let replacedKey = tempkey1.replace('.value', '');
          replacedKey = replacedKey.replace('.utc', '');
          replacedKey = replacedKey.replace('.rawData', '');
          colObj = self.combinedColumns.find(e => e.fieldName === replacedKey);
        }

        self.addSearchFor(element, key, colObj, isServiceCol);
      } else if (Object.keys(element)[0] === '$or') {
        let key = Object.keys(element["$or"][0])[0]
        // console.log(obj);
        let tempkey = key.replace('data.new.', '')
        tempkey = tempkey.replace('data.old.', '')
        const colObj = self.combinedColumns.find(e => e.fieldName[0] === tempkey);
        self.addSearchFor(element["$or"][0], key, colObj, isServiceCol);
      }
    });

  }

  addSearchFor(tempObj, key, colObj, serviceCol) {
    const self = this;
    let value = '';
    let filterType = 'contains';
    if (typeof (tempObj[key]) === 'string') {
      if ((tempObj[key]) !== 'requestedBy') {
        if (tempObj[key].charAt(0) === '/'
          && tempObj[key].charAt(tempObj[key].length - 1) === '/') {
          value = tempObj[key].replace('/', '');
          value = value.replace('/', '');
        } else {
          value = tempObj[key];
          filterType = 'equals';
        }
      } else {
        value = tempObj[key];
        filterType = 'equals';
      }
    } else if (typeof (tempObj[key]) === 'number' && !(tempObj[key].$not && tempObj[key].$ne && tempObj[key].$lt && tempObj[key].$gt)) {
      value = tempObj[key];
      filterType = 'equals';
    } else if (typeof (tempObj[key]) === 'boolean') {
      value = tempObj[key];
      filterType = 'equals';
    } else if (tempObj[key].$not) {
      filterType = 'notContains';
      value = tempObj[key].$not.replace('/', '');
      value = value.replace('/', '');
    } else if (tempObj[key].$ne) {
      filterType = 'notEqual';
      value = tempObj[key].$ne;
    } else if (tempObj[key].$lt) {
      filterType = 'lessThan';
      value = tempObj[key].$lt;
    } else if (tempObj[key].$gt) {
      filterType = 'greaterThan';
      value = tempObj[key].$gt;
    }
    const localTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (key === '_metadata.createdAt') {
      let fromDate;
      let toDate;
      let tempfilterType = 'equals';
      if (tempObj[key].$lte && tempObj[key].$gte) {
        const tmp = this.appService.getMomentInTimezone(new Date(tempObj[key].$lte.slice(0, 19)), localTimezone).format();
        this.startDate = new Date(tmp);
        fromDate = this.startDate.toISOString();
        if(new Date(tempObj[key].$lte).getDate() - new Date(tempObj[key].$gte).getDate() > 0) {
          tempfilterType = 'inRange';
          const tmp1 = this.appService.getMomentInTimezone(new Date(tempObj[key].$gte.slice(0, 19)), localTimezone).format();
          this.endDate = new Date(tmp1);
          toDate = this.endDate.toISOString();
        } else {
          tempfilterType = 'equals';
        }
      } else if (tempObj[key].$gt) {
        const tmp = this.appService.getMomentInTimezone(new Date(tempObj[key].$gt.slice(0, 19)), localTimezone).format();
        this.startDate = new Date(tmp);
        fromDate = this.startDate.toISOString();
        tempfilterType = 'greaterThan';
      } else if (tempObj[key].$lt) {
        const tmp = this.appService.getMomentInTimezone(new Date(tempObj[key].$lt.slice(0, 19)), localTimezone).format();
        this.startDate = new Date(tmp);
        fromDate = this.startDate.toISOString();
        tempfilterType = 'lessThan';
      }
      const obj = {
        headerName: colObj?.headerName,
        fieldType: colObj?.fieldType,
        fieldName: colObj?.fieldName,
        filterType: tempfilterType,
        fromDate: fromDate,
        toDate: toDate,
        serviceCol: serviceCol,
        dateFieldType: 'date-time'
      };
      self.searchForColumn.push(obj);
    } else if (colObj?.fieldType === 'Date') {
      let colKey = key.replace('.utc', '');
      colKey = colKey.replace('.rawData', '');
      colKey = colKey.replace('data.new.', '');
      colKey = colKey.replace('data.old.', '');
      const colDef = this.allColumnsOfService.find(c => c.key === colKey);
      const obj = {
        ...colObj,
        ...(!!colDef
          ? {
              dateFieldType: colDef.properties.dateType === 'date' ? 'date' : 'date-time',
              timezone: colDef.properties.defaultTimezone || 'Zulu'
            }
          : {})
      };
      if (tempObj[key].$lte && tempObj[key].$gte) {
        const foreignTime = this.appService.getMoment(tempObj[key].$lte).tz(obj.timezone).format();
        const tmp = this.appService.getMomentInTimezone(new Date(foreignTime.slice(0, obj.dateFieldType === 'date' ? 10 : 19)), localTimezone).format();
        this.startDate = new Date(tmp);
        obj.fromDate = this.startDate.toISOString();
        if(new Date(tempObj[key].$lte).getDate() - new Date(tempObj[key].$gte).getDate() > 0) {
          obj.filterType = 'inRange';
          const foreignTime1 = this.appService.getMoment(tempObj[key].$gte).tz(obj.timezone).format();
          const tmp1 = this.appService.getMomentInTimezone(new Date(foreignTime1.slice(0, obj.dateFieldType === 'date' ? 10 : 19)), localTimezone).format();
          this.endDate = new Date(tmp1);
          obj.toDate = this.endDate.toISOString();
        } else {
          obj.filterType = 'equals';
        }
      } else if (tempObj[key].$gt) {
        const foreignTime = this.appService.getMoment(tempObj[key].$gt).tz(obj.timezone).format();
        const tmp = this.appService.getMomentInTimezone(new Date(foreignTime.slice(0, obj.dateFieldType === 'date' ? 10 : 19)), localTimezone).format();
        this.startDate = new Date(tmp);
        obj.fromDate = this.startDate.toISOString();
        obj.filterType = 'greaterThan';
      } else if (tempObj[key].$lt) {
        const foreignTime = this.appService.getMoment(tempObj[key].$lt).tz(obj.timezone).format();
        const tmp = this.appService.getMomentInTimezone(new Date(foreignTime.slice(0, obj.dateFieldType === 'date' ? 10 : 19)), localTimezone).format();
        this.startDate = new Date(tmp);
        obj.fromDate = this.startDate.toISOString();
        obj.filterType = 'lessThan';
      }
      self.searchForColumn.push(obj);
    }
  }

  removeRow(itemIndex: number) {
    const self = this;
    if (itemIndex > -1) {
      self.searchForColumn.splice(itemIndex, 1);
    }
    self.searchDataUpdated();
  }

  setSelectValue(item, val, isBoolean?) {
    const self = this;
    if (val) {
      if (isBoolean) {
        val = val.toLowerCase() === 'true' ? true : false;
      }
      item.filterValue = val;
    }
    self.searchDataUpdated();
  }
  updateBooleanValue(item) {
    const self = this;
    // console.log(item);
    item.filterValue = item.filterType;
    item.filterType = 'equals';
    self.searchDataUpdated();

  }

  fromNumberChange(filter) {
    this.toNumber = null;
    filter.toNumber = null;
    filter.fromNumber = this.fromNumber;
  }

  toNumberChange(filter) {
    if (this.fromNumber !== null && this.fromNumber !== undefined && this.toNumber !== null && this.toNumber !== undefined) {
      if (this.fromNumber <= this.toNumber) {
        filter.toNumber = this.toNumber;
        this.searchDataUpdated();
        return;
      } else {
        this.ts.warning('To value should be more than or equal to From value');
      }
    }
  }

  get requestedByList() {
    const self = this;
    return self.gridService.requestedByList;
  }
  get respondedByList() {
    const self = this;
    return self.gridService.respondedByList;

  }
}
