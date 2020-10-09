import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionsGlobalComponent } from './interactions-global.component';

describe('InteractionsGlobalComponent', () => {
  let component: InteractionsGlobalComponent;
  let fixture: ComponentFixture<InteractionsGlobalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionsGlobalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionsGlobalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
