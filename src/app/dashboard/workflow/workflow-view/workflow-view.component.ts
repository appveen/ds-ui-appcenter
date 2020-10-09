import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { Definition, Properties } from 'src/app/interfaces/definition';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { WorkflowService } from 'src/app/dashboard/workflow/workflow.service';

@Component({
  selector: 'odp-workflow-view',
  templateUrl: './workflow-view.component.html',
  styleUrls: ['./workflow-view.component.scss']
})
export class WorkflowViewComponent implements OnInit {

  @Input() definition: Definition;
  @Input() data: any;
  @Input() approversList: Array<any>;
  @Output() actionChange: EventEmitter<any>;
  showActionButtons: boolean;
  properties: Properties;
  currencyType: string;
  showPassword: boolean;
  isenrichTextWithLinkRequired: boolean;
  textWithLink: any;
  keysCount: number;
  id: string;
  url: string;
  formattedAddress: string;
  serviceId: string;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private wfService: WorkflowService) {
    const self = this;
    self.showActionButtons = false;
    self.actionChange = new EventEmitter();
  }

  ngOnInit() {
    const self = this;
    self.properties = self.definition.properties;
    self.currencyType = self.definition.properties.currency;
    if (self.value && self.value.formattedAddress) {
      self.formattedAddress = self.value.formattedAddress;
    } else if (self.value && self.value.userInput) {
      self.formattedAddress = self.value.userInput;
    }
  }

  changedFields() {
    return this.appService.countChangedFields(this.data.old, this.data.new);
  }

  performAction(type, event) {
    const self = this;
    self.actionChange.emit(type);
    self.wfService.showActionItems = false;
    self.wfService.showFilterIcon = false;
    event.stopPropagation();
  }

  getValue(path: string) {
    const self = this;
    self.appService.getValue(path, self.data);
  }

  get relVal() {
    const self = this;
    const temp = self.appService.getValue(self.definition.dataKey + '.' + self.definition.properties.relatedSearchField, self.data);
    return temp ? temp : 'N.A';
  }

  get value() {
    const self = this;
    const temp = self.appService.getValue(self.definition.dataKey, self.data);
    return temp ;
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
    return this.data._metadata.createdAt;
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
    if (!self.approversList.find(e => e === self.commonService.userDetails._id)) {
      flag = false;
    }
    return flag;
  }
}
