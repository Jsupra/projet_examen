import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { 
  Plus, UserPlus, Clock, MessageSquare, 
  GripVertical, X, Send, Check, Loader2, Calendar, MoreVertical, SortAsc
} from 'lucide-react';
import Modal from '../components/Modal';
import { createPortal } from 'react-dom';
import './Kanban.css';
import '../styles/Modals.css';

interface Comment { id: string; content: string; created_at: string; username: string; }
interface Task { id: string; title: string; description: string; statut: 'A faire' | 'En cours' | 'Termine'; echeance: string; assigned_to: string; assigned_name?: string; project_id: string; }
interface ProjectDetails { owner_id: any; owner: any; id: string; title: string; description: string; tasks: Task[]; members: any[]; }

const COLUMNS = [
  { id: 'A faire', title: 'À faire' },
  { id: 'En cours', title: 'En cours' },
  { id: 'Termine', title: 'Terminé' }
];

const ProjectDetails = () => {
  const { id: projectId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { socket } = useSocket();
  
  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [newTask, setNewTask] = useState({ title: '', description: '', assigned_to: '', echeance: '' });
  const [searchUser, setSearchUser] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [modal, setModal] = useState({ isOpen: false, title: '', message: '', type: 'info' as 'info' | 'success' | 'error' });
  const [assignSearch, setAssignSearch] = useState('');
  const [showAssignList, setShowAssignList] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState('created_at');
  const [activeTaskMenu, setActiveTaskMenu] = useState<string | null>(null);
  const [stats, setStats] = useState<{ total_tasks: number; todo_count: number; doing_count: number; done_count: number; progress_percentage: number } | null>(null);

  useEffect(() => { fetchProjectDetails(); }, [projectId]);

  useEffect(() => {
    if (!socket || !projectId) return;
    socket.emit('joinProject', projectId);
    socket.on('task-updated', (data) => {
      setTasks(prev => prev.map(t => t.id === data.taskId ? { ...t, statut: data.newStatus } : t));
    });
    socket.on('new-comment', (data) => {
      if (selectedTask?.id === data.taskId) setComments(prev => [...prev, data.comment]);
    });
    return () => { socket.off('task-updated'); socket.off('new-comment'); };
  }, [socket, projectId, selectedTask?.id]);

  useEffect(() => {
    if (selectedTask?.id) {
      fetchComments(selectedTask.id);
    } else {
      setComments([]);
    }
  }, [selectedTask?.id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await api.get(`/projects/${projectId}`);
      setProject(response.data);
      setTasks(response.data.tasks || []);
    } catch (error) { navigate('/projects'); } 
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/stats`);
      setStats(res.data);
    } catch (err) { console.error('Stats error:', err); }
  };

  useEffect(() => { fetchStats(); }, [projectId]);

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      await api.patch(`/projects/tasks/${taskId}/status`, { statut: newStatus });
      setTasks(tasks.map(t => t.id === taskId ? { ...t, statut: newStatus as any } : t));
      if (selectedTask?.id === taskId) setSelectedTask({ ...selectedTask, statut: newStatus as any });
    } catch (err) { setModal({ isOpen: true, title: 'Erreur', message: 'Mise à jour échouée.', type: 'error' }); }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    try {
      await api.delete(`/projects/tasks/${taskId}`);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      setActiveTaskMenu(null);
      fetchStats();
    } catch (err: any) {
      setModal({ isOpen: true, title: 'Erreur', message: err.response?.data?.error || 'Impossible de supprimer.', type: 'error' });
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/history`);
      setHistory(res.data);
      setShowHistory(true);
    } catch (err) { console.error(err); }
  };

  const fetchComments = async (taskId: string) => {
    try {
      const response = await api.get(`/projects/${taskId}/comments`);
      setComments(response.data);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !selectedTask) return;
    try {
      await api.post(`/projects/${selectedTask.id}/comments`, { content: newComment });
      setNewComment('');
      fetchComments(selectedTask.id);
    } catch (err) { console.error(err); }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchUser(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get('/users/search', { params: { q: query } });
      setSearchResults(res.data);
    } catch (err) { console.error(err); }
  };

  const handleInviteUser = async (userId: string) => {
    try {
      await api.post(`/projects/${projectId}/members`, { targetUserId: userId });
      setModal({ isOpen: true, title: 'Succès', message: 'Membre invité avec succès !', type: 'success' });
      fetchProjectDetails();
      setShowInviteModal(false);
      setSearchUser('');
      setSearchResults([]);
    } catch (err) {
      setModal({ isOpen: true, title: 'Erreur', message: "Impossible d'inviter cet utilisateur.", type: 'error' });
    }
  };

  if (loading) return <div className="loading-state fade-in"><Loader2 className="spinner" size={48} /></div>;
  if (!project) return null;

  return (
    <div className="project-board fade-in">
      <header className="board-header">
        <div className="board-info">
          <h1>{project.title}</h1>
          <p className="text-secondary">{project.description}</p>
          <div className="members-stack" style={{ marginTop: '1rem' }}>
            {project.members?.map((m: any, i: number) => (
              <div key={i} className="member-avatar" style={{ width: '32px', height: '32px' }} title={m.username}>
                {m.username?.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
        </div>
        <div className="board-actions">
          <div className="sort-wrapper glass-panel">
            <SortAsc size={16} className="text-secondary" />
            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="created_at">Plus récents</option>
              <option value="title">Titre (A-Z)</option>
              <option value="echeance">Échéance</option>
            </select>
          </div>
          <button className="btn btn-secondary" onClick={() => setShowInviteModal(true)}><UserPlus size={18} /> Inviter</button>
          <button className="btn btn-secondary" onClick={fetchHistory}><Clock size={18} /> Historique</button>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar glass-panel">
          <div className="stat-pill">
            <span className="stat-pill-value">{stats.total_tasks}</span>
            <span className="stat-pill-label">Total</span>
          </div>
          <div className="stat-pill todo">
            <span className="stat-pill-value">{stats.todo_count}</span>
            <span className="stat-pill-label">À faire</span>
          </div>
          <div className="stat-pill doing">
            <span className="stat-pill-value">{stats.doing_count}</span>
            <span className="stat-pill-label">En cours</span>
          </div>
          <div className="stat-pill done">
            <span className="stat-pill-value">{stats.done_count}</span>
            <span className="stat-pill-label">Terminées</span>
          </div>
          <div className="stat-progress">
            <div className="stat-progress-label">
              <span>Progression</span>
              <span>{stats.progress_percentage}%</span>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${stats.progress_percentage}%` }}></div>
            </div>
          </div>
        </div>
      )}

      <main className="kanban-container">
        {COLUMNS.map(column => {
          const columnTasks = tasks.filter(t => t.statut === column.id);
          const columnClass = column.id === 'A faire' ? 'column-todo' : 
                              column.id === 'En cours' ? 'column-progress' : 'column-done';
          
          return (
            <div key={column.id} className={`kanban-column ${columnClass}`} onDragOver={(e) => e.preventDefault()} onDrop={() => handleUpdateStatus(draggedTask?.id!, column.id)}>
              <div className="column-header">
                <div className="header-left">
                  <h3>{column.title}</h3>
                  <span className="task-count">{columnTasks.length}</span>
                </div>
                {column.id === 'A faire' && <button className="icon-btn" onClick={() => setShowTaskModal(true)}><Plus size={20} /></button>}
              </div>
              <div className="column-body">
                {columnTasks
                  .sort((a, b) => {
                    if (sortBy === 'title') return a.title.localeCompare(b.title);
                    if (sortBy === 'echeance') return new Date(a.echeance).getTime() - new Date(b.echeance).getTime();
                    return 0;
                  })
                  .map(task => (
                  <div key={task.id} className="task-card" draggable onDragStart={() => setDraggedTask(task)} onClick={() => setSelectedTask(task)}>
                    <div className="task-card-header">
                      <h4 className="task-title">{task.title}</h4>
                      <div className="task-options-wrapper" onClick={e => e.stopPropagation()}>
                        <button className="icon-btn-sm" onClick={() => setActiveTaskMenu(activeTaskMenu === task.id ? null : task.id)}>
                          <MoreVertical size={16} />
                        </button>
                        {activeTaskMenu === task.id && (
                          <div className="task-options-dropdown glass-panel fade-in">
                            <button onClick={() => { setSelectedTask(task); setActiveTaskMenu(null); }}>Ouvrir</button>
                            <button className="delete-opt" onClick={() => handleDeleteTask(task.id)}>Supprimer</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="task-card-desc">{task.description}</p>
                    <div className="task-footer">
                      <div className={`task-meta ${new Date(task.echeance) < new Date() && task.statut !== 'Termine' ? 'overdue' : ''}`}>
                        <Calendar size={14} />
                        <span>{new Date(task.echeance).toLocaleDateString()}</span>
                      </div>
                      <div className="micro-avatar" title={task.assigned_name}>{task.assigned_name?.charAt(0).toUpperCase()}</div>
                    </div>
                  </div>
                ))}
                {column.id === 'A faire' && (
                  <button className="add-task-btn" onClick={() => setShowTaskModal(true)}><Plus size={16} /> Ajouter une tâche</button>
                )}
              </div>
            </div>
          );
        })}
      </main>

      {/* History Drawer */}
      {showHistory && (
        <div className="drawer-overlay" onClick={() => setShowHistory(false)}>
          <div className="drawer glass-panel open" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Historique</h2>
              <button className="icon-btn" onClick={() => setShowHistory(false)}><X size={24} /></button>
            </div>
            <div className="drawer-body">
              <div className="activity-list">
                {history.map((log, i) => (
                  <div key={i} className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      <p><strong>{log.name_display || log.username}</strong> {log.description}</p>
                      <span className="activity-time">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Drawer */}
      {selectedTask && (
        <div className="drawer-overlay" onClick={() => setSelectedTask(null)}>
          <div className="drawer glass-panel open" onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <span className={`badge ${selectedTask.statut === 'Termine' ? 'badge-done' : 'badge-inprogress'}`}>{selectedTask.statut}</span>
                <h2>{selectedTask.title}</h2>
              </div>
              <button className="icon-btn" onClick={() => setSelectedTask(null)}><X size={24} /></button>
            </div>
            <div className="drawer-body">
              <p className="text-secondary" style={{ marginBottom: '2rem' }}>{selectedTask.description}</p>
              
              <div style={{ marginBottom: '2.5rem' }}>
                <label className="input-label">Statut Rapide</label>
                <div className="status-buttons" style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  {COLUMNS.map(col => (
                    <button key={col.id} className={`btn btn-sm ${selectedTask.statut === col.id ? 'btn-primary' : 'btn-secondary'}`} onClick={() => handleUpdateStatus(selectedTask.id, col.id)}>
                      {col.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="comment-section">
                <h3 style={{ marginBottom: '1rem' }}>Commentaires</h3>
                <div className="comment-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                  {comments.map(c => (
                    <div key={c.id} className="comment-item" style={{ display: 'flex', gap: '1rem' }}>
                      <div className="member-avatar" style={{ width: '32px', height: '32px', flexShrink: 0 }}>{c.username.charAt(0).toUpperCase()}</div>
                      <div className="glass-panel" style={{ padding: '0.75rem 1rem', borderRadius: '12px', flex: 1 }}>
                        <div style={{ fontWeight: '700', fontSize: '0.85rem' }}>{c.username}</div>
                        <div style={{ fontSize: '0.9rem', margin: '0.2rem 0' }}>{c.content}</div>
                        <div className="text-secondary" style={{ fontSize: '0.7rem' }}>{new Date(c.created_at).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <form className="comment-form" onSubmit={handlePostComment} style={{ display: 'flex', gap: '0.5rem' }}>
                  <input className="input-field" placeholder="Répondre..." value={newComment} onChange={e => setNewComment(e.target.value)} />
                  <button className="btn btn-primary"><Send size={18} /></button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals using Portal or direct render */}
      {showTaskModal && createPortal(
        <div className="modal-overlay fade-in" onClick={() => setShowTaskModal(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header"><h2>Nouvelle Tâche</h2><button className="icon-btn" onClick={() => setShowTaskModal(false)}><X size={24} /></button></div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await api.post(`/projects/${projectId}/tasks`, newTask);
                setShowTaskModal(false);
                fetchProjectDetails();
              } catch (err) { console.error(err); }
            }} style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label">Titre</label>
                <input required className="input-field" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="input-label">Description</label>
                <textarea className="input-field" style={{ minHeight: '80px' }} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} />
              </div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Assigner à</label>
                <select className="input-field" required value={newTask.assigned_to} onChange={e => setNewTask({...newTask, assigned_to: e.target.value})}>
                  <option value="">Choisir un membre...</option>
                  {[project.owner, ...project.members].map((m: any) => m && <option key={m.id} value={m.id}>{m.username}</option>)}
                </select>
              </div>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="input-label">Échéance</label>
                <input type="date" required className="input-field" value={newTask.echeance} onChange={e => setNewTask({...newTask, echeance: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Créer la tâche</button>
            </form>
          </div>
        </div>, document.body
      )}

      {showInviteModal && createPortal(
        <div className="modal-overlay fade-in" onClick={() => setShowInviteModal(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>Inviter un membre</h2>
              <button className="icon-btn" onClick={() => setShowInviteModal(false)}><X size={24} /></button>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="input-label" style={{ marginBottom: '1rem' }}>Rechercher un utilisateur</label>
                <div className="search-input-wrapper glass-panel" style={{ height: '64px', padding: '0 1.5rem' }}>
                  <input 
                    className="search-input" 
                    placeholder="Entrez un nom ou un email..." 
                    value={searchUser} 
                    onChange={e => handleSearchUsers(e.target.value)}
                  />
                </div>
              </div>

              <div className="search-results" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                {searchResults.map(u => (
                  <div key={u.id} className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700' }}>{u.username}</div>
                      <div className="text-secondary" style={{ fontSize: '0.8rem' }}>{u.email}</div>
                    </div>
                    <button className="btn btn-sm btn-primary" onClick={() => handleInviteUser(u.id)}>Inviter</button>
                  </div>
                ))}
                {searchUser && searchResults.length === 0 && (
                  <p className="text-secondary" style={{ textAlign: 'center', padding: '1rem' }}>Aucun utilisateur trouvé.</p>
                )}
              </div>
            </div>
          </div>
        </div>, document.body
      )}

      <Modal isOpen={modal.isOpen} onClose={() => setModal({...modal, isOpen: false})} title={modal.title} message={modal.message} type={modal.type} />
    </div>
  );
};

export default ProjectDetails;
