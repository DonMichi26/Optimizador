import { createContext, useContext, useState, useEffect } from 'react';
import { smartCutOptimize } from '../utils/smartCutOptimizer';

const AppContext = createContext();

const DEFAULT_SETTINGS = {
  businessName: 'MelaForm',
  currency: 'S/',
  cuttingRate: 2.00,
  serviceFee: 3.00,
  cutThickness: 5,
  trimSize: 15,
  minScrapSize: 300,
  enableScrapGeneration: true,
  cutDirection: 'any'
};

const DEFAULT_BOARD = {
  id: '1',
  width: 2440,
  height: 1220,
  name: 'Plancha Estándar',
  type: 'new',
  cost: 0
};

const BOARD_TYPES = {
  NEW: 'new',
  SCRAP: 'scrap'
};

export function AppProvider({ children }) {
  const [boards, setBoards] = useState([DEFAULT_BOARD]);
  const [scraps, setScraps] = useState([]);
  const [pieces, setPieces] = useState([]);
  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem('smartcut-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('smartcut-history');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentResult, setCurrentResult] = useState(null);

  useEffect(() => {
    localStorage.setItem('smartcut-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('smartcut-scraps', JSON.stringify(scraps));
  }, [scraps]);

  useEffect(() => {
    localStorage.setItem('smartcut-history', JSON.stringify(history));
  }, [history]);

  const addBoard = (board) => {
    const newBoard = {
      ...board,
      id: Date.now().toString(),
      type: board.type || BOARD_TYPES.NEW
    };
    setBoards([...boards, newBoard]);
  };

  const addScrap = (scrap) => {
    const newScrap = {
      ...scrap,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: BOARD_TYPES.SCRAP,
      createdAt: new Date().toISOString()
    };
    setScraps([...scraps, newScrap]);
  };

  const addScraps = (newScraps) => {
    const scrapsToAdd = newScraps.map(s => ({
      ...s,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type: BOARD_TYPES.SCRAP,
      createdAt: new Date().toISOString()
    }));
    setScraps([...scraps, ...scrapsToAdd]);
  };

  const removeScrap = (id) => {
    setScraps(scraps.filter(s => s.id !== id));
  };

  const clearScraps = () => {
    setScraps([]);
  };

  const runOptimization = () => {
    if (!boards.length || !pieces.length) {
      return null;
    }

    const inventory = [
      ...scraps.map(s => ({ ...s, type: BOARD_TYPES.SCRAP })),
      ...boards.filter(b => b.type !== BOARD_TYPES.SCRAP).map(b => ({ ...b, type: BOARD_TYPES.NEW }))
    ];

    const result = smartCutOptimize(inventory, pieces, {
      cutThickness: settings.cutThickness || 5,
      trimSize: settings.trimSize || 15,
      minScrapSize: settings.minScrapSize || 300,
      enableScrapGeneration: settings.enableScrapGeneration !== false,
      cutDirection: settings.cutDirection || 'any'
    });

    if (result.success && result.generatedScraps.length > 0 && settings.enableScrapGeneration) {
      const usableScraps = result.generatedScraps.filter(s => 
        s.width >= (settings.minScrapSize || 300) && 
        s.height >= (settings.minScrapSize || 300)
      );
      addScraps(usableScraps);
    }

    return result;
  };

  const updateBoard = (id, updates) => {
    setBoards(boards.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBoard = (id) => {
    setBoards(boards.filter(b => b.id !== id));
  };

  const addPiece = (piece) => {
    const newPiece = {
      ...piece,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    setPieces([...pieces, newPiece]);
  };

  const updatePiece = (id, updates) => {
    setPieces(pieces.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const removePiece = (id) => {
    setPieces(pieces.filter(p => p.id !== id));
  };

  const clearPieces = () => {
    setPieces([]);
  };

  const clearAll = () => {
    setBoards([DEFAULT_BOARD]);
    setPieces([]);
    setCurrentResult(null);
  };

  const updateSettings = (newSettings) => {
    setSettings({ ...settings, ...newSettings });
  };

  const saveToHistory = (result) => {
    const entry = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      boards: boards.map(b => ({ ...b })),
      pieces: pieces.map(p => ({ ...p })),
      result
    };
    setHistory([entry, ...history].slice(0, 20));
  };

  const deleteHistoryEntry = (id) => {
    setHistory(history.filter(h => h.id !== id));
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return (
    <AppContext.Provider value={{
      boards,
      scraps,
      pieces,
      settings,
      history,
      currentResult,
      setCurrentResult,
      addBoard,
      updateBoard,
      removeBoard,
      addScrap,
      addScraps,
      removeScrap,
      clearScraps,
      addPiece,
      updatePiece,
      removePiece,
      clearPieces,
      clearAll,
      updateSettings,
      runOptimization,
      saveToHistory,
      deleteHistoryEntry,
      clearHistory
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
