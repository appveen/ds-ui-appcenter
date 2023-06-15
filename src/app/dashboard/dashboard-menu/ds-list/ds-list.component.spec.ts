import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DsListComponent } from './ds-list.component';

describe('DsListComponent', () => {
  let component: DsListComponent;
  let fixture: ComponentFixture<DsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DsListComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
