import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import { Sheet, ToastHost, toast } from './components/ui';
import { saveDeviceSettings, useSettingsLoaded, useTheme } from './hooks';
import { db } from './db';
import { autoResolvePhotos } from './lib/photos';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import RecipeEditor from './pages/RecipeEditor';
import ImportPage from './pages/ImportPage';
import CookMode from './pages/CookMode';
import Planner from './pages/Planner';
import Groceries from './pages/Groceries';
import SettingsPage from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Fridge from './pages/Fridge';
import PhotoImport from './pages/PhotoImport';
import AuthPage from './pages/Auth';
import { finishOpenRouterLogin } from './lib/ai/oauth';
import { Logo, LogoMark } from './components/Logo';
import { MergePrompt, SyncBadge, useAuth } from './components/Account';
import { displayName } from './lib/account';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

const NAV: [string, string, string, boolean?][] = [
  ['/', 'home', 'Home', true],
  ['/recipes', 'book', 'Recipes'],
  ['/plan', 'calendar', 'Plan'],
  ['/groceries', 'cart', 'Groceries']
];

const ADD_ACTIONS: { to: string; icon: string; title: string; sub: string; ai?: boolean }[] = [
  { to: '/new', icon: 'edit', title: 'Write a recipe', sub: 'Type or dictate your own' },
  { to: '/import', icon: 'link', title: 'Import a recipe', sub: 'Paste text or a link' },
  { to: '/photo', icon: 'camera', title: 'From a photo', sub: 'Cookbook page, card or dish', ai: true },
  { to: '/fridge', icon: 'leaf', title: 'What can I make?', sub: 'Meals from what you have', ai: true },
  { to: '/plan?generate=1', icon: 'calendar', title: 'Plan my week', sub: 'Fits your kitchen & budget' },
  { to: '/groceries', icon: 'cart', title: 'Add groceries', sub: 'Quick-add to your list' }
];

function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  return (
    <Sheet open={open} onClose={onClose} title="Create">
      <div className="action-grid">
        {ADD_ACTIONS.map(a => (
          <button key={a.to} className="action-tile" onClick={() => { onClose(); nav(a.to); }}>
            <span className="action-ico"><Icon name={a.icon} size={20} /></span>
            <b>{a.title}{a.ai && <span className="ai-pill">AI</span>}</b>
            <small>{a.sub}</small>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

function hiddenChrome(pathname: string) {
  return pathname.startsWith('/cook/') || pathname.endsWith('/edit') || pathname === '/new' || pathname === '/import' || pathname === '/photo';
}

function TabBar() {
  const { pathname } = useLocation();
  const [addOpen, setAddOpen] = useState(false);
  if (hiddenChrome(pathname)) return null;
  const tab = ([to, icon, label, end]: (typeof NAV)[number]) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </NavLink>
  );
  return (
    <>
      <nav className="tabbar" aria-label="Main">
        {tab(NAV[0])}{tab(NAV[1])}
        <button className="tab-plus" aria-label="Create" onClick={() => setAddOpen(true)}><Icon name="plus" size={26} strokeWidth={2.4} /></button>
        {tab(NAV[2])}{tab(NAV[3])}
      </nav>
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </>
  );
}

/** Desktop / tablet navigation (≥ 900px). */
function Sidebar() {
  const auth = useAuth();
  const [addOpen, setAddOpen] = useState(false);
  const name = displayName(auth.user);
  return (
    <aside className="sidebar" aria-label="Main">
      <div className="sidebar-logo"><Logo size={34} /></div>
      <button className="btn btn-primary block sidebar-create" onClick={() => setAddOpen(true)}><Icon name="plus" size={18} strokeWidth={2.4} /> Create</button>
      <nav className="sidebar-nav">
        {NAV.map(([to, icon, label, end]) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}>
            <Icon name={icon} size={20} /> {label}
          </NavLink>
        ))}
        <div className="side-label">AI kitchen</div>
        <NavLink to="/fridge" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon name="leaf" size={20} /> What can I make?</NavLink>
        <NavLink to="/photo" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon name="camera" size={20} /> From a photo</NavLink>
        <NavLink to="/import" className={({ isActive }) => `side-link ${isActive ? 'active' : ''}`}><Icon name="link" size={20} /> Import a recipe</NavLink>
      </nav>
      <NavLink to="/settings" className={({ isActive }) => `side-account ${isActive ? 'active' : ''}`}>
        <span className="avatar sm">{(name || 'G')[0].toUpperCase()}</span>
        <span className="grow">
          <b className="truncate">{auth.status === 'signedIn' ? name : 'Guest'}</b>
          <small className="truncate">{auth.status === 'signedIn' ? auth.user?.email : 'Not signed in'}</small>
        </span>
        <SyncBadge />
      </NavLink>
      <AddSheet open={addOpen} onClose={() => setAddOpen(false)} />
    </aside>
  );
}

function Splash() {
  return <div className="boot"><LogoMark size={72} className="boot-mark" /></div>;
}

export default function App() {
  const settings = useSettingsLoaded();
  const auth = useAuth();
  useTheme(settings?.theme ?? 'system');
  const [foodsVer, setFoodsVer] = useState(0);
  useEffect(() => { const f = () => setFoodsVer(v => v + 1); window.addEventListener('savora-foods', f); return () => window.removeEventListener('savora-foods', f); }, []);

  // Returning from OpenRouter's sign-in (?or=1&code=…)
  const ready = !!settings && auth.status !== 'loading';
  useEffect(() => {
    if (!ready) return;
    finishOpenRouterLogin().then(r => {
      if (r === 'connected') { toast('OpenRouter connected'); location.hash = '#/settings#ai'; }
      else if (r === 'failed') { toast('Couldn’t finish connecting. Paste a key in Settings → AI instead.'); location.hash = '#/settings#ai'; }
    });
  }, [ready]);

  // Fetch real photos for the starter recipes whenever we're online
  useEffect(() => {
    if (!settings?.onboarded) return;
    const run = () => autoResolvePhotos(
      async () => (await db.settings.get('settings'))?.photosVersion,
      v => saveDeviceSettings({ photosVersion: v }),
      toast
    );
    run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, [settings?.onboarded]);


  if (!settings || auth.status === 'loading') return <><Splash /><ToastHost /></>;
  if (auth.recovery) return <><AuthPage recovery /><ToastHost /></>;
  if (auth.status === 'signedIn' && auth.merge === 'ask') return <><MergePrompt /><ToastHost /></>;
  if (auth.status === 'signedOut' && !auth.guest) return <><AuthPage /><ToastHost /></>;

  return (
    <HashRouter>
      <ScrollTop />
      {settings.onboarded ? (
        <div className="shell">
          <Sidebar />
          <main className="app">
            <Routes key={foodsVer}>
              <Route path="/" element={<Home />} />
              <Route path="/recipes" element={<Recipes />} />
              <Route path="/recipe/:id" element={<RecipeDetail />} />
              <Route path="/recipe/:id/edit" element={<RecipeEditor />} />
              <Route path="/new" element={<RecipeEditor />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/fridge" element={<Fridge />} />
              <Route path="/photo" element={<PhotoImport />} />
              <Route path="/cook/:id" element={<CookMode />} />
              <Route path="/plan" element={<Planner />} />
              <Route path="/groceries" element={<Groceries />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <TabBar />
        </div>
      ) : (
        <main className="app"><Onboarding /></main>
      )}
      <ToastHost />
    </HashRouter>
  );
}
