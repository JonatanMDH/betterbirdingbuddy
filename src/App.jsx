import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Masthead from './components/Masthead.jsx';
import Home from './pages/Home.jsx';
import Compare from './pages/Compare.jsx';
import Settings from './pages/Settings.jsx';
import { stateFromSearchParams, isRunnable } from './lib/urlParams.js';
import { hasToken } from './lib/auth.js';

export default function App() {
  const [params] = useSearchParams();
  const [tokenOk, setTokenOk] = useState(hasToken());

  const page = params.get('page');
  const state = stateFromSearchParams(params);
  const showCompare = isRunnable(state);

  if (page === 'settings') {
    return (
      <Shell tokenOk={tokenOk}>
        <Settings onTokenSaved={() => setTokenOk(true)} />
      </Shell>
    );
  }

  return (
    <Shell tokenOk={tokenOk}>
      {!tokenOk && (
        <div className="bbb-alert" style={{ marginBottom: 20 }}>
          <b>Before you start:</b> you need to connect your waarneming.nl account once.{' '}
          <Link to="/?page=settings" className="bbb-link">Set it up in Settings →</Link>
        </div>
      )}
      {showCompare
        ? <Compare state={state} />
        : <Home state={state} />}
    </Shell>
  );
}

function Shell({ tokenOk, children }) {
  return (
    <div className="bbb-root">
      <div className="bbb-wrap">
        <Masthead tokenOk={tokenOk} />
        {children}
        <footer className="bbb-footer">
          <div>Better Birding Buddy</div>
          <div>A field tool for the Netherlands</div>
        </footer>
      </div>
    </div>
  );
}
