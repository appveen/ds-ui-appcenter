import { Component, OnInit, Input, AfterContentInit } from '@angular/core';
import { Definition, Properties } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-list-view',
  templateUrl: './list-view.component.html',
  styleUrls: ['./list-view.component.scss']
})
export class ListViewComponent implements OnInit, AfterContentInit {

  @Input() definition: Definition;
  @Input() data: any;
  currencyType: string;
  showPassword: boolean;
  type: string;
  properties: Properties;
  value: any;
  serviceId: string;
  isenrichTextWithLinkRequired: boolean;
  textWithLink: any;
  keysCount: number;

  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }
  
  constructor(
    private appService: AppService,
    private commonService: CommonService
  ) {
    const self = this;
    self.keysCount = 0;
  }

  ngOnInit() {
    const self = this;
    self.init();
  }

  ngAfterContentInit() {
    const self = this;
    self.init();
  }

  init() {
    const self = this;
    self.type = self.definition.type;
    self.properties = self.definition.properties;
    self.currencyType = self.definition.properties.currency;
    self.value = self.appService.getValue(self.definition.dataKey, self.data);
    self.serviceId = self.appService.serviceId;
    self.isenrichTextWithLinkRequired = self.checkForLink(self.value);
    self.textWithLink = self.enrichTextWithLink(self.value);
    if (typeof self.value === 'object') {
      self.keysCount = Object.keys(self.value).length;
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

}
