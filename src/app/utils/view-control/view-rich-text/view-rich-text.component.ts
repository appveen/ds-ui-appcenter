import { Component, OnInit, Input, SecurityContext, SimpleChanges } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-view-rich-text',
  templateUrl: './view-rich-text.component.html',
  styleUrls: ['./view-rich-text.component.scss']
})
export class ViewRichTextComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() workflowDoc: any;
  isSecureText: boolean;
  showPassword: any;
  decryptedValue: any;

  constructor(private appService: AppService,
    private commonService: CommonService,
    private domSanitizer: DomSanitizer) {
  }

  ngOnInit() {
    const self = this;
    self.isSecureText = self.definition.properties.password ? self.definition.properties.password : false;
    if (self.isSecureText) {
      this.showPassword = {
        'default': false,
        'from': false,
        'to': false,
        'created': false
      };
      this.decryptedValue = {};
    }
  }


  ngOnChanges(changes: SimpleChanges): void {
    const self = this;
    if (this.isSecureText && (changes.oldValue || changes.newValue)) {
      this.showPassword = {
        'default': false,
        'from': false,
        'to': false,
        'created': false
      };
      this.decryptedValue = {};
    }
  }

  getContentSecure(val: string, type) {
    const self = this;
    if (type == 'default') {
      return self.getContent(val, type);
    } else {
      return self.getContent(self.decryptedValue[type], type);
    }
  }

  getContent(val: string, type?) {
    const self = this;
    let temp = val + '';

    if (self.definition.properties.hasTokens) {
      for (const tok of self.definition.properties.hasTokens) {
        const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
        temp = temp.replace(regex, '$1' + '<span class="text-info font-weight-bold">$2</span>' + '$3');
      }
    }
    return self.domSanitizer.sanitize(SecurityContext.HTML, val);
    // return self.domSanitizer.bypassSecurityTrustHtml(val);
  }


  togglePassword(value, type) {
    const self = this;

    if (type == "default" && !self.decryptedValue[type]) {
      self.decryptedValue[type] = value;
      self.showPassword[type] = !self.showPassword[type];
    }
    else if (!self.showPassword[type]) {

      if (!self.decryptedValue[type]) {
        self.commonService.post('api', self.appService.serviceAPI + '/utils/sec/decrypt', { data: value }).subscribe(res => {
          self.decryptedValue[type] = res.data;
          self.showPassword[type] = !self.showPassword[type];
        }, err => {
          self.decryptedValue[type] = value;
          self.showPassword[type] = !self.showPassword[type];
        })
      } else {
        self.showPassword[type] = !self.showPassword[type];
      }
    } else {
      self.showPassword[type] = !self.showPassword[type];
    }
  }


  hasContentSecure(val: string, type?) {
    const self = this;
    if (type == 'default') {
      return self.hasContent(val, type);
    } else {
      return self.hasContent(self.decryptedValue[type], type);
    }
  }

  hasContent(val: string, type?) {
    const self = this;
    const doc = new DOMParser().parseFromString(val, 'text/html');
    if (doc.body.textContent && doc.body.textContent.trim()) {
      return true;
    }
    return false;
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
    }
    return retValue;
  }
  get oldVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.path, self.oldValue);
    return temp;
  }
  get newVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.path, self.newValue);
    return temp;
  }

}
