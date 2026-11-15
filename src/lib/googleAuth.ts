import {
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
} from 'firebase/auth';
import type { UserCredential } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { auth, googleAuthProvider } from './firebase.ts';

interface GisTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GisTokenClient {
  requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
}

interface GoogleAccountsWindow extends Window {
  google?: {
    accounts?: {
      oauth2?: {
        initTokenClient: (config: {
          client_id: string;
          scope: string;
          callback: (resp: GisTokenResponse) => void;
          error_callback?: (err: { type?: string; message?: string }) => void;
        }) => GisTokenClient;
      };
    };
  };
}

function loadGisScript(timeoutMs = 2500): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  const win = window as GoogleAccountsWindow;
  if (win.google?.accounts?.oauth2) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    const timer = window.setTimeout(() => resolve(Boolean(win.google?.accounts?.oauth2)), timeoutMs);

    const onReady = () => {
      window.clearTimeout(timer);
      resolve(Boolean(win.google?.accounts?.oauth2));
    };

    if (existing) {
      existing.addEventListener('load', onReady, { once: true });
      existing.addEventListener('error', () => {
        window.clearTimeout(timer);
        resolve(false);
      }, { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = onReady;
    script.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    document.head.appendChild(script);
  });
}

function signInWithGisTokenClient(clientId: string): Promise<UserCredential> {
  const win = window as GoogleAccountsWindow;
  const oauth2 = win.google?.accounts?.oauth2;
  if (!oauth2) {
    return Promise.reject(new Error('GIS_UNAVAILABLE'));
  }

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: async (resp) => {
        if (resp.error || !resp.access_token) {
          reject(new Error(resp.error_description || resp.error || 'Google sign-in failed.'));
          return;
        }
        try {
          const credential = GoogleAuthProvider.credential(null, resp.access_token);
          const userCred = await signInWithCredential(auth, credential);
          resolve(userCred);
        } catch (err) {
          reject(err);
        }
      },
      error_callback: (err) => {
        if (err?.type === 'popup_closed') {
          reject(new Error('Sign-in popup was closed before completing.'));
        } else {
          reject(new Error(err?.type || 'GIS_POPUP_ERROR'));
        }
      },
    });

    client.requestAccessToken({ prompt: 'select_account' });
  });
}

export async function signInWithGoogleResilient(): Promise<UserCredential> {
  const clientId = firebaseConfig.oAuthClientId;

  if (clientId) {
    const gisLoaded = await loadGisScript();
    if (gisLoaded) {
      try {
        return await signInWithGisTokenClient(clientId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : '';
        // If user explicitly closed the popup, do not immediately open a second popup
        if (msg.includes('closed') || msg.includes('access_denied')) {
          throw err;
        }
        // Otherwise fall back to Firebase signInWithPopup
      }
    }
  }

  return signInWithPopup(auth, googleAuthProvider);
}
