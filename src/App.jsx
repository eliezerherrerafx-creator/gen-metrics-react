import Login from "./Login";
/* global __app_id, __firebase_config, __initial_auth_token */
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged, signOut
} from 'firebase/auth';
import { 
  getFirestore, collection, query, onSnapshot, doc, 
  addDoc, updateDoc, deleteDoc, serverTimestamp, setDoc, getDoc, increment 
} from 'firebase/firestore';
import Chart from 'chart.js/auto';
import { 
  Menu, X, User, LogOut, Loader2, Plus, Minus, Send, CheckCircle, Percent, Tag, Download, LayoutDashboard, List, TrendingUp
} from 'lucide-react';


// ===============================================
// 1. CONFIGURACIÓN Y UTILIDADES GLOBALES
// ===============================================

// Carga de variables de entorno inyectadas por el Canvas (OBLIGATORIO)
const firebaseConfig = {
  apiKey: "AIzaSyCZbwu6VIxLv_hkFrb_PLKVhVHAPGkfxbc",
  authDomain: "miappdeseguimiento-98816.firebaseapp.com",
  projectId: "miappdeseguimiento-98816",
  storageBucket: "miappdeseguimiento-98816.firebasestorage.app",
  messagingSenderId: "387077383194",
  appId: "1:387077383194:web:0153d9967255a111801da3",
  measurementId: "G-N1CP7H0DFR"
};

const appId = "gen-metrics-react"; // Puedes dejarlo fijo
const initialAuthToken = null; // No usaremos tokens mágicos
let app, db, auth;

// Inicialización de Firebase
if (firebaseConfig) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    // Nota: La autenticación inicial se gestiona en el useEffect del componente App.
  } catch (error) {
    console.error("Error al inicializar Firebase:", error);
  }
}

// Opciones exactas para los selects
const SELECT_OPTIONS = {
  presentacion: ['Presentado', 'No presentado'],
  cierre: ['Cerrado', 'No cerrado'],
  pago: ['Pago', 'No pago'],
  interes: ['Trading', 'Ecommerce', 'Network Marketing', 'FWP']
};

/**
 * Función para obtener la clave del día actual (YYYY-MM-DD)
 * @returns {string}
 */
const getTodayKey = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Función para obtener la fecha de inicio del día actual (medianoche UTC)
 * @returns {Date}
 */
const getTodayStart = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

/**
 * Escapa valores para CSV: doble comillas dentro del campo y encierra si hay coma o salto de línea.
 */
const escapeCSV = (value) => {
    if (value === null || value === undefined) return "";
    let str = String(value);
    // Doble comillas si hay comillas dentro
    str = str.replace(/"/g, '""');
    // Encerrar en comillas si contiene una coma o salto de línea
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
    }
    return str;
};

/**
 * Convierte un array de objetos prospecto a una cadena CSV.
 */
const arrayToCSV = (data) => {
    if (data.length === 0) return '';

    // Encabezados del CSV en español
    const headers = ["Nombre", "Teléfono", "Presentación", "Cierre", "Pago", "Interés", "Etiquetas", "Fecha de Creación"];
    let csv = headers.map(escapeCSV).join(',') + '\n';

    data.forEach(item => {
        const row = [
            item.nombre,
            item.telefono,
            item.presentacion,
            item.cierre,
            item.pago,
            item.interes,
            item.etiquetas.join('; '), 
            item.createdAt ? new Date(item.createdAt).toLocaleString('es-ES') : ''
        ].map(escapeCSV).join(',');
        csv += row + '\n';
    });

    // BOM (Byte Order Mark) para UTF-8. Crucial para la compatibilidad con caracteres especiales y Excel/Sheets
    return '\ufeff' + csv; 
};


// ===============================================
// 2. ESTADO Y HOOKS DE FIREBASE/DATOS
// ===============================================

/**
 * Hook para obtener la historia del Contador Diario (basado en clics del botón).
 * @param {Object} user - Objeto de usuario de Firebase Auth.
 * @returns {Object} - Datos estructurados para el gráfico de 15 días.
 */
