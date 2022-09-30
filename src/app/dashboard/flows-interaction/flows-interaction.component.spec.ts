import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FlowsInteractionComponent } from './flows-interaction.component';

describe('FlowsInteractionComponent', () => {
  let component: FlowsInteractionComponent;
  let fixture: ComponentFixture<FlowsInteractionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ FlowsInteractionComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FlowsInteractionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
