import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  cachedRequests: Array<HttpRequest<any>> = [];

  constructor(private httpHandler: HttpHandler) { }
  
  public collectFailedRequest(request): void {
    this.cachedRequests.push(request);
  }
  public retryFailedRequests(): void {
    this.cachedRequests.forEach(req => {
      this.httpHandler.handle(req);
    });
    this.cachedRequests = [];
  }
}
