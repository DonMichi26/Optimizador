import { jsPDF } from 'jspdf';

export function exportToSVG(result, settings) {
  try {
    if (!result || !result.results || result.results.length === 0) {
      alert('No hay datos de corte para exportar');
      return;
    }

    let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" style="background: white;">\n`;

    // Title
    svgContent += `<text x="10" y="20" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#333">${settings.businessName || 'SmartCut'} - Mapa de Corte</text>\n`;
    svgContent += `<text x="10" y="35" font-family="Arial, sans-serif" font-size="12" fill="#666">${new Date().toLocaleDateString('es-PE')}</text>\n`;

    let yOffset = 50;
    const boardSpacing = 20;
    const scale = 0.3; // Scale factor for visualization

    result.results.forEach((boardResult, boardIndex) => {
      const board = boardResult.board;
      const placements = boardResult.placements;

      // Board title
      svgContent += `<text x="10" y="${yOffset}" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#333">Plancha ${boardIndex + 1}: ${board.width}×${board.height}mm (${boardResult.utilization.toFixed(1)}%)</text>\n`;
      yOffset += 20;

      // Board rectangle
      const boardWidth = board.width * scale;
      const boardHeight = board.height * scale;
      svgContent += `<rect x="10" y="${yOffset}" width="${boardWidth}" height="${boardHeight}" fill="none" stroke="#333" stroke-width="2"/>\n`;

      // Draw placements
      placements.forEach((placement) => {
        const x = 10 + (placement.x * scale);
        const y = yOffset + (placement.y * scale);
        const w = placement.finalWidth * scale;
        const h = placement.finalHeight * scale;

        // Piece rectangle
        const color = placement.rotated ? '#4CAF50' : '#2196F3';
        svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.7" stroke="#333" stroke-width="1"/>\n`;

        // Piece dimensions
        if (w > 30 && h > 15) { // Only show text if piece is large enough
          const textX = x + w/2;
          const textY = y + h/2;
          svgContent += `<text x="${textX}" y="${textY}" font-family="Arial, sans-serif" font-size="8" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">${placement.width}×${placement.height}</text>\n`;
        }

        // Rotation indicator
        if (placement.rotated) {
          svgContent += `<circle cx="${x + w - 5}" cy="${y + 5}" r="3" fill="#FF9800"/>\n`;
        }
      });

      // Draw free rectangles (scraps)
      if (boardResult.freeRects) {
        boardResult.freeRects.forEach(freeRect => {
          if (freeRect.width >= 100 && freeRect.height >= 100) { // Only show usable scraps
            const x = 10 + (freeRect.x * scale);
            const y = yOffset + (freeRect.y * scale);
            const w = freeRect.width * scale;
            const h = freeRect.height * scale;
            svgContent += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFC107" fill-opacity="0.5" stroke="#FF9800" stroke-width="1" stroke-dasharray="3,3"/>\n`;
          }
        });
      }

      yOffset += boardHeight + boardSpacing;

      // Add legend if this is the first board
      if (boardIndex === 0) {
        yOffset += 20;
        svgContent += `<text x="10" y="${yOffset}" font-family="Arial, sans-serif" font-size="10" fill="#333">Leyenda:</text>\n`;
        yOffset += 15;
        svgContent += `<rect x="10" y="${yOffset-8}" width="15" height="10" fill="#2196F3" fill-opacity="0.7" stroke="#333" stroke-width="1"/>\n`;
        svgContent += `<text x="30" y="${yOffset}" font-family="Arial, sans-serif" font-size="9" fill="#333">Pieza normal</text>\n`;
        yOffset += 15;
        svgContent += `<rect x="10" y="${yOffset-8}" width="15" height="10" fill="#4CAF50" fill-opacity="0.7" stroke="#333" stroke-width="1"/>\n`;
        svgContent += `<text x="30" y="${yOffset}" font-family="Arial, sans-serif" font-size="9" fill="#333">Pieza rotada</text>\n`;
        yOffset += 15;
        svgContent += `<rect x="10" y="${yOffset-8}" width="15" height="10" fill="#FFC107" fill-opacity="0.5" stroke="#FF9800" stroke-width="1" stroke-dasharray="3,3"/>\n`;
        svgContent += `<text x="30" y="${yOffset}" font-family="Arial, sans-serif" font-size="9" fill="#333">Retazo aprovechable</text>\n`;
        yOffset += 20;
      }
    });

    svgContent += '</svg>';

    // Create and download SVG file
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mapa-corte-${Date.now()}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('Error SVG:', error);
    alert('Error al generar SVG');
  }
}

