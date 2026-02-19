import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, Paperclip, CheckSquare, AlertCircle, GripVertical } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import type { Task } from '../../types';
import { PRIORITY_CONFIG } from '../../types';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
}

export default function TaskCard({ task, onClick }: TaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { type: 'task', task },
  });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  const priorityCfg = PRIORITY_CONFIG[task.priority];
  const checkedItems = task.checklist.filter((c) => c.checked).length;
  const dueDateObj = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDateObj ? isPast(dueDateObj) && task.status !== 'done' : false;
  const isDueToday = dueDateObj ? isToday(dueDateObj) : false;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...sortableStyle,
        background: '#1e1e24',
        border: `1px solid ${isDragging ? '#4f46e5' : '#2d2d35'}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        position: 'relative',
        transition: isDragging ? undefined : 'all 0.15s ease',
      }}
      className="task-card"
      onClick={onClick}
    >
      {/* Priority indicator */}
      <div style={{
        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
        width: 3, height: '60%', borderRadius: '0 2px 2px 0',
        background: priorityCfg.color,
      }} />

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
          color: '#2d2d35', cursor: 'grab', display: 'flex', padding: 2,
          opacity: 0, transition: 'opacity 0.15s',
        }}
        className="drag-handle"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={14} />
      </div>

      {/* Title */}
      <div style={{
        fontWeight: 600,
        fontSize: 14,
        color: task.status === 'done' ? '#475569' : '#e2e8f0',
        textDecoration: task.status === 'done' ? 'line-through' : undefined,
        lineHeight: 1.4,
        marginBottom: 6,
        paddingRight: 20,
      }}>
        {task.title}
      </div>

      {/* Description preview */}
      {task.description && (
        <div style={{
          fontSize: 12, color: '#64748b',
          overflow: 'hidden', textOverflow: 'ellipsis',
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
          marginBottom: 8, lineHeight: 1.5,
        }}>
          {task.description}
        </div>
      )}

      {/* Tags */}
      {task.tags.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
          {task.tags.slice(0, 3).map((tag) => (
            <span key={tag} style={{
              fontSize: 10, fontWeight: 600,
              background: 'rgba(79, 70, 229, 0.15)',
              color: '#818cf8',
              padding: '2px 6px', borderRadius: 4,
              letterSpacing: '0.02em',
            }}>
              #{tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span style={{ fontSize: 10, color: '#475569' }}>+{task.tags.length - 3}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Priority */}
        <span style={{ fontSize: 11, color: priorityCfg.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
          {priorityCfg.icon} {priorityCfg.label}
        </span>

        {/* Due date */}
        {dueDateObj && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 500,
            color: isOverdue ? '#f87171' : isDueToday ? '#f59e0b' : '#64748b',
            background: isOverdue ? 'rgba(248,113,113,0.1)' : isDueToday ? 'rgba(245,158,11,0.1)' : 'transparent',
            padding: isOverdue || isDueToday ? '1px 5px' : undefined,
            borderRadius: 4,
          }}>
            {isOverdue && <AlertCircle size={10} />}
            <Calendar size={10} />
            {format(dueDateObj, 'MMM d')}
          </span>
        )}

        <div style={{ flex: 1 }} />

        {/* Attachments count */}
        {task.attachments.length > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 11, color: '#475569' }}>
            <Paperclip size={11} />
            {task.attachments.length}
          </span>
        )}

        {/* Checklist progress */}
        {task.checklist.length > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11,
            color: checkedItems === task.checklist.length ? '#34d399' : '#64748b',
          }}>
            <CheckSquare size={11} />
            {checkedItems}/{task.checklist.length}
          </span>
        )}
      </div>

      <style>{`
        .task-card:hover .drag-handle { opacity: 1 !important; }
      `}</style>
    </div>
  );
}
