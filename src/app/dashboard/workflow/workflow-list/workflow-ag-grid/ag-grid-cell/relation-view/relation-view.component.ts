import { Component, OnInit, Input } from '@angular/core';
import { Definition } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-relation-view',
  templateUrl: './relation-view.component.html',
  styleUrls: ['./relation-view.component.scss']
})
export class RelationViewComponent implements OnInit {
  
  @Input() definition: Definition;
  @Input() data: any;
  serviceId: string;
  documentId: string;
  searchFieldValue: any;
  serviceAccess: boolean;
  isSecureText: boolean;
  showPassword: boolean;

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
      self.fetchRelatedSchema();
    }
    if (self.data) {
      self.documentId = self.appService.getValue(self.definition.dataKey + '._id', self.data);
      const dataKey = self.definition.dataKey + '.' + self.definition.properties.relatedSearchField;
      self.searchFieldValue = self.appService.getValue(dataKey, self.data);
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

      }
      if (!self.searchFieldValue) {
        self.searchFieldValue = self.documentId;
      }
    }
  }

  fetchRelatedSchema() {
    const self = this;
    self.commonService.getService(self.definition.properties.relatedTo).then(res => {
      self.serviceAccess = true;
    }).catch(err => {
      self.serviceAccess = false;
    });
  }

}
