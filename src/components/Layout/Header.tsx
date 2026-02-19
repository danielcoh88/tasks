import { Plus, LayoutGrid, List, Calendar, Zap } from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import type { ViewType } from '../../types';
import { STATUS_CONFIG } from '../../types';

interface HeaderProps {
  onAddTask: () => void;
}

const VIEW_ICONS: Record<ViewType, React.ReactNode> = {
  board:       <LayoutGrid size={15} />,
  list:        <List size={15} />,
  calendar:    <Calendar size={15} />,
  automations: <Zap size={15} />,
};

export default function Header({ onAddTask }: HeaderProps) {
  const { activeView, setActiveView, activeListId, lists, getFilteredTasks } = useTaskStore();

  const tasks = getFilteredTasks();
  const statusCounts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = tasks.filter((t) => t.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const activeList = lists.find((l) => l.id === activeListId);
  const title = activeList ? activeList.name : 'All Tasks';

  const viewTabs: { id: ViewType; label: string }[] = [
    { id: 'board',    label: 'Board' },
    { id: 'list',     label: 'List' },
    { id: 'calendar', label: 'Calendar' },
  ];

  return (
    <header style={{
      background: '#141418',
      borderBottom: '1px solid #1e1e26',
      padding: '0 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {activeList && (
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: activeList.color, display: 'inline-block',
            }} />
          )}
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>{title}</h1>
          <span style={{ fontSize: 13, color: '#475569', background: '#1e1e26', padding: '2px 8px', borderRadius: 12 }}>
            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Status summary pills */}
          {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
            const count = statusCounts[status] || 0;
            if (count === 0) return null;
            return (
              <span key={status} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: cfg.bg, color: cfg.color,
                fontSize: 12, fontWeight: 500,
                padding: '3px 10px', borderRadius: 12,
                border: `1px solid ${cfg.color}30`,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
                {count} {cfg.label}
              </span>
            );
          })}

          <button
            className="btn-primary"
            onClick={onAddTask}
            style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8 }}
          >
            <Plus size={15} />
            Add Task
          </button>
        </div>
      </div>

      {/* View tabs */}
      {activeView !== 'automations' && (
        <div style={{ display: 'flex', gap: 2, paddingBottom: 0 }}>
          {viewTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px',
                background: 'none',
                border: 'none',
                borderBottom: activeView === tab.id ? '2px solid #4f46e5' : '2px solid transparent',
                color: activeView === tab.id ? '#818cf8' : '#64748b',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
                marginBottom: -1,
              }}
            >
              {VIEW_ICONS[tab.id]}
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
