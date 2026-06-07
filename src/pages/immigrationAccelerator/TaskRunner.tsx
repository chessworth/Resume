// src/features/immigration/TaskRunner.tsx
import React, { useState } from 'react';
import { Task } from './types';

interface Props {
  initialTasks: Task[];
  // Updated to handle both checking and unchecking from the persistent list
  onTaskToggle: (taskId: string, currentStatus: boolean) => Promise<void>;
}

const TaskRunner: React.FC<Props> = ({ initialTasks, onTaskToggle }) => {
  // 1. Full list for the persistent checklist view below
  const [allTasks, setAllTasks] = useState<Task[]>(initialTasks);
  
  // 2. Local session queue for the runner (initialized with ONLY incomplete tasks)
  const [queue, setQueue] = useState<Task[]>(initialTasks.filter(t => !t.is_completed));
  
  const [isProcessing, setIsProcessing] = useState(false);

  // --- RUNNER ACTION ---
  const handleCompleteRunner = async () => {
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    const completedTask = queue[0];

    try {
      // Tell the parent (and Netlify) the task is done (passing current status: false)
      await onTaskToggle(completedTask.id, false);
      
      // Remove from the local session queue
      setQueue(prev => prev.slice(1));
      
      // Update the persistent list below
      setAllTasks(prev => prev.map(t => 
        t.id === completedTask.id ? { ...t, is_completed: true } : t
      ));
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RUNNER ACTION ---
  const handleSkip = () => {
    if (queue.length <= 1) return;

    setQueue(prev => {
      const [current, ...rest] = prev;
      return [...rest, current]; // Move current to the end of the local array
    });
  };

  // --- LIST ACTION ---
  const handleListToggle = async (taskId: string, currentStatus: boolean) => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const newStatus = !currentStatus;

    // 1. Optimistic update for the full list
    setAllTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, is_completed: newStatus } : t
    ));

    // 2. Sync the runner queue based on the action
    if (newStatus === true) {
      // Task was completed from the list: remove it from runner queue
      setQueue(prev => prev.filter(t => t.id !== taskId));
    } else {
      // Task was unchecked from the list: add it to the back of the runner queue
      const taskToAdd = allTasks.find(t => t.id === taskId);
      if (taskToAdd) {
        setQueue(prev => [...prev, { ...taskToAdd, is_completed: false }]);
      }
    }

    try {
      await onTaskToggle(taskId, newStatus);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      // Optional: Rollback state here if the fetch fails
    } finally {
      setIsProcessing(false);
    }
  };

  const currentTask = queue[0];

  return (
    <div className="task-runner-wrapper">
      
      {/* --- ACTIVE TASK RUNNER --- */}
      {queue.length === 0 ? (
        <div className="task-card-focus empty-state">
          <h3>Queue Clear</h3>
          <p>No pending tasks for this file.</p>
        </div>
      ) : (
        <div key={currentTask.id} className="task-runner-container">
          <div className="task-card-focus">
            <div className="task-header">
              <span className="task-count">Next Priority</span>
              <div className="session-indicator" title="Session-only order">⏱</div>
            </div>
            
            <h2>{currentTask.label}</h2>
            <p>{currentTask.description}</p>
            
            <div className="task-actions">
              <button 
                className="btn-skip" 
                onClick={handleSkip}
                disabled={queue.length <= 1 || isProcessing}
              >
                Skip for now
              </button>
              <button 
                className="btn-complete" 
                onClick={handleCompleteRunner}
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Mark Complete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PERSISTENT TASK LIST --- */}
      <section className="detail-section task-list-section" style={{ marginTop: '40px' }}>
        <div className="section-header">
          <h3 className="section-label">Full Task History</h3>
          <span className="completion-tracker">
            {allTasks.filter(t => t.is_completed).length} / {allTasks.length} Completed
          </span>
        </div>
        
        <div className="task-list">
          {allTasks.map(task => (
            <div 
              key={task.id} 
              className={`list-item ${task.is_completed ? 'is-completed' : ''}`}
            >
              <label className="checkbox-container">
                <input 
                  type="checkbox" 
                  checked={task.is_completed}
                  onChange={() => handleListToggle(task.id, task.is_completed)}
                  disabled={isProcessing}
                />
                <span className="checkmark"></span>
              </label>
              
              <div className="item-details">
                <span className="item-label">{task.label}</span>
                {task.description && <span className="item-desc">{task.description}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

    </div>
  );
};

export default TaskRunner;