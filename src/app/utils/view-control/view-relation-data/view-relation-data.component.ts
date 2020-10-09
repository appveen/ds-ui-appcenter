import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { Properties } from 'src/app/interfaces/definition';
import * as _ from 'lodash';
@Component({
  selector: 'odp-view-relation-data',
  templateUrl: './view-relation-data.component.html',
  styleUrls: ['./view-relation-data.component.scss']
})
export class ViewRelationDataComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  relationLink: string;
  relatedId: string;
  serviceAccess: boolean;
  relatedSrvcDef: string;
  relatedServiceDefinition: any;
  values: Array<any>;
  isSecureTextPresent: boolean;
  showPassword: boolean;
  constructor(
    private appService: AppService,
    private commonService: CommonService,
  ) {
    const self = this;
    self.serviceAccess = true;
    self.values = [];
  }

  ngOnInit(): void {
    const self = this;
    if (self.value) {

      if (Object.keys(self.value).length === 2 && '_href' in self.value) {
        self.getDocument(self.value);
      }
      const properties: Properties = self.definition.properties;
      const srvcIdx = self.appService.fetchedServiceList.findIndex(sid => sid._id === properties.relatedTo);
      self.serviceAccess = srvcIdx !== -1;
      self.relationLink = `/~/services/${properties.relatedTo}/view/`;
      self.relatedSrvcDef = `/${properties.relatedTo}`
      self.getServiceDetails();

      let relVal = self.appService.getValue(self.definition.key, self.value);
      if (!relVal || !relVal._id) {
        relVal = self.appService.getValue(self.definition.path, self.value);
      }
      if (!relVal || self.definition.key === '#') {
        relVal = self.definition.value;
      }
      if (self.value && self.value._id) {
        self.relatedId = self.value._id;
      }
    }
  }

  getDocument(value) {
    const self = this;
    const properties: Properties = self.definition.properties;
    self.commonService.getDocument(value._id, value._href, properties.relatedTo).then(result => {
      self.value = result;
      self.getServiceDetails()
    }, err => {

    });
  }
  getServiceDetails() {
    const self = this;

    self.commonService.getService(self.relatedSrvcDef).then(result => {
      self.relatedServiceDefinition = result;
      const properties: Properties = self.definition.properties;
      if (!properties.relatedViewFields || properties.relatedViewFields.length === 0) {
        self.showSearchOnField();
        self.cleanup();
      }
      else {
        self.values = [];
        properties.relatedViewFields.forEach((element) => {
          const val = self.appService.getValue(element.key, self.value);
          const retVal = self.getValue(val, element.key)
          self.values.push(retVal);
        });
      }

    },
      err => {

      })
  }
  cleanup() {
    const self = this;
    self.values = self.values.filter(e => e).map(val => {
      if (typeof val === 'object') {
        if (val.filename) {
          val = val.metadata.filename;
        } else if (val.formattedAddress) {
          val = val.formattedAddress;
        } else if (val._id) {
          val = val._id;
        }
      } else {
        // try {
        //   val = new Date(val);
        //   val = self.datePipe.transform(val, 'fullDate');
        // } catch (e) {
        //   val = val;
        // }
      }
      return val;
    });
    if (!self.values.length) {
      self.showSearchOnField();
    }
  }
  showSearchOnField() {
    const self = this;
    self.values = [];
    const properties: Properties = self.definition.properties;
    const temp = self.appService.getValue(self.definition.key + '.' + properties.relatedSearchField, self.value);
    if (temp) {
      self.values.push({ value: temp });
    } else {
      if (self.appService.getValue(properties.relatedSearchField, self.value) !== undefined) {
        const value = self.appService.getValue(properties.relatedSearchField, self.value);
        self.values.push(self.getValue(value, properties.relatedSearchField));
      } else {
        self.commonService.getService(self.relatedSrvcDef).then(result => {
          if (result.api) {
            const api = '/' + result.app + result.api;
            self.commonService.get('api', api, { filter: self.value }).subscribe(data => {
              const value = self.appService.getValue(properties.relatedSearchField, data[0]);
              self.values.push({ value: value });
              self.values = _.uniqBy(self.values, 'value');
            });
          }
        }).catch(err => {

        });
      }
    }
  }

  getValue(value, key) {

    const self = this;
    let retValue;
    const relsrvcDef = self.relatedServiceDefinition.attributeList.find(e => e.key === key);
    // Relation view field Secure Text

    if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.password) {
      retValue = {
        value: value.value,
        isSecureText: true
      };
      self.isSecureTextPresent = true;
    }
    // Relation view field File
    else if (relsrvcDef && relsrvcDef.type === 'File') {
      retValue = { value: value.metadata.filename };
    }
    // Relation view field Location
    else if (relsrvcDef && relsrvcDef.type === 'Geojson') {
      retValue = { value: value.userInput ? value.userInput : value.formattedAddress };
    }
    else {
      retValue = { value: value };
    }
    return retValue;
  }
}
