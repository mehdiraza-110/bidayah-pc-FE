import React, { useMemo } from 'react';
import JoditEditor, { type JoditEditorProps } from 'jodit-react';
import 'jodit/es2021/jodit.min.css';
import './rich-text-editor.css';
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
  const config = useMemo<JoditEditorProps['config']>(
    () => ({
      readonly: false,
      placeholder,
      minHeight: 220,
      height: 320,
      toolbarAdaptive: false,
      toolbarSticky: false,
      statusbar: false,
      colorPickerDefaultTab: 'color',
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html',
      buttons: [
        'source',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'brush',
        '|',
        'paragraph',
        'fontsize',
        '|',
        'ul',
        'ol',
        '|',
        'left',
        'center',
        'right',
        '|',
        'link',
        'image',
        'table',
        '|',
        'undo',
        'redo',
        'eraser',
      ],
      uploader: {
        insertImageAsBase64URI: true,
      },
      removeButtons: ['file'],
    }),
    [placeholder]
  );

  return (
    <div className={cn('rich-text-editor rounded-md border border-input bg-background', className)}>
      <JoditEditor
        value={value}
        config={config}
        onBlur={onChange}
        onChange={onChange}
      />
    </div>
  );
};

export default RichTextEditor;
