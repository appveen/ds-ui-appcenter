import { AfterViewInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
    selector: '[odpAutoFocus]'
})
export class AutoFocusDirective implements AfterViewInit {

    @Input() timeout: number;
    constructor(private element: ElementRef) {
        this.timeout = 1;
    }

    ngAfterViewInit(): void {
        if (this.element.nativeElement) {
            setTimeout(() => {
                this.element.nativeElement.focus();
            }, this.timeout)
        }
    }
}
