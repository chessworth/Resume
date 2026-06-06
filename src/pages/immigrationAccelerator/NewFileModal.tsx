// src/features/immigration/NewFileModal.tsx
import React, { useState } from 'react';
import { FileType, FileStatus } from './types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (url:string) => void; // Callback to trigger after successful creation, returns new file's URL
}

const NewFileModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<FileType>('Spousal Inland');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/.netlify/functions/create-file', {
        method: 'POST',
        body: JSON.stringify({ name, type, status: 'Initiated' as FileStatus }),
      });

      if (response.ok) {
        const result = await response.json();
        onSuccess(result.id);
        onClose();
        setName('');
      }
    } catch (err) {
      console.error("Creation failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Client File</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Client Name</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="e.g. John Doe"
            />
          </div>
          
          <div className="form-group">
            <label>Application Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as FileType)}>
              <option value="PGWP">PGWP</option>
              <option value="Study Permit">Study Permit</option>
              <option value="Visitor Visa">Visitor Visa</option>
              <option value="Super Visa">Super Visa</option>
              <option value="Spousal Inland">Spousal Inland</option>
              <option value="Spousal Outland">Spousal Outland</option>
              <option value="Express Entry">Express Entry</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewFileModal;