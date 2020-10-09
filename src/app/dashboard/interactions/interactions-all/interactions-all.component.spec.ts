import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionsAllComponent } from './interactions-all.component';

describe('InteractionsAllComponent', () => {
  let component: InteractionsAllComponent;
  let fixture: ComponentFixture<InteractionsAllComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionsAllComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionsAllComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
