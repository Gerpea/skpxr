import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import CodeEditor from './components/CodeEditor';
import Preview from './components/Preview';
import { examples, Example } from './ExampleRegistry';

const App: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>(examples[0].id);
  const [editableCode, setEditableCode] = useState<Record<string, string>>({});

  // Split state: currentCode (live typing) vs savedCode (applied to preview)
  const [savedCode, setSavedCode] = useState<string>('');
  const [currentCode, setCurrentCode] = useState<string>('');
  const [currentTitle, setCurrentTitle] = useState<string>('');

  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<number>();

  const selectedExample = useMemo<Example | undefined>(
    () => examples.find((ex) => ex.id === selectedId),
    [selectedId]
  );

  // Sync state when switching examples
  useEffect(() => {
    if (selectedExample) {
      const code = editableCode[selectedId] ?? selectedExample.source;
      setSavedCode(code);
      setCurrentCode(code);
      setCopied(false);
      setCurrentTitle(selectedExample.title)
    }
  }, [selectedId, selectedExample, editableCode]);

  const hasUnsaved = currentCode !== savedCode;

  const handleEditorChange = useCallback((code: string) => {
    setCurrentCode(code);
  }, []);

  const handleSave = useCallback(() => {
    if (hasUnsaved && selectedExample) {
      setSavedCode(currentCode);
      setEditableCode(prev => ({ ...prev, [selectedId]: currentCode }));
    }
  }, [currentCode, hasUnsaved, selectedId, selectedExample]);

  const handleReset = useCallback(() => {
    if (selectedExample) {
      const original = selectedExample.source;
      setSavedCode(original);
      setCurrentCode(original);
      setEditableCode(prev => {
        const next = { ...prev };
        delete next[selectedId];
        return next;
      });
    }
  }, [selectedId, selectedExample]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setCopied(true);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = window.setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [currentCode]);

  // Ctrl+S Listener (Capture phase)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        e.stopPropagation();
        handleSave();
        return false;
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [handleSave]);

  console.log(examples)
  return (
    <div className="app-layout">
      <Sidebar examples={examples} selectedId={selectedId} onSelect={setSelectedId} />

      <main className="main-area">
        {selectedExample ? (
          <div className="content-split">
            {/* Left: Editor Column */}
            <div className="editor-column">
              <div className="editor-header">
                <div className="editor-status">
                  <span className={`status-dot ${hasUnsaved ? 'edited' : ''}`} />
                  <span>
                    {currentTitle}
                  </span>
                </div>
                <div className="editor-actions">
                  {hasUnsaved && (
                    <>
                      <span style={{ color: '#666', fontSize: 11, marginLeft: 6 }}>
                        (Ctrl+S)
                      </span>
                      <button className="action-btn save" onClick={handleSave} title="Save & Apply (Ctrl+S)">
                        💾 Save
                      </button>
                    </>
                  )}
                  <button className={`action-btn copy ${copied ? 'copied' : ''}`} onClick={handleCopy} title={copied ? 'Copied!' : 'Copy code'}>
                    {copied ? '✓' : '📋'}
                  </button>
                  {editableCode[selectedId] && (
                    <button className="action-btn reset" onClick={handleReset} title="Restore original">
                      ↺
                    </button>
                  )}
                </div>
              </div>
              <CodeEditor value={currentCode} onChange={handleEditorChange} />
            </div>

            {/* Right: Preview Column - Pixi Top, Skia Bottom */}
            <div className="preview-column">
              <Preview
                example={selectedExample}
                editableCode={savedCode}
                label="Pixi"
                renderer="pixi"
              />
              <div className="preview-divider" />
              <Preview
                example={selectedExample}
                editableCode={savedCode}
                label="Skia"
                renderer="skia"
              />
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <h3>👈 Select an example</h3>
            <p>Choose from the sidebar to view and edit code</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;