const useDailyCountHistory = (user) => {
    const [dailyCounts, setDailyCounts] = useState({});

    // 1. Suscripción en tiempo real a la colección de conteos diarios
    useEffect(() => {
        if (!user?.uid || !db) return;

        // Ruta: /artifacts/{appId}/users/{userId}/daily_counts
        const countsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'daily_counts');
        const q = query(countsCollectionRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const countsMap = {};
            snapshot.docs.forEach(doc => {
                // El ID del documento es la clave del día (YYYY-MM-DD)
                countsMap[doc.id] = doc.data().count || 0;
            });
            setDailyCounts(countsMap);
        }, (error) => {
            console.error("Error al obtener conteos diarios:", error);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Estructura los datos históricos para el gráfico (últimos 15 días)
    const dailyCountsChartData = useMemo(() => {
        const chartData = {
            labels: [],
            dailyInteractions: [],
        };

        // Generar etiquetas para los últimos 15 días y buscar el conteo
        for (let i = 14; i >= 0; i--) {
            const date = new Date(new Date().setUTCHours(0, 0, 0, 0));
            date.setDate(date.getDate() - i);
            const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

            chartData.labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
            
            // Usar el conteo persistente guardado en Firestore
            const count = dailyCounts[dateKey] || 0;
            chartData.dailyInteractions.push(count);
        }
        
        return chartData;
    }, [dailyCounts]);

    return dailyCountsChartData;
};


/**
 * Hook para obtener la lista de prospectos y sus estadísticas (Lista de Seguimiento).
 */
const useProspectData = (user) => {
  const [prospects, setProspects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [permissionError, setPermissionError] = useState(false); // Estado para error de permisos

  // 1. Suscripción en tiempo real a la colección de prospectos
  useEffect(() => {
    if (!user?.uid || !db) {
        setLoadingData(false);
        setPermissionError(false);
        return;
    }

    setLoadingData(true);
    setPermissionError(false);
    
    // Ruta: /artifacts/{appId}/users/{userId}/prospects
    const prospectsCollectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'prospects');
    const q = query(prospectsCollectionRef);

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const prospectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        etiquetas: Array.isArray(doc.data().etiquetas) ? doc.data().etiquetas : [],
        createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : doc.data().createdAt,
      }));
      setProspects(prospectsData);
      setLoadingData(false);
      setPermissionError(false);
    }, (error) => {
      console.error("Error al obtener prospectos:", error);
      
      if (error.code === 'permission-denied') {
        setPermissionError(true);
        setProspects([]);
      } else {
        setPermissionError(false);
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. Cálculos de estadísticas y métricas (solo lista de seguimiento)
  const stats = useMemo(() => {
    if (!prospects.length) return { 
      daily: { presented: 0, closed: 0, paid: 0, paidPercentage: 0 },
      last15Days: { presented: 0, closed: 0, paid: 0, paidPercentage: 0 },
      historicalRatio: 'N/A', 
    };

    const todayStart = getTodayStart();
    
    let dailyPresented = 0;
    let dailyClosed = 0;
    let dailyPaid = 0;

    // ... (otras variables históricas y de 15 días si fueran necesarias)
    
    let historicalClosed = 0; 
    let historicalPaid = 0;   

    for (const prospect of prospects) {
      const createdAt = prospect.createdAt;
      const isPresented = prospect.presentacion === 'Presentado';
      const isClosed = prospect.cierre === 'Cerrado';
      const isPaid = prospect.pago === 'Pago';

      // Conteo histórico
      if (isClosed) historicalClosed++;
      if (isPaid) historicalPaid++;

      const isToday = createdAt && createdAt >= todayStart;
      
      // Conteo diario (de la lista de seguimiento)
      if (isToday) {
        if (isPresented) dailyPresented++;
        if (isClosed) dailyClosed++;
        if (isPaid) dailyPaid++;
      }
    }

    const dailyPaidPercentage = dailyClosed > 0 ? (dailyPaid / dailyClosed) * 100 : 0;
    
    // Cálculo del ratio HISTÓRICO 
    const historicalRatio = historicalPaid > 0 
      ? `1 pago cada ${Math.round(historicalClosed / historicalPaid)} cierres`
      : 'No hay pagos históricos';
    
    return {
      daily: { presented: dailyPresented, closed: dailyClosed, paid: dailyPaid, paidPercentage: dailyPaidPercentage.toFixed(1) },
      historicalRatio, 
      // ... (añadir otros stats si se necesitan)
    };
  }, [prospects]);

  // 3. GENERACIÓN DE DATOS PARA EL GRÁFICO DE CIERRES DIARIOS (NUEVO)
  const dailyClosuresChartData = useMemo(() => {
      const dataMap = {};
      prospects.forEach(p => {
          // Solo contamos si está marcado como cerrado y tiene una fecha válida
          if (p.cierre === 'Cerrado' && p.createdAt) {
              const date = p.createdAt instanceof Date ? p.createdAt : p.createdAt.toDate();
              const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
              dataMap[dateKey] = (dataMap[dateKey] || 0) + 1;
          }
      });

      const chartData = {
          labels: [],
          dailyClosures: [],
      };
      
      // Generar etiquetas y datos para los últimos 15 días
      for (let i = 14; i >= 0; i--) {
          const date = new Date(new Date().setUTCHours(0, 0, 0, 0));
          date.setDate(date.getDate() - i);
          const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD

          // Formato de etiqueta: "Dic 25"
          chartData.labels.push(date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }));
          
          // Usar el conteo de la lista de seguimiento
          chartData.dailyClosures.push(dataMap[dateKey] || 0);
      }

      return chartData;
  }, [prospects]);

  // 4. Funciones de manipulación de Firestore
  
  const addProspect = useCallback(async (data) => {
    if (!user?.uid || !db) throw new Error("Usuario no autenticado o UID no disponible.");
    const collectionRef = collection(db, 'artifacts', appId, 'users', user.uid, 'prospects');
    
    const newProspect = {
        nombre: data.nombre,
        telefono: data.telefono,
        presentacion: SELECT_OPTIONS.presentacion[1], 
        cierre: SELECT_OPTIONS.cierre[1],            
        pago: SELECT_OPTIONS.pago[1],                
        interes: SELECT_OPTIONS.interes[0],          
        etiquetas: [], 
        userId: user.uid,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collectionRef, newProspect);
    return docRef.id;
  }, [user]);

  const updateProspect = useCallback(async (id, data) => {
    if (!user?.uid || !db) throw new Error("Usuario no autenticado o UID no disponible.");
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'prospects', id);
    await updateDoc(docRef, data);
  }, [user]);

  const deleteProspect = useCallback(async (id) => {
    if (!user?.uid || !db) throw new Error("Usuario no autenticado o UID no disponible.");
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'prospects', id);
    await deleteDoc(docRef);
  }, [user]);

  return { prospects, stats, loadingData, permissionError, addProspect, updateProspect, deleteProspect, dailyClosuresChartData };
};


// ===============================================
// 3. COMPONENTES UI Y LÓGICA DE LA APP 
// ===============================================

