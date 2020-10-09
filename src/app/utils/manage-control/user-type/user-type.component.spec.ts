import { async, ComponentFixture, TestBed, tick, fakeAsync } from '@angular/core/testing';

import { UserTypeComponent } from './user-type.component';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/service/common.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ToastrModule } from 'ngx-toastr';
import { AppService } from 'src/app/service/app.service';
import { of } from 'rxjs';

describe('UserTypeComponent', () => {
  let component: UserTypeComponent;
  let fixture: ComponentFixture<UserTypeComponent>;
  let commonService: CommonService;
  let appService: AppService;;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      providers: [CommonService, AppService],
      declarations: [UserTypeComponent],
      imports: [
        NgbModule,
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        ToastrModule.forRoot({})
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserTypeComponent);
    component = fixture.componentInstance;
    commonService = TestBed.get(CommonService);
    appService = TestBed.get(AppService);
    component.control = new FormControl();
    commonService.app = { _id: 'sowbhagya' };
    component.definition = {
      camelCase: "usr",
      key: "usr",
      level: 0,
      path: "usr",
      properties: {
        dataKey: "usr",
        dataPath: "usr",
        deleteAction: "restrict",
        fieldLength: 0,
        name: "usr",
        relatedSearchField: "_id",
        relatedViewFields: [],
        _typeChanged: "User"
      },
      type: "User",
      value: null
    };
    component.records = [];
    fixture.detectChanges();

  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should get only number of records', () => {
    const user = {
      bot: false,
      isSuperAdmin: true,
      username: "jugnu@appveen.com",
      _id: "USR1389"
    };
    component.control = new FormControl();
    spyOn(commonService, 'get').and.returnValue(of(user))
    spyOn(component, 'getNoOfRecords').and.returnValue(Promise.resolve(1));
    // expect(component.documents.length).toBe(0);

    component.getUserData();
    expect(component.selectedValue).toBe('');
  })

  it('should get user record if value is present in the control', fakeAsync(() => {
    const user = {
      bot: false,
      isSuperAdmin: true,
      username: "jugnu@appveen.com",
      _id: "USR1389"
    };
    component.control = new FormControl({ _id: 'USR1389' });
    spyOn(component, 'getNoOfRecords').and.returnValue(Promise.resolve(1));
    spyOn(commonService, 'get').and.returnValue(of(user))
    component.getUserData();
    tick();
    expect(component.selectedValue).toBe('USR1389');
    expect(component.selectedValue.length).toBeGreaterThan(0);
  }))

  it('should get Number of users present in the app', fakeAsync(() => {
    component.recordsCount = 11;
    spyOn(commonService, 'get').and.returnValue(of(3));
    component.getNoOfRecords();
    tick();
    expect(component.recordsCount).toBe(3);
  }))

  it('should get users', fakeAsync(() => {
    const userList = [,
      {
        username: 'sowbhagya@appveen.com',
        basicDetails: {
          alternateEmail: '',
          name: 'sowbhagya'
        }
      },
      {
        username: 'sowbhagya@appveen.com',
        basicDetails: {
          alternateEmail: '',
          name: 'sowbhagya'
        }
      },
      {
        username: 'jugnu@appveen.com',
        basicDetails: {
          alternateEmail: '',
          name: 'jugnu'
        }
      }]
    component.records = [];
    component.recordsCount = 11;
    spyOn(commonService, 'get').and.returnValue(of(userList));
    tick();
    component.getUserRecords();
    expect(component.records.length).toBe(userList.length);
  }))

  it('shoud get the formatted value', fakeAsync(() => {
    let obj = {
      username: "sushmitha@appveen.com",
      _id: "USR1387"
    }
    spyOn(appService, 'getValue').and.returnValue('sushmitha@appveen.com');
    expect(component.formatter(obj)).toBe('sushmitha@appveen.com')
  }))

  it('should patch value to the control', fakeAsync(() => {
    const obj = {
      item: {
        _id: 'USR1387'
      }
    };
    component.selectItem(obj);
    expect(component.control.value._id).toBe('USR1387');
    expect(component.itemSelected).toBe(false);
  }))

  it('should patch value to the control', fakeAsync(() => {
    component.selectedValue = 'USR1387'
    component.selectOption();
    expect(component.control.value._id).toBe('USR1387');
    expect(component.itemSelected).toBe(false);
  }))




});
