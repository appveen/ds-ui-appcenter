import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationTooltipComponent } from './relation-tooltip.component';

describe('RelationTooltipComponent', () => {
  let component: RelationTooltipComponent;
  let fixture: ComponentFixture<RelationTooltipComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelationTooltipComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelationTooltipComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
