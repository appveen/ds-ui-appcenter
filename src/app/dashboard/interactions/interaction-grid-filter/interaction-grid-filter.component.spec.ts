import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionGridFilterComponent } from './interaction-grid-filter.component';

describe('InteractionGridFilterComponent', () => {
  let component: InteractionGridFilterComponent;
  let fixture: ComponentFixture<InteractionGridFilterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionGridFilterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionGridFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
