import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { currentInstallPlatform, type InstallPlatform } from '../lib/install-platform.ts';
import {
  canPromptToInstall,
  promptToInstall,
  subscribeToInstallPrompt,
} from '../lib/install-prompt.ts';
import {
  AddressBarInstallIcon,
  AddToHomeScreenIcon,
  BrowserMenuIcon,
  CloseIcon,
  DoneIcon,
  InstallIcon,
  ShareIcon,
  type IconComponent,
} from './icons.tsx';
import styles from './InstallGuide.module.css';

/**
 * The guide opens by itself at this address, so a link to it can be shared with someone who asks
 * for "the app": there is no page to maintain, and the app itself is already on screen behind it.
 */
const INSTALL_HASH = '#install';

/** The device this page is being read on. It does not change while the page is open. */
const DEVICE = currentInstallPlatform();

/**
 * How the dialog opens, set by the one that is mounted. The app keeps every view mounted at once,
 * so there is more than one footer in the page and more than one link into this guide, but only
 * ever one dialog — rendered by `mount()`, outside the views, where nothing can hide it halfway
 * through a switch.
 */
let showGuide: (() => void) | null = null;

/** The footer's entry point: see `InstallGuideDialog` for what it opens. */
export function InstallLink() {
  return (
    <button
      type="button"
      className={styles.trigger}
      // Named here, not by the word beside the arrow: on phones the arrow stands on its own.
      title="Instalar la app"
      aria-label="Instalar la app"
      onClick={() => {
        showGuide?.();
      }}
    >
      <InstallIcon />
      <span className={styles.triggerLabel}>Instalar</span>
    </button>
  );
}

interface Step {
  /** The glyph of the button the step names, as that button wears it. */
  readonly icon: IconComponent;
  readonly text: ReactNode;
}

interface PlatformGuide {
  /** The device's name, on the switch between the three sets of steps. */
  readonly label: string;
  readonly steps: readonly Step[];
  /** What holds for the platform but not for the steps: another browser, another menu. */
  readonly note?: ReactNode;
}

/** Every browser keeps this feature somewhere else; these are the three shapes of it. */
const GUIDES: Record<InstallPlatform, PlatformGuide> = {
  ios: {
    label: 'iPhone',
    steps: [
      {
        icon: ShareIcon,
        text: <>Toca el botón de compartir en la barra de herramientas de Safari.</>,
      },
      {
        icon: AddToHomeScreenIcon,
        text: (
          <>
            Desplázate hacia abajo y elige <b>Añadir a pantalla de inicio</b>.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Toca <b>Añadir</b>. La app se une a las demás en tu pantalla de inicio.
          </>
        ),
      },
    ],
    note: (
      <>
        Safari siempre lo ofrece. Chrome, Edge y Firefox en un iPhone o iPad comparten el mismo menú
        y lo ofrecen donde lo admiten.
      </>
    ),
  },
  android: {
    label: 'Android',
    steps: [
      { icon: BrowserMenuIcon, text: <>Abre el menú de la barra de herramientas de Chrome.</> },
      {
        icon: AddToHomeScreenIcon,
        text: (
          <>
            Elige <b>Instalar app</b> o <b>Añadir a la pantalla de inicio</b>.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Confirma con <b>Instalar</b>.
          </>
        ),
      },
    ],
  },
  desktop: {
    label: 'Computador',
    steps: [
      {
        icon: AddressBarInstallIcon,
        text: (
          <>
            En Chrome o Edge, haz clic en el botón de instalar al final de la barra de direcciones.
          </>
        ),
      },
      {
        icon: DoneIcon,
        text: (
          <>
            Elige <b>Instalar</b>. La app se abre en su propia ventana.
          </>
        ),
      },
    ],
    note: (
      <>
        Safari en una Mac instala desde <b>Compartir → Añadir al Dock</b>. Firefox no instala apps
        web, pero el sitio igualmente funciona sin conexión una vez que lo abriste.
      </>
    ),
  },
};

