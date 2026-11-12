const TOOLS = [
  { id: 'editor', label: 'Editor', icon: '✎' },
  { id: 'characters', label: 'Characters', icon: '☺' },
  { id: 'timeline', label: 'Timeline', icon: '⏱', soon: true },
];

const SOCIAL = [
  { id: 'forums', label: 'Forums', icon: '☰' },
  { id: 'feed', label: 'Feed', icon: '≋' },
  { id: 'messages', label: 'Messages', icon: '✉', soon: true },
];

function fmtDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function Sidebar({ view, setView, docs, activeId, onOpen, onCreate, onDelete, open }) {
  const item = (t) => (
    <button
      key={t.id}
      className={`nav-item ${view === t.id ? 'active' : ''}`}
      onClick={() => setView(t.id)}
    >
      <span className="nav-icon" aria-hidden>{t.icon}</span>
      <span>{t.label}</span>
      {t.soon && <span className="badge">soon</span>}
    </button>
  );

  return (
    <aside className={`sidebar left ${open ? 'open' : ''}`}>
      <section className="side-half">
        <h3 className="side-title">Tools</h3>
        {TOOLS.map((t) => (
          <div key={t.id}>
            {item(t)}
            {t.id === 'editor' && (
              <div className="doc-list">
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className={`doc-row ${view === 'editor' && d.id === activeId ? 'active' : ''}`}
                  >
                    <button className="doc-open" onClick={() => onOpen(d.id)} title={d.title}>
                      <span className="doc-name">{d.title || 'Untitled'}</span>
                      <span className="doc-meta">{fmtDate(d.updatedAt)}</span>
                    </button>
                    <button
                      className="doc-del"
                      aria-label={`Delete ${d.title}`}
                      title="Delete"
                      onClick={() => onDelete(d)}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button className="doc-new" onClick={onCreate}>+ New document</button>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="side-half social">
        <h3 className="side-title">Social</h3>
        {SOCIAL.map(item)}
      </section>
    </aside>
  );
}
