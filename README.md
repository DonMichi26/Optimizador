# SmartCut - Optimizador de Corte de Planchas

**SmartCut** es una aplicación web moderna para la optimización de corte de planchas (tableros, láminas, paneles) utilizando algoritmos de *bin packing* (empacado bidimensional). Diseñada para talleres de carpintería, metalmecánica, y cualquier industria que requiera optimizar el aprovechamiento de material.

## 🎯 Características Principales

- **Optimización Inteligente**: Algoritmo *Guillotine Cutter* con múltiples estrategias (Best Area, Best Long Side, Best Short Side) para maximizar el aprovechamiento del material
- **Gestión de Inventario**: Soporte para planchas nuevas y retazos existentes (scraps reutilizables)
- **Generación Automática de Retazos**: Crea rectángulos aprovechables del desperdicio
- **Parámetros Configurables**: Kerf (espesor de corte), refile (bordes de desecho), tamaño mínimo de retazo
- **Múltiples Planchas**: Soporte para diferentes tamaños de planchas y distribución automática
- **Piezas Personalizadas**: Define dimensiones, cantidades y nombres para cada pieza a cortar
- **Visualización 2D**: Planos de corte interactivos con vista previa en tiempo real
- **Exportación PDF**: Genera presupuestos profesionales con detalles de corte y costos
- **Persistencia Local**: Configuración e historial guardados en el navegador
- **Responsive**: Funciona en desktop, tablet y móvil (PWA ready)

## 🛠️ Tecnologías

| Tecnología | Propósito |
|------------|-----------|
| **React 19** | Framework UI |
| **Vite 7** | Build tool y dev server |
| **TailwindCSS 4** | Estilos utilitarios |
| **jsPDF** | Generación de PDF |
| **html2canvas** | Captura de canvas |
| **UUID** | Generación de IDs únicos |

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
- Ingresa el ancho y alto de tus planchas (en mm o cm)
- Usa los presets rápidos para tamaños comunes
- Agrega múltiples planchas si necesitas combinar tamaños
- Gestiona retazos existentes: agrega scraps reutilizables al inventario

### 2. Agregar Piezas
- Define las dimensiones de cada pieza a cortar
- Especifica la cantidad requerida
- Opcional: asigna un nombre identificador

### 3. Configurar Parámetros
- Ajusta kerf (espesor de corte, default 5mm)
- Configura refile (bordes de desecho, default 15mm)
- Define tamaño mínimo de retazo (default 300mm)
- Selecciona estrategia de colocamiento (Best Area, Best Long Side, Best Short Side)

### 4. Calcular Optimización
- Presiona **CALCULAR** para ejecutar el algoritmo
- Visualiza el plano de corte con la distribución óptima
- Revisa el porcentaje de aprovechamiento y retazos generados

### 5. Exportar Presupuesto
- Genera un PDF profesional con:
  - Lista de planchas y piezas
  - Diagrama de corte
  - Cálculo de costos (tarifa por metro + servicio)
  - Métricas de aprovechamiento y retazos generados

## 🧠 Algoritmo de Optimización

El proyecto implementa un algoritmo **Guillotine Cutting** optimizado con las siguientes características:

### GuillotineCutter Class
```
┌─────────────────────────────────────┐
│ 1. Gestión de Inventario            │
│    - Planchas nuevas + retazos      │
│    - Distribución automática         │
├─────────────────────────────────────┤
│ 2. Expansión de piezas              │
│    - Considera kerf (espesor corte) │
│    - Aplica refile (bordes)         │
│    - Multiplica por cantidad        │
├─────────────────────────────────────┤
│ 3. Ordenamiento inteligente         │
│    - Según estrategia seleccionada  │
│    - Best Area: área descendente    │
│    - Best Long Side: lado largo     │
│    - Best Short Side: lado corto    │
├─────────────────────────────────────┤
│ 4. Colocamiento greedy              │
│    - Busca mejor rectángulo libre   │
│    - Permite rotación 90°           │
│    - Divide rectángulos restantes   │
│    - Fusiona rectángulos adyacentes │
├─────────────────────────────────────┤
│ 5. Generación de retazos           │
│    - Retazos > minScrapSize         │
│    - Rectángulos aprovechables      │
└─────────────────────────────────────┘
```

### Estrategias de Ordenamiento

| Estrategia | Descripción | Mejor para |
|------------|-------------|------------|
| **Best Area** | Ordena por área descendente | Maximización general |
| **Best Long Side** | Ordena por lado largo descendente | Retazos más aprovechables |
| **Best Short Side** | Ordena por lado corto descendente | Eficiencia en cortes |

### Métodos Clave

| Método | Descripción |
|--------|-------------|
| `canFit(w, h)` | Verifica si la pieza cabe (normal o rotada) |
| `place(w, h)` | Coloca la pieza y divide el espacio libre |
| `splitRect()` | Divide el rectángulo en dos nuevos espacios |
| `mergeFreeRects()` | Fusiona rectángulos adyacentes para optimizar |
| `getOccupancy()` | Calcula porcentaje de uso de la plancha |
| `generateScraps()` | Crea retazos aprovechables del desperdicio |

## 📦 Gestión de Inventario

