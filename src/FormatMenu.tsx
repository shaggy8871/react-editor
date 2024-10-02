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

  const toggleFormat = (className: string) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    let commonAncestor: Node | null = null;

    // Attempt to find the span from startContainer
    if (range.startContainer.nodeType === Node.ELEMENT_NODE) {
      const startElement = range.startContainer as HTMLElement;
      if (startElement.classList.contains(className)) {
        commonAncestor = startElement;
      }
    } else if (range.startContainer.parentElement?.classList.contains(className)) {
      commonAncestor = range.startContainer.parentElement;
    }

    // Additionally check selection.anchorNode
    if (!commonAncestor && selection.anchorNode) {
      if (selection.anchorNode.nodeType === Node.ELEMENT_NODE) {
        const anchorElement = selection.anchorNode as HTMLElement;
        if (anchorElement.classList.contains(className)) {
          commonAncestor = anchorElement;
        }
      } else if (selection.anchorNode.parentElement?.classList.contains(className)) {
        commonAncestor = selection.anchorNode.parentElement;
      }

      // Also check firstElementChild of anchorNode
      if (!commonAncestor && selection.anchorNode instanceof Element && selection.anchorNode.firstElementChild && selection.anchorNode.firstElementChild.classList.contains(className)) {
        commonAncestor = selection.anchorNode.firstElementChild;
      }
    }

    // If not found, attempt to find the span from endContainer
    if (!commonAncestor) {
      if (range.endContainer.nodeType === Node.ELEMENT_NODE) {
        const endElement = range.endContainer as HTMLElement;
        if (endElement.classList.contains(className)) {
          commonAncestor = endElement;
        }
      } else if (range.endContainer.parentElement?.classList.contains(className)) {
        commonAncestor = range.endContainer.parentElement;
      }
    }

    // Additionally check firstElementChild of focusNode
    if (!commonAncestor && selection.focusNode instanceof Element && selection.focusNode.firstElementChild && selection.focusNode.firstElementChild.classList.contains(className)) {
      commonAncestor = selection.focusNode.firstElementChild;
    }

    // If still not found, fallback to commonAncestorContainer
    if (!commonAncestor) {
      commonAncestor = range.commonAncestorContainer;
      if (commonAncestor.nodeType === Node.TEXT_NODE && commonAncestor.parentNode instanceof HTMLElement) {
        commonAncestor = commonAncestor.parentNode;
      }
    }

    if (commonAncestor instanceof HTMLElement && commonAncestor.classList.contains(className)) {
      // Remove the span by replacing it with its child nodes
      const parent = commonAncestor.parentNode;
      while (commonAncestor.firstChild) {
        parent?.insertBefore(commonAncestor.firstChild, commonAncestor);
      }
      parent?.removeChild(commonAncestor);
    } else {
      // Wrap the selected text in a span with the specified className
      const span = document.createElement('span');
      span.className = className;
      try {
        range.surroundContents(span);
      } catch (e) {
        console.error(`Failed to apply ${className} format:`, e);
      }
    }
  };

  const handleFormat = (format: string, value?: string) => {
    if (format === 'monospace' && value) {
      toggleFormat('monospace');
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
