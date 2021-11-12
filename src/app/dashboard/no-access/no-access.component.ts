import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { CommonService } from 'src/app/service/common.service';

@Component({
  selector: 'odp-no-access',
  templateUrl: './no-access.component.html',
  styleUrls: ['./no-access.component.scss']
})
export class NoAccessComponent  implements OnInit {
  routeState: any;

  constructor(private commonService: CommonService, private router: Router) {
    this.routeState = this.router.getCurrentNavigation()?.extras?.state;
    if(!!this.routeState?.serviceId) {
      sessionStorage.setItem('serviceToRedirect', this.routeState.serviceId);
    }
  }

  ngOnInit() {
    if(!this.routeState?.noRedirect) {
      this.router.navigateByUrl('/').then(
        () => {
          const serviceId = sessionStorage.getItem('serviceToRedirect');
          sessionStorage.removeItem('serviceToRedirect');
          if(!!serviceId) {
            setTimeout(() => {
              if(this.commonService.hasPermissionOld(serviceId)) {
                this.router.navigate(['/', this.commonService.app._id, 'services', serviceId, 'list']);
              }
            }, 2000);
          }
        }
      )
    }
  }

}
