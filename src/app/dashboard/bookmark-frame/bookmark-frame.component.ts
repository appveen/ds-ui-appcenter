import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { DomSanitizer } from '@angular/platform-browser';

import { CommonService, GetOptions } from 'src/app/service/common.service';
import * as urlParse from 'url-parse';
import { AppService } from 'src/app/service/app.service';
import { SessionService } from 'src/app/service/session.service';
import { ShortcutService } from 'src/app/shortcut/shortcut.service';

@Component({
  selector: 'odp-bookmark-frame',
  templateUrl: './bookmark-frame.component.html',
  styleUrls: ['./bookmark-frame.component.scss']
})
export class BookmarkFrameComponent implements OnInit, OnDestroy {

  bookMarkId: string;
  bookMarkUrl: any;
  originalUrl: string;
  subscriptions: any;
  showAllBookmarks: boolean;
  bookmarkList: Array<any>;
  apiConfig: GetOptions;
  totalRecords: number;
  searchData: string;
  showLazyLoader: boolean;
  
  get currentAppId() {
    return this.commonService?.getCurrentAppId();
  }
  
  constructor(private route: ActivatedRoute,
    private router: Router,
    private commonService: CommonService,
    private appService: AppService,
    private sessionService: SessionService,
    private sanitizer: DomSanitizer,
    private shortcutsService: ShortcutService) {
    const self = this;
    self.subscriptions = {};
    self.originalUrl = '';
    self.showAllBookmarks = true;
    self.apiConfig = {
      count: 30,
      page: 1
    };
    self.bookmarkList = [];
    self.totalRecords = 0;
  }

  ngOnInit() {
    const self = this;
    self.clearSearch();
    self.route.params.subscribe((param) => {
      if (param.id) {
        self.showAllBookmarks = false;
        self.bookMarkId = param.id;
        self.getBookMark();
      } else {
        self.bookMarkId = null;
        self.showAllBookmarks = true;
      }
    });
    self.appService.appChange.subscribe(data => {
      self.clearSearch();
    });
    this.shortcutsService.unregisterAllShortcuts();
  }
  ngOnDestroy() {
    const self = this;
    Object.keys(self.subscriptions).forEach(e => {
      self.subscriptions[e].unsubscribe();
    });
  }

  getFaviconUrl(item: any) {
    const temp = urlParse(item.url);
    item.faviconUrl = temp.origin + '/favicon.ico';
  }

  getCreatedBy(item: any) {
    const self = this;
    self.commonService.getUser(item.createdBy).then(res => {
      item.createdByName = res.basicDetails && res.basicDetails.name ? res.basicDetails.name : res.username;
    }).catch(err => {
      item.createdByName = 'ERROR';
    });
  }

  getBookMarks() {
    const self = this;
    self.showLazyLoader = true;
    self.subscriptions.getBookMarks = self.commonService.get('user', `/${self.commonService.app._id}/bookmark`, self.apiConfig)
      .subscribe(res => {
        res.forEach(item => {
          self.getFaviconUrl(item);
          self.getCreatedBy(item);
          self.bookmarkList.push(item);
        });
        self.showLazyLoader = false;

      }, err => {
        self.showLazyLoader = false;
        self.commonService.errorToast(err, 'Unable to get bookmark records, Please try again later');
      });
  }

  getBookMarksCount() {
    const self = this;
    self.showLazyLoader = true;

    self.subscriptions.getBookMarksCount = self.commonService
      .get('user', `/${self.commonService.app._id}/bookmark/utils/count`, self.apiConfig)
      .subscribe(res => {
        self.showLazyLoader = false;

        self.totalRecords = res;
      }, err => {
        self.showLazyLoader = false;

        self.commonService.errorToast(err, 'Unable to get bookmark record count, Please try again later');
      });
  }

  getBookMark() {
    const self = this;
    self.showLazyLoader = true;

    self.subscriptions.getBookMark = self.commonService.get('user', `/${self.commonService.app._id}/bookmark/${self.bookMarkId}`)
      .subscribe(res => {
        self.showLazyLoader = false;
        self.originalUrl = self.constructUrl(res);
        self.bookMarkUrl = self.sanitizer.bypassSecurityTrustResourceUrl(self.originalUrl);
      }, (err) => {
        self.showLazyLoader = true;
        self.commonService.errorToast(err, 'Unable to get bookmark record, Please try again later');
      });
  }

  loadMore(event: Event) {
    const self = this;
    const target: HTMLElement = event.target as HTMLElement;
    if (target.clientHeight + target.scrollTop === target.scrollHeight
      && self.totalRecords !== self.bookmarkList.length) {
      self.apiConfig.page += 1;
      self.getBookMarks();
    }
  }

  search(searchTerm: string) {
    const self = this;
    if (searchTerm && searchTerm.trim().length < 3) {
      return;
    }
    if (!self.apiConfig.filter) {
      self.apiConfig.filter = {};
    }
    self.apiConfig.filter = {
      name: '/' + searchTerm + '/'
    };

    self.bookmarkList = [];
    // self.getBookMarksCount();
    self.getBookMarks();
  }

  clearSearch() {
    const self = this;
    self.bookmarkList = [];
    self.apiConfig.page = 1;
    self.apiConfig.sort = 'name';
    // if (!self.commonService.userDetails.isSuperAdmin) {
    //   self.apiConfig.filter = {
    //     _id: {
    //       $in: self.commonService.bookmarksWithAccess
    //     }
    //   };
    // } else {
      self.apiConfig.filter = null;
    // }
    self.getBookMarksCount();
    self.getBookMarks();
  }

  constructUrl(item: any) {
    const self = this;
    const params = [];
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
    return item.url + '?' + params.join('&');
  }

  openBookMark(item: any) {
    const self = this;
    if (item.options !== 'FRAME') {
      self.originalUrl = self.constructUrl(item);
      self.bookMarkUrl = self.sanitizer.bypassSecurityTrustResourceUrl(self.originalUrl);
      self.newTab();
    } else {
      self.router.navigate(['/', this.commonService.app._id,'bookmark', item._id]);
    }
  }

  newTab() {
    const self = this;
    if (self.originalUrl.length > 0) {
      const anchor: HTMLAnchorElement = document.createElement('a');
      anchor.href = self.originalUrl;
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  }

  refresh() {
    const self = this;
    if (self.originalUrl.length > 0) {
      const iFrameElt = document.getElementById('iFrame') as HTMLIFrameElement;
      iFrameElt.src = iFrameElt.src;
    }
  }
}
