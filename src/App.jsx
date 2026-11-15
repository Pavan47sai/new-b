import React, { useEffect, useRef, useState } from 'react';
import Admin from './Admin.jsx';
import Session from './Session.jsx';

const emptySession = {
  id: null,
  active: false,
  text: '',
  yes: 0,
  no: 0,
};

async function requestSession(action, payload = {}) {
  const response = await fetch('/api/session', {
    method: action ? 'POST' : 'GET',
    headers: action ? { 'Content-Type': 'application/json' } : undefined,
    body: action ? JSON.stringify({ action, ...payload }) : undefined,
    cache: 'no-store',
  });
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Could not connect to the shared session.');
  }

  return result.session;
}

function App() {
  const [page, setPage] = useState(() =>
    window.location.pathname === '/admin' ? 'admin' : 'session',
  );
  const [session, setSession] = useState(emptySession);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [draft, setDraft] = useState('');
  const draftValue = useRef('');
  const updateTimer = useRef(null);
  const pendingTextUpdate = useRef(false);
  const connectionError = useRef(false);

  useEffect(() => {
    let mounted = true;

    async function refreshSession() {
      try {
        const latestSession = await requestSession();
        if (mounted) {
          if (connectionError.current) {
            setError('');
            connectionError.current = false;
          }
          setSession((currentSession) =>
            pendingTextUpdate.current && currentSession.id === latestSession.id
              ? { ...latestSession, text: currentSession.text }
              : latestSession,
          );
        }
      } catch (requestError) {
        if (mounted) {
          connectionError.current = true;
          setError(requestError.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const onPopState = () =>
      setPage(window.location.pathname === '/admin' ? 'admin' : 'session');

    refreshSession();
    const intervalId = window.setInterval(refreshSession, 2000);
    window.addEventListener('popstate', onPopState);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  useEffect(() => {
    if (pendingTextUpdate.current && session.id) return;
    draftValue.current = session.text;
    setDraft(session.text);
  }, [session.id, session.text]);

  useEffect(
    () => () => {
      window.clearTimeout(updateTimer.current);
    },
    [],
  );

  function navigate(event, destination, nextPage) {
    event.preventDefault();
    window.history.pushState({}, '', destination);
    setPage(nextPage);
    setError('');
    setNotice('');
  }

  async function runAction(action, payload) {
    try {
      const nextSession = await requestSession(action, payload);
      if (action === 'updateText') {
        pendingTextUpdate.current = payload.text !== draftValue.current;
      }
      setSession(nextSession);
      setError('');
      return nextSession;
    } catch (requestError) {
      if (action === 'updateText') {
        pendingTextUpdate.current = payload.text !== draftValue.current;
      }
      setError(requestError.message);
      return null;
    }
  }

  async function startSession() {
    if (!draft.trim()) {
      setError('Add a session question or message before starting.');
      return;
    }

    const nextSession = await runAction('start', { text: draft.trim() });
    if (nextSession) {
      setNotice('Your session is live. Share the Session page with participants.');
    }
  }

  async function endSession() {
    window.clearTimeout(updateTimer.current);
    pendingTextUpdate.current = false;
    if (!session.active || !session.id) return;

    let currentSession = session;
    if (draft !== session.text) {
      currentSession = await runAction('updateText', {
        sessionId: session.id,
        text: draft,
      });
      if (!currentSession) return;
    }

    if (await runAction('end', { sessionId: currentSession.id })) {
      setNotice('Session ended. Participants can no longer respond.');
    }
  }

  function updateSessionText(value) {
    draftValue.current = value;
    setDraft(value);
    setError('');
    if (!session.active || !session.id) return;

    window.clearTimeout(updateTimer.current);
    const sessionId = session.id;
    pendingTextUpdate.current = true;
    updateTimer.current = window.setTimeout(() => {
      updateTimer.current = null;
      runAction('updateText', { sessionId, text: value });
    }, 300);
  }

  async function submitResponse(answer) {
    if (!session.active || !session.id) return;

    const nextSession = await runAction('respond', {
      sessionId: session.id,
      answer,
    });
    if (nextSession) {
      setNotice(`Your "${answer === 'yes' ? 'Yes' : 'No'}" response was recorded.`);
    }
  }

  if (page === 'admin') {
    return (
      <Admin
        session={session}
        loading={loading}
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
      loading={loading}
      error={error}
      notice={notice}
      onRespond={submitResponse}
    />
  );
}

export default App;
