import { useState } from 'react';
import {
  DndContext, PointerSensor, useSensor, useSensors, DragOverlay,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import type { Task, TaskStatus } from '../../types';
import { useTaskStore } from '../../store/taskStore';
import BoardColumn from './BoardColumn';
import TaskCard from './TaskCard';

const STATUSES: TaskStatus[] = ['todo', 'in-progress', 'review', 'done', 'blocked'];

interface BoardViewProps {
  onTaskClick: (task: Task) => void;
  onAddTask: (status?: TaskStatus) => void;
}

export default function BoardView({ onTaskClick, onAddTask }: BoardViewProps) {
  const { getFilteredTasks, moveTask } = useTaskStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasks = getFilteredTasks();

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = event.active.id as string;
    const task = tasks.find((t) => t.id === taskId);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropped on a column (status)
    if (STATUSES.includes(overId as TaskStatus)) {
      moveTask(taskId, overId as TaskStatus);
      return;
    }

    // Dropped on another task — move to that task's status
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      moveTask(taskId, overTask.status);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (taskId === overId) return;

    // If over a status column
    if (STATUSES.includes(overId as TaskStatus)) {
      const draggedTask = tasks.find((t) => t.id === taskId);
      if (draggedTask && draggedTask.status !== overId) {
        moveTask(taskId, overId as TaskStatus);
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div style={{
        display: 'flex',
        gap: 16,
        padding: '24px',
        overflowX: 'auto',
        height: '100%',
        alignItems: 'flex-start',
      }}>
        {STATUSES.map((status) => (
          <BoardColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onTaskClick={onTaskClick}
            onAddTask={onAddTask}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask && (
          <div style={{ transform: 'rotate(3deg)', opacity: 0.9 }}>
            <TaskCard task={activeTask} onClick={() => {}} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
