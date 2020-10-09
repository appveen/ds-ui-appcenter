import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileTypeComponent } from 'src/app/utils/manage-control/file-type/file-type.component';
import { AppService } from 'src/app/service/app.service';
import { CommonService } from 'src/app/service/common.service';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbTooltipConfig, NgbTooltip, NgbModule } from '@ng-bootstrap/ng-bootstrap';

describe('FileTypeComponent', () => {
  let component: FileTypeComponent;
  let fixture: ComponentFixture<FileTypeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FileTypeComponent],
      providers: [CommonService, AppService],
      imports: [NgbModule, FormsModule,
        ReactiveFormsModule, NgbTooltip]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileTypeComponent);
    component = fixture.componentInstance;
    component.control = new FormControl();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
