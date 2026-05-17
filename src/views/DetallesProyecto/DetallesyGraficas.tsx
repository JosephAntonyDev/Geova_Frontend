import './DetallesyGraficas.css';
import Portal from '../../utils/Portal';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { projectService } from '../../services/ProjectService';
import { graphViewModel } from '../../viewmodels/GraphViewModel';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import Obligatorio from '../../utils/ui/span-obligatorio';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import GraphViewer from '../GraphViewer/Graph';

// Fix para el ícono del marcador en producción
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function LocationMarkerEdit({ setLat, setLng }) {
  const [position, setPosition] = useState(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      setLat(e.latlng.lat);
      setLng(e.latlng.lng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

// Demo mode flag
const IS_DEMO_MODE = true;

function DetallesProyecto() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLocalAPIAvailable, setIsLocalAPIAvailable] = useState(false);
  const [checkingLocalAPI, setCheckingLocalAPI] = useState(true);
  const navigate = useNavigate();
  const { data: graphs } = graphViewModel.useGraphData();

  const [showModal, setShowModal] = useState(false);
  const [hasMeasurements, setHasMeasurements] = useState(false);
  const [editData, setEditData] = useState({
    nombreProyecto: '',
    categoria: '',
    descripcion: '',
    lat: null,
    lng: null,
    imgFile: null
  });

  // Estados para validaciones del modal
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editTouched, setEditTouched] = useState<Record<string, boolean>>({});

  const showEditError = (field: string) => editTouched[field] && !!editErrors[field];

  const handleEditBlur = (field: string, value: string) => {
    setEditTouched((t) => ({ ...t, [field]: true }));
    setEditErrors((prev) => {
      const newErrors = { ...prev };
      if (!value || !value.trim()) {
        newErrors[field] = 'Campo obligatorio.';
      } else if (field === 'nombreProyecto' && value.trim().length < 3) {
        newErrors[field] = 'Debe tener mínimo 3 caracteres.';
      } else if (field === 'descripcion' && value.trim().length < 10) {
        newErrors[field] = 'Debe tener al menos 10 caracteres.';
      } else {
        newErrors[field] = '';
      }
      return newErrors;
    });
  };

  const validateEdit = () => {
    const newErrors: Record<string, string> = {};
    
    if (!editData.nombreProyecto.trim()) {
      newErrors.nombreProyecto = 'Campo obligatorio.';
    } else if (editData.nombreProyecto.trim().length < 3) {
      newErrors.nombreProyecto = 'Debe tener mínimo 3 caracteres.';
    }
    
    if (!editData.descripcion.trim()) {
      newErrors.descripcion = 'Campo obligatorio.';
    } else if (editData.descripcion.trim().length < 10) {
      newErrors.descripcion = 'Debe tener al menos 10 caracteres.';
    }
    
    setEditErrors(newErrors);
    setEditTouched({ nombreProyecto: true, descripcion: true });
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;

      const { success, data, error } = await projectViewModel.handleGetProjectById(Number(id));
      if (success) {
        setProject(data);
      } else {
        console.error("Error al obtener proyecto:", error);
      }
      setLoading(false);
    };

    const checkLocalAPI = async () => {
      setCheckingLocalAPI(true);
      if (IS_DEMO_MODE) {
        // En modo demo, siempre mostrar como desconectado
        setIsLocalAPIAvailable(false);
        setCheckingLocalAPI(false);
        return;
      }
      const isAvailable = await projectService.checkLocalAPIAvailability();
      setIsLocalAPIAvailable(isAvailable);
      setCheckingLocalAPI(false);
    };

    const checkMeasurements = async () => {
      if (!id) return;
      try {
        // Verificar si hay mediciones (solo una petición para no saturar)
        const imx = await projectViewModel.handleGetSensorIMXByProjectId(id);
        if (imx.success && imx.data && imx.data.length > 0) {
          setHasMeasurements(true);
          return;
        }
        setHasMeasurements(false);
      } catch (error) {
        console.error('Error verificando mediciones:', error);
        setHasMeasurements(false);
      }
    };

    fetchProject();
    checkLocalAPI();
    checkMeasurements();
  }, [id]);

  const Handlecamera = () => {
    projectViewModel.handleCamera(navigate);
  };

  const Handlecameradual = () => {
    projectViewModel.handleCameraDual(navigate);
  };

  const handleIrregularidades = () => {
    if (project?.Id) {
      projectViewModel.handleIrregularidades(navigate, project.Id);
    }
  };


  const formatDate = (fecha) => {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString();
  };

  const openEditModal = () => {
    if (!project) return;
    setEditData({
      nombreProyecto: project.NombreProyecto,
      categoria: project.Categoria,
      descripcion: project.Descripcion,
      lat: project.Lat || null,
      lng: project.Lng || null,
      imgFile: null
    });
    // Limpiar errores al abrir el modal
    setEditErrors({});
    setEditTouched({});
    setShowModal(true);
  };

  const handleEditSubmit = async () => {
    if (!id) {
      alert('ID del proyecto no disponible.');
      return;
    }

    // Validar antes de enviar
    if (!validateEdit()) {
      return;
    }

    const { nombreProyecto, categoria, descripcion, lat, lng, imgFile } = editData;

    try {
      // Si no se seleccionó nueva imagen, pasar la URL actual
      const imageToSend = imgFile || project?.Img || null;
      
      const { success, error } = await projectViewModel.handleUpdateProject(
        Number(id),
        nombreProyecto.trim(),
        categoria,
        descripcion.trim(),
        imageToSend,
        lat,
        lng
      );

      if (success) {
        setShowModal(false);
        const { data } = await projectViewModel.handleGetProjectById(Number(id));
        setProject(data);
      } else {
        console.error('Error al actualizar:', error);
        alert('Error al actualizar: ' + error);
      }
    } catch (e) {
      console.error('Error inesperado:', e);
      alert('Error inesperado al actualizar el proyecto');
    }
  };

  const handleDeleteProject = async () => {
    if (!project?.Id) return;
    await projectViewModel.handleDeleteProject(project.Id, navigate, isLocalAPIAvailable);
  };

  return (
    <div className="DetallesContainer">
      <div className="DetallesTitleContainer">
        <div className="DetallesTitle">
          <h1>
            {loading ? 'Cargando...' : project?.NombreProyecto || 'Proyecto no encontrado'}
          </h1>
          <i className="bx bxs-add-to-queue"></i>
        </div>
        <div className="DetallesEndContainer">
          {/* Indicador de estado de la API local */}
          <div className={`api-status ${checkingLocalAPI ? 'checking' : isLocalAPIAvailable ? 'available' : 'unavailable'}`}>
            {IS_DEMO_MODE ? (
              <span>Modo Demo - Sensores no disponibles</span>
            ) : checkingLocalAPI ? (
              <span>Verificando conexion...</span>
            ) : isLocalAPIAvailable ? (
              <span>Raspberry Pi conectada</span>
            ) : (
              <span>Raspberry Pi desconectada</span>
            )}
          </div>
        </div>
      </div>

      <div className="DashSubtitle">
        <div className="DashSub1">
        </div>
      </div>

      <div className="ProjectphotoDetail">
        <div className="PhotoContainer">
          {project?.Img ? (
            <img src={project.Img} alt="Proyecto" className="ProjectImage" />
          ) : (
            <p>No se ha cargado imagen para este proyecto</p>
          )}
        </div>
      </div>

      <div className="categorycontainer">
        <p>{project?.Categoria || 'Categoría'}</p>
      </div>

      <div className="DetailOptions">
        <div className='SubtitleContainer'>
          <h2>Información</h2>
          <div className='ProjectOptions'>
              <div className='editproject' onClick={openEditModal}>
                <i className='bx bxs-edit-alt'></i>
              </div>
              <div 
                className={`deleteproject ${!isLocalAPIAvailable ? 'disabled' : ''}`}
                onClick={handleDeleteProject}
                title={!isLocalAPIAvailable ? 'Requiere conexión a Raspberry Pi' : 'Eliminar proyecto'}
              >
                <i className='bx bxs-trash-alt'></i>
              </div>
          </div>
        </div>
        <p className="Dsub2">
          {loading ? '' : project?.Fecha ? formatDate(project.Fecha) : 'Fecha no disponible'}
        </p>
        <h3 className='SectionTitle'>DESCRIPCIÓN</h3>
        <p>{project?.Descripcion || ''}</p>

        <div className="ExtraDetails">
            <i className="bx bx-ruler"></i>
            <h3>{IS_DEMO_MODE ? 'Medicion no disponible en modo demo' : 'Este terreno aun no ha sido medido'}</h3>
            <span>{IS_DEMO_MODE ? 'Requiere conexion con Raspberry Pi y sensores' : 'Sin datos estadisticos'}</span>
            <button onClick={Handlecamera} disabled={IS_DEMO_MODE} className={IS_DEMO_MODE ? 'disabled-demo' : ''}>
              <i className="fa-solid fa-circle-play"></i> {IS_DEMO_MODE ? 'No disponible en demo' : 'Comenzar medicion'}
            </button>
        </div>

        <h3 className='SectionTitle'>UBICACIÓN</h3>
        <div className="MapDetail">
          {project?.Lat && project?.Lng ? (
            <MapContainer center={[project.Lat, project.Lng]} zoom={15} style={{ height: '100%', width: '100%' }} zoomControl={true} dragging={false} doubleClickZoom={true} scrollWheelZoom={false} touchZoom={true}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[project.Lat, project.Lng]}>
                <Popup>Ubicación del proyecto</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <p>Ubicación no disponible</p>
          )}
        </div>
      </div>

      <div className='GraphContainer'>
        {hasMeasurements && <h2>Gráficas</h2>}
        <div className="GraphSection">
          <GraphViewer />
        </div>
      </div>

      {showModal && (
        <Portal>
          <div className="modal-overlay">
          <div className="modal-content">
            <h2>Editar Proyecto</h2>

            <div className="modal-field">
              <div className="modal-field-header">
                <label>Nombre del Proyecto</label>
                <Obligatorio show={showEditError('nombreProyecto')} message={editErrors.nombreProyecto || ''} />
              </div>
              <input
                type="text"
                placeholder="Nombre del Proyecto"
                value={editData.nombreProyecto}
                onChange={(e) => setEditData({ ...editData, nombreProyecto: e.target.value })}
                onBlur={() => handleEditBlur('nombreProyecto', editData.nombreProyecto)}
              />
            </div>

            <select
              value={editData.categoria}
              onChange={(e) => setEditData({ ...editData, categoria: e.target.value })}
            >
              <option value="">Seleccione una categoría</option>
              <option value="Residencial">Residencial</option>
              <option value="Comercial">Comercial</option>
              <option value="Industrial">Industrial</option>
              <option value="Infraestructura">Infraestructura</option>
              <option value="Remodelación">Remodelación</option>
              <option value="Obra civil">Obra civil</option>
              <option value="Obra pública">Obra pública</option>
              <option value="Arquitectónico">Arquitectónico</option>
            </select>

            <div className="modal-field">
              <div className="modal-field-header">
                <label>Descripción</label>
                <Obligatorio show={showEditError('descripcion')} message={editErrors.descripcion || ''} />
              </div>
              <textarea
                placeholder="Descripción"
                value={editData.descripcion}
                onChange={(e) => setEditData({ ...editData, descripcion: e.target.value })}
                onBlur={() => handleEditBlur('descripcion', editData.descripcion)}
              />
            </div>
            <div className='ModalImageContainer'>
              <div className="PreviewImageContainer">
                {editData.imgFile ? (
                  <img
                    src={URL.createObjectURL(editData.imgFile)}
                    alt="Nueva imagen seleccionada"
                    className="ProjectImagePreview"
                  />
                ) : project?.Img ? (
                  <>
                    <p>Imagen actual:</p>
                    <img src={project.Img} alt="Imagen actual del proyecto" className="ProjectImagePreview" />
                  </>
                ) : (
                  <p>No hay imagen registrada para este proyecto</p>
                )}
              </div>
              
              <input className='modal-input.image'
                type="file"
                accept="image/*"
                onChange={(e) => setEditData({ ...editData, imgFile: e.target.files?.[0] || null })}
              />
            </div>

            <div style={{ height: '250px', marginTop: '10px' }}>
              <MapContainer
                center={[editData.lat || 23.6345, editData.lng || -102.5528]}
                zoom={5}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <LocationMarkerEdit
                  setLat={(lat) => setEditData((prev) => ({ ...prev, lat }))}
                  setLng={(lng) => setEditData((prev) => ({ ...prev, lng }))}
                />
              </MapContainer>
            </div>

            <div className="modal-buttons">
              <button onClick={() => setShowModal(false)}>Cancelar</button>
              <button onClick={handleEditSubmit}>Guardar Cambios</button>
            </div>
          </div>
        </div>
        </Portal>
      )}
    </div>
  );
}

export default DetallesProyecto;
