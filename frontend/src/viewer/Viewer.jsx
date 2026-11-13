// Finds every src/wireframes/<owner>/*.wf.jsx and shows each of its states.
// Nobody needs to edit this file to add a wireframe.
import { useEffect, useState } from 'react';
import Frame from './Frame.jsx';

const modules = import.meta.glob('../wireframes/*/*.wf.jsx', { eager: true });

const wireframes = Object.entries(modules)
  .map(([path, mod]) => {
    const [, folder, file] = path.match(/wireframes\/([^/]+)\/([^/]+)\.wf\.jsx$/);
    return { key: `${folder}/${file}`, folder, file, meta: mod.meta ?? {}, Component: mod.default };
  })
  .sort((a, b) => a.key.localeCompare(b.key));

const folders = [...new Set(wireframes.map((w) => w.folder))];

function useHash() {
  const [hash, setHash] = useState(() => decodeURIComponent(location.hash.slice(1)));
  useEffect(() => {
    const on = () => setHash(decodeURIComponent(location.hash.slice(1)));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return hash;
}

export default function Viewer() {
  const hash = useHash(); // "" = everything, "anais" = one folder, "anais/match-results" = one wireframe
  const shown = wireframes.filter((w) => !hash || w.folder === hash || w.key === hash);

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 h-screen w-60 shrink-0 overflow-y-auto border-r border-line bg-surface p-4 text-sm">
        <a href="#" className="mb-4 block font-bold">DFW Shelter Tracker<br /><span className="font-normal text-muted">Wireframes</span></a>
        {folders.map((f) => (
          <div key={f} className="mb-3">
            <a href={`#${f}`} className={`font-semibold capitalize ${hash === f ? 'underline' : ''}`}>{f}</a>
            <ul className="ml-2 mt-1 space-y-0.5">
              {wireframes.filter((w) => w.folder === f).map((w) => (
                <li key={w.key}>
                  <a href={`#${w.key}`} className={hash === w.key ? 'font-semibold' : 'text-muted'}>
                    {w.meta.uc ?? '?'} · {w.meta.title ?? w.file}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
        {wireframes.length === 0 && <p className="text-muted">No wireframes yet.</p>}
      </aside>

      <main className="flex-1 space-y-12 p-8">
        {shown.map((w) => (
          <section key={w.key} id={w.key}>
            <h2 className="mb-3 text-sm font-semibold text-muted">{w.key}.wf.jsx</h2>
            <div className="flex flex-wrap items-start gap-6">
              {(w.meta.states?.length ? w.meta.states : ['default']).map((state) => (
                <Frame key={state} meta={w.meta} state={state}>
                  <w.Component state={state} />
                </Frame>
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
