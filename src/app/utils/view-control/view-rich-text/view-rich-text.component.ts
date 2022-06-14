import { Component, OnInit, Input, SecurityContext } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { DomSanitizer } from '@angular/platform-browser';

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
  showPassword: boolean;


  constructor(private appService: AppService,
    private domSanitizer: DomSanitizer) { }

  ngOnInit() {
    const self = this;
    self.isSecureText = self.definition.properties.password ? self.definition.properties.password : false;
    self.showPassword = self.isSecureText ? false: true;
  }

  getContent(val: string) {
    const self = this;
    let temp = val + '';
    if(!self.showPassword) {
      val = self.hideText(val);
    }
    if (self.definition.properties.hasTokens) {
      for (const tok of self.definition.properties.hasTokens) {
        const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
        temp = temp.replace(regex, '$1' + '<span class="text-info font-weight-bold">$2</span>' + '$3');
      }
    }
    return self.domSanitizer.sanitize(SecurityContext.HTML, val);
    // return self.domSanitizer.bypassSecurityTrustHtml(val);
  }

  hideText(val){
    const doc = new DOMParser().parseFromString(val, 'text/html');
    if (doc.body.textContent && doc.body.textContent.trim()) {
      return '*'.repeat(doc.body.textContent.length);
    }
  }

  hasContent(val: string) {
    const doc = new DOMParser().parseFromString(val, 'text/html');
    if (doc.body.textContent && doc.body.textContent.trim()) {
      return true;
    }
    return false;
  }

  get isCreated(){
    const self =this;
    let retValue =false;
    if(self.newVal && !self.oldVal){
      retValue =true;
    }
    return retValue;
  }

  get isUpdated(){
    const self =this;
    let retValue =false;
    if(self.newVal && self.oldVal && self.newVal !== self.oldVal){
      retValue =true;
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
