import { useApp } from '../../context/AppContext';
import { Card, Button, Badge } from '../ui';

export function HistoryPanel({ onLoadEntry }) {
  const { history, deleteHistoryEntry, clearHistory } = useApp();

  if (history.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-slate-500">No hay cálculos guardados</p>
      </Card>
    );
  }

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-800">Historial</h2>
        <button
          onClick={clearHistory}
          className="text-xs text-red-500 hover:text-red-600"
        >
          Limpiar todo
        </button>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {history.map((entry) => {
          const totalPieces = entry.pieces.reduce((sum, p) => sum + p.quantity, 0);
          const date = new Date(entry.date);
          
          return (
            <div key={entry.id} className="p-3 bg-slate-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">
                  {date.toLocaleDateString('es-PE')}
                </span>
                <span className="text-xs text-slate-500">
                  {date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>{entry.boards.length} plancha(s)</span>
                <span>•</span>
                <span>{totalPieces} piezas</span>
                {entry.result?.totalCost && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-blue-600">
                      S/ {entry.result.totalCost.toFixed(2)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => onLoadEntry(entry)}
                  variant="secondary"
                  className="flex-1 text-xs py-1.5"
                >
                  Ver
                </Button>
                <button
                  onClick={() => deleteHistoryEntry(entry.id)}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
