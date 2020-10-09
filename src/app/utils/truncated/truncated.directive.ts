import {
  Component,
  Directive,
  ElementRef,
  AfterContentInit,
  Input,
  HostListener,
  ComponentFactoryResolver,
  ViewContainerRef,
  ComponentRef,
  ViewChild,
  AfterViewChecked
} from '@angular/core';
import { NgbTooltip } from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'odp-truncated-tooltip',
  styles: [
    '.position-absolute{top:10px}'
  ],
  template: `<span #tooltipRef="ngbTooltip"
  *ngIf="toggle"
  class="position-absolute"
  [ngbTooltip]="text"
  container="body"
  triggers="manual"
  [placement]="placement">&nbsp;</span>`
})
export class TruncatedTooltipComponent implements AfterViewChecked {
  @ViewChild('tooltipRef', { static: false }) tooltipRef: NgbTooltip;
  @Input() text: string;
  @Input() placement: string;
  toggle: boolean;
  constructor() {
    this.placement = 'top';
  }

  open() {
    this.toggle = true;
    if (this.tooltipRef) {
      this.tooltipRef.open();
    }
  }
  close() {
    this.toggle = false;
    if (this.tooltipRef) {
      this.tooltipRef.close();
    }
  }
  ngAfterViewChecked() {
    if (this.tooltipRef) {
      this.tooltipRef.open();
    }
  }
}

@Directive({
  selector: '[odpTruncated]'
})
export class TruncatedDirective implements AfterContentInit {


  @Input() odpTruncated: string;
  @Input() placement: string;
  toolTip: ComponentRef<TruncatedTooltipComponent>;
  constructor(private element: ElementRef,
    private cfr: ComponentFactoryResolver,
    private vcr: ViewContainerRef) {
    const cf = this.cfr.resolveComponentFactory(TruncatedTooltipComponent);
    this.toolTip = this.vcr.createComponent(cf);
    this.placement = 'top';
  }

  ngAfterContentInit() {
    this.element.nativeElement.parentElement.classList.add('position-relative');
  }

  @HostListener('mouseover', ['$event'])
  onMouseOver(event) {
    if (this.element.nativeElement.offsetWidth < this.element.nativeElement.scrollWidth) {
      this.toolTip.instance.text = this.odpTruncated;
      this.toolTip.instance.placement = this.placement;
      this.toolTip.instance.open();
    }
  }

  @HostListener('mouseout', ['$event'])
  onmouseout(event) {
    this.toolTip.instance.close();
  }
}
