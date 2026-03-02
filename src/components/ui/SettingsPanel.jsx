import { useState } from 'react';
import { useApp } from '../../context/AppContext';

export function SettingsPanel() {
  const { settings, updateSettings } = useApp();
  const [form, setForm] = useState(settings);

  const save = () => updateSettings(form);

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="bg-gray-800 text-white px-3 py-2 text-sm font-medium">
        CONFIGURACIÓN
      </div>
      <div className="p-3 space-y-3">
        <div>
          <label className="text-xs text-gray-500 block mb-1">Nombre del negocio</label>
          <input 
            type="text" 
            value={form.businessName} 
            onChange={(e) => setForm({...form, businessName: e.target.value})} 
            className="w-full px-2 py-2 text-sm border rounded" 
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tarifa/m ({form.currency})</label>
            <input 
              type="number" 
              value={form.cuttingRate} 
              onChange={(e) => setForm({...form, cuttingRate: parseFloat(e.target.value)||0})} 
              step="0.5" 
              className="w-full px-2 py-2 text-sm border rounded" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Servicio ({form.currency})</label>
            <input 
              type="number" 
              value={form.serviceFee} 
              onChange={(e) => setForm({...form, serviceFee: parseFloat(e.target.value)||0})} 
              className="w-full px-2 py-2 text-sm border rounded" 
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Espesor corte (mm)</label>
            <input 
              type="number" 
              value={form.cutThickness || 5} 
              onChange={(e) => setForm({...form, cutThickness: parseFloat(e.target.value)||5})} 
              className="w-full px-2 py-2 text-sm border rounded" 
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tapacantos (mm)</label>
            <input 
              type="number" 
              value={form.edgeBandThickness || 0} 
              onChange={(e) => setForm({...form, edgeBandThickness: parseFloat(e.target.value)||0})} 
              step="0.5"
              className="w-full px-2 py-2 text-sm border rounded" 
            />
          </div>
        </div>
        
        <div className="border-t pt-3 mt-3">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">PARÁMETROS DE CORTE</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Refile (mm)</label>
              <input 
                type="number" 
                value={form.trimSize || 15} 
                onChange={(e) => setForm({...form, trimSize: parseFloat(e.target.value)||15})} 
                className="w-full px-2 py-2 text-sm border rounded" 
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Mín. retazo (mm)</label>
              <input 
                type="number" 
                value={form.minScrapSize || 300} 
                onChange={(e) => setForm({...form, minScrapSize: parseFloat(e.target.value)||300})} 
                className="w-full px-2 py-2 text-sm border rounded" 
              />
            </div>
          </div>
          <div className="mt-2">
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={form.enableScrapGeneration !== false} 
                onChange={(e) => setForm({...form, enableScrapGeneration: e.target.checked})} 
                className="w-4 h-4"
              />
              <span className="text-gray-600">Guardar retazos generados</span>
            </label>
          </div>
        </div>
        
        <button 
          onClick={save} 
          className="w-full px-4 py-2 bg-gray-900 text-white text-sm rounded"
        >
          Guardar
        </button>
        <p className="text-xs text-gray-500 text-center pt-2">
          La configuración se guarda automáticamente en el navegador
        </p>
      </div>
    </div>
  );
}
