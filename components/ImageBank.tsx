
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';
import type { TierImage } from '../types';
import { UNRANKED_ID } from '../constants';
import { SortableImage } from './SortableImage';

interface ImageBankProps {
  items: TierImage[];
}

const ImageBank: React.FC<ImageBankProps> = ({ items }) => {
  const { setNodeRef } = useDroppable({ id: UNRANKED_ID });

  return (
    <div className="bg-gray-800 p-4 mt-4 rounded-lg">
      <h2 className="text-xl font-bold mb-4 text-center">Image Bank</h2>
      <div ref={setNodeRef} className="min-h-[120px] bg-gray-900/50 rounded-md p-2">
        <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="flex flex-wrap gap-2 justify-center">
            {items.map(image => <SortableImage key={image.id} image={image} />)}
            {items.length === 0 && <div className="text-gray-500 self-center p-8">Import images to get started!</div>}
          </div>
        </SortableContext>
      </div>
    </div>
  );
};

export default ImageBank;
