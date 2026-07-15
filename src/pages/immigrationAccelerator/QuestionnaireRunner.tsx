// src/features/immigration/QuestionnaireRunner.tsx
import React, { useState, useEffect, useRef } from 'react';
import { FormSection, FormField } from './types';

interface QueuedField {
  sectionId: string;
  sectionTitle: string;
  field: FormField;
}

interface Props {
  sections: FormSection[];
  onSaveAnswer: (sectionId: string, fieldId: string, value: string | boolean | any[]) => Promise<void>; 
  onComplete: () => void; 
}

const QuestionnaireRunner: React.FC<Props> = ({ sections, onSaveAnswer, onComplete }) => {
  const [queue, setQueue] = useState<QueuedField[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [currentValue, setCurrentValue] = useState<string | boolean | any[]>('');

  // FIX 1: We use a ref to ensure the queue is only built ONCE when the component mounts.
  // This stops parent state updates from resetting your skipped items.
  const hasInitialized = useRef(false);

  // 1. Initialize the Queue
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const initialQueue: QueuedField[] = [];
    
    sections.filter(s => s.is_active).forEach(section => {
      section.fields.forEach(field => {
        // FIX 2: We no longer check if the array length is 0. 
        // If the user submitted [], we respect that as a completed "No history" answer.
        // It will only be queued if it is strictly null or undefined.
        const isAnswerEmpty = field.answer === null || field.answer === undefined || field.answer === '';

        if (isAnswerEmpty) {
          initialQueue.push({ 
            sectionId: section.id, 
            sectionTitle: section.title, 
            field 
          });
        }
      });
    });

    setQueue(initialQueue);
    
    if (initialQueue.length === 0) {
      onComplete();
    }
  }, [sections, onComplete]);

  // 2. Reset local input when queued field changes
  useEffect(() => {
    if (queue.length > 0) {
      const field = queue[0].field;
      if (field.type === 'repeater') {
        setCurrentValue(Array.isArray(field.answer) ? field.answer : []);
      } else {
        setCurrentValue(field.type === 'boolean' ? false : '');
      }
    }
  }, [queue]);

  // --- REPEATER STATE HANDLERS ---

  const addRepeaterEntry = () => {
    setCurrentValue(prev => Array.isArray(prev) ? [...prev, {}] : [{}]);
  };

  const removeRepeaterEntry = (indexToRemove: number) => {
    setCurrentValue(prev => {
      if (!Array.isArray(prev)) return prev;
      return prev.filter((_, index) => index !== indexToRemove);
    });
  };

  const updateRepeaterEntry = (index: number, subFieldId: string, value: string) => {
    setCurrentValue(prev => {
      if (!Array.isArray(prev)) return prev;
      const newArray = [...prev];
      newArray[index] = { ...newArray[index], [subFieldId]: value };
      return newArray;
    });
  };

  // --- STANDARD HANDLERS ---

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    if (queue.length <= 1) return;

    setQueue(prev => {
      const [current, ...rest] = prev;
      return [...rest, current]; 
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (queue.length === 0 || isProcessing) return;
    
    setIsProcessing(true);

    try {
      await onSaveAnswer(currentItem.sectionId, field.id, currentValue);
      
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

  if (queue.length === 0) return null;

  const currentItem = queue[0];
  const { field, sectionTitle } = currentItem;

  const isNextDisabled = isProcessing || (field.type !== 'repeater' && currentValue === '');

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

          {(field.type === 'text' || field.type === 'email') && (
            <div className="input-group">
              <input
                id={field.id}
                type={field.type}
                className="runner-input"
                value={currentValue as string}
                onChange={(e) => setCurrentValue(e.target.value)}
                disabled={isProcessing}
                placeholder={field.placeholder} 
                pattern={field.validation?.pattern} 
                title={field.validation?.message} 
                autoFocus
                required
              />
              {field.validation && (
                <span className="input-helper-text">{field.validation.message}</span>
              )}
            </div>
          )}

          {field.type === 'number' && (
            <div className="input-group">
              <input
                id={field.id}
                type="number"
                className="runner-input"
                value={currentValue as string}
                onChange={(e) => setCurrentValue(e.target.value)}
                disabled={isProcessing}
                placeholder={field.placeholder} 
                pattern={field.validation?.pattern} 
                title={field.validation?.message} 
                autoFocus
                required
              />
              {field.validation && (
                <span className="input-helper-text">{field.validation.message}</span>
              )}
            </div>
          )}

          {field.type === 'textarea' && (
            <div className="input-group">
              <textarea
                id={field.id}
                className="runner-input"
                value={currentValue as string}
                onChange={(e) => setCurrentValue(e.target.value)}
                disabled={isProcessing}
                placeholder={field.placeholder} 
                title={field.validation?.message} 
                autoFocus
                required
              />
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
            <select 
              className="stylized-select"
              required
              value={field.answer === true ? 'true' : field.answer === false ? 'false' : ''} 
              onChange={(e) => {
                setCurrentValue(e.target.value === 'true' ? true : e.target.value === 'false' ? false : '');
              }}
              disabled={isProcessing}
            >
              <option value="" disabled>Select Yes or No</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          )}
          {field.type === 'repeater' && Array.isArray(currentValue) && (
            <div className="repeater-container">
              {currentValue.map((entry, index) => (
                <div key={index} className="repeater-block">
                  <div className="repeater-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0 }}>Entry #{index + 1}</h4>
                    <button 
                      type="button" 
                      onClick={() => removeRepeaterEntry(index)}
                      className="btn-remove-repeater"
                    >
                      Remove
                    </button>
                  </div>
                  
                  {field.subFields?.map(subField => (
                    <div key={subField.id} className="input-group" style={{ marginBottom: '8px' }}>
                      <label style={{ display: 'block', fontSize: '0.9em', marginBottom: '4px' }}>
                        {subField.label}
                      </label>
                      <input 
                        type={subField.type === 'date' ? 'date' : 'text'} 
                        className="runner-input"
                        style={{ width: '100%', padding: '8px' }}
                        value={entry[subField.id] || ''} 
                        onChange={(e) => updateRepeaterEntry(index, subField.id, e.target.value)}
                        required
                      />
                    </div>
                  ))}
                </div>
              ))}

              <button 
                type="button"
                className="btn-add-repeater" 
                onClick={addRepeaterEntry}
              >
                {field.addButtonLabel || "+ Add Another"}
              </button>
            </div>
          )}

          <div className="runner-actions" style={{ marginTop: '24px' }}>
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
              disabled={isNextDisabled}
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