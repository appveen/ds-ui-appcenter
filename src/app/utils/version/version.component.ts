import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/service/app.service';


@Component({
  selector: 'odp-version',
  templateUrl: './version.component.html',
  styleUrls: ['./version.component.scss']
})
export class VersionComponent implements OnInit, OnDestroy {

  @Input() definition;
  @Input() oldValue;
  @Input() newValue;
  relation: any;
  subscriptions: any = {};
  constructor(
    private commonService: CommonService,
    private appService: AppService,
  ) {
  }

  ngOnInit() {
    const self = this;
  }
  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  get type() {
    const self = this;
    if (self.definition.properties.password) {
      return 'password';
    }
    if (self.definition.properties.relatedTo) {
      return 'relation';
    }
    if (self.definition.type === 'object') {
      return 'object';
    }
    if (self.definition.properties.longText || self.definition.properties.richText) {
      return 'textarea';
    }
    if (self.definition.type === 'Number') {
      return 'number';
    }
    if (self.definition.type === 'Date') {
      return 'date';
    }
    if (self.definition.type === 'File') {
      return 'file';
    }
    if (self.definition.type === 'Boolean') {
      return 'boolean';
    }
    if (self.definition.type === 'Object') {
      return 'Object';
    }
    if (self.definition.type === 'Geojson') {
      return 'Geojson';
    }
    return 'text';
  }

  replaceTokens(matchString) {
    const self = this;
    const tokens = self.definition.properties.hasTokens;
    for (const tok of tokens) {
      const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
      matchString = matchString.replace(regex, '$1' + '<span class="token">$2</span>' + '$3');
    }
    return matchString;
  }

  getKeys(obj) {
    return Object.keys(obj);
  }

  getAttributes(obj) {
    return Object.keys(obj).filter(e => {
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
    const self = this;
    window.open(environment.url.api + self.appService.serviceAPI + '/file/download/' + filename);
  }
  getDefinitionWithValue(def: any, val: any, index: number) {
    const self = this;
    const temp = self.appService.cloneObject(def);
    temp.path = self.appService.compilePath(temp.path, [index]);
    if (typeof val === 'object' && def.type !== 'Relation' && def.type !== 'File') {
      if (self.appService.getValue(temp.key, val)) {
        temp.value = self.appService.getValue(temp.key, val);
      } else {
        temp.value = self.appService.getValue(temp.path, val);
      }
    } else {
      temp.value = val;
    }
    return temp;
  }
  get userInput() {
    const self = this;
    if (self.definition.value && self.definition.value.userInput) {
      return self.definition.value.userInput;
    }
    return null;
  }

}
