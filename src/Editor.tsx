import React, { useRef, useState, useEffect } from "react";
import FormatMenu from "./FormatMenu";

interface EditorProps {
  onAtKeyPress: (text: string) => void;
  onSlashKeyPress: (text: string) => void;
  onKeyPress: (text: string) => void;
  onBlur: () => void;
  hideMenu: () => void;
}

const Editor: React.FC<EditorProps> = ({ onAtKeyPress, onSlashKeyPress, onKeyPress, onBlur, hideMenu }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [specialMode, setSpecialMode] = useState<'at' | 'slash' | null>(null);
  const [isFirstCharAfterSpecial, setIsFirstCharAfterSpecial] = useState(false);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [formatMenuPosition, setFormatMenuPosition] = useState({ top: 0, left: 0 });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const text = target.innerText;

    if (e.key === "@") {
      onAtKeyPress(text);
      setSpecialMode('at');
      setIsFirstCharAfterSpecial(true);
    } else if (e.key === "/") {
      onSlashKeyPress(text);
      setSpecialMode('slash');
      setIsFirstCharAfterSpecial(true);
    } else if (specialMode && (e.key === "ArrowUp" || e.key === "ArrowDown")) {
      e.preventDefault();
    }
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (specialMode) {
      if (e.key === '@' || e.key === '/') {
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        selection.collapseToEnd();
        const range = selection.getRangeAt(0);
        
        const textBeforeCursor = range.startContainer.textContent?.slice(0, range.startOffset) || '';
        const specialChar = specialMode === 'at' ? '@' : '/';
        const specialIndex = textBeforeCursor.lastIndexOf(specialChar);
        
        if (specialIndex !== -1) {
          if (isFirstCharAfterSpecial) {
            setIsFirstCharAfterSpecial(false);
          } else {
            const currentWord = textBeforeCursor.slice(specialIndex + 1).match(/^[^\s]+/);
            if (currentWord) {
              onKeyPress(currentWord[0]);
            }
          }
        } else {
          setSpecialMode(null);
          onKeyPress('');
          hideMenu();
        }
      }
    }
  };

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      // Get the absolute position of the editor
      const editorRect = editorRef.current?.getBoundingClientRect();
      
      if (editorRect) {
        // Calculate the absolute position of the selection
        const absoluteLeft = rect.left + window.pageXOffset;
        const absoluteTop = rect.bottom + window.pageYOffset;
        
        // Add an offset to move the menu further to the right
        const menuOffset = 50;

        setFormatMenuPosition({ top: absoluteTop, left: absoluteLeft + menuOffset });
        setShowFormatMenu(true);
      } else {
        setShowFormatMenu(false);
      }
    } else {
      setShowFormatMenu(false);
    }
  };

  useEffect(() => {
    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, []);

  const applyFormat = (format: string, value?: string) => {
    document.execCommand(format, false, value);
  };

  return (
    <>
      <div
        contentEditable
        ref={editorRef}
        onKeyUp={handleKeyUp}
        onKeyDown={handleKeyDown}
        onBlur={onBlur}
        className="editor"
        dangerouslySetInnerHTML={{ __html: '<p><br></p>' }}
      />
      {showFormatMenu && (
        <FormatMenu
          position={formatMenuPosition}
          onFormat={applyFormat}
        />
      )}
    </>
  );
};

export default Editor;
