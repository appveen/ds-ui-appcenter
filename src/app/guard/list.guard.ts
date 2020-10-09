import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../service/common.service';

@Injectable({
  providedIn: 'root'
})
export class ListGuard implements CanActivate {

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
      if (this.commonService.hasPermission(serviceId)) {
        return true;
      } else {
        this.router.navigate([`/~/no-access`]);
        return false;
      }
    }
  }
}
