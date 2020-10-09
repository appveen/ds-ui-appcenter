import { NoAccessModule } from './no-access.module';

describe('NoAccessModule', () => {
  let noAccessModule: NoAccessModule;

  beforeEach(() => {
    noAccessModule = new NoAccessModule();
  });

  it('should create an instance', () => {
    expect(noAccessModule).toBeTruthy();
  });
});
