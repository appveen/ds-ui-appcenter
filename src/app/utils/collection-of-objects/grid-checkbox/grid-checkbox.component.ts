import { Component } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

@Component({
  selector: 'odp-grid-checkbox',
  templateUrl: './grid-checkbox.component.html',
  styleUrls: ['./grid-checkbox.component.scss']
})
export class GridCheckboxComponent implements AgRendererComponent {
  params: ICellRendererParams;

  get checkBoxState(): boolean {
    return !!this.params && this.params.node.isSelected();
  }

  constructor() { }

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
  }

  onCheckChanged(val: boolean) {
    this.params.node.setSelected(val);
  }

}
