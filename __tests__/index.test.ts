import { createClient } from '../src/index';

describe('createClient', () => {
  it('should create a client instance', () => {
    expect(() => createClient()).not.toThrow();
  });
});
