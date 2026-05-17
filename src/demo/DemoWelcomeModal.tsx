import { useEffect, useState } from 'react';
import './DemoModal.css';

interface DemoWelcomeModalProps {
  show: boolean;
  onClose: () => void;
}

function DemoWelcomeModal({ show, onClose }: DemoWelcomeModalProps) {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

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

  if (!show) return null;

  return (
    <div className={`demo-modal-overlay ${isClosing ? 'closing' : ''}`} onClick={handleClose}>
      <div 
        className={`demo-modal-content ${isClosing ? 'closing' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="demo-modal-header">
          <div className="demo-icon">
            <i className="bx bx-info-circle"></i>
          </div>
          <h2>Modo Demostracion</h2>
        </div>

        <div className="demo-modal-body">
          <p className="demo-intro">
            Bienvenido a la <strong>version de demostracion</strong> de GEOVA. 
            Esta version te permite explorar todas las funcionalidades de la aplicacion 
            sin necesidad de crear una cuenta real.
          </p>

          <div className="demo-features">
            <h3>Que puedes hacer:</h3>
            <ul>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Iniciar sesion con cualquier correo y contrasena</span>
              </li>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Crear y editar proyectos (guardados localmente)</span>
              </li>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Ver el dashboard con proyectos de ejemplo</span>
              </li>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Explorar detalles y ubicaciones de proyectos</span>
              </li>
              <li>
                <i className="bx bx-check-circle"></i>
                <span>Ver y editar tu perfil de usuario demo</span>
              </li>
            </ul>
          </div>

          <div className="demo-limitations">
            <h3>Funciones limitadas:</h3>
            <ul>
              <li>
                <i className="bx bx-x-circle"></i>
                <span>Conexion con Raspberry Pi (requiere hardware)</span>
              </li>
              <li>
                <i className="bx bx-x-circle"></i>
                <span>Medicion de terrenos con sensores</span>
              </li>
              <li>
                <i className="bx bx-x-circle"></i>
                <span>Graficas de sensores en tiempo real</span>
              </li>
              <li>
                <i className="bx bx-x-circle"></i>
                <span>Sincronizacion con servidor remoto</span>
              </li>
            </ul>
          </div>

          <div className="demo-note">
            <i className="bx bx-bulb"></i>
            <p>
              Los datos se guardan en tu navegador. Al cerrar o limpiar el navegador, 
              los proyectos creados se reiniciaran a los ejemplos predeterminados.
            </p>
          </div>
        </div>

        <div className="demo-modal-footer">
          <button className="demo-btn-primary" onClick={handleClose}>
            Entendido, comenzar a explorar
          </button>
        </div>
      </div>
    </div>
  );
}

export default DemoWelcomeModal;
