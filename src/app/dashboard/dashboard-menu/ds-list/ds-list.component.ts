import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppService } from '../../../service/app.service';
import { CommonService } from '../../../service/common.service';
import { DashboardService } from '../../dashboard.service';
import { Router } from '@angular/router';

@Component({
  selector: 'odp-ds-list',
  templateUrl: './ds-list.component.html',
  styleUrls: ['./ds-list.component.scss']
})
export class DsListComponent implements OnInit {

  constructor(private appService: AppService,
    private commonService: CommonService,
    private dashboardService: DashboardService, private router: Router) { }
  // @Input() dsType: any;
  // @Output() onStarredAction: EventEmitter<any> = new EventEmitter<any>();
  activeId: string;
  ngOnInit(): void {
    this.setActiveId(this.router.url);
  }

  setActiveId(url: string) {
    const segments = url.split('/');
    if (segments.length > 2) {
      this.activeId = segments[3];
    }
  }



  loadDataService(service: any, force?: boolean) {
    this.appService.serviceId = service;
    // this.appService.serviceData = service
    this.dashboardService.selectedService.emit(service);
    this.router.navigate(['/', this.commonService.app._id, 'services', service._id, 'list']);
    // this.router.navigateByUrl(['', this.commonService.app._id, 'services'].join('/')).then(() => {
    //   this.router.navigate(['/', this.commonService.app._id, 'services', service._id, ['list']]);
    // });


    this.appService.loadSelected('ds')
  }


}
