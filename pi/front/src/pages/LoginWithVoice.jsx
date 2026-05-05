import { useRef, useCallback } from 'react';
import { VoiceActionsProvider } from '../context/VoiceActionsContext';
import Login from './Login';

const LoginWithVoice = () => {
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  const focusEmail = useCallback(() => {
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.focus();
      emailInputRef.current = emailInput;
    }
  }, []);

  const focusPassword = useCallback(() => {
    const passwordInput = document.querySelector('input[type="password"], input[id="password"]');
    if (passwordInput) {
      passwordInput.focus();
      passwordInputRef.current = passwordInput;
    }
  }, []);

  const setEmail = useCallback((email) => {
    const emailInput = document.querySelector('input[type="email"]');
    if (emailInput) {
      emailInput.value = email;
      emailInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const setPassword = useCallback((password) => {
    const passwordInput = document.querySelector('input[type="password"], input[id="password"]');
    if (passwordInput) {
      passwordInput.value = password;
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  const submit = useCallback(() => {
    const form = document.querySelector('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true }));
    }
  }, []);

  const voiceActions = {
    focusEmail,
    focusPassword,
    setEmail,
    setPassword,
    submit,
  };

  return (
    <VoiceActionsProvider actions={voiceActions}>
      <Login />
    </VoiceActionsProvider>
  );
};

export default LoginWithVoice;
