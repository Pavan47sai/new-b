import React, { useEffect, useState } from 'react';
import Admin from './Admin.jsx';
import Session from './Session.jsx';

const SESSION_KEY = 'gather-live-session';
const SESSION_EVENT = 'gather-session-change';

const emptySession = {
  id: null,
  active: false,
  text: '',
  yes: 0,
  no: 0,
};

function readStoredValue(key, fallback) {
  const stored = window.localStorage.getItem(key);
  if (!stored) return fallback;

  try {
    return JSON.parse(stored);
  } catch {
    return fallback;
  }
}

function App() {
  const [page, setPage] = useState(() =>
    window.location.pathname === '/admin' ? 'admin' : 'session',
  );
  const [session, setSession] = useState(() =>
    readStoredValue(SESSION_KEY, emptySession),
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState(session.text);

  useEffect(() => {
    const refreshData = () => setSession(readStoredValue(SESSION_KEY, emptySession));
    const onStorage = (event) => {
      if (event.key === SESSION_KEY) {
        refreshData();
      }
    };
    const onPopState = () =>
      setPage(window.location.pathname === '/admin' ? 'admin' : 'session');

    window.addEventListener('storage', onStorage);
    window.addEventListener(SESSION_EVENT, refreshData);
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(SESSION_EVENT, refreshData);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    setDraft(session.text);
  }, [session.id, session.text]);

  function navigate(event, destination, nextPage) {
    event.preventDefault();
    window.history.pushState({}, '', destination);
    setPage(nextPage);
    setError('');
    setNotice('');
  }

  function saveSession(nextSession) {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
      setSession(nextSession);
      window.dispatchEvent(new Event(SESSION_EVENT));
      setError('');
      return true;
    } catch {
      setError(
        'Could not save this session in your browser. Check storage settings and try again.',
      );
      return false;
    }
  }

  function startSession() {
    if (!draft.trim()) {
      setError('Add a session question or message before starting.');
      return;
    }

    if (
      saveSession({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        active: true,
        text: draft.trim(),
        yes: 0,
        no: 0,
      })
    ) {
      setNotice('Your session is live. Share the Session page with participants.');
    }
  }

  function endSession() {
    if (session.active && saveSession({ ...session, active: false })) {
      setNotice('Session ended. Participants can no longer respond.');
    }
  }

  function updateSessionText(value) {
    setDraft(value);
    setError('');
    if (session.active) {
      saveSession({ ...session, text: value });
    }
  }

  function submitResponse(answer) {
    if (!session.active || !session.id) return;

    if (saveSession({ ...session, [answer]: session[answer] + 1 })) {
      setNotice(`Your "${answer === 'yes' ? 'Yes' : 'No'}" response was recorded.`);
    }
  }

  if (page === 'admin') {
    return (
      <Admin
        session={session}
        draft={draft}
        error={error}
        notice={notice}
        onDraftChange={updateSessionText}
        onStart={startSession}
        onEnd={endSession}
        onNavigate={navigate}
      />
    );
  }

  return (
    <Session
      session={session}
      error={error}
      notice={notice}
      onRespond={submitResponse}
    />
  );
}

export default App;
