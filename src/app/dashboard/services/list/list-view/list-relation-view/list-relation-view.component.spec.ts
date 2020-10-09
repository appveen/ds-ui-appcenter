import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListRelationViewComponent } from './list-relation-view.component';

describe('ListRelationViewComponent', () => {
  let component: ListRelationViewComponent;
  let fixture: ComponentFixture<ListRelationViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListRelationViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListRelationViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
