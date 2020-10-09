import { Component, } from '@angular/core';
import { AgFrameworkComponent } from 'ag-grid-angular';
import { IFloatingFilterParams, Column, GridApi, IFloatingFilter, IFilterComp, TextFilter, NumberFilter } from 'ag-grid-community';

import { ColumnFilterComponent } from '../column-filter/column-filter.component';

@Component({
  selector: 'odp-floating-filter',
  templateUrl: './floating-filter.component.html',
  styleUrls: ['./floating-filter.component.scss']
})
export class FloatingFilterComponent implements IFloatingFilter, AgFrameworkComponent<IFloatingFilterParams> {
  params: IFloatingFilterParams;
  column: Column;
  api: GridApi;
  definition: any;
  value: any;

  get type() {
    return this.definition.type;
  }

  get richText() {
    return this.definition.properties.richText;
  }

  get longText() {
    return this.definition.properties.longText;
  }

  get dateType() {
    return this.definition.properties.dateType;
  }

  get checkbox() {
    return this.definition.type === 'Checkbox';
  }

  constructor() { }

  agInit(params: IFloatingFilterParams): void {
    this.params = params;
    this.column = params.column;
    this.api = params.api;
    this.definition = this.column.getColDef().refData;
  }

  onParentModelChanged(parentModel): void {
    if (!parentModel) {
      this.value = null;
    } else if (
      this.definition.type === 'Number'
      || (this.definition.type === 'String'
        && !this.definition.properties.password
        && !this.definition.properties.longText
        && !this.definition.properties.richText
        && !this.definition.properties.email
      )) {
      this.value = parentModel.filter;
    } else if (this.value !== parentModel) {
      this.value = parentModel
    }
  }

  onChange(value) {
    if (this.definition.type === 'Number') {
      if (!!value) {
        this.params.parentFilterInstance((instance: IFilterComp) => {
          (instance as NumberFilter).onFloatingFilterChanged('equals', +value);
        });
      } else {
        this.params.parentFilterInstance((instance: IFilterComp) => {
          (instance as NumberFilter).onFloatingFilterChanged(null, null);
        });
      }
    } else if (this.definition.type === 'String'
      && !this.definition.properties.longText
      && !this.definition.properties.richText
      && !this.definition.properties.password
      && !this.definition.properties.email
    ) {
      if (!!value) {
        this.params.parentFilterInstance((instance: IFilterComp) => {
          (instance as TextFilter).onFloatingFilterChanged('contains', value);
        });
      } else {
        this.params.parentFilterInstance((instance: IFilterComp) => {
          (instance as TextFilter).onFloatingFilterChanged(null, null);
        });
      }
    } else {
      this.params.parentFilterInstance((instance: any) => {
        (instance as ColumnFilterComponent).onFloatingFilterChanged(value);
      });
    }
  }

}
