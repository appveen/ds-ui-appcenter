import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, ValidatorFn, FormControl } from '@angular/forms';
import { CommonService } from 'src/app/service/common.service';


@Component({
    selector: 'odp-profile',
    templateUrl: './profile.component.html',
    styleUrls: ['./profile.component.scss']
})
export class ProfileComponent  implements OnInit, OnDestroy {
    user: any;
    passwordForm: FormGroup;
    name: string;
    passwordChange: {
        status: boolean;
        loading: boolean;
        message: string;
    };

    permissions: Array<any> = [];

    cp = false;
    cfp = false;
    np = false;
    subscriptions: any = {};
    constructor(private fb: FormBuilder,
        private commonService: CommonService,
        ) {
        this.passwordForm = this.fb.group({
            oldpassword: ['', [Validators.required]],
            newpassword: ['', [Validators.required]],
            confirmpassword: ['', [Validators.required]]
        });
        this.passwordChange = {
            status: false,
            loading: false,
            message: null
        };
    }

    ngOnInit() {
        this.passwordForm.controls.confirmpassword
            .setValidators([Validators.required, matchPassword(this.passwordForm.controls.newpassword)]);
        this.permissions = this._getPermissions(this.user.entitlements);
    }

    ngOnDestroy() {
        const self = this;
        Object.keys(self.subscriptions).forEach(key => {
            if (self.subscriptions[key]) {
                self.subscriptions[key].unsubscribe();
            }
        });
    }

    changePassword(value) {
        this.passwordChange.loading = true;
        this.passwordChange.message = null;
        delete value.confirmpassword;
        this.subscriptions.changePassword = this.commonService
            .put('user', '/auth/change-password/'+this.commonService.userDetails.username, value).subscribe(res => {
                this.passwordChange.loading = false;
                this.passwordChange.status = true;
                this.passwordChange.message = 'Password changed successfully';
                this.passwordForm.reset();
            },
                err => {
                    this.passwordChange.loading = false;
                    this.passwordChange.status = false;
                    if (err.status === 400 || err.status === 401) {
                        this.passwordChange.message = err.error.message;
                    } else {
                        this.passwordChange.message = 'Unable to change password, please try agin later';
                    }
                });
    }

    private _getPermissions(permissions) {
        const temp = [];
        permissions.forEach((ele, i) => {
            temp.push({
                label: i,
                value: permissions[i]
            });
        });
        return temp;
    }

}

export function matchPassword(newPassword: AbstractControl): ValidatorFn {
    return (control: FormControl) => {
        if (!newPassword.value || !control.value) {
            return { match: 'Passwords do not match' };
        }
        if (newPassword.value === control.value) {
            return null;
        } else {
            return { match: 'Passwords do not match' };
        }
    };
}
