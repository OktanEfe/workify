import { describe, it, expect } from 'vitest';
import { boardLanes, boardState } from '../src/lib/board';
describe('Üç sütunlu iş akışı', () => {
  it('inceleme ve revize işlerini kaybetmeden yapılıyor altında gösterir', () => {
    expect(boardState('BACKLOG')).toBe('TODO');
    expect(boardState('IN_REVIEW')).toBe('IN_PROGRESS');
    expect(boardState('REVISION')).toBe('IN_PROGRESS');
    expect(boardState('COMPLETED')).toBe('COMPLETED');
  });
  it('iptal edilen işi tamamlandı saymaz ve durumları yalnız bir kez gruplar', () => {
    expect(boardState('CANCELLED')).toBeNull();
    const states = boardLanes.flatMap((l) => l.states);
    expect(new Set(states).size).toBe(states.length);
  });
});
