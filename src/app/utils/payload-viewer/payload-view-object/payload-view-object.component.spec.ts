import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayloadViewObjectComponent } from './payload-view-object.component';

describe('PayloadViewObjectComponent', () => {
  let component: PayloadViewObjectComponent;
  let fixture: ComponentFixture<PayloadViewObjectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PayloadViewObjectComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayloadViewObjectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
