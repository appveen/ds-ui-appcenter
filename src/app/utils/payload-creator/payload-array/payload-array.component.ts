import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Field } from '../payload-creator.component';

@Component({
  selector: 'odp-payload-array',
  templateUrl: './payload-array.component.html',
  styleUrls: ['./payload-array.component.scss']
})
export class PayloadArrayComponent implements OnInit {

  @Input() data: any;
  @Output() dataChange: EventEmitter<any>;
  @Input() addChild: EventEmitter<any>;
  fieldList: Array<any>;
  constructor() {
    this.fieldList = [];
    this.data = [];
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
    if (this.data && this.data.length > 0) {
      this.data.forEach((item: any) => {
        let temp = this.getFieldObject(null, item);
        this.fieldList.push(temp);
      });
    } else {
      this.data = [];
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

  getData(index: number) {
    if (!this.data) {
      this.data = [];
    }
    if (!this.data[index]) {
      this.data[index] = '';
    }
    return this.data[index];
  }

  setData(data: any, index: number) {
    if (this.fieldList[index].type == 'array') {
      this.fieldList[index].data = data;
    } else if (this.fieldList[index].type == 'object') {
      this.fieldList[index].data = data;
    } else {
      this.fieldList[index].value = data;
    }
    this.data = this.reCreatePayload();
    this.dataChange.emit(this.data);
  }

  reCreatePayload() {
    let temp = this.fieldList.reduce((prev: any, curr: Field) => {
      if (curr.type == 'object') {
        prev.push(curr.data);
      } else if (curr.type == 'array') {
        prev.push(curr.data);
      } else {
        prev.push(curr.value);
      }
      return prev;
    }, []);
    return temp;
  }
}