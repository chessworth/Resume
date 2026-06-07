// src/features/immigration/FileDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskRunner from './TaskRunner';
import DocumentChecklist from './DocumentChecklist';
import { ImmigrationFile, Task, Document, FileStatus, ClientForm } from './types';
import './immigration.css';

const CopyableAnswer: React.FC<{ answer: string | boolean | null }> = ({ answer }) => {
  const [copied, setCopied] = useState(false);
  
  // Format the display text if it's empty
  const displayValue = !answer ? 'Not answered' : answer.toString();

  const handleCopy = () => {
    if (!answer) return; // Prevent copying "Not answered"
    navigator.clipboard.writeText(displayValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 1000); // Hide after 1 second
  };

  return (
    <div className="copyable-wrapper">
      <button 
        className={`copyable-answer-btn ${!answer ? 'empty' : ''}`}
        onClick={handleCopy}
        disabled={!answer}
        title={answer ? "Click to copy" : ""}
      >
        {displayValue}
      </button>
      {copied && <span className="copied-tooltip">(copied)</span>}
    </div>
  );
};

const FileDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<ImmigrationFile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientForm, setClientForm] = useState<ClientForm | null>(null);

  useEffect(() => {
    const fetchFullFileData = async () => {
      try {
        const response = await fetch(`/.netlify/functions/get-file-detail?id=${id}`);
        const data = await response.json();
        
        if (data.file) setFile(data.file);
        if (data.tasks) setTasks(data.tasks);
        if (data.documents) setDocs(data.documents);
        if (data.clientForm) setClientForm(data.clientForm);
      } catch (err) {
        console.error("Error loading file detail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFullFileData();
  }, [id]);

  const toggleFormSection = async (sectionId: string, currentStatus: boolean) => {
    if (!clientForm) return;

    const updatedSections = clientForm.sections.map(sec => 
      sec.id === sectionId ? { ...sec, is_active: !currentStatus } : sec
    );

    // Optimistic UI update
    setClientForm({ ...clientForm, sections: updatedSections });

    try {
      await fetch('/.netlify/functions/update-form-sections', {
        method: 'POST',
        body: JSON.stringify({ form_id: clientForm.id, sections: updatedSections })
      });
    } catch (err) {
      console.error("Failed to update sections:", err);
      // Rollback on fail
      setClientForm({ ...clientForm, sections: clientForm.sections });
    }
  };

  const handleTaskComplete = async (taskId: string, newStatus: boolean) => {
    // Netlify call to update DB
    await fetch('/.netlify/functions/update-task', {
      method: 'POST',
      body: JSON.stringify({ id: taskId, is_completed: newStatus })
    });
    // TaskRunner internal state handles the local removal, 
    // but we update parent state to keep it in sync
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  if (loading) return <div className="loading-state">Accessing file...</div>;
  if (!file) return <div>File not found.</div>;

  const handleStatusChange = async (newStatus: FileStatus) => {
  if (!file) return;
  
  // Optimistic UI
  const oldStatus = file.status;
  setFile({ ...file, status: newStatus });

  try {
        await fetch('/.netlify/functions/update-file-status', {
        method: 'POST',
        body: JSON.stringify({ id: file.id, status: newStatus })
        });
    } catch (err) {
        setFile({ ...file, status: oldStatus }); // Rollback
        console.error("Status update failed", err);
    }
    };

  return (
    <div className="immigration-page detail-view">
      <button className="btn-back" onClick={() => navigate(-1)}>← Back to Dashboard</button>
      
      <header className="file-header">
        <div>
          <h1>{file.name}</h1>
          <span className="file-type-tag">{file.type}</span>
        </div>
        <div className={`status-pill status-${file.status.toLowerCase().replace(/ /g, '-')}`}>
          {file.status}
        </div>
      </header>

      <select 
        className={`status-selector status-${file.status.toLowerCase().replace(/ /g, '-')}`}
        value={file.status}
        onChange={(e) => handleStatusChange(e.target.value as FileStatus)}
        >
        <option value="Initiated">Initiated</option>
        <option value="Retainer Signed">Retainer Signed</option>
        <option value="Pendency Sent">Pendency Sent</option>
        <option value="Waiting for Signatures">Waiting for Signatures</option>
        <option value="Filed">Filed</option>
      </select>

      <section className="detail-section">
        <h3 className="section-label">Active Workflow</h3>
        <TaskRunner initialTasks={tasks} onTaskToggle={handleTaskComplete} />
      </section>

      {clientForm && (
        <section className="detail-section form-manager-section">
          <h3 className="section-label">Client Intake Form</h3>
          
          <div className="share-link-box">
            <span className="link-label">Secure Client Link:</span>
            <input 
              type="text" 
              readOnly 
              value={`${window.location.origin}/intake/${clientForm.share_token}`} 
            />
            <button 
              className="btn-secondary"
              onClick={() => navigator.clipboard.writeText(`${window.location.origin}/intake/${clientForm.share_token}`)}
            >
              Copy Link
            </button>
          </div>

          <div className="form-sections-list">
            <h4 className="section-label form-sections-label">Manage Form Sections</h4>
            {clientForm.sections.map(section => (
              <div key={section.id} className={`form-section-item ${section.is_active ? 'active' : 'inactive'}`}>
                <div className="section-info">
                  <strong>{section.title}</strong>
                  <span className="field-count">{section.fields.length} questions</span>
                  <button 
                    className={section.is_active ? 'btn-remove' : 'btn-add'}
                    onClick={() => toggleFormSection(section.id, section.is_active)}
                  >
                    {section.is_active ? 'Remove' : 'Add Section'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="client-answers-view">
            <h4 className="answers-title">Review Client Answers</h4>
            
            {clientForm.sections.filter(s => s.is_active).map(section => (
              <div key={section.id} className="answer-section">
                <h5>{section.title}</h5>
                <div className="answer-grid">
                  {section.fields.map(field => (
                    <div key={field.id} className="answer-field">
                      <span className="field-label">{field.label}</span>
                      <CopyableAnswer answer={field.answer} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="detail-section">
        <h3 className="section-label">Document Tracking</h3>
        <DocumentChecklist fileId={file.id} initialDocs={docs} />
      </section>
    </div>
  );
};

export default FileDetail;