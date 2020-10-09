import { Component, OnInit, Input } from '@angular/core';
import { FlowData, NodeData } from '../interactions.model';
import { AppService } from 'src/app/service/app.service';

@Component({
  selector: 'odp-node-info',
  templateUrl: './node-info.component.html',
  styleUrls: ['./node-info.component.scss']
})
export class NodeInfoComponent implements OnInit {

  @Input() flowData: FlowData;
  @Input() interactionData: any;
  @Input() nodeList: Array<NodeData>;
  @Input() requestNodeList: Array<NodeData>;
  @Input() responseNodeList: Array<NodeData>;
  @Input() node: NodeData;
  @Input() index: number;
  @Input() logData: any;
  passwordCopied: boolean;
  showError: boolean;
  constructor(private appService: AppService) {
    const self = this;
    self.flowData = {};
    self.interactionData = {};
    self.node = {};
    self.logData = {};
    self.nodeList = [];
    self.requestNodeList = [];
    self.responseNodeList = [];
  }

  ngOnInit() {
    const self = this;
    if (!self.node.meta.flowType) {
      self.node.meta.flowType = 'request';
    }
    if (self.logData) {
      self.node.hasLogs = true;
    }
    if (!self.node.hasLogs && self.interactionData.errorMessage) {
      self.node.hasError = true;
    }
    if (self.index > 0) {
      const prevNode = self.nodeList[self.index - 1];
      if (prevNode.hasError) {
        self.node.hasErrorInPrev = true;
      } else {
        self.node.hasErrorInPrev = false;
      }
    } else if (self.node.meta.flowType === 'response') {
      const prevNode = self.requestNodeList[self.requestNodeList.length - 1];
      if (prevNode.hasError) {
        self.node.hasErrorInPrev = true;
      } else {
        self.node.hasErrorInPrev = false;
      }
    } else if (self.node.meta.flowType === 'error') {
      let prevNode;
      if (self.responseNodeList.length > 0) {
        prevNode = self.responseNodeList[self.responseNodeList.length - 1];
      } else {
        prevNode = self.requestNodeList[self.requestNodeList.length - 1];
      }
      if (prevNode.hasError) {
        self.node.hasErrorInPrev = true;
      } else {
        self.node.hasErrorInPrev = false;
      }
    }
    if (!self.statusSuccess) {
      self.node.hasError = true;
    }
  }

  copyPassword() {
    const self = this;
    if (self.node.meta.blockType === 'INPUT') {
      self.appService.copyToClipboard(self.interactionData.inputPasswordDecoded);
    } else {
      self.appService.copyToClipboard(self.interactionData.outputPasswordDecoded);
    }
    self.passwordCopied = true;
    setTimeout(() => {
      self.passwordCopied = false;
    }, 3000);
  }


  get startNode() {
    const self = this;
    if ((self.node.meta && self.node.meta.flowType === 'request' && self.node.meta.blockType === 'INPUT')) {
      return true;
    } else {
      return false;
    }
  }

  get endpoint() {
    const self = this;
    if (self.logData) {
      if (self.node.meta && self.node.meta.blockType === 'INPUT' && self.node.meta.sourceType === 'REST') {
        return self.logData.endpoint;
      } else {
        return self.logData.url;
      }
    }
  }

  get statusSuccess() {
    const self = this;
    if (self.logData && self.logData.statusCode) {
      if (typeof self.logData.statusCode === 'string') {
        self.logData.statusCode = parseInt(self.logData.statusCode, 10);
      }
      if ((self.logData.statusCode - 200) < 100) {
        return true;
      } else {
        return false;
      }
    }
    return false;
  }

