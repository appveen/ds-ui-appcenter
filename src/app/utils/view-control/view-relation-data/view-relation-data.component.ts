import { Component, OnInit, Input } from '@angular/core';
import * as _ from 'lodash';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { Properties } from 'src/app/interfaces/definition';
@Component({
  selector: 'odp-view-relation-data',
  templateUrl: './view-relation-data.component.html',
  styleUrls: ['./view-relation-data.component.scss'],
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

  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }

  constructor(
    private appService: AppService,
    private commonService: CommonService,
  ) {
    const self = this;
    self.values = [];
  }

  ngOnInit(): void {
    const self = this;
    if (self.value) {
      if (Object.keys(self.value).length === 2 && '_href' in self.value) {
        self.getDocument(self.value);
      }
      const properties: Properties = self.definition.properties;
      self.checkForServiceAccess(2000);
      self.relationLink = `/${self.currentAppId}/services/${properties.relatedTo}/view/`;
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
        const temp = [];
        properties.relatedViewFields.forEach((element) => {
          if(!!element.properties.dataPath) {
            var val = self.appService.getValue(element.properties.dataPath, self.value);
            if(typeof(val)=='object'){
              val=val._id;
            }
            const retVal = self.getValue(val, element.key);
            if(element.properties.password){
              self.isSecureTextPresent = true;
              temp.push({
                value: val.value,
                type: 'secureText'
              })
            }else{
              temp.push(retVal);
            }
          } else {
            self.isSecureTextPresent = true;
            temp.push({
              value: self.appService.getValue(element.properties.name, self.value),
              type: 'secureText'
            })
          }
        });
        self.values = [...temp];
      }
      this.checkForServiceAccess();
    },
    err => {
      this.checkForServiceAccess();
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
      self.values = [{ value: temp }];
    } else {
      if (self.appService.getValue(properties.relatedSearchField, self.value) !== undefined) {
        const value = self.appService.getValue(properties.relatedSearchField, self.value);
        self.values = [self.getValue(value, properties.relatedSearchField)];
      } else {
        self.commonService.getService(self.relatedSrvcDef).then(result => {
          if (result.api) {
            const api = '/' + result.app + result.api;
            self.commonService.get('api', api, { filter: self.value }).subscribe(data => {
              const value = self.appService.getValue(properties.relatedSearchField, data[0]);
              const tmp = [{ value }];
              self.values = _.uniqBy(tmp, 'value');
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
    const relsrvcDef = self.relatedServiceDefinition.definition.find(e => e.properties.dataPath === key);

    if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.password) {
      retValue = {
        value: value.value,
        type: 'secureText'
      };
      self.isSecureTextPresent = true;
    } else if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.richText) {
      retValue = {
        value,
        type: 'richText',
        definition: {...relsrvcDef, value, path: ''}
      };
    } else if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.dateType === 'date' && value) {
      let dateString = this.appService.getUTCString(value.rawData,value.tzInfo)
      retValue = {
        value: dateString,
        type: 'date'
      };
    } else if (relsrvcDef && relsrvcDef.properties && relsrvcDef.properties.dateType === 'datetime-local' && value) {
      let dateString = this.appService.getUTCString(value.rawData, value.tzInfo)

      retValue = {
        value: dateString,
        type: 'datetime'
      };
    } else if (relsrvcDef && relsrvcDef.properties && [relsrvcDef.properties._type, relsrvcDef.properties._typeChanged].includes('Boolean')) {
      retValue = { 
        value: value ,
        type: 'boolean'
      };
    } else if (relsrvcDef && relsrvcDef.properties  && [relsrvcDef.properties._type, relsrvcDef.properties._typeChanged].includes('File')) {
      retValue = { value: value.metadata.filename ,
        type: 'text'

      };
    } else if (relsrvcDef  && relsrvcDef.type === 'Geojson') {
      retValue = { value: value.userInput ? value.userInput : value.formattedAddress ,
        type: 'text'};
    } else if (relsrvcDef  && relsrvcDef.type === 'User') {
      retValue = {
        value: value._id ? value._id : value,
        type: 'text'
      };
    } else {
      retValue = {
        value: value,
        type: 'text'
      };
    }
    return retValue;
  }

  checkForServiceAccess(timeInMs?: number) {
    if(!!this.appService.fetchedServiceList?.length) {
      const srvcIdx = this.appService.fetchedServiceList.findIndex(sid => sid._id === this.definition?.properties?.relatedTo);
      this.serviceAccess = srvcIdx !== -1; 
    } else {
      setTimeout(() => {
        const srvcIdx = this.appService.fetchedServiceList.findIndex(sid => sid._id === this.definition?.properties?.relatedTo);
        this.serviceAccess = srvcIdx !== -1;   
      }, !!timeInMs ? timeInMs : 0);
    }
  }
}
