# SmartCut - Optimizador de Corte de Planchas

**SmartCut** es una aplicación web moderna para la optimización de corte de planchas (tableros, láminas, paneles) utilizando algoritmos avanzados de *bin packing* (empacado bidimensional). Diseñada para talleres de carpintería, metalmecánica, y cualquier industria que requiera optimizar el aprovechamiento de material con precisión técnica.

## 🎯 Características Principales

- **Optimización Inteligente**: Algoritmo *Guillotine Recursivo* con estrategia Best-Fit Area para maximizar el aprovechamiento del material
- **Manejo Avanzado de Kerf**: Considera el espesor de corte de la sierra, con excepciones para piezas en bordes
- **Edge Banding**: Soporte para cinta de borde, configurable por lado, para acabados profesionales
- **Gestión de Inventario**: Soporte para planchas nuevas y retazos existentes (scraps reutilizables)
- **Generación Automática de Retazos**: Crea rectángulos aprovechables del desperdicio con manejo de kerf
- **Parámetros Configurables**: Kerf, refile (bordes de desecho), tamaño mínimo de retazo, grosor de edge banding
- **Múltiples Planchas**: Soporte para diferentes tamaños de planchas y distribución automática
- **Piezas Personalizadas**: Define dimensiones, cantidades, nombres y restricciones de rotación
- **Visualización 2D**: Planos de corte interactivos con vista previa en tiempo real y líneas de corte
- **Exportación Técnica**: PDF profesional con coordenadas de cortes, posiciones de piezas e instrucciones paso a paso
- **Exportación SVG**: Diagramas vectoriales escalables para precisión en corte
- **Persistencia Local**: Configuración e historial guardados en el navegador
- **Manejo de Errores**: Boundary de errores para estabilidad en cálculos complejos
- **Responsive**: Funciona en desktop, tablet y móvil (PWA ready)

## 🛠️ Tecnologías

| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Framework UI |
| **Vite 7** | Build tool y dev server |
| **TailwindCSS 4** | Estilos utilitarios |
| **jsPDF** | Generación de PDF técnicos |
| **html2canvas** | Captura de canvas |
| **UUID** | Generación de IDs únicos |
| **Error Boundary** | Manejo robusto de errores |

## 📦 Instalación

```bash
# Clonar o navegar al directorio del proyecto
cd Optimizador

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Vista previa de producción
npm run preview

# Ejecutar linter
npm run lint
```

## 🚀 Uso

### 1. Configurar Planchas
- Ingresa el ancho y alto de tus planchas (en mm)
- Usa los presets rápidos para tamaños comunes
- Agrega múltiples planchas si necesitas combinar tamaños
- Gestiona retazos existentes: agrega scraps reutilizables al inventario

### 2. Agregar Piezas
- Define las dimensiones de cada pieza a cortar
- Especifica la cantidad requerida
- Opcional: asigna un nombre identificador
- Configura restricciones de rotación si es necesario

### 3. Configurar Parámetros Avanzados
- Ajusta kerf (espesor de corte, default 5mm) con manejo inteligente en bordes
- Configura refile (bordes de desecho, default 10mm)
- Define grosor de edge banding (default 1.5mm, configurable por lado)
- Define tamaño mínimo de retazo (default 300mm)
- Selecciona estrategia de colocamiento (Best-Fit Area optimizada)

### 4. Calcular Optimización
- Presiona **CALCULAR** para ejecutar el algoritmo avanzado
- Visualiza el plano de corte con distribución óptima y líneas de corte
- Revisa métricas detalladas: aprovechamiento, retazos, cortes necesarios

### 5. Exportar Documentos Técnicos
- **PDF Profesional**: Genera presupuesto con coordenadas de cortes, posiciones de piezas, secuencia de corte paso a paso y diagramas
- **SVG Vectorial**: Exporta diagramas escalables para precisión en CNC o corte manual

