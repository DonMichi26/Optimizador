import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { BoardForm } from '../components/calculator/BoardForm';
import { PieceForm } from '../components/calculator/PieceForm';
import { ResultsPanel } from '../components/results/ResultsPanel';
import { SettingsPanel } from '../components/ui/SettingsPanel';
import { exportToPDF } from '../utils/exportPDF';
import { exportToSVG } from '../utils/exportPDF';
import { smartCutOptimize, ALGORITHM } from '../utils/smartCutOptimizer';
import { BOARD_TYPES } from '../utils/smartCutOptimizer';

export function Home() {
  const { boards, scraps, pieces, settings, currentResult, setCurrentResult, clearAll, removeScrap } = useApp();
  const [activeTab, setActiveTab] = useState('calculator');
  const [calculating, setCalculating] = useState(false);
  const [strategy, setStrategy] = useState('best-long-side');

  const handleCalculate = useCallback(() => {
    if (boards.length === 0 || pieces.length === 0) return;
    setCalculating(true);

    requestAnimationFrame(() => {
      try {
        const inventory = [
          ...scraps.map(s => ({ ...s, type: BOARD_TYPES.SCRAP })),
          ...boards.filter(b => b.type !== BOARD_TYPES.SCRAP).map(b => ({ ...b, type: BOARD_TYPES.NEW }))
        ];

        const result = smartCutOptimize(inventory, pieces, {
          cutThickness: settings.cutThickness || 5,
          trimSize: settings.trimSize || 15,
          minScrapSize: settings.minScrapSize || 300,
          enableScrapGeneration: settings.enableScrapGeneration !== false,
          algorithm: ALGORITHM.GUILLOWINDOW,
          guillotineStrategy: strategy,
          edgeBandThickness: settings.edgeBandThickness || 0
        });

        if (result && typeof result === 'object') {
          setCurrentResult(result);
        } else {
          console.error('Resultado de optimización inválido:', result);
          setCurrentResult(null);
        }
      } catch (error) {
        console.error('Error durante la optimización:', error);
        setCurrentResult(null);
      } finally {
        setCalculating(false);
      }
    });
  }, [boards, scraps, pieces, settings, strategy, setCurrentResult]);

  const handleExport = () => {
    if (currentResult) {
      exportToPDF(currentResult, settings, boards, pieces);
    }
  };

  const handleExportSVG = () => {
    if (currentResult) {
      exportToSVG(currentResult, settings, boards, pieces);
    }
  };

  const canCalculate = boards.length > 0 && pieces.length > 0;
  const totalInventoryArea = [...boards, ...scraps].reduce((sum, b) => sum + b.width * b.height, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-lg font-bold tracking-wider">SMARTCUT</h1>
          <button
            onClick={() => setActiveTab(activeTab === 'calculator' ? 'settings' : 'calculator')}
            className="text-sm text-gray-400 hover:text-white"
          >
            {activeTab === 'calculator' ? '⚙' : '←'}
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="lg:col-span-4 space-y-3">
            {activeTab === 'calculator' ? (
              <>
                {/* Inventario actual */}
                <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                  <div className="bg-blue-800 text-white px-3 py-2 text-sm font-medium flex justify-between items-center">
                    <span>INVENTARIO</span>
                    <span className="text-xs bg-blue-700 px-2 py-0.5 rounded">
                      {(totalInventoryArea / 1e6).toFixed(2)} m²
                    </span>
                  </div>
                  <div className="p-3 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Planchas nuevas:</span>
                      <span className="font-medium">{boards.filter(b => b.type !== BOARD_TYPES.SCRAP).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Retazos en stock:</span>
                      <span className="font-medium">{scraps.length}</span>
                    </div>
                  </div>
                </div>

                <BoardForm />
                <PieceForm />

                {/* Estrategia de optimización */}
                <div className="bg-white rounded-lg shadow border border-gray-200 p-3">
                  <label className="text-xs text-gray-500 block mb-2">Estrategia de optimización</label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value)}
                    className="w-full px-2 py-2 text-sm border rounded focus:outline-none focus:border-gray-500"
                  >
                    <option value="best-long-side">Mejor lado largo (genera retazos)</option>
                    <option value="best-area">Mejor área (mayor aprovechamiento)</option>
                    <option value="best-short-side">Mejor lado corto</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={clearAll}
                    className="px-4 py-3 bg-gray-200 text-gray-700 font-medium rounded hover:bg-gray-300 text-sm"
                  >
                    Limpiar
                  </button>
                  <button
                    onClick={handleCalculate}
                    disabled={!canCalculate || calculating}
                    className="flex-1 px-4 py-3 bg-gray-900 text-white font-bold rounded hover:bg-gray-800 disabled:opacity-50 text-sm"
                  >
                    {calculating ? 'Calculando...' : 'OPTIMIZAR CORTE'}
                  </button>
                </div>

                {currentResult && currentResult.metrics && (
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium">
                      RESUMEN DE OPTIMIZACIÓN
                    </div>
                    <div className="p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Piezas cortadas:</span>
                        <span className="font-medium">{currentResult.metrics.piecesPlaced || 0}/{currentResult.metrics.totalPiecesRequested || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Planchas usadas:</span>
                        <span className="font-medium">{currentResult.metrics.boardsUsed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Nuevas:</span>
                        <span className="font-medium">{currentResult.metrics.newBoardsUsed || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Retazos reutilizados:</span>
                        <span className="font-medium">{currentResult.metrics.scrapBoardsUsed || 0}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t">
                        <span className="text-gray-500">Aprovechamiento:</span>
                        <span className="font-bold text-green-600">{typeof currentResult.metrics.utilization === 'number' ? currentResult.metrics.utilization.toFixed(1) : '0.0'}%</span>
                      </div>
                      {currentResult.generatedScraps && currentResult.generatedScraps.length > 0 && (
                        <div className="flex justify-between pt-2 border-t">
                          <span className="text-gray-500">Retazos generados:</span>
                          <span className="font-bold text-blue-600">{currentResult.generatedScraps.length}</span>
                        </div>
                      )}
                       <div className="flex justify-between pt-2 border-t">
                         <span className="font-bold">TOTAL:</span>
                         <span className="font-bold text-lg">
                           {settings.currency} {currentResult.placedPieces && currentResult.placedPieces.length > 0 ?
                             (currentResult.placedPieces.reduce((s,p)=>s+((p.placedWidth || p.width || 0)+(p.placedHeight || p.height || 0))/1000,0) * settings.cuttingRate + settings.serviceFee).toFixed(2)
                             : '0.00'}
                         </span>
                       </div>
                    </div>
                  </div>
                )}

                {/* Lista de retazos en inventario */}
                {scraps.length > 0 && (
                  <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    <div className="bg-amber-700 text-white px-3 py-2 text-sm font-medium flex justify-between items-center">
                      <span>RETAZOS DISPONIBLES</span>
                      <span className="text-xs bg-amber-600 px-2 py-0.5 rounded">{scraps.length}</span>
                    </div>
                    <div className="p-2 max-h-40 overflow-y-auto space-y-1">
                      {scraps.map(scrap => (
                        <div key={scrap.id} className="flex justify-between items-center text-xs bg-amber-50 p-2 rounded">
                          <span>{scrap.width}×{scrap.height}mm</span>
                          <button
                            onClick={() => removeScrap(scrap.id)}
                            className="text-red-500 hover:text-red-700 px-2"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    disabled={!currentResult}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-700 disabled:opacity-50 text-sm"
                  >
                    EXPORTAR PDF
                  </button>
                  <button
                    onClick={handleExportSVG}
                    disabled={!currentResult}
                    className="px-4 py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
                  >
                    EXPORTAR SVG
                  </button>
                </div>
              </>
            ) : (
              <SettingsPanel />
            )}
          </div>

          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden h-full">
              <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium flex justify-between items-center">
                <span>VISTA PREVIA DE CORTE</span>
                {currentResult && currentResult.metrics && (
                  <span className="text-xs bg-green-600 px-2 py-0.5 rounded">
                    {typeof currentResult.metrics.utilization === 'number' ? currentResult.metrics.utilization.toFixed(1) : '0.0'}%
                  </span>
                )}
              </div>
              <div className="p-3 min-h-96">
                {currentResult ? (
                  <ResultsPanel result={currentResult} />
                ) : (
                  <div className="h-96 flex items-center justify-center text-gray-400 text-sm">
                    Agrega planchas y piezas, luego presiona OPTIMIZAR CORTE
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
