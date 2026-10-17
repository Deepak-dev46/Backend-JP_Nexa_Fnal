import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function OAuthCallback() {
  const [message, setMessage] = useState('Finishing sign-in…');
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    fetch(`${API_BASE_URL}/api/auth/me`, { credentials: 'include' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Could not verify your sign-in session.');
        return response.json();
      })
      .then(({ user }) => {
        if (!active) return;
        // This is display-only client state. The server session remains the auth source.
        localStorage.setItem('jp_nexa_oauth_user', JSON.stringify(user));
        setMessage(`Signed in${user?.displayName ? ` as ${user.displayName}` : ''}.`);
        navigate('/', { replace: true });
      })
      .catch(() => {
        if (active) setMessage('Sign-in could not be completed. Please try again.');
      });

    return () => { active = false; };
  }, [navigate]);

  return (
    <section className="auth-layout">
      <div className="auth-card">
        <h1>Signing you in</h1>
        <p>{message}</p>
        <Link to="/login">Return to login</Link>
      </div>
    </section>
  );
}
