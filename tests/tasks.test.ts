import { vi, describe, it, expect } from 'vitest';
vi.mock('../src/lib/db', () => ({ db: {} }));
import { statusInput } from '../src/services/tasks';
describe('Görev girdileri', () => {
  it('geçerli güncellemeyi kabul eder', () =>
    expect(
      statusInput.safeParse({ id: 'task', version: 0, status: 'IN_REVIEW' })
        .success,
    ).toBe(true));
  it.each([
    { id: 'task', version: 0, status: 'PUBLISHED' },
    { id: 'task', version: -1, status: 'TODO' },
    { id: 'task', version: 0, status: 'TODO', organizationId: 'other' },
    { id: '', version: 0, status: 'TODO' },
  ])('geçersiz veya yetki taşıyan veriyi reddeder', (input) =>
    expect(statusInput.safeParse(input).success).toBe(false),
  );
});