## 🧠 Algoritmo de Optimización Avanzado

El proyecto implementa un algoritmo **Guillotine Recursivo** optimizado con las siguientes características avanzadas:

### Clase GuillotineOptimizer
```
┌─────────────────────────────────────┐
│ 1. Gestión de Inventario            │
│    - Planchas nuevas + retazos      │
│    - Distribución automática         │
├─────────────────────────────────────┤
│ 2. Expansión de Piezas              │
│    - Agrega kerf (espesor corte)    │
│    - Aplica edge banding (+ grosor) │
│    - Maneja bordes inteligentes      │
│    - Multiplica por cantidad        │
├─────────────────────────────────────┤
│ 3. Ordenamiento Best-Fit Area       │
│    - Área descendente + lado largo  │
│    - Ponderación 70/30 para óptimo  │
├─────────────────────────────────────┤
│ 4. Colocamiento Recursivo           │
│    - Busca rectángulo con mejor fit │
│    - Minimiza área de desperdicio    │
│    - Permite rotación 90°           │
│    - Divide recursivamente espacio  │
│    - Fusiona rectángulos adyacentes │
├─────────────────────────────────────┤
│ 5. Generación de Retazos           │
│    - Retazos > minScrapSize         │
│    - Respeta kerf en particiones    │
│    - Rectángulos aprovechables      │
├─────────────────────────────────────┤
│ 6. Coordenadas Técnicas             │
│    - Secuencia ordenada de cortes   │
│    - Posiciones precisas de piezas  │
│    - Instrucciones para CNC/manual  │
└─────────────────────────────────────┘
```

### Estrategia Best-Fit Area
- Ordena piezas por área descendente con ponderación del lado más largo
- Selecciona el rectángulo libre que minimiza el desperdicio tras colocación
- Maneja kerf correctamente, evitando adiciones innecesarias en bordes

### Métodos Clave
| Método | Descripción |
|--------|-------------|
| `findBestRect(piece)` | Evalúa rectángulos libres y selecciona mejor fit por área |
| `place(piece)` | Coloca pieza, registra cortes y divide espacio recursivamente |
| `splitRect()` | Particiona espacio restante respetando kerf y bordes |
| `recordCutLines()` | Registra coordenadas de cortes verticales/horizontales |
| `mergeFreeRects()` | Fusiona rectángulos adyacentes para optimizar |
| `getCutCoordinates()` | Devuelve secuencia ordenada de cortes |
| `getStats()` | Calcula métricas de aprovechamiento y desperdicio |

## 📦 Gestión de Inventario Avanzada

### Tipos de Planchas
- **Nuevas**: Planchas completas de stock
- **Retazos**: Piezas remanentes con manejo inteligente de kerf

### Edge Banding Profesional
- Configurable por lado (top/bottom/left/right)
- Agrega grosor al corte bruto para acabados perfectos
- Afecta dimensiones finales sin comprometer precisión

### Generación Automática de Retazos
- Detecta rectángulos aprovechables respetando kerf
- Filtra por tamaño mínimo configurable
- Evita scraps inválidos en bordes

## 📊 Generación de PDF Técnico

El módulo `exportPDF.js` genera documentos profesionales con detalles técnicos:

### Estructura del PDF
```
┌──────────────────────────────────────┐
│ HEADER (fondo oscuro)               │
│ - Nombre del negocio                │
│ - Título: Presupuesto de Corte      │
│ - Fecha                             │
├──────────────────────────────────────┤
│ PLANCHAS                            │
│ - Lista con dimensiones             │
├──────────────────────────────────────┤
│ PIEZAS                              │
│ - Tabla: ID, Nombre, Medida, Cant,  │
│         Veta, Estado                │
├──────────────────────────────────────┤
│ APROVECHAMIENTO                     │
│ - Área total, usada, retazos útiles │
│ - Porcentaje de utilización         │
├──────────────────────────────────────┤
│ COORDENADAS DE CORTE                │
│ - Cortes verticales/horizontales    │
│ - Posiciones desde bordes           │
├──────────────────────────────────────┤
│ POSICIONES DE PIEZAS                │
│ - Coordenadas x/y por pieza         │
│ - Dimensiones finales, rotación     │
├──────────────────────────────────────┤
│ COSTO                               │
│ - Metros de corte                   │
│ - Tarifa por metro                  │
│ - Subtotal + Servicio               │
│ - TOTAL destacado                   │
└──────────────────────────────────────┘
```

