import React, { useState, createContext, useContext } from 'react';
import Masthead from './components/Masthead.jsx';
import Home from './pages/Home.jsx';
import Compare from './pages/Compare.jsx';

export const LangCtx = createContext('nl');
export const useLang = () => useContext(LangCtx);

export default function App() {
  const [lang, setLang]   = useState('nl');
  const [data, setData]   = useState(null); // { me, buddies } — parsed CSV data

  return (
    <LangCtx.Provider value={lang}>
      <div className="bbb-root">
        <div className="bbb-wrap">
          <Masthead lang={lang} onToggleLang={() => setLang(l => l === 'nl' ? 'en' : 'nl')} />
          {data
            ? <Compare data={data} onBack={() => setData(null)} />
            : <Home onSubmit={setData} />}
          <footer className="bbb-footer">
            <span>Better Birding Buddy</span>
            <span>Waarneming.nl CSV-vergelijker</span>
          </footer>
        </div>
      </div>
    </LangCtx.Provider>
  );
}
