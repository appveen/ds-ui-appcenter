import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { Properties } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from '../../../service/common.service';
import * as _ from 'lodash';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'odp-view-relation',
    templateUrl: './view-relation.component.html',
    styleUrls: ['./view-relation.component.scss']
})
export class ViewRelationComponent implements OnInit {

    @Input() definition: any;
    @Input() value: any;
    @Input() oldValue: any;
    @Input() newValue: any;
    @Input() workflowDoc: any;

    values: Array<any>;
    newValues: Array<any>;
    oldValues: Array<any>;
    relationLink: string;
    relatedId: string;
    serviceAccess: boolean;
    subscriptions: any = {};
    relatedSrvcDef: string;
    showPassword: boolean;
    relatedServiceDefinition: any;
    isSecureTextPresent: boolean;

    constructor(private appService: AppService,
        private commonService: CommonService,
        private ts: ToastrService) {
        const self = this;
        self.values = [];
        self.newValues = [];
        self.serviceAccess = true;
    }


    ngOnChanges(changes: SimpleChanges) {
        const self = this;
        self.newValues = [];
        self.oldValues = [];
        self.oldValuesList();
        self.newValuesList();

    }
    ngOnInit() {
        const self = this;
        if (self.definition.value) {

            if (Object.keys(self.definition.value).length === 2 && '_href' in self.definition.value) {
                self.getDocument(self.definition.value);
            }
            const properties: Properties = self.definition.properties;
            const srvcIdx = self.appService.fetchedServiceList.findIndex(sid => sid._id === properties.relatedTo);
            self.serviceAccess = srvcIdx !== -1;
            self.relationLink = `/~/services/${properties.relatedTo}/view/`;
            self.relatedSrvcDef = `/${properties.relatedTo}`
            self.getServiceDetails();

            let relVal = self.appService.getValue(self.definition.key, self.definition.value);
            if (!relVal || !relVal._id) {
                relVal = self.appService.getValue(self.definition.path, self.value);
            }
            if (self.definition.key === '#') {
                relVal = self.definition.value;
            }
            if (relVal && relVal._id) {
                self.relatedId = relVal._id;
            }
        }
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
            
            }
            return val;
        });
        if (!self.values.length) {
            self.showSearchOnField();
        }
    }
    showSearchOnField() {
        const self = this;
        const properties: Properties = self.definition.properties;
        const temp = self.appService
            .getValue(self.definition.key + '.' + properties.relatedSearchField, self.definition.value);
        if (temp) {
            self.values.push({ value: temp });
        } else {
            if (self.appService.getValue(properties.relatedSearchField, self.definition.value) !== undefined) {
                const value = self.appService.getValue(properties.relatedSearchField, self.definition.value);
                self.values.push(self.getValue(value, properties.relatedSearchField));
            } else {
                self.commonService.getService(self.relatedSrvcDef).then(result => {
                    if (result.api) {
                        const api = '/' + result.app + result.api;
                        self.commonService.get('api', api, { filter: self.definition.value }).subscribe(data => {
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
                properties.relatedViewFields.forEach((element) => {
                    const val = self.appService.getValue(element.key, self.definition.value);
                    const retVal = self.getValue(val, element.key)
                    self.values.push(retVal);
                });
            }
            self.oldValuesList();
            self.newValuesList();
        },
            err => {

            })
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


    get oldVal() {
        const self = this;
        let oldVal;
        if (self.definition) {
            oldVal = self.appService.getValue(self.definition.path, self.oldValue);
        }
        return oldVal;
    }



    getDocument(value) {
        const self = this;
        const properties: Properties = self.definition.properties;
        self.commonService.getDocument(value._id, value._href, properties.relatedTo).then(result => {
            this.definition.value = result;
        }, err => {

        });
    }
    oldValuesList() {
        const self = this;
        let value;
        self.oldValues = [];
        const properties: Properties = self.definition.properties;
        if (this.oldVal && !this.oldVal._href && self.relatedServiceDefinition) {
            this.oldVal._href = '/api/c/' + this.commonService.app._id + self.relatedServiceDefinition.api + '/' + this.oldVal._id;
            // self.oldVal._href ='/api/c/sowLRS/channelNameList/CHA1008';
        }
        if (self.oldVal && this.oldVal._href) {
            self.commonService.getDocument(this.oldVal._id, this.oldVal._href, properties.relatedTo).then(result => {
                value = result;
                if (properties.relatedViewFields.length) {
                    properties.relatedViewFields.forEach((element) => {
                        const val = self.appService.getValue(element.key, value);
                        const retVal = self.getValue(val, element.key);
                        self.oldValues.push(retVal);
                    });
                } else {
                    const val = self.appService.getValue(properties.relatedSearchField, value);
                    const retVal = self.getValue(val, properties.relatedSearchField);
                    self.oldValues.push(retVal);
                }
            }, err => { });
        }

    }
    newValuesList() {
        const self = this;
        self.newValues = [];
        let value;
        const properties: Properties = self.definition.properties;
        if (this.newVal && !this.newVal._href && self.relatedServiceDefinition) {
            this.newVal._href = '/api/c/' + this.commonService.app._id + self.relatedServiceDefinition.api + '/' + this.newVal._id;
            // self.newVal._href ='/api/c/sowLRS/channelNameList/CHA1008';
        }
        if (self.newVal && this.newVal._href) {

            self.commonService.getDocument(self.newVal._id, self.newVal._href, properties.relatedTo).then(result => {
                value = result;
                if (properties.relatedViewFields.length) {
                    properties.relatedViewFields.forEach((element) => {
                        const val = self.appService.getValue(element.key, value);
                        const retVal = self.getValue(val, element.key);
                        self.newValues.push(retVal);
                    });
                } else {
                    const val = self.appService.getValue(properties.relatedSearchField, value);
                    const retVal = self.getValue(val, properties.relatedSearchField);
                    self.newValues.push(retVal);
                }
            }, err => { });
        }


    }
    get newVal() {
        const self = this;
        let newVal;
        if (self.definition) {
            newVal = self.appService.getValue(self.definition.path, self.newValue);
        }
        return newVal;
    }
    get isCreated() {
        const self = this;
        let retValue = false;
        if (self.newVal && !self.oldVal) {
            retValue = true;
        }
        return retValue;
    }

    get isUpdated() {
        const self = this;
        let retValue = false;
        if (self.newVal && self.oldVal && self.newVal._id &&  self.oldVal._id && self.newVal._id !== self.oldVal._id) {
            retValue = true;
        }else if (!self.newVal && self.oldVal) {
            retValue = true;
          }
        return retValue;
    }

    get defVal(){
        const self = this;
        let newVal;
        if (self.definition) {
            newVal = self.appService.getValue(self.definition.path, self.value);
        }

        if(!newVal){
            newVal =self.value;
        }
        return newVal;
    }
}
