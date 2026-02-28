/**
 * Optimizador de Corte para Escuadradora de Melamina
 * 
 * Algoritmo mejorado para minimizar retazos no utilizables
 * Características:
 * - Corte guillotina real (borde a borde)
 * - Rotación opcional por pieza (veta/textura)
 * - Prioriza minimizar desperdicio
 * - Calcula retazos aprovechables vs no aprovechables
 */

// ==================== CLASE PRINCIPAL ====================

class GuillotineOptimizer {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.cutThickness = options.cutThickness || 5;
    this.placements = [];
    
    // Rectángulos libres (inicia con toda la plancha)
    this.freeRects = [{
      x: 0,
      y: 0,
      width: width,
      height: height,
      id: 'initial'
    }];
    
    // Retazos generados (para análisis de desperdicio)
    this.waste = [];
  }

  /**
   * Verifica si una pieza cabe en algún rectángulo libre
   * @param {number} w - Ancho de la pieza
   * @param {number} h - Alto de la pieza
   * @param {boolean} allowRotation - Si permite rotación (veta)
   */
  canFit(w, h, allowRotation = true) {
    for (const rect of this.freeRects) {
      // Verifica orientación normal
      if (rect.width >= w && rect.height >= h) {
        return true;
      }
      // Verifica rotación si está permitida
      if (allowRotation && rect.width >= h && rect.height >= w) {
        return true;
      }
    }
    return false;
  }

  /**
   * Encuentra el mejor rectángulo para colocar una pieza
   * Estrategia: Best Area Fit (minimiza desperdicio)
   */
  findBestRect(w, h, allowRotation = true) {
    let bestRect = null;
    let bestScore = Infinity;
    let rotated = false;

    for (let i = 0; i < this.freeRects.length; i++) {
      const rect = this.freeRects[i];
      
      // Orientación normal
      if (rect.width >= w && rect.height >= h) {
        // Score: área restante después de colocar
        const wasteArea = (rect.width * rect.height) - (w * h);
        // Bonus: preferir rectángulos más pequeños (deja los grandes para después)
        const sizePenalty = rect.width + rect.height;
        const score = wasteArea + (sizePenalty * 0.1);
        
        if (score < bestScore) {
          bestScore = score;
          bestRect = { ...rect, index: i };
          rotated = false;
        }
      }

      // Orientación rotada (si permite)
      if (allowRotation && rect.width >= h && rect.height >= w) {
        const wasteArea = (rect.width * rect.height) - (w * h);
        const sizePenalty = rect.width + rect.height;
        const score = wasteArea + (sizePenalty * 0.1);
        
        if (score < bestScore) {
          bestScore = score;
          bestRect = { ...rect, index: i };
          rotated = true;
        }
      }
    }

    return { bestRect, rotated, score: bestScore };
  }

  /**
   * Coloca una pieza en la plancha
   * @returns {object|null} - Información de la colocación o null si no cabe
   */
  place(piece) {
    const { bestRect, rotated } = this.findBestRect(
      piece.fullWidth,
      piece.fullHeight,
      piece.allowRotation !== false
    );

    if (!bestRect) return null;

    const finalW = rotated ? piece.fullHeight : piece.fullWidth;
    const finalH = rotated ? piece.fullWidth : piece.fullHeight;
    const pieceW = rotated ? piece.height : piece.width;
    const pieceH = rotated ? piece.width : piece.height;

    // Crear colocación
    const placement = {
      ...piece,
      x: bestRect.x,
      y: bestRect.y,
      width: pieceW,
      height: pieceH,
      placedWidth: finalW,
      placedHeight: finalH,
      rotated,
      boardX: bestRect.x,
      boardY: bestRect.y
    };

    this.placements.push(placement);

    // Dividir el rectángulo libre
    this.splitRect(bestRect, finalW, finalH);

    // Eliminar el rectángulo usado
    this.freeRects.splice(bestRect.index, 1);

    return placement;
  }

  /**
   * Divide un rectángulo después de colocar una pieza
   * Estrategia: Split axis shortest (corta por el lado más corto)
   */
  splitRect(rect, w, h) {
    const remainingW = rect.width - w;
    const remainingH = rect.height - h;

    // Generar dos posibles divisiones
    const splitVertical = {
      right: remainingW > 0 ? {
        x: rect.x + w,
        y: rect.y,
        width: remainingW,
        height: rect.height
      } : null,
      bottom: remainingH > 0 ? {
        x: rect.x,
        y: rect.y + h,
        width: w,
        height: remainingH
      } : null
    };

    const splitHorizontal = {
      bottom: remainingH > 0 ? {
        x: rect.x,
        y: rect.y + h,
        width: rect.width,
        height: remainingH
      } : null,
      right: remainingW > 0 ? {
        x: rect.x + w,
        y: rect.y,
        width: remainingW,
        height: h
      } : null
    };

    // Elegir la división que deja menos desperdicio fragmentado
    // Preferir división vertical si el ancho restante es más útil
    let chosenSplit;
    
    if (remainingW >= remainingH) {
      chosenSplit = splitVertical;
    } else {
      chosenSplit = splitHorizontal;
    }

    // Agregar rectángulos resultantes si son aprovechables
    const minUsefulSize = 50; // Retazos menores a 50mm no son útiles
    
    if (chosenSplit.right && chosenSplit.right.width >= minUsefulSize && chosenSplit.right.height >= minUsefulSize) {
      this.freeRects.push(chosenSplit.right);
    } else if (chosenSplit.right) {
      this.waste.push({ ...chosenSplit.right, type: 'waste' });
    }

    if (chosenSplit.bottom && chosenSplit.bottom.width >= minUsefulSize && chosenSplit.bottom.height >= minUsefulSize) {
      this.freeRects.push(chosenSplit.bottom);
    } else if (chosenSplit.bottom) {
      this.waste.push({ ...chosenSplit.bottom, type: 'waste' });
    }
  }

  /**
   * Fusiona rectángulos adyacentes para crear espacios más grandes
   */
  mergeFreeRects() {
    let merged = true;
    while (merged) {
      merged = false;
      
      for (let i = 0; i < this.freeRects.length; i++) {
        for (let j = i + 1; j < this.freeRects.length; j++) {
          const a = this.freeRects[i];
          const b = this.freeRects[j];

          // Mismo X y ancho, adyacentes verticalmente
          if (Math.abs(a.x - b.x) < 1 && 
              Math.abs(a.width - b.width) < 1 && 
              Math.abs((a.y + a.height) - b.y) < 1) {
            a.height += b.height;
            this.freeRects.splice(j, 1);
            merged = true;
            break;
          }
          
          // Mismo Y y alto, adyacentes horizontalmente
          if (Math.abs(a.y - b.y) < 1 && 
              Math.abs(a.height - b.height) < 1 && 
              Math.abs((a.x + a.width) - b.x) < 1) {
            a.width += a.width;
            this.freeRects.splice(j, 1);
            merged = true;
            break;
          }
        }
        if (merged) break;
      }
    }
  }

  /**
   * Obtiene el área utilizada
   */
  getUsedArea() {
    return this.placements.reduce((sum, p) => sum + (p.placedWidth * p.placedHeight), 0);
  }

  /**
   * Obtiene el área de desperdicio
   */
  getWasteArea() {
    return this.waste.reduce((sum, w) => sum + (w.width * w.height), 0);
  }

  /**
   * Obtiene el área libre restante
   */
  getFreeArea() {
    return this.freeRects.reduce((sum, r) => sum + (r.width * r.height), 0);
  }

  /**
   * Calcula el porcentaje de ocupación
   */
  getOccupancy() {
    const totalArea = this.width * this.height;
    return (this.getUsedArea() / totalArea) * 100;
  }

  /**
   * Analiza los retazos restantes
   * @returns {object} - Análisis de retazos aprovechables
   */
  analyzeWaste() {
    const totalArea = this.width * this.height;
    const usedArea = this.getUsedArea();
    const freeArea = this.getFreeArea();
    const wasteArea = totalArea - usedArea - freeArea;

    // Retazos que podrían usarse para piezas pequeñas
    const usableScraps = this.freeRects.filter(r => 
      r.width >= 100 && r.height >= 100
    );

    // Retazos demasiado pequeños
    const unusableScraps = this.freeRects.filter(r => 
      r.width < 100 || r.height < 100
    );

    return {
      totalArea,
      usedArea,
      freeArea,
      wasteArea,
      utilization: (usedArea / totalArea) * 100,
      freeRectsCount: this.freeRects.length,
      usableScrapsCount: usableScraps.length,
      unusableScrapsCount: unusableScraps.length,
      largestScrap: this.freeRects.reduce((max, r) => 
        Math.max(max, r.width * r.height), 0
      )
    };
  }
}

