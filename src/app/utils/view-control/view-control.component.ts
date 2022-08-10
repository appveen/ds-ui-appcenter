import { Component, OnInit, Input } from '@angular/core';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'odp-view-control',
  templateUrl: './view-control.component.html',
  styleUrls: ['./view-control.component.scss']
})
export class ViewControlComponent implements OnInit {

  @Input() definition: any;
  @Input() value: any;
  @Input() oldValue: any;
  @Input() newValue: any;
  @Input() first: boolean;
  @Input() workflowDoc: any;
  @Input() last: boolean;

  constructor(private ngbToolTipConfig: NgbTooltipConfig) { }

  ngOnInit() {
    this.ngbToolTipConfig.container = 'body';
  }

  spacing(level: number, arr?) {
    return {
      'min-width': (level * 10) + 'px',
      'margin-right': !arr ? (level === 1 ? 0 : 5) + 'px' : '20px',
      'min-height': '36px',
      'max-height': '100%'
    };
  }

  getLabelWidth() {
    return {
      minWidth: '200px'
    };
  }

}
