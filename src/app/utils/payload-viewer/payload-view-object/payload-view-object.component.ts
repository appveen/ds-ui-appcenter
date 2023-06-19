import { Component, OnInit, Input } from '@angular/core';
import { Field } from '../payload-viewer.component';

@Component({
  selector: 'odp-payload-view-object',
  templateUrl: './payload-view-object.component.html',
  styleUrls: ['./payload-view-object.component.scss']
})
export class PayloadViewObjectComponent implements OnInit {

  @Input() data: any;
  fieldList: Array<any>;
  constructor() {
    this.fieldList = [];
    this.data = {};
  }

  ngOnInit(): void {
    this.init();
  }

  init() {
    if (this.data && Object.keys(this.data).length > 0) {
      Object.keys(this.data).forEach((key: string) => {
        let temp = this.getFieldObject(key, this.data[key]);
        this.fieldList.push(temp);
      });
    } else {
      this.data = {};
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

  getData(item: any) {
    if (!this.data) {
      this.data = {};
    }
    if (!this.data[item.key]) {
      this.data[item.key] = '';
    }
    return this.data[item.key];
  }

}
