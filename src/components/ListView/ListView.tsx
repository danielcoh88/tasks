import { useState } from 'react';
import { format, isPast, isToday } from 'date-fns';
import {
  ChevronDown, ChevronRight, Plus, Paperclip,
  AlertCircle, Trash2, Edit2, ArrowRight,
} from 'lucide-react';
import type { Task, TaskStatus } from '../../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types';
import { useTaskStore } from '../../store/taskStore';

interface ListViewProps {
  onTaskClick: (task: Task) => void;
  onAddTask: (status?: TaskStatus) => void;
}

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked'];

export default function ListView({ onTaskClick, onAddTask }: ListViewProps) {
  const { getFilteredTasks, deleteTask } = useTaskStore();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const tasks = getFilteredTasks();

  const toggleCollapsed = (status: string) => {
    setCollapsed((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  return (
    <div style={{ padding: '24px', overflowY: 'auto', height: '100%' }}>
      {STATUSES.map((status) => {
        const cfg = STATUS_CONFIG[status];
        const statusTasks = tasks.filter((t) => t.status === status);
        const isCollapsed = collapsed[status];

        return (
          <div key={status} style={{ marginBottom: 20 }}>
            {/* Group header */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: cfg.bg,
                borderRadius: isCollapsed ? 10 : '10px 10px 0 0',
                border: `1px solid ${cfg.color}30`,
                borderBottom: isCollapsed ? undefined : `2px solid ${cfg.color}`,
                cursor: 'pointer',
              }}
              onClick={() => toggleCollapsed(status)}
            >
              {isCollapsed ? <ChevronRight size={14} style={{ color: cfg.color }} /> : <ChevronDown size={14} style={{ color: cfg.color }} />}
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
              <span style={{ fontWeight: 700, fontSize: 12, color: cfg.color, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {cfg.label}
              </span>
              <span style={{
                background: `${cfg.color}25`, color: cfg.color,
                fontSize: 11, fontWeight: 700,
                padding: '1px 7px', borderRadius: 10,
              }}>
                {statusTasks.length}
              </span>
              <div style={{ flex: 1 }} />
              <button
                onClick={(e) => { e.stopPropagation(); onAddTask(status); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none',
                  color: cfg.color, cursor: 'pointer',
                  fontSize: 12, padding: '2px 6px', borderRadius: 4,
                }}
              >
                <Plus size={13} /> Add
              </button>
            </div>

            {/* Tasks table */}
            {!isCollapsed && (
              <div style={{
                border: `1px solid #1e1e26`,
                borderTop: 'none',
                borderRadius: '0 0 10px 10px',
                overflow: 'hidden',
              }}>
                {/* Table header */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 100px 140px 100px 80px 60px',
                  padding: '8px 14px',
                  background: '#141418',
                  borderBottom: '1px solid #1e1e26',
                  fontSize: 11, fontWeight: 700, color: '#475569',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}>
                  <span>Title</span>
                  <span>Priority</span>
                  <span>Dates</span>
                  <span>Tags</span>
                  <span>Progress</span>
                  <span></span>
                </div>

                {statusTasks.length === 0 ? (
                  <div
                    style={{
                      padding: '20px', textAlign: 'center', color: '#475569',
                      fontSize: 13, cursor: 'pointer',
                      background: '#0f0f10',
                    }}
                    onClick={() => onAddTask(status)}
                  >
                    + Add a task to {cfg.label}
                  </div>
                ) : (
                  statusTasks.map((task, idx) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      isLast={idx === statusTasks.length - 1}
                      onClick={() => onTaskClick(task)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({ task, isLast, onClick, onDelete }: {
  task: Task;
  isLast: boolean;
  onClick: () => void;
  onDelete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const startDateObj = task.startDate ? new Date(task.startDate) : null;
  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj ? isPast(dueDateObj) && task.status !== 'done' : false;
  const isDueToday = dueDateObj ? isToday(dueDateObj) : false;
  const isRange = startDateObj && dueDateObj && format(startDateObj, 'yyyy-MM-dd') !== format(dueDateObj, 'yyyy-MM-dd');
  const checkedItems = task.checklist.filter((c) => c.checked).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 100px 140px 100px 80px 60px',
        padding: '10px 14px',
        background: hovered ? '#1a1a22' : '#0f0f10',
        borderBottom: isLast ? 'none' : '1px solid #1a1a22',
        cursor: 'pointer',
        transition: 'background 0.1s',
        alignItems: 'center',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 3, height: 20, borderRadius: 2,
          background: priorityCfg.color, flexShrink: 0,
          display: 'inline-block',
        }} />
        <span style={{
          fontSize: 13, fontWeight: 500,
          color: task.status === 'done' ? '#475569' : '#e2e8f0',
          textDecoration: task.status === 'done' ? 'line-through' : undefined,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>
        {task.attachments.length > 0 && (
          <Paperclip size={11} style={{ color: '#475569', flexShrink: 0 }} />
        )}
      </div>

      {/* Priority */}
      <span style={{ fontSize: 12, color: priorityCfg.color, fontWeight: 600 }}>
        {priorityCfg.icon} {priorityCfg.label}
      </span>

      {/* Dates */}
      <span style={{
        display: 'flex', alignItems: 'center', gap: 3,
        fontSize: 12,
        color: isOverdue ? '#f87171' : isDueToday ? '#f59e0b' : '#64748b',
      }}>
        {isRange ? (
          <>
            {isOverdue && <AlertCircle size={11} />}
            {format(startDateObj!, 'MMM d')}
            <ArrowRight size={10} />
            {format(dueDateObj!, 'MMM d')}
          </>
        ) : dueDateObj ? (
          <>
            {isOverdue && <AlertCircle size={11} />}
            {format(dueDateObj, 'MMM d')}
          </>
        ) : startDateObj ? (
          format(startDateObj, 'MMM d')
        ) : (
          <span style={{ color: '#2d2d35' }}>—</span>
        )}
      </span>

      {/* Tags */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {task.tags.slice(0, 2).map((tag) => (
          <span key={tag} style={{
            fontSize: 10, background: 'rgba(79,70,229,0.15)',
            color: '#818cf8', padding: '1px 5px', borderRadius: 4,
          }}>
            #{tag}
          </span>
        ))}
        {task.tags.length > 2 && <span style={{ fontSize: 10, color: '#475569' }}>+{task.tags.length - 2}</span>}
      </div>

      {/* Checklist progress */}
      {task.checklist.length > 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{
            flex: 1, height: 4, background: '#1e1e26', borderRadius: 2, overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(checkedItems / task.checklist.length) * 100}%`,
              background: checkedItems === task.checklist.length ? '#34d399' : '#4f46e5',
              borderRadius: 2, transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 10, color: '#475569', whiteSpace: 'nowrap' }}>
            {checkedItems}/{task.checklist.length}
          </span>
        </div>
      ) : (
        <span style={{ color: '#2d2d35', fontSize: 12 }}>—</span>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', opacity: hovered ? 1 : 0, transition: 'opacity 0.1s' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClick(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 3, borderRadius: 4 }}
        >
          <Edit2 size={13} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); if (confirm('Delete this task?')) onDelete(); }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', display: 'flex', padding: 3, borderRadius: 4 }}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
