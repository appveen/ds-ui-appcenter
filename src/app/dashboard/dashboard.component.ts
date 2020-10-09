import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { animate, group, keyframes, query, state, style, transition, trigger } from '@angular/animations';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { App } from 'src/app/interfaces/app';
import { Theme, ThemeService } from 'src/app/service/theme.service';
import { OrderByPipe } from '../pipes/order-by.pipe';
import { SessionService } from '../service/session.service';

@Component({
    selector: 'odp-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
    providers: [OrderByPipe],
    animations: [
        trigger('routerTransition', [
            transition('* <=> *', [
                /* order */
                /* 1 */ query(':enter, :leave', style({ position: 'fixed', width: '100%', 'z-index': '-2' })
                , { optional: true }),
                /* 2 */ group([  // block executes in parallel
                    query(':enter', [
                        style({ transform: 'translateX(2%)', opacity: '0' }),
                        animate('0.25s ease-in', style({ transform: 'translateX(0%)', opacity: '1' }))
                    ], { optional: true }),
                    query(':leave', [
                        style({ transform: 'translateX(2%)', opacity: '0' }),
                        animate('0.25s ease-out', style({ transform: 'translateX(-2%)', opacity: '0' }))
                    ], { optional: true }),
                ])
            ])
        ]),
        trigger('userProfile', [
            transition('void=>*', [
                query('.profile-data,.profile-thumbnail', style({ opacity: '0' })),
                style({ height: '0px', position: 'fixed', opacity: '0.5' }),
                group([
                    query('.user-icon', animate('200ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
                        style({ position: 'fixed', top: '11.5px', right: '16px' }),
                        style({ top: '33px', right: '16px' })
                    ]))),
                    animate('200ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
                        style({ height: '40px', opacity: '0.5' }),
                        style({ height: '120px', opacity: '1' }),
                    ])),
                ]),
                query('.profile-data,.profile-thumbnail', style({ opacity: '1' })),
            ]),
            transition('*=>void', [
                group([
                    query('.profile-data,.profile-thumbnail', animate('300ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
                        style({ opacity: '0.3' }),
                        style({ opacity: '0' })
                    ]))),
                    query('.user-icon', animate('300ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
                        style({ position: 'fixed', top: '33px', right: '16px' }),
                        style({ position: 'fixed', top: '11.5px', right: '16px' })
                    ]))),
                    animate('300ms cubic-bezier(0.23, 1, 0.32, 1)', keyframes([
                        style({ height: '60px', border: '0' }),
                        style({ height: '0px' })
                    ]))
                ]),
            ])
        ]),
        trigger('userProfileIcon', [
            state('true', style({ opacity: '0' })),
            state('false', style({ opacity: '1' })),
            transition('true=>false', [
                animate('500ms cubic-bezier(0.23, 1, 0.32, 1)')
            ])
        ])
    ]
})
export class DashboardComponent implements OnInit, OnDestroy {

    username: string;
    name: string;
    showSideNav: boolean;
    selectedId: any;
    selectedName: string;
    permissions: Array<string>;
    title: string;
    showLazyLoader: boolean;
    subscriptions: any;
    version: string;
    selectedApp: App;
    showProfileOptions: boolean;
    showAppOptions: boolean;
    notificationList: Array<any>;
    appName = '';
    toggleChangePassword: boolean;
    appChanged: boolean;
    appCenterStyle: any;
    mainMenu: any;
    searchText: string;
    toggleNotification: boolean;
    fileTransfersList: Array<any>;
    filetransfersApiPath: string;
    prefID: string;
    preferencs: any;
    constructor(
        private appService: AppService,
        public commonService: CommonService,
        public sessionService: SessionService,
        private router: Router,
        private route: ActivatedRoute,
        private ts: ToastrService,
        private ngbToolTipConfig: NgbTooltipConfig,
        private cookieService: CookieService,
        private themeService: ThemeService,
        private orderBy: OrderByPipe,
    ) {
        const self = this;
        self.subscriptions = {};
        self.selectedApp = {};
        self.version = environment.version;
        self.notificationList = [];
        self.showSideNav = true;
        self.permissions = [];
        self.mainMenu = {
            dataService: {
                label: 'Data Services',
                active: false,
                hover: false,
                records: []
            },
            partner: {
                label: 'Interactions',
                active: false,
                hover: false,
                records: []
            },
            bookmark: {
                label: 'Bookmarks',
                active: false,
                hover: false,
                records: []
            },
            workflow: {
                label: 'Work Items',
                active: false,
                hover: false,
                records: []
            }
        };
        self.fileTransfersList = [];
    }

