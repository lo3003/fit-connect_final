// src/App.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient';
import { NotificationProvider } from './contexts/NotificationContext';
import useWindowSize from './hooks/useWindowSize';

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

  const { width } = useWindowSize();
  const isDesktop = width > 900;

  useEffect(() => {
    // Fonction pour vérifier qui est connecté
    const checkUserRole = async (session) => {
      if (!session) {
        setCoachSession(null);
        setClientSession(null);
        setLoading(false);
        return;
      }

      // 1. Est-ce un Coach ?
      const { data: coachData } = await supabase
        .from('coaches')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();

      if (coachData) {
        setCoachSession(session);
        setClientSession(null);
        setLoading(false);
        return;
      }

      // 2. Est-ce un Client ?
      // On récupère toutes les infos du client car on en aura besoin pour son dashboard
      const { data: clientData } = await supabase
        .from('clients')
        .select('*')
        .eq('auth_user_id', session.user.id)
        .maybeSingle();

      if (clientData) {
        setClientSession(clientData);
        setCoachSession(null);
      } else {
        // Cas rare : utilisateur authentifié mais ni coach ni client (ex: erreur d'inscription)
        console.error("Utilisateur authentifié sans rôle défini.");
        await supabase.auth.signOut(); // On le déconnecte par sécurité
      }
      setLoading(false);
    };

    // Vérification au chargement initial
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUserRole(session);
    });

    // Écoute des changements d'état (connexion/déconnexion)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // On remet loading à true le temps de vérifier le rôle
      setLoading(true);
      checkUserRole(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleClientLogout = async () => {
    await supabase.auth.signOut();
    setClientSession(null);
    setView('home');
  };

  // Reste du rendu (inchangé, sauf handleClientLogin qui n'est plus utile)
  let content;
  let layoutClass = 'layout-mobile-box';

  if (loading) {
    content = <div className="loading-fullscreen">Chargement...</div>;
  } else if (coachSession) {
    content = <CoachDashboardPage />;
    if (isDesktop) layoutClass = 'layout-coach-desktop';
  } else if (clientSession) {
    // Note : On passe handleClientLogout qui fait maintenant un vrai signOut()
    content = <ClientDashboardPage client={clientSession} onLogout={handleClientLogout} />;
    if (isDesktop) layoutClass = 'layout-client-desktop';
  } else {
    switch (view) {
      case 'coach-auth':
        content = <CoachAuthPage setView={setView} />;
        break;
      case 'client-auth':
        // ClientLoginPage gère maintenant sa propre redirection via onAuthStateChange
        content = <ClientLoginPage setView={setView} />;
        break;
      default:
        content = <HomePage setView={setView} />;
    }
  }

  return (
    <NotificationProvider>
      <div className={`app-container ${layoutClass}`}>
        {content}
      </div>
    </NotificationProvider>
  );
}

export default App;