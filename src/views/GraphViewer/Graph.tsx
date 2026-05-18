import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Legend, LineChart, Line
} from 'recharts';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { projectService } from '../../services/ProjectService';
import { showCautionAlert } from '../../utils/alerts';
import './GraphViewer.css';

// Colores para las diferentes mediciones
const MEASUREMENT_COLORS = [
  '#DC2626', // Rojo - Medición 1
  '#2563EB', // Azul - Medición 2
  '#F59E0B', // Amarillo - Medición 3
  '#10B981', // Verde - Medición 4
  '#8B5CF6', // Púrpura - Medición 5
  '#EC4899', // Rosa - Medición 6
  '#06B6D4', // Cyan - Medición 7
  '#F97316', // Naranja - Medición 8
];

// Colores para gráficas circulares
const CIRCULAR_COLORS = {
  luminosidad: '#F59E0B',
  calidad: '#1E40AF',
  nitidez: '#031328',
};

// Componente de gráfica circular pequeña
interface CircularMetricProps {
  value: number;
  label: string;
  color: string;
  maxValue?: number;
}

const CircularMetric = React.memo(({ value, label, color, maxValue = 100 }: CircularMetricProps) => {
  const percentage = Math.min((value / maxValue) * 100, 100);
  const pieData = [
    { name: label, value: percentage },
    { name: 'Restante', value: 100 - percentage },
  ];
  
  return (
    <div className="circular-metric-item">
      <div className="circular-chart-small">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={35}
              paddingAngle={0}
              dataKey="value"
              strokeWidth={0}
            >
              <Cell fill={color} />
              <Cell fill="#E5E7EB" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="circular-value-center">
          {value.toFixed(2)}
        </div>
      </div>
      <div className="circular-label">
        <span className="color-dot" style={{ backgroundColor: color }}></span>
        <span>{label}</span>
      </div>
    </div>
  );
});

// Demo mode flag
const IS_DEMO_MODE = true;

// Generar datos simulados para modo demo
const generateDemoData = (projectId: string | undefined) => {
  const parsedId = projectId ? parseInt(projectId) : 1;
  const seed = isNaN(parsedId) ? 1 : parsedId;
  
  // Datos simulados para sensor IMX (camara)
  const demoIMX = Array.from({ length: 4 }, (_, i) => ({
    calidad_frame: 0.75 + Math.sin(seed + i) * 0.15,
    luminosidad_promedio: 120 + Math.cos(seed + i * 2) * 40,
    probabilidad_confiabilidad: 78 + Math.sin(seed + i * 1.5) * 12,
    nitidez_score: 280 + Math.cos(seed + i) * 80,
  }));
  
  // Datos simulados para sensor TF Luna (distancia)
  const demoTF = [
    { distancia_cm: 1250 + seed * 10, temperatura: 24.5, fuerza_senal: 15000 },
    { distancia_cm: 980 + seed * 8, temperatura: 25.2, fuerza_senal: 14500 },
    { distancia_cm: 1180 + seed * 12, temperatura: 24.8, fuerza_senal: 15200 },
    { distancia_cm: 920 + seed * 6, temperatura: 25.0, fuerza_senal: 14800 },
  ];
  
  // Datos simulados para sensor MPU (inclinacion)
  const demoMPU = Array.from({ length: 6 }, (_, i) => ({
    roll: 2.5 + Math.sin(seed + i * 0.5) * 3,
    pitch: 1.8 + Math.cos(seed + i * 0.7) * 2.5,
    apertura: 45 + Math.sin(seed + i) * 15,
  }));
  
  return { demoIMX, demoTF, demoMPU };
};

