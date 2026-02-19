export type TaskStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type ViewType = 'board' | 'list' | 'calendar' | 'automations';

export interface Attachment {
  id: string;
  name: string;
  type: string; // mime type
  url: string;  // object URL or data URL
  size: number;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  listId: string;
  tags: string[];
  attachments: Attachment[];
  checklist: ChecklistItem[];
  startDate?: string; // ISO string – start of date range
  dueDate?: string;   // ISO string – end date / due date
  createdAt: string;
  updatedAt: string;
  assignee?: string;
}

export interface TaskList {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: string;
}

export type AutomationTrigger =
  | 'status_changed'
  | 'due_date_approaching'
  | 'task_created'
  | 'priority_changed';

export type AutomationAction =
  | 'change_status'
  | 'change_priority'
  | 'add_tag'
  | 'send_notification';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains';
  value: string;
}

export interface Automation {
  id: string;
  name: string;
  enabled: boolean;
  trigger: AutomationTrigger;
  triggerValue?: string;
  conditions: AutomationCondition[];
  action: AutomationAction;
  actionValue: string;
  createdAt: string;
  runsCount: number;
}

export const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; dot: string }> = {
  'todo':        { label: 'To Do',       color: '#94a3b8', bg: 'rgba(148,163,184,0.1)', dot: '#94a3b8' },
  'in-progress': { label: 'In Progress', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  dot: '#60a5fa' },
  'review':      { label: 'Review',      color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', dot: '#a78bfa' },
  'done':        { label: 'Done',        color: '#34d399', bg: 'rgba(52,211,153,0.1)',  dot: '#34d399' },
  'blocked':     { label: 'Blocked',     color: '#f87171', bg: 'rgba(248,113,113,0.1)', dot: '#f87171' },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; icon: string }> = {
  'low':      { label: 'Low',      color: '#64748b', icon: '▼' },
  'medium':   { label: 'Medium',   color: '#f59e0b', icon: '●' },
  'high':     { label: 'High',     color: '#f97316', icon: '▲' },
  'critical': { label: 'Critical', color: '#ef4444', icon: '⚑' },
};

export const LIST_COLORS = [
  '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
  '#ea580c', '#d97706', '#65a30d', '#059669',
  '#0891b2', '#0284c7',
];