La aplicación incluye un sistema completo de gestión de inventario para maximizar el aprovechamiento:

### Tipos de Planchas
- **Nuevas**: Planchas completas de stock
- **Retazos**: Piezas remanentes de cortes anteriores

### Generación Automática de Retazos
- Detecta rectángulos libres aprovechables
- Filtra por tamaño mínimo configurable
- Agrega automáticamente al inventario para futuros cortes

### Beneficios
- Reduce desperdicio acumulativo
- Optimiza costos al reutilizar material
- Mejora eficiencia en talleres con alto volumen

## 📊 Generación de PDF

El módulo `exportPDF.js` genera documentos profesionales con:

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
│ - Tabla: Nombre, Medida, Cant, Estado│
├──────────────────────────────────────┤
│ APROVECHAMIENTO                     │
│ - Área total, usada, desperdicio    │
│ - Porcentaje de utilización         │
├──────────────────────────────────────┤
│ COSTO                               │
│ - Metros de corte                   │
│ - Tarifa por metro                  │
│ - Subtotal + Servicio               │
│ - TOTAL destacado                   │
└──────────────────────────────────────┘
```

### Cálculos del PDF
- **Metros de corte**: Suma de (ancho + alto) de cada pieza / 1000
- **Subtotal**: Metros × tarifa por metro
- **Total**: Subtotal + tarifa de servicio

## 🎨 Visualización 2D (Planos de Corte)

El componente `CuttingVisualization.jsx` renderiza los planos usando Canvas API:

### Características del Canvas
- **Escalado automático**: Se ajusta al contenedor
- **Grid de referencia**: Líneas guía cada 100mm
- **Piezas coloreadas**: Colores distintivos por pieza
- **Dimensiones etiquetadas**: Muestra medidas en cada pieza
- **Líneas de corte guillotina**: Líneas punteadas rojas edge-to-edge
- **Marcas de coordenadas**: Esquinas con referencias

### Proceso de Renderizado
```javascript
1. Calcular escala basada en tamaño de plancha y contenedor
2. Dibujar fondo y grid de referencia
3. Dibujar borde de la plancha
4. Renderizar piezas (fill + stroke + texto)
5. Calcular y dibujar cortes verticales (edge-to-edge)
6. Calcular y dibujar cortes horizontales (edge-to-edge)
7. Agregar marcas de coordenadas
```

## 📁 Estructura del Proyecto

```
Optimizador/
├── src/
│   ├── components/
│   │   ├── calculator/
│   │   │   ├── BoardForm.jsx      # Formulario de planchas con tipos
│   │   │   └── PieceForm.jsx      # Formulario de piezas
│   │   ├── results/
│   │   │   ├── ResultsPanel.jsx   # Panel de resultados con métricas
│   │   │   └── CuttingVisualization.jsx  # Canvas 2D
│   │   └── ui/
│   │       ├── SettingsPanel.jsx  # Configuración extendida (kerf, refile, etc.)
│   │       └── HistoryPanel.jsx   # Historial (UI)
│   ├── context/
│   │   └── AppContext.jsx         # Estado global con inventario
│   ├── utils/
│   │   ├── smartCutOptimizer.js   # Motor de optimización Guillotine
│   │   └── exportPDF.js           # Generación de PDF
│   ├── pages/
│   │   └── Home.jsx               # Página principal
│   ├── App.jsx
│   └── main.jsx
├── public/
│   └── favicon.svg
├── package.json
├── vite.config.js
└── README.md
```

## ⚙️ Configuración

La aplicación permite configurar:
- **Nombre del negocio**: Personaliza el encabezado del PDF
- **Moneda**: Símbolo monetario (default: S/)
- **Tarifa de corte**: Costo por metro lineal de corte
- **Tarifa de servicio**: Costo fijo adicional
- **Kerf (espesor de corte)**: Espesor del corte de la sierra (default: 5mm)
- **Refile (bordes de desecho)**: Bordes de desecho en planchas (default: 15mm)
- **Tamaño mínimo de retazo**: Dimensión mínima para considerar un retazo aprovechable (default: 300mm)
- **Estrategia de colocamiento**: Algoritmo para ordenar piezas (Best Area, Best Long Side, Best Short Side)

## 🔌 APIs y Contexto

### AppContext
Provee estado global para:
- `boards`: Lista de planchas (nuevas y retazos)
- `pieces`: Lista de piezas
- `settings`: Configuración del negocio y parámetros de corte
- `history`: Historial de cálculos
- `currentResult`: Resultado actual con retazos generados

### Funciones Principales
| Función | Descripción |
|---------|-------------|
| `optimizeCutting(boards, pieces, settings)` | Ejecuta el algoritmo Guillotine con estrategia seleccionada |
| `exportToPDF(result, settings, boards, pieces)` | Genera el PDF con métricas actualizadas |
| `addScrap(board)` | Agrega un retazo al inventario |
| `removeScrap(id)` | Elimina un retazo del inventario |

## 📝 Licencia

Proyecto privado - Todos los derechos reservados.

## 👨‍💻 Desarrollo

Desarrollado con React + Vite + TailwindCSS para optimización de procesos de corte industrial.
