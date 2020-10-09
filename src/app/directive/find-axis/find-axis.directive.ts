import { Directive, HostListener, ElementRef, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[odpFindAxis]'
})
export class FindAxisDirective {

  @Output() clientRect:EventEmitter<ClientRect>;
  constructor( private ele: ElementRef ) {
    const self = this;
    self.clientRect = new EventEmitter();
  }

  @HostListener('mouseover', ['$event']) onMouseEnter(evt) {
    const self = this;
    self.clientRect.emit(self.ele.nativeElement.getBoundingClientRect());
    evt.stopPropagation();
  }

  @HostListener('mouseout', ['$event']) onMouseOut(evt) {
    const self = this;
    self.clientRect.emit(null);
    evt.stopPropagation();

  }
}
