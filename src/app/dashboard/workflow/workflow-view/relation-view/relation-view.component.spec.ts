import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelationViewComponent } from './relation-view.component';

describe('RelationViewComponent', () => {
  let component: RelationViewComponent;
  let fixture: ComponentFixture<RelationViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelationViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
