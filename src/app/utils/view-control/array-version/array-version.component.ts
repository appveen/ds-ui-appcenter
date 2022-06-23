import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Md5 } from 'ts-md5/dist/md5';

import { CommonService } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-array-version',
  templateUrl: './array-version.component.html',
  styleUrls: ['./array-version.component.scss']
})
export class ArrayVersionComponent implements OnInit, OnDestroy {
  @Input() collectionFieldName: string;
  @Input() definition;
  @Input() oldValue;
  @Input() newValue;
  @Input() workflowDoc: any;
  @Input() controlType: string;
  relation: any;
  subscriptions: any = {};
  hasPath: boolean;
  definitionList: Array<any>;
  showPassword;
  decryptedValue;

  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }

  constructor(
    private commonService: CommonService,
    private appService: AppService,
  ) {
    this.hasPath = false;
    this.definitionList = [];
    this.decryptedValue = {};
    this.showPassword = {};
  }

  ngOnInit() {
    if (this.definition.definition) {
      this.hasPath = true;
    }
    this.flattenDefinition(this.definitionList, this.definition.definition);
    this.removeId(this.oldValue);
    this.removeId(this.newValue);
  }



  removeId(value) {
    if (value && value.length) {
      value.forEach(element => {
        delete element._id
      });
    }
  }

  ngOnDestroy() {
    Object.keys(this.subscriptions).forEach(key => {
      if (this.subscriptions[key]) {
        this.subscriptions[key].unsubscribe();
      }
    });
  }

  get type() {
    if (this.definition.properties.password) {
      return 'password';
    }
    if (this.definition.properties.relatedTo) {
      return 'relation';
    }
    if (this.definition.type === 'object') {
      return 'object';
    }
    if (this.definition.properties.longText || this.definition.properties.richText) {
      return 'textarea';
    }
    if (this.definition.type === 'Number') {
      return 'number';
    }
    if (this.definition.type === 'Date') {
      return 'date';
    }
    if (this.definition.type === 'File') {
      return 'file';
    }
    if (this.definition.type === 'Boolean') {
      return 'boolean';
    }
    if (this.definition.type === 'Object') {
      return 'Object';
    }
    if (this.definition.type === 'Geojson') {
      return 'Geojson';
    }
    if (this.definition.type === 'User') {
      return 'User';
    }
    return 'text';
  }

  replaceTokens(matchString) {
    const tokens = this.definition.properties.hasTokens;
    for (const tok of tokens) {
      const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
      matchString = matchString.replace(regex, '$1' + '<span class="token">$2</span>' + '$3');
    }
    return matchString;
  }

  getKeys(_obj) {
    return Object.keys(_obj);
  }

  getAttributes(_obj) {
    return Object.keys(_obj).filter(e => {
      if (e.charAt(0) !== '_' && e !== '_lastUpdated' && e !== '_createdAt') {
        return true;
      }
    });
  }

  getRelation(field) {
    const ISODateRegex = new RegExp(`(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d\\.\\d+)|
(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d)|(\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d)`);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (ISODateRegex.test(field)) {
      const d = new Date(field);
      field = (d.getDate() < 10 ? '0' + d.getDate() : d.getDate()) + '-' + monthNames[d.getMonth()] + '-' + d.getFullYear();
    }
    return field;
  }

  downloadFile(filename) {
    window.open(environment.url.api + this.appService.serviceAPI + '/utils/file/download/' + filename);
  }

  getDefinitionWithValue(def: any, val: any, index: number) {
    const temp = this.appService.cloneObject(def);
    temp.path = this.appService.compilePath(temp.path, [index]);
    if (this.hasPath) {
      temp.value = this.appService.getValue(temp.path, val);
    } else {
      temp.value = val;
    }
    return temp;
  }

  flattenDefinition(definitionList, definition, parent?) {
    if (definition) {
      definition.forEach(def => {
        const path = parent ? parent.path + '.' + def.key : def.key;
        const key = def.key;
        const camelCase = path.split('.').join(' ').split('#').join(' ').camelCase();
        const level = parent ? def.level + 1 : def.level;
        const value = def.value;
        const controlPath = parent ? parent.controlPath + '.' + def.key : def.key;
        def.controlPath = controlPath;
        const properties = def.properties;
        if (parent) {
          properties.name = parent.properties.name + '.' + properties.name;
        }
        if (def.type === 'Object') {
          this.flattenDefinition(definitionList, def.definition, def);
        } else {
          definitionList.push({
            controlPath,
            path,
            key,
            camelCase,
            type: def.type,
            properties,
            level,
            value
          });
        }
      });
    }
  }

  get isCollectionSecureRichLongText(){
    if(this.definition.properties.name == '_self' && (this.definition.properties?.longText || this.definition.properties?.richText)){
      return true;
    }
    return false;

  }

  showDecryptedValue(value, index, type) {
    this.showPassword[index + type] = !this.showPassword[index + type];
    if (this.showPassword[index + type]) {
      if(this.isCollectionSecureRichLongText){
        value = { 'value': value};
      }
      let cksm = Md5.hashStr(value.value);
      if (value.checksum && value.checksum === cksm) {
        this.decryptedValue[index + type] = value.value;
      }
      else {
        this.commonService.post('api', this.appService.serviceAPI + '/utils/sec/decrypt', { data: value.value }).subscribe(res => {
          this.decryptedValue[index + type] = res.data;
        }, err => {
          this.decryptedValue[index + type] = value.value;
        })
      }
    }
  }

  get isCreated() {
    let retValue = false;
    if (this.newVal && !this.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get isUpdated() {
    let retValue = false;
    if (this.newVal && this.oldVal) {
      const cleanNewvalue = this.appService.cloneObject(this.newVal);
      const cleanOldvalue = this.appService.cloneObject(this.oldVal);
      if (this.type === 'Object') {
        cleanNewvalue.forEach((element, index) => {
          this.appService.cleanArray(element, this.definition.definition);
        });
        cleanOldvalue.forEach((element, index) => {
          this.appService.cleanArray(element, this.definition.definition);
        });
      } else if (this.type === 'password') {
        cleanNewvalue.forEach(element => {
          if (element && element.value) {
            delete element._id
            delete element.value
          }
        });
        cleanOldvalue.forEach(element => {
          if (element && element.value) {
            delete element._id
            delete element.value
          }
        });
      }
      if (cleanNewvalue && cleanOldvalue && JSON.stringify(cleanNewvalue) !== JSON.stringify(cleanOldvalue)) {
        retValue = true;
      }
    } else if (!this.newVal && this.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get decryptedVal() {
    return this.decryptedValue;
  }

  get userInput() {
    if (this.definition.value && this.definition.value.userInput) {
      return this.definition.value.userInput;
    }
    return null;
  }

  get oldVal() {
    if (this.oldValue && Array.isArray(this.oldValue)) {
      if (this.oldValue.length) {
        return this.oldValue;
      } else {
        return null;
      }
    } else {
      if (this.oldValue) {
        delete this.oldValue._id
      }
      return this.oldValue;
    }
  }

  get newVal() {
    if (this.newValue && Array.isArray(this.newValue)) {
      if (this.newValue.length) {
        return this.newValue;
      } else {
        return null;
      }
    } else {
      if (this.newValue) {
        delete this.newValue._id
      }
      return this.newValue;
    }
  }
}
