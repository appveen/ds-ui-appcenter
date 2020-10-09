import { TestBed, inject } from '@angular/core/testing';

import { ReqResInterceptorService } from './req-res-interceptor.service';

describe('ReqResInterceptorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReqResInterceptorService]
    });
  });

  it('should be created', inject([ReqResInterceptorService], (service: ReqResInterceptorService) => {
    expect(service).toBeTruthy();
  }));
});
