import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-app-switcher-icon',
  templateUrl: './app-switcher-icon.component.html',
  styleUrls: ['./app-switcher-icon.component.scss']
})
export class AppSwitcherIconComponent implements OnInit {

  @Input() color: string;
  @Input() size: number;
  constructor() { }

  ngOnInit() {
    if (!this.color) {
      this.color = 'CCCCCC';
    }
    if (!this.size) {
      this.size = 36;
    }
  }

  get style() {
    return {
      fill: `#${this.color}`
    };
  }

  get dimention() {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`
    };
  }

}
