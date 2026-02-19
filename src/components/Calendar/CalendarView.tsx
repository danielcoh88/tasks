import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isSameDay, isToday, addMonths, subMonths,
  parseISO,
} from 'date-fns';
import {
  DndContext, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';
import type { Task } from '../../types';
import { STATUS_CONFIG } from '../../types';
import { useTaskStore } from '../../store/taskStore';

interface CalendarViewProps {
  onTaskClick: (task: Task) => void;
  onAddTask: (date?: Date) => void;
}

export default function CalendarView({ onTaskClick, onAddTask }: CalendarViewProps) {
  const { getFilteredTasks, updateTask } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasks = getFilteredTasks();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  const getTasksForDay = (date: Date) =>
    tasks.filter((t) => t.dueDate && isSameDay(parseISO(t.dueDate), date));

  const handleDragStart = (event: { active: { id: string | number } }) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const dateStr = over.id as string;

    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      updateTask(taskId, { dueDate: new Date(dateStr + 'T12:00:00').toISOString() });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 24, gap: 16 }}>
        {/* Calendar Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          >
            <ChevronLeft size={16} />
          </button>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0', minWidth: 200, textAlign: 'center' }}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center' }}
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          >
            <ChevronRight size={16} />
          </button>
          <button
            className="btn-ghost"
            style={{ padding: '6px 14px', fontSize: 12 }}
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </button>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 6, fontSize: 12, color: '#64748b', alignItems: 'center' }}>
            <Calendar size={14} />
            Drag tasks to reschedule
          </div>
        </div>

        {/* Calendar Grid */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          background: '#141418', borderRadius: 12,
          border: '1px solid #1e1e26', overflow: 'hidden',
        }}>
          {/* Day names */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: '1px solid #1e1e26',
          }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} style={{
                padding: '10px 12px', textAlign: 'center',
                fontSize: 11, fontWeight: 700, color: '#475569',
                letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Weeks */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {weeks.map((week, wi) => (
              <div key={wi} style={{
                display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
                flex: 1, borderBottom: wi < weeks.length - 1 ? '1px solid #1e1e26' : 'none',
              }}>
                {week.map((day, di) => (
                  <CalendarDay
                    key={di}
                    date={day}
                    tasks={getTasksForDay(day)}
                    isCurrentMonth={isSameMonth(day, currentDate)}
                    isToday={isToday(day)}
                    isLastCol={di === 6}
                    onTaskClick={onTaskClick}
                    onAddTask={onAddTask}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks without due dates */}
        <UnscheduledTasks tasks={tasks.filter((t) => !t.dueDate)} onTaskClick={onTaskClick} />
      </div>

      <DragOverlay>
        {activeTask && (
          <div style={{
            background: '#1e1e24', border: '1px solid #4f46e5',
            borderRadius: 6, padding: '4px 8px',
            fontSize: 12, color: '#e2e8f0', fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            opacity: 0.9, maxWidth: 160,
          }}>
            {activeTask.title}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function CalendarDay({ date, tasks, isCurrentMonth, isToday: today, isLastCol, onTaskClick, onAddTask }: {
  date: Date;
  tasks: Task[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isLastCol: boolean;
  onTaskClick: (task: Task) => void;
  onAddTask: (date?: Date) => void;
}) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const { setNodeRef, isOver } = useDroppable({ id: dateStr });
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '6px 8px',
        minHeight: 80,
        borderRight: isLastCol ? 'none' : '1px solid #1e1e26',
        background: isOver
          ? 'rgba(79, 70, 229, 0.1)'
          : today
          ? 'rgba(79, 70, 229, 0.05)'
          : hovered
          ? 'rgba(255,255,255,0.02)'
          : 'transparent',
        transition: 'background 0.1s',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onAddTask(date)}
    >
      {/* Day number */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <span style={{
          fontSize: 12, fontWeight: today ? 700 : 500,
          color: today ? 'white' : isCurrentMonth ? '#94a3b8' : '#2d2d35',
          background: today ? '#4f46e5' : 'transparent',
          width: 22, height: 22, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {format(date, 'd')}
        </span>
        {hovered && (
          <Plus size={12} style={{ color: '#475569' }} />
        )}
      </div>

      {/* Tasks */}
      {tasks.slice(0, 3).map((task) => (
        <CalendarTaskPill key={task.id} task={task} onClick={onTaskClick} />
      ))}
      {tasks.length > 3 && (
        <div style={{ fontSize: 10, color: '#475569', paddingLeft: 4 }}>
          +{tasks.length - 3} more
        </div>
      )}
    </div>
  );
}

function CalendarTaskPill({ task, onClick }: { task: Task; onClick: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: task.id });
  const cfg = STATUS_CONFIG[task.status];

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '2px 6px',
        borderRadius: 4,
        fontSize: 11, fontWeight: 500,
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.color}30`,
        cursor: 'grab',
        opacity: isDragging ? 0.3 : 1,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
      }}
      onClick={(e) => { e.stopPropagation(); onClick(task); }}
    >
      {task.title}
    </div>
  );
}

function UnscheduledTasks({ tasks, onTaskClick }: { tasks: Task[]; onTaskClick: (t: Task) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (tasks.length === 0) return null;

  return (
    <div style={{
      background: '#141418', borderRadius: 10, border: '1px solid #1e1e26',
      padding: '12px 16px',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: expanded ? 10 : 0 }}
        onClick={() => setExpanded(!expanded)}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Unscheduled
        </span>
        <span style={{ fontSize: 11, color: '#475569', background: '#1e1e26', padding: '1px 7px', borderRadius: 10 }}>
          {tasks.length}
        </span>
        <span style={{ fontSize: 11, color: '#475569' }}>· Drag to a day to schedule</span>
      </div>
      {expanded && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tasks.map((task) => (
            <CalendarTaskPill key={task.id} task={task} onClick={onTaskClick} />
          ))}
        </div>
      )}
    </div>
  );
}
