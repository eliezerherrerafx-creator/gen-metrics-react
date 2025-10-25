<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Prospect Tracker - Diseño Estático</title>
    <!-- Carga de Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Carga de Lucide Icons (se simula el uso de íconos) -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <style>
        /* Fondo principal de la App */
        .bg-main {
            background-color: #110b2b; /* Equivalente a bg-[#110b2b] */
        }
        /* Fondo de la Sidebar */
        .bg-sidebar {
            background-color: #160e3a; /* Equivalente a bg-[#160e3a] */
        }
        /* Fondo de las Tarjetas/Secciones */
        .bg-card {
            background-color: #221655; /* Equivalente a bg-[#221655] */
            /* Sombra y Borde Replicando el estilo React */
            box-shadow: 0 0 15px rgba(109, 40, 217, 0.7); 
            border: 1px solid #3730a3; /* border-indigo-900 */
        }
        /* Estilo para las Canvas de Gráficos (Placeholder) */
        .chart-placeholder {
            height: 350px; 
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.875rem; /* text-sm */
            color: #93c5fd; /* text-blue-300 */
            border: 2px dashed #4f46e5; /* indigo-600 */
            background-color: #1e1346; /* Un poco más oscuro */
            border-radius: 0.75rem; /* rounded-xl */
        }
        
        /* Estilos específicos para la tabla y selects */
        .select-base {
            padding: 0.5rem;
            font-size: 0.875rem;
            border-radius: 0.5rem;
            transition-duration: 150ms;
            font-weight: 500;
            cursor: pointer;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            text-align: center;
        }

        .status-presented {
            color: #facc15; /* yellow-400 */
            border: 1px solid #92400e; /* yellow-800 */
            background-color: rgba(144, 73, 0, 0.5); /* yellow-900/50 */
        }
        .status-closed {
            color: #f87171; /* red-400 */
            border: 1px solid #7f1d1d; /* red-800 */
            background-color: rgba(127, 29, 29, 0.5); /* red-900/50 */
        }
        .status-paid {
            color: #34d399; /* emerald-400 */
            border: 1px solid #065f46; /* emerald-800 */
            background-color: rgba(6, 95, 70, 0.5); /* emerald-900/50 */
        }
        .status-default {
             color: #9ca3af; /* gray-400 */
             border: 1px solid #374151; /* gray-700 */
             background-color: rgba(55, 65, 81, 0.5); /* gray-800/50 */
        }
        .status-pink {
            color: #f472b6; /* pink-400 */
            border: 1px solid #831843; /* pink-800 */
            background-color: rgba(131, 24, 67, 0.5); /* pink-900/50 */
        }

    </style>
