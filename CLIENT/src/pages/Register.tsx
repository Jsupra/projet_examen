import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './Auth.css';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    name_display: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 5) strength += 25;
    if (pass.match(/[a-z]+/)) strength += 25;
    if (pass.match(/[A-Z]+/)) strength += 25;
    if (pass.match(/[0-9]+/)) strength += 25;
    return strength;
  };

  const strength = getPasswordStrength(formData.password);
  const strengthColor = strength < 50 ? 'var(--danger-color)' : strength < 100 ? 'var(--warning-color)' : 'var(--success-color)';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', {
        username: formData.username,
        name_display: formData.name_display,
        email: formData.email,
        password: formData.password
      });
      
      // Auto redirect to login
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-panel fade-in">
        <div className="auth-logo">
          <span className="logo-icon">DS</span>
          <span>Digital Solutions</span>
        </div>
        <h1 className="auth-title">Inscription</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="input-label" htmlFor="name_display">Nom Complet</label>
            <input
              id="name_display"
              type="text"
              className="input-field"
              value={formData.name_display}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="username">Nom d'utilisateur</label>
            <input
              id="username"
              type="text"
              className="input-field"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input-field"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="input-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            {formData.password && (
              <div className="password-strength">
                <div 
                  className="strength-bar" 
                  style={{ width: `${strength}%`, backgroundColor: strengthColor }}
                ></div>
              </div>
            )}
          </div>
          <div>
            <label className="input-label" htmlFor="confirmPassword">Confirmer le mot de passe</label>
            <input
              id="confirmPassword"
              type="password"
              className="input-field"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>
        
        <div className="auth-footer">
          Déjà un compte ? <Link to="/login" className="auth-link">Se connecter</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