    get activeId() {
        const self = this;
        if (self.activeMenuKey === 'dataService') {
            return self.appService.serviceId;
        } else if (self.activeMenuKey === 'partner') {
            return self.appService.partnerId;
        }
        else if (self.activeMenuKey === 'workflow') {
            return self.appService.workflowId;
        }
    }

    get activeMenu() {
        const self = this;
        let temp;
        Object.keys(self.mainMenu).forEach(key => {
            if (self.mainMenu[key].active) {
                temp = self.mainMenu[key];
            }
        });
        return temp;
    }

    get activeMenuKey() {
        const self = this;
        let temp;
        Object.keys(self.mainMenu).forEach(key => {
            if (self.mainMenu[key].active) {
                temp = key;
            }
        });
        return temp;
    }

    ngOnInit() {
        const self = this;
        self.ngbToolTipConfig.container = 'body';
        self.commonService.apiCalls.componentLoading = false;
        self.username = self.commonService.userDetails.username;
        if (self.commonService.userDetails.basicDetails && self.commonService.userDetails.basicDetails.name) {
            self.name = self.commonService.userDetails.basicDetails.name;
        }
        self.init();
        self.commonService.connectSocket();
        self.commonService.notification.fileExport.subscribe(data => {
            if (data.status === 'Completed') {
                self.ts.success(`Exported ${data.totalRecords} records, your file is ready to download.`);
            }
            self.fetchFileTransfers(self.selectedId);
        });
        self.commonService.notification.fileImport.subscribe(data => {
            if (data.status === 'Validated') {
                self.ts.success(`${data.fileName} is validated and is now ready to be reviewed for import.`);
            } else if (data.status === 'Created') {
                self.ts.success(`${data.fileName} was imported successfully.`);
            }
            self.fetchFileTransfers(self.selectedId);
        });
        self.subscriptions.loadPage = self.appService.loadPage.subscribe(data => {
            if (data === 'services') {
                self.mainMenu.dataService.active = true;
                self.mainMenu.partner.active = false;
                self.mainMenu.workflow.active = false;
                self.mainMenu.bookmark.active = false;
            } else if (data === 'workflow') {
                self.mainMenu.dataService.active = false;
                self.mainMenu.partner.active = false;
                self.mainMenu.workflow.active = true;
                self.mainMenu.bookmark.active = false;
                self.mainMenu.workflow.records = [];
                self.getPendingWorkflows();
            }
        });
        self.subscriptions.serviceChange = self.appService.serviceChange.subscribe(data => {
            self.getPreferences()
            let temp = self.mainMenu.dataService.records.find(e => e._id === data._id);
            self.appService.serviceId = data._id;
            self.selectedId = data._id;
            self.selectedName = data._id;
            self.prefID = null;
            if (!temp) {
                temp = self.mainMenu.dataService.pinnedDs.find(e => e._id === data._id);
            }
            if (temp) {
                self.selectedName = temp.name;
            }
        });
        self.appService.workflowStatus.subscribe(res => {
            if (res) {
                self.getPendingWorkflows();
            }
        });
    }

    ngOnDestroy() {
        const self = this;
        Object.keys(self.subscriptions).forEach(key => {
            if (self.subscriptions[key]) {
                self.subscriptions[key].unsubscribe();
            }
        });
    }

    init() {
        const self = this;
        self.selectedApp = self.commonService.app;
        const segments = self.router.url.split('/');
        if (segments.includes('interactions')) {
            self.mainMenu.partner.active = true;
        } else if (segments.includes('bookmark')) {
            self.mainMenu.bookmark.active = true;
        } else if (segments.includes('workflow')) {
            self.mainMenu.workflow.active = true;
        } else {
            self.mainMenu.dataService.active = true;
        }
        self.mainMenu.dataService.records = [];
        self.mainMenu.dataService.pinnedDs = [];
        self.mainMenu.partner.records = [];
        self.mainMenu.bookmark.records = [];
        self.mainMenu.workflow.records = [];
        self.notificationList = [];
        self.getPreferences();
        self.getPartners();
        self.getBookMarks();
        self.getNotification();
        self.getPendingWorkflows();
        self.loadTheme();
    }

