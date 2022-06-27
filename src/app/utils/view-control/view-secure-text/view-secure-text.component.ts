import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService } from 'src/app/service/common.service';
import { Md5 } from 'ts-md5';

@Component({
  selector: 'odp-view-secure-text',
  templateUrl: './view-secure-text.component.html',
  styleUrls: ['./view-secure-text.component.scss']
})
export class ViewSecureTextComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;
  showPassword;
  decryptedValue;
  valueCreated: boolean;
  valueUpdated: boolean;
  api
  constructor(private appService: AppService,
    private sanitize: DomSanitizer,
    private commonService: CommonService,) {
    const self = this;
    self.decryptedValue = {};
    self.showPassword = {};
  }

  ngOnInit(): void {
  }

  showDecryptedValue(value, type) {
    const self = this;
    self.showPassword[type] = !self.showPassword[type];
    if (!self.showPassword[type]) {
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
    }

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
    if (!self.newVal && self.oldVal) {
      retValue = true;
    }
    if (self.newVal && self.oldVal && self.newVal.checksum && self.oldVal.checksum && self.newVal.checksum !== self.oldVal.checksum) {
      retValue = true;
    }
    else if (self.newVal && self.oldVal && !self.newVal.checksum && self.oldVal.checksum) {
      let cksm = Md5.hashStr(self.newVal.value);
      if (cksm !== self.oldVal.checksum) {
        retValue = true;
      }
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