function GraphViewer() {
  const { id } = useParams();
  const [dataIMX, setDataIMX] = useState<any[]>([]);
  const [dataTF, setDataTF] = useState<any[]>([]);
  const [dataMPU, setDataMPU] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizarLuminosidad = useCallback((lum: number) => Math.min((lum / 255) * 100, 100), []);
  const normalizarNitidez = useCallback((nit: number) => Math.min((nit / 500) * 100, 100), []);

  // Obtener datos
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      // En modo demo, cargar datos simulados
      if (IS_DEMO_MODE) {
        const { demoIMX, demoTF, demoMPU } = generateDemoData(id);
        setDataIMX(demoIMX);
        setDataTF(demoTF);
        setDataMPU(demoMPU);
        setLoading(false);
        return;
      }
      
      try {
        // Primero verificar si la Raspberry Pi esta conectada
        const isLocalAPIAvailable = await projectService.checkLocalAPIAvailability();
        
        if (!isLocalAPIAvailable) {
          // Mostrar una sola alerta de que la Raspberry esta desconectada
          await showCautionAlert(
            'Raspberry Pi desconectada',
            'No se pueden cargar los datos de sensores porque la Raspberry Pi no esta conectada.'
          );
          setLoading(false);
          return;
        }

        const imx = await projectViewModel.handleGetSensorIMXByProjectId(id);
        const tf = await projectViewModel.handleGetSensorTFLunaByProjectId(id);
        const mpu = await projectViewModel.handleGetSensorMPUByProjectId(id);

        if (imx.success && imx.data.length > 0) {
          setDataIMX(imx.data);
        }
        if (tf.success && tf.data.length > 0) {
          setDataTF(tf.data);
        }
        if (mpu.success && mpu.data.length > 0) {
          setDataMPU(mpu.data);
        }
      } catch (error) {
        console.error('Error obteniendo datos de sensores:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [id]);

  // Nombres de los lados del terreno
  const NOMBRES_LADOS = ['Norte', 'Este', 'Sur', 'Oeste'];

  // Calcular medidas del terreno desde TF Luna (hasta 4 lados)
  const medidasTerreno = useMemo(() => {
    if (dataTF.length === 0) return null;
    
    // Obtener las medidas de cada lado (hasta 4)
    const lados = dataTF.slice(0, 4).map((d, i) => ({
      numero: i + 1,
      medida: d.distancia_cm ? (d.distancia_cm / 100) : 0, // en metros
      nombre: NOMBRES_LADOS[i],
      label: `${NOMBRES_LADOS[i]} #${i + 1}`
    })).filter(l => l.medida > 0);

    if (lados.length === 0) return null;

    // Calcular área según número de lados
    let area = 0;
    if (lados.length === 1) {
      area = lados[0].medida; // Solo longitud
    } else if (lados.length === 2) {
      area = lados[0].medida * lados[1].medida; // Rectángulo
    } else if (lados.length === 3) {
      // Fórmula de Herón para triángulo
      const a = lados[0].medida;
      const b = lados[1].medida;
      const c = lados[2].medida;
      const s = (a + b + c) / 2;
      const areaCalc = Math.sqrt(s * (s - a) * (s - b) * (s - c));
      area = isNaN(areaCalc) ? (a * b) / 2 : areaCalc; // Si no forma triángulo válido, aproximar
    } else if (lados.length >= 4) {
      // Para cuadrilátero, aproximar como si fueran dos triángulos o usar lados opuestos
      const a = lados[0].medida;
      const b = lados[1].medida;
      const c = lados[2].medida;
      const d = lados[3].medida;
      // Fórmula de Brahmagupta para cuadrilátero cíclico (aproximación)
      const s = (a + b + c + d) / 2;
      area = Math.sqrt((s - a) * (s - b) * (s - c) * (s - d));
      if (isNaN(area)) area = ((a + c) / 2) * ((b + d) / 2); // Fallback
    }
    
    return { lados, area, cantidadLados: lados.length };
  }, [dataTF]);

  // Componente para dibujar la forma del terreno (proporcional a las medidas)
  const TerrenoShape = ({ lados }: { lados: { numero: number; medida: number; nombre: string; label: string }[] }) => {
    const svgSize = 200;
    const margin = 25;
    const drawArea = svgSize - margin * 2;
    
    const centerX = svgSize / 2;
    const centerY = svgSize / 2;

    // Colores de las etiquetas
    const labelColors = ['#DC2626', '#2563EB', '#F59E0B', '#10B981'];

    // Normalizar medidas para el SVG
    const maxMedida = Math.max(...lados.map(l => l.medida));
    const scale = drawArea / (maxMedida * 1.5);

    // Renderizar etiqueta con círculo (fuera del terreno)
    const renderLabel = (x: number, y: number, num: number, color: string) => (
      <g key={`label-${num}`}>
        <circle cx={x} cy={y} r="11" fill={color} />
        <text x={x} y={y + 4} textAnchor="middle" fontSize="9" fill="white" fontWeight="bold">
          #{num}
        </text>
      </g>
    );

    // Generar la forma basada en cantidad de lados CON PROPORCIONES REALES
    const renderShape = () => {
      if (lados.length === 1) {
        const len = lados[0].medida * scale;
        return (
          <>
            <line 
              x1={centerX - len/2} y1={centerY} 
              x2={centerX + len/2} y2={centerY}
              stroke="#F59E0B" 
              strokeWidth="4"
              strokeLinecap="round"
            />
            {renderLabel(centerX, centerY - 18, 1, labelColors[0])}
          </>
        );
      } else if (lados.length === 2) {
        const l1 = lados[0].medida * scale; // Norte (horizontal)
        const l2 = lados[1].medida * scale; // Este (vertical)
        
        const x1 = centerX - l1/2;
        const x2 = centerX + l1/2;
        const y1 = centerY - l2/2;
        const y2 = centerY + l2/2;
        
        return (
          <>
            <polyline 
              points={`${x1},${y2} ${x1},${y1} ${x2},${y1}`}
              fill="none"
              stroke="#F59E0B" 
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Etiqueta 1: Norte (horizontal arriba) */}
            {renderLabel((x1 + x2) / 2, y1 - 15, 1, labelColors[0])}
            {/* Etiqueta 2: Este (vertical izquierda) */}
            {renderLabel(x1 - 15, (y1 + y2) / 2, 2, labelColors[1])}
          </>
        );
      } else if (lados.length === 3) {
        const l1 = lados[0].medida * scale;
        const l2 = lados[1].medida * scale;
        
        // Triángulo con base l2 y lados l1 y l3
        const baseWidth = l2;
        const height = Math.sqrt(Math.max(0, l1 * l1 - (baseWidth/2) * (baseWidth/2))) || l1 * 0.8;
        
        const topX = centerX;
        const topY = centerY - height/2;
        const leftX = centerX - baseWidth/2;
        const rightX = centerX + baseWidth/2;
        const bottomY = centerY + height/2;
        
        return (
          <>
            <polygon 
              points={`${topX},${topY} ${rightX},${bottomY} ${leftX},${bottomY}`}
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#F59E0B" 
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {renderLabel((topX + rightX) / 2 + 15, (topY + bottomY) / 2 - 5, 1, labelColors[0])}
            {renderLabel(centerX, bottomY + 15, 2, labelColors[1])}
            {renderLabel((topX + leftX) / 2 - 15, (topY + bottomY) / 2 - 5, 3, labelColors[2])}
          </>
        );
      } else {
        // 4 lados: rectángulo con dimensiones proporcionales
        // Norte y Sur son horizontales (ancho), Este y Oeste son verticales (alto)
        const norte = lados[0].medida * scale;  // ancho superior
        const este = lados[1].medida * scale;   // altura derecha
        const sur = lados[2].medida * scale;    // ancho inferior
        const oeste = lados[3].medida * scale;  // altura izquierda
        
        // Calcular los 4 vértices del cuadrilátero
        // El ancho superior puede ser diferente al inferior
        const anchoSuperior = norte;
        const anchoInferior = sur;
        const altoIzquierdo = oeste;
        const altoDerecho = este;
        
        // Centrar basándose en el promedio
        
        // Vértices: esquina superior izquierda, superior derecha, inferior derecha, inferior izquierda
        const topLeft = { 
          x: centerX - anchoSuperior/2, 
          y: centerY - altoIzquierdo/2 
        };
        const topRight = { 
          x: centerX + anchoSuperior/2, 
          y: centerY - altoDerecho/2 
        };
        const bottomRight = { 
          x: centerX + anchoInferior/2, 
          y: centerY + altoDerecho/2 
        };
        const bottomLeft = { 
          x: centerX - anchoInferior/2, 
          y: centerY + altoIzquierdo/2 
        };
        
        const points = `${topLeft.x},${topLeft.y} ${topRight.x},${topRight.y} ${bottomRight.x},${bottomRight.y} ${bottomLeft.x},${bottomLeft.y}`;
        
        // Posiciones de etiquetas (en el centro de cada lado, afuera)
        const labelNorte = { x: (topLeft.x + topRight.x) / 2, y: Math.min(topLeft.y, topRight.y) - 14 };
        const labelEste = { x: Math.max(topRight.x, bottomRight.x) + 14, y: (topRight.y + bottomRight.y) / 2 };
        const labelSur = { x: (bottomLeft.x + bottomRight.x) / 2, y: Math.max(bottomLeft.y, bottomRight.y) + 14 };
        const labelOeste = { x: Math.min(topLeft.x, bottomLeft.x) - 14, y: (topLeft.y + bottomLeft.y) / 2 };
        
        return (
          <>
            <polygon 
              points={points}
              fill="rgba(245, 158, 11, 0.2)"
              stroke="#F59E0B" 
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {renderLabel(labelNorte.x, labelNorte.y, 1, labelColors[0])}
            {renderLabel(labelEste.x, labelEste.y, 2, labelColors[1])}
            {renderLabel(labelSur.x, labelSur.y, 3, labelColors[2])}
            {renderLabel(labelOeste.x, labelOeste.y, 4, labelColors[3])}
          </>
        );
      }
    };

    return (
      <svg width={svgSize} height={svgSize} className="terreno-shape-svg">
        {/* Fondo con grid */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#E5E7EB" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Forma del terreno con etiquetas */}
        {renderShape()}
        
        {/* Etiqueta de cantidad de lados */}
        <text x={svgSize/2} y={svgSize - 5} textAnchor="middle" fontSize="10" fill="#6B7280">
          {lados.length === 1 ? '1 lado medido' : `${lados.length} lados medidos`}
        </text>
      </svg>
    );
  };

  // Colores para los números de medición
  const COLORES_MEDICION = ['#DC2626', '#2563EB', '#F59E0B', '#10B981'];

  // Datos para la gráfica radar de cámara (múltiples mediciones)
  const radarCameraData = useMemo(() => {
    if (dataIMX.length === 0) return [];
    
    return [
      { atributo: 'Calidad' },
      { atributo: 'Luminosidad' },
      { atributo: 'Confiabilidad' },
      { atributo: 'Nitidez' },
    ].map(item => {
      const result: any = { ...item };
      dataIMX.forEach((data, index) => {
        if (item.atributo === 'Calidad') {
          result[`medicion${index + 1}`] = Number((data.calidad_frame * 100).toFixed(2));
        } else if (item.atributo === 'Luminosidad') {
          result[`medicion${index + 1}`] = Number(normalizarLuminosidad(data.luminosidad_promedio).toFixed(2));
        } else if (item.atributo === 'Confiabilidad') {
          result[`medicion${index + 1}`] = Number((data.probabilidad_confiabilidad).toFixed(2));
        } else if (item.atributo === 'Nitidez') {
          result[`medicion${index + 1}`] = Number(normalizarNitidez(data.nitidez_score).toFixed(2));
        }
      });
      return result;
    });
  }, [dataIMX, normalizarLuminosidad, normalizarNitidez]);

  // Datos para la gráfica de líneas de inclinación
  // Apertura va positiva (arriba), Inclinación va negativa (abajo)
  const lineInclinationData = useMemo(() => {
    if (dataMPU.length === 0) return [];
    
    return dataMPU.slice(0, 8).map((data, index) => {
      const inclinacion = Math.abs((data.roll || 0) + (data.pitch || 0));
      const apertura = Math.abs(data.apertura || 0);
      return {
        name: `Medición ${index + 1}`,
        Inclinación: -Number(inclinacion.toFixed(1)), // Negativo para que vaya abajo
        Apertura: Number(apertura.toFixed(1)), // Positivo para que vaya arriba
      };
    });
  }, [dataMPU]);

  // Función para evaluar la fuerza de señal del TF Luna
  const evaluarFuerzaSenal = useCallback((fuerza: number): string => {
    if (fuerza >= 100 && fuerza <= 32767) return 'Buena';
    if (fuerza > 32767 && fuerza <= 65535) return 'Saturada';
    if (fuerza >= 0 && fuerza < 100) return 'Débil';
    return 'Desconocida';
  }, []);

  // Datos para la gráfica de líneas del TF Luna (Temperatura y Fuerza de Señal)
  // Temperatura va positiva (arriba), Fuerza de Señal normalizada va negativa (abajo)
  const lineTFLunaData = useMemo(() => {
    if (dataTF.length === 0) return [];
    
    // Encontrar el máximo de fuerza de señal para normalizar
    const maxFuerza = Math.max(...dataTF.map(d => d.fuerza_senal || d.signalStrength || 0));
    const maxTemp = Math.max(...dataTF.map(d => d.temperatura || 0));
    
    return dataTF.slice(0, 8).map((data, index) => {
      const temp = data.temperatura || 0;
      const fuerza = data.fuerza_senal || data.signalStrength || 0;
      // Normalizar fuerza de señal al mismo rango que temperatura y hacerlo negativo
      const fuerzaNormalizada = maxFuerza > 0 ? (fuerza / maxFuerza) * maxTemp : 0;
      return {
        name: `Medición ${index + 1}`,
        Temperatura: Number(temp.toFixed(1)),
        FuerzaSenal: -Number(fuerzaNormalizada.toFixed(1)), // Negativo para que vaya abajo
        FuerzaOriginal: fuerza, // Guardar valor original para tooltip
      };
    });
  }, [dataTF]);

  // Datos para gráficas circulares de cámara (promedios)
  const cameraAverages = useMemo(() => {
    if (dataIMX.length === 0) return null;
    
    const totalLuminosidad = dataIMX.reduce((sum, d) => sum + normalizarLuminosidad(d.luminosidad_promedio), 0);
    const totalCalidad = dataIMX.reduce((sum, d) => sum + (d.calidad_frame * 100), 0);
    const totalNitidez = dataIMX.reduce((sum, d) => sum + normalizarNitidez(d.nitidez_score), 0);
    
    return {
      luminosidad: totalLuminosidad / dataIMX.length,
      calidad: totalCalidad / dataIMX.length,
      nitidez: totalNitidez / dataIMX.length,
    };
  }, [dataIMX, normalizarLuminosidad, normalizarNitidez]);

  const hasData = useMemo(() => 
    dataIMX.length > 0 || dataTF.length > 0 || dataMPU.length > 0, 
    [dataIMX.length, dataTF.length, dataMPU.length]
  );

  if (loading) {
    return (
      <div className="GraphViewerContainer" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666'
      }}>
        <div>
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>⏳</div>
          Cargando datos de sensores...
        </div>
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="GraphContainer" style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '400px',
        fontSize: '18px',
        color: '#666',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}></div>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>
          No hay mediciones registradas
        </h3>
        <p style={{ margin: '0', color: '#666' }}>
          Realiza una medicion desde el modulo de captura para ver las graficas aqui.
        </p>
      </div>
    );
  }

  return (
    <div className="GraphViewerContainer">
      {/* Banner de datos simulados en modo demo */}
      {isDemoData && (
        <div className="demo-data-banner">
          <i className="bx bx-info-circle"></i>
          <span>Datos simulados - En produccion se mostrarian datos reales de los sensores</span>
        </div>
      )}
      
      {/* Solo mostrar graficas si hay datos */}
      {hasData ? (
        <>
          {/* Sección: Medidas del terreno */}
          <div className="section-header">
            <i className="bx bx-ruler"></i>
            <h2>Medidas del terreno, sensor TF Luna</h2>
          </div>

          {medidasTerreno && medidasTerreno.lados.length > 0 ? (
            <div className="medidas-terreno-container">
              <div className="medidas-content">
                {/* Dibujo de la forma del terreno */}
                <div className="terreno-shape-container">
                  <TerrenoShape lados={medidasTerreno.lados} />
                </div>
                
                {/* Lista de medidas */}
                <div className="medidas-box">
                  {medidasTerreno.lados.map((lado, index) => (
                    <div className="medida-row" key={index}>
                      <span className="medida-numero" style={{ backgroundColor: COLORES_MEDICION[index] }}>#{lado.numero}</span>
                      <span className="medida-label">{lado.nombre}:</span>
                      <span className="medida-line"></span>
                      <span className="medida-value">{lado.medida.toFixed(2)}m</span>
                    </div>
                  ))}
                  <div className="medida-row area-row">
                    <span className="medida-label">Área total:</span>
                <span className="medida-line"></span>
                <span className="medida-value area-value">{medidasTerreno.area.toFixed(2)}m²</span>
              </div>
              {/* Helper de instrucciones */}
              <div className="medidas-helper">
                <i className="bx bx-info-circle"></i>
                <span>El número (#) indica el orden de medición del sensor TF Luna</span>
              </div>
            </div>
          </div>
          
          {/* Gráfica de Temperatura y Fuerza de Señal del TF Luna */}
          {lineTFLunaData.length > 0 && (
            <div className="tf-chart-container">
              <h3>Temperatura y Fuerza de Señal</h3>
              <div className="tf-chart-wrapper">
                <ResponsiveContainer width="100%" height={380}>
                  <LineChart data={lineTFLunaData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => {
                        if (name === 'Temperatura') return [`${Math.abs(value).toFixed(2)} °C`, 'Temperatura'];
                        if (name === 'Fuerza Señal') {
                          const original = props.payload.FuerzaOriginal;
                          return [`${original.toFixed(0)} (${evaluarFuerzaSenal(original)})`, 'Fuerza Señal'];
                        }
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Temperatura" 
                      stroke="#007eb5" 
                      strokeWidth={3}
                      dot={false}
                      name="Temperatura"
                      animationDuration={500}
                      animationEasing="ease-in-out"
                      isAnimationActive={true}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="FuerzaSenal" 
                      stroke="#c87f00" 
                      strokeWidth={3}
                      dot={false}
                      name="Fuerza Señal"
                      animationDuration={500}
                      animationEasing="ease-in-out"
                      isAnimationActive={true}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Sección: Estadísticas de la cámara */}
      {dataIMX.length > 0 && (
        <>
          <div className="section-header">
            <i className="bx bx-camera"></i>
            <h2>Estadísticas de la cámara</h2>
          </div>

          <div className="camera-stats-container">
            {/* Gráfica Radar con múltiples mediciones */}
            <div className="radar-section">
              <h3>Datos estadísticos de la cámara</h3>
              <div className="radar-chart-wrapper">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={radarCameraData} cx="50%" cy="50%" outerRadius="65%">
                    <PolarGrid />
                    <PolarAngleAxis dataKey="atributo" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                    {dataIMX.slice(0, 8).map((_, index) => (
                      <Radar
                        key={`radar-${index}`}
                        name={`Medición ${index + 1}`}
                        dataKey={`medicion${index + 1}`}
                        stroke={MEASUREMENT_COLORS[index]}
                        fill={MEASUREMENT_COLORS[index]}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Tooltip />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Gráficas circulares */}
            {cameraAverages && (
              <div className="circular-stats-section">
                <CircularMetric 
                  value={cameraAverages.luminosidad} 
                  label="Luminosidad" 
                  color={CIRCULAR_COLORS.luminosidad} 
                />
                <CircularMetric 
                  value={cameraAverages.calidad} 
                  label="Calidad" 
                  color={CIRCULAR_COLORS.calidad} 
                />
                <CircularMetric 
                  value={cameraAverages.nitidez} 
                  label="Nitidez" 
                  color={CIRCULAR_COLORS.nitidez} 
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* Sección: Estadísticas de inclinación */}
      {dataMPU.length > 0 && (
        <>
          <div className="section-header">
            <i className="bx bx-compass"></i>
            <h2>Gráficas del sensor MPU</h2>
          </div>

          <div className="mpu-chart-container">
            <h3>Inclinación y Apertura</h3>
            <div className="mpu-chart-wrapper">
              <ResponsiveContainer width="100%" height={380}>
                <LineChart data={lineInclinationData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    label={{ value: 'Grados (°)', angle: -90, position: 'insideLeft', fill: '#808080' }} 
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      // Mostrar valor absoluto en el tooltip
                      if (name === 'Inclinación') return [`${Math.abs(value).toFixed(2)} °`, 'Inclinación'];
                      if (name === 'Apertura') return [`${Math.abs(value).toFixed(2)} °`, 'Apertura'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Apertura" 
                    stroke="#007eb5" 
                    strokeWidth={3}
                    dot={false}
                    name="Apertura"
                    animationDuration={500}
                    animationEasing="ease-in-out"
                    isAnimationActive={true}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Inclinación" 
                    stroke="#c87f00" 
                    strokeWidth={3}
                    dot={false}
                    name="Inclinación"
                    animationDuration={500}
                    animationEasing="ease-in-out"
                    isAnimationActive={true}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
        </>
      ) : null}
    </div>
  );
}

export default GraphViewer;
