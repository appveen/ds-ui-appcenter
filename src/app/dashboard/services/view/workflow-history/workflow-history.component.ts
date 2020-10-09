import { Component, Input, OnInit } from '@angular/core';
import * as moment from 'moment';

import { AppService } from 'src/app/service/app.service';


@Component({
    selector: 'odp-workflow-history',
    templateUrl: './workflow-history.component.html',
    styleUrls: ['./workflow-history.component.scss']
})
export class WorkflowHistoryComponent implements OnInit {

    @Input() auditList: Array<any>;
    toggleAttachment: any;
    constructor(private appservice: AppService) {
        const self = this;
        self.toggleAttachment = {};
    }

    ngOnInit() {
        const self = this;
    }

    getLastActiveTime(time) {
        const lastLoggedIn = new Date(time);
        return moment(lastLoggedIn).fromNow() === 'a day ago' ? '1 day ago' : moment(lastLoggedIn).fromNow();
    }

    toggleAttachments(key) {
        const self = this;
        const flag = !self.toggleAttachment[key];
        Object.keys(self.toggleAttachment).forEach(e => {
            self.toggleAttachment[e] = false;
        });
        self.toggleAttachment[key] = flag;
    }


    getInitals(element) {
        return element.split(' ').map((e) => e.charAt(0).toUpperCase()).join('');
    }

    getFileType(item) {
        if (item.metadata.filename) {
            const list = item.metadata.filename.split('.');
            return list[list.length - 1];
        } else {
            return '';
        }
    }

    getBGClass(item) {
        const self = this;
        return {
            'bg-info': item.action === 'Draft',
            'bg-primary': item.action === 'Submit' || item.action === 'Save & Submit',
            'bg-success': item.action === 'Approved',
            'bg-warning': item.action === 'Edit',
            'bg-danger': item.action === 'Rejected',
            'bg-secondary': item.action === 'SentForRework'
        };
    }

    getTextClass(item) {
        const self = this;
        return {
            'text-info': item.action === 'Draft',
            'text-primary': item.action === 'Submit' || item.action === 'Save & Submit',
            'text-success': item.action === 'Approved',
            'text-warning': item.action === 'Edit',
            'text-danger': item.action === 'Rejected',
            'text-secondary': item.action === 'SentForRework'
        };
    }
}
