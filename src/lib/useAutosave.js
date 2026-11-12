import { useCallback, useRef, useState } from 'react';

/**
 * Debounced saver. `save(value)` must be a stable function.
 * status: 'saved' | 'dirty' | 'saving' | 'error'
 */
export function useAutosave(save, delay = 1200) {
  const [status, setStatus] = useState('saved');
  const timer = useRef();
  const pending = useRef(null);

  const flush = useCallback(async () => {
    clearTimeout(timer.current);
    const value = pending.current;
    if (value == null) return;
    pending.current = null;
    setStatus('saving');
    try {
      await save(value);
      setStatus(pending.current == null ? 'saved' : 'dirty');
    } catch (err) {
      console.error('Save failed:', err);
      if (pending.current == null) pending.current = value; // retry on next flush
      setStatus('error');
    }
  }, [save]);

  const schedule = useCallback(
    (value) => {
      pending.current = value;
      setStatus('dirty');
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    },
    [flush, delay],
  );

  const hasPending = useCallback(() => pending.current != null, []);

  /** Drop unsaved changes (e.g. the document was just deleted). */
  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    pending.current = null;
    setStatus('saved');
  }, []);

  return { status, schedule, flush, hasPending, cancel };
}
