import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ListFileViewComponent } from './list-file-view.component';

describe('ListFileViewComponent', () => {
  let component: ListFileViewComponent;
  let fixture: ComponentFixture<ListFileViewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ListFileViewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ListFileViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