    loadTheme() {
        const self = this;
        const themes = Theme.getDefault();
        if (self.commonService.app.appCenterStyle) {
            self.appCenterStyle = self.commonService.app.appCenterStyle;
            themes.shift();
            themes.shift();
            themes.unshift({
                color: self.themeService.darken(self.commonService.app.appCenterStyle.primaryColor, 10),
                textColor: '#' + self.commonService.app.appCenterStyle.textColor,
                name: 'primary-dark'
            });
            themes.unshift({
                color: '#' + self.commonService.app.appCenterStyle.primaryColor,
                textColor: '#' + self.commonService.app.appCenterStyle.textColor,
                name: 'primary'
            });
        }
        self.themeService.reCompileCSS(themes);
    }

    changeApp(name) {
        const self = this;
        if (self.commonService.app._id === name) {
            return;
        }
        self.appName = '';
        self.showAppOptions = false;
        self.showProfileOptions = false;
        self.commonService.app = self.commonService.appList.find(d => d._id === name);
        self.selectedApp = self.commonService.app;
        self.selectedId = null;
        self.selectedName = null;
        self.appChanged = true;
        self.appService.serviceId = null;
        self.appService.appChange.emit(self.selectedApp);
        self.commonService.saveLastActiveApp();
        self.init();
    }

    getServices() {
        const self = this;
        const filter: any = { status: 'Active', app: self.commonService.app._id };
        if (!self.commonService.userDetails.isSuperAdmin
            && self.commonService.servicesWithAccess.length > 0) {
            filter._id = {
                $in: self.commonService.servicesWithAccess
            };
        }
        const options: GetOptions = {
            count: -1,
            filter,
            select: 'name,app,api',
            sort: 'name'
        };
        self.showLazyLoader = true;
        if (self.subscriptions.getServices) {
            self.subscriptions.getServices.unsubscribe();
        }
        self.subscriptions.getServices = self.commonService.get('sm', '/service', options).subscribe(res => {
            self.showLazyLoader = false;
            if (res.length > 0) {
                res.forEach(item => item.type = 'service');
                self.mainMenu.dataService.records = res;
                self.mainMenu.dataService.pinnedDs = [];
                let unwantedStaredItems = []
                if (self.preferencs && self.preferencs.value) {
                    self.preferencs.value.forEach((element, idx) => {
                        let index = res.findIndex(ele => ele._id === element._id);
                        if (index > -1) {
                            self.mainMenu.dataService.pinnedDs.push(res[index]);
                            res.splice(index, 1)
                        } else {
                            unwantedStaredItems.push(idx)
                        }
                    });
                }
                unwantedStaredItems.reverse();
                unwantedStaredItems.forEach(element => {
                    self.preferencs.value.splice(element, 1)
                });
                if (self.preferencs && self.preferencs.value && self.preferencs.value.length) {
                    self.removeUnwantedStarredItems();
                }
                self.appService.fetchedServiceList = self.mainMenu.dataService.records.concat(self.mainMenu.dataService.pinnedDs);
                if (!self.selectedId && self.mainMenu.dataService.active) {
                    if (self.mainMenu.dataService.pinnedDs.length) {
                        self.selectedId = self.mainMenu.dataService.pinnedDs[0]._id;
                        self.selectedName = self.mainMenu.dataService.pinnedDs[0].name;
                        self.appService.serviceId = self.selectedId;
                    } else {
                        self.selectedId = self.mainMenu.dataService.records[0]._id;
                        self.selectedName = self.mainMenu.dataService.records[0].name;
                        self.appService.serviceId = self.selectedId;
                    }
                    // Object.keys(self.mainMenu).forEach(key => {
                    //     if ('dataService' === key) {
                    //         self.mainMenu[key].active = true;
                    //     } else {
                    //         self.mainMenu[key].active = false;
                    //     }
                    // });
                    if (self.router.url.split('/')[4] !== 'view' &&
                        self.router.url.split('/')[4] !== 'manage' &&
                        self.router.url.split('/')[4] !== 'list' &&
                        self.router.url.split('/')[2] !== 'interactions' &&
                        self.router.url.split('/')[2] !== 'bookmark' &&
                        self.router.url.split('/')[2] !== 'workflow') {
                        self.router.navigate(['~/services', self.selectedId]);
                    }
                }
                self.fetchFileTransfers(self.selectedId);
            } else {
                Object.keys(self.mainMenu).forEach(key => {
                    if ('dataService' === key) {
                        self.mainMenu[key].active = true;
                    } else {
                        self.mainMenu[key].active = false;
                    }
                });
                self.selectedId = null;
                self.selectedName = null;
                self.router.navigate(['~/', 'no-services']);
            }
        }, err => {
            self.showLazyLoader = false;
            if (err.status === 403) {
                Object.keys(self.mainMenu).forEach(key => {
                    if ('dataService' === key) {
                        self.mainMenu[key].active = true;
                    } else {
                        self.mainMenu[key].active = false;
                    }
                });
                self.router.navigate(['/~/no-access']);
            } else {
                self.commonService.errorToast(err, 'Unable to fetch service details, Please try again later');
            }
        });
    }

