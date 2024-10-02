import React from "react";

interface FormatMenuProps {
  position: { top: number; left: number };
  onFormat: (format: string, value?: string) => void;
}

const FormatMenu: React.FC<FormatMenuProps> = ({ position, onFormat }) => {
  const buttons = [
    { label: 'B', format: 'bold' },
    { label: 'I', format: 'italic' },
    { label: 'U', format: 'underline' },
    { label: 'S', format: 'strikeThrough' },
    { label: '<>', format: 'monospace', value: 'monospace' }
  ];

  const handleFormat = (format: string, value?: string) => {
    if (format === 'monospace' && value) {
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) {
        const range = selection.getRangeAt(0);
        
        console.log(range.startContainer, range.endContainer);
        // Check if the start or end container is already a monospace span
        const isMonospace = (node: Node): boolean => {
          if (node.nodeType === Node.TEXT_NODE && node.parentNode) {
            node = node.parentNode;
          }
          return node.nodeType === Node.ELEMENT_NODE &&
                 (node as Element).tagName === 'SPAN' &&
                 (node as Element).classList.contains('monospace');
        };

        const alreadyMonospace = isMonospace(range.startContainer) || isMonospace(range.endContainer);

        if (!alreadyMonospace) {
          // If not, create a new span element with class 'monospace'
          const span = document.createElement('span');
          span.className = 'monospace';
          
          // Extract the contents of the range and put them in the span
          span.appendChild(range.extractContents());

          // Insert the new span
          range.insertNode(span);

          // Move the selection to after the inserted span
          selection.removeAllRanges();
          const newRange = document.createRange();
          newRange.setStartAfter(span);
          newRange.collapse(true);
          selection.addRange(newRange);
        }
      }
    } else {
      onFormat(format, value);
    }
  };

  return (
    <div 
      className="formatMenu"
      style={{
        position: 'absolute',
        top: `${position.top}px`,
        left: `${position.left}px`,
        transform: 'translateX(-50%)',
        display: 'flex',
        backgroundColor: 'white',
        border: '1px solid #ccc',
        borderRadius: '4px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
      }}
    >
      {buttons.map(button => (
        <button
          key={button.format + (button.value || '')}
          onClick={() => handleFormat(button.format, button.value)}
          style={{
            padding: '5px 10px',
            border: 'none',
            background: 'none',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
        >
          {button.label}
        </button>
      ))}
    </div>
  );
};

export default FormatMenu;
