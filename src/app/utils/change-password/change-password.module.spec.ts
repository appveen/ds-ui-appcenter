import { ChangePasswordModule } from './change-password.module';

describe('ChangePasswordModule', () => {
  let changePasswordModule: ChangePasswordModule;

  beforeEach(() => {
    changePasswordModule = new ChangePasswordModule();
  });

  it('should create an instance', () => {
    expect(changePasswordModule).toBeTruthy();
  });
});