    getPartners() {
        const self = this;
        const options: GetOptions = {
            count: -1,
            select: 'name,app',
            sort: 'name',
            filter: {
                app: self.commonService.app._id
            }
        };
        self.showLazyLoader = true;
        if (self.subscriptions.getPartners) {
            self.subscriptions.getPartners.unsubscribe();
        }
        self.subscriptions.getPartners = self.commonService.get('pm', '/partner', options).subscribe(res => {
            self.showLazyLoader = false;
            res.forEach(item => item.type = 'partner');
            self.mainMenu.partner.records = res;
            /*if (self.mainMenu.partner.records.length > 0) {
              self.appService.partnerId = self.mainMenu.partner.records[1]._id;
            }*/
        }, err => {
            self.showLazyLoader = false;
        });
    }

    getBookMarks() {
        const self = this;
        const path = '/app/' + self.commonService.app._id + '/bookmark';
        const options: GetOptions = {};
        options.count = -1;
        options.select = 'name,app,_id';
        options.sort = 'name';
        if (!self.commonService.userDetails.isSuperAdmin) {
            options.filter = {
                _id: {
                    $in: self.commonService.bookmarksWithAccess
                }
            };
        } else {
            options.filter = null;
        }
        if (self.subscriptions.getBookmarkList) {
            self.subscriptions.getBookmarkList.unsubscribe();
        }
        self.showLazyLoader = true;
        self.subscriptions.getBookmarkList = self.commonService.get('user', path, options)
            .subscribe(res => {
                res.forEach(item => item.type = 'bookmark');
                self.mainMenu.bookmark.records = res;
                self.showLazyLoader = false;
            }, err => {
                self.showLazyLoader = false;
            });
    }

    resetId(item) {
        const self = this;
        if (item.type === 'bookmark') {
            const params = [];
            if (item.options === 'NEW_TAB') {
                if (item.parameters.username) {
                    params.push(`username=${self.commonService.userDetails.username}`);
                }
                if (item.parameters.appname) {
                    params.push(`appname=${self.commonService.app._id}`);
                }
                if (item.parameters.token) {
                    params.push(`token=${self.sessionService.getToken()}`);
                }
                if (item.parameters.custom.length > 0) {
                    item.parameters.custom.forEach(val => {
                        params.push(`${val.key}=${val.value}`);
                    });
                }
                const anchor: HTMLAnchorElement = document.createElement('a');
                anchor.href = item.url + '?' + params.join('&');
                anchor.target = '_blank';
                document.body.appendChild(anchor);
                anchor.click();
                anchor.remove();
            } else if (item.options === 'FRAME') {
                self.router.navigate([`/~/bookmark/${item._id}`]);
            }
        } else if (item.type === 'service') {
            self.selectedId = item._id;
            self.selectedName = item.name;
            self.title = item.name;
            self.appService.serviceId = item._id;
            self.appService.serviceName = item.name;
            self.appService.serviceChange.emit({ _id: item._id, name: item.name });
            self.router.navigate(['/~', item._id, 'list']);
        }
    }

    logout() {
        const self = this;
        self.cookieService.delete('Authorization');
        self.commonService.logout();
    }

    // errorToast(err: any, message?: string) {
    //     const self = this;
    //     self.commonService.errorToast(err, message);
    // }

    toggleAppOptions() {
        const self = this;
        if (self.commonService.appList.length > 1) {
            self.showAppOptions = !self.showAppOptions;
        }
    }

