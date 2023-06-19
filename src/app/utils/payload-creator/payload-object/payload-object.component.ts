import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { Field } from '../payload-creator.component';

@Component({
  selector: 'odp-payload-object',
  templateUrl: './payload-object.component.html',
  styleUrls: ['./payload-object.component.scss']
})
export class PayloadObjectComponent implements OnInit {

  @Input() data: any;
  @Output() dataChange: EventEmitter<any>;
  @Input() addChild: EventEmitter<any>;
  fieldList: Array<any>;
  constructor() {
    this.fieldList = [];
    this.data = {};
    this.dataChange = new EventEmitter();
    this.addChild = new EventEmitter();
  }

  ngOnInit(): void {
    this.init();
    this.addChild.subscribe(() => {
      let temp = new Field();
      this.fieldList.splice(this.fieldList.length, 0, temp);
    });
  }

  init() {
    if (this.data && Object.keys(this.data).length > 0) {
      Object.keys(this.data).forEach((key: string) => {
        let temp = this.getFieldObject(key, this.data[key]);
        this.fieldList.push(temp);
      });
    } else {
      this.data = {};
      this.addChild.emit();
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

  setData(data: any, field: any) {
    if (field.type == 'array') {
      field.data = data;
    } else if (field.type == 'object') {
      field.data = data;
    } else {
      field.value = data;
    }
    this.data = this.reCreatePayload();
    this.dataChange.emit(this.data);
  }

  reCreatePayload() {
    let temp = this.fieldList.reduce((prev: any, curr: Field) => {
      if (curr.type == 'object') {
        prev[curr.key] = curr.data;
      } else if (curr.type == 'array') {
        prev[curr.key] = curr.data;
      } else {
        prev[curr.key] = curr.value;
      }
      return prev;
    }, {});
    return temp;
  }
}
