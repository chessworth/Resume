
import React, { useState } from 'react';
import { DailyLog, Macronutrients, Micronutrients } from '../types';

interface LogEditModalProps {
  log: DailyLog;
  onSave: (updatedLog: DailyLog) => void;
  onClose: () => void;
}

/**
 * Component for manually adjusting the nutritional values of a specific log entry.
 * Useful for correcting consumption records.
 * @param {LogEditModalProps} props - Log data, Save callback, and Close handler.
 */
const LogEditModal: React.FC<LogEditModalProps> = ({ log, onSave, onClose }) => {
  const [macroNutrients, setMacroNutrients] = useState<Macronutrients>({ ...log.calculatedNutrients });
  const [microNutrients, setMicroNutrients] = useState<Micronutrients>({ ...log.calculatedMicros });

  return (
    <div className="nt-modal-overlay">
      <div className="nt-modal-content nt-fade-in">
        <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '2rem'}}>
          <div>
            <h2 style={{fontSize: '1.5rem', fontWeight: 900}}>Adjust Entry</h2>
            <p className="nt-progress-label">{log.foodName}</p>
          </div>
          <button onClick={onClose} className="nt-btn-icon">
            <svg style={{width: '24px', height: '24px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
          {Object.entries(macroNutrients).map(([key, val]) => (
            <div key={key} className="nt-form-group">
              <label className="nt-label">{key}</label>
              <input 
                type="number" 
                value={val.toFixed(2)} 
                onChange={e => setMacroNutrients(p => ({...p, [key]: Number(e.target.value).toFixed(2)}))} 
                className="nt-input" 
              />
            </div>
          ))}
        </div>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '2rem'}}>
          {Object.entries(microNutrients).sort(([a], [b]) => a.localeCompare(b)).map(([key, val]) => (
            <div key={key} className="nt-form-group">
              <label className="nt-label">{key}</label>
              <input 
                type="number" 
                value={val.toFixed(2)} 
                onChange={e => setMicroNutrients(p => ({...p, [key]: Number(e.target.value).toFixed(2)}))} 
                className="nt-input" 
              />
            </div>
          ))}
        </div>

        <button onClick={() => onSave({...log, calculatedNutrients: macroNutrients, calculatedMicros: microNutrients})} className="nt-btn nt-btn-dark" style={{width: '100%'}}>Update Entry</button>
      </div>
    </div>
  );
};

export default LogEditModal;
