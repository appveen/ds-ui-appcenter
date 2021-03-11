import { Component, Input } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-value-renderer',
  templateUrl: './value-renderer.component.html',
  styleUrls: ['./value-renderer.component.scss']
})
export class ValueRendererComponent implements ICellRendererAngularComp {

  params: ICellRendererParams;
  definition: any;
  data: any;
  value: any;
  dataKey: string;
  type: string;
  dateType: string;
  arrayLength: number;
  textDanger: boolean;
  textBold: boolean;
  parsedDate: string;
  timezoneValue: string;
  showTimezone: boolean;
  isBooleanValue: boolean;
  constructor(private appService: AppService) {
    this.definition = {};
    this.data = {};
    this.dateType = 'date';
    this.type = 'String';
  }

  agInit(params: ICellRendererParams) {
    this.params = params;
    this.data = this.params.data;
    this.definition = this.params.colDef.refData;
    if (!this.definition) {
      this.definition = {};
    }
    this.dataKey = this.params.colDef.field;
    if (this.definition && this.definition.type) {
      this.type = this.definition.type;
    }
    if (this.type !== 'Date' && this.type !== 'Boolean' && this.type !== 'Number' && this.type !== 'Array') {
      this.type = 'String';
    }
    if (Array.isArray(this.value)) {
      this.arrayLength = this.value.length;
    }
    if (this.dataKey === 'message') {
      this.textDanger = true;
    }
    if (this.dataKey === 'message' || this.dataKey === 'data._id') {
      this.textBold = true;
    }
    if (this.definition.type === 'Relation' || this.definition.type === 'User') {
      this.value = this.appService.getValue(this.dataKey + '._id', this.data);
    } else if (this.definition.type === 'File') {
      this.value = this.appService.getValue(this.dataKey + '.filename', this.data);
    } else if (this.definition.type === 'Geojson') {
      this.value = this.appService.getValue(this.dataKey + '.userInput', this.data);
    } else {
      this.value = this.appService.getValue(this.dataKey, this.data);
    }
    if (this.type === 'Date') {
      this.dateType = this.definition.properties.dateType;
      if (this.value && this.value.rawData) {
        this.parsedDate = this.appService.getUTCString(this.value.rawData, this.value.tzInfo);
        this.timezoneValue = this.value.tzInfo;
        this.showTimezone = true;
      }
    }
    if (this.type === 'Boolean') {
      this.isBooleanValue = typeof this.value === 'boolean';
    }
    if (this.definition.key === '_metadata.lastUpdated' || this.definition.key === '_metadata.createdAt') {
      this.parsedDate = this.value;
      this.timezoneValue = this.appService.getLocalTimezone();
    }
  }

  refresh() {
    return true;
  }

}
