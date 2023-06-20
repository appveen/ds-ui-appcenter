import { Component, OnInit, Input, ElementRef, OnDestroy, Output, EventEmitter, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from 'rxjs';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';


@Component({
  selector: 'odp-date-type',
  templateUrl: './date-type.component.html',
  styleUrls: ['./date-type.component.scss'],
  providers: [DatePipe]
})
export class DateTypeComponent implements OnInit, OnDestroy {

  @Input() control: UntypedFormControl;
  @Input() definition: any;
  @Input() first: boolean;
  @Output() keyupEvent: EventEmitter<KeyboardEvent>;
  @ViewChild('numberTypeInput', { static: false }) numberTypeInput: ElementRef;
  @ViewChild('validationErrorsDot', { static: false }) validationErrorsDotRef: NgbTooltip;
  selectClickSubscription: Subscription;
  showDatePicker: boolean;
  supportedTimezones: Array<string>;
  selectedTimezone: string;
  initialDateStr: string;
  constructor(private datePipe: DatePipe,
    private _elementRef: ElementRef,
    private appService: AppService,
    private commonService: CommonService
  ) {
    this.keyupEvent = new EventEmitter();
    this.supportedTimezones = [];
    this.selectedTimezone = this.commonService.userDetails.defaultTimezone;
  }

  ngOnInit() {
    this._elementRef.nativeElement.classList.add('position-relative');
    this.selectClickSubscription = this.appService.selectClicked.subscribe(_clicked => {
      this.showDatePicker = _clicked;
    });
    this.supportedTimezones = this.definition.properties.supportedTimezones || [];
    // this.supportedTimezones.unshift(this.definition.properties.defaultTimezone);
    this.selectedTimezone = this.definition.properties.defaultTimezone;
    if (!this.selectedTimezone) {
      this.selectedTimezone = this.commonService.userDetails.defaultTimezone;
    }
    if (this.control && this.control.value) {
      if (this.control.value.rawData) {
        this.initialDateStr = this.appService.getUTCString(this.control.value.rawData, this.control.value.tzInfo);
        this.selectedTimezone = this.control.value.tzInfo;
      } else {
        this.initialDateStr = this.appService.getUTCString(this.control.value, this.selectedTimezone);
        // this.selectedTimezone = this.control.value.tzInfo;
      }
      if (this.appService?.serviceData?.simpleDate) {
        this.control.patchValue(this.initialDateStr);
      }
      else {
        this.control.patchValue({
          rawData: this.initialDateStr,
          tzInfo: this.selectedTimezone
        });
      }
    }
  }

  ngOnDestroy() {
    this.selectClickSubscription.unsubscribe();
  }

  clearValue() {
    if (this.definition.properties.readonly) {
      return;
    }
    this.initialDateStr = null;
    this.control.patchValue(null);
    this.control.markAsDirty();
  }

  formatDate(event) {
    const dateVal = event.target.value;
    const dateStr = new Date(dateVal).toString()
    if (this.appService?.serviceData?.simpleDate) {
      this.control.patchValue(dateStr);
    }
    else {
      this.control.patchValue({
        rawData: dateStr,
        tzInfo: this.selectedTimezone
      });
    }
    this.control.markAsDirty();
  }

  onEnter(event: KeyboardEvent) {
    this.keyupEvent.emit(event);
  }

  onFocus() {
    if (this.validationErrorsDotRef) {
      this.validationErrorsDotRef.open();
    }
  }

  onClick(event) {
    event.stopPropagation();
    if (this.definition.properties.readonly || this.control.disabled) {
      return;
    }
    const isClickedInside = this._elementRef.nativeElement.contains(event.target);
    this.showDatePicker = !!isClickedInside;
  }

  onTimezoneChange(val) {
    if (this.initialDateStr) {
      const momentDate = this.appService.getMoment(this.initialDateStr);
      const dateStr = this.appService.getTimezoneString(momentDate, val);
      if (this.appService?.serviceData?.simpleDate) {
        this.control.patchValue(dateStr);
      }
      else {
        this.control.patchValue({
          rawData: dateStr,
          tzInfo: this.selectedTimezone
        });
      }
      this.control.markAsTouched();
      this.control.markAsDirty();
    }
  }

  setDefault(event) {
    const dateStr = new Date(this.defaultValue).toString()
    this.initialDateStr = new Date(this.defaultValue).toISOString();
    if (this.appService?.serviceData?.simpleDate) {
      this.control.patchValue(dateStr);
    }
    else {
      this.control.patchValue({
        rawData: dateStr,
        tzInfo: this.selectedTimezone
      });
    }
  }

  get selectedDate() {
    if (this.setValue) {
      if (this.definition.properties.dateType === 'date') {
        return this.datePipe.transform(this.setValue, 'dd-MMM-yyyy');
      } else {
        return this.datePipe.transform(this.setValue, 'dd-MMM-yyyy hh:mm:ss a');
      }
    } else {
      return '';
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
    if (!this.initialDateStr) {
      return null;
    }
    return this.initialDateStr;
  }

  set setValue(val) {
    this.initialDateStr = val;
    const momentDate = this.appService.getMoment(val);
    const dateStr = this.appService.getTimezoneString(momentDate, this.selectedTimezone);
    if (this.appService?.serviceData?.simpleDate) {
      this.control.patchValue(dateStr);
    }
    else {
      this.control.patchValue({
        rawData: dateStr,
        tzInfo: this.selectedTimezone
      });
    }

    this.control.markAsTouched();
    this.control.markAsDirty();
  }

  get controlType() {
    if (this.definition.properties.dateType === 'date') {
      return 'date';
    } else {
      return 'datetime-local';
    }
  }

  get requiredError() {
    return this.control.hasError('required') && this.control.touched;
  }

  get defaultValue() {
    if (this.definition && this.definition.properties && this.definition.properties.default) {
      if (this.definition.properties.dateType === 'date') {
        return this.datePipe.transform(this.definition.properties.default, 'mediumDate');
      } else {
        return this.datePipe.transform(this.definition.properties.default, 'medium');
      }
    }
    return null;
  }
}
