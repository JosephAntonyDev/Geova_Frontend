import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import './DemoModal.css';
import logoImg from '../assets/Geova_logo.svg';

interface DemoWelcomeModalProps {
  show: boolean;
  onClose: () => void;
}

function DemoWelcomeModal({ show, onClose }: DemoWelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show || !mounted) return null;

  const modalContent = (
    <div className={`demo-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`demo-modal-content ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="demo-modal-header">
          <div className="demo-header-content">
            <img src={logoImg} alt="GEOVA Logo" className="demo-logo" />
            <div className="demo-badge">
              <i className="bx bx-code-alt"></i>
              <span>Modo Demo</span>
            </div>
            <h2>Bienvenido a GEOVA</h2>
            <p className="demo-subtitle">Version de demostracion interactiva</p>
          </div>
        </div>

        <div className="demo-modal-body">
          <p className="demo-intro">
            Esta es una <strong>version de prueba</strong> que te permite explorar 
            todas las funcionalidades de la aplicacion sin necesidad de registrarte 
            o conectar hardware real.
          </p>

          <div className="demo-features">
            <h3>
              <i className="bx bx-check-circle"></i>
              Funciones disponibles
            </h3>
            <ul>
              <li>
                <i className="bx bx-check"></i>
                <span>Iniciar sesion con cualquier correo y contrasena</span>
              </li>
              <li>
                <i className="bx bx-check"></i>
                <span>Crear, editar y eliminar proyectos</span>
              </li>
              <li>
                <i className="bx bx-check"></i>
                <span>Ver dashboard con graficas de actividad</span>
              </li>
              <li>
                <i className="bx bx-check"></i>
                <span>Ver graficas de sensores (datos simulados)</span>
              </li>
              <li>
                <i className="bx bx-check"></i>
                <span>Explorar detalles y ubicaciones en el mapa</span>
              </li>
            </ul>
          </div>

          <div className="demo-limitations">
            <h3>
              <i className="bx bx-x-circle"></i>
              No disponible en demo
            </h3>
            <ul>
              <li>
                <i className="bx bx-x"></i>
                <span>Conexion con Raspberry Pi (requiere hardware)</span>
              </li>
              <li>
                <i className="bx bx-x"></i>
                <span>Iniciar camara para medicion (sin hardware)</span>
              </li>
            </ul>
          </div>

          <div className="demo-note">
            <i className="bx bx-info-circle"></i>
            <p>
              Los datos se guardan localmente en tu navegador. Al limpiar los datos 
              del navegador, los proyectos se reiniciaran a los ejemplos predeterminados.
            </p>
          </div>
        </div>

        <div className="demo-modal-footer">
          <button className="demo-btn-primary" onClick={handleClose}>
            <span>Comenzar a explorar</span>
            <i className="bx bx-right-arrow-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );

  // Renderizar en el body para evitar el filtro invert del Login
  return createPortal(modalContent, document.body);
}

export default DemoWelcomeModal;
