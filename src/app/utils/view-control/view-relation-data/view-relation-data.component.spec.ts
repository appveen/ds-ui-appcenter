import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRelationDataComponent } from './view-relation-data.component';

describe('ViewRelationDataComponent', () => {
  let component: ViewRelationDataComponent;
  let fixture: ComponentFixture<ViewRelationDataComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewRelationDataComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRelationDataComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
