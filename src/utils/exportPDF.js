import { jsPDF } from 'jspdf';

export function exportToPDF(result, settings, boards, pieces) {
  try {
    if (!result || !settings || !boards || !pieces) {
      alert('Faltan datos para generar PDF');
      return;
    }

    const { placedPieces, totalUtilization, totalFreeArea, totalWasteArea, results } = result;

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
    doc.text('Nombre', 12, y);
    doc.text('Medida', 55, y);
    doc.text('Cant', 85, y);
    doc.text('Veta', 105, y);
    doc.text('Estado', 135, y);
    y += 5;

    pieces.forEach(p => {
      const ok = placedPieces.some(pl => pl.originalId === p.id);
      const grainText = p.allowRotation === false ? 'Fija' : 'Libre';
      doc.text((p.name || '-').substring(0, 18), 12, y);
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

    // COSTO
    y += 10;
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
