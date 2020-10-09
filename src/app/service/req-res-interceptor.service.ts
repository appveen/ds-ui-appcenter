import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse, HttpErrorResponse } from '@angular/common/http';
import { CommonService } from './common.service';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { SessionService } from './session.service';

@Injectable({
  providedIn: 'root'
})
export class ReqResInterceptorService implements HttpInterceptor {

  constructor(private sessionService: SessionService,
    private commonService: CommonService) { }
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    request = request.clone({
      setHeaders: {
        Authorization: `JWT ${this.sessionService.getToken()}`,
      }
    });
    return next.handle(request)
      .pipe(map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          if (event.status === 401) {
            console.log('Error intercepted');
          }
        }
        return event;
      }))
      .pipe(catchError((error: HttpErrorResponse) => {
        let data = {};
        data = {
          message: error.error && error.error.message ? error.error.message :
            'We are unable to process request, please try again after sometime.',
          status: error.status
        };
        if (error.status === 401 && error.error.message === 'Unauthorized' && !this.sessionService.isUnauthorizedSession) {
          if (this.sessionService.getToken()) {
            this.commonService.sessionExpired.emit();
            // this.auth.collectFailedRequest(request);
          } else {
            this.sessionService.isUnauthorizedSession = true;
            this.commonService.logout();
            setTimeout(() => { window.location.reload(); }, 2000)
          }
        }
        return throwError(error);
      }));
  }
}
