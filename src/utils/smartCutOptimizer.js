/**
 * SmartCut Optimizer - Motor de Optimización de Corte
 * Algoritmo Guillotina optimizado para corte de madera
 */

import { v4 as uuidv4 } from 'uuid';

export const BOARD_TYPES = {
  NEW: 'new',
  SCRAP: 'scrap'
};

export const ALGORITHM = {
  GUILLOWINDOW: 'guillotine'
};

class GuillotineOptimizer {
  constructor(width, height, options = {}) {
    this.width = width;
    this.height = height;
    this.cutThickness = options.cutThickness || 5;
    this.trimSize = options.trimSize || 0;
    this.minScrapSize = options.minScrapSize || 300;
    this.strategy = options.strategy || 'best-long-side';
    
    const usableWidth = Math.max(width - (this.trimSize * 2), 0);
    const usableHeight = Math.max(height - (this.trimSize * 2), 0);
    
    this.freeRects = usableWidth > 0 && usableHeight > 0 ? [{
      x: this.trimSize,
      y: this.trimSize,
      width: usableWidth,
      height: usableHeight
    }] : [];
    
    this.placements = [];
  }

  findBestRect(w, h, allowRotation = true) {
    let bestRect = null;
    let bestScore = -Infinity;
    let rotated = false;

    for (let i = 0; i < this.freeRects.length; i++) {
      const rect = this.freeRects[i];
      
      const evaluate = (rw, rh, rot) => {
        if (rect.width >= rw && rect.height >= rh) {
          const remainingW = rect.width - rw;
          const remainingH = rect.height - rh;
          const wasteArea = remainingW * remainingH;
          
          let score;
          switch (this.strategy) {
            case 'best-long-side':
              score = -Math.max(remainingW, remainingH) * 1000 - wasteArea;
              break;
            case 'best-short-side':
              score = -Math.min(remainingW, remainingH) * 1000 - wasteArea;
              break;
            case 'best-area':
              score = -wasteArea;
              break;
            default:
              score = -Math.max(remainingW, remainingH) * 1000;
          }
          
          if (score > bestScore) {
            bestScore = score;
            bestRect = { ...rect, index: i };
            rotated = rot;
          }
        }
      };

      evaluate(w, h, false);
      if (allowRotation) evaluate(h, w, true);
    }

    return { rect: bestRect, rotated };
  }

  place(piece) {
    const { rect, rotated } = this.findBestRect(
      piece.fullWidth, 
      piece.fullHeight, 
      piece.allowRotation !== false
    );

    if (!rect) return null;

    const finalW = rotated ? piece.fullHeight : piece.fullWidth;
    const finalH = rotated ? piece.fullWidth : piece.fullHeight;
    const pieceW = rotated ? piece.height : piece.width;
    const pieceH = rotated ? piece.width : piece.height;

    const placement = {
      ...piece,
      x: rect.x,
      y: rect.y,
      placedWidth: pieceW,
      placedHeight: pieceH,
      totalWidth: finalW,
      totalHeight: finalH,
      rotated
    };

    this.placements.push(placement);
    this.splitRect(rect, finalW, finalH);

    return placement;
  }

  splitRect(rect, w, h) {
    const remainingW = rect.width - w;
    const remainingH = rect.height - h;
    
    const minSize = 50;
    
    if (remainingW >= minSize && remainingH >= minSize) {
      if (remainingW >= remainingH) {
        this.freeRects.push({ x: rect.x + w, y: rect.y, width: remainingW, height: rect.height });
        this.freeRects.push({ x: rect.x, y: rect.y + h, width: w, height: remainingH });
      } else {
        this.freeRects.push({ x: rect.x, y: rect.y + h, width: rect.width, height: remainingH });
        this.freeRects.push({ x: rect.x + w, y: rect.y, width: remainingW, height: h });
      }
    } else if (remainingW >= minSize) {
      this.freeRects.push({ x: rect.x + w, y: rect.y, width: remainingW, height: rect.height });
    } else if (remainingH >= minSize) {
      this.freeRects.push({ x: rect.x, y: rect.y + h, width: rect.width, height: remainingH });
    }
    
    this.freeRects.splice(rect.index, 1);
  }

