import {Component, OnInit, AfterViewInit, ViewChild, Input, Output, ElementRef, EventEmitter} from '@angular/core';
import {trigger, state, style, transition, animate} from '@angular/animations';
import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-search-box',
  templateUrl: './search-box.component.html',
  styleUrls: ['./search-box.component.scss'],
  animations: [
    trigger('slide', [
      state('focus', style({
        left: '10px'
      })),
      transition('blur <=> focus', [
        animate('300ms cubic-bezier(0.86, 0, 0.07, 1)')
      ])
    ])
  ]
})
export class SearchBoxComponent implements OnInit, AfterViewInit {

  @ViewChild('searchInput', { static: false }) searchInput: ElementRef;
  @Input('ignoreOutside') ignoreOutside: boolean;
  @Output('enteredText') enteredText: EventEmitter<string>;
  @Input('tooltipDir') tooltipDir: string;
  @Input('onEnter') onEnter: boolean;
  @Output('reset') reset: EventEmitter<string>;
  @Input('placeholder') placeholder: string;

  searchTerm: string;
  slideState: string;

  constructor(private commonService: CommonService) {
    const self = this;
    self.slideState = 'blur';
    self.enteredText = new EventEmitter<string>();
    self.reset = new EventEmitter<string>();
  }

  ngOnInit() {
    const self = this;
  }

  ngAfterViewInit() {
    const self = this;
    self.searchInput.nativeElement.focus();
  }

  clear() {
    const self = this;
    self.reset.emit();
    self.searchTerm = null;
  }

  /*onKeyup(event: KeyboardEvent) {
    const self = this;
    const element: HTMLInputElement = <HTMLInputElement>event.target;
    if (event.key === 'Enter') {
      if (element.value && element.value.length > 0) {
        self.enteredText.emit(element.value);
      }
    } else {
      if (element.value && element.value.length > 2) {
        self.enteredText.emit(element.value);
      }
    }
    if (!element.value) {
      self.reset.emit();
    }
  }*/

  onChange(value: string) {
    const self = this;
    self.searchTerm = value;
    if (value && value.length > 2) {
      self.enteredText.emit(value);
    }
  }

  onEnterKey(event: KeyboardEvent) {
    const self = this;
    const element: HTMLInputElement = event.target as HTMLInputElement;
    if (element.value && element.value.length > 0) {
      self.enteredText.emit(element.value);
    }
  }
  onBackspaceKey(event: KeyboardEvent) {
    const self = this;
    const element: HTMLInputElement = event.target as HTMLInputElement;
    if (element.value.length === 1) {
      self.commonService.searchChar = element.value;
    }
    if (self.commonService.searchChar && !element.value) {
      self.commonService.searchChar = '';
      self.reset.emit();
    }
  }

  onFocus(event: Event) {
    const self = this;
    self.slideState = 'focus';
  }

  onBlur(event: Event) {
    const self = this;
    self.slideState = 'blur';
  }

  get info() {
    const self = this;
    if (self.onEnter) {
      return 'Search will be executed on Enter Pressed';
    } else {
      return 'Enter 3 or more characters to auto search';
    }
  }

  get toolTipDirection() {
    const self = this;
    if (self.tooltipDir) {
      return self.tooltipDir;
    }
    return 'right';
  }

  get placeholderText() {
    const self = this;
    if (self.placeholder) {
      return self.placeholder;
    }
    return 'Search';
  }
}
