import { Component, OnInit, Input } from '@angular/core';
import { Field } from '../payload-viewer.component';

@Component({
  selector: 'odp-payload-view-array',
  templateUrl: './payload-view-array.component.html',
  styleUrls: ['./payload-view-array.component.scss']
})
export class PayloadViewArrayComponent implements OnInit {

  @Input() data: any;
  fieldList: Array<any>;
  constructor() {
    this.fieldList = [];
    this.data = [];
  }

  ngOnInit(): void {
    this.init();
  }

  init() {
    if (this.data && this.data.length > 0) {
      this.data.forEach((item: any) => {
        let temp = this.getFieldObject(null, item);
        this.fieldList.push(temp);
      });
    } else {
      this.data = [];
    }
  }

  getFieldObject(key: string | null, value: any) {
    let temp: Field = new Field({
      key,
      type: typeof value
    });
    if (typeof value != 'object') {
      temp.value = value;
    } else if (Array.isArray(value)) {
      temp.type = 'array';
      temp.value = value.length + ' Items';
    } else if (value && typeof value == 'object') {
      temp.value = Object.keys(value).length + ' Items';
    }
    return temp;
  }

  getData(index: number) {
    if (!this.data) {
      this.data = [];
    }
    if (!this.data[index]) {
      this.data[index] = '';
    }
    return this.data[index];
  }
}
