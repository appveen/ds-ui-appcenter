import { animate, group, keyframes, query, state, style, transition, trigger } from '@angular/animations';
import { NgbTooltipConfig } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, ActivatedRoute } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin, of } from 'rxjs';
import { catchError, filter } from 'rxjs/operators';
import * as moment from 'moment';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import { Theme, ThemeService } from 'src/app/service/theme.service';
import { SessionService } from '../service/session.service';
import { environment } from 'src/environments/environment';
import { AppService } from 'src/app/service/app.service';
import { App } from 'src/app/interfaces/app';
import { DashboardService } from './dashboard.service';

@Component({
    selector: 'odp-dashboard',
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.scss'],
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
    name: string;
    showSideNav: boolean;
    subscriptions: any;
    version: string;
    showProfileOptions: boolean;
    showAppOptions: boolean;
    notificationList: Array<any>;
    toggleChangePassword: boolean;
    toggleNotification: boolean;
    fileTransfersList: Array<any>;
    filetransfersApiPath: string;
    unreadNotificationsCount: number;
    notificationPage: number;
    fetchingFileTransfers: boolean;
    selectedService: any;
    selectedMenuItem: any;
    constructor(
        private appService: AppService,
        private commonService: CommonService,
        private sessionService: SessionService,
        private dashboardService: DashboardService,
        private router: Router,
        private route: ActivatedRoute,
        private ts: ToastrService,
        private ngbToolTipConfig: NgbTooltipConfig,
        private cookieService: CookieService,
        private themeService: ThemeService,
    ) {
        this.subscriptions = {};
        this.version = environment.version;
        this.notificationList = [];
        this.showSideNav = true;
        this.fileTransfersList = [];
        this.selectedService = {};
        this.selectedMenuItem = {};
    }

    ngOnInit() {
        this.ngbToolTipConfig.container = 'body';
        this.commonService.apiCalls.componentLoading = false;
        if (this.commonService.userDetails.basicDetails && this.commonService.userDetails.basicDetails.name) {
            this.name = this.commonService.userDetails.basicDetails.name;
        }
        this.route.params.subscribe(params => {
            if (params.app === '~') {
                if (!this.commonService.app) {
                    this.commonService.app = this.commonService.appList[0];
                }
                this.router.navigate(['/', this.commonService.app._id]);
            }
            this.init();
        });
        this.init();
        this.dashboardService.selectedService.subscribe(service => {
            this.selectedService = service;
            this.fetchFileTransfers(this.selectedService._id);
        });
        this.commonService.connectSocket();
        this.commonService.notification.fileExport.subscribe(data => {
            if (data.status === 'Completed') {
                this.ts.success(`Exported ${data.totalRecords} records, your file is ready to download.`);
            }
            this.fetchFileTransfers(this.selectedService._id);
        });
        this.commonService.notification.fileImport.subscribe(data => {
            if (data.status === 'Validated') {
                this.ts.success(`${data.fileName} is validated and is now ready to be reviewed for import.`);
            } else if (data.status === 'Created') {
                this.ts.success(`${data.fileName} was imported successfully.`);
            }
            this.fetchFileTransfers(this.selectedService._id);
        });
    }

    ngOnDestroy() {
        Object.keys(this.subscriptions).forEach(key => {
            if (this.subscriptions[key]) {
                this.subscriptions[key].unsubscribe();
            }
        });
    }

    init() {
        this.setActiveMenu(this.router.url);
        this.router.events.pipe(
            filter(e => e instanceof NavigationEnd)
        ).subscribe((event: NavigationEnd) => {
            this.setActiveMenu(event.url)
        });
        this.notificationList = [];
        // this.getNotification();
        this.loadTheme();
    }

    setActiveMenu(url: string) {
        if (url.indexOf('services') > -1) {
            this.selectedMenuItem.key = 'services'
            this.selectedMenuItem.label = 'Data Services'
        } else if (url.indexOf('interactions') > -1) {
            this.selectedMenuItem.key = 'interactions'
            this.selectedMenuItem.label = 'Interactions'
        } else if (url.indexOf('bookmark') > -1) {
            this.selectedMenuItem.key = 'bookmark'
            this.selectedMenuItem.label = 'Bookmarks'
        } else if (url.indexOf('workflow') > -1) {
            this.selectedMenuItem.key = 'workflow'
            this.selectedMenuItem.label = 'Workflows'
        } else {
            this.selectedMenuItem.key = 'INVALID';
        }
    }

    loadTheme() {
        const themes = Theme.getDefault();
        if (this.commonService.app.appCenterStyle) {
            themes.shift();
            themes.shift();
            themes.unshift({
                color: this.themeService.darken(this.commonService.app.appCenterStyle.primaryColor, 10),
                textColor: '#' + this.commonService.app.appCenterStyle.textColor,
                name: 'primary-dark'
            });
            themes.unshift({
                color: '#' + this.commonService.app.appCenterStyle.primaryColor,
                textColor: '#' + this.commonService.app.appCenterStyle.textColor,
                name: 'primary'
            });
        }
        this.themeService.reCompileCSS(themes);
    }

    logout() {
        this.cookieService.delete('Authorization');
        this.commonService.logout();
    }
    toggleAppOptions() {
        if (this.commonService.appList.length > 1) {
            this.showAppOptions = !this.showAppOptions;
        }
    }

    getNotification() {
        const filter = {
            status: {
                $in: ['Pending', 'Rework', 'Draft']
            },
            app: this.commonService.app._id
        };
        const options: GetOptions = {
            filter
        };
        if (this.subscriptions.getNotification) {
            this.subscriptions.getNotification.unsubscribe();
        }
        this.subscriptions.getNotification = this.commonService
            .get('user', '/usr/workflow/?app=' + this.commonService.app._id, options)
            .subscribe(res => {
                if (res && res.length > 0) {
                    if (res.length > 3) {
                        res.splice(3, res.length - 3);
                    }
                    res.forEach(wf => {
                        this.addRequestedBy(wf.wf).then(data => {
                            let name = data.names.join();
                            if (data.moreUsers > 0) {
                                name += +'+' + data.moreUsers + ' more';
                            }
                            wf.requestedBy = name;
                        }).catch(err => {
                            console.error(err);
                        });
                    });
                    this.notificationList = res;
                }
            }, err => {
                this.commonService.errorToast(err, 'Unable to get notifiations, please try again later.');
            });
    }

    addRequestedBy(arr: Array<any>): Promise<{ names: any, moreUsers: any }> {
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
                promises.push(this.getUserDetails(e));
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
        return new Promise((resolve, reject) => {
            this.commonService.getUser(userId).then(res => {
                resolve(res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username);
            }).catch(err => {
                console.error(err);
                reject(err);
            });
        });
    }


    getState(outlet) {
        return outlet.isActivated ? outlet.activatedRoute : '';
    }

    onAppChange(app: App) {
        this.showProfileOptions = false;
        if (this.commonService.app._id === app._id) {
            return;
        }
        this.showAppOptions = false;
        this.showProfileOptions = false;
        this.commonService.app = this.commonService.appList.find(d => d._id === app._id);
        // this.appService.serviceId = null;
        // this.appService.appChange.emit(this.selectedApp);
        this.commonService.saveLastActiveApp();
        // this.init();
        const segments = this.router.url.split('/');
        if (segments[2]) {
            this.router.navigate(['/', app._id, segments[2]]);
        } else {
            this.router.navigate(['/', app._id]);
        }
        this.dashboardService.appChanged.emit(app);
    }

    onNotificationScroll(event: Event) {
        if (
            this.fileTransfersList.length < this.unreadNotificationsCount &&
            !this.fetchingFileTransfers
        ) {
            const { scrollTop, scrollHeight, clientHeight } = event.target as any;
            if (scrollTop + clientHeight === scrollHeight) {
                this.notificationPage = (this.notificationPage || 1) + 1;
                // this.fetchFileTransfers(this.selectedService._id);
            }
        }
    }

    fetchFileTransfers(serviceId: string) {
        this.fetchingFileTransfers = true;
        this.filetransfersApiPath =
            '/' + this.selectedService.app + this.selectedService.api + '/utils/fileTransfers';
        if (!!this.subscriptions.fileTransfersListApi) {
            this.subscriptions.fileTransfersListApi.unsubscribe();
        }
        this.subscriptions.fileTransfersListApi = forkJoin([
            this.commonService
                .get('api', this.filetransfersApiPath + '/count', {
                    filter: {
                        status: {
                            $in: [
                                'Completed',
                                'Created',
                                'Pending',
                                'Importing',
                                'Validating',
                                'Validated',
                                'Error',
                            ],
                        },
                        isRead: {
                            $ne: true,
                        },
                    },
                })
                .pipe(catchError(() => of(null))),
            this.commonService
                .get('api', this.filetransfersApiPath, {
                    sort: '-_metadata.lastUpdated',
                    page: 1,
                    count: 10 * (this.notificationPage || 1),
                    filter: {
                        status: {
                            $nin: ['Uploaded', 'SheetSelect'],
                        },
                    },
                })
                .pipe(catchError(() => of(null))),
        ]).subscribe(
            (result) => {
                this.fetchingFileTransfers = false;
                this.unreadNotificationsCount = result[0] || 0;
                const res = result[1] || [];
                this.fileTransfersList = res;
                this.fileTransfersList.forEach((e) => {
                    let url =
                        'http://localhost/api/c/' +
                        this.selectedService.app +
                        this.selectedService.api +
                        '/utils/export/download/' +
                        e._id;
                    if (environment.production) {
                        url =
                            window.location.origin +
                            '/api/c/' +
                            this.selectedService.app +
                            this.selectedService.api +
                            '/utils/export/download/' +
                            e._id;
                    }
                    e.name = this.selectedService.name;
                    e.filename = this.selectedService.name + '.zip';
                    e.downloadUrl = url;
                });
            },
            (err) => {
                this.fetchingFileTransfers = false;
                this.fileTransfersList = [];
            }
        );
    }

    deleteReadFileTransfers() {
        const canDelete = this.fileTransfersList.filter(item => item.isRead && this.canClearNotification(item));
        if (!canDelete.length) return;
        forkJoin(canDelete.map(item => {
            item._delete = true;
            return this.commonService.delete('api', this.filetransfersApiPath + '/' + item._id, {
                sort: '-_metadata.lastUpdated'
            });
        })).subscribe(
            res => {
                this.fetchFileTransfers(this.selectedService._id);
            },
            err => {
                this.commonService.errorToast(err, 'Unable to process the request, please try again later');
                canDelete.forEach(item => {
                    item._delete = false;
                });
            }
        );
        this.toggleNotification = false;
    }

    deleteFileTransfers(item: any) {
        item._delete = true;
        this.commonService.delete('api', this.filetransfersApiPath + '/' + item._id, {
            sort: '-_metadata.lastUpdated'
        }).subscribe(res => {
            this.fetchFileTransfers(this.selectedService._id);
        }, err => {
            this.commonService.errorToast(err, 'Unable to process the request, please try again later');
            item._delete = false;
        });
    }

    downloadFile(item: any) {
        item.isRead = true;
        const anchor: HTMLAnchorElement = document.createElement('a');
        anchor.href = item.downloadUrl;
        anchor.target = '_blank';
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }

    navigateToSheetSelect(item: any) {
        this.appService.fileData = item;
        this.appService.serviceId = this.selectedService._id;
        if (this.router.url && this.router.url.split('/').pop() === 'filemapper') {
            this.appService.loadFileMapper.emit({
                step: 2
            });
        } else {
            this.router.navigate(['/', this.commonService.app._id, 'services', this.selectedService._id, 'filemapper']);
        }
    }

    navigateToFileMapper(item: any) {
        this.appService.mappingData = item;
        this.appService.fileData = item;
        this.appService.resultObj = item;
        this.appService.serviceId = this.selectedService._id;
        if (this.router.url && this.router.url.split('/').pop() === 'filemapper') {
            this.appService.loadFileMapper.emit({
                step: 3
            });
        } else {
            this.router.navigate(['/', this.commonService.app._id, 'services', this.selectedService._id, 'filemapper']);
        }
    }

    markItemAsRead(item) {
        item.isRead = true;
        item._pending = true;
        if (!!this.subscriptions['markRead' + item._id]) {
            this.subscriptions['markRead' + item._id].unsubscribe();
        }
        this.subscriptions['markRead' + item._id] = this.commonService
            .put('api', this.filetransfersApiPath + '/' + item._id + '/readStatus', {
                isRead: true,
            })
            .subscribe((res) => {
                this.fetchFileTransfers(this.selectedService._id);
            });
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
        if ((item.status === 'Completed' || item.status === 'Created') && !this.isPartialSuccess(item) && !this.isError(item)) {
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

    get newNotificationsCount() {
        if (this.fileTransfersList && this.fileTransfersList.length > 0) {
            return this.fileTransfersList
                .filter(
                    e => !e.isRead
                        && (
                            e.status === 'Completed'
                            || e.status === 'Validated'
                            || e.status === 'Created'
                            || e.status === 'Error'
                        )
                ).length;
        }
        return 0;
    }

    get hasNotifications() {
        if (this.fileTransfersList && this.fileTransfersList.length > 0) {
            return this.fileTransfersList.filter(e => e.status !== 'Uploaded' && e.status !== 'SheetSelect').length > 0;
        }
        return false;
    }

    get multipleApps() {
        if (this.commonService.appList && this.commonService.appList.length > 0) {
            return true;
        }
        return false;
    }

    get lastLogin() {
        return this.commonService.userDetails.lastLogin;
    }

    get authType() {
        if (this.commonService.userDetails && this.commonService.userDetails.auth) {
            return this.commonService.userDetails.auth.authType;
        }
        return 'local';
    }

    get selectedApp() {
        return this.commonService.app;
    }

    get enableB2b() {
        return this.commonService.userDetails.b2BEnable;
        // return true;
    }
}
