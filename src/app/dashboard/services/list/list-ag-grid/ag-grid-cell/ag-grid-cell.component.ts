import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import { AppService } from 'src/app/service/app.service';
import { Properties, Definition } from 'src/app/interfaces/definition';
import { ListAgGridService } from '../list-ag-grid.service';

@Component({
  selector: 'odp-ag-grid-cell',
  templateUrl: './ag-grid-cell.component.html',
  styleUrls: ['./ag-grid-cell.component.scss']
})
export class AgGridCellComponent implements OnInit, ICellRendererAngularComp {


  params: ICellRendererParams;
  definition: Definition;
  data: any;
  currencyType: string;
  showPassword: boolean;
  type: string;
  properties: Properties;
  value: any;
  serviceId: string;
  isenrichTextWithLinkRequired: boolean;
  textWithLink: any;
  keysCount: number;
  id: string;
  url: string;
  formattedAddress: string;
  constructor(private appService: AppService,
    private gridService: ListAgGridService) {
    const self = this;
    self.keysCount = 0;
    self.data = {};
  }

  ngOnInit() {
    const self = this;
    self.init();
  }

  agInit(params: ICellRendererParams): void {
    const self = this;
    self.params = params;
    self.data = params.data || {};
    self.id = self.data._id;
    self.value = params.value;
    self.definition = params.colDef.refData;
    self.init();
  }

  refresh(params: any): boolean {
    const self = this;
    return false;
  }

  afterGuiAttached(params?: IAfterGuiAttachedParams): void {
    const self = this;
  }

  init() {
    const self = this;
    self.type = self.definition.type;
    self.properties = self.definition.properties;
    self.currencyType = self.definition.properties.currency;
    if (!self.value) {
      self.value = self.appService.getValue(self.definition.dataKey, self.data);
    }
    self.serviceId = self.appService.serviceId;
    self.isenrichTextWithLinkRequired = self.checkForLink(self.value);
    self.textWithLink = self.enrichTextWithLink(self.value);
    if (self.value && typeof self.value === 'object') {
      self.keysCount = Object.keys(self.value).length;
    }
    if (self.value && self.value.formattedAddress) {
      self.formattedAddress = self.value.formattedAddress;
    } else if (self.value && self.value.userInput) {
      self.formattedAddress = self.value.userInput;
    }
    if (self.value && self.value.geometry && self.value.geometry.coordinates) {
      self.url = `https://www.google.co.in/maps?q=MyLoc@${self.value.geometry.coordinates[1]},${self.value.geometry.coordinates[0]}`;
    }
  }

  checkForLink(value) {
    let returnVal = false;
    const rgxStr = '^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$';
    if (typeof value !== 'string') {
      return returnVal;
    }
    if (value && value.match(rgxStr)) {
      returnVal = true;
    }
    return returnVal;
  }

  enrichTextWithLink(value: string) {
    const self = this;
    try {
      const rgxStr = '^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$';
      if (self.definition.properties.email) {
        const temp = value.replace(/(.*)([\w]{2,}@[\w]{2,}\.[a-z\.]{2,})(.*)/, '$1<a href="mailto:$2">$2</a>$3');
        return temp;
      } else if (value && value.match(rgxStr)) {
        // const temp1 = value.replace(/(.*)(https?:\/\/[\w]{2,}\.[a-z\.]{2,})(.*)/, '$1<a href="$2" target="_blank">$2</a>$3');
        const temp1 = value.replace(/(.*)(https?:\/\/[\w-]{2,}\.[a-z\.]{2,}\S*)(.*)/, '$1<a href="$2" target="_blank">$2</a>$3')
        return temp1;
      } else {
        return value;
      }

    } catch (e) {
      return value;
    }
  }
  onRightClick() {
    return false;
  }

  get checked() {
    const self = this;
    if (self.params && self.params.node) {
      return self.params.node.isSelected();
    }
    return false;
  }
}
