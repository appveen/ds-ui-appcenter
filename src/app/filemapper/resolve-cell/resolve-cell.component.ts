import { Component } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'odp-resolve-cell',
  templateUrl: './resolve-cell.component.html',
  styleUrls: ['./resolve-cell.component.scss']
})
export class ResolveCellComponent implements ICellRendererAngularComp {

  params: ICellRendererParams;
  data: any;
  definition: any;
  dataKey: string;
  id: string;
  constructor() {
    const self = this;
  }

  agInit(params: ICellRendererParams) {
    const self = this;
    self.id = Date.now() + '' + Math.random();
    self.params = params;
    self.data = self.params.data;
    self.definition = self.params.colDef.refData;
    self.dataKey = self.data.data._id;
  }

  refresh() {
    return true;
  }

  updateList(event: any) {
    const self = this;
    self.params.data._selected = event.target.checked;
    self.params.api.forEachNode(rowNode => {
      if (rowNode.data.data._id === self.data.data._id && self.data.sNo !== rowNode.data.sNo) {
        rowNode.data._selected = false;
      }
    });
  }

  uncheck() {
    const self = this;
    self.params.data._selected = false;
  }
}
