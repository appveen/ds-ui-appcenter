import { TestBed, async, inject } from '@angular/core/testing';

import { BeforeGuard } from './before.guard';

describe('BeforeGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BeforeGuard]
    });
  });

  it('should ...', inject([BeforeGuard], (guard: BeforeGuard) => {
    expect(guard).toBeTruthy();
  }));
});
