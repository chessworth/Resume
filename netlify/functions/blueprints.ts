// netlify/functions/blueprints.ts

export interface BlueprintItem {
  label: string;
  category?: 'required' | 'optional';
  description?: string;
}

export interface FileBlueprint {
  documents: BlueprintItem[];
  tasks: BlueprintItem[];
}

export const BLUEPRINTS: Record<string, FileBlueprint> = {
  'Spousal Inland': {
    documents: [
      // REQUIRED (The 20 hard-coded)
      { label: 'IMM 1344: Application to Sponsor', category: 'required' },
      { label: 'IMM 5285: Relationship Questionnaire', category: 'required' },
      { label: 'Marriage Certificate', category: 'required' },
      // ... keep going until 20
      
      // OPTIONAL (The 5 standard extras)
      { label: 'Joint Bank Account Statements', category: 'optional' },
      { label: 'Letters of Support from Family', category: 'optional' },
    ],
    tasks: [
      { label: 'Review Retainer', description: 'Confirm signed copy is uploaded to folder.' },
      { label: 'Order Police Clearances', description: 'Advise client on country-specific instructions.' },
      // ... keep going until 10
    ]
  },
  'Spousal Outland': {
    documents: [],
    tasks: []
  }
};