// Componente de Notificación/Toast simple
const ToastNotification = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-emerald-400' : 'bg-pink-500'; 
  const icon = type === 'success' ? <CheckCircle className="w-5 h-5" /> : <X className="w-5 h-5" />;

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white ${bgColor} transition-transform duration-300 ease-out transform translate-y-0`}>
      <div className="flex items-center space-x-3">
        {icon}
        <p className="font-medium text-sm">{message}</p>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-white/20 transition">
            <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Componente para la Tarjeta de Métrica (Estilo Oscuro Luminoso)
const MetricCard = ({ title, value, unit = '', description, icon: Icon }) => (
    // Glow Púrpura más fuerte para la tarjeta
  <div className="p-6 bg-[#221655] rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 flex flex-col justify-between">
    <div className="flex items-start justify-between">
        {Icon && <Icon className="w-5 h-5 text-indigo-400/80" />}
        {/* Título en púrpura claro */}
        <h3 className="text-sm font-semibold text-indigo-400 uppercase">{title}</h3>
    </div>
    {/* Números grandes en color blanco puro */}
    <p className="text-4xl font-extrabold text-white mt-2">
        {value}
        {unit && <span className="text-lg font-normal ml-1 text-indigo-300">{unit}</span>}
    </p>
    {/* Descripción en púrpura muy claro */}
    <p className="text-xs mt-3 text-indigo-200/90">{description}</p>
  </div>
);

// Componente para el Contador de Prospectos
const ProspectCounter = ({ prospectCounter, setProspectCounter, handleIncrementCounter, handleDecrementCounter, setFeedback }) => {
  
  const handleAdd = async () => {
    try {
        await handleIncrementCounter();
        setProspectCounter(c => c + 1);
        setFeedback({ message: 'Contador de prospectos incrementado (+1). Registro persistente actualizado.', type: 'success' });
    } catch (error) {
        setFeedback({ message: 'Error al incrementar el contador persistente.', type: 'error' });
        console.error("Error incrementing counter:", error);
    }
  };

  const handleDeleteLast = async () => {
    if (prospectCounter <= 0) {
        setFeedback({ message: 'El contador ya está en cero.', type: 'error' });
        return;
    }
    
    try {
        await handleDecrementCounter();
        setProspectCounter(c => c - 1);
        setFeedback({ message: 'Contador de prospectos decrementado (-1). Registro persistente actualizado.', type: 'success' });
    } catch (error) {
        setFeedback({ message: 'Error al decrementar el contador persistente.', type: 'error' });
        console.error("Error decrementing counter:", error);
    }
  };

  const baseButtonClasses = "flex-1 px-4 py-3 bg-indigo-900 font-bold rounded-xl shadow-md transition duration-300 hover:bg-indigo-800";

  return (
    <div className="p-6 bg-[#221655] rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 mt-8">
      {/* Título actualizado a "Contador de Prospectos" */}
      <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
        <Tag className="w-5 h-5 mr-2 text-emerald-400" />
        Contador de Prospectos (Local): 
        <span className='text-emerald-400 ml-2 font-bold text-2xl'>{prospectCounter}</span>
      </h3>
      <p className="text-indigo-200 mb-4 text-sm">
        Cada clic se registra en la base de datos para crear el gráfico histórico de Interacciones.
      </p>
      <div className="flex space-x-4">
        {/* Botón actualizado a "+1 Prospecto" */}
        <button
          onClick={handleAdd}
          className={`${baseButtonClasses} text-white hover:shadow-[0_0_20px_0px_#10b981]`}
        >
          +1 Prospecto
        </button>
        {/* Botón actualizado a "-1 Prospecto (Deshacer)" */}
        <button
          onClick={handleDeleteLast}
          className={`${baseButtonClasses} text-white hover:shadow-[0_0_20px_0px_#ec4899]`}
        >
          <span className="flex items-center justify-center">
            <Minus className="w-5 h-5 mr-2" />
            -1 Prospecto (Deshacer)
          </span>
        </button>
      </div>
    </div>
  );
};


// Componente para los Gráficos (Ahora maneja 3)
const ProspectChart = ({ dailyCountsChartData, dailyClosuresChartData, prospectCounter }) => { // Aceptar dailyClosuresChartData
  const chartDailyInteractionsRef = useRef(null); 
  const chartDailyClosuresRef = useRef(null); // Ref para el nuevo gráfico de cierres
  const chartCounterRef = useRef(null); 
  
  const chartDailyInteractionsInstanceRef = useRef(null);
  const chartDailyClosuresInstanceRef = useRef(null); // Instancia del nuevo gráfico
  const chartCounterInstanceRef = useRef(null);

  /**
   * Función reutilizable para crear una instancia de Chart.js
   */
  const createChart = useCallback((canvasRef, instanceRef, title, label, data, color, type, labels) => {
    if (!canvasRef.current || data.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');

    // Destruir la instancia anterior si existe
    if (instanceRef.current) {
      instanceRef.current.destroy();
    }

    // Gradiente de fondo (solo para líneas)
    let backgroundColor = type === 'line' ? `${color}40` : color;
    if (type === 'line') {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasRef.current.height);
        gradient.addColorStop(0, `${color}AA`); // Color sólido con opacidad media
        gradient.addColorStop(1, `${color}10`); // Casi transparente
        backgroundColor = gradient;
    }


    instanceRef.current = new Chart(ctx, {
      type: type, 
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            borderColor: color, 
            backgroundColor: backgroundColor, 
            tension: type === 'line' ? 0.4 : 0,
            borderWidth: 3,
            pointRadius: type === 'line' ? 5 : 6, // Puntos más grandes en barra
            pointHoverRadius: type === 'line' ? 7 : 8,
            fill: type === 'line', // Relleno bajo la línea
            barThickness: type === 'bar' ? 10 : undefined, // Barras más delgadas
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false, 
          },
          title: {
            display: true,
            text: title, 
            color: '#c7d2fe', 
            font: {
              size: 16,
              weight: 'bold'
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            backgroundColor: 'rgba(30, 41, 59, 0.9)',
            titleColor: '#fff',
            bodyColor: '#e0e7ff',
            borderColor: color,
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#9ca3af', 
              stepSize: 1, 
            },
            grid: {
              color: '#374151', 
              borderColor: '#4b5563',
            }
          },
          x: {
            ticks: {
              color: '#9ca3af', 
            },
            grid: {
              display: false, 
              borderColor: '#4b5563',
            }
          }
        },
      },
    });
  }, []);

  // Gráfico 1: Interacciones Diarias (Contador - Persistente en Firestore)
  const createDailyInteractionsChart = useCallback(() => {
    createChart(
      chartDailyInteractionsRef, 
      chartDailyInteractionsInstanceRef, 
      'Interacciones Diarias del Contador (15 Días)', 
      'Interacciones Diarias', 
      dailyCountsChartData.dailyInteractions, 
      '#10b981', // Esmeralda (Emerald)
      'line',
      dailyCountsChartData.labels
    );
  }, [dailyCountsChartData, createChart]);
  
  // Gráfico 2: Cierres Diarios (NUEVO - Basado en Lista de Seguimiento)
  const createDailyClosuresChart = useCallback(() => {
    createChart(
      chartDailyClosuresRef, 
      chartDailyClosuresInstanceRef, 
      'Cierres Diarios (Lista de Seguimiento - 15 Días)', // Título para Cierres
      'Cierres Diarios', 
      dailyClosuresChartData.dailyClosures, 
      '#ef4444', // Rojo (Red)
      'bar', // Tipo barra para Cierres
      dailyClosuresChartData.labels
    );
  }, [dailyClosuresChartData, createChart]);


  // Gráfico 3: Contador de Prospectos (En Vivo - No persistente)
  const createLiveCounterChart = useCallback(() => {
    const labels = ['Hoy']; 
    const data = [prospectCounter]; 
    
    createChart(
      chartCounterRef, 
      chartCounterInstanceRef, 
      'Valor Actual del Contador (En Vivo)', 
      'Contador de Prospectos', 
      data, 
      '#6366f1', // Índigo (Indigo)
      'bar',
      labels
    );
  }, [prospectCounter, createChart]);


  useEffect(() => {
    createDailyInteractionsChart();
    createDailyClosuresChart(); // Crear el nuevo gráfico
    createLiveCounterChart(); 

    return () => {
      if (chartDailyInteractionsInstanceRef.current) {
        chartDailyInteractionsInstanceRef.current.destroy();
      }
      if (chartDailyClosuresInstanceRef.current) { // Limpiar instancia
        chartDailyClosuresInstanceRef.current.destroy();
      }
      if (chartCounterInstanceRef.current) {
        chartCounterInstanceRef.current.destroy();
      }
    };
  }, [createDailyInteractionsChart, createDailyClosuresChart, createLiveCounterChart]); 

  const chartContainerStyle = {
      height: '350px', 
      width: '100%',
  };
  
  const hasDailyInteractionData = dailyCountsChartData.dailyInteractions.some(count => count > 0);
  const hasDailyClosuresData = dailyClosuresChartData.dailyClosures.some(count => count > 0);
  
  return (
    <div className="mt-8 p-6 bg-[#221655] rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Contenedor del Gráfico 1: Interacciones Diarias (HISTÓRICO - CONTADOR) */}
        <div style={chartContainerStyle}>
          <canvas ref={chartDailyInteractionsRef} id="dailyInteractionsChart"></canvas>
          {!hasDailyInteractionData && (
             <div className="text-center text-indigo-300 mt-2 text-sm">
                 (Añade interacciones con el botón '+1 Prospecto')
             </div>
          )}
        </div>
        
        {/* Contenedor del Gráfico 2: Cierres Diarios (NUEVO - LISTA DE SEGUIMIENTO) */}
        <div style={chartContainerStyle}>
          <canvas ref={chartDailyClosuresRef} id="dailyClosuresChart"></canvas>
          {!hasDailyClosuresData && (
             <div className="text-center text-indigo-300 mt-2 text-sm">
                 (Marca prospectos como 'Cerrado' en la Lista de Seguimiento)
             </div>
          )}
        </div>

        {/* Contenedor del Gráfico 3: Contador de Prospectos (EN VIVO) */}
        <div style={chartContainerStyle}>
          <canvas ref={chartCounterRef} id="prospectCounterChart"></canvas>
        </div>
      </div>
      
    </div>
  );
};


