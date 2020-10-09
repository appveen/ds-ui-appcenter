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
  constructor(private appService: AppService) {
    const self = this;
    self.definition = {};
    self.data = {};
    self.dateType = 'date';
    self.type = 'String';
  }

  agInit(params: ICellRendererParams) {
    const self = this;
    self.params = params;
    self.data = self.params.data;
    self.definition = self.params.colDef.refData;
    if (!self.definition) {
      self.definition = {};
    }
    self.dataKey = self.params.colDef.field;
    if (self.definition && self.definition.type) {
      self.type = self.definition.type;
    }
    if (self.type !== 'Date' && self.type !== 'Boolean' && self.type !== 'Number' && self.type !== 'Array') {
      self.type = 'String';
    }
    if (self.type === 'Date') {
      self.dateType = self.definition.properties.dateType;
    }
    if (Array.isArray(self.value)) {
      self.arrayLength = self.value.length;
    }
    if (self.dataKey === 'errorMessage') {
      self.textDanger = true;
    }
    if (self.dataKey === 'errorMessage' || self.dataKey === 'data._id') {
      self.textBold = true;
    }
    if (self.definition.type === 'Relation' || self.definition.type === 'User') {
      self.value = self.appService.getValue(self.dataKey + '._id', self.data);
    } else if (self.definition.type === 'File') {
      self.value = self.appService.getValue(self.dataKey + '.filename', self.data);
    } else if (self.definition.type === 'Geojson') {
      self.value = self.appService.getValue(self.dataKey + '.userInput', self.data);
    } else {
      self.value = self.appService.getValue(self.dataKey, self.data);
    }
  }

  refresh() {
    return true;
  }

}
