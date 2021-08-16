import { Directive, ElementRef, Output, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Directive({
  selector: '[odpSearchTerm]'
})
export class SearchTermDirective {

  @Output() odpSearchTerm: EventEmitter<string>;
  constructor(private ele: ElementRef) {
    const self = this;
    self.odpSearchTerm = new EventEmitter();
    fromEvent(self.ele.nativeElement, 'keyup').pipe(
      debounceTime(200),
      distinctUntilChanged()
    ).subscribe((data: any) => {
      if (data && data.target) {
        self.odpSearchTerm.emit(data.target.value);
      } else if (data && data.innerText) {
        self.odpSearchTerm.emit(data.innerText);
      } else {
        self.odpSearchTerm.emit(null);
      }
    }, err => {

    });
  }

}
