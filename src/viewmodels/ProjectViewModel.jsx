import Swal from 'sweetalert2';
import alerticon from '../assets/alerticon.svg'; 
import succesfulicon from '../assets/sucessfulicon.svg'
import './alerts.css'
import { showSuccessAlert, showErrorAlert, showConfirmAlert, showCautionAlert, showDeleteConfirmAlert } from '../utils/alerts';

// Demo mode flag
const IS_DEMO_MODE = true;

// Imagenes de ejemplo para proyectos
const demoProjectImages = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80',
  'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=800&q=80',
  'https://images.unsplash.com/photo-1593642532454-e138e28a63f4?w=800&q=80',
];

const initialDemoProjects = [
  {
    Id: 1,
    NombreProyecto: 'Edificio Residencial Aurora',
    Categoria: 'Residencial',
    Descripcion: 'Proyecto de construccion de un complejo habitacional de 12 pisos con 48 departamentos, areas verdes y estacionamiento subterraneo. Incluye acabados de lujo y tecnologia smart home.',
    Fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    Img: demoProjectImages[0],
    Lat: 19.4326,
    Lng: -99.1332,
    userId: 1,
  },
  {
    Id: 2,
    NombreProyecto: 'Centro Comercial Plaza Norte',
    Categoria: 'Comercial',
    Descripcion: 'Desarrollo comercial de 25,000 m2 con espacios para 80 locales comerciales, area de food court, cine y zona de entretenimiento familiar.',
    Fecha: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    Img: demoProjectImages[1],
    Lat: 20.6597,
    Lng: -103.3496,
    userId: 1,
  },
  {
    Id: 3,
    NombreProyecto: 'Nave Industrial Logistica',
    Categoria: 'Industrial',
    Descripcion: 'Construccion de nave industrial de 15,000 m2 para almacenamiento y distribucion. Cuenta con andenes de carga, oficinas administrativas y sistemas contra incendio.',
    Fecha: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    Img: demoProjectImages[2],
    Lat: 25.6866,
    Lng: -100.3161,
    userId: 1,
  },
  {
    Id: 4,
    NombreProyecto: 'Puente Vehicular Rio Grande',
    Categoria: 'Infraestructura',
    Descripcion: 'Proyecto de infraestructura vial que conecta dos municipios. Puente de concreto presforzado de 450 metros de longitud con capacidad para 4 carriles.',
    Fecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    Img: demoProjectImages[3],
    Lat: 21.8853,
    Lng: -102.2916,
    userId: 1,
  },
  {
    Id: 5,
    NombreProyecto: 'Remodelacion Casa Historica',
    Categoria: 'Remodelacion',
    Descripcion: 'Restauracion y remodelacion de inmueble catalogado como patrimonio historico. Incluye reforzamiento estructural, actualizacion de instalaciones y conservacion de fachada original.',
    Fecha: new Date().toISOString(),
    Img: demoProjectImages[4],
    Lat: 19.0414,
    Lng: -98.2063,
    userId: 1,
  },
];

// Demo storage helpers
const demoStorage = {
  getProjects() {
    const stored = localStorage.getItem('demo_projects');
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem('demo_projects', JSON.stringify(initialDemoProjects));
    return initialDemoProjects;
  },

  saveProjects(projects) {
    localStorage.setItem('demo_projects', JSON.stringify(projects));
  },

  addProject(project) {
    const projects = this.getProjects();
    const newId = Math.max(...projects.map((p) => p.Id), 0) + 1;
    const newProject = { ...project, Id: newId };
    projects.push(newProject);
    this.saveProjects(projects);
    return newProject;
  },

  updateProject(id, updates) {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.Id === id);
    if (index === -1) return null;
    projects[index] = { ...projects[index], ...updates };
    this.saveProjects(projects);
    return projects[index];
  },

  deleteProject(id) {
    const projects = this.getProjects();
    const filtered = projects.filter((p) => p.Id !== id);
    if (filtered.length === projects.length) return false;
    this.saveProjects(filtered);
    return true;
  },

  getProjectById(id) {
    return this.getProjects().find((p) => p.Id === parseInt(id));
  },

  getProjectsByUser(userId) {
    return this.getProjects().filter((p) => p.userId === userId);
  },

  getWeeklyStats(userId) {
    const projects = this.getProjectsByUser(userId);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailyMap = {};
    let totalCount = 0;

    projects.forEach((p) => {
      const projectDate = new Date(p.Fecha);
      if (projectDate >= weekAgo && projectDate <= today) {
        const dateStr = projectDate.toISOString().split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
        totalCount++;
      }
    });

    const daily = Object.entries(dailyMap).map(([date, count]) => ({
      date,
      count,
    }));

    return { daily, total_count: totalCount };
  },
};

