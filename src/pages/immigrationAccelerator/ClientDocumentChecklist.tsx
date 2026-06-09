// src/features/immigration/ClientDocumentChecklist.tsx
import React, { useState } from 'react';
import { Document } from './types';

interface Props {
  initialDocs: Document[];
}

const ClientDocumentChecklist: React.FC<Props> = ({ initialDocs }) => {
  // Use local state so the checkboxes feel instantly responsive
  const [documents, setDocuments] = useState<Document[]>(initialDocs);
  const [isSaving, setIsSaving] = useState(false);

  const handleToggle = async (docId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    // 1. Optimistic Update (instant UI feedback)
    setDocuments(prev => 
      prev.map(doc => doc.id === docId ? { ...doc, is_client_completed: newStatus } : doc)
    );

    setIsSaving(true);
    try {
      // 2. Save to the database
      // You'll need to create or update this endpoint to handle the toggle
      await fetch('/.netlify/functions/update-client-document-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: docId, 
          is_client_completed: newStatus 
        })
      });
    } catch (error) {
      console.error("Failed to update document status:", error);
      // 3. Revert if the save failed
      setDocuments(prev => 
        prev.map(doc => doc.id === docId ? { ...doc, is_client_completed: currentStatus } : doc)
      );
      alert("Failed to save your checklist progress. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="client-checklist-container">
      <div className="checklist-header">
        <h2>Document Checklist</h2>
        <p>You can check off the documents as you gather them for your own record keeping.</p>
      </div>

      <ul className="client-doc-list">
        {documents.map((doc) => (
          <li 
            key={doc.id} 
            className={`client-doc-item ${doc.is_client_completed ? 'completed' : ''}`}
          >
            <label className="checkbox-label">
              <input 
                type="checkbox"
                className="doc-checkbox"
                checked={doc.is_client_completed}
                onChange={() => handleToggle(doc.id, doc.is_client_completed)}
                disabled={isSaving}
              />
              <div className="doc-details">
                <span className="doc-name">{doc.label}</span>
                {doc.description && (
                  <span className="doc-description">{doc.description}</span>
                )}
              </div>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ClientDocumentChecklist;