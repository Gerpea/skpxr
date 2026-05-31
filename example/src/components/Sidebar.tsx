import React from 'react';
import { Example } from '../ExampleRegistry';

interface SidebarProps {
  examples: Example[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ examples, selectedId, onSelect }) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span>Examples</span>
        <span style={{ fontSize: 11, color: '#666' }}>{examples.length} total</span>
      </div>
      <ul className="example-list">
        {examples.map((ex) => (
          <li
            key={ex.id}
            className={`example-item ${ex.id === selectedId ? 'active' : ''}`}
            onClick={() => onSelect(ex.id)}
            title={ex.description}
          >
            <span className="example-title">{ex.title}</span>
            <span className="example-desc">{ex.description}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
};

export default Sidebar;