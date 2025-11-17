
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { TierImage, TierRowData } from './types';
import { UNRANKED_ID, ItemTypes } from './constants';
import TierRow from './components/TierRow';
import ImageBank from './components/ImageBank';
import { SortableImage } from './components/SortableImage';
import { Plus, Save, RotateCcw, Download, Upload } from './components/Icons';

const LOCAL_STORAGE_KEY = 'gemini-tier-list-data';

// A single, constant source of truth for the default state, created once.
const DEFAULT_STATE = (() => {
    const defaultRows: TierRowData[] = [
      { id: 'S', label: 'S', color: '#ff7f7f' },
      { id: 'A', label: 'A', color: '#ffbf7f' },
      { id: 'B', label: 'B', color: '#ffff7f' },
      { id: 'C', label: 'C', color: '#7fff7f' },
      { id: 'D', label: 'D', color: '#7fbfff' },
    ];
    const defaultItems = {
      ...defaultRows.reduce((acc, row) => ({ ...acc, [row.id]: [] as TierImage[] }), {}),
      [UNRANKED_ID]: [],
    };
    return { rows: defaultRows, items: defaultItems };
})();


function App() {
  // Use structuredClone on initialization to prevent any initial reference sharing.
  const [rows, setRows] = useState<TierRowData[]>(() => structuredClone(DEFAULT_STATE.rows));
  const [items, setItems] = useState<Record<string, TierImage[]>>(() => structuredClone(DEFAULT_STATE.items));
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [saveMessage, setSaveMessage] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadFileRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  const clearStateAndStorage = () => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Use structuredClone to guarantee a deep, pristine copy of the default state.
    // This is the key fix to prevent any mutation issues.
    const { rows: defaultRows, items: defaultItems } = structuredClone(DEFAULT_STATE);
    setRows(defaultRows);
    setItems(defaultItems);
  };

  // Load state from localStorage on initial render
  useEffect(() => {
    try {
      const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedData) {
        const { savedRows, savedItems } = JSON.parse(savedData);
        if (savedRows && savedItems) {
            setRows(savedRows);
            setItems(savedItems);
        }
      }
    } catch (error) {
        console.error("Failed to load data from local storage:", error);
        // If loading fails, start with a clean state
        clearStateAndStorage();
    }
  }, []);
  
  const resetState = () => {
    if (window.confirm("Are you sure you want to reset? This will clear your saved progress.")) {
      clearStateAndStorage();
    }
  }

  const handleSave = () => {
    try {
        const dataToSave = JSON.stringify({ savedRows: rows, savedItems: items });
        localStorage.setItem(LOCAL_STORAGE_KEY, dataToSave);
        setSaveMessage('Progress saved successfully!');
        setTimeout(() => setSaveMessage(''), 2000); // Clear message after 2 seconds
    } catch (error) {
        console.error("Error saving data to local storage: ", error);
        setSaveMessage('Failed to save progress.');
        setTimeout(() => setSaveMessage(''), 2000);
    }
  }

  const handleDownload = () => {
    try {
      const dataToSave = JSON.stringify({ savedRows: rows, savedItems: items }, null, 2);
      const blob = new Blob([dataToSave], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gemini-tier-list.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSaveMessage('Backup downloaded successfully!');
      setTimeout(() => setSaveMessage(''), 2000);
    } catch (error) {
      console.error("Error downloading backup: ", error);
      setSaveMessage('Failed to download backup.');
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Are you sure you want to load this file? This will overwrite your current tier list (including your auto-saved progress).")) {
      if(event.target) event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error("File content is not readable.");
        const data = JSON.parse(text);
        if (data && data.savedRows && data.savedItems) {
          setRows(data.savedRows);
          setItems(data.savedItems);
          setSaveMessage('Backup loaded successfully!');
          setTimeout(() => setSaveMessage(''), 2000);
        } else {
          throw new Error("Invalid file format.");
        }
      } catch (error) {
        console.error("Failed to load or parse backup file:", error);
        alert("Failed to load backup. The file might be corrupted or in the wrong format.");
      } finally {
          if(event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };


  const getActiveItem = () => {
    if (!activeId) return null;
    for (const containerId in items) {
        const found = items[containerId].find(item => item.id === activeId);
        if (found) return found;
    }
    return null;
  };
  
  const getActiveRow = () => {
     if (!activeId) return null;
     return rows.find(row => row.id === activeId);
  }
  
  const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newImages: TierImage[] = await Promise.all(files.map(async (file) => ({
        id: crypto.randomUUID(),
        src: await fileToBase64(file),
      })));
      setItems(prev => ({
        ...prev,
        [UNRANKED_ID]: [...prev[UNRANKED_ID], ...newImages],
      }));
    }
  };

  const handleAddRow = () => {
    const newId = `new-row-${crypto.randomUUID()}`;
    const newRow: TierRowData = {
      id: newId,
      label: 'New Tier',
      color: '#4a4a4a',
    };
    setRows(prev => [...prev, newRow]);
    setItems(prev => ({ ...prev, [newId]: [] }));
  };

  const handleUpdateRow = useCallback((id: string, newLabel: string, newColor: string) => {
    setRows(prev =>
      prev.map(row => (row.id === id ? { ...row, label: newLabel, color: newColor } : row))
    );
  }, []);

  const handleDeleteRow = useCallback((id: string) => {
    setRows(prev => prev.filter(row => row.id !== id));
    setItems(prev => {
      const newItems = { ...prev };
      const itemsToMove = newItems[id] || [];
      newItems[UNRANKED_ID] = [...newItems[UNRANKED_ID], ...itemsToMove];
      delete newItems[id];
      return newItems;
    });
  }, []);
  
  const findContainer = (id: UniqueIdentifier) => {
    if (id === UNRANKED_ID || rows.some(r => r.id === id)) {
        return id;
    }
    for (const containerId in items) {
        if (items[containerId].some(item => item.id === id)) {
            return containerId;
        }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }
    
    if (active.data.current?.type === ItemTypes.ROW && over.data.current?.type === ItemTypes.ROW) {
        if (active.id !== over.id) {
            setRows((rows) => {
                const oldIndex = rows.findIndex((row) => row.id === active.id);
                const newIndex = rows.findIndex((row) => row.id === over.id);
                return arrayMove(rows, oldIndex, newIndex);
            });
        }
    }
    else if (active.data.current?.type === ItemTypes.IMAGE) {
        const activeContainer = findContainer(active.id);
        const overContainer = findContainer(over.id);

        if (!activeContainer || !overContainer || activeContainer === overContainer) {
            if (activeContainer && over.id) {
                const activeIndex = items[activeContainer].findIndex(item => item.id === active.id);
                const overIndex = items[activeContainer].findIndex(item => item.id === over.id);
                if (activeIndex !== -1 && overIndex !== -1 && activeIndex !== overIndex) {
                    setItems(prev => ({
                        ...prev,
                        [activeContainer]: arrayMove(prev[activeContainer], activeIndex, overIndex)
                    }));
                }
            }
        } else {
            setItems(prev => {
                const newItems = {...prev};
                const activeIndex = newItems[activeContainer].findIndex(item => item.id === active.id);
                const [movedItem] = newItems[activeContainer].splice(activeIndex, 1);
                
                const overIsContainer = findContainer(over.id) === over.id;
                
                if (overIsContainer) {
                    newItems[overContainer].push(movedItem);
                } else {
                    const overIndex = newItems[overContainer].findIndex(item => item.id === over.id);
                    if (overIndex !== -1) {
                      newItems[overContainer].splice(overIndex, 0, movedItem);
                    } else {
                      newItems[overContainer].push(movedItem);
                    }
                }
                
                return newItems;
            });
        }
    }
    setActiveId(null);
  };

  return (
    <div className="min-h-screen p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-start mb-8 flex-wrap gap-4">
            <div>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">Savable Tier List Maker</h1>
                <p className="text-gray-400 mt-2">Create and customize your own tier lists with ease.</p>
            </div>
        </header>
        
        <div className="flex justify-center flex-wrap gap-4 mb-8">
          <button 
            onClick={handleAddRow}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
            <Plus className="w-5 h-5 mr-2"/>
            Add Tier
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Import Images
          </button>
          <button 
              onClick={handleSave}
              className="bg-teal-600 hover:bg-teal-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
              <Save className="w-5 h-5 mr-2"/>
              Save Progress
          </button>
          <button 
              onClick={handleDownload}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
              <Download className="w-5 h-5 mr-2"/>
              Download Backup
          </button>
          <button 
              onClick={() => uploadFileRef.current?.click()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
              <Upload className="w-5 h-5 mr-2"/>
              Upload Backup
          </button>
          <button 
              onClick={resetState}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors"
          >
              <RotateCcw className="w-5 h-5 mr-2"/>
              Reset
          </button>
          <input 
            type="file" 
            ref={fileInputRef}
            multiple 
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
          <input 
            type="file" 
            ref={uploadFileRef}
            accept=".json"
            onChange={handleUpload}
            className="hidden"
          />
        </div>
        
        {saveMessage && (
            <div className="text-center mb-4 text-green-400 transition-opacity duration-300">
                {saveMessage}
            </div>
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div>
              <SortableContext items={rows.map(r => r.id)} strategy={verticalListSortingStrategy}>
                {rows.map(row => (
                  <TierRow
                    key={row.id}
                    row={row}
                    items={items[row.id] || []}
                    onUpdateRow={handleUpdateRow}
                    onDeleteRow={handleDeleteRow}
                  />
                ))}
              </SortableContext>

              <ImageBank items={items[UNRANKED_ID] || []} />
          </div>
          
          <DragOverlay>
              {activeId && getActiveItem() && <SortableImage image={getActiveItem()!} />}
              {activeId && getActiveRow() && (
                  <TierRow 
                      row={getActiveRow()!}
                      items={items[activeId] || []}
                      onUpdateRow={() => {}}
                      onDeleteRow={() => {}}
                  />
              )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

export default App;
