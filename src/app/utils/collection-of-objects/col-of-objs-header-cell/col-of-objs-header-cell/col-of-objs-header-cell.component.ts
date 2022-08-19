import { Component } from '@angular/core';
import { IHeaderAngularComp } from 'ag-grid-angular';
import { IHeaderParams } from 'ag-grid-community';

@Component({
  selector: 'odp-col-of-objs-header-cell',
  templateUrl: './col-of-objs-header-cell.component.html',
  styleUrls: ['./col-of-objs-header-cell.component.scss']
})
export class ColOfObjsHeaderCellComponent implements IHeaderAngularComp {
  params: IHeaderParams;
  definition: any;

  constructor() { }

  agInit(params: IHeaderParams): void {
    this.params = params;
    this.definition = this.params.column.getColDef().refData;
  }

  onSortRequested(event) {
    const order = this.params.column.isSortAscending() ? 'desc' : this.params.column.isSortDescending() ? '' : 'asc';
    this.params.setSort(order, event.shiftKey);
  }

  refresh(): boolean {
    return false;
  }


}
