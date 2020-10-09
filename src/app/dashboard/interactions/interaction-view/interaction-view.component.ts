import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import * as _ from 'lodash';

import { NodeData } from '../interactions.model';
import { CommonService } from 'src/app/service/common.service';
import { AppService } from 'src/app/service/app.service';
import { InteractionsService } from 'src/app/dashboard/interactions/interactions.service';

@Component({
  selector: 'odp-interaction-view',
  templateUrl: './interaction-view.component.html',
  styleUrls: ['./interaction-view.component.scss']
})
export class InteractionViewComponent implements OnInit, OnDestroy {

  transactionId: string;
  remoteTxnId: string;
  interactionData: any;
  interactionBlocks: Array<any>;
  subscriptions: any = {};
  config: {
    filter?: any;
    sort?: any;
    count: -1;
  };
  requestBlocks: Array<NodeData>;
  responseBlocks: Array<NodeData>;
  errorBlocks: Array<NodeData>;
  params: any;
  refreshing: boolean;
  constructor(private route: ActivatedRoute,
    private router: Router,
    private appService: AppService,
    public commonService: CommonService,
    private is: InteractionsService,
    private ts: ToastrService) {
    const self = this;
    self.transactionId = '';
    self.remoteTxnId = '';
    self.interactionData = {};
    self.interactionBlocks = [];
    self.config = {
      filter: '',
      sort: '',
      count: -1
    };
  }

  ngOnInit() {
    const self = this;
    self.subscriptions.appChange = self.appService.appChange.subscribe(app => {
      self.router.navigate(['/~']);
    });
    self.subscriptions.viewSubs = self.route.params.subscribe((params) => {
      self.params = params;
      self.init();
    });
  }

  init() {
    const self = this;
    self.appService.partnerId = self.params.partnerId;
    self.transactionId = self.params.txnId;
    self.remoteTxnId = self.appService.remoteTxnId;
    self.config.filter = { odpTxnId: self.params.txnId, remoteTxnId: self.appService.remoteTxnId };
    const interactionAPI = self.commonService.get('pm', `/${self.commonService.app._id}/interaction`, self.config);
    const interactionBlocksAPI = self.commonService.get('pm', `/${self.commonService.app._id}/interactionBlock`, self.config);
    self.refreshing = true;
    forkJoin([interactionAPI, interactionBlocksAPI]).subscribe((results) => {
      self.refreshing = false;
      self.interactionData = results[0][0];
      self.interactionBlocks = results[1];
      if (self.interactionData.statusAudit && self.interactionData.statusAudit.length > 0) {
        self.interactionData.statusAudit = self.interactionData.statusAudit
          .filter((e, i, a) => a.findIndex(ae => e.message === ae.message) === i);
      }
      self.requestBlocks = self.is.parseBlocks(self.interactionData.flowData.block);
      self.responseBlocks = self.is.parseBlocks(self.interactionData.flowData.successBlock);
      self.errorBlocks = self.is.parseBlocks(self.interactionData.flowData.errorBlock);
      self.decryptPassword();
    }, err => {
      self.refreshing = false;
      console.error(err);
    });
  }

  interactions() {
    const self = this;
    if (self.is.fromAllInteractions) {
      self.router.navigate([`/~/interactions/all`], { relativeTo: self.route });
    } else {
      self.router.navigate([`~/interactions/${self.interactionData.partnerId}/${self.interactionData.flowId}`]);
    }
  }

  getStatus(status?) {
    if (status) {
      switch (status) {
        case 'SUCCESS': {
          return 'Successful';
        }
        case 'ERROR': {
          return 'Failed';
        }
        case 'PENDING': {
          return 'Pending';
        }
        case 'UNKNOWN': {
          return 'Unknown';
        }
        case 'QUEUED': {
          return 'Queued';
        }
      }
    }
  }

  decryptPassword() {
    const self = this;
    if (self.interactionData.inputPassword) {
      self.subscriptions.inputPassword = self.commonService.get('pm',
        `/${self.commonService.app._id}/interaction/${self.interactionData._id}/decrypt?pwd=${self.interactionData.inputPassword}`)
        .subscribe(res => {
          self.interactionData.inputPasswordDecoded = res.password;
        }, err => { });
    }
    if (self.interactionData.outputPassword) {
      self.subscriptions.outputPassword = self.commonService.get('pm',
        `/${self.commonService.app._id}/interaction/${self.interactionData._id}/decrypt?pwd=${self.interactionData.outputPassword}`)
        .subscribe(res => {
          self.interactionData.outputPasswordDecoded = res.password;
        }, err => { });
    }
  }

  reDownloadMeta() {
    const self = this;
    const payload = [
      {
        remoteTxnID: self.remoteTxnId,
        odpTxnID: self.transactionId
      }
    ];
    self.subscriptions.reDownloadMeta = self.commonService.post('pm', `/${self.commonService.app._id}/interaction/redownloadFile`, payload)
      .subscribe((res) => {
        self.ts.success(res.message);
      });
  }

  ngOnDestroy() {
    const self = this;
    self.appService.failedStep = false;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  getLogData(node: NodeData) {
    const self = this;
    if (self.interactionBlocks && self.interactionBlocks.length > 0) {
      const temp = self.interactionBlocks.find(e => {
        if (e.sequenceNo === node.sequenceNo) {
          if (node.meta.flowType === 'request' && (e.flowType === node.meta.flowType || e.flowType === null || e.flowType === undefined)) {
            return true;
          } else if (e.flowType === node.meta.flowType) {
            return true;
          }
        }
      });
      return temp;
    }
    return null;
  }

  refresh() {
    const self = this;
    self.init();
  }

  get apiCallsPending() {
    return false;
  }
}
