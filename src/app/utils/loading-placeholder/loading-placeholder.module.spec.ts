import { LoadingPlaceholderModule } from './loading-placeholder.module';

describe('LoadingPlaceholderModule', () => {
  let loadingPlaceholderModule: LoadingPlaceholderModule;

  beforeEach(() => {
    loadingPlaceholderModule = new LoadingPlaceholderModule();
  });

  it('should create an instance', () => {
    expect(loadingPlaceholderModule).toBeTruthy();
  });
});
