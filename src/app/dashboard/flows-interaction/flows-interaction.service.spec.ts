import { TestBed } from '@angular/core/testing';

import { FlowsInteractionService } from './flows-interaction.service';

describe('FlowsInteractionService', () => {
  let service: FlowsInteractionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FlowsInteractionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
