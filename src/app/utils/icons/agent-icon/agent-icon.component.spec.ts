import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AgentIconComponent } from './agent-icon.component';

describe('AgentIconComponent', () => {
  let component: AgentIconComponent;
  let fixture: ComponentFixture<AgentIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AgentIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AgentIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
