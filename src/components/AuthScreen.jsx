import { useState } from 'react';
import { supabase, hasSupabase } from '../lib/supabase.js';

export default function AuthScreen({ onGuest }) {
  const [mode, setMode] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (!data.session) setMsg({ ok: true, text: 'Account created. Check your email to confirm it, then sign in.' });
      }
    } catch (err) {
      setMsg({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="logo big">Schreibly</div>
        <p className="muted">A writing space for new and hobby authors.</p>

        {hasSupabase ? (
          <form onSubmit={submit}>
            <label>
              Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            </label>
            <label>
              Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </label>
            {msg && <div className={`notice ${msg.ok ? 'ok' : 'err'}`}>{msg.text}</div>}
            <button className="btn primary wide" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button
              type="button"
              className="link"
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setMsg(null);
              }}
            >
              {mode === 'signin' ? 'No account yet? Sign up' : 'Have an account? Sign in'}
            </button>
          </form>
        ) : (
          <>
            <div className="notice">Supabase is not configured, so the demo runs without login.</div>
            <button className="btn primary wide" onClick={onGuest}>
              Continue as guest
            </button>
          </>
        )}
      </div>
    </div>
  );
}
