import { useState } from 'react';
import {
  Zap, Plus, Trash2, Power,
  ArrowRight, Activity,
} from 'lucide-react';
import type {
  Automation, AutomationTrigger, AutomationAction,
  AutomationCondition,
} from '../../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types';
import { useTaskStore } from '../../store/taskStore';

const TRIGGER_OPTIONS: { value: AutomationTrigger; label: string; description: string }[] = [
  { value: 'task_created',       label: 'Task Created',       description: 'Runs when a new task is created' },
  { value: 'status_changed',     label: 'Status Changed',     description: 'Runs when a task status is changed' },
  { value: 'priority_changed',   label: 'Priority Changed',   description: 'Runs when a task priority changes' },
  { value: 'due_date_approaching', label: 'Due Date Approaching', description: 'Runs when due date is within 24h' },
];

const ACTION_OPTIONS: { value: AutomationAction; label: string }[] = [
  { value: 'change_status',    label: 'Change Status' },
  { value: 'change_priority',  label: 'Change Priority' },
  { value: 'add_tag',          label: 'Add Tag' },
  { value: 'send_notification', label: 'Send Notification' },
];

const PRESET_AUTOMATIONS: Omit<Automation, 'id' | 'createdAt' | 'runsCount'>[] = [
  {
    name: 'Auto-complete when all checklist items done',
    enabled: true,
    trigger: 'status_changed',
    conditions: [{ field: 'status', operator: 'equals', value: 'review' }],
    action: 'add_tag',
    actionValue: 'needs-review',
  },
  {
    name: 'Mark as high priority when blocked',
    enabled: true,
    trigger: 'status_changed',
    conditions: [{ field: 'status', operator: 'equals', value: 'blocked' }],
    action: 'change_priority',
    actionValue: 'high',
  },
  {
    name: 'Tag new tasks as "new"',
    enabled: false,
    trigger: 'task_created',
    conditions: [],
    action: 'add_tag',
    actionValue: 'new',
  },
];

