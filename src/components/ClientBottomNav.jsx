// src/components/ClientBottomNav.jsx
import React from 'react';

// Icônes simples
const ProgramIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#2ecc71' : 'none'} stroke={active ? 'none' : '#8j8d94'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
);
const AccountIcon = ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? '#2ecc71' : 'none'} stroke={active ? 'none' : '#8j8d94'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
);

const ClientBottomNav = ({ activeView, setActiveView }) => {
  return (
    <nav className="bottom-nav">
      <button onClick={() => setActiveView('program')} className={activeView === 'program' ? 'active' : ''}>
        <ProgramIcon active={activeView === 'program'} />
        <span>Mon Programme</span>
      </button>
      <button onClick={() => setActiveView('account')} className={activeView === 'account' ? 'active' : ''}>
        <AccountIcon active={activeView === 'account'} />
        <span>Mon Compte</span>
      </button>
    </nav>
  );
};

export default ClientBottomNav;