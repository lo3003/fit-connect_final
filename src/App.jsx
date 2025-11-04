// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { NotificationProvider } from './contexts/NotificationContext';
import useWindowSize from './hooks/useWindowSize'; // 1. Importer le hook

import HomePage from './pages/HomePage';
import CoachAuthPage from './pages/CoachAuthPage';
import ClientLoginPage from './pages/ClientLoginPage';
import CoachDashboardPage from './pages/CoachDashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage';

function App() {
  const [coachSession, setCoachSession] = useState(null);
  const [clientSession, setClientSession] = useState(null);
  const [view, setView] = useState('home'); 
  const [loading, setLoading] = useState(true);

  // 2. Utiliser le hook pour la taille de l'écran
  const { width } = useWindowSize();
  const isDesktop = width > 900; // Notre breakpoint PC

  useEffect(() => {
    // ... (la logique useEffect reste la même) ...
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCoachSession(session);
      if (!session) {
        try {
          const storedClient = localStorage.getItem('fitconnect-client');
          if (storedClient) {
            setClientSession(JSON.parse(storedClient));
          }
        } catch (error) {
          console.error("Erreur de parsing de la session client:", error);
          localStorage.removeItem('fitconnect-client');
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCoachSession(session);
      setClientSession(null);
      localStorage.removeItem('fitconnect-client');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClientLogin = (clientData) => {
    setClientSession(clientData);
    localStorage.setItem('fitconnect-client', JSON.stringify(clientData));
  };

  const handleClientLogout = () => {
    setClientSession(null);
    localStorage.removeItem('fitconnect-client');
    setView('home');
  };

  // 3. Déterminer le contenu ET la classe de layout
  let content;
  let layoutClass = 'layout-mobile-box'; // Par défaut: boîte mobile (pour Client, Auth, Accueil)

  if (loading) {
    content = <div className="loading-fullscreen">Chargement...</div>;
  } else if (coachSession) {
    content = <CoachDashboardPage />;
    if (isDesktop) {
      layoutClass = 'layout-coach-desktop'; // Layout sidebar pour Coach PC
    }
  } else if (clientSession) {
    content = <ClientDashboardPage client={clientSession} onLogout={handleClientLogout} />;
    if (isDesktop) {
      layoutClass = 'layout-client-desktop'; // Layout header pour Client PC
    }
  } else {
    // Pages publiques (Auth, Accueil)
    switch (view) {
      case 'coach-auth':
        content = <CoachAuthPage setView={setView} />;
        break;
      case 'client-auth':
        content = <ClientLoginPage onLoginSuccess={handleClientLogin} setView={setView} />;
        break;
      default:
        content = <HomePage setView={setView} />;
    }
    // layoutClass reste 'layout-mobile-box'
  }

  return (
    <NotificationProvider>
      {/* 4. Appliquer la classe de layout dynamique au conteneur */}
      <div className={`app-container ${layoutClass}`}>
        {content}
      </div>
    </NotificationProvider>
  );
}

export default App;