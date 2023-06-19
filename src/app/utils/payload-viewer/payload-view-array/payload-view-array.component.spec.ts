import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadViewArrayComponent } from './payload-view-array.component';

describe('PayloadViewArrayComponent', () => {
  let component: PayloadViewArrayComponent;
  let fixture: ComponentFixture<PayloadViewArrayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadViewArrayComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadViewArrayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
