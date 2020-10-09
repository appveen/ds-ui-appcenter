import { Directive, HostListener, Output, EventEmitter } from '@angular/core';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Directive({
  selector: '[odpOnChange]'
})
export class OnChangeDirective {

  @Output() textChange: EventEmitter<any>;
  private searchTerm: Subject<any>;
  constructor() {
    const self = this;
    self.textChange = new EventEmitter<any>();
    self.searchTerm = new Subject<any>();
    self.searchTerm.pipe(
      debounceTime(400),
      distinctUntilChanged()).subscribe(res => {
        self.textChange.emit(res);
      });
  }

  @HostListener('keyup', ['$event'])
  onkeyup(event) {
    const self = this;
    self.searchTerm.next(event.target.value);
  }
}
