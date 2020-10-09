import {AfterViewInit, Directive, ElementRef} from '@angular/core';

@Directive({
    selector: '[odpAutoFocus]'
})
export class AutoFocusDirective implements AfterViewInit {

    constructor(private element: ElementRef) {
    }

    ngAfterViewInit(): void {
        if (this.element.nativeElement) {
            this.element.nativeElement.focus();
        }
    }
}
