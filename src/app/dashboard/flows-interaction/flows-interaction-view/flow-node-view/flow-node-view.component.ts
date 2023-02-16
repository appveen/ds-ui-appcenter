import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';

import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { FlowsInteractionService } from '../../flows-interaction.service';

@Component({
  selector: 'odp-flow-node-view',
  templateUrl: './flow-node-view.component.html',
  styleUrls: ['./flow-node-view.component.scss']
})
export class FlowNodeViewComponent implements OnInit {

  @Input() selectedNodeId: string;
  @Input() currNode: any;
  @Input() flowData: any;
  @Input() stateList: Array<any>;
  currState: any;
  toggleHeaders: boolean;
  togglePayload: boolean;
  completeData: any;
  fetchingData: boolean;
  constructor(private appService: AppService,
    private flowsService: FlowsInteractionService,
    private commonService: CommonService) {
    this.flowData = {};
    this.stateList = [];
    this.toggleHeaders = true;
  }

  ngOnInit(): void {
    this.currState = this.stateList.find(e => e.nodeId == this.currNode._id) || {};
    this.completeData = JSON.parse(JSON.stringify(this.currNode));
    this.completeData.data = JSON.parse(JSON.stringify(this.currState));
    delete this.completeData.onSuccess;
    delete this.completeData.dataStructure;
    if (this.currNode.type == 'DATASERVICE' && !this.currNode.options.name) {
      this.commonService.getService(this.currNode.options._id)
    }

  }

  getContentType(contentType: string) {
    return this.flowsService.getContentType(contentType);
  }

  getStatusClass() {
    if (this.currState) {
      return this.flowsService.getStatusClass(this.currState);
    }
    return 'text-warning';
  }

  getStatusBagdeClass() {
    if (this.currState) {
      return this.flowsService.getStatusBadgeClass(this.currState);
    }
    return 'text-warning';
  }

  getNextNode(node: any) {
    return (this.flowData.nodes || []).find(e => e._id == node._id);
  }

  downloadStateData() {
    this.appService.downloadText(this.currNode._id + '.json', JSON.stringify(this.completeData, null, 4));
  }

  showPayload() {
    this.togglePayload = !this.togglePayload;
    if (this.togglePayload && !this.currState.body) {
      this.fetchPayload();
    }
  }

  fetchPayload() {
    this.fetchingData = true;
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${this.flowData._id}/${this.currState.interactionId}/state/${this.currState.nodeId}/data`).subscribe(res => {
      this.currState.body = res?.body || {};
      this.fetchingData = false;
    }, err => {
      this.fetchingData = false;
      this.commonService.errorToast(err);
    });
  }

  maskValue(value: string, key: string) {
    if (!value) {
      return '-';
    }
    if (key == 'authorization') {
      const arr = new Array(10);
      arr.fill('*');
      return arr.join('') + value.substring(value.length - 10, value.length);
    }
    return value;
  }

  get showNameOfNodeType() {
    if (this.currNode.type == 'DATASERVICE' || this.currNode.type == 'FUNCTION' || this.currNode.type == 'FLOW') {
      return true;
    }
    return false;
  }

  get nameOfNodeType() {
    if (this.currNode.type == 'DATASERVICE') {
      return this.currNode.options.dataService.name;
    }
    if (this.currNode.type == 'FUNCTION') {
      return this.currNode.options.faas.name;
    }
    if (this.currNode.type == 'FLOW') {
      return this.currNode.options.flow.name;
    }
    return 'N.A.';
  }

  get duration() {
    if (this.currState && this.currState._metadata && this.currState._metadata.createdAt && this.currState._metadata.lastUpdated) {
      return this.flowsService.getDuration(this.currState._metadata.createdAt, this.currState._metadata.lastUpdated);
    }
    return '-';
  }

  get startTime() {
    if (this.currState && this.currState._metadata && this.currState._metadata.createdAt) {
      return moment(this.currState._metadata.createdAt).format("DD MM YYYY hh:mm:ss a");
    }
    return 'Not Yet started.';
  }

  get endTime() {
    if (this.currState && this.currState._metadata && this.currState._metadata.lastUpdated) {
      return moment(this.currState._metadata.lastUpdated).format("DD MM YYYY hh:mm:ss a");
    }
    if (!(this.currState && this.currState._metadata && this.currState._metadata.createdAt)) {
      return 'Not Yet started.';
    }
    return 'In Progress...';
  }
}
