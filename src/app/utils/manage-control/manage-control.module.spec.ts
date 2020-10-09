import { ManageControlModule } from 'src/app/utils/manage-control/manage-control.module';

describe('ManageControlModule', () => {
  let manageControlModule: ManageControlModule;

  beforeEach(() => {
    manageControlModule = new ManageControlModule();
  });

  it('should create an instance', () => {
    expect(manageControlModule).toBeTruthy();
  });
});