    getNotification() {
        const self = this;
        const filter = {
            status: {
                $in: ['Pending', 'Rework', 'Draft']
            },
            app: self.commonService.app._id
        };
        const options: GetOptions = {
            filter
        };
        if (self.subscriptions.getNotification) {
            self.subscriptions.getNotification.unsubscribe();
        }
        self.subscriptions.getNotification = self.commonService
            .get('user', '/usr/workflow/?app=' + self.commonService.app._id, options)
            .subscribe(res => {
                if (res && res.length > 0) {
                    if (res.length > 3) {
                        res.splice(3, res.length - 3);
                    }
                    res.forEach(wf => {
                        self.getServiceDetails(wf);
                        self.addRequestedBy(wf.wf).then(data => {
                            let name = data.names.join();
                            if (data.moreUsers > 0) {
                                name += +'+' + data.moreUsers + ' more';
                            }
                            wf.requestedBy = name;
                        }).catch(err => {
                            console.error(err);
                        });
                    });
                    self.notificationList = res;
                    // self.mainMenu.workflow.records = res;
                }
            }, err => {
                self.commonService.errorToast(err, 'Unable to get notifiations, please try again later.');
            });
    }

    getPendingWorkflows() {
        const self = this;
        if (self.subscriptions.getWorkflows) {
            self.subscriptions.getWorkflows.unsubscribe();
        }
        self.subscriptions.getWorkflows = self.commonService
            .get('wf', '/serviceList', {
                filter: {
                    app: self.commonService.app._id,
                    status: 'Pending'
                }
            })
            .subscribe(res => {
                if (res && res.length > 0) {
                    res.forEach(item => item.type = 'workflow');
                    res.forEach((item, i) => {
                        const index = self.mainMenu.workflow.records.findIndex(ele => ele._id === item.serviceId);
                        if (index < 0) {
                            self.mainMenu.workflow.records.push({
                                _id: item.serviceId,
                                pending: false,
                                count: item.count
                            });
                        }
                        else {
                            self.mainMenu.workflow.records[index].count = item.count;
                        }

                    });
                }
                self.mainMenu.workflow.records.forEach(item => self.getServiceDetails(item));
                self.getNotPendingWorkflows();
            }, err => {

            });
    }

    getNotPendingWorkflows() {
        const self = this;
        if (self.subscriptions.getWorkflows) {
            self.subscriptions.getWorkflows.unsubscribe();
        }
        self.subscriptions.getWorkflows = self.commonService
            .get('wf', '/serviceList', {
                filter: {
                    app: self.commonService.app._id,
                    status: { $ne: 'Pending' }
                }
            })
            .subscribe(res => {
                if (res && res.length > 0) {
                    res.forEach(item => item.type = 'workflow');
                    res.forEach((item, i) => {
                        const index = self.mainMenu.workflow.records.findIndex(ele => ele._id === item.serviceId);
                        if (index < 0) {
                            self.mainMenu.workflow.records.push({
                                _id: item.serviceId,
                                pending: false,
                                count: item.count
                            });
                        }

                    });
                }
                self.mainMenu.workflow.records.forEach(item => self.getServiceDetails(item));
            }, err => {

            });
    }

    getServiceDetails(item: any) {
        const self = this;
        if (item.name && item.app && item.status) {
            return;
        }
        if (self.subscriptions['getServiceDetails_' + item._id]) {
            self.subscriptions['getServiceDetails_' + item._id].unsubscribe();
        }
        self.subscriptions['getServiceDetails_' + item._id] = self.commonService
            .get('sm', '/service/' + item._id, { select: 'name, app, status' }).subscribe(res => {
                item.name = res.name;
                item.app = res.app;
                item.status = res.status;
            }, err => {
                // item.name = 'NOT_FOUND';
            });
    }

