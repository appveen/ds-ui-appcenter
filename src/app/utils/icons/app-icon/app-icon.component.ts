import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-app-icon',
  templateUrl: './app-icon.component.html',
  styleUrls: ['./app-icon.component.scss']
})
export class AppIconComponent implements OnInit {

  @Input() active: boolean;
  @Input() color: string;
  @Input() size: number;
  constructor() { }

  ngOnInit() {
    if (!this.color) {
      this.color = 'aaa';
    }
    if (!this.size) {
      this.size = 36;
    }
  }

  get style() {
    if (this.active) {
      return {};
    }
    return {
      stroke: `#${this.color}`
    };
  }

  get dimention() {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`
    };
  }

}
