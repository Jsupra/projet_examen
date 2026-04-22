import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import './Auth.css';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { identifier, password });
      
      // We need to fetch the user profile right after login because the login endpoint might only return the token
      localStorage.setItem('accessToken', response.data.accessToken);
      const userRes = await api.get('/users/profile');
      
      login(response.data.accessToken, userRes.data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la connexion');
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
        <h1 className="auth-title">Connexion</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <label className="input-label" htmlFor="identifier">Email ou Nom d'utilisateur</label>
            <input
              id="identifier"
              type="text"
              className="input-field"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="input-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>
        
        <div className="auth-footer">
          Pas encore de compte ? <Link to="/register" className="auth-link">S'inscrire</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
