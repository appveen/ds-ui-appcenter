import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';

@Component({
    selector: 'odp-view-array',
    templateUrl: './view-array.component.html',
    styleUrls: ['./view-array.component.scss']
})
export class ViewArrayComponent implements OnInit {
    @Input() definition: any;
    @Input() value: any;
    @Input() oldValue: any;
    @Input() newValue: any;
    @Input() workflowDoc: any;
    @Input() collectionFieldName: string;
    hasPath: boolean;

    constructor(private appService: AppService) {
        const self = this;
        self.hasPath = false;
    }

    ngOnInit() {
        const self = this;
        if (self.definition.definition) {
            self.hasPath = true;
        }
    }

    getDefinitionWithValue(def: any, val: any, index: number) {
        const self = this;
        const temp = self.appService.cloneObject(def);
        temp.path = self.appService.compilePath(temp.path, [index]);
        if (self.hasPath) {
            temp.value = self.appService.getValue(temp.path, val);
        } else {
            temp.value = val;
        }
        return temp;
    }


    getMapDefValue(def: any, val: any, index: number) {
        const self = this;
        const temp = self.appService.cloneObject(def);
        temp.path = self.appService.compilePath(temp.path, [index]);
        if (self.appService.getValue(temp.key, val)) {
            temp.value = self.appService.getValue(temp.key, val);
        }
        return temp;
    }
    getMapDefinition(index: number) {
        const self = this;
        const def = [];
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.formatAddress',
            key: 'formatAddress',
            camelCase: 'formatAddress',
            type: 'String',
            properties: {
                name: 'Geocoded location'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.userInput',
            key: 'userInput',
            camelCase: 'userInput',
            type: 'String',
            properties: {
                name: 'Raw location'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.town',
            key: 'town',
            camelCase: 'town',
            type: 'String',
            properties: {
                name: 'Town'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.state',
            key: 'state',
            camelCase: 'state',
            type: 'String',
            properties: {
                name: 'State'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.country',
            key: 'country',
            camelCase: 'country',
            type: 'String',
            properties: {
                name: 'Country'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.pincode',
            key: 'pincode',
            camelCase: 'pincode',
            type: 'String',
            properties: {
                name: 'Pin Code'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.geometry.coordinates.1',
            key: 'geometry.coordinates.1',
            camelCase: 'latitude',
            type: 'Number',
            properties: {
                name: 'Latitude'
            },
            level: self.definition.level + 1
        });
        def.push({
            path: self.appService.compilePath(self.definition.path, [index]) + '.geometry.coordinates.0',
            key: 'geometry.coordinates.0',
            camelCase: 'longitude',
            type: 'Number',
            properties: {
                name: 'Longitude'
            },
            level: self.definition.level + 1
        });
        return def;
    }
    getValue(key, obj) {
        const self = this;
        return self.appService.getValue(key, obj);
    }

    getLabelWidth(def: any) {
        const self = this;
        let width = 'fit-content';
        if (def.type === 'Geojson') {
            width = '898px';
        } else if (def.type === 'String') {
            if (def.properties.longText || def.properties.richText) {
                width = '708px';
            }
        }
        if (self.controlType === 'map') {
            width = '300px';
        }
        return {
            minWidth: width
        };
    }

    get arrayValues() {
        const self = this;
        return self.definition.value ? self.definition.value : [];
    }

    get controlType() {
        const self = this;
        if (self.definition.type === 'Geojson') {
            return 'map';
        } else if (self.definition.type === 'Object') {
            return 'object';
        } else if (self.definition.type === 'Array') {
            return 'array';
        } else {
            return 'others';
        }
    }

    get oldVal() {
        const self = this;
        const path = self.definition.path.split('.').filter(e => e !== '#').join('.');
        return self.appService.getValue(path, self.oldValue);
    }
    get newVal() {
        const self = this;
        const path = self.definition.path.split('.').filter(e => e !== '#').join('.');

        return self.appService.getValue(path, self.newValue);
    }

}
