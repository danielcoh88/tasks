import { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { format, differenceInCalendarDays, addDays, startOfDay } from 'date-fns';
import {
  X, Paperclip, CheckSquare, Plus, Trash2, Calendar, ArrowRight,
  FileText, Download, ChevronDown,
  CheckCircle2, Circle,
} from 'lucide-react';
import type {
  Task, TaskStatus, TaskPriority, Attachment,
} from '../../types';
import { STATUS_CONFIG, PRIORITY_CONFIG } from '../../types';
import { useTaskStore } from '../../store/taskStore';

interface TaskModalProps {
  task?: Task | null;
  defaultStatus?: TaskStatus;
  defaultStartDate?: Date;
  defaultDate?: Date;
  onClose: () => void;
}

function countWorkDays(start: Date, end: Date, workDays: number[]): number {
  let count = 0;
  let d = startOfDay(start);
  const e = startOfDay(end);
  while (d <= e) {
    if (workDays.includes(d.getDay())) count++;
    d = addDays(d, 1);
  }
  return count;
}

export default function TaskModal({ task, defaultStatus, defaultStartDate, defaultDate, onClose }: TaskModalProps) {
  const { addTask, updateTask, deleteTask, addAttachment, removeAttachment, addChecklistItem, toggleChecklistItem, deleteChecklistItem, lists, workDays } = useTaskStore();
  const isNew = !task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || defaultStatus || 'todo');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [startDate, setStartDate] = useState(
    task?.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd')
    : defaultStartDate ? format(defaultStartDate, 'yyyy-MM-dd')
    : ''
  );
  const [endDate, setEndDate] = useState(
    task?.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd')
    : defaultDate ? format(defaultDate, 'yyyy-MM-dd')
    : ''
  );
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [listId, setListId] = useState(task?.listId || lists[0]?.id || 'default');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'attachments'>('details');

  // Duration calculation
  const durationDays = startDate && endDate
    ? differenceInCalendarDays(new Date(endDate), new Date(startDate)) + 1
    : null;
  const durationWorkDays = startDate && endDate
    ? countWorkDays(new Date(startDate), new Date(endDate), workDays)
    : null;

  const fileInputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  const localTask = task ? useTaskStore.getState().tasks.find((t) => t.id === task.id) : null;
  const attachments = localTask?.attachments || task?.attachments || [];
  const checklist = localTask?.checklist || task?.checklist || [];

  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  // Paste handler for clipboard images/files
  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (!file) continue;
        e.preventDefault();
        await handleFileUpload(file);
      }
    }
  }, [task]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [handlePaste]);

  const handleFileUpload = async (file: File) => {
    const url = URL.createObjectURL(file);
    const attachment: Attachment = {
      id: uuidv4(),
      name: file.name || `Pasted ${file.type.split('/')[0]} ${format(new Date(), 'HH:mm:ss')}`,
      type: file.type,
      url,
      size: file.size,
      createdAt: new Date().toISOString(),
    };

    if (task) {
      addAttachment(task.id, attachment);
    } else {
      setAttachmentsToAdd((prev) => [...prev, attachment]);
    }
    setActiveTab('attachments');
  };

  const [attachmentsToAdd, setAttachmentsToAdd] = useState<Attachment[]>([]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    for (const file of Array.from(e.dataTransfer.files)) {
      handleFileUpload(file);
    }
  };

  const handleSave = () => {
    if (!title.trim()) return;
    const updates = {
      title: title.trim(),
      description,
      status,
      priority,
      startDate: startDate ? new Date(startDate + 'T00:00:00').toISOString() : undefined,
      dueDate: endDate ? new Date(endDate + 'T23:59:59').toISOString() : undefined,
      tags,
      listId,
    };
    if (isNew) {
      addTask({ ...updates, attachments: attachmentsToAdd });
    } else {
      updateTask(task!.id, updates);
    }
    onClose();
  };

  const handleAddTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput('');
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { if (!isNew || !title.trim() || confirm('Discard new task?')) onClose(); }}}
    >
      <div
        ref={modalRef}
        style={{
          background: '#18181f',
          border: '1px solid #2d2d35',
          borderRadius: 16,
          width: '100%', maxWidth: 680,
          maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragOver && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 10,
            background: 'rgba(79, 70, 229, 0.15)',
            border: '2px dashed #4f46e5',
            borderRadius: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, color: '#818cf8', fontWeight: 600,
          }}>
            Drop files here
          </div>
        )}

        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '16px 20px',
          borderBottom: '1px solid #2d2d35',
        }}>
          {/* Status selector */}
          <StatusDropdown value={status} onChange={setStatus} />

          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            style={{
              flex: 1, background: 'none', border: 'none', outline: 'none',
              fontSize: 18, fontWeight: 700, color: '#e2e8f0',
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
          />
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* Quick fields row */}
        <div style={{
          display: 'flex', gap: 12, padding: '12px 20px',
          borderBottom: '1px solid #2d2d35',
          flexWrap: 'wrap', alignItems: 'center',
        }}>
          {/* Priority */}
          <PriorityDropdown value={priority} onChange={setPriority} />

          {/* Date range */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Calendar size={13} style={{ color: '#475569', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: '#1a1a22', border: '1px solid #2d2d35', borderRadius: 6, overflow: 'hidden' }}>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  // If end date is before new start, push it forward
                  if (endDate && e.target.value && e.target.value > endDate) setEndDate(e.target.value);
                }}
                title="Start date"
                style={{
                  background: 'transparent', border: 'none',
                  color: startDate ? '#e2e8f0' : '#475569',
                  fontSize: 12, padding: '4px 8px', cursor: 'pointer', outline: 'none',
                  width: 130,
                }}
              />
              <ArrowRight size={12} style={{ color: '#475569', flexShrink: 0 }} />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  // If start date is after new end, pull it back
                  if (startDate && e.target.value && e.target.value < startDate) setStartDate(e.target.value);
                }}
                title="End date"
                style={{
                  background: 'transparent', border: 'none',
                  color: endDate ? '#e2e8f0' : '#475569',
                  fontSize: 12, padding: '4px 8px', cursor: 'pointer', outline: 'none',
                  width: 130,
                }}
              />
            </div>
            {durationDays !== null && durationDays > 0 && (
              <span style={{
                display: 'flex', alignItems: 'center', gap: 4,
                background: 'rgba(79,70,229,0.12)', color: '#818cf8',
                fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 6,
                border: '1px solid rgba(79,70,229,0.25)', whiteSpace: 'nowrap',
              }}>
                {durationDays}d{durationWorkDays !== null && durationWorkDays !== durationDays && (
                  <span style={{ color: '#64748b', fontWeight: 400 }}>
                    ({durationWorkDays} work)
                  </span>
                )}
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              style={{
                background: '#1a1a22', border: '1px solid #2d2d35',
                borderRadius: 6, color: '#e2e8f0',
                fontSize: 12, padding: '4px 8px', cursor: 'pointer', outline: 'none',
              }}
            >
              {lists.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid #2d2d35' }}>
          {(['details', 'checklist', 'attachments'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none',
                borderBottom: activeTab === tab ? '2px solid #4f46e5' : '2px solid transparent',
                color: activeTab === tab ? '#818cf8' : '#64748b',
                fontSize: 13, fontWeight: 500,
                padding: '10px 20px', cursor: 'pointer',
                textTransform: 'capitalize',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              {tab === 'checklist' && <CheckSquare size={13} />}
              {tab === 'attachments' && <Paperclip size={13} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'checklist' && checklist.length > 0 && (
                <span style={{ background: '#1e1e26', color: '#64748b', fontSize: 10, padding: '1px 5px', borderRadius: 8 }}>
                  {checklist.length}
                </span>
              )}
              {tab === 'attachments' && (attachments.length + attachmentsToAdd.length) > 0 && (
                <span style={{ background: '#1e1e26', color: '#64748b', fontSize: 10, padding: '1px 5px', borderRadius: 8 }}>
                  {attachments.length + attachmentsToAdd.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

          {activeTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Description */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a detailed description..."
                  rows={5}
                  style={{
                    width: '100%', background: '#1a1a22',
                    border: '1px solid #2d2d35', borderRadius: 8,
                    color: '#e2e8f0', fontSize: 14, padding: '10px 12px',
                    outline: 'none', resize: 'vertical', fontFamily: 'inherit',
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#4f46e5'; }}
                  onBlur={(e) => { e.target.style.borderColor = '#2d2d35'; }}
                />
              </div>

              {/* Tags */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#64748b', letterSpacing: '0.08em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
                  Tags
                </label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                  {tags.map((tag) => (
                    <span key={tag} style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: 'rgba(79,70,229,0.15)', color: '#818cf8',
                      fontSize: 12, padding: '3px 8px', borderRadius: 6,
                      border: '1px solid rgba(79,70,229,0.3)',
                    }}>
                      #{tag}
                      <button
                        onClick={() => setTags(tags.filter((t) => t !== tag))}
                        style={{ background: 'none', border: 'none', color: '#818cf8', cursor: 'pointer', padding: 0, display: 'flex' }}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input-base"
                    style={{ fontSize: 13 }}
                    placeholder="Add tag (press Enter)..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                  />
                  <button className="btn-ghost" onClick={handleAddTag} style={{ padding: '6px 12px', whiteSpace: 'nowrap', fontSize: 12 }}>
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Paste hint */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', background: '#1a1a22',
                borderRadius: 8, border: '1px solid #2d2d35',
              }}>
                <Paperclip size={14} style={{ color: '#475569' }} />
                <span style={{ fontSize: 12, color: '#475569' }}>
                  Paste images or files anywhere in this modal (Ctrl+V / Cmd+V), or drag & drop files
                </span>
              </div>
            </div>
          )}

          {activeTab === 'checklist' && (
            <ChecklistTab
              checklist={checklist}
              newCheckItem={newCheckItem}
              setNewCheckItem={setNewCheckItem}
              onAdd={(text) => {
                if (task) {
                  addChecklistItem(task.id, text);
                }
              }}
              onToggle={(itemId) => task && toggleChecklistItem(task.id, itemId)}
              onDelete={(itemId) => task && deleteChecklistItem(task.id, itemId)}
            />
          )}

          {activeTab === 'attachments' && (
            <AttachmentsTab
              attachments={[...attachments, ...attachmentsToAdd]}
              onRemove={(attachId) => {
                if (task) removeAttachment(task.id, attachId);
                else setAttachmentsToAdd((prev) => prev.filter((a) => a.id !== attachId));
              }}
              onFileSelect={() => fileInputRef.current?.click()}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 20px', borderTop: '1px solid #2d2d35',
          background: '#141418',
        }}>
          <div style={{ display: 'flex', gap: 8 }}>
            {!isNew && (
              <button
                className="btn-ghost"
                style={{ color: '#f87171', borderColor: '#f8717130', fontSize: 12, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => { if (confirm('Delete this task?')) { deleteTask(task!.id); onClose(); } }}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={onClose} style={{ fontSize: 13, padding: '7px 16px' }}>Cancel</button>
            <button className="btn-primary" onClick={handleSave} style={{ fontSize: 13, padding: '7px 16px' }} disabled={!title.trim()}>
              {isNew ? 'Create Task' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={(e) => {
        if (e.target.files) Array.from(e.target.files).forEach(handleFileUpload);
      }} />
    </div>
  );
}

function StatusDropdown({ value, onChange }: { value: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[value];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: cfg.bg, border: `1px solid ${cfg.color}40`,
          borderRadius: 8, padding: '5px 10px',
          color: cfg.color, cursor: 'pointer', fontSize: 12, fontWeight: 600,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: '50%', background: cfg.dot, display: 'inline-block' }} />
        {cfg.label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
          background: '#1e1e24', border: '1px solid #2d2d35', borderRadius: 8,
          overflow: 'hidden', minWidth: 140,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {Object.entries(STATUS_CONFIG).map(([s, c]) => (
            <button
              key={s}
              onClick={() => { onChange(s as TaskStatus); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', background: s === value ? c.bg : 'none',
                border: 'none', padding: '8px 12px',
                color: c.color, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                textAlign: 'left',
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: c.dot }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function PriorityDropdown({ value, onChange }: { value: TaskPriority; onChange: (p: TaskPriority) => void }) {
  const [open, setOpen] = useState(false);
  const cfg = PRIORITY_CONFIG[value];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 5,
          background: `${cfg.color}15`, border: `1px solid ${cfg.color}30`,
          borderRadius: 6, padding: '4px 8px',
          color: cfg.color, cursor: 'pointer', fontSize: 11, fontWeight: 600,
        }}
      >
        {cfg.icon} {cfg.label}
        <ChevronDown size={11} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 100, marginTop: 4,
          background: '#1e1e24', border: '1px solid #2d2d35', borderRadius: 8,
          overflow: 'hidden', minWidth: 130,
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {Object.entries(PRIORITY_CONFIG).map(([p, c]) => (
            <button
              key={p}
              onClick={() => { onChange(p as TaskPriority); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                width: '100%', background: p === value ? `${c.color}15` : 'none',
                border: 'none', padding: '8px 12px',
                color: c.color, cursor: 'pointer', fontSize: 12, fontWeight: 500,
                textAlign: 'left',
              }}
            >
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ChecklistTab({ checklist, newCheckItem, setNewCheckItem, onAdd, onToggle, onDelete }: {
  checklist: { id: string; text: string; checked: boolean }[];
  newCheckItem: string;
  setNewCheckItem: (v: string) => void;
  onAdd: (text: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const checked = checklist.filter((c) => c.checked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {checklist.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ flex: 1, height: 4, background: '#1e1e26', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${(checked / checklist.length) * 100}%`,
              background: checked === checklist.length ? '#34d399' : '#4f46e5',
              borderRadius: 2, transition: 'width 0.3s',
            }} />
          </div>
          <span style={{ fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>
            {checked}/{checklist.length}
          </span>
        </div>
      )}

      {checklist.map((item) => (
        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
          <button
            onClick={() => onToggle(item.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', flexShrink: 0 }}
          >
            {item.checked
              ? <CheckCircle2 size={18} style={{ color: '#34d399' }} />
              : <Circle size={18} style={{ color: '#475569' }} />
            }
          </button>
          <span style={{
            flex: 1, fontSize: 14, color: item.checked ? '#475569' : '#e2e8f0',
            textDecoration: item.checked ? 'line-through' : undefined,
          }}>
            {item.text}
          </span>
          <button
            onClick={() => onDelete(item.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d2d35', display: 'flex', padding: 2 }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <input
          className="input-base"
          placeholder="Add checklist item..."
          value={newCheckItem}
          onChange={(e) => setNewCheckItem(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newCheckItem.trim()) {
              onAdd(newCheckItem.trim());
              setNewCheckItem('');
            }
          }}
        />
        <button
          className="btn-ghost"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', fontSize: 12 }}
          onClick={() => {
            if (newCheckItem.trim()) {
              onAdd(newCheckItem.trim());
              setNewCheckItem('');
            }
          }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {checklist.length === 0 && (
        <div style={{ textAlign: 'center', color: '#475569', fontSize: 13, padding: '20px 0' }}>
          <CheckSquare size={32} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }} />
          No checklist items yet
        </div>
      )}
    </div>
  );
}

function AttachmentsTab({ attachments, onRemove, onFileSelect }: {
  attachments: Attachment[];
  onRemove: (id: string) => void;
  onFileSelect: () => void;
}) {
  const isImage = (type: string) => type.startsWith('image/');

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn-ghost" onClick={onFileSelect} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
          <Paperclip size={14} /> Attach File
        </button>
        <span style={{ fontSize: 12, color: '#475569', display: 'flex', alignItems: 'center' }}>
          or paste (Ctrl+V) or drag & drop
        </span>
      </div>

      {attachments.length === 0 ? (
        <div style={{
          border: '2px dashed #2d2d35', borderRadius: 10,
          padding: '40px 20px', textAlign: 'center',
          color: '#475569', fontSize: 13,
        }}>
          <Paperclip size={32} style={{ margin: '0 auto 10px', opacity: 0.3, display: 'block' }} />
          <div>No attachments yet</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Paste images or drop files here</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {attachments.map((att) => (
            <div key={att.id} style={{
              background: '#1a1a22', borderRadius: 8, border: '1px solid #2d2d35',
              overflow: 'hidden', position: 'relative',
            }}>
              {isImage(att.type) ? (
                <div style={{ height: 100, overflow: 'hidden' }}>
                  <img
                    src={att.url}
                    alt={att.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              ) : (
                <div style={{
                  height: 100, display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: '#141418',
                }}>
                  <FileText size={28} style={{ color: '#475569' }} />
                  <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>
                    {att.type.split('/')[1] || 'FILE'}
                  </span>
                </div>
              )}
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {att.name}
                </div>
                <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{formatSize(att.size)}</div>
              </div>
              <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
                <a
                  href={att.url}
                  download={att.name}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    background: 'rgba(0,0,0,0.7)', borderRadius: 4, padding: 4,
                    color: '#94a3b8', display: 'flex',
                  }}
                >
                  <Download size={12} />
                </a>
                <button
                  onClick={() => onRemove(att.id)}
                  style={{
                    background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: 4, padding: 4,
                    color: '#f87171', cursor: 'pointer', display: 'flex',
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
