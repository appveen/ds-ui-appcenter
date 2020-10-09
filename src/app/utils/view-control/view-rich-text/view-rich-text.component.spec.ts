import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewRichTextComponent } from './view-rich-text.component';

describe('ViewRichTextComponent', () => {
  let component: ViewRichTextComponent;
  let fixture: ComponentFixture<ViewRichTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewRichTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ViewRichTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
