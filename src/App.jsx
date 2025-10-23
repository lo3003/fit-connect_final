// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { NotificationProvider } from './contexts/NotificationContext';

import HomePage from './pages/HomePage';
import CoachAuthPage from './pages/CoachAuthPage';
import ClientLoginPage from './pages/ClientLoginPage'; // On importe la nouvelle page
import CoachDashboardPage from './pages/CoachDashboardPage';
import ClientDashboardPage from './pages/ClientDashboardPage'; // On importe la nouvelle page

function App() {
  const [coachSession, setCoachSession] = useState(null);
  const [clientSession, setClientSession] = useState(null);
  const [view, setView] = useState('home'); // Pour la navigation publique
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Vérifier la session du coach (sécurisée, via Supabase)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCoachSession(session);
      
      // 2. Si pas de coach, vérifier la session du client (simple, via localStorage)
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

    // Écouteur pour les changements de session du coach
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setCoachSession(session);
      // Si un coach se connecte/déconnecte, on s'assure que la session client est nulle
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

  const renderContent = () => {
    if (loading) {
      return <div className="loading-fullscreen">Chargement...</div>;
    }
    // Priorité aux sessions actives
    if (coachSession) {
      return <CoachDashboardPage />;
    }
    if (clientSession) {
      return <ClientDashboardPage client={clientSession} onLogout={handleClientLogout} />;
    }
    // Si aucune session, on affiche les pages publiques
    switch (view) {
      case 'coach-auth':
        return <CoachAuthPage setView={setView} />;
      case 'client-auth':
        return <ClientLoginPage onLoginSuccess={handleClientLogin} setView={setView} />;
      default:
        return <HomePage setView={setView} />;
    }
  };

  return (
    <NotificationProvider>
      <div className="app-container">
        {renderContent()}
      </div>
    </NotificationProvider>
  );
}

export default App;