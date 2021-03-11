import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';

import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-relation-view',
  templateUrl: './relation-view.component.html',
  styleUrls: ['./relation-view.component.scss']
})
export class RelationViewComponent implements OnInit, OnDestroy {

  @Input() definition: Definition;
  @Input() data: any;
  serviceId: string;
  documentId: string;
  searchFieldValue: any;
  serviceAccess: boolean;
  isSecureText: boolean;
  showPassword: boolean;
  subscriptions = new Subscription();
  
  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }

  constructor(private appService: AppService,
    private commonService: CommonService,
  ) {
    const self = this;
    self.serviceAccess = true;
  }

  ngOnInit() {
    const self = this;
    if (self.definition.properties.relatedTo) {
      self.serviceId = self.definition.properties.relatedTo;
      const srvcIdx = self.appService.fetchedServiceList.findIndex(sid => sid._id === self.definition.properties.relatedTo);
      self.serviceAccess = srvcIdx !== -1;
     
    }
    if (self.data) {
      self.extractValue(self.data);
      if (!self.searchFieldValue) {
        self.commonService.getService(self.serviceId).then(serviceDef => {
          self.addSubscription(
            self.commonService.get('api', '/' + self.commonService.app._id + serviceDef.api + '/' + self.documentId, { expand: true })
              .subscribe(data => {
                self.data[self.definition.dataKey] = data;
                self.extractValue(self.data);
                if (!self.searchFieldValue) {
                  self.searchFieldValue = self.documentId;
                }
              }
              )
          );
        })

      }
    }
  }

  extractValue(data) {
    const self = this;
    self.documentId = self.appService.getValue(self.definition.dataKey + '._id', data);
    const dataKey = self.definition.dataKey + '.' + self.definition.properties.relatedSearchField;
    self.searchFieldValue = self.appService.getValue(dataKey, data);
    if(typeof self.searchFieldValue === 'string' && self.searchFieldValue.includes('<!DOCTYPE')) {
      self.searchFieldValue = self.getHtmlContent(self.searchFieldValue);
    }
    if (typeof self.searchFieldValue === 'object') {
      if (self.searchFieldValue.checksum) {
        self.searchFieldValue = self.searchFieldValue.value
        self.isSecureText = true;
      }
      else if (self.searchFieldValue.metadata) {
        self.searchFieldValue = self.searchFieldValue.metadata.file
      }
      else if (self.searchFieldValue.userInput || self.searchFieldValue.formattedAddress) {
        self.searchFieldValue = self.searchFieldValue.userInput ? self.searchFieldValue.userInput : self.searchFieldValue.formattedAddress
      }
      else if (self.searchFieldValue.rawData) {
        self.searchFieldValue = self.searchFieldValue.rawData;
      }
    }
  }

  getHtmlContent(val: string) {
    return val.replace(/<\/.*>/g, '').replace(/<.*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');
  }

  addSubscription(subscription: Subscription) {
    const self = this;
    self.subscriptions.add(subscription);
  }

  ngOnDestroy() {
    const self = this;
    if (!!self.subscriptions) {
      self.subscriptions.unsubscribe();
    }
  }

}
