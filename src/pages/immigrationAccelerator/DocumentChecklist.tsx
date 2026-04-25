// src/features/immigration/DocumentChecklist.tsx
import React, { useState } from 'react';
import { Document } from './types';
import './Accelerator.css';

interface Props {
  fileId: string;
  initialDocs: Document[];
}

const DocumentChecklist: React.FC<Props> = ({ fileId, initialDocs }) => {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [newDocLabel, setNewDocLabel] = useState('');

  const toggleDoc = async (id: string, currentState: boolean) => {
    // 1. Optimistic UI update
    setDocs(prev => prev.map(d => d.id === id ? { ...d, is_completed: !currentState } : d));

    // 2. Netlify Function Call (Placeholder)
    await fetch('/.netlify/functions/update-document', {
      method: 'POST',
      body: JSON.stringify({ id, is_completed: !currentState })
    });
  };

  const addCustomDoc = async () => {
    if (!newDocLabel.trim()) return;

    // Call Netlify function to insert custom doc
    const response = await fetch('/.netlify/functions/add-custom-document', {
      method: 'POST',
      body: JSON.stringify({ fileId, label: newDocLabel, category: 'custom' })
    });
    
    const addedDoc = await response.json();
    setDocs([...docs, addedDoc]);
    setNewDocLabel('');
  };

  return (
    <div className="doc-checklist-container">
      <h3>File Documents</h3>
      
      <div className="doc-section">
        {docs.map(doc => (
          <label key={doc.id} className={`doc-item ${doc.category}`}>
            <input 
              type="checkbox" 
              checked={doc.is_completed} 
              onChange={() => toggleDoc(doc.id, doc.is_completed)} 
            />
            <span className="doc-label">{doc.label}</span>
            {doc.category === 'optional' && <span className="badge-optional">Optional</span>}
          </label>
        ))}
      </div>

      <div className="add-custom-row">
        <input 
          type="text" 
          placeholder="Add special circumstance document..." 
          value={newDocLabel}
          onChange={(e) => setNewDocLabel(e.target.value)}
        />
        <button onClick={addCustomDoc}>Add</button>
      </div>
    </div>
  );
};

export default DocumentChecklist;