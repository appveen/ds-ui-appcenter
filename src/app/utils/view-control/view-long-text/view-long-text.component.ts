import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-view-long-text',
  templateUrl: './view-long-text.component.html',
  styleUrls: ['./view-long-text.component.scss']
})
export class ViewLongTextComponent implements OnInit {

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
    private sanitize: DomSanitizer) { }

  ngOnInit() {
    const self = this;
    self.isSecureText = self.definition.properties.password ? self.definition.properties.password : false;
    if(self.isSecureText){
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
    if(this.isSecureText && (changes.oldValue || changes.newValue)){
      this.showPassword = {
        'default': false,
        'from': false,
        'to': false,
        'created': false
      };
      this.decryptedValue = {};
    }
  }


  isenrichTextWithLinkRequired(value) {
    let returnVal = false
    const rgxStr = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$"
    if (value && value.match(rgxStr)) {
      returnVal = true;
    }
    return returnVal;
  }

  enrichTextWithLink(value: string) {
    const self = this;
    try {
      const rgxStr = "^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$"
      if (value && value.match(rgxStr)) {
        const temp1 = value.replace(/(.*)(https?:\/\/[\w-]{2,}\.[a-z\.]{2,}\S*)(.*)/, '$1<a href="$2" target="_blank">$2</a>$3')
        // const temp1 = value.replace(/(.*)(https?:\/\/[\w]{2,}\.[a-z\.]{2,})(.*)/, '$1<a href="$2" target="_blank">$2</a>$3');
        return temp1
        // return self.sanitize.bypassSecurityTrustHtml(temp1);
      } else {
        return value;
      }

    } catch (e) {
      return value;
    }
  }

  getContent(val: string) {
    const self = this;

    val = escape(val);
    if (self.definition.properties.hasTokens) {
      for (const tok of self.definition.properties.hasTokens) {
        const regex = new RegExp('(.*)(' + escape(tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')) + ')(.*)', 'g');
        val = val.replace(regex, '$1' + '<span class="text-info font-weight-bold">$2</span>' + '$3');
      }
    }
    return unescape(val);
  }

  enrichSecureTextWithLink(val: string, type) {
    const self = this;
    if (type == 'default') {
      return self.enrichTextWithLink(val);
    } else {
      return self.enrichTextWithLink(self.decryptedValue[type]);
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
    if (self.newVal && self.oldVal && self.newVal !== self.oldVal) {
      retValue = true;
    } else if (!self.newVal && self.oldVal) {
      retValue = true;
    }
    return retValue;
  }

  get oldVal() {
    const self = this;
    return self.appService.getValue(self.definition.path, self.oldValue);
  }
  get newVal() {
    const self = this;
    return self.appService.getValue(self.definition.path, self.newValue);
  }

  togglePassword(value, type) {
    const self = this;

    if(type == "default" && !self.decryptedValue[type]){
      self.decryptedValue[type] = value;
      self.showPassword[type] = !self.showPassword[type];
    }
    else if(!self.showPassword[type]) {

      if(!self.decryptedValue[type]) {
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

}
