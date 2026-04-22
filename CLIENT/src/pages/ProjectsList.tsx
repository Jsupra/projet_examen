import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Search, Plus, MoreVertical, Folder, Calendar, User, FolderKanban, X, Loader2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import Modal from '../components/Modal';
import './Projects.css';
import '../styles/Modals.css';

interface Project {
  completed_tasks: number;
  total_tasks: number;
  id: string;
  title: string;
  description: string;
  owner_id: string;
  owner_name: string;
  created_at: string;
}

interface AlertModalState {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'info' | 'success' | 'error';
  onAction?: () => void;
  actionLabel?: string;
}

const ProjectsList = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('DESC');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [alertModal, setAlertModal] = useState<AlertModalState>({ 
    isOpen: false, title: '', message: '', type: 'info'
  });

  useEffect(() => { fetchProjects(); }, [search, sortBy, order, page]);
  useEffect(() => { setPage(1); }, [search, sortBy, order]);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects', { params: { search, sortBy, order, page, limit: 9 } });
      setProjects(response.data.data || []);
      setTotalPages(response.data.pagination?.totalPages || 1);
    } catch (error) { console.error(error); } 
    finally { setLoading(false); }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProject) {
        await api.put(`/projects/${editingProject.id}`, newProject);
      } else {
        await api.post('/projects', newProject);
      }
      setShowModal(false);
      setEditingProject(null);
      setNewProject({ title: '', description: '' });
      fetchProjects();
    } catch (err) {
      setAlertModal({ isOpen: true, title: 'Erreur', message: 'Opération échouée.', type: 'error' });
    }
  };

  const handleDeleteProject = async (id: string) => {
    setAlertModal({ 
      isOpen: true, 
      title: 'Confirmation', 
      message: 'Voulez-vous vraiment supprimer ce projet ?', 
      type: 'error',
      actionLabel: 'Supprimer',
      onAction: async () => {
        try {
          await api.delete(`/projects/${id}`);
          fetchProjects();
        } catch (err) { console.error(err); }
      }
    });
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setNewProject({ title: project.title, description: project.description });
    setShowModal(true);
    setActiveMenu(null);
  };

  return (
    <div className="projects-page fade-in">
      <header className="page-header">
        <div>
          <h1>Mes Projets</h1>
          <p className="text-secondary">Explorez et gérez vos espaces de travail collaboratifs.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} /> Nouveau Projet
        </button>
      </header>

      <div className="search-bar-container">
        <div className="search-input-wrapper glass-panel">
          <Search size={20} className="text-secondary" />
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="sort-controls glass-panel">
          <select 
            value={`${sortBy}-${order}`} 
            onChange={(e) => {
              const [newSort, newOrder] = e.target.value.split('-');
              setSortBy(newSort);
              setOrder(newOrder);
            }}
            className="sort-select"
          >
            <option value="created_at-DESC">Plus récents</option>
            <option value="created_at-ASC">Plus anciens</option>
            <option value="title-ASC">Nom (A-Z)</option>
            <option value="title-DESC">Nom (Z-A)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state"><Loader2 className="spinner" size={40} /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state glass-panel">
          <FolderKanban size={64} className="text-secondary" />
          <h3>Aucun projet à l'horizon</h3>
          <p>Créez votre premier projet pour commencer à organiser vos tâches.</p>
        </div>
      ) : (
        <div className="projects-grid">
          {projects.map((project) => (
            <Link to={`/projects/${project.id}`} key={project.id} className="project-card">
              <div className="project-card-header">
                <div className="project-icon">
                  <Folder size={24} />
                </div>
                <div className="options-wrapper">
                  <button 
                    className="notification-trigger" 
                    style={{ width: '36px', height: '36px' }}
                    onClick={(e) => {
                      e.preventDefault(); e.stopPropagation();
                      setActiveMenu(activeMenu === project.id ? null : project.id);
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                  
                  {activeMenu === project.id && (
                    <div className="options-dropdown glass-panel fade-in" onClick={e => e.stopPropagation()}>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEditModal(project); }}>Modifier</button>
                      <button className="delete-opt" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(project.id); }}>Supprimer</button>
                    </div>
                  )}
                </div>
              </div>

              <h3>{project.title}</h3>
              <p className="project-description">{project.description}</p>
              
              <div className="project-progress">
                <div className="progress-info">
                  <span>Progression</span>
                  <span>{project.total_tasks > 0 ? Math.round((project.completed_tasks / project.total_tasks) * 100) : 0}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${project.total_tasks > 0 ? (project.completed_tasks / project.total_tasks) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>

              <div className="project-card-footer">
                <div className="members-stack" title={`Propriétaire: ${project.owner_name}`}>
                  <div className="member-avatar">
                    {project.owner_name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="text-secondary" style={{ fontSize: '0.8rem', display: 'flex', gap: '1rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={14} /> {new Date(project.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="pagination-controls">
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            &larr; Précédent
          </button>
          <span className="pagination-info">
            Page <strong>{page}</strong> / {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant &rarr;
          </button>
        </div>
      )}

      {showModal && createPortal(
        <div className="modal-overlay fade-in" onClick={() => { setShowModal(false); setEditingProject(null); }}>
          <div className="modal-content glass-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
            <div className="drawer-header">
              <h2>{editingProject ? 'Modifier le projet' : 'Nouveau Projet'}</h2>
              <button className="icon-btn" onClick={() => { setShowModal(false); setEditingProject(null); }}><X size={24} /></button>
            </div>
            
            <form onSubmit={handleCreateProject} className="modal-form" style={{ padding: '1.5rem' }}>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label className="input-label">Titre du projet</label>
                <input required className="input-field" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} placeholder="Ex: Campagne Marketing 2024" />
              </div>
              
              <div className="form-group" style={{ marginBottom: '2rem' }}>
                <label className="input-label">Description</label>
                <textarea required className="input-field" style={{ minHeight: '120px' }} value={newProject.description} onChange={e => setNewProject({...newProject, description: e.target.value})} placeholder="Quels sont les objectifs de ce projet ?" />
              </div>
              
              <div className="modal-footer" style={{ borderTop: 'none', padding: 0 }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => { setShowModal(false); setEditingProject(null); }}>Annuler</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>{editingProject ? 'Mettre à jour' : 'Lancer le projet'}</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      <Modal 
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onAction={alertModal.onAction}
        actionLabel={alertModal.actionLabel}
      />
    </div>
  );
};

export default ProjectsList;
