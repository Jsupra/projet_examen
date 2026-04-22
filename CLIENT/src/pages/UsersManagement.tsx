import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { UserCog, Shield, User as UserIcon, X, FolderKanban, ExternalLink, Loader2 } from 'lucide-react';
import Modal from '../components/Modal';
import './UsersManagement.css';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'Membre';
  name_display: string;
}

interface UserProject {
  id: string;
  title: string;
  description: string;
  created_at: string;
  total_tasks: number;
  completed_tasks: number;
}

const UsersManagement = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Drawer state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/all_users');
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (response.data && Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setError("Erreur lors de la récupération des utilisateurs. Êtes-vous admin ?");
    } finally {
      setLoading(false);
    }
  };

  const openUserDrawer = async (user: User) => {
    setSelectedUser(user);
    setUserProjects([]);
    setProjectsLoading(true);
    try {
      const res = await api.get(`/users/${user.id}/projects`);
      setUserProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setProjectsLoading(false);
    }
  };

  const toggleRole = async (userId: string, currentRole: string) => {
    const normalizedRole = currentRole?.toLowerCase();
    const newRole = (normalizedRole === 'admin') ? 'Membre' : 'admin';
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
      if (selectedUser?.id === userId) setSelectedUser(prev => prev ? { ...prev, role: newRole as any } : null);
      setModal({ isOpen: true, title: 'Succès', message: `L'utilisateur est maintenant ${newRole === 'admin' ? 'Administrateur' : 'Membre'}.`, type: 'success' });
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Erreur', message: err.response?.data?.error || 'Impossible de changer le rôle.', type: 'error' });
    }
  };

  if (!currentUser) return <div className="loading-state">Vérification des permissions...</div>;
  if (currentUser.role !== 'admin') return <div className="error-message">Accès réservé aux administrateurs.</div>;

  return (
    <div className="users-mgmt fade-in">
      <header className="page-header">
        <div>
          <h1>Gestion des Utilisateurs</h1>
          <p className="text-secondary">Cliquez sur un utilisateur pour voir ses projets.</p>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <div className="users-table-container glass-panel">
        <table className="users-table">
          <thead>
            <tr>
              <th>Utilisateur</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Projets</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(users) && users.length > 0 ? (
              users.map(u => (
                <tr
                  key={u.id}
                  className={`user-row ${selectedUser?.id === u.id ? 'active' : ''}`}
                  onClick={() => openUserDrawer(u)}
                >
                  <td>
                    <div className="user-info-cell">
                      <div className="avatar small-avatar">{u.username?.charAt(0).toUpperCase() || '?'}</div>
                      <div>
                        <div className="font-bold">{u.name_display || u.username || 'Sans nom'}</div>
                        <div className="text-xs text-secondary">@{u.username || 'inconnu'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-inprogress' : 'badge-todo'}`}>
                      {u.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                      {u.role?.toUpperCase() || 'MEMBER'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); openUserDrawer(u); }}>
                      <FolderKanban size={15} /> Voir les projets
                    </button>
                  </td>
                  <td onClick={e => e.stopPropagation()}>
                    {u.id !== currentUser.id && (
                      <button className="btn btn-secondary btn-sm" onClick={() => toggleRole(u.id, u.role)}>
                        <UserCog size={16} />
                        {u.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center" style={{ padding: '2rem' }}>
                  {loading ? 'Chargement...' : 'Aucun utilisateur trouvé.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* User Projects Drawer */}
      {selectedUser && (
        <div className="drawer-overlay" onClick={() => setSelectedUser(null)}>
          <div className="drawer glass-panel open" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <div className="user-drawer-meta">
                  <div className="avatar small-avatar" style={{ width: '44px', height: '44px', fontSize: '1.1rem' }}>
                    {selectedUser.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 style={{ marginBottom: '0.15rem' }}>{selectedUser.name_display || selectedUser.username}</h2>
                    <span className={`badge ${selectedUser.role === 'admin' ? 'badge-inprogress' : 'badge-todo'}`} style={{ fontSize: '0.7rem' }}>
                      {selectedUser.role}
                    </span>
                  </div>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>{selectedUser.email}</p>
              </div>
              <button className="icon-btn" onClick={() => setSelectedUser(null)}><X size={24} /></button>
            </div>

            <div className="drawer-body">
              <h3 style={{ marginBottom: '1.25rem', fontWeight: 800 }}>
                Projets ({userProjects.length})
              </h3>

              {projectsLoading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                  <Loader2 className="spinner" size={36} />
                </div>
              ) : userProjects.length === 0 ? (
                <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <FolderKanban size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                  <p>Aucun projet pour cet utilisateur.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {userProjects.map(p => {
                    const progress = Number(p.total_tasks) > 0
                      ? Math.round((Number(p.completed_tasks) / Number(p.total_tasks)) * 100)
                      : 0;
                    return (
                      <div key={p.id} className="glass-panel user-project-card">
                        <div className="user-project-card-header">
                          <div className="project-icon" style={{ width: '36px', height: '36px' }}>
                            <FolderKanban size={18} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.title}
                            </div>
                            <div className="text-secondary" style={{ fontSize: '0.78rem' }}>
                              {new Date(p.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Link to={`/projects/${p.id}`} className="icon-btn" title="Ouvrir le projet" onClick={() => setSelectedUser(null)}>
                            <ExternalLink size={16} />
                          </Link>
                        </div>

                        <div className="progress-info" style={{ marginTop: '0.75rem', marginBottom: '0.4rem' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 700 }}>
                            {p.completed_tasks}/{p.total_tasks} tâches
                          </span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800 }}>{progress}%</span>
                        </div>
                        <div className="progress-bar-bg">
                          <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {selectedUser && selectedUser.id !== currentUser.id && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ width: '100%' }}
                    onClick={() => toggleRole(selectedUser.id, selectedUser.role)}
                  >
                    <UserCog size={18} />
                    {selectedUser.role === 'admin' ? 'Rétrograder en Membre' : 'Promouvoir en Admin'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
      />
    </div>
  );
};

export default UsersManagement;
