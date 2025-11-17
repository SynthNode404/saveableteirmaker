import React from 'react';
import { useSortable, SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { TierRowData, TierImage } from '../types';
import { SortableImage } from './SortableImage';
import { GripVertical, Trash2 } from './Icons';
import ColorPicker from './ColorPicker';
import { ItemTypes } from '../constants';

interface TierRowProps {
  row: TierRowData;
  items: TierImage[];
  onUpdateRow: (id: string, newLabel: string, newColor: string) => void;
  onDeleteRow: (id: string) => void;
}

const TierRow: React.FC<TierRowProps> = ({ row, items, onUpdateRow, onDeleteRow }) => {
  const {
    attributes,
    listeners,
    setNodeRef: setSortableNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id, data: { type: ItemTypes.ROW, row } });
  
  const { setNodeRef: setDroppableNodeRef } = useDroppable({ 
    id: row.id,
    data: { type: ItemTypes.ROW, row }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdateRow(row.id, e.target.value, row.color);
  };
  
  const handleColorChange = (color: string) => {
    onUpdateRow(row.id, row.label, color);
  };

  return (
    <div ref={setSortableNodeRef} style={style} className="flex items-stretch min-h-[120px] bg-gray-800 my-1">
      <div className="flex items-center justify-center p-2 text-gray-400 cursor-grab active:cursor-grabbing" {...attributes} {...listeners}>
        <GripVertical className="w-6 h-6" />
      </div>
      <div
        className="w-32 flex-shrink-0 flex flex-col items-center justify-evenly p-2"
        style={{ backgroundColor: row.color, color: '#1a1a1a' }}
      >
        <textarea
          value={row.label}
          onChange={handleLabelChange}
          className="bg-transparent text-2xl font-bold w-full text-center outline-none placeholder-gray-600 resize-none"
          placeholder="Tier"
          rows={3}
        />
        <div className="flex items-center justify-center gap-2">
            <ColorPicker color={row.color} onChange={handleColorChange} />
            <button onClick={() => onDeleteRow(row.id)} className="p-2 rounded-md hover:bg-black/20 transition-colors" aria-label="Delete tier">
                <Trash2 className="w-5 h-5"/>
            </button>
        </div>
      </div>
      <div ref={setDroppableNodeRef} className="flex-grow bg-gray-800 p-2 min-h-[100px]">
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-2">
            {items.map(image => <SortableImage key={image.id} image={image} />)}
            {items.length === 0 && <div className="text-gray-500 self-center mx-auto">Drop images here</div>}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default TierRow;
