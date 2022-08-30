import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import * as _ from 'lodash';
import { FilterModel } from './search-for-field/search-for-field.component';

interface TextTypeField {
  fieldName?: string;
  headerName?: string;
  filterType?: string;
  filterValue?: string;
  fieldType?: string;
}

interface RelationTypeField {
  fieldName?: string;
  headerName?: string;
  filterType?: string;
  filterValue?: string;
  fieldType?: string;
  fieldId?: string;
  otherFields?: Array<any>;
  dataKey?: string;
}

interface DateTypeField {
  fieldName?: string;
  headerName?: string;
  filterType?: string;
  fromDate?: any;
  toDate?: any;
  fieldType?: string;
  toggleFromDate?: boolean;
  toggleToDate?: boolean;
}

interface BooleanTypeField {
  fieldName?: string;
  headerName?: string;
  filterType?: string;
  filterValue?: string;
  fieldType?: string;
}

@Component({
  selector: 'odp-search-for',
  templateUrl: './search-for.component.html',
  styleUrls: ['./search-for.component.scss']
})
export class SearchForComponent implements OnInit {

  @Input() allColumns: any;
  @Input() filterModel: Array<FilterModel>;
  @Output() filterModelChange: EventEmitter<any>;
  // filterModels: Array<FilterModel>;
  constructor(private appService: AppService) {
    const self = this;
    // self.filterModels = [];
    self.filterModel = [];
    self.filterModelChange = new EventEmitter<any>();
  }

  ngOnInit() {
    // const self = this;
  }

  addColForSearch() {
    const self = this;
    self.filterModel.push({
      dataKey: '_id',
      filterType: 'equals',
      filterValue: '',
      filterObject: {}
    });
  }

  removeRow(itemIndex: number) {
    const self = this;
    if (itemIndex > -1) {
      self.filterModel.splice(itemIndex, 1);
    }
    self.filterModelChange.emit(self.filterModel);
  }

  onFilterModelChange(model: FilterModel, index: number) {
    const self = this;
    self.filterModel.splice(index, 1, model);
    self.filterModelChange.emit(self.filterModel);
  }


}