// Componente de la página de Resumen (Dashboard)
const Dashboard = ({ stats, loadingData, permissionError, prospectCounter, setProspectCounter, dailyCountsChartData, dailyClosuresChartData, handleIncrementCounter, handleDecrementCounter, setFeedback }) => {
  const todayStart = getTodayStart().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  const loadingClass = loadingData ? 'opacity-50 pointer-events-none' : '';

  if (permissionError) {
    return (
        <div className="text-center p-10 bg-pink-900/50 rounded-xl text-pink-400 m-8 border border-pink-700 shadow-lg">
            <h2 className="text-2xl font-bold mb-4">🚨 Error de Acceso a Datos (Permisos)</h2>
            <p className='text-pink-200'>
                La aplicación no pudo cargar tus datos. Revisa la sección de Reglas de Seguridad de Firebase en la documentación.
            </p>
        </div>
    );
  }
  
  return (
    <div className={`p-4 md:p-8 transition-opacity ${loadingClass}`}>
      <h1 className="text-3xl font-bold text-white mb-6">Resumen de Seguimiento</h1>
      
      {/* 1. Métrica Histórica - Destacada */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-indigo-400 mb-3 border-b border-indigo-900 pb-2">Métrica Histórica Clave (Lista de Seguimiento)</h2>
        <MetricCard 
          title="Relación Pago/Cierre TOTAL HISTÓRICA" 
          value={stats.historicalRatio.split(' ').slice(0, 3).join(' ')}
          description={stats.historicalRatio.split(' ').slice(3).join(' ') || "Calculado con todos los datos históricos guardados en la base de datos."}
          icon={Percent}
        />
      </div>

      {/* 2. Contador Rápido Diario (Pura lógica local + persistencia) */}
      <ProspectCounter 
        prospectCounter={prospectCounter} 
        setProspectCounter={setProspectCounter} 
        handleIncrementCounter={handleIncrementCounter}
        handleDecrementCounter={handleDecrementCounter}
        setFeedback={setFeedback} 
      />

      {/* 3. Resumen Diario (De la lista de seguimiento) */}
      <div className="mt-8 mb-8">
        <h2 className="text-xl font-semibold text-indigo-200 mb-4 border-b border-indigo-900 pb-2">Resultados de Hoy (Lista de Seguimiento - {todayStart})</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Card 1: Prospectos Presentados (FIX: Solo datos de Firestore) */}
          <MetricCard 
            title="Prospectos Presentados" 
            value={stats.daily.presented} 
            description={`(Solo prospectos marcados como 'Presentado' en la Lista)`} 
          /> 
          <MetricCard title="Prospectos Cerrados" value={stats.daily.closed} />
          <MetricCard title="Pagos Recibidos" value={stats.daily.paid} />
          <MetricCard title="% Cierres Pagados" value={stats.daily.paidPercentage} unit="%" icon={Percent} />
        </div>
      </div>
      
      {/* 4. Gráfico de 15 Días y Contador en Vivo */}
      <ProspectChart 
        dailyCountsChartData={dailyCountsChartData} 
        dailyClosuresChartData={dailyClosuresChartData} // PASAR NUEVOS DATOS
        prospectCounter={prospectCounter}
      />
    </div>
  );
};

