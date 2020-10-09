import { Component, OnInit, ElementRef, HostListener } from '@angular/core';
import { fromEvent } from 'rxjs';

@Component({
  selector: 'odp-date-filter-picker',
  templateUrl: './date-filter-picker.component.html',
  styleUrls: ['./date-filter-picker.component.scss']
})
export class DateFilterPickerComponent implements OnInit {

  dateFilterType: string;
  fromDate: any;
  toDate: any;
  constructor(public ele: ElementRef) {
    const self = this;
    self.ele.nativeElement.classList.add('position-absolute');
  }

  ngOnInit(): void {
    fromEvent(document.querySelector('.ag-body-horizontal-scroll-viewport'), 'scroll').subscribe((event) => {
      console.log((event.target as HTMLElement).offsetLeft);
    });
  }

}
