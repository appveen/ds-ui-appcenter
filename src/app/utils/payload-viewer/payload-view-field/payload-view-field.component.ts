import { Component, OnInit, Input } from '@angular/core';
import { Field } from '../payload-viewer.component';

@Component({
  selector: 'odp-payload-view-field',
  templateUrl: './payload-view-field.component.html',
  styleUrls: ['./payload-view-field.component.scss']
})
export class PayloadViewFieldComponent implements OnInit {

  @Input() parentArray: boolean;
  @Input() fieldList: Array<Field>;
  @Input() index: number;
  @Input() data: any;
  field: Field;
  openDropdown: boolean;
  searchTerm: string;
  pattern: RegExp;
  constructor() {
    this.index = -1;
    this.parentArray = false;
    this.data = {};
    this.fieldList = [];
    this.field = new Field();
  }


  ngOnInit(): void {
    if (!this.data) {
      this.data = {};
    }
    this.field = this.fieldList[this.index];
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

  getData() {
    if (this.field.type == 'array') {
      return this.field.data;
    } else if (this.field.type == 'object') {
      return this.field.data;
    } else {
      return this.field.value;
    }
  }
}
