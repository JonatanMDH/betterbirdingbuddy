import React, { useState, createContext, useContext } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Masthead from './components/Masthead.jsx';
import Home from './pages/Home.jsx';
import Compare from './pages/Compare.jsx';
import Settings from './pages/Settings.jsx';
import { stateFromSearchParams, isRunnable } from './lib/urlParams.js';
import { hasToken } from './lib/auth.js';
import { T } from './lib/i18n.js';

export const LangCtx = createContext('nl');
export const useT = () => T[useContext(LangCtx)];
export const useLang = () => useContext(LangCtx);

export default function App() {
  const [params] = useSearchParams();
  const [tokenOk, setTokenOk] = useState(hasToken());
  const [lang, setLang] = useState('nl');

  const page = params.get('page');
  const state = stateFromSearchParams(params);
  const showCompare = isRunnable(state);
  const t = T[lang];

  return (
    <LangCtx.Provider value={lang}>
      <div className="bbb-root">
        <div className="bbb-wrap">
          <Masthead tokenOk={tokenOk} lang={lang} onToggleLang={() => setLang(l => l === 'nl' ? 'en' : 'nl')} />
          {page === 'settings' ? (
            <Settings onTokenSaved={() => setTokenOk(true)} />
          ) : (
            <>
              {!tokenOk && (
                <div className="bbb-alert" style={{ marginBottom: 20 }}>
                  {lang === 'nl'
                    ? <><b>Eerst instellen:</b> verbind je waarneming.nl-account. <Link to="/?page=settings" className="bbb-link">Instellen →</Link></>
                    : <><b>Before you start:</b> connect your waarneming.nl account. <Link to="/?page=settings" className="bbb-link">Set it up →</Link></>}
                </div>
              )}
              {showCompare ? <Compare state={state} /> : <Home state={state} />}
            </>
          )}
          <footer className="bbb-footer">
            <div>Better Birding Buddy</div>
            <div>Waarneming.nl</div>
          </footer>
        </div>
      </div>
    </LangCtx.Provider>
  );
}
