import { useState } from 'react';
import { AuthAPI, parseError } from '../api.js';

export default function AuthPage({ onLoggedIn }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [form, setForm] = useState({ firstname: '', lastname: '', username: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});
  const [info, setInfo] = useState('');

  const isLogin = mode === 'login';
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setFields({});
    setInfo('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setFields({});
    setInfo('');

    if (!isLogin) {
      const passwordLength = Array.from(form.password).length;
      const passwordBytes = new TextEncoder().encode(form.password).length;
      if (passwordLength < 8 || passwordBytes > 72) {
        setFields({
          password: 'Use at least 8 characters and no more than 72 bytes.',
        });
        setLoading(false);
        return;
      }
    }

    try {
      if (isLogin) {
        const data = await AuthAPI.login(form.email.trim(), form.password);
        onLoggedIn(data);
      } else {
        await AuthAPI.register(
          form.firstname.trim(),
          form.lastname.trim(),
          form.username.trim(),
          form.email.trim(),
          form.password
        );
        setInfo('Account created! You can now log in.');
        setMode('login');
        setForm({ firstname: '', lastname: '', username: '', email: form.email.trim(), password: '' });
      }
    } catch (err) {
      const parsed = parseError(err);
      setError(parsed.message);
      setFields(parsed.fields);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>Product Management</h1>
        <p className="muted">{isLogin ? 'Log in to manage your products' : 'Create an account'}</p>

        {info && <div className="alert success">{info}</div>}
        {error && <div className="alert error">{error}</div>}

        {!isLogin && (
          <>
          <div className="row">
            <label>
              First name
              <input value={form.firstname} onChange={update('firstname')} autoComplete="given-name" maxLength={100} required />
              {fields.firstname && <span className="field-error">{fields.firstname}</span>}
            </label>
            <label>
              Last name
              <input value={form.lastname} onChange={update('lastname')} autoComplete="family-name" maxLength={100} required />
              {fields.lastname && <span className="field-error">{fields.lastname}</span>}
            </label>
          </div>
          <label>
            Username
            <input value={form.username} onChange={update('username')} autoComplete="username" minLength={3} maxLength={100} required />
            {fields.username && <span className="field-error">{fields.username}</span>}
          </label>
          </>
        )}

        <label>
          Email {isLogin && <span className="muted">(or username)</span>}
          <input
            type={isLogin ? 'text' : 'email'}
            value={form.email}
            onChange={update('email')}
            autoComplete="email"
            maxLength={255}
            required
          />
          {fields.email && <span className="field-error">{fields.email}</span>}
        </label>

        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={update('password')}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            aria-describedby={!isLogin ? 'password-requirements' : undefined}
            required
          />
          {!isLogin && (
            <span id="password-requirements" className="muted">
              Use at least 8 characters and no more than 72 bytes.
            </span>
          )}
          {fields.password && <span className="field-error">{fields.password}</span>}
        </label>

        <button className="btn primary" disabled={loading}>
          {loading ? 'Please wait…' : isLogin ? 'Login' : 'Register'}
        </button>

        <p className="switch">
          {isLogin ? (
            <>No account yet? <button type="button" className="link" onClick={() => switchMode('register')}>Register</button></>
          ) : (
            <>Already registered? <button type="button" className="link" onClick={() => switchMode('login')}>Login</button></>
          )}
        </p>
      </form>
    </div>
  );
}