</head>
<body class="bg-main font-sans min-h-screen">
    
    <div class="flex flex-col md:flex-row min-h-screen">
        
        <!-- =============================================== -->
        <!-- 1. SIDEBAR (Estructura y Estilo Fijo) -->
        <!-- =============================================== -->
        <div class="md:w-64 bg-sidebar p-6 flex flex-col border-r border-indigo-900 shadow-xl hidden md:flex">
            
            <!-- Logo -->
            <div class="flex justify-between items-center mb-10">
                <h2 class="text-2xl font-extrabold text-white">
                    <span class="text-emerald-400">P</span> Tracker
                </h2>
                <!-- Ícono de X invisible en desktop -->
            </div>

            <!-- Enlaces de Navegación (Estático) -->
            <nav class="flex-grow space-y-2">
                <button class="w-full text-left flex items-center p-3 rounded-xl transition duration-200 bg-indigo-700 text-white font-bold shadow-lg">
                    <i data-lucide="layout-dashboard" class="w-5 h-5 mr-3"></i>
                    <span class="text-sm">Resumen (Dashboard)</span>
                </button>
                <button class="w-full text-left flex items-center p-3 rounded-xl transition duration-200 text-indigo-200 hover:bg-indigo-900/70 hover:text-indigo-100">
                    <i data-lucide="list" class="w-5 h-5 mr-3"></i>
                    <span class="text-sm">Lista de Seguimiento</span>
                </button>
            </nav>

            <!-- Footer de la Sidebar -->
            <div class="pt-6 border-t border-indigo-800 mt-6">
                <div class="flex items-center space-x-2 text-emerald-400">
                    <i data-lucide="user" class="w-5 h-5"></i>
                    <span class="font-medium text-sm hidden md:inline">Usuario ID:</span>
                    <span class="font-mono text-xs max-w-[150px] truncate">mock-uid-1a2b3c4d5e6f</span>
                </div>
                <p class="text-xs text-indigo-500 mt-2">v1.0 - Desarrollado con React & Firebase</p>
            </div>
        </div>

        <!-- Header Móvil (Simulación) -->
        <div class="sticky top-0 z-40 bg-sidebar p-4 border-b border-indigo-900 flex justify-between items-center shadow-lg md:hidden">
            <button class="p-2 text-indigo-200 hover:bg-indigo-800 rounded-lg">
                <i data-lucide="menu" class="w-6 h-6"></i>
            </button>
            <h1 class="text-xl font-bold text-white">Prospect Tracker</h1>
            <div class="flex items-center space-x-2 text-emerald-400">
                 <i data-lucide="user" class="w-5 h-5"></i>
            </div>
        </div>


        <!-- =============================================== -->
        <!-- 2. CONTENIDO PRINCIPAL (Dashboard) -->
        <!-- =============================================== -->
        <main class="flex-1 overflow-y-auto w-full pb-10">
            
            <div id="dashboard-view" class="p-4 md:p-8 transition-opacity">
                <h1 class="text-3xl font-bold text-white mb-6">Resumen de Seguimiento</h1>
                
                <!-- Métrica Histórica - Destacada -->
                <div class="mb-8">
                    <h2 class="text-xl font-semibold text-indigo-400 mb-3 border-b border-indigo-900 pb-2">Métrica Histórica Clave (Lista de Seguimiento)</h2>
                    <div class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 flex flex-col justify-between">
                        <div class="flex items-start justify-between">
                            <h3 class="text-sm font-semibold text-indigo-400 uppercase">Relación Pago/Cierre TOTAL HISTÓRICA</h3>
                            <i data-lucide="trending-up" class="w-5 h-5 text-indigo-400/80"></i>
                        </div>
                        <p class="text-4xl font-extrabold text-white mt-2">
                            1 pago cada 
                            <span class="text-lg font-normal ml-1 text-indigo-300">5 cierres</span>
                        </p>
                        <p class="text-xs mt-3 text-indigo-200/90">Calculado con todos los datos históricos guardados en la base de datos.</p>
                    </div>
                </div>

                <!-- Contador Rápido Diario (Diseño) -->
                <div class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 mt-8">
                    <h3 class="text-xl font-semibold text-white mb-4 flex items-center">
                        <i data-lucide="tag" class="w-5 h-5 mr-2 text-emerald-400"></i>
                        Interacciones del Día: 
                        <span class="text-emerald-400 ml-2 font-bold text-2xl">7</span>
                    </h3>
                    <p class="text-indigo-200 mb-4 text-sm">
                        Usa este contador para registrar rápidamente el número de interacciones o llamadas realizadas hoy.
                    </p>
                    <div class="flex space-x-4">
                        <button class="flex-1 px-4 py-3 bg-indigo-900 font-bold rounded-xl shadow-md transition duration-300 hover:bg-indigo-800 text-white hover:shadow-[0_0_20px_0px_#10b981]">
                            <span class="flex items-center justify-center">
                                <i data-lucide="plus" class="w-5 h-5 mr-2"></i>
                                +1 Interacción
                            </span>
                        </button>
                        <button class="flex-1 px-4 py-3 bg-indigo-900 font-bold rounded-xl shadow-md transition duration-300 hover:bg-indigo-800 text-white hover:shadow-[0_0_20px_0px_#ec4899]">
                            <span class="flex items-center justify-center">
                                <i data-lucide="minus" class="w-5 h-5 mr-2"></i>
                                -1 Interacción (Deshacer)
                            </span>
                        </button>
                    </div>
                </div>

                <!-- Resumen Diario (Cards) -->
                <div class="mt-8 mb-8">
                    <h2 class="text-xl font-semibold text-indigo-200 mb-4 border-b border-indigo-900 pb-2">Resultados de Hoy (Lista de Seguimiento - 24 Oct)</h2>
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                        
                        <!-- Card 1: Presentados -->
                        <div class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 flex flex-col justify-between">
                            <div class="flex items-start justify-between">
                                <h3 class="text-sm font-semibold text-indigo-400 uppercase">Prospectos Presentados</h3>
                                <i data-lucide="check-circle" class="w-5 h-5 text-indigo-400/80"></i>
                            </div>
                            <p class="text-4xl font-extrabold text-white mt-2">
                                3
                            </p>
                            <p class="text-xs mt-3 text-indigo-200/90">(Solo prospectos marcados como 'Presentado')</p>
                        </div> 
                        
                        <!-- Card 2: Cerrados -->
                        <div class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 flex flex-col justify-between">
                            <div class="flex items-start justify-between">
                                <h3 class="text-sm font-semibold text-indigo-400 uppercase">Prospectos Cerrados</h3>
                                <i data-lucide="x" class="w-5 h-5 text-indigo-400/80"></i>
                            </div>
                            <p class="text-4xl font-extrabold text-white mt-2">
                                2
                            </p>
                            <p class="text-xs mt-3 text-indigo-200/90">(Solo prospectos marcados como 'Cerrado')</p>
                        </div>

                        <!-- Card 3: Pagos -->
                        <div class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 flex flex-col justify-between">
                            <div class="flex items-start justify-between">
                                <h3 class="text-sm font-semibold text-indigo-400 uppercase">Pagos Recibidos</h3>
                                <i data-lucide="tag" class="w-5 h-5 text-indigo-400/80"></i>
                            </div>
                            <p class="text-4xl font-extrabold text-white mt-2">
                                1
                            </p>
                            <p class="text-xs mt-3 text-indigo-200/90">(Solo prospectos marcados como 'Pago')</p>
                        </div>

                        <!-- Card 4: Porcentaje -->
                        <div class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 flex flex-col justify-between">
                            <div class="flex items-start justify-between">
                                <h3 class="text-sm font-semibold text-indigo-400 uppercase">% Pagados vs. Cerrados</h3>
                                <i data-lucide="percent" class="w-5 h-5 text-indigo-400/80"></i>
                            </div>
                            <p class="text-4xl font-extrabold text-white mt-2">
                                50.0
                                <span class="text-lg font-normal ml-1 text-indigo-300">%</span>
                            </p>
                            <p class="text-xs mt-3 text-indigo-200/90">Efectividad de 2 cierres hoy.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Gráfico de 15 Días y Contador en Vivo (Placeholders) -->
                <h2 class="text-xl font-semibold text-indigo-200 mt-8 mb-4 border-b border-indigo-900 pb-2">Métricas de Actividad (Últimos 15 Días)</h2>
                <div class="mt-8 p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900">
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        <!-- Gráfico 1: Interacciones Diarias -->
                        <div>
                            <div class="chart-placeholder">
                                Placeholder: Gráfico de Interacciones Diarias (Línea Esmeralda)
                            </div>
                            <div class="text-center text-indigo-300 mt-2 text-sm">
                                (Añade interacciones con el botón '+1 Interacción')
                            </div>
                        </div>
                        
                        <!-- Gráfico 2: Cierres Diarios -->
                        <div>
                            <div class="chart-placeholder">
                                Placeholder: Gráfico de Cierres Diarios (Barra Roja)
                            </div>
                            <div class="text-center text-indigo-300 mt-2 text-sm">
                                (Marca prospectos como 'Cerrado' en la Lista de Seguimiento)
                            </div>
                        </div>

                        <!-- Gráfico 3: Contador en Vivo -->
                        <div>
                            <div class="chart-placeholder">
                                Placeholder: Contador de Interacciones de HOY (Barra Índigo)
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            
            <!-- =============================================== -->
            <!-- 3. CONTENIDO PRINCIPAL (Lista de Seguimiento) -->
            <!-- =============================================== -->
            <div id="list-view" class="p-4 md:p-8 transition-opacity">
                <h1 class="text-3xl font-bold text-white mb-6">Lista de Seguimiento (CRM Simple)</h1>
                
                <!-- Formulario y Botón de Exportar (Diseño) -->
                <div class="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-6">
                    <div class="xl:col-span-3">
                        <form class="p-6 bg-card rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 h-full flex flex-col justify-center">
                            <h2 class="text-xl font-semibold text-white mb-4">Agregar Nuevo Prospecto</h2>
                            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="Nombre del Prospecto"
                                    class="p-3 border border-indigo-700 bg-indigo-900/50 text-white rounded-xl focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition placeholder-indigo-400 md:col-span-2" 
                                    value="Mock Prospecto 4"
                                    readonly
                                />
                                <input
                                    type="tel"
                                    placeholder="Teléfono (Ej: 521234567890)"
                                    class="p-3 border border-indigo-700 bg-indigo-900/50 text-white rounded-xl focus:ring-1 focus:ring-emerald-400 focus:border-emerald-400 transition placeholder-indigo-400"
                                    value="5215512345678"
                                    readonly
                                />
                                <button
                                    type="submit"
                                    class="w-full flex justify-center items-center px-4 py-3 bg-indigo-800 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition duration-300 hover:shadow-[0_0_20px_0px_#10b981]" 
                                >
                                    Añadir Prospecto
                                </button>
                            </div>
                            <p class="text-sm mt-3 text-indigo-300/80">
                                Las etiquetas se gestionan directamente en la fila de la Lista de Seguimiento.
                            </p>
                        </form>
                    </div>
                    <div class="xl:col-span-1 flex justify-start xl:justify-end items-start pt-6">
                        <button
                            class="flex items-center px-4 py-3 bg-emerald-700 text-white font-bold rounded-xl shadow-md hover:bg-emerald-600 transition duration-300 hover:shadow-[0_0_20px_0px_#10b981]" 
                            title="Exportar la lista completa a un archivo CSV"
                        >
                            <i data-lucide="download" class="w-5 h-5 mr-2"></i>
                            Exportar a CSV
                        </button>
                    </div>
                </div>

                <!-- Tabla de Prospectos (Diseño) -->
                <div class="overflow-x-auto mt-6 rounded-xl shadow-[0_0_15px_rgba(109,40,217,0.7)] border border-indigo-900 bg-card">
                    <table class="min-w-full divide-y divide-indigo-800">
                        <thead class="bg-indigo-900/50 sticky top-0">
                            <tr>
                                <th class="px-3 py-3 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[180px]">
                                    Prospecto / Contacto
                                </th>
                                <th class="px-3 py-3 text-center text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[120px]">
                                    Presentación
                                </th>
                                <th class="px-3 py-3 text-center text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[120px]">
                                    Cierre
                                </th>
                                <th class="px-3 py-3 text-center text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[120px]">
                                    Pago
                                </th>
                                <th class="px-3 py-3 text-center text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[150px]">
                                    Interés
                                </th>
                                <th class="px-3 py-3 text-left text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[200px]">
                                    Etiquetas
                                </th>
                                <th class="px-3 py-3 text-right text-xs font-semibold text-indigo-300 uppercase tracking-wider min-w-[80px]">
                                    Acción
                                </th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-indigo-900/50">
                            
                            <!-- Fila 1: Presentado, Cerrado, Pago (Éxito) -->
                            <tr class="border-b border-indigo-900/50 hover:bg-indigo-900/20">
                                <td class="p-3 text-sm font-medium text-white max-w-[150px] truncate">
                                    Ana García
                                    <div class="text-xs text-indigo-400 mt-1 flex items-center">
                                        <a href="#" class="hover:text-emerald-400 transition flex items-center">
                                            5215511112222
                                            <i data-lucide="send" class="w-3 h-3 ml-1"></i>
                                        </a>
                                    </div>
                                    <span class="text-xs text-indigo-500 block mt-1">20/10/2025</span>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-presented">
                                        <option selected>Presentado</option>
                                        <option>No presentado</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-closed">
                                        <option selected>Cerrado</option>
                                        <option>No cerrado</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-paid">
                                        <option selected>Pago</option>
                                        <option>No pago</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base text-white bg-indigo-800/70 border-indigo-700">
                                        <option selected>Trading</option>
                                        <option>Ecommerce</option>
                                    </select>
                                </td>
                                <td class="p-3 text-sm text-indigo-300 max-w-[200px]">
                                    <div class="flex flex-wrap gap-1 cursor-pointer">
                                        <span class="px-2 py-0.5 text-xs bg-indigo-700 rounded-full text-indigo-100/90 truncate">Cálido</span>
                                        <span class="px-2 py-0.5 text-xs bg-indigo-700 rounded-full text-indigo-100/90 truncate">Referido</span>
                                    </div>
                                </td>
                                <td class="p-3 text-right">
                                    <button class="p-2 rounded-full text-pink-400 hover:bg-pink-900 transition" title="Eliminar prospecto">
                                        <i data-lucide="x" class="w-5 h-5"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Fila 2: No Presentado, No Cerrado, No Pago (En Seguimiento) -->
                            <tr class="border-b border-indigo-900/50 hover:bg-indigo-900/20">
                                <td class="p-3 text-sm font-medium text-white max-w-[150px] truncate">
                                    Roberto Solis
                                    <div class="text-xs text-indigo-400 mt-1 flex items-center">
                                        <a href="#" class="hover:text-emerald-400 transition flex items-center">
                                            5215533334444
                                            <i data-lucide="send" class="w-3 h-3 ml-1"></i>
                                        </a>
                                    </div>
                                    <span class="text-xs text-indigo-500 block mt-1">24/10/2025</span>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-default">
                                        <option>Presentado</option>
                                        <option selected>No presentado</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-default">
                                        <option>Cerrado</option>
                                        <option selected>No cerrado</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-pink">
                                        <option>Pago</option>
                                        <option selected>No pago</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base text-white bg-indigo-800/70 border-indigo-700">
                                        <option>Trading</option>
                                        <option selected>Network Marketing</option>
                                    </select>
                                </td>
                                <td class="p-3 text-sm text-indigo-300 max-w-[200px]">
                                    <div class="flex flex-wrap gap-1 cursor-pointer">
                                        <span class="text-indigo-500 italic">Clic para añadir etiquetas</span>
                                    </div>
                                </td>
                                <td class="p-3 text-right">
                                    <button class="p-2 rounded-full text-pink-400 hover:bg-pink-900 transition" title="Eliminar prospecto">
                                        <i data-lucide="x" class="w-5 h-5"></i>
                                    </button>
                                </td>
                            </tr>
                            
                            <!-- Fila 3: Presentado, No Cerrado, No Pago (Pendiente de Cierre) -->
                            <tr class="border-b border-indigo-900/50 hover:bg-indigo-900/20">
                                <td class="p-3 text-sm font-medium text-white max-w-[150px] truncate">
                                    Carla Pérez
                                    <div class="text-xs text-indigo-400 mt-1 flex items-center">
                                        <a href="#" class="hover:text-emerald-400 transition flex items-center">
                                            5215555556666
                                            <i data-lucide="send" class="w-3 h-3 ml-1"></i>
                                        </a>
                                    </div>
                                    <span class="text-xs text-indigo-500 block mt-1">23/10/2025</span>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-presented">
                                        <option selected>Presentado</option>
                                        <option>No presentado</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-default">
                                        <option>Cerrado</option>
                                        <option selected>No cerrado</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base status-pink">
                                        <option>Pago</option>
                                        <option selected>No pago</option>
                                    </select>
                                </td>
                                <td class="p-3">
                                    <select class="select-base text-white bg-indigo-800/70 border-indigo-700">
                                        <option>Trading</option>
                                        <option selected>FWP</option>
                                    </select>
                                </td>
                                <td class="p-3 text-sm text-indigo-300 max-w-[200px]">
                                    <div class="flex flex-wrap gap-1 cursor-pointer">
                                        <span class="px-2 py-0.5 text-xs bg-indigo-700 rounded-full text-indigo-100/90 truncate">Seguimiento 3 días</span>
                                    </div>
                                </td>
                                <td class="p-3 text-right">
                                    <button class="p-2 rounded-full text-pink-400 hover:bg-pink-900 transition" title="Eliminar prospecto">
                                        <i data-lucide="x" class="w-5 h-5"></i>
                                    </button>
                                </td>
                            </tr>

                        </tbody>
                    </table>
                </div>

            </div>
            
            <!-- Toast (Diseño Estático) -->
            <div class="fixed bottom-4 right-4 z-50 p-4 rounded-xl shadow-xl text-white bg-emerald-500 transition-transform duration-300 ease-out transform translate-y-0">
              <div class="flex items-center space-x-3">
                <i data-lucide="check-circle" class="w-5 h-5"></i>
                <p class="font-medium text-sm">Ejemplo: Prospecto añadido con éxito. ¡Ahora puedes etiquetarlo!</p>
                <button class="p-1 rounded-full hover:bg-white/20 transition">
                  <i data-lucide="x" class="w-4 h-4"></i>
                </button>
              </div>
            </div>

        </main>
    </div>

    <!-- Script para inicializar íconos de Lucide (Solo visual) -->
    <script>
        lucide.createIcons();
    </script>
</body>
</html>
