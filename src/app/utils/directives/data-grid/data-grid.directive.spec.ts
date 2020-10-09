import { DataGridDirective } from './data-grid.directive';

describe('DataGridDirective', () => {
  it('should create an instance', () => {
    const directive = new DataGridDirective(null, null, null, null);
    expect(directive).toBeTruthy();
  });
});
