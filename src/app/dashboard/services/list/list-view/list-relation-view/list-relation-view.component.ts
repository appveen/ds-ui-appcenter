import { Component, Input, OnInit } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { Definition } from 'src/app/interfaces/definition';
import { CommonService } from 'src/app/service/common.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'odp-list-relation-view',
  templateUrl: './list-relation-view.component.html',
  styleUrls: ['./list-relation-view.component.scss']
})
export class ListRelationViewComponent implements OnInit {
  @Input() definition: Definition;
  @Input() data: any;
  relatedSrvc: string;
  private subscriptions: any;
  private showOnlyId: boolean;
  private relatedDefinition: any;
  serviceAccess: boolean;

  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }

  constructor(private appService: AppService, private commonService: CommonService, private datePipe: DatePipe) {
    const self = this;
    self.subscriptions = {};
    self.serviceAccess = true;
  }

  ngOnInit() {
    const self = this;
    if (self.definition.type === 'Relation') {
      self.fetchRelatedSchema();
    }
  }

  toolTipDir(dataKey) {
    const self = this;
    const col = self.appService.dataGridColumns.find(e => e.dataKey === dataKey);
    if (col.sequenceNo > Math.floor(self.appService.dataGridColumns.length / 2)) {
      return 'left';
    } else {
      return 'top';
    }
  }

  getValue(key, obj) {
    const self = this;
    return self.appService.getValue(key, obj);
  }

  fetchRelatedSchema() {
    const self = this;
    if (!self.appService.servicesMap || !self.appService.servicesMap[self.definition.properties.relatedTo]) {
      self.relatedSrvc = self.definition.properties.relatedTo;
      if (self.subscriptions['fetchRelatedSchema_' + self.definition.properties.relatedTo]) {
        self.subscriptions['fetchRelatedSchema_' + self.definition.properties.relatedTo].unsubscribe();
      }
      self.subscriptions['fetchRelatedSchema_' + self.definition.properties.relatedTo] = self.commonService
        .get('sm', `/${this.commonService.app._id}/service/` + self.definition.properties.relatedTo, {
          select: 'definition',
          filter: { app: this.commonService.app._id }
        })
        .subscribe(
          res => {
            const sIndex = self.appService.fetchedServiceList.findIndex(s => s._id === res._id);
            self.showOnlyId = sIndex === -1;
            if (sIndex === -1) {
              self.serviceAccess = false;
            }
            // self.showOnlyId = false;
            self.appService.servicesMap[res._id] = self.appService.cloneObject(res);
            self.relatedDefinition = res.definition;
          },
          err => {
            self.showOnlyId = true;
          }
        );
    } else {
      // self.showOnlyId = false;
      const sIndex = self.appService.fetchedServiceList.findIndex(s => s._id === self.definition.properties.relatedTo);
      self.showOnlyId = sIndex === -1;
      if (sIndex === -1) {
        self.serviceAccess = false;
      }
      const temp = self.appService.servicesMap[self.definition.properties.relatedTo];
      self.relatedDefinition = temp.definition;
    }
  }

  get searchFieldValue() {
    const self = this;
    let retVal;
    if (self.showOnlyId) {
      retVal = self.appService.getValue(self.definition.dataKey + '._id', self.data);
    } else {
      retVal = self.appService.getValue(self.definition.dataKey + '.' + self.definition.properties.relatedSearchField, self.data);
    }
    if (retVal && self.relatedDef) {
      if (self.relatedDef.type === 'Date') {
        if (self.relatedDef.properties.dateType === 'date') {
          retVal = self.datePipe.transform(retVal, 'mediumDate');
        } else {
          retVal = self.datePipe.transform(retVal, 'medium');
        }
      } else if (self.relatedDef.type === 'Geojson') {
        retVal = retVal.formattedAddress;
      } else if (self.relatedDef.type === 'File') {
        retVal = retVal.metadata.filename;
      }
    }
    return retVal;
  }

  get viewFields() {
    const self = this;
    return self.data[self.definition.dataKey];
  }

  get valueExist() {
    const self = this;
    const value = self.appService.getValue(self.definition.dataKey, self.data);
    if (value && Object.keys(value).length > 0 && value._id) {
      return true;
    }
    return false;
  }

  get relatedDef() {
    const self = this;
    if (self.relatedDefinition && self.definition.properties.relatedSearchField) {
      return self.appService.getValueNew(self.definition.properties.relatedSearchField, self.relatedDefinition);
    }
    return null;
  }
}
