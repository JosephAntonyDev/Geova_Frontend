import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { projectViewModel } from '../../viewmodels/ProjectViewModel';
import { projectService } from '../../services/ProjectService';
import { showCautionAlert } from '../../utils/alerts';

// Demo mode flag
const IS_DEMO_MODE = true;

function GraphViewer() {
  const { id } = useParams();
  const [dataIMX, setDataIMX] = useState([]);
  const [dataTF, setDataTF] = useState([]);
  const [dataMPU, setDataMPU] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  const evaluarFPS = useCallback((fps) => {
    if (fps >= 24) return ' (Buena)';
    if (fps >= 15) return ' (Media)';
    return ' (Mala)';
  }, []);

  const evaluarFuerzaSenal = useCallback((valor) => {
    if (valor >= 10000) return 'Muy buena';
    if (valor >= 4000) return 'Buena';
    if (valor >= 2000) return 'Aceptable';
    if (valor >= 1000) return 'Baja';
    return 'Muy baja';
  }, []);

  const normalizarLuminosidad = useCallback((lum) => Math.min((lum / 255) * 100, 100), []);
  const normalizarNitidez = useCallback((nit) => Math.min((nit / 500) * 100, 100), []);

  const formatDate = useCallback((fecha) => {
    const date = new Date(fecha);
    return isNaN(date.getTime()) ? 'Fecha inválida' : date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);
  const IMXRadarCard = React.memo(({ data, index }) => {
    const radarData = useMemo(() => [
      {
        atributo: 'Calidad',
        valor: Number((data.calidad_frame * 100).toFixed(2)),
        evaluacion: evaluarFPS(data.calidad_frame * 30),
      },
      {
        atributo: 'Nitidez',
        valor: Number(normalizarNitidez(data.nitidez_score).toFixed(2)),
      },
      {
        atributo: 'Luminosidad',
        valor: Number(normalizarLuminosidad(data.luminosidad_promedio).toFixed(2)),
      },
      {
        atributo: 'Confiabilidad',
        valor: Number((data.probabilidad_confiabilidad).toFixed(2)),
      },
    ], [data]);

    const formattedDate = useMemo(() => 
      formatDate(data.fecha || data.timestamp), 
      [data.fecha, data.timestamp]
    );

    return (
      <div className="GraphCard">
        <div className="GraphCardHeader">
          <h4 className="GraphCardTitle">Medición #{index + 1}</h4>
          <span className="GraphCardDate">{formattedDate}</span>
        </div>
        <div className="GraphCardContent">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="atributo" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="Valores"
                dataKey="valor"
                stroke="black"
                fill="#E6AF2E"
                fillOpacity={0.6}
              />
              <Tooltip formatter={(value, name, props) => {
                const atributo = props?.payload?.atributo;
                const evaluacion = props?.payload?.evaluacion || '';
                return [`${value} %${evaluacion}`, atributo];
              }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  });
  const PieGraphCard = React.memo(({ data, index, title, dataKey, unit, colors, formatter, maxValue }) => {
    const { pieData, value } = useMemo(() => {
      const val = data[dataKey] || 0;
      const percentage = maxValue ? Math.min((val / maxValue) * 100, 100) : val;
      const remaining = 100 - percentage;
      
      return {
        value: val,
        pieData: [
          {
            name: title,
            value: percentage,
            rawValue: val,
            unit: unit
          },
          {
            name: 'Restante',
            value: remaining,
            rawValue: maxValue ? maxValue - val : 100 - val,
            unit: unit
          }
        ]
      };
    }, [data, dataKey, title, unit, maxValue]);

    const formattedDate = useMemo(() => 
      formatDate(data.fecha || data.timestamp), 
      [data.fecha, data.timestamp]
    );

    const tooltipFormatter = useCallback((value, name, props) => {
      if (name === 'Restante') return null;
      const rawValue = props.payload.rawValue;
      return formatter ? formatter(rawValue) : [`${rawValue?.toFixed(2)} ${unit}`, title];
    }, [formatter, unit, title]);

    const legendFormatter = useCallback((value, entry) => {
      if (value === 'Restante') return null;
      return <span style={{ color: entry.color }}>{value}</span>;
    }, []);

    return (
      <div className="GraphCard">
        <div className="GraphCardHeader">
          <h4 className="GraphCardTitle">{title} - Medición #{index + 1}</h4>
          <span className="GraphCardDate">{formattedDate}</span>
        </div>
        <div className="GraphCardContent">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
              >
                <Cell fill={colors[0]} />
                <Cell fill={colors[1]} />
              </Pie>
              <Tooltip 
                formatter={tooltipFormatter}
                labelFormatter={() => ''}
              />
              <Legend formatter={legendFormatter} />
              <text 
                x="50%" 
                y="45%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="pie-center-text-value"
                fontSize="24"
                fontWeight="bold"
                fill="#333"
              >
                {value?.toFixed(1)}
              </text>
              <text 
                x="50%" 
                y="55%" 
                textAnchor="middle" 
                dominantBaseline="middle" 
                className="pie-center-text-unit"
                fontSize="14"
                fill="#666"
              >
                {unit}
              </text>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  });

  useEffect(() => {
    if (!dataFetched) {
      async function fetchData() {
        setLoading(true);
        
        // En modo demo, mostrar mensaje sin intentar conexion
        if (IS_DEMO_MODE) {
          setDataFetched(true);
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
            setDataFetched(true);
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
          
          setDataFetched(true);
        } catch (error) {
          console.error('Error obteniendo datos de sensores:', error);
        } finally {
          setLoading(false);
        }
      }

      fetchData();
    }
  }, [id, dataFetched]);

  useEffect(() => {
    setDataFetched(false);
    setDataIMX([]);
    setDataTF([]);
    setDataMPU([]);
  }, [id]);

  const hasData = useMemo(() => 
    dataIMX.length > 0 || dataTF.length > 0 || dataMPU.length > 0, 
    [dataIMX.length, dataTF.length, dataMPU.length]
  );

  const imxSection = useMemo(() => {
    if (dataIMX.length === 0) return null;
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor IMX - Calidad, Nitidez y Confiabilidad</h2>
          <div className="graph-count">{dataIMX.length} mediciones</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            {dataIMX.map((data, index) => (
              <IMXRadarCard key={`imx-${index}-${data.id || index}`} data={data} index={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }, [dataIMX]);

  const tfDistanceSection = useMemo(() => {
    if (dataTF.length === 0) return null;
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor TF Luna - Distancia</h2>
          <div className="graph-count">{dataTF.length} mediciones</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            {dataTF.map((data, index) => (
              <PieGraphCard
                key={`tf-dist-${index}-${data.id || index}`}
                data={data}
                index={index}
                title="Distancia"
                dataKey="distancia_cm"
                unit="cm"
                colors={['#D68C0D', '#e8e8e8']}
                maxValue={500}
                formatter={(value) => [`${value?.toFixed(2)} cm`, 'Distancia']}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [dataTF]);

  const tfSignalSection = useMemo(() => {
    if (dataTF.length === 0) return null;
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor TF Luna - Fuerza de Señal basada en 2 bytes</h2>
          <div className="graph-count">{dataTF.length} mediciones</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            {dataTF.map((data, index) => (
              <PieGraphCard
                key={`tf-signal-${index}-${data.id || index}`}
                data={data}
                index={index}
                title="Fuerza de Señal basada en 2 bytes"
                dataKey="fuerza_senal"
                unit=""
                colors={['#D68C0D', '#e8e8e8']}
                maxValue={15000}
                formatter={(value) => [`${value?.toFixed(2)} (${evaluarFuerzaSenal(value)})`, 'Fuerza']}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [dataTF, evaluarFuerzaSenal]);

  const tfTempSection = useMemo(() => {
    if (dataTF.length === 0) return null;

    const temperaturas = dataTF.map(data => data.temperatura || 0);
    const media = temperaturas.reduce((sum, temp) => sum + temp, 0) / temperaturas.length;
    const varianza = temperaturas.reduce((sum, temp) => sum + Math.pow(temp - media, 2), 0) / temperaturas.length;
    const desviacionEstandar = Math.sqrt(varianza);

    const dataMedia = { temperatura: media, fecha: new Date() };
    const dataDesviacion = { temperatura: desviacionEstandar, fecha: new Date() };
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor TF Luna - Temperatura (Estadísticas)</h2>
          <div className="graph-count">{dataTF.length} mediciones analizadas</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            <PieGraphCard
              key="tf-temp-media"
              data={dataMedia}
              index={0}
              title="Media de Temperatura"
              dataKey="temperatura"
              unit="°C"
              colors={['#D68C0D', '#e8e8e8']}
              maxValue={80}
              formatter={(value) => [`${value?.toFixed(2)} °C`, 'Media']}
            />
            <PieGraphCard
              key="tf-temp-desviacion"
              data={dataDesviacion}
              index={1}
              title="Desviación Estándar"
              dataKey="temperatura"
              unit="°C"
              colors={['#D68C0D', '#e8e8e8']}
              maxValue={20}
              formatter={(value) => [`${value?.toFixed(2)} °C`, 'Desv. Est.']}
            />
          </div>
        </div>
      </div>
    );
  }, [dataTF]);

  const mpuInclinationSection = useMemo(() => {
    if (dataMPU.length === 0) return null;
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor MPU - Inclinación</h2>
          <div className="graph-count">{dataMPU.length} mediciones</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            {dataMPU.map((data, index) => {
              const inclinacion = Math.abs(data.roll + data.pitch);
              const dataWithInclinacion = { ...data, inclinacion };
              return (
                <PieGraphCard
                  key={`mpu-incl-${index}-${data.id || index}`}
                  data={dataWithInclinacion}
                  index={index}
                  title="Inclinación"
                  dataKey="inclinacion"
                  unit="°"
                  colors={['#D68C0D', '#e8e8e8']}
                  maxValue={90}
                  formatter={(value) => [`${value?.toFixed(2)} °`, 'Inclinación']}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  }, [dataMPU]);

  const mpuApertureSection = useMemo(() => {
    if (dataMPU.length === 0) return null;
    
    return (
      <div className="SensorSection">
        <div className="GraphHeaderContainer">
          <h2>Sensor MPU - Apertura</h2>
          <div className="graph-count">{dataMPU.length} mediciones</div>
        </div>
        <div className="GraphScrollContainer">
          <div className="GraphScrollContent">
            {dataMPU.map((data, index) => (
              <PieGraphCard
                key={`mpu-apt-${index}-${data.id || index}`}
                data={data}
                index={index}
                title="Apertura"
                dataKey="apertura"
                unit="°"
                colors={['#D68C0D', '#e8e8e8']}
                maxValue={180}
                formatter={(value) => [`${value?.toFixed(2)} °`, 'Apertura']}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }, [dataMPU]);

  if (loading) {
    return (
      <div className="GraphContainer" style={{ 
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
          {IS_DEMO_MODE ? 'Graficas no disponibles en modo demo' : 'No hay mediciones registradas'}
        </h3>
        <p style={{ margin: '0', color: '#666' }}>
          {IS_DEMO_MODE 
            ? 'Las graficas de sensores requieren conexion con Raspberry Pi y hardware real.'
            : 'Realiza una medicion desde el modulo de captura para ver las graficas aqui.'}
        </p>
      </div>
    );
  }

  return (
    <div className="GraphContainer">
      {imxSection}
      {tfDistanceSection}
      {tfSignalSection}
      {tfTempSection}
      {mpuInclinationSection}
      {mpuApertureSection}

    </div>
  );
}

export default GraphViewer;
