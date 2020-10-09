import { Component, OnInit, Input, HostListener, ElementRef, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/service/app.service';


@Component({
  selector: 'odp-date-type',
  templateUrl: './date-type.component.html',
  styleUrls: ['./date-type.component.scss'],
  providers: [DatePipe]
})
export class DateTypeComponent implements OnInit, OnDestroy {

  @Input() control: FormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output('keyupEvent') keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('numberTypeInput', { static: false }) numberTypeInput: ElementRef;
  @ViewChild('validationErrorsDot', { static: false }) validationErrorsDotRef: NgbTooltip;
  selectClickSubscription: Subscription;
  showDatePicker: boolean;
  dateHolder: any;

  constructor(private datePipe: DatePipe,
    private _elementRef: ElementRef,
    private appService: AppService,
  ) {
    const self = this;
    self.keyupEvent = new EventEmitter();
  }

  ngOnInit() {
    const self = this;
    self.selectClickSubscription = self.appService.selectClicked.subscribe(_clicked => {
      self.showDatePicker = _clicked;
    });
    if (self.control && self.control.value) {
      const temp = self.control.value;
      if (self.definition.properties.dateType === 'date') {
        self.control.patchValue(self.datePipe.transform(temp, 'yyyy-MM-dd'));
      } else {
        self.control.patchValue(new Date(temp).toISOString());
      }
      self.dateHolder = self.control.value;
    }
  }

  ngOnDestroy() {
    this.selectClickSubscription.unsubscribe();
  }

  clearValue() {
    const self = this;
    if (self.definition.properties.readonly) {
      return;
    }
    self.control.patchValue(null);
    self.control.markAsDirty();
  }

  formatDate(event) {
    const self = this;
    const dateStr = event.target.value;
    const isoDate = new Date(dateStr).toISOString();
    self.control.patchValue(isoDate);
    self.control.markAsDirty();
  }

  onEnter(event: KeyboardEvent) {
    const self = this;
    self.keyupEvent.emit(event);
  }

  onFocus() {
    const self = this;
    if (self.validationErrorsDotRef) {
      self.validationErrorsDotRef.open();
    }
  }

  get selectedDate() {
    const self = this;
    if (self.control.value && typeof self.control.value !== 'object') {
      if ((<any>this.definition.properties).dateType === 'date') {
        return self.datePipe.transform(self.control.value, 'dd-MMM-yyyy');
      } else {
        return self.datePipe.transform(self.control.value, 'dd-MMM-yyyy hh:mm:ss a');
      }
    } else {
      return 'Select Date';
    }
  }

  get fieldType() {
    if ((this.definition.properties as any).dateType === 'date') {
      return 'date';
    } else {
      return 'date-time';
    }
  }

  get setValue() {
    const self = this;
    if (typeof self.control.value === 'object') {
      return null;
    }
    return self.control.value;
  }

  set setValue(val) {
    const self = this;
    self.control.patchValue(val);
    self.control.markAsTouched();
    self.control.markAsDirty();
  }

  @HostListener('document:click', ['$event'])
  public onClick(event) {
    event.stopPropagation();
    if (this.definition.properties.readonly || this.control.disabled) {
      return;
    }
    const isClickedInside = this._elementRef.nativeElement.contains(event.target);
    this.showDatePicker = !!isClickedInside;
  }

  get controlType() {
    const self = this;
    if (self.definition.properties.dateType === 'date') {
      return 'date';
    } else {
      return 'datetime-local';
    }
  }

  get requiredError() {
    const self = this;
    return self.control.hasError('required') && self.control.touched;
  }
}
