import React, { useState, useRef, useEffect } from 'react';
import { DEFAULT_COLORS } from '../constants';
import { Palette } from './Icons';

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ color, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-gray-600 transition-colors"
        aria-label="Change tier color"
      >
        <Palette style={{ color }} />
      </button>
      {isOpen && (
        <div className="absolute z-10 top-full mt-2 right-0 bg-gray-700 border border-gray-600 rounded-lg p-4 grid grid-cols-4 gap-6">
          {DEFAULT_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => {
                onChange(c);
                setIsOpen(false);
              }}
              className="w-6 h-6 rounded-full border-2 border-transparent hover:border-white focus:border-white transition-all"
              style={{ backgroundColor: c }}
              aria-label={`Select color ${c}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ColorPicker;