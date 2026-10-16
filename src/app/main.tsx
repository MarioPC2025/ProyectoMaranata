import { mount } from '../shared/lib/mount.tsx';
import { VizDataBoundary } from '../visualizations/shared/components/VizDataBoundary.tsx';
import { translationLoader, vizCoreLoader } from '../visualizations/shared/viz-data.ts';
import { Explorer } from './Explorer.tsx';
import { registerOfflineCache } from './register-offline-cache.ts';
import { initialTranslationId } from './translation-choice.ts';

// The text downloads beside the links rather than after them: which one to show is known from the
// URL (or the reader's last choice) before anything renders. The app awaits it through `use()`;
// this only starts it, so a failure is handled there.
void translationLoader(initialTranslationId(new URL(window.location.href)))
  .load()
  .catch(() => undefined);

mount(<VizDataBoundary>{(core) => <Explorer core={core} />}</VizDataBoundary>);

// Once the data has loaded, the offline cache can keep it: from the HTTP cache, not the network.
vizCoreLoader.load().then(registerOfflineCache, () => undefined);
