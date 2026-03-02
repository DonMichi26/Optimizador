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
    this.trimSize = options.trimSize || 10; // Changed to 10mm as suggested
    this.minScrapSize = options.minScrapSize || 300;

    const usableWidth = Math.max(width - (this.trimSize * 2), 0);
    const usableHeight = Math.max(height - (this.trimSize * 2), 0);

    this.freeRects = usableWidth > 0 && usableHeight > 0 ? [{
      x: this.trimSize,
      y: this.trimSize,
      width: usableWidth,
      height: usableHeight
    }] : [];

    this.placements = [];
    this.cutLines = []; // Store cut coordinates for technical PDF
  }

  findBestRect(w, h, allowRotation = true) {
    let bestRect = null;
    let bestScore = Infinity; // Lower score is better for Best-Fit Area
    let rotated = false;

    for (let i = 0; i < this.freeRects.length; i++) {
      const rect = this.freeRects[i];

      const evaluate = (rw, rh, rot) => {
        if (rect.width >= rw && rect.height >= rh) {
          const remainingW = rect.width - rw;
          const remainingH = rect.height - rh;
          const wasteArea = remainingW * remainingH;

          // Best-Fit Area: minimize waste area after placement
          // Lower score (waste area) is better
          if (wasteArea < bestScore) {
            bestScore = wasteArea;
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
      finalWidth: finalW,
      finalHeight: finalH,
      rotated,
      touchesRightEdge: false,
      touchesBottomEdge: false
    };

    this.placements.push(placement);

    // Record the cut lines for technical documentation
    this.recordCutLines(rect, finalW, finalH);

    this.splitRect(rect, finalW, finalH);

    return placement;
  }

  recordCutLines(rect, w, h) {
    // Record vertical cut line (if piece doesn't touch right edge)
    if (rect.x + w < this.width - this.trimSize) {
      this.cutLines.push({
        type: 'vertical',
        position: rect.x + w,
        startY: rect.y,
        endY: rect.y + rect.height,
        length: rect.height,
        cutNumber: this.cutLines.length + 1
      });
    }

    // Record horizontal cut line (if piece doesn't touch bottom edge)
    if (rect.y + h < this.height - this.trimSize) {
      this.cutLines.push({
        type: 'horizontal',
        position: rect.y + h,
        startX: rect.x,
        endX: rect.x + rect.width,
        length: rect.width,
        cutNumber: this.cutLines.length + 1
      });
    }
  }

  getCutCoordinates() {
    return this.cutLines.map((cut, index) => ({
      number: index + 1,
      type: cut.type,
      position: cut.position,
      length: cut.length,
      description: cut.type === 'vertical'
        ? `Corte vertical a ${cut.position}mm desde el borde izquierdo`
        : `Corte horizontal a ${cut.position}mm desde el borde inferior`
    }));
  }

  splitRect(rect, w, h) {
    const remainingW = rect.width - w;
    const remainingH = rect.height - h;

    // Clear the used rectangle
    this.freeRects.splice(rect.index, 1);

    const minUsefulSize = 50; // Minimum size for useful rectangles

    // Create new free rectangles, accounting for kerf where appropriate
    if (remainingW >= minUsefulSize && remainingH >= minUsefulSize) {
      // Both dimensions have useful remaining space
      // Decide split orientation based on which dimension leaves larger useful area
      if (remainingW >= remainingH) {
// Split vertically (right rectangle first)

    this.freeRects.push({

      x: rect.x + w + (addKerfRight ? this.cutThickness : 0), // Add kerf after piece if not at edge

      y: rect.y,

      width: remainingW - (addKerfRight ? this.cutThickness : 0), // Account for kerf

      height: rect.height

    });

    this.freeRects.push({

      x: rect.x,

      y: rect.y + h + (addKerfBottom ? this.cutThickness : 0), // Add kerf after piece if not at edge

      width: rect.width,

      height: remainingH - (addKerfBottom ? this.cutThickness : 0) // Account for kerf

    });

    this.freeRects.push({

      x: rect.x + w + (addKerfRight ? this.cutThickness : 0), // Add kerf after piece if not at edge

      y: rect.y,

      width: remainingW - (addKerfRight ? this.cutThickness : 0), // Account for kerf

      height: h

    });
        this.freeRects.push({
          x: rect.x,
          y: rect.y + h + this.cutThickness, // Add kerf after piece
          width: w,
          height: remainingH - this.cutThickness // Account for kerf
        });
      } else {
        // Split horizontally (bottom rectangle first)
        this.freeRects.push({
          x: rect.x,
          y: rect.y + h + this.cutThickness, // Add kerf after piece
          width: rect.width,
          height: remainingH - this.cutThickness // Account for kerf
        });
        this.freeRects.push({
          x: rect.x + w + this.cutThickness, // Add kerf after piece
          y: rect.y,
          width: remainingW - this.cutThickness, // Account for kerf
          height: h
        });
      }
} else if (remainingW >= minUsefulSize) {

    // Only width has useful remaining space

    this.freeRects.push({

      x: rect.x + w + (addKerfRight ? this.cutThickness : 0), // Add kerf after piece if not at edge

      y: rect.y,

      width: remainingW - (addKerfRight ? this.cutThickness : 0), // Account for kerf

      height: rect.height

    });
} else if (remainingH >= minUsefulSize) {

    // Only height has useful remaining space

    this.freeRects.push({

      x: rect.x,

      y: rect.y + h + (addKerfBottom ? this.cutThickness : 0), // Add kerf after piece if not at edge

      width: rect.width,

      height: remainingH - (addKerfBottom ? this.cutThickness : 0) // Account for kerf

    });
    }
    // If neither dimension is useful, the rectangle is completely used (waste)
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
    const usedArea = this.placements.reduce((sum, p) => sum + (p.finalWidth * p.finalHeight), 0);
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

function expandPieces(pieces, cutThickness, edgeBandThickness = 0) {
  const expanded = [];
  let id = 0;

  pieces.forEach((p) => {
    const count = p.quantity || 1;
    for (let i = 0; i < count; i++) {
      // Apply edge banding deduction if enabled
      const adjustedWidth = Math.max(10, p.width - (edgeBandThickness * 2)); // Deduct from both sides, minimum 10mm
      const adjustedHeight = Math.max(10, p.height - (edgeBandThickness * 2)); // Deduct from both sides, minimum 10mm

      expanded.push({
        ...p,
        instanceId: `${p.id}-${i}`,
        instanceIndex: i,
        fullWidth: adjustedWidth + cutThickness,
        fullHeight: adjustedHeight + cutThickness,
        adjustedWidth,
        adjustedHeight,
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
  try {
    // Validations
    if (!inventory || inventory.length === 0) {
      return {
        success: false,
        results: [],
        placedPieces: [],
        unplacedPieces: pieces || [],
        generatedScraps: [],
        error: 'No hay planchas disponibles'
      };
    }

    if (!pieces || pieces.length === 0) {
      return {
        success: true,
        results: [],
        placedPieces: [],
        unplacedPieces: [],
        generatedScraps: [],
        metrics: {
          boardsUsed: 0,
          newBoardsUsed: 0,
          scrapBoardsUsed: 0,
          totalBoardsAvailable: inventory.length,
          totalPiecesRequested: 0,
          piecesPlaced: 0,
          piecesUnplaced: 0,
          totalBoardArea: 0,
          totalUsedArea: 0,
          totalTrimArea: 0,
          totalScrapArea: 0,
          totalWasteArea: 0,
          totalUsableArea: 0,
          utilization: 0,
          usableUtilization: 0,
          scrapGenerated: 0
        },
        summary: {
          usedBoards: 0,
          newBoards: 0,
          reusedScraps: 0,
          newScrapsGenerated: 0,
          efficiency: 0,
          wastePercentage: 0
        }
      };
    }

    const {
      cutThickness = 5,
      trimSize = 15,
      minScrapSize = 300,
      enableScrapGeneration = true,
      guillotineStrategy = 'best-long-side',
      edgeBandThickness = 0
    } = options;

    const expandedPieces = expandPieces(pieces, cutThickness, edgeBandThickness);
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

      for (let pieceIndex = 0; pieceIndex < remainingPieces.length; pieceIndex++) {
        const piece = remainingPieces[pieceIndex];
        if (!piece.placed) {
          try {
            const placement = optimizer.place(piece);
            if (placement) {
              piece.placed = true;
            }
          } catch (error) {
            console.error('Error placing piece:', piece, error);
            // Continue with next piece
          }
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
          trimOffset: trimSize,
          cutCoordinates: optimizer.getCutCoordinates()
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

        scrapGenerated: generatedScraps.length
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
  } catch (error) {
    console.error('Error fatal en smartCutOptimize:', error);
    return {
      success: false,
      results: [],
      placedPieces: [],
      unplacedPieces: pieces || [],
      generatedScraps: [],
      error: error.message || 'Error desconocido en la optimización'
    };
  }
}
