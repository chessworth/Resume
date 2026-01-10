
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
  const [nutrients, setNutrients] = useState<Macronutrients>({ ...log.calculatedNutrients });
  const [micros, setMicros] = useState<Micronutrients>({ 
    vitaminC: log.calculatedMicros?.vitaminC || 0,
    iron: log.calculatedMicros?.iron || 0,
    calcium: log.calculatedMicros?.calcium || 0,
    potassium: log.calculatedMicros?.potassium || 0,
    sodium: log.calculatedMicros?.sodium || 0,
  });

  /**
   * Finalizes the log edits and sends them to the parent.
   */
  const handleUpdate = () => {
    onSave({
      ...log,
      calculatedNutrients: nutrients,
      calculatedMicros: micros
    });
  };

  return (
    <div className="nt-modal-overlay">
      <div className="nt-modal-content nt-fade-in max-w-lg">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Edit Log</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{log.foodName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="space-y-10">
          <div className="space-y-6">
            <h3 className="nt-badge bg-emerald-50 text-emerald-700">Calculated Macros</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(nutrients).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                  <input
                    type="number"
                    value={nutrients[key as keyof Macronutrients]}
                    onChange={e => setNutrients(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="nt-input !py-2 !text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="nt-badge bg-blue-50 text-blue-700">Calculated Micros</h3>
            <div className="grid grid-cols-3 gap-3">
              {Object.keys(micros).map((key) => (
                <div key={key} className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{key}</label>
                  <input
                    type="number"
                    value={micros[key as keyof Micronutrients]}
                    onChange={e => setMicros(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                    className="nt-input !py-2 !text-slate-900"
                  />
                </div>
              ))}
            </div>
          </div>

          <button onClick={handleUpdate} className="nt-btn-dark w-full">Update Record</button>
        </div>
      </div>
    </div>
  );
};

export default LogEditModal;
