import React, { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Briefcase, CheckCircle, Clock } from 'lucide-react';
import './Dashboard.css';

interface DashboardStats {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
}

interface ActivityLog {
  description: ReactNode;
  id: string;
  action_type: string;
  details: string;
  created_at: string;
  project_title: string;
}

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalProjects: 0, totalTasks: 0, completedTasks: 0 });
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // En vrai, il faudrait un endpoint /dashboard, mais on va simuler avec les projets
        const { data: projectsData } = await api.get('/projects');
        
        let tTasks = 0;
        let cTasks = 0;
        let activities: ActivityLog[] = [];

        // On boucle pour avoir des stats
        for (const project of projectsData.data || []) {
          try {
            const { data: projectDetails } = await api.get(`/projects/${project.id}`);
            const tasks = projectDetails.tasks || [];
            tTasks += tasks.length;
            cTasks += tasks.filter((t: any) => t.statut === 'Termine').length;

            try {
              const { data: history } = await api.get(`/projects/${project.id}/history`);
              const projActivities = history.map((h: any) => ({...h, project_title: project.title}));
              activities = [...activities, ...projActivities];
            } catch (e) {
              console.error("Failed to fetch history for project", project.id);
            }
          } catch (e) {
            console.error("Failed to fetch details for project", project.id);
          }
        }

        setStats({
          totalProjects: projectsData.total || 0,
          totalTasks: tTasks,
          completedTasks: cTasks,
        });

        // Trier par date
        activities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentActivity(activities.slice(0, 5));

      } catch (error) {
        console.error("Erreur chargement dashboard", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="loading-state">Chargement du tableau de bord...</div>;
  }

  const completionRate = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;

  return (
    <div className="dashboard fade-in">
      <header className="dashboard-header">
        <h1>Bonjour, {user?.name_display || user?.username} 👋</h1>
        <p className="text-secondary">Voici un résumé de votre activité récente.</p>
      </header>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)' }}>
            <Briefcase size={24} />
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalProjects}</h3>
            <p className="stat-label">Projets Actifs</p>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning-color)' }}>
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.totalTasks - stats.completedTasks}</h3>
            <p className="stat-label">Tâches à faire</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--success-color)' }}>
            <CheckCircle size={24} />
          </div>
          <div className="stat-info">
            <h3 className="stat-value">{stats.completedTasks}</h3>
            <p className="stat-label">Tâches terminées</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="chart-section glass-panel">
          <h2>Progression globale</h2>
          <div className="progress-circle-container">
            <div className="progress-circle" style={{ '--percentage': `${completionRate}%` } as React.CSSProperties}>
              <div className="progress-inner">
                <span className="progress-text">{completionRate}%</span>
              </div>
            </div>
            <p className="progress-subtext">De tâches complétées</p>
          </div>
        </div>

        <div className="activity-section glass-panel">
          <h2>Activité Récente</h2>
          {recentActivity.length === 0 ? (
            <p className="empty-state">Aucune activité récente.</p>
          ) : (
            <ul className="activity-list">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="activity-item">
                  <div className="activity-dot"></div>
                  <div className="activity-content">
                    <p className="activity-details">
                      <strong>{activity.project_title}</strong> : {activity.description}
                    </p>
                    <span className="activity-time">
                      {new Date(activity.created_at).toLocaleString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
