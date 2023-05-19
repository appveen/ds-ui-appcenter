import { Component, OnInit } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import { AppService } from 'src/app/service/app.service';
import { Properties, Definition } from 'src/app/interfaces/definition';
import { CommonService } from 'src/app/service/common.service';

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
  parsedDate: string;
  timezoneValue: string;
  showTimezone: boolean;
  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  };

  constructor(
    private appService: AppService,
    private commonService: CommonService
  ) {
    this.keysCount = 0;
    this.data = {};
  }

  ngOnInit() {
    this.init();
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.data = params.data || {};
    this.id = encodeURIComponent(this.data._id);
    this.value = params.value;
    this.definition = params.colDef.refData;
    this.init();
  }

  refresh(params: any): boolean {
    return false;
  }

  afterGuiAttached(params?: IAfterGuiAttachedParams): void {
  }

  init() {
    this.type = this.definition.type;
    this.properties = this.definition.properties;
    this.currencyType = this.definition.properties.currency;
    if (!this.value) {
      this.value = this.appService.getValue(this.definition.dataKey, this.data);
    }
    this.serviceId = this.appService.serviceId;
    this.isenrichTextWithLinkRequired = this.checkForLink(this.value);
    if (this.isenrichTextWithLinkRequired) {
      this.textWithLink = this.enrichTextWithLink(this.value);
    }
    if (this.value && typeof this.value === 'object') {
      this.keysCount = Object.keys(this.value).length;
    }
    if (this.value && this.value.formattedAddress) {
      this.formattedAddress = this.value.formattedAddress;
    } else if (this.value && this.value.userInput) {
      this.formattedAddress = this.value.userInput;
    } else if (this.value && this.value.rawData) {
      this.parsedDate = this.appService.getUTCString(this.value.rawData, this.value.tzInfo);
      this.timezoneValue = this.value.tzInfo;
      this.showTimezone = true;
    } else if (this.definition.key === '_metadata.lastUpdated' || this.definition.key === '_metadata.createdAt' || this.type === 'Date') {
      this.parsedDate = this.value;
      this.timezoneValue = this.definition.properties.defaultTimezone || this.commonService.userDetails.defaultTimezone;
      this.showTimezone = !(this.definition.key === '_metadata.lastUpdated' || this.definition.key === '_metadata.createdAt');
    }
    if (this.value && this.value.geometry && this.value.geometry.coordinates) {
      this.url = `https://www.google.co.in/maps?q=MyLoc@${this.value.geometry.coordinates[1]},${this.value.geometry.coordinates[0]}`;
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
    try {
      const rgxStr = '^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$';
      if (this.definition.properties.email) {
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
    if (this.params && this.params.node) {
      return this.params.node.isSelected();
    }
    return false;
  }
}