let selectedProjectId = null;
let allProjects = [];
let filteredProjects = [];
let searchTerm = '';
let filterType = '';

export const projectViewModel = {
  async handleCreateProject(nombreProyecto, categoria, descripcion, imgFile, lat, lng) {
    if (!nombreProyecto || !categoria || !descripcion || !imgFile || lat == null || lng == null) {
      await showConfirmAlert(
        'Campos obligatorios',
        'Todos los campos son obligatorios, incluyendo imagen y ubicacion.'
      );
      return { success: false, error: 'Faltan campos obligatorios' };
    }

    if (IS_DEMO_MODE) {
      try {
        // Convertir imagen a base64 para guardar en localStorage
        let imgUrl = demoProjectImages[Math.floor(Math.random() * demoProjectImages.length)];
        
        if (imgFile instanceof File) {
          imgUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imgFile);
          });
        }

        const newProject = demoStorage.addProject({
          NombreProyecto: nombreProyecto,
          Categoria: categoria,
          Descripcion: descripcion,
          Fecha: new Date().toISOString(),
          Img: imgUrl,
          Lat: parseFloat(lat),
          Lng: parseFloat(lng),
          userId: 1,
        });

        await showSuccessAlert('Proyecto creado exitosamente. (Modo Demo)');
        return { success: true, data: newProject };
      } catch (error) {
        await showErrorAlert('Error al crear el proyecto en modo demo');
        return { success: false, error: 'Error al crear proyecto' };
      }
    }

    // Original implementation for non-demo mode
    const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
    if (!userKey) {
      await showErrorAlert('No se encontro informacion del usuario. Por favor, inicie sesion de nuevo.');
      return { success: false, error: 'Usuario no autenticado' };
    }

    const user = JSON.parse(localStorage.getItem(userKey));
    const userId = user.id;

    try {
      const formData = new FormData();
      formData.append('nombreProyecto', nombreProyecto);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('fecha', new Date().toISOString());
      formData.append('lat', parseFloat(lat));
      formData.append('lng', parseFloat(lng));
      formData.append('img', imgFile);
      formData.append('userId', userId);

      const response = await projectService.createProject(formData);

      await showSuccessAlert('Proyecto creado exitosamente.');
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al crear el proyecto');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al crear el proyecto'
      };
    }
  },

  async handleGetAllProjects() {
    if (IS_DEMO_MODE) {
      const projects = demoStorage.getProjects();
      allProjects = projects;
      filteredProjects = [...allProjects];
      return { success: true, data: filteredProjects };
    }

    // Original implementation
    try {
      const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!userKey) {
        throw new Error('Usuario no autenticado');
      }
      const user = JSON.parse(localStorage.getItem(userKey));
      const userId = user?.id;
      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }
      const response = await projectService.getAllProjectsByIdUser(userId);
      allProjects = response;
      filteredProjects = [...allProjects];
      return { success: true, data: filteredProjects };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener los proyectos',
      };
    }
  },

  async handleGetProjectById(id) {
    if (IS_DEMO_MODE) {
      const project = demoStorage.getProjectById(id);
      if (project) {
        return { success: true, data: project };
      }
      return { success: false, error: 'Proyecto no encontrado' };
    }

    // Original implementation
    try {
      const response = await projectService.getProjectById(id);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al obtener el proyecto',
      };
    }
  },

  handleSelectProject(id, navigate) {
    selectedProjectId = id;
    navigate(`/dashboard/detalles/${id}`);
  },

  getSelectedProjectId() {
    return selectedProjectId;
  },

  handleCamera(navigate) {
    if (IS_DEMO_MODE) {
      showCautionAlert('La funcion de camara no esta disponible en modo demo. Requiere conexion con Raspberry Pi.');
      return;
    }
    navigate('takephoto');
  },

  handleCameraDual(navigate) {
    if (IS_DEMO_MODE) {
      showCautionAlert('La funcion de camara dual no esta disponible en modo demo. Requiere conexion con Raspberry Pi.');
      return;
    }
    navigate('takephotodual');
  },

  sortProjectsByDate(type, projects) {
    let sorted;
    if (type === "antiguos") {
      sorted = [...projects].sort((a, b) => new Date(a.Fecha) - new Date(b.Fecha));
    } else if (type === "recientes") {
      sorted = [...projects].sort((a, b) => new Date(b.Fecha) - new Date(a.Fecha));
    }
    return sorted;
  },

  handleSearchChange(value) {
    searchTerm = value.toLowerCase();
    projectViewModel.applyFilters();
    return filteredProjects;
  },

  handleFilterChange(value) {
    filterType = value;
    projectViewModel.applyFilters();
    return filteredProjects;
  },

  applyFilters() {
    let result = [...allProjects];

    if (searchTerm) {
      result = result.filter(p =>
        p.NombreProyecto.toLowerCase().includes(searchTerm) ||
        p.Categoria.toLowerCase().includes(searchTerm)
      );
    }

    if (filterType === 'recientes' || filterType === 'antiguos') {
      result = projectViewModel.sortProjectsByDate(filterType, result);
    }

    filteredProjects = result;
  },

  filterAndSortProjects(projects, searchTerm, sortOption) {
    let result = [...projects];

    if (searchTerm.trim()) {
      result = result.filter((project) =>
        project.NombreProyecto.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortOption === 'az') {
      result.sort((a, b) =>
        a.NombreProyecto.localeCompare(b.NombreProyecto)
      );
    } else if (sortOption === 'recientes') {
      result.sort((a, b) => new Date(b.Fecha).getTime() - new Date(a.Fecha).getTime());
    } else if (sortOption === 'antiguos') {
      result.sort((a, b) => new Date(a.Fecha).getTime() - new Date(b.Fecha).getTime());
    }

    return result;
  },

  handleIrregularidades(navigate, id) {
    if (IS_DEMO_MODE) {
      showCautionAlert('La funcion de medicion de irregularidades no esta disponible en modo demo. Requiere conexion con sensores.');
      return;
    }
    navigate(`/dashboard/detalles/${id}/irregularidades`);
  },

  async handleUpdateProject(id, nombreProyecto, categoria, descripcion, imgFileOrUrl, lat, lng) {
    if (IS_DEMO_MODE) {
      try {
        let imgUrl = imgFileOrUrl;
        
        // Si es un archivo, convertir a base64
        if (imgFileOrUrl instanceof File) {
          imgUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(imgFileOrUrl);
          });
        }

        const updated = demoStorage.updateProject(parseInt(id), {
          NombreProyecto: nombreProyecto,
          Categoria: categoria,
          Descripcion: descripcion,
          Img: imgUrl,
          Lat: parseFloat(lat),
          Lng: parseFloat(lng),
          Fecha: new Date().toISOString(),
        });

        if (updated) {
          await showSuccessAlert('El proyecto ha sido actualizado exitosamente. (Modo Demo)');
          return { success: true, data: updated };
        }
        return { success: false, error: 'Proyecto no encontrado' };
      } catch (error) {
        await showErrorAlert('Error al actualizar el proyecto');
        return { success: false, error: 'Error al actualizar' };
      }
    }

    // Original implementation
    try {
      const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!userKey) throw new Error('Usuario no autenticado');

      const user = JSON.parse(localStorage.getItem(userKey));
      const userId = user?.id;
      if (!userId) throw new Error('No se pudo obtener el ID del usuario');

      const formData = new FormData();
      formData.append('nombreProyecto', nombreProyecto);
      formData.append('categoria', categoria);
      formData.append('descripcion', descripcion);
      formData.append('fecha', new Date().toISOString());
      formData.append('lat', parseFloat(lat));
      formData.append('lng', parseFloat(lng));
      formData.append('userId', userId);

      if (imgFileOrUrl instanceof File) {
        formData.append('img', imgFileOrUrl);
      } else if (typeof imgFileOrUrl === 'string' && imgFileOrUrl) {
        try {
          const response = await fetch(imgFileOrUrl);
          const blob = await response.blob();
          const fileName = imgFileOrUrl.split('/').pop() || 'image.jpg';
          const file = new File([blob], fileName, { type: blob.type });
          formData.append('img', file);
        } catch (fetchError) {
          console.warn('No se pudo descargar la imagen existente:', fetchError);
        }
      }

      const response = await projectService.updateProject(id, formData);
      await showSuccessAlert('El proyecto ha sido actualizado exitosamente.');
      return { success: true, data: response };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al actualizar el proyecto');
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar el proyecto'
      };
    }
  },

  async handleDeleteProject(id, navigate, isLocalAPIAlreadyChecked = null) {
    if (IS_DEMO_MODE) {
      const confirm = await showDeleteConfirmAlert(
        'Este proyecto se eliminara permanentemente. (Modo Demo - los datos se guardan localmente)'
      );

      if (!confirm.isConfirmed) return { success: false };

      const deleted = demoStorage.deleteProject(parseInt(id));
      if (deleted) {
        await showSuccessAlert('Proyecto eliminado exitosamente. (Modo Demo)');
        navigate('/dashboard');
        return { success: true };
      }
      return { success: false, error: 'No se pudo eliminar el proyecto' };
    }

    // Original implementation
    try {
      const isLocalAPIAvailable = isLocalAPIAlreadyChecked !== null 
        ? isLocalAPIAlreadyChecked 
        : await projectService.checkLocalAPIAvailability();
      
      if (!isLocalAPIAvailable) {
        await showErrorAlert(
          'No se puede eliminar el proyecto porque la Raspberry Pi no esta conectada. ' +
          'Conectate a la Raspberry Pi para verificar si hay datos de sensores asociados.'
        );
        return { success: false, error: 'API local no disponible' };
      }

      const [tfLunaData, imxData, mpuData] = await Promise.all([
        projectService.checkSensorData('tfluna', id),
        projectService.checkSensorData('imx477', id),
        projectService.checkSensorData('mpu', id)
      ]);

      const hasSensorData = tfLunaData.exists || imxData.exists || mpuData.exists;

      let confirmText = 'Este proyecto se eliminara permanentemente.';
      
      if (hasSensorData) {
        confirmText += '\n\nSe encontraron datos de sensores asociados que tambien seran eliminados:';
        if (tfLunaData.exists) confirmText += '\n• TF-Luna';
        if (imxData.exists) confirmText += '\n• IMX477';
        if (mpuData.exists) confirmText += '\n• MPU6050';
      } else {
        confirmText += '\n\nNo se encontraron datos de sensores asociados.';
      }

      const confirm = await showDeleteConfirmAlert(confirmText);

      if (!confirm.isConfirmed) return { success: false };

      await projectService.deleteProject(id);

      if (hasSensorData) {
        const deletePromises = [];
        if (tfLunaData.exists) deletePromises.push(projectService.deleteProjectByTFLuna(id));
        if (imxData.exists) deletePromises.push(projectService.deleteProjectByIMX477(id));
        if (mpuData.exists) deletePromises.push(projectService.deleteProjectByMPU6050(id));
        
        await Promise.all(deletePromises);
      }
      
      await showSuccessAlert('Proyecto eliminado exitosamente.');
      await projectViewModel.handleGetAllProjects();
      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      await showErrorAlert(error.response?.data?.error || error.message || 'Error al eliminar el proyecto');
      return { success: false };
    }
  },

  // Sensor functions - In demo mode, show caution alerts
  async handlePostSensorIMX(sensorData) {
    if (IS_DEMO_MODE) {
      await showCautionAlert('Funcion de sensores no disponible en modo demo.');
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await imxService.postSensorIMX(sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
      };
    }
  },

  async handleGetSensorIMXByProjectId(id_project) {
    if (IS_DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await imxService.getSensorIMXByProjectId(id_project);
      const data = response?.data || response;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async handlePostSensorTFLuna(sensorData) {
    if (IS_DEMO_MODE) {
      await showCautionAlert('Funcion de sensores no disponible en modo demo.');
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await tflunaService.postSensortfluna(sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
      };
    }
  },

  async handleGetSensorTFLunaByProjectId(id_project) {
    if (IS_DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await tflunaService.getSensorTFLunaByProjectId(id_project);
      const data = response?.data || response;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async handlePostSensorMPU(sensorData) {
    if (IS_DEMO_MODE) {
      await showCautionAlert('Funcion de sensores no disponible en modo demo.');
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await mpuSensorService.postSensorMPU(sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al guardar datos del sensor'
      };
    }
  },

  async handleGetSensorMPUByProjectId(id_project) {
    if (IS_DEMO_MODE) {
      return { success: true, data: [] };
    }

    try {
      const response = await mpuSensorService.getSensorMPUByProjectId(id_project);
      const data = response?.data || response;
      return { success: true, data: Array.isArray(data) ? data : [] };
    } catch (error) {
      return { success: false, data: [] };
    }
  },

  async handleUpdateSensorTFLuna(sensor_id, sensorData) {
    if (IS_DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await tflunaService.updateSensorTFLuna(sensor_id, sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar datos del sensor TFLuna'
      };
    }
  },

  async handleUpdateDualSensorTFLuna(sensor_id, sensorData) {
    if (IS_DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await tflunaService.updateDualSensorTFLuna(sensor_id, sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar datos dual del sensor TFLuna'
      };
    }
  },

  async handleUpdateSensorMPU(sensor_id, sensorData) {
    if (IS_DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await mpuSensorService.updateSensorMPU(sensor_id, sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar datos del sensor MPU'
      };
    }
  },

  async handleUpdateDualSensorMPU(sensor_id, sensorData) {
    if (IS_DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await mpuSensorService.updateDualSensorMPU(sensor_id, sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar datos dual del sensor MPU'
      };
    }
  },

  async handleUpdateSensorIMX(sensor_id, sensorData) {
    if (IS_DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await imxService.updateSensorIMX(sensor_id, sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar datos del sensor IMX'
      };
    }
  },

  async handleUpdateDualSensorIMX(sensor_id, sensorData) {
    if (IS_DEMO_MODE) {
      return { success: false, error: 'Demo mode' };
    }

    try {
      const response = await imxService.updateDualSensorIMX(sensor_id, sensorData);
      return { success: true, data: response };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Error al actualizar datos dual del sensor IMX'
      };
    }
  },

  async handleGetWeeklyStats() {
    if (IS_DEMO_MODE) {
      const stats = demoStorage.getWeeklyStats(1);
      
      // Obtener los ultimos 7 dias
      const today = new Date();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      const dailyMap = {};
      stats.daily.forEach(item => {
        dailyMap[item.date] = item.count;
      });

      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

      const formattedData = last7Days.map(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        const diaNombre = diasSemana[date.getDay()];
        const count = dailyMap[dateStr] || 0;

        return {
          dia: diaNombre,
          proyectos: count,
          fecha: dateStr
        };
      });

      return { 
        success: true, 
        data: formattedData,
        total: stats.total_count
      };
    }

    // Original implementation
    try {
      const userKey = Object.keys(localStorage).find(k => k.startsWith('loggeduser:'));
      if (!userKey) {
        throw new Error('Usuario no autenticado');
      }
      const user = JSON.parse(localStorage.getItem(userKey));
      const userId = user?.id;

      if (!userId) {
        throw new Error('No se pudo obtener el ID del usuario');
      }

      const response = await projectService.getCountLastWeek(userId);
      
      if (!response.success || !response.data) {
        throw new Error('Respuesta invalida del servidor');
      }

      const today = new Date();
      const last7Days = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        last7Days.push(date.toISOString().split('T')[0]);
      }

      const dailyMap = {};
      response.data.daily.forEach(item => {
        dailyMap[item.date] = item.count;
      });

      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];

      const formattedData = last7Days.map(dateStr => {
        const date = new Date(dateStr + 'T00:00:00');
        const diaNombre = diasSemana[date.getDay()];
        const count = dailyMap[dateStr] || 0;

        return {
          dia: diaNombre,
          proyectos: count,
          fecha: dateStr
        };
      });

      return { 
        success: true, 
        data: formattedData,
        total: response.data.total_count
      };
    } catch (error) {
      console.error('Error al obtener estadisticas semanales:', error);
      return {
        success: false,
        error: error.message || 'Error al obtener estadisticas semanales',
        data: [],
        total: 0
      };
    }
  } 
};
