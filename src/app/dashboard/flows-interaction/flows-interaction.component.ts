import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonService } from 'src/app/service/common.service';
import { FlowsInteractionService } from './flows-interaction.service';

@Component({
  selector: 'odp-flows-interaction',
  templateUrl: './flows-interaction.component.html',
  styleUrls: ['./flows-interaction.component.scss']
})
export class FlowsInteractionComponent implements OnInit {

  interactionList: Array<any>;
  constructor(private commonService: CommonService,
    private route: ActivatedRoute,
    private flowsService: FlowsInteractionService) {
    this.interactionList = [];
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      console.log(params);
      this.getInteractions(params.flowId);
    });
  }

  getInteractions(flowId: string) {
    this.commonService.get('pm', `/${this.commonService.app._id}/interaction/${flowId}`).subscribe(res => {
      this.interactionList = res;
      console.log(res);
    }, err => {
      console.error(err);
    })
  }

  getContentType(contentType: string) {
    return this.flowsService.getContentType(contentType);
  }

  getStatusClass(item: any) {
    return this.flowsService.getStatusClass(item);
  }
}
