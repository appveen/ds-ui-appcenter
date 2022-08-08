
import {
  AfterViewInit,
  Component,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { ICellEditorParams } from 'ag-grid-community';

@Component({
  selector: 'editor-cell',
  template: `<input
    type="text"
    [(ngModel)]="value"
    #input
    style="width: 100%"
    class="border text-secondary ml-2"
  />`,
})
export class TextEditor implements ICellEditorAngularComp, AfterViewInit {
  private params: ICellEditorParams;
  public value;

  @ViewChild('input', { read: ViewContainerRef })
  public input: ViewContainerRef;

  ngAfterViewInit() {
    setTimeout(() => this.input.element.nativeElement.focus());
  }

  agInit(params: ICellEditorParams): void {
    this.params = params;
    this.value = this.params.value;
  }


  getValue() {

    return this.value;
  }


  isCancelAfterEnd() {
    return false;
  }
}