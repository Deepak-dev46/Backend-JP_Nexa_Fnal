import React from 'react';
import { Chrome, Github } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export default function SocialAuthButtons({ mode = 'register' }) {
  const verb = mode === 'login' ? 'Continue with' : 'Sign up with';
  const providers = [
    { name: 'Google', icon: <Chrome size={18} />, className: 'social-google', path: '/auth/google' },
    { name: 'GitHub', icon: <Github size={18} />, className: 'social-github', path: '/auth/github' },
  ];

  return (
    <div className="social-auth-list">
      {providers.map((provider) => (
        <button
          type="button"
          key={provider.name}
          className={`social-auth-button ${provider.className}`}
          onClick={() => { window.location.href = `${API_BASE_URL}${provider.path}`; }}
        >
          {provider.icon}<span>{verb} {provider.name}</span>
        </button>
      ))}
    </div>
  );
}
