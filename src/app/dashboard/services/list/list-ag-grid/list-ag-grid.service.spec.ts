import { TestBed } from '@angular/core/testing';

import { ListAgGridService } from './list-ag-grid.service';

describe('ListAgGridService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ListAgGridService = TestBed.get(ListAgGridService);
    expect(service).toBeTruthy();
  });
});
