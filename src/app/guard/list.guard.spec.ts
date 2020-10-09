import { TestBed, async, inject } from '@angular/core/testing';

import { ListGuard } from './list.guard';

describe('ListGuard', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ListGuard]
    });
  });

  it('should ...', inject([ListGuard], (guard: ListGuard) => {
    expect(guard).toBeTruthy();
  }));
});
