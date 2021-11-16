import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../service/common.service';

@Injectable({
  providedIn: 'root'
})
export class ViewGuard implements CanActivate {

  constructor(private commonService: CommonService,
    private router: Router) {

  }
  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {
    if (this.commonService.userDetails && this.commonService.userDetails.isSuperAdmin) {
      return true;
    } else {
      const serviceId = state.url.split('/')[3];
      const documentId = state.url.split('/')[5];

      if (this.commonService.hasPermissionOld(serviceId)) {
        return true;
      } else {
        this.router.navigate(['/', this.commonService.app._id, `no-access`], {
          state: {
            noRedirect: true,
            serviceId
          }
        });
        return false;
      }


    }
  }
}
