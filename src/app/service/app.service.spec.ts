import { TestBed, inject } from '@angular/core/testing';

import { AppService } from 'src/app/service/app.service';

describe('AppService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppService]
    });
  });

  it('should be created', inject([AppService], (service: AppService) => {
    expect(service).toBeTruthy();
  }));

  it('getUniqueItems should return empty array', inject([AppService], (service: AppService) => {
    expect(service.getUniqueItems([])).toEqual([]);
  }));

  it('getUniqueItems should return  array of unique string values', inject([AppService], (service: AppService) => {
    expect(service.getUniqueItems(['USR1380', 'USR1380', 'USR1381'])).toEqual(['USR1380', 'USR1381']);
  }));

  it('getUniqueItems should return  array of unique non string values', inject([AppService], (service: AppService) => {
    expect(service.getUniqueItems([101, 101, 100])).toEqual([101, 100]);
  }));

  




});
