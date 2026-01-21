import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter product description...',
  className,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const ToolbarButton: React.FC<{
    onClick: () => void;
    icon: React.ReactNode;
    title: string;
  }> = ({ onClick, icon, title }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      className="p-2 hover:bg-muted rounded transition-colors"
      title={title}
    >
      {icon}
    </button>
  );

  return (
    <div className={cn('border border-input rounded-md overflow-hidden', className)}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-input bg-muted/30">
        <ToolbarButton
          onClick={() => execCommand('bold')}
          icon={<Bold className="w-4 h-4" />}
          title="Bold"
        />
        <ToolbarButton
          onClick={() => execCommand('italic')}
          icon={<Italic className="w-4 h-4" />}
          title="Italic"
        />
        <ToolbarButton
          onClick={() => execCommand('underline')}
          icon={<Underline className="w-4 h-4" />}
          title="Underline"
        />
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={() => execCommand('insertUnorderedList')}
          icon={<List className="w-4 h-4" />}
          title="Bullet List"
        />
        <ToolbarButton
          onClick={() => execCommand('insertOrderedList')}
          icon={<ListOrdered className="w-4 h-4" />}
          title="Numbered List"
        />
        <div className="w-px h-6 bg-border mx-1" />
        <ToolbarButton
          onClick={() => execCommand('justifyLeft')}
          icon={<AlignLeft className="w-4 h-4" />}
          title="Align Left"
        />
        <ToolbarButton
          onClick={() => execCommand('justifyCenter')}
          icon={<AlignCenter className="w-4 h-4" />}
          title="Align Center"
        />
        <ToolbarButton
          onClick={() => execCommand('justifyRight')}
          icon={<AlignRight className="w-4 h-4" />}
          title="Align Right"
        />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[200px] p-4 focus:outline-none prose prose-sm max-w-none dark:prose-invert [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-muted-foreground"
        style={{
          wordBreak: 'break-word',
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
};

export default RichTextEditor;
