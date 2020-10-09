import { Directive, HostListener, HostBinding, Output, EventEmitter } from '@angular/core';

@Directive({
  selector: '[odpDragAndDrop]'
})
export class DragAndDropDirective {

  @HostBinding('style.background')  background;
  @Output() fileData: EventEmitter<any> = new EventEmitter();
  @Output() dragOver: EventEmitter<any> = new EventEmitter();
  @Output() dragOut: EventEmitter<any> = new EventEmitter();
  constructor() { }

  @HostListener('dragover', ['$event']) public onDragOver(evt) {
    const self = this;
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#999';
    self.dragOver.emit(true);

  }

  @HostListener('dragleave', ['$event']) public onDragLeave(evt) {
    const self = this;
    evt.preventDefault();
    evt.stopPropagation();
    this.background = '#eee';
    self.dragOut.emit(true);


  }

  @HostListener('drop', ['$event']) public onDrop(evt) {
    const self = this;
    evt.preventDefault();
    evt.stopPropagation();
    self.background = '#fff';
    const files = evt.dataTransfer.files;
    if (files.length > 0) {
      self.fileData.emit(files);
    }
  }

}
