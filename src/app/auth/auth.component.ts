import { Component, OnInit, OnDestroy, AfterViewInit, AfterContentChecked, ViewChild, TemplateRef, ElementRef } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';

import { CommonService } from 'src/app/service/common.service';
import { environment } from 'src/environments/environment';
import { AppService } from '../service/app.service';
import { NgbModalRef, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { SessionService } from '../service/session.service';
import { ShortcutService } from '../shortcut/shortcut.service';


@Component({
    selector: 'odp-auth',
    templateUrl: './auth.component.html',
    styleUrls: ['./auth.component.scss']
})
export class AuthComponent implements OnInit, AfterViewInit, AfterContentChecked, OnDestroy {

    @ViewChild('clearSessionModal', { static: false }) clearSessionModal: TemplateRef<HTMLElement>;
    @ViewChild('usernameControl', { static: false }) usernameControl: ElementRef;
    form: UntypedFormGroup;
    message: string;
    loader: boolean;
    subscriptions: any;
    version: string;
    redirectLink: string;
    authTypeChecked: boolean;
    rbacUserReloginAction: string;
    clearSessionModalRef: NgbModalRef;
    authType: string;
    azureLoginLoader: boolean;

    constructor(private fb: UntypedFormBuilder,
        private commonService: CommonService,
        private appService: AppService,
        private sessionService: SessionService,
        private router: Router,
        private titleService: Title,
        private modalService: NgbModal,
        private shortcutsService: ShortcutService
    ) {
        const self = this;
        self.subscriptions = {};
        self.form = self.fb.group({
            username: [null, [Validators.required]],
            password: [null, [Validators.required]]
        });
    }

    ngOnInit() {
        const self = this;
        try {
            self.commonService.apiCalls.componentLoading = false;
            self.version = environment.version;
            self.titleService.setTitle('datanimbus.io: App Center');
            self.redirectLink = window.location.protocol + '//' + window.location.hostname + '/author';
            self.appService.setFocus.subscribe(val => {
                if (self.usernameControl && self.usernameControl.nativeElement) {
                    self.usernameControl.nativeElement.focus();
                }
            });
            self.commonService.apiCalls = {};
            if (this.commonService.userDetails && this.commonService.userDetails._id) {
                const appId = this.commonService.getCurrentAppId();
                this.router.navigate([`/${appId}`]);
            } else {
                if (self.sessionService.getToken()) {
                    this.commonService.isAuthenticated().then(res => {
                        this.commonService.afterAuthentication().then(data => {
                            if (this.commonService.noAccess) {
                                // reject(false);
                            } else {
                                const appId = this.commonService.getCurrentAppId();
                                this.router.navigate([`/${appId}`]);
                                // resolve(true);
                            }
                        }, err => {
                            // reject(false);
                        });
                    }, err => {
                        // reject(false);
                    });
                } else {
                    // resolve(true);
                    this.router.navigate(['/']);
                }
            }
        } catch (e) {
            throw e;
        }
        this.shortcutsService.unregisterAllShortcuts();
    }

    ngAfterViewInit() {
        const self = this;
        self.titleService.setTitle('datanimbus.io: App Center');
    }

    ngAfterContentChecked() {
        const self = this;
        self.titleService.setTitle('datanimbus.io: App Center');
    }

    ngOnDestroy() {
        const self = this;
        try {
            self.commonService.loginComponent = false;
            Object.keys(self.subscriptions).forEach(e => {
                self.subscriptions[e].unsubscribe();
            });
            if (self.clearSessionModalRef) {
                self.clearSessionModalRef.close();
            }
        } catch (e) {
            throw e;
        }
    }

    onSubmit(event: Event) {
        try {
            event.preventDefault();
            const self = this;
            const username = self.form.get('username').value;
            if (!username || !username.trim()) {
                return;
            }
            self.message = null;
            self.loader = true;
            self.subscriptions.onSubmit = self.commonService.get('user', '/auth/authType/' + username, { skipAuth: true }).subscribe(res => {
                self.loader = false;
                if (res.bot) {
                    self.message = "Couldn't find your account";
                }
                else {
                    self.authTypeChecked = true;
                    self.appService.fqdn = res.fqdn;
                    self.authType = res.authType;
                    if (res.rbacUserToSingleSession
                        && res.sessionActive) {
                        self.rbacUserReloginAction = res.rbacUserReloginAction;
                        self.activeSessionWarning();
                    }
                    else {
                        this.authType == 'azure' ? this.doAzureLogin() : this.doLogin();
                    }
                }
            },
                err => {
                    self.loader = false;
                    if (err.status === 0 || err.status === 500) {
                        self.message = 'Unable to login';
                    } else {
                        self.message = err.error.message;
                    }
                });
        } catch (e) {
            throw e;
        }
    }

    doLogin() {
        try {
            const self = this;
            self.message = null;
            const username = self.form.get('username').value;
            const password = self.form.get('password').value;
            if (!username || !username.trim() || !password || !password.trim()) {
                return;
            }
            self.loader = true;
            self.commonService[self.authType === 'local' ? 'login' : 'ldapLogin'](self.form.value)
                .then(res => {
                    self.commonService.afterAuthentication().then(data => {
                        self.sessionService.isUnauthorizedSession = false;
                        self.loader = false;
                        if (data.status === 200 && !self.commonService.noAccess) {
                            self.commonService.apiCalls.componentLoading = true;
                            const appId = this.commonService.getCurrentAppId();
                            this.router.navigate([appId]);
                        } else {
                            self.message = 'You don\'t have enough permissions';
                            self.commonService.logout(true);
                        }
                    }, err => {
                        self.loader = false;
                        if (err.status === 0 || err.status === 500) {
                            self.message = 'Unable to login, please try again later.';
                        } else {
                            self.message = err.error.message;
                        }
                    });
                }, err => {
                    self.loader = false;
                    if (err.status === 0 || err.status === 500 || !err.error || !err.error.message) {
                        self.message = 'Unable to login, please try again later.';
                    } else {
                        self.message = err.error.message;
                    }
                });
        } catch (e) {
            throw e;
        }
    }

    doAzureLogin() {
        const self = this;
        self.form.get('password').disable();
        self.azureLoginLoader = true;
        self.commonService.azureLogin().then(async (res) => {
            if (res.status === 200) {
                try {
                    self.commonService.resetUserDetails(res.body);
                    const status = await self.commonService.isAuthenticated();
                    const data = await self.commonService.afterAuthentication();
                    self.azureLoginLoader = false;
                    if (data.status === 200 && !self.commonService.noAccess) {
                        self.commonService.apiCalls.componentLoading = true;
                        const expireDate = new Date(self.sessionService.getUser(true).expiresIn);
                        const appId = this.commonService.getCurrentAppId();
                        this.router.navigate([appId]);
                    } else {
                        self.message = 'You don\'t have enough permissions';
                        self.commonService.logout(true);
                    }
                } catch (e) {
                    console.error(e);
                    throw e;
                }
            } else {
                self.azureLoginLoader = false;
                self.message = res.body.message;
            }
        }).catch(err => {
            self.azureLoginLoader = false;
            if (err.status === 0 || err.status === 500) {
                self.message = 'Unable to login';
            } else {
                self.message = err.error.message;
            }
        });
    }

    activeSessionWarning() {
        const self = this;
        self.clearSessionModalRef = self.modalService.open(self.clearSessionModal, { centered: true });
        self.clearSessionModalRef.result.then(close => {
            if (close) {
                if (self.commonService.connectionDetails) {
                    self.doAzureLogin();
                }
            } else {
                self.authTypeChecked = false;
                self.form.reset();
            }
        }, dismiss => {
            self.authTypeChecked = false;
            self.form.reset();
        });
    }

    emptyUsername() {
        const self = this;
        self.authTypeChecked = false;
        self.form.get('username').patchValue('');
        self.form.get('password').patchValue('');
    }

    get username() {
        const self = this;
        return self.form.get('username').value;
    }

}
