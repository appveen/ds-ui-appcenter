import { InteractionsModule } from './interactions.module';

describe('InteractionsModule', () => {
  let interactionsModule: InteractionsModule;

  beforeEach(() => {
    interactionsModule = new InteractionsModule();
  });

  it('should create an instance', () => {
    expect(interactionsModule).toBeTruthy();
  });
});