// ==================== FUNCIONES DE UTILIDAD ====================

/**
 * Expande las piezas según cantidad y espesor de corte
 */
function expandPieces(pieces, cutThickness) {
  const expanded = [];
  let instanceId = 0;
  
  pieces.forEach((p) => {
    const count = p.quantity || 1;
    for (let i = 0; i < count; i++) {
      expanded.push({
        id: p.id,
        name: p.name || `Pieza ${instanceId + 1}`,
        originalId: p.id,
        instanceIndex: i,
        instanceId: `${p.id}-${i}`,
        width: p.width,
        height: p.height,
        fullWidth: p.width + cutThickness,
        fullHeight: p.height + cutThickness,
        allowRotation: p.allowRotation !== false,
        grain: p.grain || 'none', // 'horizontal', 'vertical', 'none'
        edge: p.edge || {}, // { top: false, bottom: false, left: false, right: false }
        priority: p.priority || 0,
        placed: false
      });
      instanceId++;
    }
  });
  
  return expanded;
}

/**
 * Ordena piezas para optimizar colocación
 * Estrategias:
 * - area: Por área descendente (mejor para minimizar desperdicio)
 * - perimeter: Por perímetro (mejor para cortes guillotina)
 * - mixed: Combinación
 */
function sortPieces(pieces, strategy = 'area') {
  const sorted = [...pieces];
  
  switch (strategy) {
    case 'perimeter':
      // Ordena por perímetro descendente (mejor secuencia de cortes)
      sorted.sort((a, b) => {
        const perimA = (a.fullWidth + a.fullHeight);
        const perimB = (b.fullWidth + b.fullHeight);
        return perimB - perimA;
      });
      break;
      
    case 'mixed':
      // Combina área y longitud del lado más largo
      sorted.sort((a, b) => {
        const areaA = a.fullWidth * a.fullHeight;
        const areaB = b.fullWidth * b.fullHeight;
        const maxSideA = Math.max(a.fullWidth, a.fullHeight);
        const maxSideB = Math.max(b.fullWidth, b.fullHeight);
        return (areaB - areaA) * 0.7 + (maxSideB - maxSideA) * 0.3;
      });
      break;
      
    case 'priority':
      // Primero por prioridad, luego por área
      sorted.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return (b.fullWidth * b.fullHeight) - (a.fullWidth * a.fullHeight);
      });
      break;
      
    case 'area':
    default:
      // Por área descendente (default)
      sorted.sort((a, b) => 
        (b.fullWidth * b.fullHeight) - (a.fullWidth * a.fullHeight)
      );
      break;
  }
  
  return sorted;
}

