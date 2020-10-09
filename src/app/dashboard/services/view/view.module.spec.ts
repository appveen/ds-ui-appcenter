import { ViewModule } from './view.module';

describe('ViewModule', () => {
  let viewModule: ViewModule;

  beforeEach(() => {
    viewModule = new ViewModule();
  });

  it('should create an instance', () => {
    expect(viewModule).toBeTruthy();
  });
});
