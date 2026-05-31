import React from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monacoT from 'monaco-editor';

interface CodeEditorProps {
  value: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, readOnly = false }) => {
  const handleEditorMount: OnMount = (editor, monaco) => {
    // ✅ Disable TypeScript language service to avoid "inmemory://model" errors
    // We're doing runtime eval, not compile-time checking
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: true,
      noSyntaxValidation: false, // Keep basic syntax highlighting
    });

    // ✅ Set minimal compiler options (no lib files that require file system)
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      module: monaco.languages.typescript.ModuleKind.ESNext,
      jsx: monaco.languages.typescript.JsxEmit.React,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      // Skip lib files that cause inmemory:// errors
      lib: [],
      skipLibCheck: true,
      noLib: true,
    });

    // ✅ Add only essential global type hints (no file-based imports)
    monaco.languages.typescript.typescriptDefaults.addExtraLib(`
      declare const PIXI: {
        Container: any;
        Application: any;
        Graphics: any;
        Text: any;
        TextStyle: any;
        Sprite: any;
        [key: string]: any;
      };
      declare const console: Console;
      declare const setTimeout: typeof window.setTimeout;
      declare const requestAnimationFrame: typeof window.requestAnimationFrame;
      declare const Math: Math;
    `, 'globals.d.ts');

    // ✅ Editor hint decoration
    if (!readOnly) {
      editor.createDecorationsCollection([{
        range: new monaco.Range(1, 1, 1, 1),
        options: {
          isWholeLine: true,
          linesDecorationsClassName: 'editable-hint',
        }
      }]);
    }

    // Format on mount
    editor.getAction('editor.action.formatDocument')?.run();
  };

  return (
    <div className="editor-panel">
      <Editor
        width="100%"
        height="100%"
        defaultLanguage="typescript"
        value={value}
        theme="vs-dark"
        readOnly={readOnly}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          renderWhitespace: 'selection',
          automaticLayout: true,
          tabSize: 2,
          formatOnPaste: true,
          formatOnType: true,
          wordWrap: 'on',
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true },
          // ✅ Disable expensive language features that cause inmemory:// errors
          suggest: { showWords: false },
          quickSuggestions: false,
          parameterHints: { enabled: false },
        }}
        onChange={(val) => val !== undefined && onChange(val)}
        onMount={handleEditorMount}
      />
    </div>
  );
};

export default CodeEditor;