const PLATFORMS: readonly InstallPlatform[] = ['ios', 'android', 'desktop'];

/**
 * How to keep the app on a home screen and read it with no connection. It opens from the footer's
 * quietest link, which hides itself once the app is installed (the stylesheet asks the browser how
 * the page is being displayed), and from the address this page ends in `#install`.
 */
export function InstallGuideDialog() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [platform, setPlatform] = useState<InstallPlatform>(DEVICE);
  // Chromium can do the whole thing itself where it has offered to; everywhere else the steps are
  // all there is. The offer can arrive after this has rendered, and is spent once it is taken.
  const canPrompt = useSyncExternalStore(subscribeToInstallPrompt, canPromptToInstall, () => false);
  const guide = GUIDES[platform];

  useEffect(() => {
    const open = () => {
      const dialog = dialogRef.current;
      if (dialog && !dialog.open) {
        dialog.showModal();
      }
    };
    const openFromAddress = () => {
      if (window.location.hash === INSTALL_HASH) {
        open();
      }
    };
    showGuide = open;
    openFromAddress();
    window.addEventListener('hashchange', openFromAddress);
    return () => {
      showGuide = null;
      window.removeEventListener('hashchange', openFromAddress);
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-labelledby="install-guide-title"
      // A modal dialog is handed the clicks that land beside it, which is how it closes: a tap
      // outside is how every sheet on a phone is dismissed. Two things are not that tap. Its own
      // scrollbar belongs to the dialog, so the point is measured against the card's own edges;
      // and the second half of a double-click on the link that opened it lands on the backdrop
      // that has just appeared under the pointer, which would shut the dialog before it is read.
      onClick={(event) => {
        const dialog = dialogRef.current;
        if (!dialog || event.target !== dialog || event.detail > 1) {
          return;
        }
        const { top, right, bottom, left } = dialog.getBoundingClientRect();
        const { clientX, clientY } = event;
        if (clientX < left || clientX > right || clientY < top || clientY > bottom) {
          dialog.close();
        }
      }}
      onClose={() => {
        // The address can be shared; it should not stay behind in the reader's own.
        if (window.location.hash === INSTALL_HASH) {
          window.history.replaceState(
            null,
            '',
            `${window.location.pathname}${window.location.search}`,
          );
        }
      }}
    >
      <div className={styles.card}>
        <div className={styles.head}>
          <h2 id="install-guide-title" className={styles.title}>
            Instalar la app
          </h2>
          <button
            type="button"
            className={styles.close}
            aria-label="Cerrar"
            onClick={() => {
              dialogRef.current?.close();
            }}
          >
            <CloseIcon />
          </button>
        </div>
        <p className={styles.lede}>
          Tenla en tu pantalla de inicio y léela sin conexión. Sin tienda de apps ni cuenta.
        </p>
        {canPrompt && (
          <button
            type="button"
            className={styles.action}
            onClick={() => {
              void promptToInstall();
            }}
          >
            <InstallIcon />
            Instalar ahora
          </button>
        )}
        <div className={styles.tabs} role="group" aria-label="Dispositivo">
          {PLATFORMS.map((option) => (
            <button
              key={option}
              type="button"
              className={styles.tab}
              aria-pressed={option === platform}
              onClick={() => {
                setPlatform(option);
              }}
            >
              {GUIDES[option].label}
            </button>
          ))}
        </div>
        <ol className={styles.steps}>
          {guide.steps.map((step, index) => (
            <li key={index} className={styles.step}>
              <span className={styles.stepIcon}>
                <step.icon />
              </span>
              <span>{step.text}</span>
            </li>
          ))}
        </ol>
        {guide.note !== undefined && <p className={styles.note}>{guide.note}</p>}
        <p className={styles.note}>
          Abre la app una vez con conexión: es cuando guarda en tu dispositivo el texto bíblico y
          las referencias cruzadas.
        </p>
      </div>
    </dialog>
  );
}
