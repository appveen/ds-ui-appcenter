import { Directive, Output, EventEmitter, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[odpClickOutside]'
})
export class ClickOutsideDirective {

  @Input() ignore: Array<string>;
  @Output() outside: EventEmitter<boolean>;

  constructor(private element: ElementRef) {
    this.outside = new EventEmitter<boolean>();
  }

  @HostListener('document:click', ['$event'])
  onClick(event) {
    if (this.ignore && this.ignore.length > 0) {
      if (this.ignore.indexOf('#' + event.target.id) > -1) {
        return;
      }
      if (this.ignore.filter(e => event.target.classList.contains(e.substr(1, e.length))).length > 0) {
        return;
      }
      const temp = this.ignore.filter(e => {
        const nodeList: NodeListOf<HTMLElement> = document.querySelectorAll(e);
        return this.targetInIgnore(nodeList, event.target);
      });
      if (temp && temp.length > 0) {
        return;
      }
    }
    if (event.target.classList.contains('ignore-outside')) {
      return;
    }
    if (!this.element.nativeElement.contains(event.target)) {
      this.outside.emit(true);
    }
  }

  private targetInIgnore(nodeList: NodeListOf<HTMLElement>, target: HTMLElement) {
    let flag = false;
    if (nodeList && nodeList.length > 0) {
      for (let i = 0; i < nodeList.length; i++) {
        const node = nodeList.item(i);
        if (node.contains(target)) {
          flag = true;
          break;
        }
      }
    }
    return flag;
  }
}
