import { useState } from 'react';
import { useApp } from '../../context/AppContext';

const PRESETS = [
  { w: 2440, h: 1220, name: 'Estándar' },
  { w: 2800, h: 2070, name: 'Grande' },
  { w: 2200, h: 1000, name: 'Mediana' },
  { w: 1800, h: 900, name: 'Pequeña' }
];

export function BoardForm() {
  const { boards, scraps, addBoard, removeBoard, removeScrap } = useApp();
  const [useCm, setUseCm] = useState(false);
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [boardType, setBoardType] = useState('new');

  const unit = useCm ? 10 : 1;
  const label = useCm ? 'cm' : 'mm';

  const add = () => {
    if (w > 0 && h > 0) {
      const prefix = boardType === 'scrap' ? 'R' : 'P';
      addBoard({ 
        width: w * unit, 
        height: h * unit, 
        name: `${prefix}${boards.length + scraps.length + 1}`,
        type: boardType
      });
      setW(''); setH('');
    }
  };

  const addPreset = (p, type = 'new') => {
    const prefix = type === 'scrap' ? 'R' : 'P';
    addBoard({ 
      width: p.w, 
      height: p.h, 
      name: `${prefix}${boards.length + scraps.length + 1}`,
      type
    });
  };

  const activeBoards = boards.filter(b => b.type !== 'scrap');

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium flex justify-between items-center">
        <span>1. PLANCHAS</span>
        <button onClick={() => setUseCm(!useCm)} className="text-xs bg-gray-700 px-2 py-0.5 rounded">
          {label}
        </button>
      </div>
      
      <div className="p-3 space-y-2">
        <div className="flex gap-1 mb-2">
          <button
            onClick={() => setBoardType('new')}
            className={`flex-1 px-2 py-1 text-xs rounded ${boardType === 'new' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Nueva
          </button>
          <button
            onClick={() => setBoardType('scrap')}
            className={`flex-1 px-2 py-1 text-xs rounded ${boardType === 'scrap' ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600'}`}
          >
            Retazo
          </button>
        </div>

        <div className="flex gap-2">
          <input
            type="number"
            value={w}
            onChange={(e) => setW(parseFloat(e.target.value) || '')}
            placeholder="Ancho"
            className="flex-1 px-2 py-2 text-sm border rounded focus:outline-none focus:border-gray-500"
          />
          <input
            type="number"
            value={h}
            onChange={(e) => setH(parseFloat(e.target.value) || '')}
            placeholder="Alto"
            className="flex-1 px-2 py-2 text-sm border rounded focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={add}
            disabled={!w || !h}
            className="px-3 py-2 bg-gray-900 text-white text-sm rounded disabled:opacity-50"
          >
            +
          </button>
        </div>

        <div className="flex gap-1 flex-wrap">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => addPreset(p, boardType)} className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded">
              {p.w}×{p.h}
            </button>
          ))}
        </div>

        {activeBoards.length > 0 && (
          <div className="mt-2 pt-2 border-t space-y-1">
            <div className="text-xs text-gray-500 mb-1">Planchas nuevas ({activeBoards.length})</div>
            {activeBoards.map((b) => (
              <div key={b.id} className="flex justify-between items-center p-2 bg-blue-50 rounded text-sm">
                <span className="font-medium">{b.name}: {b.width}×{b.height}mm</span>
                <button onClick={() => removeBoard(b.id)} className="text-red-500 hover:text-red-700">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
