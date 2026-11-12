import { useMemo } from 'react';
import { countWords, parseChapters } from '../lib/text.js';

function EditorPanel({ doc, onGoal, onJump }) {
  const chapters = useMemo(() => parseChapters(doc?.markdown), [doc?.markdown]);
  const words = useMemo(() => countWords(doc?.markdown), [doc?.markdown]);
  const goal = doc?.goal || 0;
  const pct = goal > 0 ? Math.min(100, Math.round((words / goal) * 100)) : 0;
  const chars = (doc?.markdown || '').length;

  return (
    <>
      <section className="panel-sec">
        <h3 className="side-title">Chapters</h3>
        {chapters.length === 0 && <p className="muted small">Add a heading (# Chapter) to create a chapter.</p>}
        <ol className="chapters">
          {chapters.map((c, i) => (
            <li key={i} className={`lvl${c.level}`}>
              <button onClick={() => onJump(i)} title={c.title}>{c.title}</button>
            </li>
          ))}
        </ol>
      </section>

      <section className="panel-sec">
        <h3 className="side-title">Progress</h3>
        <div className="stats">
          <div><b>{words.toLocaleString()}</b><span>words</span></div>
          <div><b>{chars.toLocaleString()}</b><span>characters</span></div>
          <div><b>{Math.max(1, Math.round(words / 200))}</b><span>min read</span></div>
        </div>
        <label className="goal-label">
          Word goal
          <input
            type="number"
            min="0"
            step="100"
            value={goal || ''}
            placeholder="e.g. 50000"
            onChange={(e) => onGoal(Math.max(0, parseInt(e.target.value, 10) || 0))}
          />
        </label>
        {goal > 0 && (
          <>
            <div className="bar" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
              <div style={{ width: `${pct}%` }} />
            </div>
            <p className="muted small">
              {words.toLocaleString()} / {goal.toLocaleString()} ({pct}%)
              {words >= goal ? ' – goal reached!' : ` · ${(goal - words).toLocaleString()} to go`}
            </p>
          </>
        )}
      </section>
    </>
  );
}

function CharactersPanel({ characters, activeId, onSelect, onCreate }) {
  return (
    <section className="panel-sec">
      <h3 className="side-title">Heroes</h3>
      <ul className="hero-list">
        {characters.map((c) => (
          <li key={c.id}>
            <button className={c.id === activeId ? 'active' : ''} onClick={() => onSelect(c.id)}>
              <span className="avatar">{(c.name || '?').trim().charAt(0).toUpperCase() || '?'}</span>
              <span>
                <b>{c.name || 'Unnamed'}</b>
                {c.role && <small>{c.role}</small>}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {characters.length === 0 && <p className="muted small">No heroes yet.</p>}
      <button className="btn wide" onClick={onCreate}>+ New hero</button>
    </section>
  );
}

const FORUMS = ['Fantasy workshop', 'Short stories', 'Poetry corner', 'Beta readers wanted', 'Writing sprints'];

function SocialPanel({ view }) {
  return (
    <section className="panel-sec">
      <h3 className="side-title">{view === 'forums' ? 'Forums' : view === 'feed' ? 'Followed forums' : 'Coming soon'}</h3>
      {view === 'messages' || view === 'timeline' ? (
        <p className="muted small">This tool is planned for a later increment.</p>
      ) : (
        <ul className="plain-list">
          {FORUMS.map((f) => (
            <li key={f}># {f}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function RightPanel({ view, open, doc, onGoal, onJump, characters, activeHeroId, onSelectHero, onCreateHero }) {
  return (
    <aside className={`sidebar right ${open ? 'open' : ''}`}>
      {view === 'editor' && doc && <EditorPanel doc={doc} onGoal={onGoal} onJump={onJump} />}
      {view === 'characters' && (
        <CharactersPanel characters={characters} activeId={activeHeroId} onSelect={onSelectHero} onCreate={onCreateHero} />
      )}
      {!['editor', 'characters'].includes(view) && <SocialPanel view={view} />}
    </aside>
  );
}
