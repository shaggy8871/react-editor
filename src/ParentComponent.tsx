import React, { useState, useRef } from 'react';
import Editor from './Editor';
import ContextMenu from './ContextMenu';
import './App.css';

const atOptions: string[] = ["apple", "answer me", "banana", "cherry", "date", "elderberry"]; // Example options
const slashOptions: string[] = ["Paragraph", "Heading 1", "Heading 2", "Bullet List", "Numbered List", "Quote", "Code Block"];

interface Position {
  x: number;
  y: number;
}

function insertTextAtCursor(text: string, replaceLength: number): void {
  const sel = window.getSelection();
  if (sel === null) return;
  const range = sel.getRangeAt(0);
  const startOffset = Math.max(0, range.startOffset - replaceLength);
  range.setStart(range.startContainer, startOffset);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  sel.removeAllRanges();
  sel.addRange(range);
}

function getCaretCoordinates(): Position {
  const sel = window.getSelection();
  if (sel === null || sel.rangeCount === 0) {
    return { x: 0, y: 0 };
  }
  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  if (rect.left === 0 && rect.bottom === 0) {
    // If the cursor is at the beginning of a paragraph
    const tempSpan = document.createElement('span');
    tempSpan.appendChild(document.createTextNode('\u200B')); // Zero-width space
    range.insertNode(tempSpan);
    const tempRect = tempSpan.getBoundingClientRect();
    tempSpan.parentNode?.removeChild(tempSpan);
    return { x: tempRect.left, y: tempRect.bottom };
  }
  
  return { x: rect.left, y: rect.bottom };
}

function applyStyle(style: string): void {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  let node = range.startContainer as HTMLElement;

  // Traverse up the DOM to find the nearest block element
  while (node && !['DIV', 'P', 'H1', 'H2', 'UL', 'OL', 'BLOCKQUOTE', 'PRE'].includes(node.nodeName)) {
    node = node.parentElement as HTMLElement;
  }

  if (!node || node.classList.contains('editor')) {
    // If the nearest block element is the editor, create a new element
    node = document.createElement('p');
    range.insertNode(node);
  }

  let wrapper: HTMLElement;
  switch (style) {
    case 'Heading 1':
      wrapper = document.createElement('h1');
      break;
    case 'Heading 2':
      wrapper = document.createElement('h2');
      break;
    case 'Bullet List':
      if (node.nodeName === 'OL') {
        // Replace OL with UL
        wrapper = document.createElement('ul');
        Array.from(node.children).forEach(li => wrapper.appendChild(li.cloneNode(true)));
      } else if (node.nodeName !== 'UL') {
        wrapper = document.createElement('ul');
        const li = document.createElement('li');
        li.innerHTML = node.innerHTML;
        wrapper.appendChild(li);
      } else {
        wrapper = document.createElement('li');
      }
      break;
    case 'Numbered List':
      if (node.nodeName === 'UL') {
        // Replace UL with OL
        wrapper = document.createElement('ol');
        Array.from(node.children).forEach(li => wrapper.appendChild(li.cloneNode(true)));
      } else if (node.nodeName !== 'OL') {
        wrapper = document.createElement('ol');
        const li = document.createElement('li');
        li.innerHTML = node.innerHTML;
        wrapper.appendChild(li);
      } else {
        wrapper = document.createElement('li');
      }
      break;
    case 'Quote':
      wrapper = document.createElement('blockquote');
      break;
    case 'Code Block':
      wrapper = document.createElement('pre');
      break;
    case 'Paragraph':
    default:
      wrapper = document.createElement('p');
      break;
  }

  // Preserve the content when wrapping
  if (!['UL', 'OL'].includes(node.nodeName) && !['Bullet List', 'Numbered List'].includes(style)) {
    wrapper.innerHTML = node.innerHTML;
  }

  // Replace the nearest block element with the new styled element
  if (['Bullet List', 'Numbered List'].includes(style) && ['UL', 'OL'].includes(node.nodeName)) {
    if (wrapper.nodeName === 'LI') {
      node.appendChild(wrapper);
    } else {
      node.parentNode?.replaceChild(wrapper, node);
    }
  } else {
    node.parentNode?.replaceChild(wrapper, node);
  }

  // Move the cursor to the end of the inserted element
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);
  newRange.collapse(false);
  selection.addRange(newRange);
}

const ParentComponent: React.FC = () => {
  const [contextOptions, setContextOptions] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<Position>({ x: 0, y: 0 });
  const filterTextRef = useRef<string>('');
  const [menuType, setMenuType] = useState<'at' | 'slash'>('at');

  const handleSpecialKeyPress = (text: string, type: 'at' | 'slash'): void => {
    // Show context menu below the current line
    const { x, y } = getCaretCoordinates();
    setMenuPosition({ x, y });
    setMenuVisible(true);
    filterTextRef.current = '';
    setMenuType(type);
    setContextOptions(type === 'at' ? atOptions : slashOptions);
  };

  const handleKeyPress = (text: string): void => {
    if (menuVisible) {
      const options = menuType === 'at' ? atOptions : slashOptions;
      // Filter options based on the text after '@' or '/'
      const filtered = options.filter((option) =>
        option.toLowerCase().startsWith(text.toLowerCase())
      );
      if (filtered.length === 0) {
        setMenuVisible(false);
      } else {
        setContextOptions(filtered);
        filterTextRef.current = text;
      }
    }
  };

  const handleOptionSelect = (option: string): void => {
    const replaceLength = filterTextRef.current.length + 1; // +1 for '@' or '/'
    if (menuType === 'at') {
      // Replace '@' and filter text with the selected option
      insertTextAtCursor(option, replaceLength);
    } else {
      // Remove '/' before applying the slash command
      insertTextAtCursor('', replaceLength);
      // Apply style for slash commands
      applyStyle(option);
    }
    setMenuVisible(false);
    setContextOptions([]);
  };

  const handleHideMenu = (): void => {
    setMenuVisible(false);
    setContextOptions([]);
  };

  return (
    <div>
      <Editor 
        onAtKeyPress={(text) => handleSpecialKeyPress(text, 'at')}
        onSlashKeyPress={(text) => handleSpecialKeyPress(text, 'slash')}
        onKeyPress={handleKeyPress}
        hideMenu={handleHideMenu}
      />
      <ContextMenu
        options={contextOptions}
        visible={menuVisible}
        position={menuPosition}
        onSelect={handleOptionSelect}
      />
    </div>
  );
};

export default ParentComponent;
