import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './lib/api.js';
import { hasSupabase, supabase } from './lib/supabase.js';
import { useAutosave } from './lib/useAutosave.js';
import AuthScreen from './components/AuthScreen.jsx';
import Sidebar from './components/Sidebar.jsx';
import RightPanel from './components/RightPanel.jsx';
import EditorView from './components/EditorView.jsx';
import CharactersView from './components/CharactersView.jsx';
import SocialView from './components/SocialView.jsx';

const THEMES = [
  { id: 'dark', label: 'Dark' },
  { id: 'white', label: 'White' },
  { id: 'book', label: 'Book' },
];

const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;

function useTheme() {
  const [theme, setThemeState] = useState(() => document.documentElement.getAttribute('data-theme') || 'white');
  const setTheme = useCallback((t) => {
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem('schreibly-theme', t);
    } catch {
      /* private mode – ignore */
    }
    setThemeState(t);
  }, []);
  return [theme, setTheme];
}

const STATUS_TEXT = {
  saved: 'Saved to B2',
  dirty: 'Unsaved changes…',
  saving: 'Saving…',
  error: 'Save failed – will retry',
};

function Workspace({ user, onSignOut, theme, setTheme }) {
  const [view, setView] = useState('editor');
  const [docs, setDocs] = useState([]);
  const [doc, setDoc] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [heroId, setHeroId] = useState(null);
  const [health, setHealth] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [leftOpen, setLeftOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(false);

  const editorApi = useRef(null);
  const latest = useRef(null);
  const charsRef = useRef([]);
  const started = useRef(false);

  const saveDoc = useCallback(async (d) => {
    const s = await api.saveDoc(d.id, d);
    setDocs((list) => list.map((x) => (x.id === s.id ? s : x)));
  }, []);
  const saveChars = useCallback((list) => api.saveCharacters(list), []);
  const { status: docStatus, schedule: scheduleDoc, flush: flushDoc, hasPending: docPending, cancel: cancelDoc } =
    useAutosave(saveDoc);
  const { status: charStatus, schedule: scheduleChars, flush: flushChars, hasPending: charsPending } =
    useAutosave(saveChars);

  const status = [docStatus, charStatus].includes('error')
    ? 'error'
    : [docStatus, charStatus].includes('saving')
      ? 'saving'
      : [docStatus, charStatus].includes('dirty')
        ? 'dirty'
        : 'saved';

  // Initial load (guarded so React StrictMode does not create two welcome documents).
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      try {
        setHealth(await api.health());
        let list = await api.listDocs();
        if (list.length === 0) {
          const d = await api.createDoc();
          list = [{ id: d.id, title: d.title, updatedAt: d.updatedAt, words: 0 }];
        }
        const [first, chars] = await Promise.all([api.getDoc(list[0].id), api.getCharacters()]);
        latest.current = first;
        charsRef.current = chars.characters || [];
        setDocs(list);
        setDoc(first);
        setCharacters(charsRef.current);
        setHeroId(charsRef.current[0]?.id ?? null);
      } catch (err) {
        setLoadError(err.message);
      }
    })();
  }, []);

  useEffect(() => {
    const warn = (e) => {
      if (docPending() || charsPending()) e.preventDefault();
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [docPending, charsPending]);

  // ------------------------------------------------------------ documents
  const edit = useCallback(
    (patch) => {
      if (!latest.current) return;
      latest.current = { ...latest.current, ...patch };
      setDoc(latest.current);
      scheduleDoc(latest.current);
    },
    [scheduleDoc],
  );

  async function openDoc(id) {
    setView('editor');
    setLeftOpen(false);
    if (latest.current?.id === id) return;
    await flushDoc();
    try {
      const d = await api.getDoc(id);
      latest.current = d;
      setDoc(d);
    } catch (err) {
      alert(err.message);
    }
  }

  async function createDoc() {
    setLeftOpen(false);
    await flushDoc();
    try {
      const d = await api.createDoc();
      setDocs((l) => [{ id: d.id, title: d.title, updatedAt: d.updatedAt, words: 0 }, ...l]);
      latest.current = d;
      setDoc(d);
      setView('editor');
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteDoc(d) {
    if (!confirm(`Delete “${d.title || 'Untitled'}”? This cannot be undone.`)) return;
    const wasActive = latest.current?.id === d.id;
    if (wasActive) cancelDoc(); // avoid an autosave re-creating the deleted file
    try {
      await api.deleteDoc(d.id);
    } catch (err) {
      alert(err.message);
      return;
    }
    const rest = docs.filter((x) => x.id !== d.id);
    setDocs(rest);
    if (!wasActive) return;
    if (rest.length) {
      const next = await api.getDoc(rest[0].id);
      latest.current = next;
      setDoc(next);
    } else {
      const fresh = await api.createDoc({ title: 'Untitled' });
      setDocs([{ id: fresh.id, title: fresh.title, updatedAt: fresh.updatedAt, words: 0 }]);
      latest.current = fresh;
      setDoc(fresh);
    }
  }

  // ----------------------------------------------------------- characters
  function commitChars(next) {
    charsRef.current = next;
    setCharacters(next);
    scheduleChars(next);
  }
  function createHero() {
    const hero = { id: uid(), name: 'New hero', role: '', age: '', appearance: '', traits: '', backstory: '' };
    commitChars([...charsRef.current, hero]);
    setHeroId(hero.id);
    setView('characters');
    setRightOpen(false);
  }
  function updateHero(patch) {
    commitChars(charsRef.current.map((c) => (c.id === heroId ? { ...c, ...patch } : c)));
  }
  function deleteHero(h) {
    if (!confirm(`Delete “${h.name || 'Unnamed'}”?`)) return;
    const next = charsRef.current.filter((c) => c.id !== h.id);
    commitChars(next);
    setHeroId(next[0]?.id ?? null);
  }

  async function signOut() {
    await Promise.all([flushDoc(), flushChars()]);
    onSignOut();
  }

  if (loadError) {
    return (
      <div className="auth-wrap">
        <div className="auth-card">
          <div className="logo big">Schreibly</div>
          <div className="notice err">Could not load your workspace: {loadError}</div>
          <button className="btn primary wide" onClick={() => location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const hero = characters.find((c) => c.id === heroId) || null;
  const center =
    view === 'editor' ? (
      doc ? (
        <EditorView doc={doc} theme={theme} onEdit={edit} apiRef={editorApi} />
      ) : (
        <div className="empty muted">Loading from Backblaze B2…</div>
      )
    ) : view === 'characters' ? (
      <CharactersView hero={hero} onChange={updateHero} onDelete={deleteHero} onCreate={createHero} />
    ) : (
      <SocialView view={view} />
    );

  return (
    <div className="app">
      <header className="topbar">
        <button className="icon-btn only-small" aria-label="Toggle navigation" onClick={() => { setLeftOpen((v) => !v); setRightOpen(false); }}>☰</button>
        <div className="logo">Schreibly</div>
        <div className="spacer" />
        <span className={`save-status ${status}`} title={health?.bucket ? `Bucket: ${health.bucket}` : ''}>
          <i /> {STATUS_TEXT[status]}
        </span>
        <div className="seg" role="group" aria-label="Theme">
          {THEMES.map((t) => (
            <button key={t.id} className={theme === t.id ? 'active' : ''} onClick={() => setTheme(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
        <div className="user">
          <span className="muted small hide-small">{user?.email || 'Guest'}</span>
          <button className="btn small" onClick={signOut}>{hasSupabase ? 'Sign out' : 'Exit'}</button>
        </div>
        <button className="icon-btn only-small" aria-label="Toggle side panel" onClick={() => { setRightOpen((v) => !v); setLeftOpen(false); }}>▤</button>
      </header>

      {health && health.storage !== 'ok' && (
        <div className="banner">Storage problem – {health.storage}</div>
      )}

      <div className="layout">
        <Sidebar
          view={view}
          setView={(v) => { setView(v); setLeftOpen(false); }}
          docs={docs}
          activeId={doc?.id}
          onOpen={openDoc}
          onCreate={createDoc}
          onDelete={deleteDoc}
          open={leftOpen}
        />
        <main className="center">{center}</main>
        <RightPanel
          view={view}
          open={rightOpen}
          doc={doc}
          onGoal={(goal) => edit({ goal })}
          onJump={(i) => { editorApi.current?.jumpToHeading(i); setRightOpen(false); }}
          characters={characters}
          activeHeroId={heroId}
          onSelectHero={(id) => { setHeroId(id); setRightOpen(false); }}
          onCreateHero={createHero}
        />
      </div>
      {(leftOpen || rightOpen) && <div className="scrim" onClick={() => { setLeftOpen(false); setRightOpen(false); }} />}
    </div>
  );
}

export default function App() {
  const [theme, setTheme] = useTheme();
  const [user, setUser] = useState(undefined); // undefined = still checking
  const [guest, setGuest] = useState(false);

  useEffect(() => {
    if (!hasSupabase) {
      setUser(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);

  if (user === undefined) return <div className="auth-wrap muted">Loading…</div>;
  if (!user && !guest) return <AuthScreen onGuest={() => setGuest(true)} />;

  return (
    <Workspace
      key={user?.id || 'guest'}
      user={user}
      theme={theme}
      setTheme={setTheme}
      onSignOut={() => (user ? supabase.auth.signOut() : setGuest(false))}
    />
  );
}
