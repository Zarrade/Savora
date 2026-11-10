import { HashRouter, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Icon } from './components/Icon';
import { Sheet, ToastHost, toast } from './components/ui';
import { saveSettings, useSettingsLoaded, useTheme } from './hooks';
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
import { finishOpenRouterLogin } from './lib/ai/oauth';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function TabBar() {
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [addOpen, setAddOpen] = useState(false);
  if (pathname.startsWith('/cook/') || pathname.endsWith('/edit') || pathname === '/new' || pathname === '/import' || pathname === '/photo') return null;
  const tab = (to: string, icon: string, label: string, end = false) => (
    <NavLink to={to} end={end} className={({ isActive }) => `tab ${isActive ? 'tab-active' : ''}`}>
      <Icon name={icon} size={22} />
      <span>{label}</span>
    </NavLink>
  );
  return (
    <>
      <nav className="tabbar" aria-label="Main">
        {tab('/', 'home', 'Home', true)}
        {tab('/recipes', 'book', 'Recipes')}
        <button className="tab-plus" aria-label="Add" onClick={() => setAddOpen(true)}><Icon name="plus" size={26} strokeWidth={2.4} /></button>
        {tab('/plan', 'calendar', 'Plan')}
        {tab('/groceries', 'cart', 'Groceries')}
      </nav>
      <Sheet open={addOpen} onClose={() => setAddOpen(false)} title="Add">
        <div className="menu">
          <button onClick={() => { setAddOpen(false); nav('/new'); }}><span style={{ fontSize: 22 }}>✍️</span><span>Write a recipe<small>Type or dictate your own</small></span></button>
          <button onClick={() => { setAddOpen(false); nav('/import'); }}><span style={{ fontSize: 22 }}>📋</span><span>Paste a recipe<small>From a website, caption or note</small></span></button>
          <button onClick={() => { setAddOpen(false); nav('/photo'); }}><span style={{ fontSize: 22 }}>📸</span><span>Recipe from a photo<small>Cookbook page, card or a dish (AI)</small></span></button>
          <button onClick={() => { setAddOpen(false); nav('/fridge'); }}><span style={{ fontSize: 22 }}>🧊</span><span>What can I make?<small>Meals from what you have (AI)</small></span></button>
          <button onClick={() => { setAddOpen(false); nav('/plan?generate=1'); }}><span style={{ fontSize: 22 }}>✨</span><span>Plan my week<small>Meals that fit your kitchen and budget</small></span></button>
          <button onClick={() => { setAddOpen(false); nav('/groceries'); }}><span style={{ fontSize: 22 }}>🛒</span><span>Add to groceries<small>Quick-add items to your list</small></span></button>
        </div>
      </Sheet>
    </>
  );
}

export default function App() {
  const settings = useSettingsLoaded();
  useTheme(settings?.theme ?? 'system');
  const [foodsVer, setFoodsVer] = useState(0);
  useEffect(() => { const f = () => setFoodsVer(v => v + 1); window.addEventListener('savora-foods', f); return () => window.removeEventListener('savora-foods', f); }, []);

  // Returning from OpenRouter's sign-in (?code=…)
  const ready = !!settings; // wait until the toast host is mounted so the result is visible
  useEffect(() => {
    if (!ready) return;
    finishOpenRouterLogin().then(r => {
      if (r === 'connected') { toast('OpenRouter connected ✨'); location.hash = '#/settings#ai'; }
      else if (r === 'failed') { toast('Couldn’t finish connecting. Paste a key in Settings → AI instead.'); location.hash = '#/settings#ai'; }
    });
  }, [ready]);

  // Fetch real photos for the starter recipes whenever we're online
  useEffect(() => {
    if (!settings?.onboarded) return;
    const run = () => autoResolvePhotos(
      async () => (await db.settings.get('settings'))?.photosVersion,
      v => saveSettings({ photosVersion: v }),
      toast
    );
    run();
    window.addEventListener('online', run);
    return () => window.removeEventListener('online', run);
  }, [settings?.onboarded]);

  if (!settings) return <div className="boot" />;
  return (
    <HashRouter>
      <ScrollTop />
      <main className="app">
        {!settings.onboarded ? (
          <Onboarding />
        ) : (
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
        )}
      </main>
      {settings.onboarded && <TabBar />}
      <ToastHost />
    </HashRouter>
  );
}
