import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FormSection, Document } from './types';
import './immigration.css';
import QuestionnaireRunner from './QuestionnaireRunner';
import ClientDocumentChecklist from './ClientDocumentChecklist';

const ClientIntake: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [sections, setSections] = useState<FormSection[]>([]);
  const [initialDocuments, setInitialDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isQueueActive, setIsQueueActive] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/.netlify/functions/get-public-form?token=${token}`);
        if (!res.ok) throw new Error('Invalid or expired link.');
        const data = await res.json();
        setSections(data.form);
        setInitialDocuments(data.documents);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchForm();
  }, [token]);

  const handleSaveAnswer = async (sectionId: string, fieldId: string, value: string | boolean | any[]) => {
    let updatedSections: FormSection[] = [];
    setSections(prev => {
      updatedSections = prev.map(section => {
        if (section.id !== sectionId) return section;
        return {
          ...section,
          fields: section.fields.map(field =>
            field.id === fieldId ? { ...field, answer: value } : field
          )
        };
      });
      return updatedSections;
    });
    return await saveProgress(undefined, updatedSections);
  };

  const handleInputChange = async (sectionId: string, fieldId: string, value: string | boolean | any[]) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        fields: section.fields.map(field => 
          field.id === fieldId ? { ...field, answer: value } : field
        )
      };
    }));
  };

  // --- REPEATER STATE HANDLERS ---
  
  const handleRepeaterAdd = (sectionId: string, fieldId: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        fields: section.fields.map(field => {
          if (field.id !== fieldId) return field;
          const currentArray = Array.isArray(field.answer) ? field.answer : [];
          return { ...field, answer: [...currentArray, {}] };
        })
      };
    }));
  };

  const handleRepeaterRemove = (sectionId: string, fieldId: string, indexToRemove: number) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        fields: section.fields.map(field => {
          if (field.id !== fieldId) return field;
          const currentArray = Array.isArray(field.answer) ? field.answer : [];
          return { ...field, answer: currentArray.filter((_, idx) => idx !== indexToRemove) };
        })
      };
    }));
  };

  const handleRepeaterChange = (sectionId: string, fieldId: string, index: number, subFieldId: string, value: string) => {
    setSections(prev => prev.map(section => {
      if (section.id !== sectionId) return section;
      return {
        ...section,
        fields: section.fields.map(field => {
          if (field.id !== fieldId) return field;
          const currentArray = Array.isArray(field.answer) ? [...field.answer] : [];
          if (currentArray[index]) {
            currentArray[index] = { ...currentArray[index], [subFieldId]: value };
          }
          return { ...field, answer: currentArray };
        })
      };
    }));
  };

  // --- SAVE LOGIC ---

  const saveProgress = async (event?: any, sectionsToSave?: FormSection[]) => {
    setSaving(true);
    try {
      const payloadSections = sectionsToSave ?? sections;
      await fetch('/.netlify/functions/update-public-form', {
        method: 'POST',
        body: JSON.stringify({ token, sections: payloadSections })
      });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (err) {
      alert('Failed to save progress. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="immigration-page">Loading your form...</div>;
  if (error) return <div className="immigration-page"><h3>Error</h3><p>{error}</p></div>;

  return (
    <div className="immigration-page public-intake">
      <div className="intake-header">
        <h2>Client Information Questionnaire</h2>
        <p>Please fill out the sections below. Your data is saved securely.</p>
      </div>

      <div className="client-intake-page">
        {isQueueActive ? (
          <QuestionnaireRunner 
            sections={sections} 
            onSaveAnswer={handleSaveAnswer} 
            onComplete={() => setIsQueueActive(false)} 
          />
        ) : ""}

        <div className="intake-form-container">
          {sections.filter(s => s.is_active).map(section => (
            <div key={section.id} className="intake-section">
              <h3>{section.title}</h3>
              <div className="fields-grid">
                {section.fields.map(field => (
                  <div key={field.id} className="form-group">
                    <label>{field.label}</label>
                    
                    {field.type === 'text' && (
                      <input 
                        type="text" 
                        value={field.answer as string || ''} 
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value)}
                      />
                    )}

                    {field.type === 'number' && (
                      <input 
                        type="number" 
                        value={field.answer as string || ''} 
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value)}
                      />
                    )}

                    {field.type === 'textarea' && (
                      <textarea 
                        value={field.answer as string || ''} 
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value)}
                      />
                    )}
                    
                    {field.type === 'date' && (
                      <input 
                        type="date" 
                        value={field.answer as string || ''} 
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value)}
                      />
                    )}

                    {field.type === 'boolean' && (
                      <select 
                        className="stylized-select"
                        required
                        /* This safely converts true/false/undefined to string values for the select UI */
                        value={field.answer === true ? 'true' : field.answer === false ? 'false' : ''} 
                        /* This converts the string back into a strict boolean for your state */
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value === 'true')}
                      >
                        <option value="" disabled>Select Yes or No</option>
                        <option value="true">Yes</option>
                        <option value="false">No</option>
                      </select>
                    )}

                    {field.type === 'select' && (
                      <select 
                        value={field.answer as string || ''} 
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value)}
                      >
                        {field.options?.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </select>
                    )}
                    
                    {field.type === 'email' && (
                      <input 
                        type="email" 
                        value={field.answer as string || ''} 
                        onChange={(e) => handleInputChange(section.id, field.id, e.target.value)}
                      />
                    )}
                    
                    {field.type === 'repeater' && (
                      <div className="repeater-container">
                        {(field.answer as any[] || []).map((item, index) => (
                          <div key={index} className="repeater-item">
                            <div className="repeater-header">
                              <h4>Entry #{index + 1}</h4>
                              <button 
                                type="button" 
                                className="btn-remove-repeater"
                                onClick={() => handleRepeaterRemove(section.id, field.id, index)}
                              >
                                Remove
                              </button>
                            </div>
                            {field.subFields?.map(subField => (
                              <div key={subField.id} className="form-group" style={{ marginBottom: '10px' }}>
                                <label style={{ display: 'block', marginBottom: '4px' }}>{subField.label}</label>
                                {(subField.type === 'text' || subField.type === 'date') && (
                                  <input 
                                    type={subField.type}
                                    className="runner-input" /* Reusing your existing input class */
                                    style={{ width: '100%', padding: '8px' }}
                                    value={item[subField.id] as string || ''}
                                    onChange={(e) => handleRepeaterChange(section.id, field.id, index, subField.id, e.target.value)}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        ))}
                        
                        <button 
                          type="button"
                          className="btn-add-repeater"
                          onClick={() => handleRepeaterAdd(section.id, field.id)}
                        >
                          {field.addButtonLabel || "+ Add Another"}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <ClientDocumentChecklist initialDocs={initialDocuments} />
        
      </div>

      <div className="intake-footer">
        <button 
          className="btn-primary" 
          onClick={saveProgress} 
          disabled={saving}
        >
          {saving ? 'Saving...' : showSuccess ? 'Saved ✓' : 'Save Progress'}
        </button>
      </div>
    </div>
  );
};

export default ClientIntake;