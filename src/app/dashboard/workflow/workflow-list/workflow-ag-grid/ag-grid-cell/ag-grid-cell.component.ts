import { ICellRendererParams, IAfterGuiAttachedParams } from 'ag-grid-community';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { WorkflowAgGridService } from '../workflow-ag-grid.service';
import { CommonService } from 'src/app/service/common.service';
import { Properties } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { Md5 } from 'ts-md5';

@Component({
  selector: 'odp-ag-grid-cell',
  templateUrl: './ag-grid-cell.component.html',
  styleUrls: ['./ag-grid-cell.component.scss']
})
export class AgGridCellComponent implements ICellRendererAngularComp {
  params: ICellRendererParams;
  definition: any;
  data: any;
  currencyType: string;
  showPassword: boolean;
  // type: string;
  properties: Properties;
  values: any;
  serviceId: string;
  isenrichTextWithLinkRequired: boolean;
  textWithLink: any;
  keysCount: number;
  id: string;
  url: string;
  formattedAddress: string;
  decryptedValue: string;
  timezoneValue: string;
  parsedDate: string;
  constructor(
    private appService: AppService,
    private commonService: CommonService,
    private gridService: WorkflowAgGridService,
    private router: Router
  ) {
    const self = this;
    self.properties = {};
  }

  agInit(params: ICellRendererParams): void {
    const self = this;
    self.params = params;
    self.data = params.data || {};
    self.id = self.data._id;
    self.values = params.value;
    self.definition = params.colDef.refData;
    self.properties = self.definition.properties;
    self.currencyType = self.definition.properties.currency;
    if (self.value && self.value.formattedAddress) {
      self.formattedAddress = self.value.formattedAddress;
    } else if (self.value && self.value.userInput) {
      self.formattedAddress = self.value.userInput;
    } else if (this.value && this.value.rawData) {
      this.parsedDate = this.appService.getUTCString(this.value.rawData, this.value.tzInfo);
      this.timezoneValue = this.value.tzInfo;
    }
  }

  refresh(params: any): boolean {
    const self = this;
    return false;
  }

  afterGuiAttached(params?: IAfterGuiAttachedParams): void {
    const self = this;
  }
  changedFields() {
    return this.appService.countChangedFields(this.data.old, this.data.new);
  }

  getValue(path: string) {
    const self = this;
    self.appService.getValue(path, self.data);
  }

  respond(event) {
    event.stopPropagation();
    const self = this;
    self.gridService.respond.emit(self.data);
  }

  view() {
    const self = this;
    self.gridService.respond.emit(self.data);
    self.router.navigate(['/', this.commonService.app._id, 'workflow', self.appService.serviceId, self.id]);
  }

  showDecryptedValue(value) {
    const self = this;

    self.showPassword = !self.showPassword;
    if (self.showPassword) {
      let cksm = Md5.hashStr(value.value);
      if (value.checksum && value.checksum === cksm) {
        self.decryptedValue = value.value;
      }
      else {
        self.commonService.post('sec', '/enc/' + this.commonService.app._id + '/decrypt', { data: value.value }).subscribe(res => {
          self.decryptedValue = res.data;
        }, err => {
          self.decryptedValue = value.value;
        })
      }
    }

  }

  get relVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.dataKey + '.' + self.definition.properties.relatedSearchField, self.data);
    return temp ? temp : 'N.A';
  }

  get value() {
    const self = this;
    const temp = self.appService.getValue(self.definition.dataKey, self.data);
    return temp;
  }

  get type() {
    const self = this;
    return self.definition.type;
  }

  get wfType() {
    return this.data.operation;
  }

  get docId() {
    return this.data.documentId;
  }

  get wfId() {
    return this.data._id;
  }

  get user() {
    return this.data.username;
  }
  get lastRespondedBy() {
    return this.data.respondedBy;

  }

  get createdOn() {
    if (this.data && this.data._metadata) {
      return this.data._metadata.createdAt;
    } else
      return null
  }

  get status() {
    return this.data.status;
  }
  get canRespond() {
    const self = this;
    let flag = false;
    let audit;
    if (self.data && self.data.audit) {
      audit = self.data.audit[self.data.audit.length - 1];
    }
    if (self.data.requestedBy !== self.commonService.userDetails._id) {
      flag = true;
    }
    if (audit && audit.id !== self.commonService.userDetails._id) {
      flag = true;
    }
    if (self.data.status !== 'Pending') {
      flag = false;
    }
    if (!self.gridService.approversList.find(e => e === self.commonService.userDetails._id)) {
      flag = false;
    }
    return flag;
  }
  get checked() {
    const self = this;
    if (self.params && self.params.node) {
      return self.params.node.isSelected();
    }
    return false;
  }

  onCheckChanged(val) {
    this.params.node.setSelected(val);
  }
}
