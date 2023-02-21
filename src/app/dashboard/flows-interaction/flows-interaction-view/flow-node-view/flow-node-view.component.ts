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

  @Input() node: any;
  @Input() flowData: any;
  toggle: any;
  completeData: any;
  fetchingData: boolean;
  constructor(private appService: AppService,
    private flowsService: FlowsInteractionService,
    private commonService: CommonService) {
    this.flowData = {};
    this.toggle = {};
    this.toggle['headers'] = true;
  }

  ngOnInit(): void {
    this.completeData = JSON.parse(JSON.stringify(this.node));
    this.completeData.data = JSON.parse(JSON.stringify(this.node.state));
    delete this.completeData.onSuccess;
    delete this.completeData.dataStructure;
    if (this.node.type == 'DATASERVICE' && !this.node.options.name) {
      this.commonService.getService(this.node.options._id)
    }

  }

  getContentType(contentType: string) {
    return this.flowsService.getContentType(contentType);
  }

  getStatusClass() {
    if (this.node.state) {
      return this.flowsService.getStatusClass(this.node.state);
    }
    return 'text-warning';
  }

  getStatusBagdeClass() {
    if (this.node.state) {
      return this.flowsService.getStatusBadgeClass(this.node.state);
    }
    return 'text-warning';
  }

  getNextNode(node: any) {
    if (node._id == this.node._id) {
      return null;
    }
    let temp = (this.flowData.nodes || []).find(e => e._id == node._id && !e.visited);
    if (temp) {
      temp.visited = true;
    }
    return temp;
  }

  downloadStateData() {
    this.appService.downloadText(this.node._id + '.json', JSON.stringify(this.completeData, null, 4));
  }

  showPayload() {
    this.toggle['payload'] = !this.toggle['payload'];
    if (this.toggle['payload'] && !this.node.state.body) {
      this.fetchPayload();
    }
  }

  fetchPayload() {
    this.fetchingData = true;
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${this.flowData._id}/${this.node.interactionId}/state/${this.node._id}/data`).subscribe(res => {
      this.node.state.body = res?.body || {};
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

  getPayloadType(data: any) {
    if (!data) {
      return 'Object';
    }
    return Array.isArray(data) ? 'Array' : 'Object';
  }

  getPayloadAttributes(data: any) {
    if (!data) {
      return 0;
    }
    let temp = data;
    if (Array.isArray(data)) {
      temp = data[0];
    }
    if (!temp) {
      return 0;
    }
    if (typeof temp == 'object') {
      return Object.keys(temp).length;
    }
    return 1;
  }

  getTotalRecords(data: any) {
    if (!data) {
      return 0;
    }
    if (Array.isArray(data)) {
      return data.length;
    }
    return 1;
  }

  get showNameOfNodeType() {
    if (this.node.type == 'DATASERVICE' || this.node.type == 'FUNCTION' || this.node.type == 'FLOW') {
      return true;
    }
    return false;
  }

  get nameOfNodeType() {
    if (this.node.type == 'DATASERVICE') {
      return this.node.options.dataService.name;
    }
    if (this.node.type == 'FUNCTION') {
      return this.node.options.faas.name;
    }
    if (this.node.type == 'FLOW') {
      return this.node.options.flow.name;
    }
    return 'N.A.';
  }

  get duration() {
    if (this.node.state && this.node.state._metadata && this.node.state._metadata.createdAt && this.node.state._metadata.lastUpdated) {
      return this.flowsService.getDuration(this.node.state._metadata.createdAt, this.node.state._metadata.lastUpdated);
    }
    return '-';
  }

  get startTime() {
    if (this.node.state && this.node.state._metadata && this.node.state._metadata.createdAt) {
      return moment(this.node.state._metadata.createdAt).format("DD MM YYYY hh:mm:ss a");
    }
    return 'Not Yet started.';
  }

  get endTime() {
    if (this.node.state && this.node.state._metadata && this.node.state._metadata.lastUpdated) {
      return moment(this.node.state._metadata.lastUpdated).format("DD MM YYYY hh:mm:ss a");
    }
    if (!(this.node.state && this.node.state._metadata && this.node.state._metadata.createdAt)) {
      return 'Not Yet started.';
    }
    return 'In Progress...';
  }
}
