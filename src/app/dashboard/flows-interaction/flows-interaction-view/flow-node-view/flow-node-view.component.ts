import { Component, Input, OnInit } from '@angular/core';
import { AppService } from 'src/app/service/app.service';
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
  constructor(private appService: AppService,
    private flowsService: FlowsInteractionService) {
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
  }

  getNextNode(node: any) {
    return (this.flowData.nodes || []).find(e => e._id == node._id);
  }

  downloadStateData() {
    this.appService.downloadText(this.currNode._id + '.json', JSON.stringify(this.completeData, null, 4));
  }

  get bodyDetails() {
    if (this.currState && this.currState.body) {
      if (Array.isArray(this.currState.body)) {
        return 'Payload is an array with ' + this.currState.body.length + ' no of rows';
      } else {
        return 'Payload is an Object with ' + Object.keys(this.currState.body).length + ' no of keys/fields';
      }
    }
    return 'Payload is in non-readable format';
  }
}
