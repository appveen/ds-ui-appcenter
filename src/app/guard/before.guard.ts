import { Injectable } from '@angular/core';
import { CanActivate, CanActivateChild } from '@angular/router';
import { Observable } from 'rxjs';
import { CommonService } from '../service/common.service';

@Injectable({
  providedIn: 'root'
})
export class BeforeGuard implements CanActivate, CanActivateChild {

  constructor(private commonService: CommonService) {

  }

  canActivate(): Observable<boolean> | Promise<boolean> | boolean {
    if (this.commonService.userDetails
      && this.commonService.userDetails._id) {
      return true;
    } else {
      return new Promise((resolve, reject) => {
        this.commonService.isAuthenticated().then(res => {
          this.commonService.afterAuthentication().then(data => {
            if (this.commonService.noAccess) {
              this.commonService.logout();
              reject(false);
            } else {
              resolve(true);
            }
          }).catch(err => {
            this.commonService.logout();
            reject(false);
          });
        }).catch(err => {
          this.commonService.logout();
          reject(false);
        });
      });
    }
  }

  canActivateChild(): Observable<boolean> | Promise<boolean> | boolean {
    return this.canActivate();
  }
}
