// src/features/immigration/FileDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TaskRunner from './TaskRunner';
import DocumentChecklist from './DocumentChecklist';
import { ImmigrationFile, Task, Document, FileStatus } from './types';
import './immigration.css';

const FileDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [file, setFile] = useState<ImmigrationFile | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFullFileData = async () => {
      try {
        const response = await fetch(`/.netlify/functions/get-file-detail?id=${id}`);
        const data = await response.json();
        
        setFile(data.file);
        // Only pass incomplete tasks to the runner
        setTasks(data.tasks.filter((t: Task) => !t.is_completed));
        setDocs(data.documents);
      } catch (err) {
        console.error("Error loading file detail:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchFullFileData();
  }, [id]);

  const handleTaskComplete = async (taskId: string) => {
    // Netlify call to update DB
    await fetch('/.netlify/functions/update-task', {
      method: 'POST',
      body: JSON.stringify({ id: taskId, is_completed: true })
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
        <TaskRunner initialTasks={tasks} onTaskComplete={handleTaskComplete} />
      </section>

      <section className="detail-section">
        <h3 className="section-label">Document Tracking</h3>
        <DocumentChecklist fileId={file.id} initialDocs={docs} />
      </section>
    </div>
  );
};

export default FileDetail;