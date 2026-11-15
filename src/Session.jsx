import React from 'react';
import indianIdolLogo from '../Indian_Idol.png';

function Session({ session, loading, error, notice, onRespond }) {
  return (
    <main className="session-page">
      <a className="session-logo" href="/session" aria-label="Indian Idol">
        <img
          className="session-logo-image"
          src={indianIdolLogo}
          alt="Indian Idol"
        />
      </a>

      <section className="session-content" aria-live="polite">
        {session.active && session.text ? (
          <>
            <h1 className="session-question">{session.text}</h1>
            <div className="session-answers">
              <button
                className="session-answer session-yes"
                onClick={() => onRespond('yes')}
              >
                Yes
              </button>
              <button
                className="session-answer session-no"
                onClick={() => onRespond('no')}
              >
                No
              </button>
            </div>
            {notice && (
              <p className="session-feedback" role="status">
                {notice}
              </p>
            )}
            {error && (
              <p className="session-error" role="alert">
                {error}
              </p>
            )}
          </>
        ) : (
          <>
            <p className="session-empty">
              {loading
                ? 'Connecting to the session…'
                : session.active
                  ? 'Waiting for the question…'
                  : 'No active session'}
            </p>
            {error && (
              <p className="session-error" role="alert">
                {error}
              </p>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default Session;
