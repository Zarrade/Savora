import { useAuth } from '../components/Account';
import { showSignIn } from '../lib/account';
import { customFoodCount } from '../lib/ingredients';
import { Icon } from '../components/Icon';

export function AISettings() {
  const signedIn = useAuth().status === 'signedIn';
  return (
    <section className="card" id="ai">
      <h2>Savora AI</h2>
      <p className="muted small" style={{ marginTop: -4 }}>
        Powers smart import, “What can I make?”, the cooking helper, photo-to-recipe and smarter swaps.
        Text or photos are sent to the AI only when you tap an AI button.
      </p>
      <div className={`ai-included ${signedIn ? '' : 'off'}`}>
        <span className="ai-included-ico"><Icon name="sparkles" size={20} /></span>
        <div className="grow">
          <b>{signedIn ? 'Free AI is on' : 'Free AI for account holders'}</b>
          <small>{signedIn ? 'Included with your Savora account — up to 20 AI requests a day.' : 'Sign in to use Savora AI for free.'}</small>
        </div>
        {!signedIn && <button className="btn btn-primary btn-sm" onClick={showSignIn}>Sign in</button>}
      </div>
      {customFoodCount() > 0 && <small className="faint" style={{ display: 'block', marginTop: 4 }}>{customFoodCount()} foods added to your nutrition database by AI.</small>}
    </section>
  );
}
