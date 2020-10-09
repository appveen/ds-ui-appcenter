import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRelationComponent } from './view-relation.component';

describe('ViewRelationComponent', () => {
  let component: ViewRelationComponent;
  let fixture: ComponentFixture<ViewRelationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewRelationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRelationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
