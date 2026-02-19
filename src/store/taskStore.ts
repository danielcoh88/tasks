import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type {
  Task, TaskList, TaskStatus, TaskPriority,
  Attachment, ChecklistItem, Automation, ViewType,
} from '../types';

interface TaskStore {
  tasks: Task[];
  lists: TaskList[];
  automations: Automation[];
  activeListId: string | null;
  activeView: ViewType;
  searchQuery: string;
  selectedTaskId: string | null;

  // View
  setActiveView: (view: ViewType) => void;
  setActiveListId: (id: string | null) => void;
  setSearchQuery: (q: string) => void;
  setSelectedTaskId: (id: string | null) => void;

  // Tasks
  addTask: (task: Partial<Task> & { title: string }) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  addChecklistItem: (taskId: string, text: string) => void;
  toggleChecklistItem: (taskId: string, itemId: string) => void;
  deleteChecklistItem: (taskId: string, itemId: string) => void;
  addTag: (taskId: string, tag: string) => void;
  removeTag: (taskId: string, tag: string) => void;

  // Lists
  addList: (name: string, color: string) => TaskList;
  updateList: (id: string, updates: Partial<TaskList>) => void;
  deleteList: (id: string) => void;

  // Automations
  addAutomation: (auto: Omit<Automation, 'id' | 'createdAt' | 'runsCount'>) => void;
  updateAutomation: (id: string, updates: Partial<Automation>) => void;
  deleteAutomation: (id: string) => void;
  toggleAutomation: (id: string) => void;
  runAutomations: (task: Task, event: string) => void;

  // Computed
  getFilteredTasks: () => Task[];
  getTasksByStatus: (status: TaskStatus) => Task[];
  getTasksForList: (listId: string) => Task[];
}

const DEFAULT_LIST: TaskList = {
  id: 'default',
  name: 'My Tasks',
  color: '#4f46e5',
  icon: '📋',
  createdAt: new Date().toISOString(),
};

