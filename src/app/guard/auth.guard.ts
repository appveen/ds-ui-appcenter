import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable } from 'rxjs';

import { CommonService } from 'src/app/service/common.service';
import { SessionService } from '../service/session.service';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private commonService: CommonService,
        private router: Router,
        private sessionService: SessionService) { }

    canActivate(): Observable<boolean> | Promise<boolean> | boolean {
        return new Promise<boolean>((resolve, reject) => {
            if (this.commonService.userDetails
                && this.commonService.userDetails._id) {
                this.router.navigate(['/', this.commonService.app._id,]);
                reject(false);
            } else {
                if (this.sessionService.getToken()) {
                    this.commonService.isAuthenticated().then(res => {
                        this.commonService.afterAuthentication().then(data => {
                            if (this.commonService.noAccess) {
                                reject(false);
                            } else {
                                this.router.navigate(['/', this.commonService.app._id,]);
                                resolve(true);
                            }
                        }).catch(err => {
                            reject(false);
                        });
                    }).catch(err => {
                        reject(false);
                    });
                } else {
                    resolve(true);
                }
            }
        });
    }
}