export default function AutomationsView() {
  const { automations, addAutomation, deleteAutomation, toggleAutomation } = useTaskStore();
  const [showCreate, setShowCreate] = useState(false);

  const totalRuns = automations.reduce((a, b) => a + b.runsCount, 0);

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      {/* Stats banner */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 24,
        flexWrap: 'wrap',
      }}>
        {[
          { label: 'Total Automations', value: automations.length, icon: <Zap size={18} style={{ color: '#818cf8' }} /> },
          { label: 'Active', value: automations.filter((a) => a.enabled).length, icon: <Power size={18} style={{ color: '#34d399' }} /> },
          { label: 'Total Runs', value: totalRuns, icon: <Activity size={18} style={{ color: '#60a5fa' }} /> },
        ].map((stat) => (
          <div key={stat.label} style={{
            flex: 1, minWidth: 160,
            background: '#1e1e24', border: '1px solid #2d2d35',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ padding: 8, background: '#141418', borderRadius: 8 }}>
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: '#e2e8f0' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#475569' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Automations list */}
        <div style={{ flex: 1, minWidth: 300 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>
              My Automations
            </h2>
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}
              onClick={() => setShowCreate(true)}
            >
              <Plus size={14} /> New Automation
            </button>
          </div>

          {automations.length === 0 ? (
            <div style={{
              border: '2px dashed #2d2d35', borderRadius: 12, padding: '40px 20px',
              textAlign: 'center', color: '#475569',
            }}>
              <Zap size={40} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }} />
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>No automations yet</div>
              <div style={{ fontSize: 12, marginBottom: 16 }}>Create your first automation or use a preset below</div>
              <button className="btn-primary" onClick={() => setShowCreate(true)} style={{ fontSize: 13 }}>
                Create Automation
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {automations.map((auto) => (
                <AutomationCard
                  key={auto.id}
                  automation={auto}
                  onToggle={() => toggleAutomation(auto.id)}
                  onDelete={() => { if (confirm('Delete this automation?')) deleteAutomation(auto.id); }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Presets panel */}
        <div style={{ width: 280, flexShrink: 0 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 13, fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Quick Templates
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PRESET_AUTOMATIONS.map((preset, i) => (
              <div key={i} style={{
                background: '#1e1e24', border: '1px solid #2d2d35',
                borderRadius: 10, padding: '12px 14px',
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 6 }}>
                  {preset.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748b', marginBottom: 10 }}>
                  <span style={{
                    background: 'rgba(79,70,229,0.15)', color: '#818cf8',
                    padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                  }}>
                    {TRIGGER_OPTIONS.find((t) => t.value === preset.trigger)?.label}
                  </span>
                  <ArrowRight size={11} />
                  <span style={{
                    background: 'rgba(52,211,153,0.1)', color: '#34d399',
                    padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                  }}>
                    {ACTION_OPTIONS.find((a) => a.value === preset.action)?.label}
                  </span>
                </div>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 11, padding: '4px 10px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                  onClick={() => addAutomation(preset)}
                >
                  <Plus size={12} /> Use Template
                </button>
              </div>
            ))}
          </div>

          {/* Explanation */}
          <div style={{
            marginTop: 16, padding: '14px 16px',
            background: 'rgba(79,70,229,0.08)', border: '1px solid rgba(79,70,229,0.2)',
            borderRadius: 10,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#818cf8', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} /> How automations work
            </div>
            <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
              Automations run automatically when a trigger event occurs. You can add conditions to filter which tasks they apply to, and define an action to take.
            </div>
          </div>
        </div>
      </div>

      {showCreate && (
        <CreateAutomationModal onClose={() => setShowCreate(false)} />
      )}
    </div>
  );
}

function AutomationCard({ automation, onToggle, onDelete }: {
  automation: Automation;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const triggerLabel = TRIGGER_OPTIONS.find((t) => t.value === automation.trigger)?.label || automation.trigger;
  const actionLabel = ACTION_OPTIONS.find((a) => a.value === automation.action)?.label || automation.action;

  return (
    <div style={{
      background: '#1e1e24',
      border: `1px solid ${automation.enabled ? '#2d2d35' : '#1e1e26'}`,
      borderRadius: 12,
      padding: '14px 16px',
      opacity: automation.enabled ? 1 : 0.6,
      transition: 'opacity 0.2s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 4 }}>
            {automation.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(79,70,229,0.15)', color: '#818cf8',
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            }}>
              {triggerLabel}
            </span>
            {automation.conditions.length > 0 && (
              <>
                <span style={{ fontSize: 11, color: '#475569' }}>if</span>
                {automation.conditions.map((c, i) => (
                  <span key={i} style={{
                    background: '#1a1a22', border: '1px solid #2d2d35',
                    fontSize: 11, color: '#94a3b8',
                    padding: '1px 6px', borderRadius: 4,
                  }}>
                    {c.field} {c.operator} {c.value}
                  </span>
                ))}
              </>
            )}
            <ArrowRight size={12} style={{ color: '#475569' }} />
            <span style={{
              background: 'rgba(52,211,153,0.1)', color: '#34d399',
              fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4,
            }}>
              {actionLabel}: {automation.actionValue}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {automation.runsCount > 0 && (
            <span style={{ fontSize: 11, color: '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
              <Activity size={11} /> {automation.runsCount}
            </span>
          )}
          <button
            onClick={onToggle}
            style={{
              background: automation.enabled ? 'rgba(52,211,153,0.1)' : '#1a1a22',
              border: `1px solid ${automation.enabled ? 'rgba(52,211,153,0.3)' : '#2d2d35'}`,
              borderRadius: 6, padding: '4px 8px',
              color: automation.enabled ? '#34d399' : '#475569',
              cursor: 'pointer', fontSize: 11, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Power size={11} />
            {automation.enabled ? 'On' : 'Off'}
          </button>
          <button
            onClick={onDelete}
            style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', padding: 4, borderRadius: 4 }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateAutomationModal({ onClose }: { onClose: () => void }) {
  const { addAutomation } = useTaskStore();
  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState<AutomationTrigger>('task_created');
  const [action, setAction] = useState<AutomationAction>('change_status');
  const [actionValue, setActionValue] = useState('done');
  const [conditions, setConditions] = useState<AutomationCondition[]>([]);

  const handleSave = () => {
    if (!name.trim()) return;
    addAutomation({ name: name.trim(), enabled: true, trigger, conditions, action, actionValue });
    onClose();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#18181f', border: '1px solid #2d2d35', borderRadius: 16,
        width: '100%', maxWidth: 540,
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #2d2d35', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Zap size={18} style={{ color: '#818cf8' }} />
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#e2e8f0' }}>Create Automation</h2>
        </div>

        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Name */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Name
            </label>
            <input
              className="input-base"
              placeholder="e.g. Auto-tag urgent tasks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Trigger */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              When (Trigger)
            </label>
            <select
              className="input-base"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value as AutomationTrigger)}
              style={{ cursor: 'pointer' }}
            >
              {TRIGGER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 4 }}>
              {TRIGGER_OPTIONS.find((t) => t.value === trigger)?.description}
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Conditions (optional)
              </label>
              <button
                className="btn-ghost"
                style={{ fontSize: 11, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => setConditions([...conditions, { field: 'status', operator: 'equals', value: 'todo' }])}
              >
                <Plus size={12} /> Add
              </button>
            </div>
            {conditions.map((cond, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' }}>
                <select
                  style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 6, color: '#e2e8f0', fontSize: 12, padding: '5px 8px', outline: 'none' }}
                  value={cond.field}
                  onChange={(e) => { const c = [...conditions]; c[i] = { ...c[i], field: e.target.value }; setConditions(c); }}
                >
                  <option value="status">Status</option>
                  <option value="priority">Priority</option>
                  <option value="tags">Tags</option>
                </select>
                <select
                  style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 6, color: '#e2e8f0', fontSize: 12, padding: '5px 8px', outline: 'none' }}
                  value={cond.operator}
                  onChange={(e) => { const c = [...conditions]; c[i] = { ...c[i], operator: e.target.value as AutomationCondition['operator'] }; setConditions(c); }}
                >
                  <option value="equals">equals</option>
                  <option value="not_equals">not equals</option>
                  <option value="contains">contains</option>
                </select>
                <input
                  style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 6, color: '#e2e8f0', fontSize: 12, padding: '5px 8px', outline: 'none' }}
                  value={cond.value}
                  onChange={(e) => { const c = [...conditions]; c[i] = { ...c[i], value: e.target.value }; setConditions(c); }}
                  placeholder="value"
                />
                <button onClick={() => setConditions(conditions.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#475569', cursor: 'pointer', display: 'flex', padding: 4 }}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>

          {/* Action */}
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Then Do (Action)
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 8, color: '#e2e8f0', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                value={action}
                onChange={(e) => setAction(e.target.value as AutomationAction)}
              >
                {ACTION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {action === 'change_status' && (
                <select style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 8, color: '#e2e8f0', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                  value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([s, c]) => <option key={s} value={s}>{c.label}</option>)}
                </select>
              )}
              {action === 'change_priority' && (
                <select style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 8, color: '#e2e8f0', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                  value={actionValue} onChange={(e) => setActionValue(e.target.value)}>
                  {Object.entries(PRIORITY_CONFIG).map(([p, c]) => <option key={p} value={p}>{c.label}</option>)}
                </select>
              )}
              {(action === 'add_tag' || action === 'send_notification') && (
                <input
                  style={{ flex: 1, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 8, color: '#e2e8f0', fontSize: 13, padding: '8px 10px', outline: 'none' }}
                  placeholder={action === 'add_tag' ? 'Tag name' : 'Notification message'}
                  value={actionValue}
                  onChange={(e) => setActionValue(e.target.value)}
                />
              )}
            </div>
          </div>
        </div>

        <div style={{ padding: '14px 20px', borderTop: '1px solid #2d2d35', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn-ghost" onClick={onClose} style={{ fontSize: 13 }}>Cancel</button>
          <button className="btn-primary" onClick={handleSave} disabled={!name.trim()} style={{ fontSize: 13 }}>
            Create Automation
          </button>
        </div>
      </div>
    </div>
  );
}