### Cálculos Técnicos
- **Coordenadas de Corte**: Secuencia paso a paso con posiciones precisas
- **Posiciones de Piezas**: Referencias exactas para colocación y marcado
- **Metros de Corte**: Suma de perímetros considerando kerf
- **Aprovechamiento**: Utilización real vs. área utilizable

## 🎨 Visualización 2D Avanzada

El componente `CuttingVisualization.jsx` renderiza planos con precisión:

### Características del Canvas
- **Escalado Automático**: Se ajusta al contenedor
- **Grid de Referencia**: Líneas guía cada 100mm
- **Piezas Coloreadas**: Colores distintivos, indicadores de rotación
- **Líneas de Corte**: Cortes guillotina con grosor proporcional a kerf
- **Marcas de Coordenadas**: Referencias en esquinas
- **Edge Banding Visual**: Indicadores de grosor agregado

## 📁 Estructura del Proyecto

```
Optimizador/
├── src/
│   ├── components/
│   │   ├── calculator/
│   │   │   ├── BoardForm.jsx      # Formulario de planchas con tipos
│   │   │   └── PieceForm.jsx      # Formulario de piezas con banding
│   │   ├── results/
│   │   │   ├── ResultsPanel.jsx   # Panel de resultados con métricas
│   │   │   └── CuttingVisualization.jsx  # Canvas 2D avanzado
│   │   └── ui/
│   │       ├── SettingsPanel.jsx  # Configuración extendida (kerf, banding)
│   │       └── HistoryPanel.jsx   # Historial
│   ├── context/
│   │   └── AppContext.jsx         # Estado global con inventario
│   ├── utils/
│   │   ├── smartCutOptimizer.js   # Motor Guillotine recursivo
│   │   ├── exportPDF.js           # PDF técnico con coordenadas
│   │   └── exportSVG.js           # Exportación vectorial
│   ├── pages/
│   │   └── Home.jsx               # Página principal
│   ├── components/
│   │   └── ErrorBoundary.jsx      # Manejo de errores
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
└── README.md
```

## ⚙️ Configuración Avanzada

- **Nombre del Negocio**: Personaliza encabezado del PDF
- **Moneda**: Símbolo monetario (default: S/)
- **Tarifa de Corte**: Costo por metro lineal
- **Tarifa de Servicio**: Costo fijo adicional
- **Kerf**: Espesor de corte (default: 5mm)
- **Refile**: Bordes de desecho (default: 10mm)
- **Edge Banding**: Grosor por lado (default: 1.5mm)
- **Tamaño Mínimo de Retazo**: Para aprovechables (default: 300mm)
- **Estrategia**: Best-Fit Area optimizada

## 🔌 APIs y Contexto

### AppContext
Estado global para inventario, piezas, configuración, historial y resultados.

### Funciones Principales
| Función | Descripción |
|---------|-------------|
| `smartCutOptimize()` | Ejecuta algoritmo con kerf, banding y recursión |
| `exportToPDF()` | Genera PDF con coordenadas y posiciones |
| `exportToSVG()` | Exporta diagrama vectorial |
| `addScrap()` | Agrega retazo con validaciones |

## 📝 Licencia

Proyecto privado - Todos los derechos reservados.

## 👨‍💻 Desarrollo

Desarrollado con React + Vite + TailwindCSS para optimización industrial de procesos de corte con precisión técnica.
