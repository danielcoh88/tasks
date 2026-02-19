import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { STATUS_CONFIG } from '../../types';
import TaskCard from './TaskCard';

interface BoardColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: TaskStatus) => void;
}

export default function BoardColumn({ status, tasks, onTaskClick, onAddTask }: BoardColumnProps) {
  const cfg = STATUS_CONFIG[status];
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div style={{
      minWidth: 290,
      maxWidth: 290,
      display: 'flex',
      flexDirection: 'column',
      gap: 0,
      height: '100%',
    }}>
      {/* Column Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: '10px 10px 0 0',
        background: cfg.bg,
        border: `1px solid ${cfg.color}30`,
        borderBottom: `2px solid ${cfg.color}`,
        marginBottom: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: cfg.dot, display: 'inline-block', flexShrink: 0,
          }} />
          <span style={{ fontWeight: 700, fontSize: 12, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {cfg.label}
          </span>
          <span style={{
            background: `${cfg.color}25`,
            color: cfg.color,
            fontSize: 11, fontWeight: 700,
            width: 20, height: 20,
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddTask(status)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: cfg.color, display: 'flex', padding: 2, borderRadius: 4,
            transition: 'background 0.1s',
          }}
        >
          <Plus size={15} />
        </button>
      </div>

      {/* Tasks */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          padding: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          minHeight: 200,
          borderRadius: '0 0 10px 10px',
          background: isOver ? 'rgba(79, 70, 229, 0.06)' : 'rgba(255,255,255,0.015)',
          border: `1px solid ${isOver ? 'rgba(79, 70, 229, 0.3)' : '#1e1e26'}`,
          borderTop: 'none',
          transition: 'background 0.15s, border-color 0.15s',
          overflowY: 'auto',
        }}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div
            onClick={() => onAddTask(status)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              padding: '30px 20px',
              border: '1.5px dashed #2d2d35',
              borderRadius: 8,
              color: '#475569', fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            <Plus size={18} style={{ opacity: 0.5 }} />
            <span>Add a task</span>
          </div>
        )}
      </div>
    </div>
  );
}