  mergeFreeRects() {
    let merged = true;
    while (merged && this.freeRects.length > 1) {
      merged = false;
      for (let i = 0; i < this.freeRects.length && !merged; i++) {
        for (let j = i + 1; j < this.freeRects.length && !merged; j++) {
          const a = this.freeRects[i];
          const b = this.freeRects[j];
          
          if (Math.abs(a.x - b.x) < 1 && Math.abs(a.width - b.width) < 1 && 
              Math.abs(a.y + a.height - b.y) < 1) {
            a.height += b.height;
            this.freeRects.splice(j, 1);
            merged = true;
          } else if (Math.abs(a.y - b.y) < 1 && Math.abs(a.height - b.height) < 1 && 
                     Math.abs(a.x + a.width - b.x) < 1) {
            a.width += b.width;
            this.freeRects.splice(j, 1);
            merged = true;
          }
        }
      }
    }
  }

  getScraps(minSize) {
    return this.freeRects
      .filter(r => r.width >= minSize && r.height >= minSize)
      .map(r => ({
        id: uuidv4(),
        width: Math.floor(r.width),
        height: Math.floor(r.height),
        area: r.width * r.height,
        createdAt: new Date().toISOString()
      }));
  }

  getStats() {
    const boardArea = this.width * this.height;
    const usableArea = Math.max(0, (this.width - this.trimSize * 2) * (this.height - this.trimSize * 2));
    const usedArea = this.placements.reduce((sum, p) => sum + (p.totalWidth * p.totalHeight), 0);
    const freeArea = this.freeRects.reduce((sum, r) => sum + (r.width * r.height), 0);
    const trimArea = Math.max(0, boardArea - usableArea);
    const wasteArea = Math.max(0, boardArea - usedArea - freeArea - trimArea);

    return {
      boardArea,
      usableArea,
      usedArea,
      freeArea,
      trimArea,
      wasteArea,
      utilization: (usedArea / boardArea) * 100,
      usableUtilization: usableArea > 0 ? (usedArea / usableArea) * 100 : 0,
      placementsCount: this.placements.length
    };
  }
}

function expandPieces(pieces, cutThickness) {
  const expanded = [];
  let id = 0;
  
  pieces.forEach((p) => {
    const count = p.quantity || 1;
    for (let i = 0; i < count; i++) {
      expanded.push({
        ...p,
        instanceId: `${p.id}-${i}`,
        instanceIndex: i,
        fullWidth: p.width + cutThickness,
        fullHeight: p.height + cutThickness,
        placed: false
      });
      id++;
    }
  });
  
  return expanded;
}

function sortPieces(pieces) {
  return pieces.sort((a, b) => {
    const areaA = a.fullWidth * a.fullHeight;
    const areaB = b.fullWidth * b.fullHeight;
    const maxSideA = Math.max(a.fullWidth, a.fullHeight);
    const maxSideB = Math.max(b.fullWidth, b.fullHeight);
    return (areaB - areaA) * 0.7 + (maxSideB - maxSideA) * 0.3;
  });
}

function selectBoards(inventory) {
  const scraps = inventory.filter(b => b.type === BOARD_TYPES.SCRAP);
  const newBoards = inventory.filter(b => b.type !== BOARD_TYPES.SCRAP);
  
  return [...scraps, ...newBoards].sort((a, b) => 
    (a.width * a.height) - (b.width * b.height)
  );
}

