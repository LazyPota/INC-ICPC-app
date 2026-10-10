'use client';

import React from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  preventPaste?: boolean;
  onPasteBlocked?: () => void;
  readOnly?: boolean;
}

export function MonacoCodeEditor({
  value,
  onChange,
  preventPaste = false,
  onPasteBlocked,
  readOnly = false,
}: Props) {
  const handleEditorDidMount: OnMount = (editor, monaco) => {
    if (preventPaste) {
      editor.onKeyDown((e: { ctrlKey: boolean; metaKey: boolean; code: string; preventDefault: () => void; stopPropagation: () => void }) => {
        // Detect Ctrl+V (or Cmd+V)
        if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') {
          e.preventDefault();
          e.stopPropagation();
          if (onPasteBlocked) onPasteBlocked();
        }
      });
    }

    // Set C++ formatting defaults
    monaco.languages.typescript?.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: true,
    });
  };

  return (
    <div
      className="monaco-editor-wrapper relative w-full h-[480px] bg-[#0b1324] border border-slate-800 rounded-md overflow-hidden"
      onPaste={(e) => {
        if (preventPaste) {
          e.preventDefault();
          if (onPasteBlocked) onPasteBlocked();
        }
      }}
    >
      <Editor
        height="100%"
        defaultLanguage="cpp"
        language="cpp"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val || '')}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
          lineNumbers: 'on',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 4,
          wordWrap: 'on',
        }}
        loading={
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            Loading C++ Editor...
          </div>
        }
      />
    </div>
  );
}
