import { Component, OnInit, Input, EventEmitter, Output, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';


@Component({
  selector: 'odp-date-picker',
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss']
})
export class DatePickerComponent implements OnInit, OnDestroy, AfterViewInit, ControlValueAccessor {
  @Input() options: {
    range?: boolean;
    type?: string;
    top?: string;
    right?: string;
    quickSelect?: boolean;
    floating?: boolean;
    buttons?: boolean;
  };
  @Output() fromChange: EventEmitter<any>;
  @Input() set from(value) {
    const self = this;
    if (value) {
      self.fromDate = new Date(value);
      self.fillMonthData(self.fromDate.getMonth(), self.fromDate.getFullYear());
    } else {
      self.fromDate = new Date();
    }
  }
  @Output() toChange: EventEmitter<any>;
  @Input() set to(value) {
    const self = this;
    if (value) {
      self.toDate = new Date(value);
    } else {
      self.toDate = new Date();
    }
  }

  @Output() togglePickerChange: EventEmitter<boolean>;
  @Input() togglePicker: boolean;
  /*@Input() set togglePicker(value) {
    const self = this;
    self.showPicker = value;
  }*/

  @ViewChild('year', { static: false }) year: ElementRef;
  @ViewChild('month', { static: false }) month: ElementRef;
  @ViewChild('hour', { static: false }) hour: ElementRef;
  @ViewChild('minute', { static: false }) minute: ElementRef;
  @ViewChild('second', { static: false }) second: ElementRef;

  private valueChange: any;
  private focusChange: any;
  private toChanged: boolean;
  private fromChanged: boolean;
  // showPicker: boolean;
  selectedRange: number;
  fromDate: Date;
  toDate: Date;
  thisMonth: Date;
  week: any = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dateList: any = [];
  years: any = [];
  months: any = [
    { label: 'January', key: 0 },
    { label: 'February', key: 1 },
    { label: 'March', key: 2 },
    { label: 'April', key: 3 },
    { label: 'May', key: 4 },
    { label: 'June', key: 5 },
    { label: 'July', key: 6 },
    { label: 'August', key: 7 },
    { label: 'September', key: 8 },
    { label: 'October', key: 9 },
    { label: 'November', key: 10 },
    { label: 'December', key: 11 }
  ];
  hours: any = ['00', '01', '02', '03', '04', '05', '06', '07',
    '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
  minutes: any = ['00', '01', '02', '03', '04', '05', '06',
    '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17',
    '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28',
    '29', '30', '31', '32', '33', '34', '35', '36', '37', '38', '39',
    '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
    '51', '52', '53', '54', '55', '56', '57', '58', '59'];
  subscriptions: any;
  focusAt: string;

  constructor(private element: ElementRef,
    private shortcutService: ShortcutService,
  ) {
    const self = this;
    self.selectedRange = 0;
    if (!self.fromDate) {
      self.fromDate = new Date();
    }
    if (!self.toDate) {
      self.toDate = new Date();
    }
    self.thisMonth = new Date(self.fromDate);
    self.toChange = new EventEmitter();
    self.fromChange = new EventEmitter();
    self.togglePickerChange = new EventEmitter<boolean>();
    self.togglePicker = false;
    // self.togglePicker = true;
    self.subscriptions = {};
  }

  ngOnInit() {
    const self = this;
    if (!self.options) {
      self.options = {};
    }
    self.initKeyboadEvents();
    self.fillMonthData(self.fromDate.getMonth(), self.fromDate.getFullYear());
    if (!self.options.type) {
      self.options.type = 'date-time';
    }
    for (let i = 1900; i <= 2100; i++) {
      self.years.push({
        key: i
      });
    }
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  ngAfterViewInit() {
    const self = this;
    (<HTMLElement>self.element.nativeElement).scrollIntoView();
    if (self.year) {
      self.year.nativeElement.value = self.fromDate.getFullYear();
    }
    if (self.month) {
      self.month.nativeElement.value = self.fromDate.getMonth();
    }
    if (self.hour) {
      self.hour.nativeElement.value = ('0' + self.fromDate.getHours()).slice(-2);
    }
    if (self.minute) {
      self.minute.nativeElement.value = ('0' + self.fromDate.getMinutes()).slice(-2);
    }
    if (self.second) {
      self.second.nativeElement.value = ('0' + self.fromDate.getSeconds()).slice(-2);
    }
  }

  initKeyboadEvents() {
    const self = this;
    self.subscriptions['pasteEvent'] = self.shortcutService.pasteEvent.subscribe((event: ClipboardEvent) => {
      const text = event.clipboardData.getData('text');
      const tempDate = new Date(text);
      if (tempDate.toDateString() !== 'Invalid Date') {
        self.year.nativeElement.value = tempDate.getFullYear();
        self.month.nativeElement.value = tempDate.getMonth();
        self.selectYear({ key: tempDate.getFullYear() });
        self.selectMonth({ key: tempDate.getMonth() });
        self.selectDate({ label: tempDate.getDate() });
      }
    });

    self.subscriptions['ctrlKey'] = self.shortcutService.ctrlKey.subscribe((event: KeyboardEvent) => {
      const year = self.fromDate.getFullYear();
      let changeTo;
      if (event.key === 'ArrowUp') { // up
        changeTo = year - 1;
      }
      if (event.key === 'ArrowDown') { // down
        changeTo = year + 1;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const tempDate = new Date(self.fromDate.toISOString());
        tempDate.setFullYear(changeTo);
        self.year.nativeElement.value = tempDate.getFullYear();
        self.month.nativeElement.value = tempDate.getMonth();
        self.selectYear({ key: tempDate.getFullYear() });
        self.selectMonth({ key: tempDate.getMonth() });
        self.selectDate({ label: tempDate.getDate() });
      }
    });

    self.subscriptions['altKey'] = self.shortcutService.altKey.subscribe((event: KeyboardEvent) => {
      const month = self.fromDate.getMonth();
      let changeTo;
      if (event.key === 'ArrowUp') { // up
        changeTo = month - 1;
      }
      if (event.key === 'ArrowDown') { // down
        changeTo = month + 1;
      }
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        const tempDate = new Date(self.fromDate.toISOString());
        tempDate.setMonth(changeTo);
        self.year.nativeElement.value = tempDate.getFullYear();
        self.month.nativeElement.value = tempDate.getMonth();
        self.selectYear({ key: tempDate.getFullYear() });
        self.selectMonth({ key: tempDate.getMonth() });
        self.selectDate({ label: tempDate.getDate() });
      }
    });
    self.subscriptions['keyDown'] = self.shortcutService.key.subscribe((event: KeyboardEvent) => {
      if (event.key === 'Escape') { // esc
        self.togglePickerChange.emit(false);
        return;
      }
      if (event.key === 'Enter') { // enter
        self.done();
        self.togglePickerChange.emit(false);
        return;
      }
      if (!event.altKey && !event.shiftKey && !event.ctrlKey && event.key !== 'Enter') {
        event.preventDefault();
        const date = self.fromDate.getDate();
        let changeTo;
        if (event.key === 'ArrowLeft') { // left
          changeTo = date - 1;
        }
        if (event.key === 'ArrowUp') { // up
          changeTo = date - 7;
        }
        if (event.key === 'ArrowRight') { // right
          changeTo = date + 1;
        }
        if (event.key === 'ArrowDown') { // down
          changeTo = date + 7;
        }
        if (event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'ArrowRight' || event.key === 'ArrowDown') {
          const tempDate = new Date(self.fromDate.toISOString());
          tempDate.setDate(changeTo);
          self.year.nativeElement.value = tempDate.getFullYear();
          self.month.nativeElement.value = tempDate.getMonth();
          self.selectYear({ key: tempDate.getFullYear() });
          self.selectMonth({ key: tempDate.getMonth() });
          self.selectDate({ label: tempDate.getDate() });
        }
      }
    });
  }

  changeRange(index) {
    const self = this;
    self.selectedRange = index;
    if (self.selectedRange === 0) {
      self.thisMonth = new Date(self.fromDate);
      self.hour.nativeElement.value = ('0' + self.fromDate.getHours()).slice(-2);
      self.minute.nativeElement.value = ('0' + self.fromDate.getMinutes()).slice(-2);
      self.second.nativeElement.value = ('0' + self.fromDate.getSeconds()).slice(-2);
      self.fillMonthData(self.fromDate.getMonth(), self.fromDate.getFullYear());
    } else {
      self.thisMonth = new Date(self.toDate);
      self.hour.nativeElement.value = ('0' + self.toDate.getHours()).slice(-2);
      self.minute.nativeElement.value = ('0' + self.toDate.getMinutes()).slice(-2);
      self.second.nativeElement.value = ('0' + self.toDate.getSeconds()).slice(-2);
      self.fillMonthData(self.toDate.getMonth(), self.toDate.getFullYear());
    }
  }

  changeHour(val) {
    const self = this;
    if (self.selectedRange === 0) {
      self.fromChanged = true;
      self.fromDate.setHours(val);
    } else {
      self.toChanged = true;
      self.toDate.setHours(val);
    }
    if (!self.options.buttons) {
      self.done();
    }
  }

  changeMinute(val) {
    const self = this;
    if (self.selectedRange === 0) {
      self.fromChanged = true;
      self.fromDate.setMinutes(val);
    } else {
      self.toChanged = true;
      self.toDate.setMinutes(val);
    }
    if (!self.options.buttons) {
      self.done();
    }
  }

  changeSecond(val) {
    const self = this;
    if (self.selectedRange === 0) {
      self.fromChanged = true;
      self.fromDate.setSeconds(val);
    } else {
      self.toChanged = true;
      self.toDate.setSeconds(val);
    }
    if (!self.options.buttons) {
      self.done();
    }
  }

  selectDate(val) {
    const self = this;
    if (self.selectedRange === 0) {
      self.fromChanged = true;
      self.fromDate.setDate(val.label);
    } else {
      self.toChanged = true;
      self.toDate.setDate(val.label);
    }
    self.dateList.map(d => {
      if (val.label === d.label) {
        d.today = true;
      } else {
        d.today = false;
      }
    });
    if (!self.options.buttons) {
      self.done();
    }
  }

  selectMonth(val) {
    const self = this;
    if (self.selectedRange === 0) {
      self.fromDate.setDate(1);
      self.fromDate.setMonth(val.key);
    } else {
      self.toDate.setDate(1);
      self.toDate.setMonth(val.key);
    }
    self.selectDate({ label: 1 });
    if (self.fromDate.getFullYear()) {
      self.fillMonthData(val.key, self.fromDate.getFullYear());
    } else {
      self.fillMonthData(val.key);
    }
    self.month.nativeElement.value = self.fromDate.getMonth();
  }

  decreaseMonth() {
    const self = this;
    if (self.fromDate.getMonth() === 0) {
      self.year.nativeElement.value = self.fromDate.getFullYear() - 1;
      self.selectYear({ key: self.fromDate.getFullYear() });
    }
    self.selectMonth({ key: self.fromDate.getMonth() - 1 });
    self.month.nativeElement.value = self.fromDate.getMonth();
  }

  increaseMonth() {
    const self = this;
    if (self.fromDate.getMonth() === 11) {
      self.selectYear({ key: self.fromDate.getFullYear() + 1 });
      self.year.nativeElement.value = self.fromDate.getFullYear();
      self.selectMonth({ key: 0 });
      self.month.nativeElement.value = self.fromDate.getMonth();
    } else {
      self.selectMonth({ key: self.fromDate.getMonth() + 1 });
      self.month.nativeElement.value = self.fromDate.getMonth();
    }
  }

  selectYear(val) {
    const self = this;
    if (self.selectedRange === 0) {
      self.fromDate.setDate(1);
      self.fromDate.setMonth(0);
      self.fromDate.setFullYear(val.key);
    } else {
      self.toDate.setDate(1);
      self.toDate.setMonth(0);
      self.toDate.setFullYear(val.key);
    }
    self.selectMonth({ key: 0 });
    self.fillMonthData(0, val.key);
  }

  fillMonthData(month, year?) {
    const self = this;
    self.thisMonth.setDate(1);
    self.thisMonth.setMonth(month);
    if (year) {
      self.thisMonth.setFullYear(year);
    }
    self.thisMonth.setDate(-(self.thisMonth.getDay() - 1));
    self.dateList = [];
    for (let i = 0; i < 42; i++) {
      self.dateList.push({
        label: self.thisMonth.getDate(),
        day: self.thisMonth.getDay(),
        month: self.thisMonth.getMonth(),
        year: self.thisMonth.getFullYear(),
        show: (self.selectedRange === 0 ? self.fromDate.getMonth() : self.toDate.getMonth()) === self.thisMonth.getMonth(),
        today: (self.selectedRange === 0 ? self.fromDate.getDate() : self.toDate.getDate()) === self.thisMonth.getDate()
      });
      self.thisMonth.setDate(self.thisMonth.getDate() + 1);
    }
  }

  writeValue(data: any) {
    const self = this;
    self.thisMonth = new Date(data);
    self.fromDate = new Date(data);
  }

  registerOnChange(fn: any) {
    const self = this;
    self.valueChange = fn;
  }

  registerOnTouched(fn: any) {
    const self = this;
    self.focusChange = fn;
  }

  onChange(value) {
    const self = this;
    self.valueChange(value);
  }

  get currentMonth() {
    const self = this;
    return self.selectedRange === 0 ? self.fromDate.toLocaleDateString('en-US', { month: 'long' })
      : self.toDate.toLocaleDateString('en-US', { month: 'long' });
  }

  get currentYear() {
    const self = this;
    return self.selectedRange === 0 ? self.fromDate.getFullYear() : self.toDate.getFullYear();
  }

  get style() {
    const self = this;
    const styleStr = {};
    if (self.options.top) {
      styleStr['top'] = self.options.top;
    }
    if (self.options.right) {
      styleStr['right'] = self.options.right;
    }
    return styleStr;
  }
  done() {
    const self = this;
    if (self.options && self.options.type === 'date') {
      self.fromDate.setHours(0, 0, 0, 0);
      self.toDate.setHours(0, 0, 0, 0);
    }
    if (self.fromChanged) {
      if (self.valueChange) {
        self.valueChange(self.fromDate.toISOString());
      }
      self.fromChange.emit(self.fromDate.toISOString());
    } else {
      self.fromChange.emit(self.fromDate.toISOString());
    }
    if (self.toChanged) {
      self.toChange.emit(self.toDate.toISOString());
    } else {
      self.toChange.emit(self.toDate.toISOString());
    }
    if (self.options.buttons) {
      self.togglePickerChange.emit(false);
    }
  }
  cancel() {
    const self = this;
    self.togglePickerChange.emit(false);
  }
}