// Componente para el Formulario de Agregar Prospecto
const ProspectForm = ({ addProspect, setFeedback }) => {
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !phone) {
            setFeedback({ message: 'Nombre y Teléfono son requeridos.', type: 'error' });
            return;
        }

        setLoading(true);
        try {
            await addProspect({ nombre: name, telefono: phone }); 
            setFeedback({ message: 'Prospecto añadido con éxito a la lista de seguimiento. ¡Ahora puedes etiquetarlo!', type: 'success' });
            setName('');
            setPhone('');
        } catch (e) {
            setFeedback({ message: 'Error al añadir prospecto. (Verifica permisos)', type: 'error' });
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "p-3 border border-indigo-700 bg-indigo-900/50 text-white rounded-xl focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition placeholder-indigo-400";

    return (
        <form onSubmit={handleSubmit} className="p-6 bg-[#221655] rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900">
            <h2 className="text-xl font-semibold text-white mb-4">Agregar Nuevo Prospecto (Lista de Seguimiento)</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input
                    type="text"
                    placeholder="Nombre del Prospecto"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`${inputClasses} md:col-span-2`} 
                    required
                />
                <input
                    type="tel"
                    placeholder="Teléfono (Ej: 521234567890)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={inputClasses}
                    required
                />
                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full flex justify-center items-center px-4 py-3 bg-indigo-800 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition duration-300 disabled:bg-indigo-900 disabled:cursor-wait hover:shadow-[0_0_20px_0px_#10b981]`} 
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : 'Añadir Prospecto'}
                </button>
            </div>
            <p className="text-sm mt-3 text-indigo-300/80">
                Las etiquetas se gestionan directamente en la fila de la Lista de Seguimiento una vez añadido el prospecto.
            </p>
        </form>
    );
};

// NUEVO COMPONENTE: Botón de Exportar a CSV
const ExportToCSVButton = ({ prospects, setFeedback }) => {
    const handleExport = () => {
        if (prospects.length === 0) {
            setFeedback({ message: 'No hay prospectos para exportar.', type: 'error' });
            return;
        }

        const csvString = arrayToCSV(prospects);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'lista_seguimiento_prospectos.csv'); 
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url); 
        
        setFeedback({ message: `Exportados ${prospects.length} prospectos a CSV.`, type: 'success' });
    };

    return (
        <button
            onClick={handleExport}
            className={`flex items-center px-4 py-3 bg-emerald-800 text-white font-bold rounded-xl shadow-md hover:bg-emerald-700 transition duration-300 disabled:opacity-50 hover:shadow-[0_0_20px_0px_#10b981]`} 
            title="Exportar la lista completa a un archivo CSV"
        >
            <Download className="w-5 h-5 mr-2" />
            Exportar a CSV
        </button>
    );
};

