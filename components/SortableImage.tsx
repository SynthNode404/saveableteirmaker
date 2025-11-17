
import React, { forwardRef } from 'react';
import type { TierImage } from '../types';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableImageProps {
  image: TierImage;
}

export const SortableImage = forwardRef<HTMLDivElement, SortableImageProps>(({ image }, ref) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id, data: { type: 'image' } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    touchAction: 'none', // For better mobile experience
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="w-24 h-24 bg-gray-700 rounded-md overflow-hidden flex-shrink-0 cursor-grab active:cursor-grabbing"
    >
      <img src={image.src} alt="Tier item" className="w-full h-full object-cover" />
    </div>
  );
});
