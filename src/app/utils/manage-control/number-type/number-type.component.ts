import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { FormControl } from '@angular/forms';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { FormService } from 'src/app/service/form.service';


@Component({
  selector: 'odp-number-type',
  templateUrl: './number-type.component.html',
  styleUrls: ['./number-type.component.scss']
})
export class NumberTypeComponent implements OnInit, AfterViewInit {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output('keyupEvent') keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('numberTypeInput', { static: false }) numberTypeInput: ElementRef;
  @ViewChild('validationErrorsDot', { static: false }) validationErrorsDotRef: NgbTooltip;
  constructor(private formService: FormService,
  ) {
    const self = this;
    self.keyupEvent = new EventEmitter();
  }

  ngOnInit() {
    const self = this;
  }

  ngAfterViewInit() {
    if (this.numberTypeInput && (this.first || this.formService.shouldFocus)) {
      if (!this.numberTypeInput.nativeElement.value) {
        this.formService.shouldFocus = false;
        this.numberTypeInput.nativeElement.focus();
      }
    }
  }

  setValue() {
    const self = this;
    if (self.definition.properties.precision !== undefined && self.definition.properties.precision > 0) {
      const precision = Math.pow(10, self.definition.properties.precision);
      self.control.patchValue(Math.round(parseFloat(self.control.value) * precision) / precision);
    } else {
      self.control.patchValue(Math.round(parseFloat(self.control.value)));
    }
  }

  onKeyup(event: KeyboardEvent) {
    const self = this;
    self.keyupEvent.emit(event);
  }

  onFocus() {
    const self = this;
    if (self.validationErrorsDotRef) {
      self.validationErrorsDotRef.open();
    }
  }

  get specificType() {
    const self = this;
    if (self.definition.properties.currency) {
      return 'currency';
    } else if (self.definition.properties.enum && self.definition.properties.enum.length > 0) {
      return 'select';
    } else {
      return 'number';
    }
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }

  get minError() {
    const self = this;
    return self.control.hasError('min') && self.control.touched;
  }

  get maxError() {
    const self = this;
    return self.control.hasError('max') && self.control.touched;
  }
}
