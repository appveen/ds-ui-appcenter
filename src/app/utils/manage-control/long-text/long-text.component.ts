import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'odp-long-text',
  templateUrl: './long-text.component.html',
  styleUrls: ['./long-text.component.scss']
})
export class LongTextComponent implements OnInit, AfterViewInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output('keyupEvent') keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('textarea', { static: false }) textarea: ElementRef;
  position: number;
  usedTokens: any;
  constructor() {
    const self = this;
    self.keyupEvent = new EventEmitter();
    self.usedTokens = {};
    self.position = 0;
  }

  ngOnInit() {
  }

  ngAfterViewInit() {
    const self = this;
    self.textarea.nativeElement.value = self.control.value;
    if (self.textarea) {
      if (!self.textarea.nativeElement.value && self.first) {
        self.textarea.nativeElement.focus();
      }
    }
  }

  getContent(_val) {
    const self = this;
    self.position = self.textarea.nativeElement.selectionStart;
    const _tokens = (<any>self.definition.properties).hasTokens;
    if (_tokens && _tokens.length > 0) {
      for (const tok of _tokens) {
        const regex = new RegExp('(.*)(' + tok.replace(/[-[\]{}()*+?.,%\\^$|#\s]/g, '\\$&') + ')(.*)', 'g');
        if (_val.match(regex)) {
          self.usedTokens[tok] = true;
        } else {
          self.usedTokens[tok] = false;
        }
      }
    }
    self.control.patchValue(_val);
    self.control.markAsTouched();
    self.control.markAsDirty();
  }
  putToken(_token) {
    const self = this;
    self.usedTokens[_token] = true;
    const textArr = self.textarea.nativeElement.value.split('');
    textArr.splice(self.position, 0, _token);
    self.position += _token.length;
    self.textarea.nativeElement.value = textArr.join('');
  }

  onKeyup(event: KeyboardEvent) {
    const self = this;
    const ele: HTMLInputElement = event.target as HTMLInputElement;
    self.position = ele.selectionStart;
  }

  onClick(event: Event) {
    const self = this;
    const ele: HTMLInputElement = event.target as HTMLInputElement;
    self.position = ele.selectionStart;
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }
}
