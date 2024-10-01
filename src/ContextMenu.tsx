import React, { useState, useEffect, useCallback } from 'react';

interface ContextMenuProps {
  options: string[];
  onSelect: (option: string) => void;
  visible: boolean;
  position: { x: number; y: number };
}

const ContextMenu: React.FC<ContextMenuProps> = ({ options, onSelect, visible, position }) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (selectedIndex === null || selectedIndex >= options.length) {
      setSelectedIndex(0);
    }
  }, [options, selectedIndex]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (visible) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) return options.length - 1;
          return prevIndex > 0 ? prevIndex - 1 : options.length - 1;
        });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prevIndex) => {
          if (prevIndex === null) return 0;
          return prevIndex < options.length - 1 ? prevIndex + 1 : 0;
        });
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex !== null && selectedIndex >= 0 && selectedIndex < options.length) {
          onSelect(options[selectedIndex]);
        } else if (options.length > 0) {
          onSelect(options[0]);
        }
      }
    }
  }, [options, selectedIndex, onSelect, visible]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  if (!visible) return null;

  return (
    <ul
      style={{
        position: "absolute",
        top: position.y,
        left: position.x,
        border: "1px solid #ccc",
        backgroundColor: "#fff",
        listStyleType: "none",
        padding: 0,
        margin: 0,
        fontFamily: "Arial, sans-serif",
        fontSize: "14px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
      }}
    >
      {options.map((option, index) => (
        <li
          key={index}
          onClick={() => onSelect(option)}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            backgroundColor: index === selectedIndex ? "#f0f0f0" : "transparent",
          }}
        >
          {option}
        </li>
      ))}
    </ul>
  );
};

export default ContextMenu;