/**
 * Calcula la secuencia de cortes guillotina para una plancha
 * @returns {array} - Secuencia de cortes (vertical/horizontal)
 */
function calculateCutSequence(placements, boardWidth, boardHeight) {
  if (!placements || placements.length === 0) return [];
  
  const cuts = [];
  
  // Recopilar todas las líneas de corte únicas
  const verticalLines = new Set();
  const horizontalLines = new Set();
  
  placements.forEach(p => {
    verticalLines.add(p.x);
    verticalLines.add(p.x + p.placedWidth);
    horizontalLines.add(p.y);
    horizontalLines.add(p.y + p.placedHeight);
  });
  
  // Ordenar líneas
  const sortedVertical = Array.from(verticalLines)
    .filter(x => x > 0 && x < boardWidth)
    .sort((a, b) => a - b);
  
  const sortedHorizontal = Array.from(horizontalLines)
    .filter(y => y > 0 && y < boardHeight)
    .sort((a, b) => a - b);
  
  // Crear secuencia de cortes alternando vertical/horizontal
  let vIdx = 0, hIdx = 0;
  let lastWasVertical = false;
  
  while (vIdx < sortedVertical.length || hIdx < sortedHorizontal.length) {
    if (vIdx < sortedVertical.length && (hIdx >= sortedHorizontal.length || !lastWasVertical)) {
      cuts.push({
        type: 'vertical',
        position: sortedVertical[vIdx],
        from: 0,
        to: boardHeight,
        length: boardHeight
      });
      vIdx++;
      lastWasVertical = true;
    } else if (hIdx < sortedHorizontal.length) {
      cuts.push({
        type: 'horizontal',
        position: sortedHorizontal[hIdx],
        from: 0,
        to: boardWidth,
        length: boardWidth
      });
      hIdx++;
      lastWasVertical = false;
    }
  }
  
  return cuts;
}

