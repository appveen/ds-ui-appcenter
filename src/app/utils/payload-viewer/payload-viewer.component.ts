import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'odp-payload-viewer',
  templateUrl: './payload-viewer.component.html',
  styleUrls: ['./payload-viewer.component.scss']
})
export class PayloadViewerComponent implements OnInit {

  @Input() data: any;
  globalType: string;
  constructor() {
    this.data = {};
    this.globalType = 'object';
  }

  ngOnInit(): void {
    if (!this.data) {
      this.data = {};
    }
  }

  get globalValue() {
    if (this.data) {
      return Object.keys(this.data).length + ' Items';
    }
    return '0 Items'
  }

}

export class Field {
  key: string;
  type: string;
  value: string | number | boolean | null;
  data: any;

  constructor(data?: any) {
    if (data) {
      this.key = data.key;
      this.type = data.type;
      this.value = data.value;
    } else {
      this.key = '';
      this.type = 'string';
      this.value = null;
    }
  }
}