import { useApp } from '../../context/AppContext';
import { ResultsVisualization } from './CuttingVisualization';

export function ResultsPanel({ result }) {
  const { settings } = useApp();

  if (!result) return null;

  const { results: boardResults, placedPieces, metrics, generatedScraps } = result;

  const totalBoardArea = metrics.totalBoardArea;
  const totalUsedArea = metrics.totalUsedArea;
  const totalCutMeters = placedPieces.reduce((sum, p) => sum + (p.width + p.height) / 1000, 0);
  const subtotal = totalCutMeters * settings.cuttingRate;
  const total = subtotal + settings.serviceFee;

  const unusableWaste = metrics.totalWasteArea;

  return (
    <div className="space-y-3">
      <ResultsVisualization results={boardResults} />

      {/* Métricas de aprovechamiento */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 text-sm">
        <div className="p-2 bg-gray-50 rounded text-center">
          <div className="text-gray-500 text-xs">PIEZAS</div>
          <div className="font-bold text-lg">{placedPieces.length}</div>
        </div>
        <div className="p-2 bg-green-50 rounded text-center">
          <div className="text-green-600 text-xs">USADO</div>
          <div className="font-bold text-green-600">{(totalUsedArea/1e6).toFixed(2)} m²</div>
        </div>
        <div className="p-2 bg-blue-50 rounded text-center">
          <div className="text-blue-600 text-xs">RETAZOS</div>
          <div className="font-bold text-blue-600">{(metrics.totalScrapArea/1e6).toFixed(2)} m²</div>
        </div>
        <div className="p-2 bg-red-50 rounded text-center">
          <div className="text-red-500 text-xs">DESPERCIO</div>
          <div className="font-bold text-red-500">{(unusableWaste/1e6).toFixed(2)} m²</div>
        </div>
      </div>

      {/* Barra de aprovechamiento */}
      <div className="bg-white border rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Aprovechamiento</span>
          <span className="text-lg font-bold text-gray-900">{metrics.utilization.toFixed(1)}%</span>
        </div>
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden flex">
          <div 
            className="h-full bg-green-500 transition-all duration-300" 
            style={{width: `${metrics.utilization}%`}} 
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Utilizado: {(totalUsedArea/totalBoardArea*100).toFixed(1)}%</span>
          <span>Retazos útiles: {generatedScraps.length > 0 ? `${generatedScraps.length} piezas` : '0'}</span>
        </div>
      </div>

      {/* Detalles de cada plancha */}
      {boardResults?.length > 0 && (
        <div className="border-t pt-3 space-y-2">
          <h4 className="text-sm font-semibold text-gray-700">Detalle por plancha</h4>
          {boardResults.map((r, i) => (
            <div key={i} className="bg-gray-50 rounded p-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="font-medium">{r.board.name || `Plancha ${i+1}`}</span>
                <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                  {r.placements.length} piezas
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>{r.board.width}×{r.board.height}mm</span>
                <span className={r.utilization > 80 ? 'text-green-600' : r.utilization > 60 ? 'text-amber-600' : 'text-red-600'}>
                  {r.utilization.toFixed(1)}%
                </span>
              </div>
              {r.scraps?.length > 0 && (
                <div className="mt-1 text-xs text-blue-600">
                  +{r.scraps.length} retazo(s) generado(s)
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Costos */}
      <div className="border-t pt-2 space-y-1 text-sm">
        <div className="flex justify-between"><span className="text-gray-500">Corte:</span><span>{totalCutMeters.toFixed(2)} m</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Tarifa:</span><span>{settings.currency}{settings.cuttingRate}/m</span></div>
        <div className="flex justify-between"><span className="text-gray-500">Servicio:</span><span>{settings.currency}{settings.serviceFee}</span></div>
        <div className="flex justify-between font-bold text-lg border-t pt-1">
          <span>TOTAL:</span>
          <span className="text-emerald-600">{settings.currency}{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