// ==================== FUNCIÓN PRINCIPAL DE OPTIMIZACIÓN ====================

/**
 * Optimiza el corte de planchas de melamina
 * 
 * @param {array} boards - Planchas disponibles [{width, height, name, id}]
 * @param {array} pieces - Piezas a cortar [{width, height, quantity, name, allowRotation}]
 * @param {object} options - Opciones de optimización
 * @param {number} options.cutThickness - Espesor de corte en mm (default: 5)
 * @param {string} options.sortStrategy - Estrategia de ordenamiento: 'area', 'perimeter', 'mixed', 'priority'
 * @param {boolean} options.mergeRects - Fusionar rectángulos libres (default: true)
 * @param {number} options.minScrapSize - Tamaño mínimo de retazo aprovechable (default: 50)
 * 
 * @returns {object} - Resultado de la optimización
 */
export function optimizeCutting(boards, pieces, options = {}) {
  // Validaciones
  if (!boards?.length || !pieces?.length) {
    return {
      results: [],
      placedPieces: [],
      unplacedPieces: [],
      totalUtilization: 0,
      totalWaste: 0,
      error: 'Faltan planchas o piezas'
    };
  }

  const {
    cutThickness = 5,
    sortStrategy = 'area',
    mergeRects = true,
    minScrapSize = 50
  } = options;

  // Expandir piezas por cantidad
  const expanded = expandPieces(pieces, cutThickness);
  
  // Ordenar piezas según estrategia
  const sorted = sortPieces(expanded, sortStrategy);

  const results = [];
  const allPlaced = [];
  const placedIds = new Set();

  // Procesar cada plancha
  for (let boardIdx = 0; boardIdx < boards.length; boardIdx++) {
    const board = boards[boardIdx];
    
    // Crear optimizador para esta plancha
    const optimizer = new GuillotineOptimizer(board.width, board.height, {
      cutThickness,
      minScrapSize
    });

    const boardPlacements = [];
    let piecesPlacedOnThisBoard = 0;

    // Intentar colocar cada pieza
    for (const piece of sorted) {
      // Saltar si ya fue colocada
      if (placedIds.has(piece.instanceId)) continue;

      // Intentar colocar
      const placement = optimizer.place(piece);

      if (placement) {
        boardPlacements.push(placement);
        placedIds.add(piece.instanceId);
        allPlaced.push(placement);
        piecesPlacedOnThisBoard++;
      }
    }

    // Fusionar rectángulos si está habilitado
    if (mergeRects) {
      optimizer.mergeFreeRects();
    }

    // Guardar resultado si se colocó al menos una pieza
    if (boardPlacements.length > 0) {
      const analysis = optimizer.analyzeWaste();
      
      results.push({
        boardIndex: boardIdx,
        board: { ...board },
        placements: boardPlacements,
        utilization: analysis.utilization,
        usedArea: analysis.usedArea,
        freeArea: analysis.freeArea,
        wasteArea: analysis.wasteArea,
        freeRects: optimizer.freeRects,
        waste: optimizer.waste,
        cutSequence: calculateCutSequence(
          boardPlacements,
          board.width,
          board.height
        ),
        analysis
      });
    }
  }

  // Piezas no colocadas
  const unplacedPieces = sorted.filter(p => !placedIds.has(p.instanceId));

  // Calcular métricas totales
  const totalBoardArea = boards.reduce((sum, b) => sum + b.width * b.height, 0);
  const totalUsedArea = results.reduce((sum, r) => sum + r.usedArea, 0);
  const totalFreeArea = results.reduce((sum, r) => sum + r.freeArea, 0);
  const totalWasteArea = results.reduce((sum, r) => sum + r.wasteArea, 0);
  
  const totalUtilization = totalBoardArea > 0 
    ? (totalUsedArea / totalBoardArea) * 100 
    : 0;

  // Calcular retazos aprovechables totales
  const usableScraps = results.reduce((sum, r) => 
    sum + r.freeRects.filter(rect => 
      rect.width >= 100 && rect.height >= 100
    ).length, 0
  );

  return {
    results,
    placedPieces: allPlaced,
    unplacedPieces,
    totalUtilization,
    totalUsedArea,
    totalFreeArea,
    totalWasteArea,
    usableScrapsCount: usableScraps,
    boardsUsed: results.length,
    boardsTotal: boards.length,
    options: { cutThickness, sortStrategy }
  };
}

