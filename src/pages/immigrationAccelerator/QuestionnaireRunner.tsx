// src/features/immigration/QuestionnaireRunner.tsx
import React, { useState, useEffect } from 'react';
import { FormSection, FormField } from './types';

interface QueuedField {
  sectionId: string;
  sectionTitle: string;
  field: FormField;
}

interface Props {
  sections: FormSection[];
  onSaveAnswer: (sectionId: string, fieldId: string, answer: string | boolean) => void;
  onComplete: () => void; // Called when the queue is entirely empty
}

const QuestionnaireRunner: React.FC<Props> = ({ sections, onSaveAnswer, onComplete }) => {
  const [queue, setQueue] = useState<QueuedField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Local state for the currently displayed input
  const [currentValue, setCurrentValue] = useState<string | boolean>('');

  // 1. Initialize the Queue
  useEffect(() => {
    const initialQueue: QueuedField[] = [];
    
    sections.filter(s => s.is_active).forEach(section => {
      section.fields.forEach(field => {
        // If the answer is null or an empty string, add it to the queue
        if (field.answer === null || field.answer === '') {
          initialQueue.push({ 
            sectionId: section.id, 
            sectionTitle: section.title, 
            field 
          });
        }
      });
    });

    setQueue(initialQueue);
    
    // If there's nothing to answer, immediately trigger the completion callback
    if (initialQueue.length === 0) {
      onComplete();
    }
  }, [sections, onComplete]);

  // 2. Reset the local input whenever the current queued field changes
  useEffect(() => {
    if (queue.length > 0) {
      const fieldType = queue[0].field.type;
      setCurrentValue(fieldType === 'boolean' ? false : '');
    }
  }, [queue]);

  // 3. Handlers
  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    if (queue.length <= 1) return;

    setQueue(prev => {
      const [current, ...rest] = prev;
      return [...rest, current]; // Move to the back of the line
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    const current = queue[0];

    try {
      // Send the update to the parent / database
      onSaveAnswer(current.sectionId, current.field.id, currentValue);
      
      // Remove from queue
      const nextQueue = queue.slice(1);
      setQueue(nextQueue);
      
      if (nextQueue.length === 0) {
        onComplete();
      }
    } catch (err) {
      console.error("Failed to save answer:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  // If the queue is empty, render nothing (the parent will handle showing the full form)
  if (queue.length === 0) return null;

  const currentItem = queue[0];
  const { field, sectionTitle } = currentItem;

  return (
    <div className="questionnaire-runner-overlay">
      <div className="questionnaire-runner-card">
        
        <div className="runner-header">
          <span className="section-badge">{sectionTitle}</span>
          <span className="queue-count">{queue.length} questions remaining</span>
        </div>

        <form onSubmit={handleSubmit} className="runner-body">
          <label htmlFor={field.id} className="question-label">
            {field.label}
          </label>

          {/* Render the appropriate input based on type */}
          {(field.type === 'text' || field.type === 'email') && (
            <div className="input-group">
              <input
                id={field.id}
                type={field.type}
                className="runner-input"
                value={currentValue as string}
                onChange={(e) => setCurrentValue(e.target.value)}
                disabled={isProcessing}
                placeholder={field.placeholder} // <-- Added placeholder
                pattern={field.validation?.pattern} // <-- Added validation pattern
                title={field.validation?.message} // <-- Added error message
                autoFocus
                required
              />
              {/* Optional: Render the requirement as helper text below the input */}
              {field.validation && (
                <span className="input-helper-text">{field.validation.message}</span>
              )}
            </div>
          )}
          {field.type === 'date' && (
            <input
              id={field.id}
              type="date"
              className="runner-input"
              value={currentValue as string}
              onChange={(e) => setCurrentValue(e.target.value)}
              disabled={isProcessing}
              required
            />
          )}

          {/* Add select/boolean handling here if needed */}
          {field.type === 'select' && (
            <select
              id={field.id}
              className="runner-input"
              value={currentValue as string}
              onChange={(e) => setCurrentValue(e.target.value)}
              disabled={isProcessing}
              required
            >
              <option value="">Select an option</option>
              {field.options?.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}
          {field.type === 'boolean' && (
            <div className="input-group">
              <label className="form-check-label" htmlFor={field.id}>
                {field.label}
              </label>
              <input
                id={field.id}
                type="checkbox"
                className="runner-input"
                checked={currentValue as boolean}
                onChange={(e) => setCurrentValue(e.target.checked)}
                disabled={isProcessing}
              />
            </div>
          )}

          <div className="runner-actions">
            <button 
              type="button" 
              className="btn-skip" 
              onClick={handleSkip}
              disabled={queue.length <= 1 || isProcessing}
            >
              Skip for now
            </button>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isProcessing || currentValue === ''}
            >
              {isProcessing ? 'Saving...' : 'Next'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default QuestionnaireRunner;