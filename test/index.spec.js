import expect from 'expect';
import { verifyAuth } from '../src';

describe.skip('Verify Auth', () => {
  it('returns a promise', () => {
    expect(verifyAuth({})).toBe(typeof Promise);
  });
});