/**
 * Versión simplificada para compatibilidad
 */
export function optimizeCuttingSimple(boards, pieces, cutThickness = 5) {
  return optimizeCutting(boards, pieces, { cutThickness });
}

// ==================== FUNCIONES DE ANÁLISIS ====================

/**
 * Compara diferentes estrategias de ordenamiento
 * @returns {array} - Resultados de cada estrategia
 */
export function compareStrategies(boards, pieces, cutThickness = 5) {
  const strategies = ['area', 'perimeter', 'mixed', 'priority'];
  const results = [];

  for (const strategy of strategies) {
    const result = optimizeCutting(boards, pieces, {
      cutThickness,
      sortStrategy: strategy
    });
    
    results.push({
      strategy,
      utilization: result.totalUtilization,
      placedCount: result.placedPieces.length,
      unplacedCount: result.unplacedPieces.length,
      wasteArea: result.totalWasteArea
    });
  }

  // Ordenar por utilización
  return results.sort((a, b) => b.utilization - a.utilization);
}

/**
 * Calcula el mejor tamaño de plancha para un conjunto de piezas
 */
export function suggestBoardSize(pieces, cutThickness = 5, availableSizes = []) {
  const defaultSizes = [
    { name: 'Estándar', width: 2440, height: 1220 },
    { name: 'Grande', width: 2800, height: 1400 },
    { name: 'Pequeña', width: 1800, height: 900 }
  ];

  const sizes = availableSizes.length > 0 ? availableSizes : defaultSizes;
  const results = [];

  for (const size of sizes) {
    const board = { ...size, id: 'temp' };
    const result = optimizeCutting([board], pieces, { cutThickness });
    
    results.push({
      ...size,
      utilization: result.totalUtilization,
      wasteArea: result.totalWasteArea,
      placedCount: result.placedPieces.length,
      totalPieces: pieces.reduce((sum, p) => sum + (p.quantity || 1), 0)
    });
  }

  return results.sort((a, b) => b.utilization - a.utilization);
}
