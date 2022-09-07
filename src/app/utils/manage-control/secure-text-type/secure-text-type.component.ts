import { Component, OnInit, AfterViewInit, Input, Output, ViewChild, EventEmitter, ElementRef } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';

import { FormService } from 'src/app/service/form.service';
import { Md5 } from 'ts-md5';
import { AppService } from '../../../service/app.service';
import { CommonService } from '../../../service/common.service';

@Component({
  selector: 'odp-secure-text-type',
  templateUrl: './secure-text-type.component.html',
  styleUrls: ['./secure-text-type.component.scss']
})
export class SecureTextTypeComponent implements OnInit, AfterViewInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output() keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('inputControl', { static: false }) inputControl: ElementRef;
  password: string;
  showPassword: boolean;
  decryptedValue: string;
  constructor(private formService: FormService, private appService: AppService,
    private commonService: CommonService) {
    const self = this;
    self.keyupEvent = new EventEmitter<KeyboardEvent>();
  }

  ngOnInit() {
    const self = this;
    if (self.control.value === null) {
      self.control.patchValue('');
    }
    if (self.control.value && self.control.value.value) {
      self.password = self.control.value.value;
    }
    if (self.definition.properties.required) {
      self.control.setValidators([Validators.required])
    } else {
      self.control.clearValidators();
    }
  }

  ngAfterViewInit() {
    if (this.inputControl && (this.first || this.formService.shouldFocus)) {
      if (!this.inputControl.nativeElement.value) {
        this.formService.shouldFocus = false;
        this.inputControl.nativeElement.focus();
      }
    }
  }

  onEnter(event: KeyboardEvent) {
    const self = this;
    self.keyupEvent.emit(event);
  }

  onChange(value) {
    const self = this;
    if (value) {
      self.control.patchValue({
        value
      });
    } else {
      self.control.patchValue(null);
    }
    self.control.markAsTouched();
    self.control.markAsDirty();
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }

  get patternError() {
    const self = this;
    let retValue = false;
    if (this.control.value && self.control.value.value && this.definition.properties.pattern) {
      const regex = new RegExp(this.definition.properties.pattern);
      let arr = self.control.value.value.match(regex);
      if (!arr) {
        retValue = true;
        this.control.setErrors({ 'invalid': true });
      }
      else if (arr && (arr[0] != arr.input)) {
        retValue = true;
        this.control.setErrors({ 'invalid': true });
      }

      else {
        if (self.definition.properties.required) {
          self.control.setValidators([Validators.required])
        } else {
          self.control.clearValidators();
        }
      }

    }
    return retValue;
  }

  showDecryptedValue() {
    const self = this;
    let value = this.definition.value
    // self.showPassword = !self.showPassword;
    if (self.showPassword && !self.decryptedValue) {
      let cksm = Md5.hashStr(value.value);
      if (value.checksum && value.checksum === cksm) {
        self.decryptedValue = value.value;
      }
      else {
        self.commonService.post('api', self.appService.serviceAPI + '/utils/sec/decrypt', { data: value.value }).subscribe(res => {
          self.decryptedValue = res.data;
          self.password = self.decryptedValue
        }, err => {
          self.decryptedValue = value.value
          self.password = self.decryptedValue;
        })
      }
    }

  }

  get minLengthError() {
    const self = this;
    return self.control.hasError('minlength');
  }

  get maxLengthError() {
    const self = this;
    return self.control.hasError('maxlength');
  }

}
