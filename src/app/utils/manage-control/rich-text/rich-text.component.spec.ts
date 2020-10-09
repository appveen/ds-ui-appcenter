import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RichTextComponent } from 'src/app/utils/manage-control/rich-text/rich-text.component';

describe('RichTextComponent', () => {
  let component: RichTextComponent;
  let fixture: ComponentFixture<RichTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RichTextComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RichTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
