import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import { 
  Menu, X, Bell, Moon, Sun, 
  LayoutDashboard, FolderKanban, 
  Users, LogOut, Plus, Search 
} from 'lucide-react';
import './Layout.css';
import Modal from './Modal';
import { useSocket } from '../contexts/SocketContext';

interface Notification {
  id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

const Layout = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { socket } = useSocket();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [detailModal, setDetailModal] = useState({ 
    isOpen: false, 
    title: '', 
    message: '', 
    type: 'info' as 'info' | 'success' | 'error'
  });
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new-notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
    });
    return () => { socket.off('new-notification'); };
  }, [socket]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/users/notifications');
      setNotifications(response.data);
    } catch (err) { console.error(err); }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/users/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Tableau de bord', path: '/', icon: <LayoutDashboard className="nav-icon" size={22} /> },
    { name: 'Mes Projets', path: '/projects', icon: <FolderKanban className="nav-icon" size={22} /> },
    { name: 'Utilisateurs', path: '/users', icon: <Users className="nav-icon" size={22} />, adminOnly: true },
  ];

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="layout-container" data-theme={theme}>
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="sidebar-logo">
          <div className="logo-icon">DS</div>
          <span>Digital Solutions</span>
        </Link>

        <nav className="sidebar-nav">
          {navItems.filter(item => !item.adminOnly || user?.role === 'admin').map((item) => (
            <Link 
              key={item.path}
              to={item.path} 
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            <Plus size={20} /> Nouveau Projet
          </button>
          <button className="nav-link logout-btn" onClick={handleLogout}>
            <LogOut size={20} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN WRAPPER */}
      <div className="main-wrapper">
        <header className="top-navbar">
          <button className="menu-btn mobile-only" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="icon-btn" style={{ position: 'relative' }} onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
            
            {showNotifs && (
              <div className="notification-dropdown glass-panel fade-in" onClick={e => e.stopPropagation()}>
                <div className="notif-header"><h3>Notifications</h3></div>
                <div className="notif-list">
                  {notifications.length === 0 ? <div className="notif-empty" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Aucune notification</div> :
                    notifications.map(n => (
                      <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`} onClick={() => { markAsRead(n.id); setDetailModal({ isOpen: true, title: 'Notification', message: n.content, type: 'info' }); }}>
                        <p>{n.content}</p>
                        <span>{new Date(n.created_at).toLocaleDateString()}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}
          </div>

          <button onClick={toggleTheme} className="icon-btn">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div className="user-profile-trigger">
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">{user?.role}</span>
            </div>
            <div className="avatar micro-avatar" style={{ background: 'var(--primary-color)', color: 'white' }}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <Modal 
        isOpen={detailModal.isOpen}
        onClose={() => setDetailModal({ ...detailModal, isOpen: false })}
        title={detailModal.title}
        message={detailModal.message}
        type={detailModal.type}
      />
    </div>
  );
};

export default Layout;
