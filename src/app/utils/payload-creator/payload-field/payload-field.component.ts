import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Observable, OperatorFunction, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { Field } from '../payload-creator.component';
import * as _ from 'lodash';

@Component({
  selector: 'odp-payload-field',
  templateUrl: './payload-field.component.html',
  styleUrls: ['./payload-field.component.scss']
})
export class PayloadFieldComponent implements OnInit {

  @Input() parentArray: boolean;
  @Input() fieldList: Array<Field>;
  @Input() index: number;
  @Input() data: any;
  @Output() dataChange: EventEmitter<any>;
  field: Field;
  triggerAddChild: EventEmitter<any>;
  $trigger: Subject<any>;
  openDropdown: boolean;
  searchTerm: string;
  pattern: RegExp;
  constructor() {
    this.index = -1;
    this.parentArray = false;
    this.data = {};
    this.fieldList = [];
    this.field = new Field();
    this.dataChange = new EventEmitter();
    this.triggerAddChild = new EventEmitter();
    this.$trigger = new Subject();
  }


  ngOnInit(): void {
    if (!this.data) {
      this.data = {};
    }
    this.field = this.fieldList[this.index];
    this.$trigger.pipe(
      debounceTime(200)
    ).subscribe(() => {
      this.data = this.getData();
      this.dataChange.next(this.data);
    });
  }

  onPaste(event: ClipboardEvent) {
    let text: string = event.clipboardData?.getData('text') as string;
    try {
      const obj = JSON.parse(text);
      this.data = obj;
      this.field.type = 'object';
      this.fieldList = [];
    } catch (err) {
      this.fieldList = [];
      text.split('\n').map((e: string) => {
        this.fieldList.push(new Field({ key: e, type: 'string' }));
      });
    }
  }

  addField() {
    let temp = new Field();
    if ((this.fieldList[this.index].type == 'array' || this.fieldList[this.index].type == 'object')) {
      this.triggerAddChild.emit();
    } else {
      this.fieldList.splice(this.index + 1, 0, temp);
      this.$trigger.next(null);
    }
  }

  removeField() {
    this.fieldList.splice(this.index, 1);
    this.$trigger.next(null)
  }

  getInputType() {
    if (this.field.type == 'number') {
      this.pattern = /\d+|\{\{\s*\w+(\s+\w+)*\s*\}\}/g
      return 'number';
    } else if (this.field.type == 'boolean') {
      return 'checkbox';
    }
    this.pattern = /.*/g
    return 'text';
  }

  onTypeChange(type: string) {
    if (type == 'object') {
      this.field.value = '0 Items';
      this.data = {};
      setTimeout(() => {
        this.triggerAddChild.emit();
      }, 200);
    } else if (type == 'array') {
      this.field.value = '0 Items';
      this.data = [];
      setTimeout(() => {
        this.triggerAddChild.emit();
      }, 200);
    } else if (type == 'number') {
      this.field.value = 0;
      this.data = 0;
    } else if (type == 'boolean') {
      this.field.value = true;
      this.data = true;
    } else {
      this.field.value = '';
      this.data = '';
    }
    this.$trigger.next(null)
  }

  onKeyChange(value: any) {
    this.field.key = value;
    this.$trigger.next(null);
  }

  onValueChange(value: any) {
    if (this.field.type == 'array') {
      this.field.value = value.length + ' Items';
      this.field.data = value;
    } else if (this.field.type == 'object') {
      this.field.value = Object.keys(value).length + ' Items';
      this.field.data = value;
    } else if (this.field.type == 'number') {
      this.field.value = parseFloat(value);
    } else if (this.field.type == 'boolean') {
      this.field.value = value;
    } else {
      this.field.value = value;
    }
    this.$trigger.next(null);
  }

  getData() {
    if (this.field.type == 'array') {
      return this.field.data;
    } else if (this.field.type == 'object') {
      return this.field.data;
    } else {
      return this.field.value;
    }
  }

  onDataChange(data: any) {
    // this.field.data = data
    this.onValueChange(data);
    // this.$trigger.next(null);
  }


  formatter(result: any) {
    if (result && typeof result == 'object') {
      return result.label;
    }
    return result;
  };

  changeLabel(event, field) {
    field.value = event
    console.log(event)
  }
}