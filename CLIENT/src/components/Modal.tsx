import React from 'react';
import { createPortal } from 'react-dom';
import { X, AlertCircle, CheckCircle, Info } from 'lucide-react';
import '../styles/Modals.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'error' | 'success' | 'info';
  onAction?: () => void;
  actionLabel?: string;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, message, type = 'info', onAction, actionLabel }) => {
  if (!isOpen) return null;

  const iconMap = {
    error: <AlertCircle className="text-danger" size={48} />,
    success: <CheckCircle className="text-success" size={48} />,
    info: <Info className="text-primary" size={48} />
  };

  return createPortal(
    <div className="modal-overlay fade-in" onClick={onClose}>
      <div 
        className="modal-content glass-panel scale-up" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrapper">
            {iconMap[type]}
            <h2>{title}</h2>
          </div>
          <button className="icon-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Fermer
          </button>
          {onAction && actionLabel && (
            <button className="btn btn-primary" onClick={() => { onAction(); onClose(); }}>
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
