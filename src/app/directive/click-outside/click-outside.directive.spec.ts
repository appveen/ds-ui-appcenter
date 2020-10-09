import { ClickOutsideDirective } from 'src/app/directive/click-outside/click-outside.directive';

describe('ClickOutsideDirective', () => {
  it('should create an instance', () => {
    const directive = new ClickOutsideDirective(null);
    expect(directive).toBeTruthy();
  });
});
