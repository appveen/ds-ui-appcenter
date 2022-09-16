import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonService } from 'src/app/service/common.service';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';

@Component({
  selector: 'odp-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss']
})
export class HistoryComponent implements OnInit, OnDestroy {

  @Input() toggle: boolean;
  @Output() toggleChange: EventEmitter<boolean>;
  @Input() schema: any;
  @Input() documentId: string;
  @Output() auditAvailable: EventEmitter<any>;
  @Output() selectedAudit: EventEmitter<any>;
  @Output() compare: EventEmitter<any>;
  auditConfig: any;
  auditList: Array<any>;
  auditCount: number;
  activeAudit: any;
  subscriptions: {
    [key: string]: Subscription
  };
  wfDataMap: {
    [key: string]: Promise<any>;
  };
  api: string;
  constructor(private commonService: CommonService) {
    const self = this;
    self.auditConfig = {
      count: 10,
      page: 1
    };
    self.toggleChange = new EventEmitter();
    self.auditAvailable = new EventEmitter();
    self.selectedAudit = new EventEmitter();
    self.compare = new EventEmitter();
    self.subscriptions = {};
    self.auditList = [];
    self.wfDataMap = {};
  }

  ngOnInit() {
    const self = this;
    self.api = '/' + self.commonService.app._id + this.schema.api;
    self.getAuditCount(true);
    self.getAudit();
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(key => {
      if (self.subscriptions[key]) {
        self.subscriptions[key].unsubscribe();
      }
    });
  }

  getAudit() {
    const self = this;
    self.auditConfig.filter = {};
    self.auditConfig.filter['data._id'] = self.documentId;
    self.auditConfig.sort = '-timeStamp';
    self.subscriptions['getAudit'] =
      self.commonService.get('mon', `/${self.commonService.app._id}/appCenter/${self.schema._id}/audit`, self.auditConfig).subscribe((data: Array<any>) => {
        if (data.length > 0) {
          data.forEach(e => {
            self.getUserForAudit(e);
            self.getWFData(e);
            e['bg'] = this.getVColor()
            self.auditList.push(e);
          });
          self.selectedAudit.emit(self.auditList[0]);
        }
      }, err => {
        self.commonService.errorToast(err, 'Unable to get audit data , Please try again later.');
      });
  }

  getAuditCount(first?: boolean) {
    const self = this;
    self.subscriptions['getAuditCount'] =
      self.commonService.get('mon', `/${self.commonService.app._id}/appCenter/${self.schema._id}/audit/count`, {
        filter: { 'data._id': self.documentId }
      }).subscribe((res: number) => {
        self.auditCount = res;
        if (first && self.auditCount > 0) {
          self.auditAvailable.emit(true);
        }
      }, err => {
        self.commonService.errorToast(err, 'Unable to get audit data , Please try again later.');
      });
  }

  getWFData(auditData: any) {
    const self = this;
    const options = {
      select: 'audit',
      filter: {
        documentId: self.documentId,
        serviceId: self.schema._id,
        app: self.commonService.app._id,
        status: 'Approved',
        'data.old._metadata.version.document': auditData.data._version - 1
      }
    };
    if (auditData.data._version === 1) {
      options.filter['operation'] = 'POST';
      delete options.filter['data.old._metadata.version.document'];
    }
    if (!self.wfDataMap[auditData.data._version]) {
      self.wfDataMap[auditData.data._version] = self.commonService
        .get('api', this.api + '/utils/workflow', options).toPromise();
    }
    self.wfDataMap[auditData.data._version].then(data => {
      if (data && data.length > 0 && data[0].audit) {
        data[0].audit.forEach(item => self.getUserForWFAudit(item));
        auditData.wfData = data[0].audit;
      }
    }).catch(err => {
      self.commonService.errorToast(err, 'Unable to fetch Workflow Audit for Document version: ' + auditData.data._version);
    });
  }

  loadMore(event) {
    const self = this;
    if (event.target.clientHeight + event.target.scrollTop === event.target.scrollHeight && self.auditCount > self.auditList.length) {
      self.auditConfig.page = self.auditConfig.page + 1;
      self.getAudit();
      self.getAuditCount();
    }
  }

  search(filter) {
    const self = this;
    self.auditConfig.page = 1;
    self.auditConfig.filter = filter;
    self.auditList = [];
    self.getAudit();
    self.getAuditCount();
  }

  clearSearch() {
    const self = this;
    self.auditConfig.page = 1;
    self.auditConfig.filter = null;
    self.auditList = [];
    self.getAudit();
    self.getAuditCount();
  }

  getUserForAudit(audit) {
    const self = this;
    self.commonService.getUserByFilter(audit.user).then((res) => {
      let user = res.find(ele => ele._id === audit.user)
      if (res && user && user.basicDetails && user.basicDetails.name) {
        audit.name = user.basicDetails.name;
      } else {
        audit.name = audit.user;
      }
    }).catch(err => {
      audit.name = audit.user;
      // self.commonService.errorToast(err, 'Unable to find User: ' + audit.user);
    });
  }

  getUserForWFAudit(wfAudit) {
    const self = this;
    self.commonService.getUserByFilter(wfAudit.id).then((res) => {
      let user = res.find(ele => ele._id === wfAudit.user)
      if (res && user && user.basicDetails && user.basicDetails.name) {
        wfAudit.name = user.basicDetails.name;
      } else {
        wfAudit.name = wfAudit.id;
      }
    }).catch(err => {
      wfAudit.name = wfAudit.user;
      // self.commonService.errorToast(err, 'Unable to find User: ' + wfAudit.id);
    });
  }

  showDifference(auditData: any) {
    const self = this;
    self.selectedAudit.emit(auditData);
    self.compare.emit(auditData);
    self.close();
  }

  close() {
    const self = this;
    self.toggle = false;
    self.toggleChange.emit(false);
  }

  getVColor() {
    const clrArray = ['#44A8F1', '#4DC1BC', '#EB996E', '#2AD4AC'];
    return _.sample(clrArray)
  }
}
