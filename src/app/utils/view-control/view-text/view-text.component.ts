import { Component, OnInit, Input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { Md5 } from 'ts-md5/dist/md5';

@Component({
  selector: 'odp-view-text',
  templateUrl: './view-text.component.html',
  styleUrls: ['./view-text.component.scss']
})
export class ViewTextComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;
  @Input() isSubObject: boolean = false;
  showPassword;
  decryptedValue;
  valueCreated: boolean;
  valueUpdated: boolean;
  constructor(private appService: AppService,
    private sanitize: DomSanitizer,
    private commonService: CommonService,) {
    const self = this;
    self.decryptedValue = {};
    self.showPassword = {};
  }

  ngOnInit() {
    const self = this;
  }


  isenrichTextWithLinkRequired(value) {
    let returnVal = false
    const rgxStr = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$"
    if (value && typeof (value) === 'string' && value.match(rgxStr)) {
      returnVal = true;
    }
    return returnVal;
  }

  enrichTextWithLink(value: string) {
    const self = this;
    try {
      const rgxStr = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$"
      if (self.definition.properties.email) {
        const temp = value.replace(/(.*)([\w]{2,}@[\w]{2,}\.[a-z\.]{2,})(.*)/, '$1<a href="mailto:$2">$2</a>$3');
        return temp;
      } else if (value && value.match(rgxStr)) {
        const temp1 = value.replace(/(.*)(https?:\/\/[\w-]{2,}\.[a-z\.]{2,}\S*)(.*)/, '$1<a href="$2" target="_blank">$2</a>$3')
        return temp1;
      } else {
        return value;
      }

    } catch (e) {
      return value;
    }
  }

  showDecryptedValue(value, type) {
    const self = this;

    let cksm = Md5.hashStr(value.value);
    if (value.checksum && value.checksum === cksm) {
      self.decryptedValue[type] = value.value;
    }
    else {
      self.commonService.post('api', self.appService.serviceAPI + '/utils/sec/decrypt', { data: value.value }).subscribe(res => {
        self.decryptedValue[type] = res.data;
      }, err => {
        self.decryptedValue[type] = value.value;
      })
    }
    self.showPassword[type] = !self.showPassword[type];
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
    if (self.newVal && self.oldVal && self.newVal !== self.oldVal) {
      retValue = true;
    } else if (!self.newVal && self.oldVal) {
      retValue = true;
    }
    return retValue;
  }


  get decryptedVal() {
    const self = this;
    return self.decryptedValue;
  }

  get oldVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.path, self.oldValue);
    if (typeof temp !== 'object' && temp !== undefined) {
      return temp + '';
    }
    return temp;
  }
  get newVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.path, self.newValue);
    if (typeof temp !== 'object' && temp !== undefined) {
      return temp + '';
    }
    return temp;
  }
}
