
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { userService } from '../services/userService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserNinja, faUserAstronaut, faUserSecret, faRobot, faGhost, faDragon, faCat, faDog, faHippo, faPizzaSlice } from '@fortawesome/free-solid-svg-icons';
import { IconName, library } from '@fortawesome/fontawesome-svg-core';

interface AuthProps {
  onLoginSuccess: (user: UserProfile) => void;
}

const ICONS = [
  'user-ninja' as IconName, 'user-astronaut' as IconName, 'user-secret' as IconName, 'robot' as IconName, 
  'ghost' as IconName, 'dragon' as IconName, 'cat' as IconName, 'dog' as IconName, 'hippo' as IconName, 'pizza-slice' as IconName
];

library.add( 
  faUserNinja, faUserAstronaut, faUserSecret, faRobot, 
  faGhost, faDragon, faCat, faDog, faHippo, faPizzaSlice
);

const Auth: React.FC<AuthProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    icon: ICONS[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const user = await userService.login(formData.email);
        onLoginSuccess(user);
      } else {
        const user = await userService.signUp(formData);
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="nt-modal-overlay">
      <div className="nt-modal-content nt-fade-in" style={{ maxWidth: '400px' }}>
        <div className="nt-logo" style={{ justifyContent: 'center', marginBottom: '2rem' }}>
          <div className="nt-logo-icon">
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <h1 style={{ fontSize: '1.25rem' }}>Nutri<span className="highlight">Track</span></h1>
        </div>

        <h2 style={{ textAlign: 'center', fontWeight: 900, marginBottom: '0.5rem' }}>
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </h2>
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--slate-400)', marginBottom: '2rem' }}>
          {isLogin ? 'Log in to continue tracking your goals' : 'Join thousands of healthy trackers'}
        </p>

        {error && <div className="nt-badge" style={{ background: 'var(--danger-light)', color: 'var(--danger)', width: '100%', textAlign: 'center', marginBottom: '1rem', padding: '0.75rem' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="nt-form-group">
              <label className="nt-label">Full Name</label>
              <input 
                required 
                className="nt-input" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="nt-form-group">
            <label className="nt-label">Email Address</label>
            <input 
              required 
              type="email" 
              className="nt-input" 
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              placeholder="john@example.com"
            />
          </div>

          {!isLogin && (
            <>
              <div className="nt-form-group">
                <label className="nt-label">Phone (Optional)</label>
                <input 
                  className="nt-input" 
                  value={formData.phone} 
                  onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                  placeholder="+1 234 567 890"
                />
              </div>

              <div className="nt-form-group">
                <label className="nt-label">Select Avatar</label>
                <div className="nt-icon-grid">
                  {ICONS.map(icon => (
                    <button 
                      key={icon} 
                      type="button" 
                      onClick={() => setFormData({ ...formData, icon })}
                      className={`nt-icon-choice ${formData.icon === icon ? 'active' : ''}`}
                    >
                        <FontAwesomeIcon icon={['fas', icon]} />
                      <i className={`fa-solid ${icon}`}></i>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <button disabled={loading} className="nt-btn nt-btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>

        <button 
          className="nt-btn" 
          style={{ width: '100%', marginTop: '1rem', background: 'transparent', color: 'var(--slate-400)', fontSize: '0.875rem' }}
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
        </button>
      </div>
    </div>
  );
};

export default Auth;
