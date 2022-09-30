import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowsInteractionViewComponent } from './flows-interaction-view.component';

describe('FlowsInteractionViewComponent', () => {
  let component: FlowsInteractionViewComponent;
  let fixture: ComponentFixture<FlowsInteractionViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowsInteractionViewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowsInteractionViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
