import { useState, useLayoutEffect, useCallback, useRef } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, isSameMonth, isToday, addMonths, subMonths,
  parseISO, startOfDay, differenceInCalendarDays,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Briefcase, Settings2 } from 'lucide-react';
import type { Task } from '../../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types';
import { useTaskStore } from '../../store/taskStore';

// ─── Types ───────────────────────────────────────────────────────────
interface CalendarViewProps {
  onTaskClick: (task: Task) => void;
  onAddTask: (startDate?: Date, endDate?: Date) => void;
}

interface BarSegment {
  task: Task;
  startCol: number;  // 0-based column in the week
  endCol: number;    // 0-based, inclusive
  isBarStart: boolean; // task actually starts in this week
  isBarEnd: boolean;   // task actually ends in this week
}

type Interaction =
  | null
  | { type: 'select'; startDate: Date; endDate: Date }
  | { type: 'resize'; taskId: string; edge: 'start' | 'end'; currentDate: Date };

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];
const DAY_LABELS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_MIN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Helpers ─────────────────────────────────────────────────────────
function allocateLanes(bars: BarSegment[]): number[] {
  const sorted = bars.map((b, i) => ({ idx: i, start: b.startCol, end: b.endCol }));
  sorted.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
  const lanes: number[] = new Array(bars.length).fill(0);
  const laneEnds: number[] = [];

  for (const { idx, start, end } of sorted) {
    let placed = false;
    for (let lane = 0; lane < laneEnds.length; lane++) {
      if (laneEnds[lane] < start) {
        laneEnds[lane] = end;
        lanes[idx] = lane;
        placed = true;
        break;
      }
    }
    if (!placed) {
      lanes[idx] = laneEnds.length;
      laneEnds.push(end);
    }
  }
  return lanes;
}

function isDateInRange(date: Date, start: Date, end: Date): boolean {
  const d = startOfDay(date);
  const s = start < end ? startOfDay(start) : startOfDay(end);
  const e = start < end ? startOfDay(end) : startOfDay(start);
  return d >= s && d <= e;
}

