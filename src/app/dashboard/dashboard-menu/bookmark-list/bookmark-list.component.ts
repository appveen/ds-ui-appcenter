import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AppService } from 'src/app/service/app.service';
import { CommonService, GetOptions } from 'src/app/service/common.service';
import { DashboardService } from '../../dashboard.service';

@Component({
  selector: 'odp-bookmark-list',
  templateUrl: './bookmark-list.component.html',
  styleUrls: ['./bookmark-list.component.scss']
})
export class BookmarkListComponent implements OnInit {

  subscriptions: any;
  showLazyLoader: boolean;
  records: Array<any>;
  activeId: string;
  searchText: string;
  constructor(private appService: AppService,
    private commonService: CommonService,
    private dashboardService: DashboardService,
    private router: Router) {
    this.subscriptions = {};
    this.records = [];
  }

  ngOnInit(): void {
    this.setActiveId(this.router.url);
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.setActiveId(event.url)
    });
    this.getBookMarks();
    this.dashboardService.appChanged.subscribe(app => {
      this.getBookMarks();
    });
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }

  getBookMarks() {
    const path = '/app/' + this.commonService.app._id + '/bookmark';
    const options: GetOptions = {};
    options.count = -1;
    options.select = 'name,app,_id';
    options.sort = 'name';
    if (!this.commonService.userDetails.isSuperAdmin) {
      options.filter = {
        _id: {
          $in: this.commonService.bookmarksWithAccess
        }
      };
    } else {
      options.filter = null;
    }
    if (this.subscriptions.getBookmarkList) {
      this.subscriptions.getBookmarkList.unsubscribe();
    }
    this.showLazyLoader = true;
    this.subscriptions.getBookmarkList = this.commonService.get('user', path, options)
      .subscribe(res => {
        this.records = res;
        this.showLazyLoader = false;
      }, err => {
        console.error(err);
        this.showLazyLoader = false;
      });
  }

  loadBookmark(bookmark: any) {
    this.router.navigate(['/', this.commonService.app._id, 'bookmark', bookmark._id]);
  }
}
