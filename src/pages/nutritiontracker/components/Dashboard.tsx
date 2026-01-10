
import React from 'react';
import { DailyStats, UserGoals, DailyLog } from '../types';

interface DashboardProps {
  stats: DailyStats;
  goals: UserGoals;
  onDeleteLog: (id: string) => void;
  onEditLog: (log: DailyLog) => void;
}

/**
 * Reusable Progress Bar component with custom labels and goal tracking.
 * @param {object} props - Label, current value, goal value, color and unit.
 */
const ProgressBar: React.FC<{ label: string, current: number, goal: number, color: string, unit: string }> = ({ label, current, goal, color, unit }) => {
  const percentage = Math.min((current / goal) * 100, 100);
  return (
    <div className="nt-progress-group">
      <div className="nt-progress-header">
        <span className="nt-progress-label">{label}</span>
        <span className="nt-progress-val">
          <span style={{color: 'var(--slate-900)'}}>{Math.round(current)}</span> / {goal}{unit}
        </span>
      </div>
      <div className="nt-progress-bar-bg">
        <div 
          className="nt-progress-bar-fill" 
          style={{ width: `${percentage}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
};

/**
 * Main summary component displaying the daily nutrition overview.
 * @param {DashboardProps} props - Stats, Goals, Delete and Edit handlers.
 */
const Dashboard: React.FC<DashboardProps> = ({ stats, goals, onDeleteLog, onEditLog }) => {
  const circleCircumference = 440;
  const dashOffset = circleCircumference - (Math.min(stats.totalCalories / goals.calories, 1) * circleCircumference);

  return (
    <div className="nt-fade-in">
      {/* Top Layout: Calories Ring + Macros Summary */}
      <div className="nt-dashboard-grid">
        {/* Calorie Ring Section */}
        
        <div className="nt-calories-card nt-card" style={{textAlign: 'center'}}>
          <span className="nt-progress-label">Daily Calories</span>
          <div className="nt-calorie-ring">
            <svg className="nt-ring-svg" viewBox="0 0 160 160">
              <circle className="nt-ring-bg" cx="80" cy="80" r="70" />
              <circle
                className="nt-ring-progress"
                cx="80"
                cy="80"
                r="70"
                strokeDasharray={circleCircumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
            <div className="nt-ring-text">
              <span className="nt-ring-val">{Math.round(stats.totalCalories)}</span>
              <span className="nt-ring-label">Goal {goals.calories}</span>
            </div>
          </div>
        </div>

        {/* Macros Bars Section */}
        <div className="nt-macros-card nt-card">
          <h3 style={{fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem'}}>Daily Macros</h3>
          <ProgressBar label="Protein" current={stats.totalProtein} goal={goals.protein} color="var(--primary)" unit="g" />
          <ProgressBar label="Carbohydrates" current={stats.totalCarbs} goal={goals.carbs} color="var(--secondary)" unit="g" />
          <ProgressBar label="Fats" current={stats.totalFat} goal={goals.fat} color="var(--accent)" unit="g" />
          <ProgressBar label="Fiber" current={stats.totalFiber} goal={goals.fiber} color="#0d9488" unit="g" />
        </div>
      </div>

      {/* Micronutrients Overview */}
      <div className="nt-card" style={{marginBottom: '1.5rem'}}>
        <h3 style={{fontSize: '1.25rem', fontWeight: 900, marginBottom: '1.5rem'}}>Micronutrients</h3>
        <div className="nt-micros-grid">
          <ProgressBar label="Vit C" current={stats.totalMicros.vitaminC} goal={goals.micros.vitaminC} color="#fb923c" unit="mg" />
          <ProgressBar label="Iron" current={stats.totalMicros.iron} goal={goals.micros.iron} color="#fb7185" unit="mg" />
          <ProgressBar label="Calcium" current={stats.totalMicros.calcium} goal={goals.micros.calcium} color="#818cf8" unit="mg" />
          <ProgressBar label="Potass" current={stats.totalMicros.potassium} goal={goals.micros.potassium} color="#22d3ee" unit="mg" />
          <ProgressBar label="Sodium" current={stats.totalMicros.sodium} goal={goals.micros.sodium} color="#94a3b8" unit="mg" />
        </div>
      </div>

      {/* History Log Section */}
      <div className="nt-card nt-history-card">
        <div className="nt-history-header">
          <h3 style={{fontSize: '0.875rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em'}}>Today's Log</h3>
          <span className="nt-badge" style={{background: 'white', border: '1px solid var(--slate-100)'}}>{stats.logs.length} items</span>
        </div>
        <div>
          {stats.logs.length === 0 ? (
            <div style={{padding: '3rem', textAlign: 'center', color: 'var(--slate-400)'}}>
              <p style={{fontStyle: 'italic', fontSize: '0.875rem'}}>No entries for today yet.</p>
            </div>
          ) : (
            stats.logs.map((log) => (
              <div key={log.id} className="nt-log-item">
                <div className="nt-log-info">
                  <div className="nt-log-avatar">{log.foodName.charAt(0)}</div>
                  <div>
                    <h4 style={{fontWeight: 900}}>{log.foodName}</h4>
                    <p style={{fontSize: '11px', color: 'var(--slate-400)', fontWeight: 700}}>
                      {log.quantityGrams}g &bull; <span style={{color: 'var(--primary)'}}>{Math.round(log.calculatedNutrients.calories)} kcal</span>
                    </p>
                  </div>
                </div>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                  <button onClick={() => onEditLog(log)} className="nt-btn-icon">
                    <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                  </button>
                  <button onClick={() => onDeleteLog(log.id)} className="nt-btn-icon" style={{color: 'var(--danger)'}}>
                    <svg style={{width: '20px', height: '20px'}} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
