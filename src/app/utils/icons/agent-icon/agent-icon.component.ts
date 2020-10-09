import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-agent-icon',
  templateUrl: './agent-icon.component.html',
  styleUrls: ['./agent-icon.component.scss']
})
export class AgentIconComponent implements OnInit {

  @Input() color: string;
  @Input() size: number;
  @Input() active: boolean;
  constructor() { }

  ngOnInit() {
    if (!this.color) {
      this.color = '666';
    }
    if (!this.size) {
      this.size = 36;
    }
  }

  get style() {
    return {
      fill: `#${this.color}`,
      stroke: 'none'
    };
  }

  get dimention() {
    return {
      width: `${this.size}px`,
      height: `${this.size}px`
    };
  }

}
