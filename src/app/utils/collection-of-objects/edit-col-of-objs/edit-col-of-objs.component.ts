import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'odp-edit-col-of-objs',
  templateUrl: './edit-col-of-objs.component.html',
  styleUrls: ['./edit-col-of-objs.component.scss']
})
export class EditColOfObjsComponent implements AgRendererComponent {
  params: ICellRendererParams;
  parentContext: any;
  selectedRowIndex: number;

  constructor() { }

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.parentContext = params.context.gridParent;
    this.selectedRowIndex = this.params.rowIndex;
  }

  removeItem(event: Event) {
    event.stopPropagation();
    this.parentContext.selectedRowIndex = this.params.rowIndex;
    this.parentContext.removeItem(this.params.node.data);
  }

  editItem(event: Event) {
    event.stopPropagation();
    this.parentContext.selectedRowIndex = this.params.rowIndex;
    this.parentContext.editItem();
  }
}
