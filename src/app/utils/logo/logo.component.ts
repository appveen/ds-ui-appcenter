import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.scss']
})
export class LogoComponent implements OnInit {

  @Input() color: string;
  @Input() logoColor: string;
  constructor() { }

  ngOnInit() {
    if (!this.color) {
      this.color = '3498db';
    }
    if (!this.logoColor) {
      this.logoColor = '#fff';
    }
  }

}
