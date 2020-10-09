import { ViewControlModule } from 'src/app/utils/view-control/view-control.module';

describe('ViewModule', () => {
  let viewControlModule: ViewControlModule;

  beforeEach(() => {
    viewControlModule = new ViewControlModule();
  });

  it('should create an instance', () => {
    expect(viewControlModule).toBeTruthy();
  });
});
