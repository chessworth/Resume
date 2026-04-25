// src/features/immigration/TaskRunner.tsx
import React, { useState } from 'react';
import { Task } from './types';

interface Props {
  initialTasks: Task[];
  onTaskComplete: (taskId: string) => Promise<void>;
}

const TaskRunner: React.FC<Props> = ({ initialTasks, onTaskComplete }) => {
  // Local state manages the "Session Queue"
  const [queue, setQueue] = useState<Task[]>(initialTasks);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleComplete = async () => {
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    const completedTask = queue[0];

    try {
      // Tell the parent (and thus Netlify/Supabase) the task is done
      await onTaskComplete(completedTask.id);
      
      // Remove from the local session queue
      setQueue(prev => prev.slice(1));
    } catch (err) {
      console.error("Failed to complete task:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkip = () => {
    if (queue.length <= 1) return;

    setQueue(prev => {
      const [current, ...rest] = prev;
      return [...rest, current]; // Move current to the end of the local array
    });
  };

  if (queue.length === 0) {
    return (
      <div className="task-card-focus empty-state">
        <h3>Queue Clear</h3>
        <p>No pending tasks for this file.</p>
      </div>
    );
  }

  const currentTask = queue[0];

  return (
    <div key={currentTask.id}>
        <div className="task-runner-container">
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
                    disabled={queue.length <= 1}
                >
                    Skip for now
                </button>
                <button 
                    className="btn-complete" 
                    onClick={handleComplete}
                    disabled={isProcessing}
                >
                    {isProcessing ? 'Saving...' : 'Mark Complete'}
                </button>
                </div>
            </div>
        </div>
    </div>
  );
};

export default TaskRunner;