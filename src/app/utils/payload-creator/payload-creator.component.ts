import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'odp-payload-creator',
  templateUrl: './payload-creator.component.html',
  styleUrls: ['./payload-creator.component.scss']
})
export class PayloadCreatorComponent implements OnInit {

  @Input() data: any;
  @Output() dataChange: EventEmitter<any>;
  globalType: string;
  triggerAddChild: EventEmitter<any>;
  constructor() {
    this.data = {};
    this.dataChange = new EventEmitter();
    this.globalType = 'object';
    this.triggerAddChild = new EventEmitter();
  }

  ngOnInit(): void {
    if (!this.data) {
      this.data = {};
    }
  }

  onDataChange(data: any) {
    console.log('onDataChange', data);
    this.data = data;
    this.dataChange.emit(this.data);
  }

  addFromRoot() {
    this.triggerAddChild.emit();
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