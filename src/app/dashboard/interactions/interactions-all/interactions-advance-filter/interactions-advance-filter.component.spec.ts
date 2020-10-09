import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionsAdvanceFilterComponent } from './interactions-advance-filter.component';

describe('InteractionsAdvanceFilterComponent', () => {
  let component: InteractionsAdvanceFilterComponent;
  let fixture: ComponentFixture<InteractionsAdvanceFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionsAdvanceFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionsAdvanceFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