const SAMPLE_TASKS: Task[] = [
  {
    id: uuidv4(),
    title: 'Design new landing page',
    description: 'Create a modern, conversion-focused landing page with hero section, features, and CTA.',
    status: 'in-progress',
    priority: 'high',
    listId: 'default',
    tags: ['design', 'marketing'],
    attachments: [],
    checklist: [
      { id: uuidv4(), text: 'Wireframes', checked: true },
      { id: uuidv4(), text: 'Mockups', checked: false },
      { id: uuidv4(), text: 'Responsive design', checked: false },
    ],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Fix authentication bug',
    description: 'Users report being logged out unexpectedly. Investigate JWT token refresh logic.',
    status: 'todo',
    priority: 'critical',
    listId: 'default',
    tags: ['bug', 'auth'],
    attachments: [],
    checklist: [],
    dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Write API documentation',
    description: 'Document all REST endpoints with examples, request/response schemas, and error codes.',
    status: 'review',
    priority: 'medium',
    listId: 'default',
    tags: ['docs'],
    attachments: [],
    checklist: [
      { id: uuidv4(), text: 'Authentication endpoints', checked: true },
      { id: uuidv4(), text: 'User endpoints', checked: true },
      { id: uuidv4(), text: 'Task endpoints', checked: false },
    ],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Set up CI/CD pipeline',
    description: 'Configure GitHub Actions for automated testing, building, and deployment.',
    status: 'done',
    priority: 'high',
    listId: 'default',
    tags: ['devops'],
    attachments: [],
    checklist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'User onboarding flow',
    description: 'Create step-by-step onboarding for new users including welcome email and tutorial.',
    status: 'todo',
    priority: 'medium',
    listId: 'default',
    tags: ['ux', 'product'],
    attachments: [],
    checklist: [],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: uuidv4(),
    title: 'Performance optimization',
    description: 'Database queries are slow. Add indexes, optimize N+1 queries, and implement caching.',
    status: 'blocked',
    priority: 'high',
    listId: 'default',
    tags: ['performance', 'backend'],
    attachments: [],
    checklist: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: SAMPLE_TASKS,
      lists: [DEFAULT_LIST],
      automations: [],
      activeListId: null,
      activeView: 'board',
      searchQuery: '',
      selectedTaskId: null,

      setActiveView: (view) => set({ activeView: view }),
      setActiveListId: (id) => set({ activeListId: id }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setSelectedTaskId: (id) => set({ selectedTaskId: id }),

      addTask: (partial) => {
        const task: Task = {
          id: uuidv4(),
          title: partial.title,
          description: partial.description || '',
          status: partial.status || 'todo',
          priority: partial.priority || 'medium',
          listId: partial.listId || get().activeListId || 'default',
          tags: partial.tags || [],
          attachments: partial.attachments || [],
          checklist: partial.checklist || [],
          dueDate: partial.dueDate,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          assignee: partial.assignee,
        };
        set((s) => ({ tasks: [...s.tasks, task] }));
        get().runAutomations(task, 'task_created');
        return task;
      },

      updateTask: (id, updates) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === id);
        if (task) get().runAutomations(task, 'task_updated');
      },

      deleteTask: (id) => {
        set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }));
      },

      moveTask: (taskId, status) => {
        get().updateTaskStatus(taskId, status);
      },

      updateTaskStatus: (taskId, status) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
        }));
        const task = get().tasks.find((t) => t.id === taskId);
        if (task) get().runAutomations({ ...task, status }, 'status_changed');
      },

      addAttachment: (taskId, attachment) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, attachments: [...t.attachments, attachment], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      removeAttachment: (taskId, attachmentId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, attachments: t.attachments.filter((a) => a.id !== attachmentId) }
              : t
          ),
        }));
      },

      addChecklistItem: (taskId, text) => {
        const item: ChecklistItem = { id: uuidv4(), text, checked: false };
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, checklist: [...t.checklist, item], updatedAt: new Date().toISOString() }
              : t
          ),
        }));
      },

      toggleChecklistItem: (taskId, itemId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  checklist: t.checklist.map((c) =>
                    c.id === itemId ? { ...c, checked: !c.checked } : c
                  ),
                }
              : t
          ),
        }));
      },

      deleteChecklistItem: (taskId, itemId) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId
              ? { ...t, checklist: t.checklist.filter((c) => c.id !== itemId) }
              : t
          ),
        }));
      },

      addTag: (taskId, tag) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId && !t.tags.includes(tag)
              ? { ...t, tags: [...t.tags, tag] }
              : t
          ),
        }));
      },

      removeTag: (taskId, tag) => {
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === taskId ? { ...t, tags: t.tags.filter((tg) => tg !== tag) } : t
          ),
        }));
      },

      addList: (name, color) => {
        const list: TaskList = {
          id: uuidv4(),
          name,
          color,
          icon: '📁',
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ lists: [...s.lists, list] }));
        return list;
      },

      updateList: (id, updates) => {
        set((s) => ({
          lists: s.lists.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }));
      },

      deleteList: (id) => {
        set((s) => ({
          lists: s.lists.filter((l) => l.id !== id),
          tasks: s.tasks.filter((t) => t.listId !== id),
        }));
      },

      addAutomation: (auto) => {
        const automation: Automation = {
          ...auto,
          id: uuidv4(),
          createdAt: new Date().toISOString(),
          runsCount: 0,
        };
        set((s) => ({ automations: [...s.automations, automation] }));
      },

      updateAutomation: (id, updates) => {
        set((s) => ({
          automations: s.automations.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteAutomation: (id) => {
        set((s) => ({ automations: s.automations.filter((a) => a.id !== id) }));
      },

      toggleAutomation: (id) => {
        set((s) => ({
          automations: s.automations.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a
          ),
        }));
      },

      runAutomations: (task, event) => {
        const { automations, tasks } = get();
        const relevant = automations.filter((a) => a.enabled && a.trigger === event);
        if (relevant.length === 0) return;

        let updatedTasks = [...tasks];
        const updates: Record<string, Partial<Task>> = {};

        for (const auto of relevant) {
          // Check conditions
          const pass = auto.conditions.every((cond) => {
            const taskVal = String((task as unknown as Record<string, unknown>)[cond.field] ?? '');
            if (cond.operator === 'equals') return taskVal === cond.value;
            if (cond.operator === 'not_equals') return taskVal !== cond.value;
            if (cond.operator === 'contains') return taskVal.includes(cond.value);
            return false;
          });
          if (!pass) continue;

          // Apply action
          if (!updates[task.id]) updates[task.id] = {};
          if (auto.action === 'change_status') {
            updates[task.id].status = auto.actionValue as TaskStatus;
          } else if (auto.action === 'change_priority') {
            updates[task.id].priority = auto.actionValue as TaskPriority;
          } else if (auto.action === 'add_tag') {
            const currentTags = updates[task.id].tags ?? task.tags;
            if (!currentTags.includes(auto.actionValue)) {
              updates[task.id].tags = [...currentTags, auto.actionValue];
            }
          }
        }

        if (Object.keys(updates).length > 0) {
          updatedTasks = updatedTasks.map((t) =>
            updates[t.id] ? { ...t, ...updates[t.id], updatedAt: new Date().toISOString() } : t
          );
          // Increment runsCount
          set((s) => ({
            tasks: updatedTasks,
            automations: s.automations.map((a) =>
              relevant.find((r) => r.id === a.id) ? { ...a, runsCount: a.runsCount + 1 } : a
            ),
          }));
        }
      },

      getFilteredTasks: () => {
        const { tasks, activeListId, searchQuery } = get();
        let filtered = tasks;
        if (activeListId) filtered = filtered.filter((t) => t.listId === activeListId);
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.description.toLowerCase().includes(q) ||
              t.tags.some((tag) => tag.toLowerCase().includes(q))
          );
        }
        return filtered;
      },

      getTasksByStatus: (status) => {
        return get().getFilteredTasks().filter((t) => t.status === status);
      },

      getTasksForList: (listId) => {
        return get().tasks.filter((t) => t.listId === listId);
      },
    }),
    {
      name: 'taskflow-storage',
      partialize: (s) => ({
        tasks: s.tasks,
        lists: s.lists,
        automations: s.automations,
      }),
    }
  )
);
