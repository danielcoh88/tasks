import { useState } from 'react';
import { useTaskStore } from './store/taskStore';
import type { Task, TaskStatus } from './types';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import BoardView from './components/Board/BoardView';
import ListView from './components/ListView/ListView';
import CalendarView from './components/Calendar/CalendarView';
import AutomationsView from './components/Automations/AutomationsView';
import TaskModal from './components/TaskModal/TaskModal';
import './index.css';

interface ModalState {
  isOpen: boolean;
  task?: Task | null;
  defaultStatus?: TaskStatus;
  defaultStartDate?: Date;
  defaultDate?: Date; // end date
}

export default function App() {
  const { activeView } = useTaskStore();
  const [modal, setModal] = useState<ModalState>({ isOpen: false });

  const openNewTask = (status?: TaskStatus, startDate?: Date, endDate?: Date) => {
    setModal({ isOpen: true, task: null, defaultStatus: status, defaultStartDate: startDate, defaultDate: endDate });
  };

  const openTask = (task: Task) => {
    setModal({ isOpen: true, task });
  };

  const closeModal = () => {
    setModal({ isOpen: false });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0f0f10' }}>
      <Sidebar />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeView !== 'automations' && (
          <Header onAddTask={() => openNewTask()} />
        )}

        {activeView === 'automations' && (
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid #1e1e26',
            background: '#141418',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#e2e8f0' }}>
              ⚡ Automations
            </h1>
            <span style={{ fontSize: 13, color: '#475569' }}>
              Automate repetitive workflows and actions
            </span>
          </div>
        )}

        <main style={{ flex: 1, overflow: 'hidden' }}>
          {activeView === 'board' && (
            <BoardView onTaskClick={openTask} onAddTask={openNewTask} />
          )}
          {activeView === 'list' && (
            <ListView onTaskClick={openTask} onAddTask={openNewTask} />
          )}
          {activeView === 'calendar' && (
            <CalendarView onTaskClick={openTask} onAddTask={(start, end) => openNewTask(undefined, start, end)} />
          )}
          {activeView === 'automations' && (
            <AutomationsView />
          )}
        </main>
      </div>

      {modal.isOpen && (
        <TaskModal
          task={modal.task}
          defaultStatus={modal.defaultStatus}
          defaultStartDate={modal.defaultStartDate}
          defaultDate={modal.defaultDate}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