// ─── Component ───────────────────────────────────────────────────────
export default function CalendarView({ onTaskClick, onAddTask }: CalendarViewProps) {
  const { getFilteredTasks, updateTask, workDays, workDaysOnly, setWorkDays, setWorkDaysOnly } = useTaskStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [interaction, setInteraction] = useState<Interaction>(null);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);

  // Refs for stable access in event handlers (avoids stale closures)
  const interactionRef = useRef<Interaction>(null);
  const tasksRef = useRef<Task[]>([]);
  const onAddTaskRef = useRef(onAddTask);
  const updateTaskRef = useRef(updateTask);
  onAddTaskRef.current = onAddTask;
  updateTaskRef.current = updateTask;

  const tasks = getFilteredTasks();
  tasksRef.current = tasks;
  const visibleDays = workDaysOnly ? [...workDays].sort((a, b) => a - b) : ALL_DAYS;
  const colCount = visibleDays.length;

  // Build calendar weeks
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const fullWeeks: Date[][] = [];
  let d = calStart;
  while (d <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(addDays(d, i));
    }
    fullWeeks.push(week);
    d = addDays(d, 7);
  }
  const weeks = fullWeeks.map((w) => w.filter((day) => visibleDays.includes(day.getDay())));

  // ─── Mouse interaction for drag-select & resize ────────────────────
  // Ref for weeks so the stable findDateFromPoint callback can access current weeks
  const weeksRef = useRef(weeks);
  weeksRef.current = weeks;

  // Compute date from mouse coordinates by finding which week row and column
  const findDateFromPoint = useCallback((x: number, y: number): Date | null => {
    if (!calRef.current) return null;
    const rowEls = calRef.current.querySelectorAll<HTMLElement>('[data-week-idx]');
    for (const rowEl of rowEls) {
      const rect = rowEl.getBoundingClientRect();
      if (y >= rect.top && y < rect.bottom) {
        const wi = parseInt(rowEl.getAttribute('data-week-idx')!);
        const week = weeksRef.current[wi];
        if (!week || week.length === 0) return null;
        const colWidth = rect.width / week.length;
        const colIdx = Math.max(0, Math.min(Math.floor((x - rect.left) / colWidth), week.length - 1));
        return startOfDay(week[colIdx]);
      }
    }
    return null;
  }, []);

  // Register document listeners synchronously when interaction starts
  const isInteracting = interaction !== null;
  useLayoutEffect(() => {
    if (!isInteracting) return;

    const handleMouseMove = (e: MouseEvent) => {
      const inter = interactionRef.current;
      if (!inter) return;
      const date = findDateFromPoint(e.clientX, e.clientY);
      if (!date) return;

      if (inter.type === 'select') {
        const next: Interaction = { ...inter, endDate: date };
        interactionRef.current = next;
        setInteraction(next);
      } else if (inter.type === 'resize') {
        const next: Interaction = { ...inter, currentDate: date };
        interactionRef.current = next;
        setInteraction(next);
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const inter = interactionRef.current;
      if (!inter) return;

      if (inter.type === 'select') {
        const s = inter.startDate <= inter.endDate ? inter.startDate : inter.endDate;
        const en = inter.startDate <= inter.endDate ? inter.endDate : inter.startDate;
        onAddTaskRef.current(s, en);
      } else if (inter.type === 'resize') {
        const currentTasks = tasksRef.current;
        const task = currentTasks.find((t) => t.id === inter.taskId);
        if (task) {
          const date = findDateFromPoint(e.clientX, e.clientY) || inter.currentDate;
          if (inter.edge === 'start') {
            const tEnd = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
            const newStart = tEnd && startOfDay(date) > tEnd ? tEnd : startOfDay(date);
            updateTaskRef.current(task.id, { startDate: newStart.toISOString() });
          } else {
            const tStart = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
            const newEnd = tStart && startOfDay(date) < tStart ? tStart : startOfDay(date);
            updateTaskRef.current(task.id, { dueDate: newEnd.toISOString() });
          }
        }
      }
      interactionRef.current = null;
      setInteraction(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isInteracting, findDateFromPoint]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCellMouseDown = (date: Date, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    // Don't start selection if clicking on a bar
    const target = e.target as HTMLElement;
    if (target.closest('[data-bar]')) return;
    e.preventDefault();
    const inter: Interaction = { type: 'select', startDate: date, endDate: date };
    interactionRef.current = inter;
    setInteraction(inter);
  };

  const handleResizeMouseDown = (taskId: string, edge: 'start' | 'end', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const curDate = edge === 'start'
      ? (task.startDate ? parseISO(task.startDate) : new Date())
      : (task.dueDate ? parseISO(task.dueDate) : new Date());
    const inter: Interaction = { type: 'resize', taskId, edge, currentDate: curDate };
    interactionRef.current = inter;
    setInteraction(inter);
  };

  // Get live task dates (accounting for in-progress resize)
  const getLiveTaskDates = (task: Task): { start: Date | null; end: Date | null } => {
    let start = task.startDate ? startOfDay(parseISO(task.startDate)) : null;
    let end = task.dueDate ? startOfDay(parseISO(task.dueDate)) : null;
    if (interaction?.type === 'resize' && interaction.taskId === task.id) {
      if (interaction.edge === 'start') {
        start = startOfDay(interaction.currentDate);
        if (end && start > end) start = end;
      } else {
        end = startOfDay(interaction.currentDate);
        if (start && end < start) end = start;
      }
    }
    return { start, end };
  };

  // Compute bars for each week, using live dates during resize
  const computeBarsLive = (week: Date[]): BarSegment[] => {
    if (week.length === 0) return [];
    const weekStartD = week[0];
    const weekEndD = week[week.length - 1];
    const bars: BarSegment[] = [];

    for (const task of tasks) {
      if (!task.startDate && !task.dueDate) continue;
      const { start: tStartRaw, end: tEndRaw } = getLiveTaskDates(task);
      const tStart = tStartRaw || tEndRaw;
      const tEnd = tEndRaw || tStartRaw;
      if (!tStart || !tEnd) continue;
      if (tStart > startOfDay(weekEndD) || tEnd < startOfDay(weekStartD)) continue;

      let startCol = 0;
      for (let i = 0; i < week.length; i++) {
        if (startOfDay(week[i]) >= tStart) { startCol = i; break; }
        startCol = i;
      }
      if (startOfDay(week[startCol]) < tStart && startCol < week.length - 1) startCol++;
      if (tStart < startOfDay(week[0])) startCol = 0;

      let endCol = week.length - 1;
      for (let i = week.length - 1; i >= 0; i--) {
        if (startOfDay(week[i]) <= tEnd) { endCol = i; break; }
      }
      if (tEnd > startOfDay(week[week.length - 1])) endCol = week.length - 1;
      if (startCol > endCol) continue;

      bars.push({
        task,
        startCol,
        endCol,
        isBarStart: tStart >= startOfDay(week[0]),
        isBarEnd: tEnd <= startOfDay(week[week.length - 1]),
      });
    }
    return bars;
  };

  const toggleWorkDay = (day: number) => {
    const next = workDays.includes(day) ? workDays.filter((d) => d !== day) : [...workDays, day];
    if (next.length > 0) setWorkDays(next);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 24, gap: 16, userSelect: interaction ? 'none' : undefined }}>
      {/* ─── Calendar Header ──────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <button className="btn-ghost" style={{ padding: '6px 10px', display: 'flex' }} onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft size={16} /></button>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#e2e8f0', minWidth: 200, textAlign: 'center' }}>
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <button className="btn-ghost" style={{ padding: '6px 10px', display: 'flex' }} onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight size={16} /></button>
        <button className="btn-ghost" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => setCurrentDate(new Date())}>Today</button>

        <div style={{ flex: 1 }} />

        {/* Work days toggle */}
        <div style={{ position: 'relative' }}>
          <button
            className={workDaysOnly ? 'btn-primary' : 'btn-ghost'}
            style={{ padding: '6px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setWorkDaysOnly(!workDaysOnly)}
          >
            <Briefcase size={13} />
            Work days
          </button>
        </div>

        {/* Day picker */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn-ghost"
            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
            onClick={() => setShowDayPicker(!showDayPicker)}
          >
            <Settings2 size={13} />
            {workDays.map((d) => DAY_LABELS_MIN[d]).join('')}
          </button>
          {showDayPicker && (
            <div style={{
              position: 'absolute', top: '100%', right: 0, zIndex: 100, marginTop: 4,
              background: '#1e1e24', border: '1px solid #2d2d35', borderRadius: 10,
              padding: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.5)', minWidth: 200,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
                Work Days
              </div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
                {ALL_DAYS.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleWorkDay(day)}
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: workDays.includes(day) ? 'rgba(79,70,229,0.2)' : '#141418',
                      border: `1px solid ${workDays.includes(day) ? '#4f46e5' : '#2d2d35'}`,
                      color: workDays.includes(day) ? '#818cf8' : '#475569',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                  >
                    {DAY_LABELS_MIN[day]}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 11, padding: '4px 8px' }} onClick={() => setWorkDays([0, 1, 2, 3, 4])}>Sun–Thu</button>
                <button className="btn-ghost" style={{ flex: 1, fontSize: 11, padding: '4px 8px' }} onClick={() => setWorkDays([1, 2, 3, 4, 5])}>Mon–Fri</button>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 6, fontSize: 12, color: '#64748b', alignItems: 'center' }}>
          <Calendar size={14} />
          Drag to schedule
        </div>
      </div>

      {/* ─── Calendar Grid ────────────────────────────────── */}
      <div ref={calRef} style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        background: '#141418', borderRadius: 12,
        border: '1px solid #1e1e26', overflow: 'hidden',
      }}>
        {/* Day name headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          borderBottom: '1px solid #1e1e26',
        }}>
          {visibleDays.map((day) => (
            <div key={day} style={{
              padding: '10px 12px', textAlign: 'center',
              fontSize: 11, fontWeight: 700, color: '#475569',
              letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {DAY_LABELS_SHORT[day]}
            </div>
          ))}
        </div>

        {/* Week rows */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {weeks.map((week, wi) => {
            const bars = computeBarsLive(week);
            const lanes = allocateLanes(bars);
            const maxLane = lanes.length > 0 ? Math.max(...lanes) : -1;
            const visibleLanes = Math.min(maxLane + 1, 4);

            return (
              <div key={wi} data-week-idx={wi} style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                borderBottom: wi < weeks.length - 1 ? '1px solid #1e1e26' : 'none',
                minHeight: 80,
              }}>
                {/* Day number row */}
                <div style={{
                  display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                }}>
                  {week.map((day, di) => {
                    const inSelection = interaction?.type === 'select'
                      && isDateInRange(day, interaction.startDate, interaction.endDate);
                    const today = isToday(day);
                    const inMonth = isSameMonth(day, currentDate);

                    return (
                      <div
                        key={di}
                        data-cal-date={format(day, 'yyyy-MM-dd')}
                        style={{
                          padding: '4px 8px',
                          borderRight: di < week.length - 1 ? '1px solid #1e1e26' : 'none',
                          background: inSelection ? 'rgba(79,70,229,0.15)' : today ? 'rgba(79,70,229,0.05)' : 'transparent',
                          cursor: 'crosshair',
                          transition: 'background 0.08s',
                        }}
                        onMouseDown={(e) => handleCellMouseDown(day, e)}
                      >
                        <span style={{
                          fontSize: 12, fontWeight: today ? 700 : 500,
                          color: today ? 'white' : inMonth ? '#94a3b8' : '#2d2d35',
                          background: today ? '#4f46e5' : 'transparent',
                          width: 22, height: 22, borderRadius: '50%',
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {format(day, 'd')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Task bar lanes */}
                {visibleLanes > 0 && (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: 2,
                    padding: '2px 0',
                  }}>
                    {Array.from({ length: visibleLanes }, (_, laneIdx) => {
                      const laneBars = bars
                        .map((bar, bi) => ({ bar, lane: lanes[bi] }))
                        .filter((b) => b.lane === laneIdx);

                      return (
                        <div key={laneIdx} style={{
                          display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                          height: 22,
                        }}>
                          {laneBars.map(({ bar }) => {
                            const cfg = STATUS_CONFIG[bar.task.status];
                            const priCfg = PRIORITY_CONFIG[bar.task.priority];
                            const isResizing = interaction?.type === 'resize' && interaction.taskId === bar.task.id;

                            return (
                              <div
                                key={bar.task.id}
                                data-bar="true"
                                style={{
                                  gridColumn: `${bar.startCol + 1} / ${bar.endCol + 2}`,
                                  padding: '0 1px',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    background: cfg.bg,
                                    border: `1px solid ${cfg.color}40`,
                                    borderLeft: bar.isBarStart ? `3px solid ${priCfg.color}` : `1px solid ${cfg.color}40`,
                                    borderRadius: `${bar.isBarStart ? 4 : 0}px ${bar.isBarEnd ? 4 : 0}px ${bar.isBarEnd ? 4 : 0}px ${bar.isBarStart ? 4 : 0}px`,
                                    display: 'flex', alignItems: 'center',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    cursor: 'pointer',
                                    opacity: isResizing ? 0.7 : 1,
                                    transition: isResizing ? 'none' : 'opacity 0.1s',
                                  }}
                                  onClick={(e) => { e.stopPropagation(); onTaskClick(bar.task); }}
                                >
                                  {/* Left resize handle */}
                                  {bar.isBarStart && (
                                    <div
                                      style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0, width: 10,
                                        cursor: 'ew-resize', zIndex: 2,
                                      }}
                                      onMouseDown={(e) => handleResizeMouseDown(bar.task.id, 'start', e)}
                                    />
                                  )}

                                  {/* Title */}
                                  <span style={{
                                    fontSize: 11, fontWeight: 500, color: cfg.color,
                                    padding: '0 10px', overflow: 'hidden',
                                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    pointerEvents: 'none',
                                  }}>
                                    {bar.isBarStart ? bar.task.title : ''}
                                  </span>

                                  {/* Right resize handle */}
                                  {bar.isBarEnd && (
                                    <div
                                      style={{
                                        position: 'absolute', right: 0, top: 0, bottom: 0, width: 10,
                                        cursor: 'ew-resize', zIndex: 2,
                                      }}
                                      onMouseDown={(e) => handleResizeMouseDown(bar.task.id, 'end', e)}
                                    />
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {maxLane >= 4 && (
                      <div style={{ fontSize: 10, color: '#475569', padding: '0 8px' }}>
                        +{bars.filter((_, i) => lanes[i] >= 4).length} more
                      </div>
                    )}
                  </div>
                )}

                {/* Click target area for remaining space */}
                <div style={{
                  display: 'grid', gridTemplateColumns: `repeat(${colCount}, 1fr)`,
                  flex: 1,
                }}>
                  {week.map((day, di) => {
                    const inSelection = interaction?.type === 'select'
                      && isDateInRange(day, interaction.startDate, interaction.endDate);
                    return (
                      <div
                        key={di}
                        data-cal-date={format(day, 'yyyy-MM-dd')}
                        style={{
                          borderRight: di < week.length - 1 ? '1px solid #1e1e26' : 'none',
                          minHeight: 8, cursor: 'crosshair',
                          background: inSelection ? 'rgba(79,70,229,0.15)' : 'transparent',
                          transition: 'background 0.08s',
                        }}
                        onMouseDown={(e) => handleCellMouseDown(day, e)}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── Selection indicator ──────────────────────────── */}
      {interaction?.type === 'select' && (
        <div style={{
          position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          background: '#4f46e5', color: 'white', padding: '8px 16px',
          borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 1000,
          boxShadow: '0 4px 16px rgba(79,70,229,0.4)',
          display: 'flex', alignItems: 'center', gap: 8,
          pointerEvents: 'none',
        }}>
          <Calendar size={14} />
          {format(interaction.startDate <= interaction.endDate ? interaction.startDate : interaction.endDate, 'MMM d')}
          {' → '}
          {format(interaction.startDate <= interaction.endDate ? interaction.endDate : interaction.startDate, 'MMM d')}
          <span style={{ opacity: 0.7 }}>
            ({Math.abs(differenceInCalendarDays(interaction.endDate, interaction.startDate)) + 1} days)
          </span>
        </div>
      )}

      {/* ─── Unscheduled tasks ────────────────────────────── */}
      <UnscheduledTasks tasks={tasks.filter((t) => !t.startDate && !t.dueDate)} onTaskClick={onTaskClick} />

      {/* Close day picker when clicking outside */}
      {showDayPicker && <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setShowDayPicker(false)} />}
    </div>
  );
}

// ─── Unscheduled tasks panel ─────────────────────────────────────────
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
        <span style={{ fontSize: 11, color: '#475569' }}>· Click to view</span>
      </div>
      {expanded && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tasks.map((task) => {
            const cfg = STATUS_CONFIG[task.status];
            return (
              <div
                key={task.id}
                style={{
                  padding: '3px 8px', borderRadius: 5,
                  fontSize: 12, fontWeight: 500,
                  background: cfg.bg, color: cfg.color,
                  border: `1px solid ${cfg.color}30`,
                  cursor: 'pointer',
                }}
                onClick={() => onTaskClick(task)}
              >
                {task.title}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
