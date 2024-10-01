import React, { useRef, useState } from "react";

interface EditorProps {
  onAtKeyPress: (text: string) => void;
  onSlashKeyPress: (text: string) => void;
  onKeyPress: (text: string) => void;
  hideMenu: () => void;
}

const Editor: React.FC<EditorProps> = ({ onAtKeyPress, onSlashKeyPress, onKeyPress, hideMenu }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [specialMode, setSpecialMode] = useState<'at' | 'slash' | null>(null);
  const [isFirstCharAfterSpecial, setIsFirstCharAfterSpecial] = useState(false);

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

  return (
    <div
      contentEditable
      ref={editorRef}
      onKeyUp={handleKeyUp}
      onKeyDown={handleKeyDown}
      className="editor"
      style={{ 
        minHeight: "200px", 
        border: "1px solid #ccc", 
        padding: "10px",
        fontFamily: "Arial, Helvetica, sans-serif" 
      }}
      dangerouslySetInnerHTML={{ __html: '<div><br></div>' }}
    />
  );
};

export default Editor;
