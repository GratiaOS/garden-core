import * as React from 'react';
import { Field } from '@garden/ui';

export function FieldDemo() {
  const [name, setName] = React.useState('');
  const [nameError, setNameError] = React.useState<string | null>(null);

  const [email, setEmail] = React.useState('');
  const [emailError, setEmailError] = React.useState<string | null>(null);

  const [password, setPassword] = React.useState('');
  const [passwordState, setPasswordState] = React.useState<'success' | 'warning' | null>(null);
  const [passwordHint, setPasswordHint] = React.useState<string | null>(null);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setName(v);
    setNameError(v.length < 3 ? 'Must be at least 3 characters.' : null);
  }

  function handleEmailChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setEmail(v);
    // Simple email validation for demo purposes
    const emailValid = /\S+@\S+\.\S+/.test(v);
    setEmailError(v.length > 0 && !emailValid ? 'Please enter a valid email address.' : null);
  }

  function handlePasswordChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setPassword(v);
    if (v.length === 0) {
      setPasswordState(null);
      setPasswordHint(null);
    } else if (v.length < 6) {
      setPasswordState('warning');
      setPasswordHint('Password is too short.');
    } else {
      setPasswordState('success');
      setPasswordHint('Password looks good.');
    }
  }

  return (
    <div className="space-y-6">
      <Field label="Your name" description="Please enter at least 3 characters." error={nameError}>
        <input value={name} onChange={handleNameChange} className="input-base" placeholder="Type here…" />
      </Field>

      <Field label="Email" description="We won’t share it with anyone." required hint="We’ll send a confirmation email." error={emailError}>
        <input type="email" value={email} onChange={handleEmailChange} className="input-base" placeholder="example@email.com" />
      </Field>

      <Field label="Password" hint={passwordHint || undefined} data-state={passwordState || undefined}>
        <input type="password" value={password} onChange={handlePasswordChange} className="input-base" placeholder="Enter your password" />
      </Field>
    </div>
  );
}
