import { TestBed, inject } from '@angular/core/testing';

import { InteractionsService } from './interactions.service';

describe('InteractionsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [InteractionsService]
    });
  });

  it('should be created', inject([InteractionsService], (service: InteractionsService) => {
    expect(service).toBeTruthy();
  }));
});