// Componente para la Fila de Prospecto 
const ProspectRow = React.memo(({ prospect, updateProspect, deleteProspect, setFeedback }) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isEditingTags, setIsEditingTags] = useState(false);
    const [tagsInputValue, setTagsInputValue] = useState(prospect.etiquetas.join(', ')); 
    const [isConfirming, setIsConfirming] = useState(false); // ESTADO PARA CONFIRMACIÓN INLINE

    const whatsappLink = `https://wa.me/${prospect.telefono.replace(/[^0-9]/g, '')}`;

    const handleUpdate = async (field, value) => {
        try {
            await updateProspect(prospect.id, { [field]: value });
        } catch (e) {
            setFeedback({ message: `Error al actualizar ${field}. (Verifica permisos)`, type: 'error' });
            console.error(e);
        }
    };

    const handleUpdateTags = async () => {
        const newTagsArray = tagsInputValue
            .split(',')
            .map(tag => tag.trim().toLowerCase())
            .filter(tag => tag.length > 0);
        
        if (JSON.stringify(newTagsArray) !== JSON.stringify(prospect.etiquetas)) {
            try {
                await updateProspect(prospect.id, { etiquetas: newTagsArray });
                setFeedback({ message: 'Etiquetas actualizadas con éxito.', type: 'success' });
            } catch (e) {
                setFeedback({ message: 'Error al actualizar etiquetas. (Verifica permisos)', type: 'error' });
                console.error(e);
            }
        }
        setIsEditingTags(false);
    };

    // FUNCIÓN PARA MOSTRAR CONFIRMACIÓN INLINE
    const handleDelete = () => {
        setIsConfirming(true); // Al hacer clic en 'X', mostramos la confirmación
    };
    
    // FUNCIÓN PARA CONFIRMAR LA ELIMINACIÓN
    const handleConfirmDelete = async () => {
        setIsConfirming(false); // Ocultar el cuadro de confirmación
        try {
            await deleteProspect(prospect.id);
            setFeedback({ message: `${prospect.nombre} eliminado.`, type: 'success' });
        } catch (e) {
            setFeedback({ message: 'Error al eliminar prospecto. (Verifica permisos)', type: 'error' });
            console.error(e);
        }
    };


    // Componente Select reutilizable con estilo oscuro
    const StatusSelect = ({ field, currentValue, options }) => {
        const baseClasses = "w-full p-2 border border-indigo-700 rounded-lg text-sm bg-indigo-900/50 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition appearance-none";
        
        const textClass = 
            currentValue === 'Presentado' || currentValue === 'Cerrado' || currentValue === 'Pago'
            ? 'text-emerald-400 font-medium' 
            : 'text-indigo-300'; 

        return (
            <select
                value={currentValue}
                onChange={(e) => handleUpdate(field, e.target.value)}
                className={`${baseClasses} ${textClass}`}
            >
                {options.map(opt => (
                    <option key={opt} value={opt} className="bg-indigo-900 text-white">{opt}</option>
                ))}
            </select>
        );
    };

    const nameClasses = `font-semibold transition-all ${
        prospect.cierre === 'Cerrado' ? (prospect.pago === 'Pago' ? 'text-emerald-400' : 'text-indigo-400') : 'text-white'
    }`;
    
    return (
        <div 
            className="flex flex-col p-4 border-b border-indigo-900 hover:bg-indigo-900/40 transition duration-150"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Fila Principal de Datos */}
            <div className="grid grid-cols-12 gap-4 items-center">
                
                {/* Nombre y Eliminar */}
                <div className="col-span-12 sm:col-span-3 flex items-center space-x-2">
                    <span className={nameClasses}>
                        {prospect.nombre}
                    </span>
                    
                    {isConfirming ? (
                        // UI de Confirmación de Eliminación (ELIMINACIÓN DE BUG CORREGIDA)
                        <div className="flex space-x-1 items-center bg-pink-900/70 p-1 rounded-lg">
                            <span className="text-xs text-pink-200 hidden sm:inline-block">¿Seguro?</span>
                            <button
                                onClick={handleConfirmDelete}
                                className="p-1 text-white bg-pink-600 rounded-full hover:bg-pink-500 transition"
                                title="Confirmar eliminación"
                            >
                                <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setIsConfirming(false)}
                                className="p-1 text-pink-300 rounded-full hover:bg-pink-800 transition"
                                title="Cancelar"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Botón de eliminar Desktop (oculto en móvil) */}
                            <button
                                onClick={handleDelete}
                                className={`p-1 text-indigo-400/50 rounded-full hover:bg-pink-900 hover:text-pink-400 transition duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'} hidden sm:inline-block`}
                                aria-label="Eliminar prospecto"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            {/* Botón de eliminar Móvil (visible en móvil) */}
                            <button
                                onClick={handleDelete}
                                className="p-1 text-indigo-400/50 rounded-full hover:bg-pink-900 hover:text-pink-400 transition duration-300 sm:hidden"
                                aria-label="Eliminar prospecto"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                {/* Teléfono y WhatsApp */}
                <div className="col-span-12 sm:col-span-2 flex items-center space-x-2">
                    <span className="text-sm text-indigo-300 truncate">{prospect.telefono}</span>
                    {prospect.telefono && prospect.telefono !== 'N/A' && (
                        <a 
                            href={whatsappLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-1 text-gray-900 bg-emerald-400 rounded-full hover:bg-emerald-500 transition duration-150"
                            title="Enviar WhatsApp"
                        >
                            <Send className="w-3 h-3" />
                        </a>
                    )}
                </div>

                {/* Dropdowns */}
                <div className="col-span-12 sm:col-span-7 grid grid-cols-4 gap-2">
                    <StatusSelect field="presentacion" currentValue={prospect.presentacion} options={SELECT_OPTIONS.presentacion} />
                    <StatusSelect field="cierre" currentValue={prospect.cierre} options={SELECT_OPTIONS.cierre} />
                    <StatusSelect field="pago" currentValue={prospect.pago} options={SELECT_OPTIONS.pago} />
                    <StatusSelect field="interes" currentValue={prospect.interes} options={SELECT_OPTIONS.interes} />
                </div>
            </div>

            {/* Fila de Etiquetas */}
            <div className={`mt-3 pt-3 border-t border-indigo-900/50 sm:border-t-0 sm:pt-0 sm:mt-0`}>
                <div className="flex items-center space-x-2 text-sm">
                    <Tag className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    {isEditingTags ? (
                        <input
                            type="text"
                            value={tagsInputValue}
                            onChange={(e) => setTagsInputValue(e.target.value)}
                            onBlur={handleUpdateTags}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpdateTags();
                                }
                            }}
                            placeholder="Etiquetas (separadas por coma)"
                            className="w-full p-1 bg-indigo-900/50 text-white rounded-lg focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 foc"
                            autoFocus
                        />
                    ) : (
                        <div 
                            className="flex flex-wrap gap-2 cursor-pointer w-full"
                            onClick={() => {
                                setIsEditingTags(true);
                                setTagsInputValue(prospect.etiquetas.join(', '));
                            }}
                        >
                            {prospect.etiquetas.length > 0 ? (
                                prospect.etiquetas.map((tag, index) => (
                                    <span 
                                        key={index}
                                        className="px-2 py-0.5 text-xs font-medium text-emerald-300 bg-emerald-900/50 rounded-full border border-emerald-800 hover:scale-105 transition"
                                    >
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-indigo-500 italic hover:text-indigo-400">
                                    Click para añadir etiquetas (Ej: Tarea, Llama en 3 días)
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});


// Componente de la Lista de Seguimiento 
const FollowUpList = ({ prospects, addProspect, updateProspect, deleteProspect, setFeedback, loadingData, permissionError }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Todo');

    const filteredProspects = useMemo(() => {
        let filtered = prospects;

        // 1. Filtrar por búsqueda
        if (searchTerm) {
            const lowerCaseSearch = searchTerm.toLowerCase();
            filtered = filtered.filter(p =>
                p.nombre.toLowerCase().includes(lowerCaseSearch) ||
                p.telefono.includes(lowerCaseSearch) ||
                p.etiquetas.some(tag => tag.includes(lowerCaseSearch))
            );
        }

        // 2. Filtrar por estado de pago/cierre
        if (filterStatus !== 'Todo') {
            if (filterStatus === 'Pagado') {
                filtered = filtered.filter(p => p.pago === 'Pago');
            } else if (filterStatus === 'No Pagado') {
                filtered = filtered.filter(p => p.pago === 'No pago');
            } else if (filterStatus === 'Cerrado') {
                filtered = filtered.filter(p => p.cierre === 'Cerrado' && p.pago !== 'Pago');
            } else if (filterStatus === 'Presentado') {
                filtered = filtered.filter(p => p.presentacion === 'Presentado' && p.cierre === 'No cerrado');
            } else if (filterStatus === 'Pendiente') {
                filtered = filtered.filter(p => p.presentacion === 'No presentado');
            }
        }

        // 3. Ordenar: los más recientes y los que están pendientes de cerrar/pagar primero
        return filtered.sort((a, b) => {
            const aPending = a.cierre === 'No cerrado' || a.pago === 'No pago';
            const bPending = b.cierre === 'No cerrado' || b.pago === 'No pago';

            if (aPending !== bPending) {
                return aPending ? -1 : 1; 
            }
            
            const aDate = a.createdAt?.getTime ? a.createdAt.getTime() : 0;
            const bDate = b.createdAt?.getTime ? b.createdAt.getTime() : 0;

            return bDate - aDate;
        });
    }, [prospects, searchTerm, filterStatus]);
    
    const filterOptions = [
        'Todo', 'Pendiente', 'Presentado', 'Cerrado', 'Pagado', 'No Pagado'
    ];
    
    return (
        <div className="p-4 md:p-8">
            <h1 className="text-3xl font-bold text-white mb-6">Lista de Seguimiento ({prospects.length} total)</h1>
            
            {permissionError && (
                <div className="text-center p-4 bg-pink-900/50 rounded-xl text-pink-400 mb-6 border border-pink-700 shadow-lg">
                    <h2 className="font-bold">🚨 Error de Permisos: Datos no cargados.</h2>
                    <p className='text-pink-200 text-sm mt-1'>
                        Asegúrate de tener las reglas de seguridad de Firestore configuradas correctamente para tu usuario.
                    </p>
                </div>
            )}

            {/* Formulario de Añadir */}
            <ProspectForm addProspect={addProspect} setFeedback={setFeedback} />

            {/* Controles y Exportar */}
            <div className="mt-8 mb-4 flex flex-col md:flex-row gap-4 justify-between items-center p-4 bg-indigo-900/50 rounded-xl border border-indigo-700">
                {/* Búsqueda */}
                <input
                    type="text"
                    placeholder="Buscar por Nombre, Teléfono o Etiqueta..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-3 border border-indigo-700 bg-indigo-900/50 text-white rounded-xl focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition placeholder-indigo-400 w-full md:w-1/3"
                />
                
                {/* Filtro de Estado */}
                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full md:w-auto p-3 border border-indigo-700 rounded-xl text-white bg-indigo-900/50 focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition appearance-none"
                >
                    {filterOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-indigo-900">{opt}</option>
                    ))}
                </select>
                
                {/* Botón Exportar */}
                <ExportToCSVButton prospects={prospects} setFeedback={setFeedback} />
            </div>

            {/* Encabezados de la Tabla (Solo Desktop) */}
            <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-bold uppercase text-indigo-400 p-3 bg-indigo-900/70 rounded-t-xl mb-1">
                <div className="col-span-3">Nombre / Eliminación</div>
                <div className="col-span-2">Teléfono</div>
                <div className="col-span-7 grid grid-cols-4 gap-2">
                    <div>Presentación</div>
                    <div>Cierre</div>
                    <div>Pago</div>
                    <div>Interés</div>
                </div>
            </div>

            {/* Lista de Prospectos */}
            <div className="bg-[#110a30] rounded-b-xl shadow-2xl overflow-hidden border border-indigo-800">
                {loadingData ? (
                    <div className="text-center p-10 text-indigo-400">
                        <Loader2 className="w-8 h-8 mx-auto animate-spin" />
                        <p className="mt-2">Cargando prospectos...</p>
                    </div>
                ) : filteredProspects.length > 0 ? (
                    filteredProspects.map(p => (
                        <ProspectRow
                            key={p.id}
                            prospect={p}
                            updateProspect={updateProspect}
                            deleteProspect={deleteProspect}
                            setFeedback={setFeedback}
                        />
                    ))
                ) : (
                    <p className="p-10 text-center text-indigo-300">
                        No hay prospectos en la lista de seguimiento o no cumplen con los criterios de búsqueda/filtro.
                    </p>
                )}
            </div>
        </div>
    );
};


// Componente principal de la aplicación
const App = () => {
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard'); 
  const [prospectCounter, setProspectCounter] = useState(0); 
  const [feedback, setFeedback] = useState(null); 
  // 🥊 Función para cerrar sesión
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      console.log("👋 Sesión cerrada correctamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  };


  // 1. Inicialización de Auth
  useEffect(() => {
    if (!auth) return;

    // Obtener el conteo local actual del día si existe (no persistente en la app, pero se usa)
    // const todayKey = getTodayKey(); // ELIMINADO
    // const currentLocalCount = parseInt(localStorage.getItem(`counter_${todayKey}_${appId}`) || '0', 10); // ELIMINADO
    // setProspectCounter(currentLocalCount); // ELIMINADO

    const signInUser = async () => {
      try {
        if (initialAuthToken) {
          await signInWithCustomToken(auth, initialAuthToken);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Error signing in:", e);
      }
    };
    
const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
  if (currentUser) {
    console.log("👤 Usuario autenticado:", currentUser.uid);
  } else {
    console.log("⚠️ No hay usuario autenticado.");
  }
  setUser(currentUser);
  setIsAuthReady(true);
});


    return () => unsubscribe();
  }, []);

  // Persistir el contador local en localStorage (para que no se pierda en un F5, aunque el historial ya está en Firestore)
  /* ELIMINADO ESTE BLOQUE
  useEffect(() => {
    if (prospectCounter >= 0) {
        const todayKey = getTodayKey();
        localStorage.setItem(`counter_${todayKey}_${appId}`, prospectCounter);
    }
  }, [prospectCounter]);
  */

  // 2. Hook de datos de prospectos (Lista de Seguimiento)
  const { 
    prospects, 
    stats, 
    loadingData, 
    permissionError, 
    addProspect, 
    updateProspect, 
    deleteProspect,
    dailyClosuresChartData // RECIBIR NUEVOS DATOS
  } = useProspectData(user);
  
  // 3. Hook de Historial del Contador Diario (PERSISTENTE)
  const dailyCountsChartData = useDailyCountHistory(user);

  // NUEVO: Sincroniza el contador local con los datos de Firestore cuando se cargan
  useEffect(() => {
    // dailyCountsChartData.dailyInteractions tiene 15 items. El último (índice 14) es el de hoy.
    if (dailyCountsChartData && dailyCountsChartData.dailyInteractions && dailyCountsChartData.dailyInteractions.length === 15) {
      const todayFirestoreCount = dailyCountsChartData.dailyInteractions[14];
      setProspectCounter(todayFirestoreCount);
    }
  }, [dailyCountsChartData]); // Se ejecuta cada vez que los datos del gráfico (desde Firestore) cambian


  // 4. Funciones de Persistencia del Contador (Se llaman desde ProspectCounter)
  
  const updateDailyCountInFirestore = useCallback(async (value) => {
    if (!user?.uid || !db) {
      throw new Error("Usuario no autenticado para guardar el conteo.");
    }
    const todayKey = getTodayKey();
    // Ruta: /artifacts/{appId}/users/{userId}/daily_counts/{todayKey}
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'daily_counts', todayKey);
    
    // Usar setDoc con merge: true y increment para crear o actualizar atómicamente
    await setDoc(docRef, { 
      count: increment(value),
      lastUpdated: serverTimestamp(),
      dateKey: todayKey // útil para debug
    }, { merge: true });
    
  }, [user]);

  const handleIncrementCounter = useCallback(() => updateDailyCountInFirestore(1), [updateDailyCountInFirestore]);
  const handleDecrementCounter = useCallback(() => updateDailyCountInFirestore(-1), [updateDailyCountInFirestore]);


  // 5. Renderizado de Contenido Principal
  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-900">
          <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
        </div>
      );
    }
    
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            stats={stats}
            loadingData={loadingData}
            permissionError={permissionError}
            prospectCounter={prospectCounter} 
            setProspectCounter={setProspectCounter} 
            dailyCountsChartData={dailyCountsChartData} 
            dailyClosuresChartData={dailyClosuresChartData} // PASAR NUEVOS DATOS
            handleIncrementCounter={handleIncrementCounter} 
            handleDecrementCounter={handleDecrementCounter} 
            setFeedback={setFeedback}
          />
        );
      case 'followUp':
        return (
          <FollowUpList 
            prospects={prospects}
            addProspect={addProspect}
            updateProspect={updateProspect}
            deleteProspect={deleteProspect}
            setFeedback={setFeedback}
            loadingData={loadingData}
            permissionError={permissionError}
          />
        );
      default:
        return <Dashboard 
                stats={stats} 
                loadingData={loadingData} 
                permissionError={permissionError} 
                prospectCounter={prospectCounter}
                setProspectCounter={setProspectCounter}
                dailyCountsChartData={dailyCountsChartData}
                dailyClosuresChartData={dailyClosuresChartData}
                handleIncrementCounter={handleIncrementCounter} 
                handleDecrementCounter={handleDecrementCounter}
                setFeedback={setFeedback} 
              />;
    }
  };

  const userId = user?.uid || 'N/A';
  


