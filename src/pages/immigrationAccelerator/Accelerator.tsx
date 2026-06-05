// src/features/immigration/ImmigrationDashboard.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { ImmigrationFile } from './types';
import NewFileModal from './NewFileModal';
import { useNavigate } from 'react-router-dom';
import './immigration.css';
import { RefreshCwIcon } from 'lucide-react';

const ImmigrationDashboard: React.FC = () => {
  const [files, setFiles] = useState<ImmigrationFile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFiles();
  }, []);

  const BASEURL = '/immigrationaccelerator';

  const fetchFiles = async () => {
  setLoading(true);
  try {
    // Calling your local Netlify service instead of Supabase directly
    const response = await fetch('/.netlify/functions/get-files');
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    setFiles(data as ImmigrationFile[]);
  } catch (error) {
    console.error('Error fetching files via Netlify:', error);
  } finally {
    setLoading(false);
  }
};

  const sortedFiles = useMemo(() => {
    return [...files]
      .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        // 1. Recently Edited (Descending) - Comparing ISO strings/Timestamps
        const dateA = new Date(a.last_edited).getTime();
        const dateB = new Date(b.last_edited).getTime();
        if (dateA !== dateB) return dateB - dateA;

        // 2. File Type
        if (a.type !== b.type) return a.type.localeCompare(b.type);

        // 3. Name
        return a.name.localeCompare(b.name);
      });
  }, [files, searchTerm]);

  if (loading) return <div className="loading-state">Loading your files...</div>;

  const handleCreationSuccess = () => {
    navigate(BASEURL); 
  };

  return (
    <div className="immigration-page">
      <header className="dashboard-header">
        <h1>Client Files</h1>
        <div className="header-controls">
          <input 
            type="text" 
            placeholder="Search by name..." 
            className="search-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Refresh button is handy for clerical apps */}
          <button onClick={fetchFiles} className="refresh-btn"><RefreshCwIcon /></button>
          <button 
            className="btn-primary main-cta" 
            onClick={() => setIsModalOpen(true)}
          >
            + New File
          </button>
        </div>
      </header>
      {/* The Modal Logic */}
      <NewFileModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={handleCreationSuccess}
      />
      <div className="file-list-container">
        {sortedFiles.length > 0 ? (
          sortedFiles.map(file => (
            <div key={file.id} className="file-card" onClick={() => navigate(`${BASEURL}/${file.id}`)}>
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-type">{file.type}</span>
              </div>
              <div className={`status-badge status-${file.status.replace(/\s+/g, '-').toLowerCase()}`}>
                {file.status}
              </div>
            </div>
          ))
        ) :
        searchTerm.length > 0 ? <div className="empty-state">No files found matching "{searchTerm}"</div>
        : (
          <div></div>
      )}
      </div>
    </div>
  );
};

export default ImmigrationDashboard;