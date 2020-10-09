import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCollectionOfObjectsGridComponent } from './edit-collection-of-objects-grid.component';

describe('CollectionOfObjectsGridComponent', () => {
  let component: EditCollectionOfObjectsGridComponent;
  let fixture: ComponentFixture<EditCollectionOfObjectsGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EditCollectionOfObjectsGridComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCollectionOfObjectsGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
