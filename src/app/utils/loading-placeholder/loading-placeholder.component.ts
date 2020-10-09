import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-loading-placeholder',
  templateUrl: './loading-placeholder.component.html',
  styleUrls: ['./loading-placeholder.component.scss']
})
export class LoadingPlaceholderComponent implements OnInit {

  @Input() width: number;
  @Input() height: number;
  constructor() {
    const self = this;
    self.width = 120;
    self.height = 10;
  }

  ngOnInit() {
    const self = this;
  }

  get style() {
    const self = this;
    return {
      'min-width': self.width + 'px',
      'max-width': self.width + 'px',
      'min-height': self.height + 'px',
      'max-height': self.height + 'px'
    };
  }
}
