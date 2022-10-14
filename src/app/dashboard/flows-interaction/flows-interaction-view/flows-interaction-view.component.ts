import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest } from 'rxjs';
import { CommonService } from 'src/app/service/common.service';
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
      console.log(params);
      this.getInteractions(params);
    });
  }

  getInteractions(params: any) {
    combineLatest([
      this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${params.flowId}/${params.interactionId}`),
      this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${params.flowId}/${params.interactionId}/state`),
      this.commonService.get('pm', `/${this.commonService.app._id}/flow/${params.flowId}`)
    ]).subscribe(res => {
      this.interactionData = res[0]
      this.interactionStateList = res[1];
      this.flowData = res[2];
      console.log(res);
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
}