// Si el usuario no ha iniciado sesión, muestra el login
if (!user) return <Login onLogin={() => setUser(auth.currentUser)} />;



  return (
    <div className="min-h-screen bg-gray-900 font-sans">
      {/* Carga Tailwind CSS y usa Inter Font */}
      <script src="https://cdn.tailwindcss.com"></script>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap');
        body { font-family: 'Inter', sans-serif; }
        select {
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3e%3cpath d='M7 7l3-3 3 3m0 6l-3 3-3-3' stroke='%239CA3AF' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3e%3c/svg%3e");
          background-position: right 0.5rem center;
          background-repeat: no-repeat;
          background-size: 1.5em 1.5em;
          padding-right: 2.5rem;
        }
      `}</style>

      {/* Header Fijo */}
      {/* Header Fijo */}
<header className="sticky top-0 z-10 bg-[#1e1346] shadow-[0_4px_15px_rgba(0,0,0,0.5)] border-b border-indigo-700/50">
  {/* Fila 1: Título + Usuario/Logout */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
    <h1 className="text-2xl font-extrabold text-white tracking-wider">
      GEN <span className="text-emerald-400">METRICS</span>
    </h1>

    {user && (
      <div className="flex items-center gap-3">
        <span className="text-sm text-white/70 font-medium">
          👤 {user.displayName || "Usuario"}
        </span>
        <button
          onClick={handleLogout}
          className="flex items-center px-3 py-2 text-sm font-medium rounded-lg text-pink-400 hover:bg-pink-900/40 transition"
        >
          <LogOut className="w-4 h-4 mr-1" />
          Cerrar sesión
        </button>
      </div>
    )}
  </div>

  {/* Fila 2: Nav Desktop + UID + Menú móvil */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-between items-center">
    {/* Navegación (Desktop) */}
    <nav className="hidden md:flex space-x-4">
      <button
        onClick={() => setCurrentPage('dashboard')}
        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition duration-150 ${
          currentPage === 'dashboard'
            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
            : 'text-indigo-300 hover:bg-indigo-800/50'
        }`}
      >
        <LayoutDashboard className="w-5 h-5 mr-2" />
        Dashboard
      </button>

      <button
        onClick={() => setCurrentPage('followUp')}
        className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition duration-150 ${
          currentPage === 'followUp'
            ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30'
            : 'text-indigo-300 hover:bg-indigo-800/50'
        }`}
      >
        <List className="w-5 h-5 mr-2" />
        Seguimiento
      </button>
    </nav>

    {/* Info de Usuario / Auth + Menú móvil */}
    <div className="flex items-center space-x-4">
      {isAuthReady && (
        <div className="hidden lg:block text-xs text-indigo-400 bg-indigo-900/50 p-2 rounded-lg truncate max-w-xs">
          <User className="w-3 h-3 inline mr-1" />
          UID: {user?.uid || 'N/A'}
        </div>
      )}
      {/* Menú para móvil */}
      <div className="md:hidden">
        <Menu
          className="w-6 h-6 text-white cursor-pointer"
          onClick={() =>
            setCurrentPage(currentPage === 'dashboard' ? 'followUp' : 'dashboard')
          }
        />
      </div>
    </div>
  </div>
</header>


      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto pb-12">
        {renderContent()}
      </main>

      {/* Notificación Toast */}
      {feedback && (
        <ToastNotification 
          message={feedback.message} 
          type={feedback.type} 
          onClose={() => setFeedback(null)} 
        />
      )}
    </div>
  );
};

export default App;


