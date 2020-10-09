import { Component, TemplateRef, ViewChild } from '@angular/core';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-view-col-of-objs',
  templateUrl: './view-col-of-objs.component.html',
  styleUrls: ['./view-col-of-objs.component.scss']
})
export class ViewColOfObjsComponent implements AgRendererComponent {
  @ViewChild('viewModal', { static: false }) viewModal: TemplateRef<HTMLElement>;
  viewModalRef: NgbModalRef;
  params: ICellRendererParams;
  parentContext: any;
  selectedRowIndex: number;
  expandedDefinitions: any[] = [];

  get arrayValues(): Array<any> {
    if (!!this.parentContext) {
      switch (this.parentContext.historyMode) {
        case 'old':
          return this.parentContext.oldValue;
        case 'new':
          return this.parentContext.newValue;
        default:
          return this.parentContext.definition.value
      }
    }
    return [];
  }

  constructor(private ngbModal: NgbModal, private appService: AppService) { }

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.parentContext = params.context.gridParent;
    this.selectedRowIndex = this.params.rowIndex;
    this.expandDefinitions();
  }

  expandDefinitions() {
    for (let i = 0; i < this.arrayValues.length; i++) {
      this.expandedDefinitions.push(
        {
          definition: this.parentContext.definition.definition.map(def => {
            if (def.type === 'Object') {
              const selfDefinition = this.getDefinitionWithValue(def, this.arrayValues[i], i, this.parentContext.definition.path);
              selfDefinition.value = this.arrayValues[i][selfDefinition.key];
              selfDefinition.definition = selfDefinition.definition.map(d => {
                return this.getDefinitionWithValue(d, this.arrayValues[i], i, this.parentContext.definition.path);
              })
              return selfDefinition;
            }
            return this.getDefinitionWithValue(def, this.arrayValues[i], i, this.parentContext.definition.path)
          }),
          value: this.arrayValues[i]
        }
      )
    }
  }

  viewItem(event: Event) {
    event.stopPropagation();
    this.selectedRowIndex = this.params.rowIndex;
    this.viewModalRef = this.ngbModal.open(this.viewModal, { centered: true, backdrop: 'static', keyboard: false, windowClass: 'large-modal' })
    this.viewModalRef.result.then(() => {
      this.parentContext.afterViewItem();
    })
  }

  getDefinitionWithValue(def: any, val: any, index: number, replaceText): any {
    const temp = this.appService.cloneObject(def);
    temp.path = this.appService.compilePath((temp.path as string).replace(replaceText + '.', ''), [index]);
    if (this.parentContext.hasPath) {
      temp.value = this.appService.getValue(temp.path, val);
    } else {
      temp.value = val;
    }
    return temp;
  }

  goToPreviousItem() {
    this.selectedRowIndex--;
  }

  goToNextItem() {
    this.selectedRowIndex++;
  }

}
