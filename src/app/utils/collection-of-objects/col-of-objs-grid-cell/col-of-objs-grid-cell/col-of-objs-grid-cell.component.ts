import { Component, OnInit } from '@angular/core';
import { AgRendererComponent } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';

import { Definition, Properties, Currency } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-col-of-objs-grid-cell',
  templateUrl: './col-of-objs-grid-cell.component.html',
  styleUrls: ['./col-of-objs-grid-cell.component.scss']
})
export class ColOfObjsGridCellComponent implements OnInit, AgRendererComponent {
  params: ICellRendererParams;
  data: any;
  value: any;
  definition: Definition;
  type: string;
  properties: Properties;
  currencyType: Currency;
  isenrichTextWithLinkRequired: boolean;
  textWithLink: string;
  keysCount: number;
  formattedAddress: any;
  url: string;
  serviceId: string;
  showPassword: boolean;
  id: string;

  get checked() {
    if (this.params && this.params.node) {
      return this.params.node.isSelected();
    }
    return false;
  }

  constructor(private appService: AppService) { }

  refresh(): boolean {
    return false;
  }

  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.data = params.data || {};
    this.id = this.data._id;
    this.value = params.value;
    this.definition = params.colDef.refData;
    this.init();
  }

  ngOnInit(): void {
    this.init();
  }

  private init() {
    this.type = this.definition.type;
    this.properties = this.definition.properties;
    this.currencyType = this.definition.properties.currency;
    if (!this.value) {
      this.value = this.appService.getValue(this.definition['controlPath'], this.data);
    }
    this.serviceId = this.appService.serviceId;
    this.isenrichTextWithLinkRequired = this.checkForLink(this.value);
    this.textWithLink = this.enrichTextWithLink(this.value);
    if (this.value && typeof this.value === 'object') {
      this.keysCount = Object.keys(this.value).length;
    }
    if (this.value && this.value.formattedAddress) {
      this.formattedAddress = this.value.formattedAddress;
    } else if (this.value && this.value.userInput) {
      this.formattedAddress = this.value.userInput;
    }
    if (this.value && this.value.geometry && this.value.geometry.coordinates) {
      this.url = `https://www.google.co.in/maps?q=MyLoc@${this.value.geometry.coordinates[1]},${this.value.geometry.coordinates[0]}`;
    }
  }

  private checkForLink(value): boolean {
    let returnVal = false;
    const rgxStr = '^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$';
    if (typeof value !== 'string') {
      return returnVal;
    }
    if (value && value.match(rgxStr)) {
      returnVal = true;
    }
    return returnVal;
  }

  private enrichTextWithLink(value: string) {
    try {
      const rgxStr = '^(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,5}(:[0-9]{1,5})?(\/.*)?$';
      if (this.definition.properties.email) {
        const temp = value.replace(/(.*)([\w]{2,}@[\w]{2,}\.[a-z\.]{2,})(.*)/, '$1<a href="mailto:$2">$2</a>$3');
        return temp;
      } else if (value && value.match(rgxStr)) {
        const temp1 = value.replace(/(.*)(https?:\/\/[\w-]{2,}\.[a-z\.]{2,}\S*)(.*)/, '$1<a href="$2" target="_blank">$2</a>$3')
        return temp1;
      } else {
        return value;
      }
    } catch (e) {
      return value;
    }
  }

  onRightClick() {
    return false;
  }

  viewItem(event: Event) {
    event.stopPropagation();
    const allColumns = this.params.columnApi.getAllColumns();
    const actionColumn = allColumns.find(col => col.getColDef().headerName === 'Action');
    const crInstances = this.params.api.getCellRendererInstances({ columns: [actionColumn], rowNodes: [this.params.node] });
    if (!!crInstances && !!crInstances.length) {
      const cellDomRef = crInstances[0].getGui();
      const viewBtnRef = cellDomRef.querySelector('.viewBtn') as HTMLButtonElement;
      if (!!viewBtnRef) {
        viewBtnRef.click();
        return;
      }
      const editBtnRef = cellDomRef.querySelector('.editBtn') as HTMLButtonElement;
      if (!!editBtnRef) {
        editBtnRef.click();
      }
    }
  }

}