export function smartCutOptimize(inventory, pieces, options = {}) {
  const {
    cutThickness = 5,
    trimSize = 15,
    minScrapSize = 300,
    enableScrapGeneration = true,
    guillotineStrategy = 'best-long-side'
  } = options;

  const expandedPieces = expandPieces(pieces, cutThickness);
  let remainingPieces = sortPieces([...expandedPieces]);
  const results = [];
  const generatedScraps = [];
  let boardsUsed = 0;
  let newBoardsUsed = 0;
  let scrapBoardsUsed = 0;

  const sortedBoards = selectBoards(inventory);

  for (let i = 0; i < sortedBoards.length && remainingPieces.length > 0; i++) {
    const board = sortedBoards[i];
    const optimizer = new GuillotineOptimizer(board.width, board.height, {
      cutThickness,
      trimSize,
      minScrapSize,
      strategy: guillotineStrategy
    });

    for (const piece of remainingPieces) {
      if (!piece.placed) {
        optimizer.place(piece);
      }
    }

    if (optimizer.placements.length > 0) {
      optimizer.mergeFreeRects();
      
      const scraps = enableScrapGeneration ? optimizer.getScraps(minScrapSize) : [];
      const stats = optimizer.getStats();
      
      if (board.type === BOARD_TYPES.SCRAP) {
        scrapBoardsUsed++;
      } else {
        newBoardsUsed++;
      }

      results.push({
        boardIndex: i,
        board: { ...board, type: board.type || BOARD_TYPES.NEW },
        placements: optimizer.placements,
        stats,
        scraps,
        trimOffset: trimSize
      });
      
      boardsUsed++;

      remainingPieces = remainingPieces.filter(p => !p.placed);

      if (scraps.length > 0) {
        generatedScraps.push(...scraps.map(s => ({
          ...s,
          sourceBoard: board.name || `Plancha ${i + 1}`
        })));
      }
    }
  }

  const totalBoardArea = results.reduce((sum, r) => sum + r.stats.boardArea, 0);
  const totalUsedArea = results.reduce((sum, r) => sum + r.stats.usedArea, 0);
  const totalTrimArea = results.reduce((sum, r) => sum + r.stats.trimArea, 0);
  const totalScrapArea = results.reduce((sum, r) => sum + r.stats.freeArea, 0);
  const totalWasteArea = results.reduce((sum, r) => sum + r.stats.wasteArea, 0);
  const totalUsableArea = results.reduce((sum, r) => sum + r.stats.usableArea, 0);

  const allPlacedPieces = results.flatMap(r => r.placements);
  const totalPiecesRequested = expandedPieces.length;

  return {
    success: remainingPieces.length === 0,
    results,
    placedPieces: allPlacedPieces,
    unplacedPieces: remainingPieces,
    generatedScraps,
    
    metrics: {
      boardsUsed,
      newBoardsUsed,
      scrapBoardsUsed,
      totalBoardsAvailable: inventory.length,
      totalPiecesRequested,
      piecesPlaced: allPlacedPieces.length,
      piecesUnplaced: remainingPieces.length,
      
      totalBoardArea,
      totalUsedArea,
      totalTrimArea,
      totalScrapArea,
      totalWasteArea,
      totalUsableArea,
      
      utilization: totalBoardArea > 0 ? (totalUsedArea / totalBoardArea) * 100 : 0,
      usableUtilization: totalUsableArea > 0 ? (totalUsedArea / totalUsableArea) * 100 : 0,
      
      scrapGenerated: generatedScraps.length,
      totalScrapArea
    },
    
    summary: {
      usedBoards: boardsUsed,
      newBoards: newBoardsUsed,
      reusedScraps: scrapBoardsUsed,
      newScrapsGenerated: generatedScraps.length,
      efficiency: totalUsableArea > 0 ? ((totalUsedArea / totalUsableArea) * 100).toFixed(1) : 0,
      wastePercentage: totalUsableArea > 0 ? ((totalWasteArea / totalUsableArea) * 100).toFixed(1) : 0
    }
  };
}
