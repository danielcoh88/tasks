import { useState } from 'react';
import {
  LayoutGrid, List, Calendar, Zap, Search, Plus,
  ChevronDown, ChevronRight, Trash2, Settings, X
} from 'lucide-react';
import { useTaskStore } from '../../store/taskStore';
import type { ViewType } from '../../types';
import { LIST_COLORS } from '../../types';

const NAV_ITEMS: { id: ViewType; label: string; icon: React.ReactNode }[] = [
  { id: 'board',       label: 'Board',       icon: <LayoutGrid size={16} /> },
  { id: 'list',        label: 'List',        icon: <List size={16} /> },
  { id: 'calendar',    label: 'Calendar',    icon: <Calendar size={16} /> },
  { id: 'automations', label: 'Automations', icon: <Zap size={16} /> },
];

export default function Sidebar() {
  const {
    lists, activeView, activeListId, searchQuery, automations,
    setActiveView, setActiveListId, setSearchQuery,
    addList, deleteList,
  } = useTaskStore();

  const [listsExpanded, setListsExpanded] = useState(true);
  const [showNewList, setShowNewList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListColor, setNewListColor] = useState(LIST_COLORS[0]);

  const handleAddList = () => {
    if (!newListName.trim()) return;
    addList(newListName.trim(), newListColor);
    setNewListName('');
    setNewListColor(LIST_COLORS[0]);
    setShowNewList(false);
  };

  const enabledAutos = automations.filter((a) => a.enabled).length;

  return (
    <aside style={{
      width: 240,
      minWidth: 240,
      background: '#141418',
      borderRight: '1px solid #1e1e26',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e1e26' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32,
            background: 'linear-gradient(135deg, #4f46e5, #7c3aed)',
            borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
          }}>⚡</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#e2e8f0' }}>TaskFlow</div>
            <div style={{ fontSize: 11, color: '#475569' }}>Workspace</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 12px 8px' }}>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
          <input
            className="input-base"
            style={{ paddingLeft: 32, fontSize: 13, padding: '7px 12px 7px 32px' }}
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, display: 'flex' }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ padding: '4px 8px', flex: 1, overflow: 'auto' }}>
        <div style={{ marginBottom: 4 }}>
          {NAV_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`sidebar-item ${activeView === item.id && !activeListId ? 'active' : ''}`}
              onClick={() => { setActiveView(item.id); setActiveListId(null); }}
            >
              {item.icon}
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.id === 'automations' && enabledAutos > 0 && (
                <span style={{
                  background: '#4f46e5',
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 10,
                }}>{enabledAutos}</span>
              )}
            </div>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: '#1e1e26', margin: '8px 4px' }} />

        {/* Lists */}
        <div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', marginBottom: 4, cursor: 'pointer',
              color: '#64748b', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
            onClick={() => setListsExpanded(!listsExpanded)}
          >
            {listsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Lists
            <button
              onClick={(e) => { e.stopPropagation(); setShowNewList(true); }}
              style={{
                marginLeft: 'auto', background: 'none', border: 'none',
                color: '#475569', cursor: 'pointer', display: 'flex',
                padding: 0, borderRadius: 4,
              }}
            >
              <Plus size={14} />
            </button>
          </div>

          {listsExpanded && (
            <>
              {/* All Tasks */}
              <div
                className={`sidebar-item ${!activeListId && activeView !== 'automations' ? '' : ''}`}
                onClick={() => setActiveListId(null)}
                style={{ paddingLeft: 20 }}
              >
                <span style={{ fontSize: 14 }}>📋</span>
                <span style={{ flex: 1, fontSize: 13 }}>All Tasks</span>
                <span style={{ fontSize: 11, color: '#475569' }}>{useTaskStore.getState().tasks.length}</span>
              </div>

              {lists.map((list) => (
                <div
                  key={list.id}
                  className={`sidebar-item ${activeListId === list.id ? 'active' : ''}`}
                  onClick={() => { setActiveListId(list.id); setActiveView('board'); }}
                  style={{ paddingLeft: 20 }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: list.color, flexShrink: 0,
                    display: 'inline-block',
                  }} />
                  <span style={{ flex: 1, fontSize: 13 }}>{list.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete list "${list.name}"?`)) deleteList(list.id);
                    }}
                    style={{
                      background: 'none', border: 'none', color: 'transparent',
                      cursor: 'pointer', padding: 0, display: 'flex',
                      transition: 'color 0.1s',
                    }}
                    className="list-delete-btn"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}

              {/* New list form */}
              {showNewList && (
                <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    className="input-base"
                    style={{ fontSize: 13 }}
                    placeholder="List name..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddList(); if (e.key === 'Escape') setShowNewList(false); }}
                    autoFocus
                  />
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {LIST_COLORS.map((c) => (
                      <div
                        key={c}
                        onClick={() => setNewListColor(c)}
                        style={{
                          width: 18, height: 18, borderRadius: '50%',
                          background: c, cursor: 'pointer',
                          border: newListColor === c ? '2px solid white' : '2px solid transparent',
                          transition: 'transform 0.1s',
                          transform: newListColor === c ? 'scale(1.2)' : 'scale(1)',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn-primary" style={{ flex: 1, padding: '5px 10px', fontSize: 12 }} onClick={handleAddList}>Add</button>
                    <button className="btn-ghost" style={{ flex: 1, padding: '5px 10px', fontSize: 12 }} onClick={() => setShowNewList(false)}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid #1e1e26' }}>
        <div className="sidebar-item">
          <Settings size={16} />
          <span style={{ fontSize: 13 }}>Settings</span>
        </div>
      </div>

      <style>{`
        .sidebar-item:hover .list-delete-btn { color: #64748b !important; }
      `}</style>
    </aside>
  );
}
