// src/features/immigration/DocumentChecklist.tsx
import React, { useState } from 'react';
import { Document } from './types';

interface Props {
  fileId: string; // The ID of the file these docs belong to
  initialDocs: Document[];
}

const DocumentChecklist: React.FC<Props> = ({ fileId, initialDocs }) => {
  const [docs, setDocs] = useState<Document[]>(initialDocs);
  const [newDocLabel, setNewDocLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const toggleDoc = async (docId: string, currentState: boolean) => {
    // Optimistic Update
    setDocs(prev => prev.map(d => d.id === docId ? { ...d, is_completed: !currentState } : d));

    try {
      await fetch('/.netlify/functions/update-document', {
        method: 'POST',
        body: JSON.stringify({ id: docId, is_completed: !currentState })
      });
    } catch (err) {
      console.error("Failed to sync checkbox:", err);
      // Rollback on error if you want to be strict
      setDocs(prev => prev.map(d => d.id === docId ? { ...d, is_completed: currentState } : d));
    }
  };

  const addCustomDoc = async () => {
    if (!newDocLabel.trim() || isAdding) return;

    setIsAdding(true);
    try {
      const response = await fetch('/.netlify/functions/add-custom-document', {
        method: 'POST',
        // We pass the fileId here so the Netlify function knows which file to link it to
        body: JSON.stringify({ file_id: fileId, label: newDocLabel, category: 'custom' })
      });
      
      const addedDoc = await response.json();
      setDocs(prev => [...prev, addedDoc]);
      setNewDocLabel('');
    } catch (err) {
      console.error("Error adding custom document:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="doc-checklist-container">
      <div className="doc-section">
        {docs.map(doc => (
          <label key={doc.id} className={`doc-item ${doc.category}`}>
            <input 
              type="checkbox" 
              checked={doc.is_completed} 
              onChange={() => toggleDoc(doc.id, doc.is_completed)} 
            />
            <div className="doc-content">
              <span className="doc-label">{doc.label}</span>
              {doc.category !== 'required' && (
                <span className={`badge-${doc.category}`}>{doc.category}</span>
              )}
            </div>
          </label>
        ))}
      </div>

      <div className="add-custom-row">
        <input 
          type="text" 
          placeholder="Add extra document requirement..." 
          value={newDocLabel}
          onChange={(e) => setNewDocLabel(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addCustomDoc()}
        />
        <button onClick={addCustomDoc} disabled={isAdding}>
          {isAdding ? '...' : 'Add'}
        </button>
      </div>
    </div>
  );
};

export default DocumentChecklist;