    addRequestedBy(arr: Array<any>): Promise<{ names: any, moreUsers: any }> {
        const self = this;
        const requestedBy = [];
        let moreUsers = 0;
        let users = [];
        users = arr.map(e => e.requestedBy).filter((v, i, a) => {
            return a.indexOf(v) === i;
        });
        return new Promise((resolve, reject) => {
            if (users.length > 3) {
                moreUsers = users.length - 3;
                users.splice(3, users.length - 3);
            }
            const promises = [];
            users.forEach(e => {
                promises.push(self.getUserDetails(e));
            });
            Promise.all(promises).then(res => {
                resolve({ names: res, moreUsers });
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    }

    getUserDetails(userId: string) {
        const self = this;
        return new Promise((resolve, reject) => {
            self.commonService.getUser(userId).then(res => {
                resolve(res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username);
            }).catch(err => {
                console.error(err);
                reject(err);
            });
            // self.subscriptions['getUserDetails_' + id] = self.commonService
            //     .get('user', '/usr/' + id, { select: 'basicDetails.name username' })
            //     .subscribe(res => {
            //         resolve(res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username);
            //     }, err => {
            //         reject(null);
            //     });
        });
    }

    getWhenCreated(dateStr) {
        const self = this;
        return self.appService.getWhenCreated(dateStr);
    }

    countType(arr: Array<any>, type: string) {
        const self = this;
        return arr.filter(e => e.operation === type).length;
    }

    showWorkflow(id?: string) {
        const self = this;
        self.selectedId = null;
        self.selectedName = null;
        if (id) {
            self.router.navigate(['/~', 'workflow', id]);
        } else {
            self.router.navigate(['/~', 'workflow']);
        }
        self.mainMenu.workflow.records = [];
        self.getPendingWorkflows();
        self.appService.navigateToWorkflow.emit(id);
    }

    hasPermission(method?: string) {
        const self = this;
        return self.appService.hasPermission(self.permissions, method);
    }

    getState(outlet) {
        return outlet.isActivated ? outlet.activatedRoute : '';
    }

    onAppChange(app: App) {
        const self = this;
        self.showProfileOptions = false;
        self.changeApp(app._id);
    }

    toggleMenu(key: string) {
        const self = this;
        if (key === 'dataService') {
            self.selectedId = '';
            self.selectedName = '';
            self.router.navigate(['services'], {
                relativeTo: self.route
            });
        }
        if (key === 'partner') {
            self.selectedId = '';
            self.selectedName = '';
            self.appService.partnerId = null;
            // self.router.navigate([`interactions/${self.mainMenu.partner.records[0]._id}`], {
            self.router.navigate([`/~/interactions/all`], { relativeTo: self.route });
        }
        if (key === 'bookmark') {
            self.selectedId = '';
            self.selectedName = '';
            self.router.navigate(['bookmark'], {
                relativeTo: self.route
            });
        }
        if (key === 'workflow') {
            self.selectedId = '';
            self.selectedName = '';
            self.router.navigate(['workflow'], {
                relativeTo: self.route
            });
            self.showWorkflow();
        }
        Object.keys(self.mainMenu).forEach(key2 => {
            if (key === key2) {
                self.mainMenu[key2].active = true;
            } else {
                self.mainMenu[key2].active = false;
            }
        });
    }

    loadDataService(serviceId: string) {
        const self = this;
        self.appService.serviceId = serviceId;
        self.selectedId = serviceId;
        self.selectedName = serviceId;
        self.appService.serviceChange.emit({ _id: serviceId });
        self.router.navigate(['services', serviceId, 'list'], {
            relativeTo: self.route
        });
        self.fetchFileTransfers(serviceId);
    }

    loadPartnerInteractions(interactionItem?) {
        const self = this;
        if (interactionItem && interactionItem._id) {
            self.appService.partnerId = interactionItem._id;
            self.router.navigate([`/~/interactions/${interactionItem._id}`]);
        } else {
            self.appService.partnerId = null;
            self.router.navigate([`/~/interactions/all`]);
        }
    }

    loadBookmark(serviceId: string) {
        const self = this;
        self.appService.serviceId = serviceId;
        self.selectedId = serviceId;
        self.selectedName = serviceId;
        self.appService.serviceChange.emit({ _id: serviceId });
        self.router.navigate(['bookmark', serviceId], {
            relativeTo: self.route
        });
    }

    loadWorkflow(serviceId: string) {
        const self = this;
        self.appService.serviceId = serviceId;
        self.selectedId = serviceId;
        self.selectedName = serviceId;
        self.appService.workflowId = serviceId;
        self.appService.serviceChange.emit({ _id: serviceId });
        self.router.navigate(['workflow', serviceId], {
            relativeTo: self.route
        });
    }

    fetchFileTransfers(serviceId: string) {
        const self = this;
        let temp = self.activeMenu.records.find(e => e._id === serviceId);
        if (!temp && self.activeMenu.pinnedDs) {
            temp = self.activeMenu.pinnedDs.find(e => e._id === serviceId);
        }
        if (temp) {
            self.filetransfersApiPath = '/' + temp.app + temp.api + '/utils/filetransfers';
            self.commonService.get('api', self.filetransfersApiPath, {
                sort: '-_metadata.lastUpdated',
                filter: {
                    status: {
                        $nin: ['Uploaded', 'SheetSelect']
                    }
                }
            }).subscribe(res => {
                self.fileTransfersList = res;
                self.fileTransfersList.forEach(e => {
                    let url = 'http://localhost/api/c/' + temp.app + temp.api + '/export/download/' + e._id;
                    if (environment.production) {
                        url = window.location.origin + '/api/c/' + temp.app + temp.api + '/export/download/' + e._id;
                    }
                    e.name = temp.name;
                    e.filename = temp.name + '.zip';
                    e.downloadUrl = url;
                });
            }, err => {
                self.fileTransfersList = [];
            });
        }
    }

    deleteFileTransfers(item: any) {
        const self = this;
        item._delete = true;
        self.commonService.delete('api', self.filetransfersApiPath + '/' + item._id, {
            sort: '-_metadata.lastUpdated'
        }).subscribe(res => {
            self.fetchFileTransfers(self.selectedId);
        }, err => {
            self.commonService.errorToast(err, 'Unable to process the request, please try again later');
            item._delete = false;
        });
    }

    downloadFile(item: any) {
        const anchor: HTMLAnchorElement = document.createElement('a');
        anchor.href = item.downloadUrl;
        anchor.target = '_blank';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    navigateToSheetSelect(item: any) {
        const self = this;
        self.appService.fileData = item;
        self.appService.serviceId = self.selectedId;
        if (self.router.url && self.router.url.split('/').pop() === 'filemapper') {
            self.appService.loadFileMapper.emit({
                step: 2
            });
        } else {
            self.router.navigate(['~/services', self.selectedId, 'filemapper']);
        }
    }

    navigateToFileMapper(item: any) {
        const self = this;
        self.appService.mappingData = item;
        self.appService.fileData = item;
        self.appService.resultObj = item;
        self.appService.serviceId = self.selectedId;
        if (self.router.url && self.router.url.split('/').pop() === 'filemapper') {
            self.appService.loadFileMapper.emit({
                step: 3
            });
        } else {
            self.router.navigate(['~/services', self.selectedId, 'filemapper']);
        }
    }

    getTimeInEnglish(timestamp) {
        return moment(timestamp).fromNow();
    }

    canClearNotification(item) {
        if ((item.status === 'Completed'
            || item.status === 'Created'
            || item.status === 'Validated'
            || item.status === 'Error') && !item._delete) {
            return true;
        } else {
            return false;
        }
    }

    isSuccess(item) {
        const self = this;
        if ((item.status === 'Completed' || item.status === 'Created') && !self.isPartialSuccess(item) && !self.isError(item)) {
            return true;
        } else {
            return false;
        }
    }

    isPartialSuccess(item) {
        if ((item.status === 'Completed' || item.status === 'Created') && item.errorCount > 0 && item.createdCount > 0) {
            return true;
        } else {
            return false;
        }
    }

    isError(item) {
        if (item.status === 'Error') {
            return true;
        }
        if (item.conflicts === 0
            && item.duplicate === 0
            && item.valid === 0) {
            return true;
        }
        return false;
    }

    isIntermediate(item) {
        if (item.status === 'Validated' || item.status === 'Uploaded') {
            return true;
        } else {
            return false;
        }
    }

    isPending(item) {
        if (item.status === 'Pending' || item.status === 'Importing' || item.status === 'Validating') {
            return true;
        } else {
            return false;
        }
    }
    addToStaredList(serviceId) {
        const self = this;
        let data = {
            userId: self.commonService.userDetails._id,
            key: self.commonService.app._id,
            type: 'pinned-ds',
            value: JSON.stringify([{ _id: serviceId }])
        }
        let response;
        // self.preferencs.value = JSON.parse(self.preferencs.value);
        if (self.prefID) {
            self.preferencs.value.push({ _id: serviceId });
            self.appService.preferredServiceId = self.preferencs.value[0]._id;
            self.preferencs.value = JSON.stringify(self.preferencs.value);
            response = self.commonService.put('user', '/preferences/' + self.prefID, self.preferencs)
        } else {
            response = self.commonService.post('user', '/preferences', data)

        }
        response.subscribe(res => {

            self.preferencs = res;
            self.prefID = res._id;
            self.preferencs.value = JSON.parse(self.preferencs.value);
            self.appService.preferredServiceId = !!self.preferencs.value && !!self.preferencs.value.length ? self.preferencs.value[0]._id : null;
            self.preferencs.value.forEach(element => {
                let index = self.mainMenu.dataService.records.findIndex(ele => ele._id === element._id);
                if (index > -1) {
                    self.mainMenu.dataService.pinnedDs.unshift(self.mainMenu.dataService.records[index]);
                    self.mainMenu.dataService.records.splice(index, 1)
                }
            });
        }, err => {
            self.commonService.errorToast(err, 'Unable to add dataservice to pinned list');
        });

    }

    removeUnwantedStarredItems() {
        const self = this;
        self.preferencs.value = JSON.stringify(self.preferencs.value);
        if (self.prefID) {
            const respose = self.commonService.put('user', '/preferences/' + self.prefID, self.preferencs);
            respose.subscribe(res => {
                self.preferencs = res;
                self.preferencs.value = JSON.parse(self.preferencs.value);
                self.appService.preferredServiceId = !!self.preferencs.value && !!self.preferencs.value.length ? self.preferencs.value[0]._id : null;
            }, err => {
                self.commonService.errorToast(err, 'Unable to remove dataservice from pinned list');
            })
        }
    }

    removeFromStaredList(serviceId) {
        const self = this;
        if (self.preferencs && self.preferencs.value) {
            const index = self.preferencs.value.findIndex(ele => ele._id === serviceId);
            self.preferencs.value.splice(index, 1);
            self.preferencs.value = JSON.stringify(self.preferencs.value);
            const respose = self.commonService.put('user', '/preferences/' + self.prefID, self.preferencs);
            respose.subscribe(res => {
                self.preferencs = res;
                self.preferencs.value = JSON.parse(self.preferencs.value);
                self.appService.preferredServiceId = !!self.preferencs.value && !!self.preferencs.value.length ? self.preferencs.value[0]._id : null;
                // self.mainMenu.dataService.pinnedDs = [];
                // self.preferencs.value = JSON.parse(self.preferencs.value);
                let index = self.mainMenu.dataService.pinnedDs.findIndex(ele => ele._id === serviceId);
                if (index > -1) {
                    self.mainMenu.dataService.records.push(self.mainMenu.dataService.pinnedDs[index]);
                    self.mainMenu.dataService.records.sort((a, b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
                    self.mainMenu.dataService.pinnedDs.splice(index, 1)
                }

            }, err => {
                self.commonService.errorToast(err, 'Unable to remove dataservice from pinned list');
            })
        }
    }
    getPreferences() {
        const self = this;
        const options: GetOptions = {
            filter: {
                userId: self.commonService.userDetails._id,
                type: 'pinned-ds',
                key: self.commonService.app._id
            }
        };
        self.commonService.get('user', '/preferences', options)
            .subscribe(prefRes => {
                if (prefRes.length) {
                    self.prefID = prefRes[0]._id;
                    self.preferencs = prefRes[0];
                    self.preferencs.value = JSON.parse(self.preferencs.value)
                    self.appService.preferredServiceId = !!self.preferencs.value && !!self.preferencs.value.length ? self.preferencs.value[0]._id : null;
                }
                self.getServices();

            }, err => {
                self.getServices();
                self.commonService.errorToast(err, 'Unable to get starred service details')
            })
    }
    get newNotifications() {
        const self = this;
        if (self.fileTransfersList && self.fileTransfersList.length > 0) {
            return self.fileTransfersList.filter(e => e.status === 'Completed'
                || e.status === 'Validated'
                || e.status === 'Created' || e.status === 'Error').length > 0;
        }
        return false;
    }

    get hasNotifications() {
        const self = this;
        if (self.fileTransfersList && self.fileTransfersList.length > 0) {
            return self.fileTransfersList.filter(e => e.status !== 'Uploaded' && e.status !== 'SheetSelect').length > 0;
        }
        return false;
    }

    get multipleApps() {
        const self = this;
        if (self.commonService.appList && self.commonService.appList.length > 0) {
            return true;
        }
        return false;
    }

    get lastLogin() {
        const self = this;
        return self.commonService.userDetails.lastLogin;
    }

    get authType() {
        const self = this;
        if (self.commonService.userDetails && self.commonService.userDetails.auth) {
            return self.commonService.userDetails.auth.authType;
        }
        return 'local';
    }
}
