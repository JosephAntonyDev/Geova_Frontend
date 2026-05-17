import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoContextType {
  isDemo: boolean;
  showDemoModal: boolean;
  setShowDemoModal: (show: boolean) => void;
  demoUser: DemoUser;
}

export interface DemoUser {
  id: number;
  Username: string;
  Nombre: string;
  Apellidos: string;
  Email: string;
}

export interface DemoProject {
  Id: number;
  NombreProyecto: string;
  Categoria: string;
  Descripcion: string;
  Fecha: string;
  Img: string;
  Lat: number;
  Lng: number;
  userId: number;
}

const defaultDemoUser: DemoUser = {
  id: 1,
  Username: 'demo_user',
  Nombre: 'Usuario',
  Apellidos: 'Demo',
  Email: 'demo@geova.app',
};

// Imagenes de ejemplo de proyectos de construccion
const projectImages = [
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80',
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800&q=80',
  'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=800&q=80',
  'https://images.unsplash.com/photo-1590274853856-f22d5ee3d228?w=800&q=80',
  'https://images.unsplash.com/photo-1593642532454-e138e28a63f4?w=800&q=80',
];

export const initialDemoProjects: DemoProject[] = [
  {
    Id: 1,
    NombreProyecto: 'Edificio Residencial Aurora',
    Categoria: 'Residencial',
    Descripcion: 'Proyecto de construccion de un complejo habitacional de 12 pisos con 48 departamentos, areas verdes y estacionamiento subterraneo. Incluye acabados de lujo y tecnologia smart home.',
    Fecha: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    Img: projectImages[0],
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
    Img: projectImages[1],
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
    Img: projectImages[2],
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
    Img: projectImages[3],
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
    Img: projectImages[4],
    Lat: 19.0414,
    Lng: -98.2063,
    userId: 1,
  },
];

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: ReactNode }) {
  // En modo demo, siempre es true
  const isDemo = true;
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Inicializar proyectos demo en localStorage si no existen
  useEffect(() => {
    const existingProjects = localStorage.getItem('demo_projects');
    if (!existingProjects) {
      localStorage.setItem('demo_projects', JSON.stringify(initialDemoProjects));
    }
  }, []);

  return (
    <DemoContext.Provider
      value={{
        isDemo,
        showDemoModal,
        setShowDemoModal,
        demoUser: defaultDemoUser,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error('useDemo must be used within a DemoProvider');
  }
  return context;
}

// Helper functions para manejar datos demo en localStorage
export const demoStorage = {
  getProjects(): DemoProject[] {
    const stored = localStorage.getItem('demo_projects');
    if (stored) {
      return JSON.parse(stored);
    }
    localStorage.setItem('demo_projects', JSON.stringify(initialDemoProjects));
    return initialDemoProjects;
  },

  saveProjects(projects: DemoProject[]) {
    localStorage.setItem('demo_projects', JSON.stringify(projects));
  },

  addProject(project: Omit<DemoProject, 'Id'>): DemoProject {
    const projects = this.getProjects();
    const newId = Math.max(...projects.map((p) => p.Id), 0) + 1;
    const newProject = { ...project, Id: newId };
    projects.push(newProject);
    this.saveProjects(projects);
    return newProject;
  },

  updateProject(id: number, updates: Partial<DemoProject>): DemoProject | null {
    const projects = this.getProjects();
    const index = projects.findIndex((p) => p.Id === id);
    if (index === -1) return null;
    projects[index] = { ...projects[index], ...updates };
    this.saveProjects(projects);
    return projects[index];
  },

  deleteProject(id: number): boolean {
    const projects = this.getProjects();
    const filtered = projects.filter((p) => p.Id !== id);
    if (filtered.length === projects.length) return false;
    this.saveProjects(filtered);
    return true;
  },

  getProjectById(id: number): DemoProject | undefined {
    return this.getProjects().find((p) => p.Id === id);
  },

  getProjectsByUser(userId: number): DemoProject[] {
    return this.getProjects().filter((p) => p.userId === userId);
  },

  getWeeklyStats(userId: number) {
    const projects = this.getProjectsByUser(userId);
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const dailyMap: Record<string, number> = {};
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

  resetToInitial() {
    localStorage.setItem('demo_projects', JSON.stringify(initialDemoProjects));
  },
};
