import { Component, OnInit, Input } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { DomSanitizer } from '@angular/platform-browser';

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
  showPassword: boolean;

  constructor(private appService: AppService,
    private sanitize: DomSanitizer) { }

  ngOnInit() {
    const self = this;
    self.isSecureText = self.definition.properties.password ? self.definition.properties.password : false;
    self.showPassword = self.isSecureText ? false: true;
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
    if(!self.showPassword) {
      val = self.hideText(val);
    }
    val = escape(val);
    if (self.definition.properties.hasTokens) {
      for (const tok of self.definition.properties.hasTokens) {
        const regex = new RegExp('(.*)(' + escape(tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')) + ')(.*)', 'g');
        val = val.replace(regex, '$1' + '<span class="text-info font-weight-bold">$2</span>' + '$3');
      }
    }
    return unescape(val);
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

  hideText(val){
    return '*'.repeat(val.length);
  }

}
