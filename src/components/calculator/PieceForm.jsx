import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export function PieceForm() {
  const { pieces, addPiece, removePiece, clearPieces } = useApp();
  const [useCm, setUseCm] = useState(false);
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [qty, setQty] = useState(1);
  const [name, setName] = useState('');
  const [allowRotation, setAllowRotation] = useState(true);

  const unit = useCm ? 10 : 1;
  const label = useCm ? 'cm' : 'mm';

  const add = () => {
    if (w > 0 && h > 0) {
      addPiece({ 
        width: w * unit, 
        height: h * unit, 
        quantity: qty, 
        name: name || `Pieza ${pieces.length + 1}`,
        allowRotation
      });
      setW(''); setH(''); setQty(1); setName(''); setAllowRotation(true);
    }
  };

  const total = pieces.reduce((s, p) => s + p.quantity, 0);
  const area = pieces.reduce((s, p) => s + p.width * p.height * p.quantity, 0) / 1e6;

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium flex justify-between items-center">
        <span>2. PIEZAS</span>
        <button onClick={() => setUseCm(!useCm)} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
          {label}
        </button>
      </div>

      <div className="p-3 space-y-2">
        <div className="flex gap-2">
          <input 
            type="number" 
            value={w} 
            onChange={(e) => setW(parseFloat(e.target.value) || '')} 
            placeholder="Ancho" 
            className="flex-1 px-2 py-2 text-sm border rounded" 
          />
          <input 
            type="number" 
            value={h} 
            onChange={(e) => setH(parseFloat(e.target.value) || '')} 
            placeholder="Largo" 
            className="flex-1 px-2 py-2 text-sm border rounded" 
          />
        </div>
        <div className="flex gap-2">
          <input 
            type="number" 
            value={qty} 
            onChange={(e) => setQty(parseInt(e.target.value) || 1)} 
            min="1" 
            className="w-20 px-2 py-2 text-sm border rounded" 
          />
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Nombre" 
            className="flex-1 px-2 py-2 text-sm border rounded" 
          />
          <button 
            onClick={add} 
            disabled={!w || !h} 
            className="px-4 py-2 bg-emerald-600 text-white text-sm rounded disabled:opacity-50"
          >
            +
          </button>
        </div>

        {/* Opción de veta/rotación */}
        <div className="flex items-center gap-2 p-2 bg-amber-50 rounded border border-amber-200">
          <input
            type="checkbox"
            id="allowRotation"
            checked={allowRotation}
            onChange={(e) => setAllowRotation(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
          />
          <label htmlFor="allowRotation" className="text-sm text-amber-800 cursor-pointer select-none">
            🔄 Permitir rotación (sin veta definida)
          </label>
          <span className="text-xs text-amber-600 ml-auto">
            {allowRotation ? 'Se puede rotar' : 'Veta fija ↕️'}
          </span>
        </div>

        {pieces.length > 0 && (
          <div className="pt-2 border-t space-y-1">
            {pieces.map((p) => (
              <div key={p.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{p.name}</span>
                  <span className="text-gray-500">×{p.quantity}</span>
                  <span className="text-gray-400">({p.width}×{p.height})</span>
                  {!p.allowRotation && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-1 rounded" title="Veta fija - no rotar">
                      ↕️
                    </span>
                  )}
                </div>
                <button onClick={() => removePiece(p.id)} className="text-red-500 hover:text-red-700">✕</button>
              </div>
            ))}
            <div className="flex justify-between text-xs text-gray-500 pt-2">
              <span>{total} piezas</span>
              <span>{area.toFixed(3)} m²</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
