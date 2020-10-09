import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewCollectionOfObjectsGridComponent } from './view-collection-of-objects-grid.component';

describe('ViewCollectionOfObjectsGridComponent', () => {
  let component: ViewCollectionOfObjectsGridComponent;
  let fixture: ComponentFixture<ViewCollectionOfObjectsGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewCollectionOfObjectsGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewCollectionOfObjectsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
