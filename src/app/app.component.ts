import { Component, AfterViewInit, OnInit, ChangeDetectorRef, AfterContentChecked, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { CommonService } from 'src/app/service/common.service';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { Router, NavigationStart, NavigationEnd, NavigationCancel } from '@angular/router';

@Component({
  selector: 'odp-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit, AfterContentChecked {

  @ViewChild('sessionTierAlertModal', { static: false }) sessionTierAlertModal: TemplateRef<HTMLElement>;
  sessionExpired: boolean;
  subscriptions: any;
  sessionExpireMsg: string;
  sessionTierAlertModalRef: NgbModalRef;
  navigating: boolean;
  constructor(private titleService: Title,
    public commonService: CommonService,
    private ts: ToastrService,
    private router: Router,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
  ) {
    const self = this;
    self.titleService.setTitle('data.stack: App Center');
    self.subscriptions = {};
  }

  ngOnInit() {
    const self = this;
    self.subscriptions.sessionTimeoutWarning = self.commonService.sessionTimeoutWarning.subscribe(time => {
      if (self.sessionTierAlertModalRef) {
        self.sessionTierAlertModalRef.close(false);
      }
      self.sessionExpireMsg = 'Your session will expire in ' + time + ' min, Click Extend to extend your session';
      self.sessionTierAlertModalRef = self.modalService.open(self.sessionTierAlertModal, { centered: true });
      self.sessionTierAlertModalRef.result.then((close) => { }, dismiss => { });
    });
    self.subscriptions.sessionExpired = self.commonService.sessionExpired.subscribe(() => {
      if (self.sessionTierAlertModalRef) {
        self.sessionTierAlertModalRef.close(false);
      }
      if (!self.commonService.loginComponent) {
        self.sessionExpired = true;
      }
      self.titleService.setTitle('Session Expired! - data.stack: App Center');
    });
    self.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        self.navigating = true;
      } else if (event instanceof NavigationEnd || event instanceof NavigationCancel) {
        self.navigating = false;
      }
    });
  }

  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(e => {
      self.subscriptions[e].unsubscribe();
    });
    if (self.sessionTierAlertModalRef) {
      self.sessionTierAlertModalRef.close();
    }
  }

  extendSession() {
    const self = this;
    self.commonService.apiCalls.extendSession = true;
    self.commonService.extend().then(res => {
      self.commonService.apiCalls.extendSession = false;
      self.ts.success('Session Extended');
      self.sessionTierAlertModalRef.close(true);
    }).catch(err => {
      self.commonService.apiCalls.extendSession = false;
      self.commonService.errorToast(err, 'Unable to extend the session');
    });
  }

  logoutUser() {
    const self = this;
    self.sessionExpired = false;
    self.commonService.clearData();
    self.commonService.logout();
  }

  ngAfterViewInit() {
    document.getElementById('splashScreen').style.display = 'none';
  }

  ngAfterContentChecked() {
    const self = this;
    self.cdr.detectChanges();
  }

  get authType() {
    const self = this;
    if (self.commonService.userDetails && self.commonService.userDetails.auth) {
      return self.commonService.userDetails.auth.authType;
    }
    return null;
  }
}
