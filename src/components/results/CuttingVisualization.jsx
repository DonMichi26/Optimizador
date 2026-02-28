import { useRef, useEffect, useState } from 'react';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'];

export function CuttingVisualization({ board, placements, cutThickness = 5 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!board || !placements?.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = canvas.parentElement;
    const maxW = (container?.offsetWidth || 400) - 20;

    const scale = Math.min(maxW / board.width, maxW / board.height, 1);
    const dw = board.width * scale;
    const dh = board.height * scale;

    canvas.width = dw;
    canvas.height = dh;

    ctx.fillStyle = '#F3F4F6';
    ctx.fillRect(0, 0, dw, dh);

    // Grid de referencia (cada 100mm)
    const grid = 100 * scale;
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= dw; x += grid) { 
      ctx.beginPath(); 
      ctx.moveTo(x, 0); 
      ctx.lineTo(x, dh); 
      ctx.stroke(); 
    }
    for (let y = 0; y <= dh; y += grid) { 
      ctx.beginPath(); 
      ctx.moveTo(0, y); 
      ctx.lineTo(dw, y); 
      ctx.stroke(); 
    }

    // Borde de la plancha
    ctx.fillStyle = '#fff';
    ctx.fillRect(1, 1, dw-2, dh-2);
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, dw-2, dh-2);

    // Dibujar piezas
    placements.forEach((p, i) => {
      const x = p.x * scale;
      const y = p.y * scale;
      const w = p.placedWidth ? p.placedWidth * scale : p.width * scale;
      const h = p.placedHeight ? p.placedHeight * scale : p.height * scale;
      const c = COLORS[i % COLORS.length];
      const isRotated = p.rotated || false;
      const hasFixedGrain = p.allowRotation === false;

      // Relleno semitransparente
      ctx.fillStyle = c + '25';
      ctx.fillRect(x, y, w, h);
      
      // Borde de la pieza
      ctx.strokeStyle = c;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);

      // Indicador de veta fija (líneas paralelas)
      if (hasFixedGrain) {
        ctx.strokeStyle = c + '60';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        
        // Líneas verticales indicando dirección de veta
        const lineSpacing = Math.max(8, Math.min(w / 5, 15));
        for (let lx = x + w/4; lx < x + w; lx += lineSpacing) {
          ctx.beginPath();
          ctx.moveTo(lx, y + 5);
          ctx.lineTo(lx, y + h - 5);
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }

      // Indicador de rotación (esquina)
      if (isRotated) {
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(x + w - 8, y + 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Texto con dimensiones
      const fontSize = Math.max(9, Math.min(13, w / 4, h / 3));
      if (w > 35 && h > 20) {
        ctx.fillStyle = '#1F2937';
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Nombre o dimensiones
        const text = p.name && w > 50 ? p.name.substring(0, 12) : `${p.width}×${p.height}`;
        ctx.fillText(text, x + w/2, y + h/2 - 5);
        
        // Cantidad si hay espacio
        if (h > 35) {
          ctx.font = `${fontSize - 2}px sans-serif`;
          ctx.fillStyle = '#6B7280';
          ctx.fillText(`(${p.width}×${p.height})`, x + w/2, y + h/2 + 8);
        }
      }
    });

    // Calcular líneas de corte guillotina (edge-to-edge)
    const verticalCuts = new Set();
    const horizontalCuts = new Set();

    placements.forEach(p => {
      verticalCuts.add(p.x);
      verticalCuts.add(p.x + (p.placedWidth || p.width));
      horizontalCuts.add(p.y);
      horizontalCuts.add(p.y + (p.placedHeight || p.height));
    });

    // Dibujar cortes verticales (de arriba a abajo)
    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = Math.max(2, cutThickness * scale * 0.7);
    ctx.setLineDash([6, 4]);

    verticalCuts.forEach(x => {
      if (x > 0 && x < board.width) {
        ctx.beginPath();
        ctx.moveTo(x * scale, 0);
        ctx.lineTo(x * scale, dh);
        ctx.stroke();
      }
    });

    // Dibujar cortes horizontales (de izquierda a derecha)
    horizontalCuts.forEach(y => {
      if (y > 0 && y < board.height) {
        ctx.beginPath();
        ctx.moveTo(0, y * scale);
        ctx.lineTo(dw, y * scale);
        ctx.stroke();
      }
    });

    ctx.setLineDash([]);

    // Marcas de coordenadas
    ctx.fillStyle = '#6B7280';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('0', 4, 10);
    ctx.textAlign = 'right';
    ctx.fillText(`${board.width}`, dw - 4, 10);
    ctx.fillText(`${board.height}`, dw - 4, dh - 2);

  }, [board, placements, cutThickness]);

  if (!board) {
    return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin datos</div>;
  }

  return (
    <div className="space-y-2">
      <canvas ref={canvasRef} className="w-full rounded border border-gray-300" style={{height: 'auto'}} />
      <div className="flex justify-center gap-2 flex-wrap text-xs">
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">{board.width}×{board.height}mm</span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">{placements?.length || 0} piezas</span>
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Rotada
        </span>
        <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded flex items-center gap-1">
          <span className="w-2 h-2 border border-amber-600 inline-block"></span> Veta fija
        </span>
      </div>
    </div>
  );
}

export function ResultsVisualization({ results }) {
  const [active, setActive] = useState(0);

  if (!results?.length) {
    return <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Sin resultados</div>;
  }

  return (
    <div className="space-y-2">
      {results.length > 1 && (
        <div className="flex gap-1 flex-wrap justify-center">
          {results.map((r, i) => (
            <button key={i} onClick={() => setActive(i)}
              className={`px-3 py-1 text-xs rounded ${active === i ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600'}`}>
              Plancha {i+1} ({r.placements.length})
            </button>
          ))}
        </div>
      )}
      <CuttingVisualization board={results[active]?.board} placements={results[active]?.placements} />
    </div>
  );
}
