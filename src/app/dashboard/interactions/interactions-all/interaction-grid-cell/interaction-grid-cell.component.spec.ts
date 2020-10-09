import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InteractionGridCellComponent } from './interaction-grid-cell.component';

describe('InteractionGridCellComponent', () => {
  let component: InteractionGridCellComponent;
  let fixture: ComponentFixture<InteractionGridCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InteractionGridCellComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InteractionGridCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
