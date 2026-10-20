import type { TaskStatus } from '@prisma/client';
export const boardLanes: {
  status: TaskStatus;
  title: string;
  description: string;
  states: TaskStatus[];
  tone: string;
}[] = [
  {
    status: 'TODO',
    title: 'Yapılacak',
    description: 'Sıradaki işler ve hazırlıklar',
    states: ['BACKLOG', 'TODO'],
    tone: 'planned',
  },
  {
    status: 'IN_PROGRESS',
    title: 'Yapılıyor',
    description: 'Üretim, inceleme ve revizeler',
    states: ['IN_PROGRESS', 'IN_REVIEW', 'REVISION'],
    tone: 'active',
  },
  {
    status: 'COMPLETED',
    title: 'Yapıldı',
    description: 'Tamamlanan ve teslim edilen işler',
    states: ['COMPLETED'],
    tone: 'done',
  },
];
export function boardState(status: TaskStatus) {
  return boardLanes.find((l) => l.states.includes(status))?.status ?? null;
}
