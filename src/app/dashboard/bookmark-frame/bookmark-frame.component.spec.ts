import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BookmarkFrameComponent } from './bookmark-frame.component';

describe('BookmarkFrameComponent', () => {
  let component: BookmarkFrameComponent;
  let fixture: ComponentFixture<BookmarkFrameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BookmarkFrameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BookmarkFrameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
