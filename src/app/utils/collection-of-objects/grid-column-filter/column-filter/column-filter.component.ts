import { Component } from '@angular/core';
import { AgFilterComponent } from 'ag-grid-angular';
import { IDoesFilterPassParams, IFilterParams } from 'ag-grid-community';

import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-column-filter',
  templateUrl: './column-filter.component.html',
  styleUrls: ['./column-filter.component.scss']
})
export class ColumnFilterComponent implements AgFilterComponent {
  params: IFilterParams
  valueGetter: any;
  definition: any;
  value: string;

  constructor(private appService: AppService) { }

  agInit(params: IFilterParams): void {
    this.params = params;
    this.valueGetter = params.valueGetter;
    this.definition = params.colDef.refData;
  }

  isFilterActive(): boolean {
    if (this.definition.type === 'Boolean') {
      return this.value !== null && this.value !== '' && this.value !== 'null';
    } else if (this.definition.type === 'Date' && !!this.value && !!this.value.length) {
      try {
        const date = new Date(this.value);
        return true;
      } catch (e) {
        return false;
      }
    }
    return this.value !== null && this.value !== '';
  }

  doesFilterPass(params: IDoesFilterPassParams): boolean {
    if (this.definition.type === 'Relation' || this.definition.type === 'User') {
      const relationData = this.appService.getValue(this.definition.properties.relatedSearchField, this.valueGetter(params.node));
      return !!relationData && !!relationData.length && (relationData as string)
        .toLowerCase().includes(this.value.toLowerCase());
    } else if (this.definition.type === 'String' && (this.definition.properties.longText || this.definition.properties.richText || this.definition.properties.email)) {
      const cellValue = this.valueGetter(params.node);
      return !!cellValue && !!cellValue.length && (cellValue as string).toLowerCase().includes(this.value.toLowerCase());
    } else if (this.definition.type === 'String' && this.definition.properties.password) {
      const cellValue = this.valueGetter(params.node);
      return !!cellValue && !!cellValue.value && !!cellValue.value.length && (cellValue.value as string).toLowerCase().includes(this.value.toLowerCase());
    } else if (this.definition.type === 'Boolean') {
      return this.valueGetter(params.node) + '' === this.value;
    } else if (this.definition.type === 'Date') {
      try {
        const cellValue = this.valueGetter(params.node);
        const cellDate = new Date(cellValue.rawData ? cellValue.rawData : cellValue);
        const compareDates = this.getDateQuery(this.value);
        return !!compareDates && cellDate >= compareDates.fromDate && cellDate <= compareDates.toDate;
      } catch (e) {
      }
    } else if (this.definition.type === "Geojson") {
      const cellValue = this.valueGetter(params.node);
      return !!cellValue
        && !!cellValue.formattedAddress
        && !!cellValue.formattedAddress.length
        && (cellValue.formattedAddress as string).toLowerCase().includes(this.value.toLowerCase());
    } else if (this.definition.type === 'File') {
      const cellValue = this.valueGetter(params.node);
      return !!cellValue
        && !!cellValue.metadata
        && !!cellValue.metadata.filename
        && !!cellValue.metadata.filename.length
        && (cellValue.metadata.filename as string).toLowerCase().includes(this.value.toLowerCase());
    }
    return false;
  }

  getModel() {
    return this.isFilterActive() ? this.value : null;
  }

  setModel(model: any): void {
    this.value = !!model ? model : '';
  }

  onChange(newValue: string) {
    if (this.value !== newValue) {
      this.value = newValue;
      this.params.filterChangedCallback();
    }
  }

  onFloatingFilterChanged(value) {
    this.value = value;
    this.params.filterChangedCallback();
  }

  getDateQuery(value: any) {
    if (!value) {
      return null;
    }
    const fromDate = new Date(value + 'T00:00:00.000Z');
    const toDate = new Date(fromDate.toISOString());
    toDate.setHours(toDate.getHours() + 23);
    toDate.setMinutes(toDate.getMinutes() + 59);
    toDate.setSeconds(toDate.getSeconds() + 59);
    toDate.setMilliseconds(toDate.getMilliseconds() + 999);
    return { fromDate, toDate };
  }
}
