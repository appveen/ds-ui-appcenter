import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Output,
  EventEmitter
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { FormService } from 'src/app/service/form.service';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import * as RandExp from 'randexp';
@Component({
  selector: 'odp-text-type',
  templateUrl: './text-type.component.html',
  styleUrls: ['./text-type.component.scss']
})
export class TextTypeComponent implements OnInit, AfterViewInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output('keyupEvent') keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('inputControl', { static: false }) inputControl: ElementRef;
  @ViewChild('validationErrorsDot', { static: false }) validationErrorsDotRef: NgbTooltip;
  emailShow: boolean;
  patternErrorShow: boolean;
  minErrorShow: boolean;
  maxErrorShow: boolean;
  constructor(private formService: FormService,
  ) {
    const self = this;
    self.keyupEvent = new EventEmitter<KeyboardEvent>();
    self.emailShow = false;
    self.patternErrorShow = false;
    self.minErrorShow = false;
    self.maxErrorShow = false;
  }

  ngOnInit() {
    if(this.control.value == null && this.specificType == 'select'){
      this.control.setValue("");
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
    self.emailShow = false;
    self.patternErrorShow = false;
    self.minErrorShow = false;
    self.maxErrorShow = false;
    if (self.control.value && self.control.value.length === 0) {
      self.emailShow = false;
    }
  }

  onFocus() {
    const self = this;
    if (self.validationErrorsDotRef) {
      self.validationErrorsDotRef.open();
    }
  }
  generateSampleRegex(_value) {
    const self = this;
    self.definition.properties.sampleValue = [];
    if (_value) {
      for (let i = 0; i < 3; i++) {
        self.definition.properties.sampleValue.push(self.generate(_value));
      }
    }
  }

  generate(_value) {
    const randexp = new RandExp(_value);
    const sampleValue = randexp.gen();
    return sampleValue;
  }

  get specificType() {
    const self = this;
    if (self.definition.properties.password) {
      return 'password';
    } else if (self.definition.properties.email) {
      return 'email';
    } else if (self.definition.properties.enum && self.definition.properties.enum.length > 0) {
      return 'select';
    } else {
      return 'text';
    }
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }

  get emailError() {
    const self = this;
    if (self.emailShow) {
      return self.control.hasError('email');
    } else {
      return false;
    }

  }
  tabOut() {
    const self = this;
    if (self.control.hasError('email')) {
      self.emailShow = true;
    } else {
      self.emailShow = false;
    }
    if (self.control.hasError('pattern')) {
      self.patternErrorShow = true;
    } if (self.control.hasError('minlength')) {
      self.minErrorShow = true;
    } if (self.control.hasError('maxlength')) {
      self.maxErrorShow = true;
    }
  }
  get patternError() {
    const self = this;
    return self.control.hasError('pattern') && self.control.touched;
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
