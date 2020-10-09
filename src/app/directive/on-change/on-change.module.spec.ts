import { OnChangeModule } from './on-change.module';

describe('OnChangeModule', () => {
  let onChangeModule: OnChangeModule;

  beforeEach(() => {
    onChangeModule = new OnChangeModule();
  });

  it('should create an instance', () => {
    expect(onChangeModule).toBeTruthy();
  });
});
