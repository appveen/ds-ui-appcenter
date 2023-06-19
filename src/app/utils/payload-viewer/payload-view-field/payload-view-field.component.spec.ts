import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadViewFieldComponent } from './payload-view-field.component';

describe('PayloadViewFieldComponent', () => {
  let component: PayloadViewFieldComponent;
  let fixture: ComponentFixture<PayloadViewFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadViewFieldComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadViewFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