  get duration() {
    const self = this;
    const unit = ['ms', 'sec', 'min', 'hr'];
    let counter = 0;
    if (self.logData && self.logData.completedTimestamp && self.logData.createTimestamp) {
      const endTime = new Date(self.logData.completedTimestamp).getTime();
      const startTime = new Date(self.logData.createTimestamp).getTime();
      let duration = endTime - startTime;
      if (duration > 1000 && counter === 0) {
        counter++;
        duration = duration / 1000;
      }
      if (duration > 60 && counter === 1) {
        counter++;
        duration = duration / 60;
      }
      if (duration > 60 && counter === 2) {
        counter++;
        duration = duration / 60;
      }
      return `${duration.toFixed(2)} ${unit[counter]}`;
    }
    return null;
  }

  get agentFileHref() {
    const self = this;
    if (self.node.meta.blockType === 'INPUT') {
      return self.interactionData.inputFileHref;
    } else {
      return self.interactionData.outputFileHref;
    }
  }

  get agentFilePassword() {
    const self = this;
    if (self.node.meta.blockType === 'INPUT') {
      return self.interactionData.inputPasswordDecoded;
    } else {
      return self.interactionData.outputPasswordDecoded;
    }
  }

  get location() {
    const self = this;
    if (self.logData && self.logData.metadata && self.logData.metadata.directories) {
      if (Array.isArray(self.logData.metadata.directories)) {
        return self.logData.metadata.directories[0];
      } else {
        return self.logData.metadata.directories;
      }
    }
    return null;
  }

  get showLogMissing() {
    const self = this;
    if (!self.node.hasLogs && !self.node.hasErrorInPrev && self.node.meta.flowType !== 'error'
      && !self.interactionData.errorMessage && !(self.interactionData.status === 'PENDING'
        || self.interactionData.status === 'UNKNOWN' || self.interactionData.status === 'QUEUED')) {
      return true;
    }
    return false;
  }

  get showLogPending() {
    const self = this;
    if (!self.node.hasLogs && (self.interactionData.status === 'PENDING'
      || self.interactionData.status === 'UNKNOWN' || self.interactionData.status === 'QUEUED')) {
      return true;
    }
    return false;
  }

  get showErrorMessage() {
    const self = this;
    if (!self.node.hasLogs && !self.node.hasErrorInPrev && self.interactionData.errorMessage) {
      return true;
    }
    if (!self.node.hasLogs && self.node.meta.flowType === 'error' && self.interactionData.errorMessage) {
      return true;
    }
    return false;
  }

  get showErrorInNode() {
    const self = this;
    let message: string;
    if (self.logData && self.logData.error) {
      message = self.logData.error;
    } else if (self.interactionData.errorMessage) {
      message = self.interactionData.errorMessage;
    }
    if (message && message.indexOf('dial tcp: lookup') > -1) {
      message = 'Unable to reach integration flow pod, Please contact adminstrator';
    }
    if (message && message.indexOf('EOF') > -1) {
      message = 'Request to integration flow was sent, but it timed out';
    }
    return message;
  }

  get showDidNotExecute() {
    const self = this;
    if (self.node.meta.flowType !== 'error' && self.node.hasErrorInPrev
      && self.interactionData.status === 'ERROR') {
      return true;
    }
    return false;
  }

  get showNoNeedToExecute() {
    const self = this;
    if (self.node.meta.flowType === 'error' && self.interactionData.status === 'SUCCESS') {
      return true;
    }
    return false;
  }

  get errorMessage() {
    const self = this;
    let message: string;
    if (self.logData && self.logData.error) {
      message = self.logData.error;
    }
    if (!self.interactionData.errorMessage && self.interactionData.errorStackTrace) {
      self.interactionData.errorMessage = self.interactionData.errorStackTrace;
    }
    if (!message) {
      try {
        message = JSON.parse(self.interactionData.errorMessage).message;
        if (!message) {
          message = self.interactionData.errorMessage;
        }
      } catch (e) {
        console.log('Error Message is not a valid JSON');
        message = self.interactionData.errorMessage;
      }
    }
    if (message && message.indexOf('ESOCKETTIMEDOUT') > -1) {
      message = 'Request Timed Out';
    }
    return message;
  }
}
