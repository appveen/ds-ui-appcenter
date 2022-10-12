import { Component, Input, OnInit } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { FlowsInteractionService } from '../../flows-interaction.service';

@Component({
  selector: 'odp-flow-node-view',
  templateUrl: './flow-node-view.component.html',
  styleUrls: ['./flow-node-view.component.scss']
})
export class FlowNodeViewComponent implements OnInit {

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
  }

  ngOnInit(): void {
    this.currState = this.stateList.find(e => e.nodeId == this.currNode._id) || {};
    this.completeData = JSON.parse(JSON.stringify(this.currNode));
    this.completeData.data = JSON.parse(JSON.stringify(this.currState));
    delete this.completeData.onSuccess;
    delete this.completeData.dataStructure;

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
      this.currState.body = res.body;
      this.fetchingData = false;
    }, err => {
      this.fetchingData = false;
      this.commonService.errorToast(err);
    });
  }
}
