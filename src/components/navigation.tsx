'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const groups = [
  {
    label: 'GENEL',
    items: [
      ['/workspace', 'Ana ekran', '◫'],
      ['/workspace/todos', 'Yapılacaklarım', '✓', 'admin'],
      ['/workspace/notifications', 'Bildirimler', '◉'],
    ],
  },
  {
    label: 'OPERASYONLAR',
    items: [
      ['/workspace/tasks', 'İş panosu', '▦'],
      ['/workspace/projects', 'Projeler', '▱'],
      ['/workspace/calendar', 'Takvim', '▦'],
      ['/workspace/content', 'İçerik takibi', '▤'],
      ['/workspace/brands', 'Markalar', '◎'],
    ],
  },
  {
    label: 'EKİP & YÖNETİM',
    items: [
      ['/workspace/team', 'Çalışanlar', '♧', 'admin'],
      ['/workspace/activity', 'Aktiviteler', '↗', 'admin'],
    ],
  },
];
export function Navigation({ admin }: { admin: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="app-navigation">
      {groups
        .filter((group) =>
          group.items.some((item) => item[3] !== 'admin' || admin),
        )
        .map((group) => (
          <div className="nav-group" key={group.label}>
            <span>{group.label}</span>
            {group.items
              .filter((item) => item[3] !== 'admin' || admin)
              .map(([href, label, icon]) => (
                <Link
                  key={href}
                  href={href}
                  aria-current={
                    (
                      href === '/workspace'
                        ? pathname === href
                        : pathname.startsWith(href)
                    )
                      ? 'page'
                      : undefined
                  }
                >
                  <i aria-hidden="true">{icon}</i>
                  {label}
                </Link>
              ))}
          </div>
        ))}
    </nav>
  );
}
