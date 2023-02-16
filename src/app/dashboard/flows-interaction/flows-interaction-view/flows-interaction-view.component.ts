import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { CommonService } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { FlowsInteractionService } from '../flows-interaction.service';

@Component({
  selector: 'odp-flows-interaction-view',
  templateUrl: './flows-interaction-view.component.html',
  styleUrls: ['./flows-interaction-view.component.scss']
})
export class FlowsInteractionViewComponent implements OnInit {

  interactionData: any;
  flowData: any;
  interactionStateList: Array<any>;
  selectedNodeId: string;
  constructor(private commonService: CommonService,
    private route: ActivatedRoute,
    private flowsService: FlowsInteractionService) {
    this.interactionData = {
      headers: {}
    };
    this.interactionStateList = [];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.getInteractions(params);
    });
  }

  getInteractions(params: any) {
    const filter = { app: this.commonService.app._id }
    combineLatest([
      this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${params.flowId}/${params.interactionId}`, { filter }),
      this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${params.flowId}/${params.interactionId}/state`, { filter }),
      this.commonService.get('pm', `/${this.commonService.app._id}/flow/${params.flowId}`, { filter })
    ]).subscribe(res => {
      this.interactionData = res[0]
      this.interactionStateList = res[1];
      this.flowData = res[2];
      this.selectedNodeId = this.flowData.inputNode._id;
      if (!environment.production) {
        console.log(res);
      }
    }, err => {
      console.error(err);
    })
  }

  getContentType(contentType: string) {
    return this.flowsService.getContentType(contentType);
  }

  getStatusClass(item: any) {
    if (item) {
      return this.flowsService.getStatusClass(item);
    }
  }

  getStatusBadgeClass(item: any) {
    if (item) {
      return this.flowsService.getStatusBadgeClass(item);
    }
  }

  getStatusClassSuffix(item: any) {
    if (item) {
      return this.flowsService.getStatusClassSuffix(item);
    }
  }

  getNextNode(node: any) {
    return (this.flowData.nodes || []).find(e => e._id == node._id);
  }

  getDuration(startTime: string, endTime: string) {
    return this.flowsService.getDuration(startTime, endTime);
  }

  hasError(nodeId: string) {
    const temp = this.interactionStateList.find(e => e.nodeId == nodeId);
    if (temp && temp.status === 'ERROR') {
      return true;
    }
  }
}
