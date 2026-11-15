import React from 'react';

function Admin({
  session,
  loading,
  draft,
  error,
  notice,
  onDraftChange,
  onStart,
  onEnd,
  onNavigate,
}) {
  const totalResponses = session.yes + session.no;
  const yesPercent = totalResponses
    ? Math.round((session.yes / totalResponses) * 100)
    : 0;
  const noPercent = totalResponses ? 100 - yesPercent : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="/session"
          onClick={(event) => onNavigate(event, '/session', 'session')}
          aria-label="Indian Idol home"
        >
          <span className="brand-mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span>Indian Idol</span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a
            href="/session"
            className="nav-link"
            onClick={(event) => onNavigate(event, '/session', 'session')}
          >
            Session
          </a>
          <a
            href="/admin"
            className="nav-link active"
            aria-current="page"
            onClick={(event) => onNavigate(event, '/admin', 'admin')}
          >
            Admin
          </a>
        </nav>
        <div className="topbar-status">
          <span className={session.active ? 'status-dot live' : 'status-dot'} />
          {session.active ? 'Live session' : 'Ready when you are'}
        </div>
      </header>

      <main className="page-content">
        <div className="eyebrow">
          <span className="eyebrow-line" />
          HOST DASHBOARD
        </div>

        <section className="admin-layout" aria-labelledby="page-title">
          <div className="intro">
            <h1 id="page-title">
              Indian Idol 
            </h1>
            <p>
              Start a session.
            </p>
          </div>

          <div className="admin-card">
            <div className="card-heading">
              <div>
                <span className="section-label">YOUR SESSION</span>
                <h2>Session setup</h2>
              </div>
              <span className={session.active ? 'pill live-pill' : 'pill'}>
                <span className="status-dot" />
                {session.active ? 'LIVE' : 'NOT STARTED'}
              </span>
            </div>

            <label className="field-label" htmlFor="session-message">
              Question or message
            </label>
            <textarea
              id="session-message"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              placeholder="What would you like to ask everyone?"
              rows={4}
              maxLength={500}
              disabled={loading}
            />
            <div className="field-footer">
              <span>Keep it clear and easy to answer</span>
              <span>{draft.length}/500</span>
            </div>

            <div className="admin-actions">
              <button
                className="button button-primary"
                onClick={onStart}
                disabled={session.active || loading}
              >
                <span aria-hidden="true">▶</span>
                Start session
              </button>
              <button
                className="button button-secondary"
                onClick={onEnd}
                disabled={!session.active || loading}
              >
                End session
              </button>
            </div>

            {error && (
              <p className="feedback error-message" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="feedback success-message" role="status">
                {notice}
              </p>
            )}

            <div className="share-hint">
              <span className="hint-icon" aria-hidden="true">
                ↗
              </span>
              <p>
                Participants can open the{' '}
                <a
                  href="/session"
                  onClick={(event) =>
                    onNavigate(event, '/session', 'session')
                  }
                >
                  Session page
                </a>{' '}
                on any device to respond.
              </p>
            </div>
          </div>

          <div className="results-card">
            <div className="results-heading">
              <div>
                <span className="section-label">LIVE RESULTS</span>
                <h2>Responses so far</h2>
              </div>
              <span className="response-count">
                {totalResponses} <small>total</small>
              </span>
            </div>
            <div className="result-row">
              <span className="result-name">
                <span className="answer-icon yes-icon">✓</span> Yes
              </span>
              <strong>{session.yes}</strong>
            </div>
            <div className="result-track">
              <span
                className="result-fill yes-fill"
                style={{ width: `${yesPercent}%` }}
              />
            </div>
            <div className="result-row no-row">
              <span className="result-name">
                <span className="answer-icon no-icon">×</span> No
              </span>
              <strong>{session.no}</strong>
            </div>
            <div className="result-track">
              <span
                className="result-fill no-fill"
                style={{ width: `${noPercent}%` }}
              />
            </div>
            <p className="results-footnote">
              Results update as participants respond.
            </p>
          </div>
        </section>
      </main>
      <footer className="footer">
        <span>
          Indian Idol<span className="footer-period">.</span>
        </span>
        <span>A little space for every voice.</span>
      </footer>
    </div>
  );
}

export default Admin;
