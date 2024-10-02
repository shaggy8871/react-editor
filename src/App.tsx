import React, { useState, useRef } from 'react';
import Editor from './Editor';
import ContextMenu from './ContextMenu';
import './App.css';

const atOptions: string[] = ["apple", "answer me", "aviary", "banana", "cherry", "date", "elderberry"];
const slashOptions: string[] = ["Paragraph", "Heading 1", "Heading 2", "Bullet List", "Numbered List", "Quote", "Code Block"];

interface Position {
  x: number;
  y: number;
}

interface CursorPosition {
  node: Node | null;
  offset: number;
}

function insertTextAtCursor(text: string, replaceLength: number): void {
  const sel = window.getSelection();
  if (sel === null || sel.rangeCount === 0) return;
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

function insertElementAtCursor(element: HTMLElement, replaceLength: number): void {
  const sel = window.getSelection();
  if (sel === null) return;
  const range = sel.getRangeAt(0);
  const startOffset = Math.max(0, range.startOffset - replaceLength);
  range.setStart(range.startContainer, startOffset);
  range.deleteContents();
  range.insertNode(element);
  
  // Create a new text node with a single space
  const spaceNode = document.createTextNode('\u00A0');
  
  // Insert the space node after the element
  range.setStartAfter(element);
  range.insertNode(spaceNode);
  
  // Move the cursor after the space
  range.setStartAfter(spaceNode);
  range.collapse(true);
  
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
  while (node && !['DIV', 'P', 'H1', 'H2', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'LI'].includes(node.nodeName)) {
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
    case 'Quote':
      wrapper = document.createElement('blockquote');
      break;
    case 'Code Block':
      wrapper = document.createElement('pre');
      break;
    case 'Bullet List':
      wrapper = document.createElement('ul');
      break;
    case 'Numbered List':
      wrapper = document.createElement('ol');
      break;
    case 'Paragraph':
    default:
      wrapper = document.createElement('p');
      break;
  }

  // Handle special cases for bullets and numbering
  if (style === 'Bullet List' || style === 'Numbered List') {
    if (node.nodeName !== 'LI') {
      const li = document.createElement('li');
      li.innerHTML = node.innerHTML;
      wrapper.appendChild(li);
    } else {
      // If already in a list, just change the list type
      wrapper.innerHTML = node.parentElement!.innerHTML;
      node.parentElement!.parentNode!.replaceChild(wrapper, node.parentElement!);
      return;
    }
  } else {
    // Preserve the content when wrapping
    if (node.nodeName === 'UL' || node.nodeName === 'OL') {
      // Concatenate all list items with <br> when converting from a list to a block element
      const listItems = Array.from(node.children);
      wrapper.innerHTML = listItems.map(item => item.innerHTML).join('<br>');
    } else if (node.nodeName === 'LI') {
      // For list items, go to the parent node first
      const parentNode = node.parentElement;
      if (parentNode && (parentNode.nodeName === 'UL' || parentNode.nodeName === 'OL')) {
        const listItems = Array.from(parentNode.children);
        wrapper.innerHTML = listItems.map(item => item.innerHTML).join('<br>');
      } else {
        wrapper.innerHTML = node.innerHTML;
      }
    } else {
      wrapper.innerHTML = node.innerHTML;
    }
  }

  // Replace the nearest block element with the new styled element
  if (wrapper !== node) {
    if (node.nodeName === 'LI') {
      // If the node is a list item, replace its parent (the list) instead
      node.parentNode?.parentNode?.replaceChild(wrapper, node.parentNode);
    } else {
      node.parentNode?.replaceChild(wrapper, node);
    }
  }

  // Move the cursor to the end of the inserted element
  selection.removeAllRanges();
  const newRange = document.createRange();
  newRange.selectNodeContents(wrapper);

  // If the wrapper is empty, add a <br> element to ensure the cursor is inside the block
  if (wrapper.innerHTML.trim() === '') {
    const br = document.createElement('br');
    wrapper.appendChild(br);
    newRange.setStartBefore(br);
  } else {
    newRange.collapse(false);
  }

  selection.addRange(newRange);
}

const App: React.FC = () => {
  const [contextOptions, setContextOptions] = useState<string[]>([]);
  const [menuVisible, setMenuVisible] = useState<boolean>(false);
  const [menuPosition, setMenuPosition] = useState<Position>({ x: 0, y: 0 });
  const filterTextRef = useRef<string>('');
  const [menuType, setMenuType] = useState<'at' | 'slash'>('at');
  const [savedCursorPosition, setSavedCursorPosition] = useState<CursorPosition | null>(null);

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
    // Restore the cursor position
    if (savedCursorPosition) {
      const selection = window.getSelection();
      if (selection && savedCursorPosition.node) {
        const range = document.createRange();
        range.setStart(savedCursorPosition.node, savedCursorPosition.offset);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }

    const replaceLength = filterTextRef.current.length + 1; // +1 for '@' or '/'
    if (menuType === 'at') {
      // Create a span element for the @ option
      const span = document.createElement('span');
      span.className = 'atWord';
      span.textContent = option;
      insertElementAtCursor(span, replaceLength);
    } else {
      // Remove '/' before applying the slash command
      // Create an empty span element instead of a text node
      insertTextAtCursor('', replaceLength);
      // Apply style for slash commands
      applyStyle(option);
    }
    setMenuVisible(false);
    setContextOptions([]);
    setSavedCursorPosition(null);
  };

  const handleHideMenu = (): void => {
    setMenuVisible(false);
    setContextOptions([]);
  };

  const saveCursorPosition = (): void => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      setSavedCursorPosition({
        node: range.startContainer,
        offset: range.startOffset,
      });
    }
  };

  return (
    <div>
      <Editor 
        onAtKeyPress={(text) => handleSpecialKeyPress(text, 'at')}
        onSlashKeyPress={(text) => handleSpecialKeyPress(text, 'slash')}
        onKeyPress={handleKeyPress}
        onBlur={saveCursorPosition}
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

export default App;
