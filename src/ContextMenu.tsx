import React, { useState, useEffect, useCallback } from 'react';

interface ContextMenuProps {
  options: string[];
  onSelect: (option: string) => void;
  visible: boolean;
  position: { x: number; y: number };
}

const ContextMenu: React.FC<ContextMenuProps> = ({ options, onSelect, visible, position }) => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  useEffect(() => {
    setSelectedIndex(0);
  }, [options]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (visible) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : options.length - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prevIndex) => (prevIndex < options.length - 1 ? prevIndex + 1 : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (options.length > 0) {
          onSelect(options[selectedIndex]);
        }
      }
    }
  }, [options, selectedIndex, onSelect, visible]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!visible) return null;

  return (
    <ul
      className="contextMenu"
      style={{
        top: position.y,
        left: position.x,
      }}
    >
      {options.map((option, index) => (
        <li
          key={index}
          onClick={() => onSelect(option)}
          onMouseEnter={() => setSelectedIndex(index)}
          style={{
            backgroundColor: index === selectedIndex ? "#e0e0e0" : "transparent",
            cursor: 'pointer',
          }}
        >
          {option}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
