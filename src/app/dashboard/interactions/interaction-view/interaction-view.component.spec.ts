import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionViewComponent } from './interaction-view.component';

describe('InteractionViewComponent', () => {
  let component: InteractionViewComponent;
  let fixture: ComponentFixture<InteractionViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