export function exportToPDF(result, settings, boards, pieces) {
  try {
    if (!result || !settings || !boards || !pieces) {
      alert('Faltan datos para generar PDF');
      return;
    }

    const { placedPieces, totalUtilization, totalFreeArea, results } = result;

    const totalBoardArea = boards.reduce((sum, b) => sum + b.width * b.height, 0);
    const totalUsedArea = placedPieces.reduce((sum, p) => sum + p.width * p.height, 0);
    const totalCutMeters = placedPieces.reduce((sum, p) => sum + (p.width + p.height) / 1000, 0);
    const subtotal = totalCutMeters * settings.cuttingRate;
    const total = subtotal + settings.serviceFee;
    
    // Calcular retazos no aprovechables
    const unusableWaste = totalBoardArea - totalUsedArea - (totalFreeArea || 0);
    
    // Contar retazos aprovechables
    const usableScraps = results?.reduce((sum, r) => 
      sum + (r.freeRects?.filter(rect => rect.width >= 100 && rect.height >= 100).length || 0), 0
    ) || 0;

    const doc = new jsPDF();
    const w = doc.internal.pageSize.getWidth();
    let y = 15;

    // HEADER
    doc.setFillColor(40, 40, 40);
    doc.rect(0, 0, w, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(settings.businessName || 'SmartCut', 10, 12);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Presupuesto de Corte', 10, 20);

    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    doc.text(new Date().toLocaleDateString('es-PE'), w - 10, 12, { align: 'right' });

    // PLANCHAS
    y = 35;
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PLANCHAS', 10, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    boards.forEach((b, i) => {
      doc.text(`• ${b.name || `Plancha ${i+1}`}: ${b.width} x ${b.height} mm`, 15, y);
      y += 5;
    });

    // PIEZAS
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PIEZAS', 10, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    doc.setFillColor(240, 240, 240);
    doc.rect(10, y-4, w-20, 6, 'F');
    doc.text('ID', 12, y);
    doc.text('Nombre', 22, y);
    doc.text('Medida', 55, y);
    doc.text('Cant', 85, y);
    doc.text('Veta', 105, y);
    doc.text('Estado', 135, y);
    y += 5;

    pieces.forEach(p => {
      const ok = placedPieces.some(pl => pl.originalId === p.id);
      const grainText = p.allowRotation === false ? 'Fija' : 'Libre';
      doc.text(String(p.id), 12, y);
      doc.text((p.name || '-').substring(0, 15), 22, y);
      doc.text(`${p.width}x${p.height}`, 55, y);
      doc.text(String(p.quantity), 85, y);
      doc.text(grainText, 105, y);
      doc.text(ok ? 'OK' : 'Falta', 135, y);
      y += 5;
    });

    // APROVECHAMIENTO
    y += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('APROVECHAMIENTO', 10, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Area total: ${(totalBoardArea/1e6).toFixed(3)} m2`, 15, y); y += 5;
    doc.setTextColor(0, 150, 0);
    doc.text(`Area usada: ${(totalUsedArea/1e6).toFixed(3)} m2`, 15, y); y += 5;
    doc.setTextColor(0, 100, 150);
    doc.text(`Retazos utiles: ${(totalFreeArea/1e6).toFixed(3)} m2 (${usableScraps} piezas)`, 15, y); y += 5;
    doc.setTextColor(200, 0, 0);
    doc.text(`Desperdicio: ${(unusableWaste/1e6).toFixed(3)} m2`, 15, y); y += 5;
    doc.setTextColor(40, 40, 40);
    doc.setFont('helvetica', 'bold');
    doc.text(`Utilizacion: ${totalUtilization.toFixed(1)}%`, 15, y);

    // DETALLE POR PLANCHA
    if (results && results.length > 0) {
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE POR PLANCHA', 10, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      results.forEach((r, i) => {
        const utilColor = r.utilization > 80 ? [0, 150, 0] : r.utilization > 60 ? [200, 150, 0] : [200, 0, 0];
        doc.setTextColor(...utilColor);
        doc.text(`${i+1}. ${r.board.name || `Plancha ${i+1}`} (${r.board.width}x${r.board.height}mm) - ${r.placements.length} piezas - ${r.utilization.toFixed(1)}%`, 15, y);
        y += 5;
      });
      doc.setTextColor(40, 40, 40);
    }

    // COORDENADAS DE CORTE
    if (results && results.length > 0) {
      y += 5;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('COORDENADAS DE CORTE', 10, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      results.forEach((r, boardIndex) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`Plancha ${boardIndex + 1} (${r.board.width}x${r.board.height}mm):`, 15, y);
        y += 5;
        doc.setFont('helvetica', 'normal');
        
        if (r.cutCoordinates && r.cutCoordinates.length > 0) {
          r.cutCoordinates.forEach(coord => {
            doc.text(coord.description, 20, y);
            y += 4;
            if (y > doc.internal.pageSize.getHeight() - 20) {
              doc.addPage();
              y = 15;
            }
          });
        } else {
          doc.text('No hay coordenadas disponibles', 20, y);
          y += 5;
        }
        y += 3;
      });
      doc.setTextColor(40, 40, 40);
    }
    doc.setFillColor(240, 240, 240);
    doc.rect(10, y-4, w-20, 35, 'F');
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('COSTO', 15, y + 3);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Metros de corte: ${totalCutMeters.toFixed(2)} m`, 15, y); y += 5;
    doc.text(`Tarifa: ${settings.currency} ${settings.cuttingRate}/m`, 15, y); y += 5;
    doc.text(`Subtotal: ${settings.currency} ${subtotal.toFixed(2)}`, 15, y); y += 5;
    doc.text(`Servicio: ${settings.currency} ${settings.serviceFee.toFixed(2)}`, 15, y); y += 8;

    doc.setFontSize(14);
    doc.text(`TOTAL: ${settings.currency} ${total.toFixed(2)}`, 15, y);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Generado por SmartCut - Optimizador de Corte', w/2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    const filename = `presupuesto-${Date.now()}.pdf`;
    doc.save(filename);

  } catch (error) {
    console.error('Error PDF:', error);
    alert('Error al generar PDF');
  }
}
