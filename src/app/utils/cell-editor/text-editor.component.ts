
import {
  AfterViewInit,
  Component,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { FormArray } from '@angular/forms';
import { ICellEditorAngularComp } from 'ag-grid-angular';
import { ICellEditorParams } from 'ag-grid-community';

@Component({
  selector: 'editor-cell',
  template: `<input
    [type]="type"
    [(ngModel)]="value"
    (ngModelChange)="changeValue($event)"
    #input
    style="width: 100%"
    class="border text-secondary ml-2"
  />`,
})
export class TextEditor implements ICellEditorAngularComp, AfterViewInit {
  private params: any;
  public value;
  public type;
  public formArray: FormArray;
  public controlPath;

  @ViewChild('input', { read: ViewContainerRef })
  public input: ViewContainerRef;

  ngAfterViewInit() {
    setTimeout(() => this.input.element.nativeElement.focus());
  }

  agInit(params: any): void {
    this.params = params;
    this.formArray = params.formArray;
    this.controlPath = params.path;
    switch (this.params.type) {
      case 'Number':
        this.type = 'number';
        break;
      default:
        this.type = 'text';
    }
    this.value = this.params.value;
  }


  changeValue(event) {
    this.formArray.at(this.params.rowIndex).get(this.controlPath).patchValue(event)
  }


  getValue() {
    return this.value;
  }

  isCancelAfterEnd() {
    return false;
  }
}