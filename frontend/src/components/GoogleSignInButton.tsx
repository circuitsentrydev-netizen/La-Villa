import { useEffect, useRef, useState } from 'react';

interface GoogleCredentialResponse {
  credential?: string;
}

interface GoogleIdentityApi {
  initialize: (options: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
  }) => void;
  renderButton: (
    parent: HTMLElement,
    options: {
      type?: 'standard' | 'icon';
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
      shape?: 'rectangular' | 'pill' | 'circle' | 'square';
      width?: number;
      logo_alignment?: 'left' | 'center';
    }
  ) => void;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleIdentityApi;
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  disabled?: boolean;
}

const GOOGLE_SCRIPT_ID = 'google-identity-services-script';

export default function GoogleSignInButton({
  onCredential,
  text = 'continue_with',
  disabled = false,
}: GoogleSignInButtonProps) {
  const buttonContainer = useRef<HTMLDivElement>(null);
  const credentialHandler = useRef(onCredential);
  const [scriptError, setScriptError] = useState('');

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as
    | string
    | undefined;

  useEffect(() => {
    credentialHandler.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) {
      setScriptError(
        'Google sign-in is not configured. Add VITE_GOOGLE_CLIENT_ID to the frontend environment.'
      );
      return;
    }

    let active = true;

    const renderGoogleButton = () => {
      const googleId = window.google?.accounts?.id;
      const container = buttonContainer.current;

      if (!active || !googleId || !container) return;

      googleId.initialize({
        client_id: clientId,
        callback: (response) => {
          if (response.credential) {
            credentialHandler.current(response.credential);
          }
        },
        cancel_on_tap_outside: true,
      });

      container.innerHTML = '';

      googleId.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text,
        shape: 'rectangular',
        width: Math.max(
          240,
          Math.min(container.clientWidth || 360, 400)
        ),
        logo_alignment: 'left',
      });
    };

    let script = document.getElementById(
      GOOGLE_SCRIPT_ID
    ) as HTMLScriptElement | null;

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else if (script) {
      script.addEventListener('load', renderGoogleButton);
      script.addEventListener('error', () => {
        setScriptError(
          'Google sign-in could not load. Check your internet connection.'
        );
      });
    } else {
      script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = renderGoogleButton;
      script.onerror = () => {
        setScriptError(
          'Google sign-in could not load. Check your internet connection.'
        );
      };

      document.head.appendChild(script);
    }

    return () => {
      active = false;
    };
  }, [clientId, text]);

  return (
    <div style={{ width: '100%' }}>
      <div
        ref={buttonContainer}
        aria-label="Continue with Google"
        style={{
          width: '100%',
          minHeight: 44,
          display: 'flex',
          justifyContent: 'center',
          opacity: disabled ? 0.55 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
      />

      {scriptError && (
        <p
          role="alert"
          style={{
            color: '#b91c1c',
            fontSize: 12,
            margin: '8px 0 0',
            textAlign: 'center',
          }}
        >
          {scriptError}
        </p>
      )}
    </div>
  );
}