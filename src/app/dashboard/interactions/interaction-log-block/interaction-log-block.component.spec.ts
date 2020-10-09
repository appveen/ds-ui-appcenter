import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionLogBlockComponent } from './interaction-log-block.component';

describe('InteractionLogBlockComponent', () => {
  let component: InteractionLogBlockComponent;
  let fixture: ComponentFixture<InteractionLogBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionLogBlockComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionLogBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
