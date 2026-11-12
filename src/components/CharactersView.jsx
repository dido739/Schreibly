const FIELDS = [
  { key: 'name', label: 'Name', type: 'input' },
  { key: 'role', label: 'Role (protagonist, mentor…)', type: 'input' },
  { key: 'age', label: 'Age', type: 'input' },
  { key: 'appearance', label: 'Appearance', type: 'area' },
  { key: 'traits', label: 'Traits & personality', type: 'area' },
  { key: 'backstory', label: 'Backstory', type: 'area', tall: true },
];

export default function CharactersView({ hero, onChange, onDelete, onCreate }) {
  if (!hero) {
    return (
      <div className="empty">
        <h2>Character editor</h2>
        <p className="muted">Every hero gets a profile and attributes. Create your first one.</p>
        <button className="btn primary" onClick={onCreate}>+ New hero</button>
      </div>
    );
  }
  return (
    <div className="hero-form">
      <div className="hero-head">
        <h2>{hero.name || 'Unnamed hero'}</h2>
        <button className="btn danger" onClick={() => onDelete(hero)}>Delete</button>
      </div>
      {FIELDS.map((f) => (
        <label key={f.key}>
          {f.label}
          {f.type === 'input' ? (
            <input value={hero[f.key] || ''} onChange={(e) => onChange({ [f.key]: e.target.value })} />
          ) : (
            <textarea
              rows={f.tall ? 8 : 3}
              value={hero[f.key] || ''}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}
