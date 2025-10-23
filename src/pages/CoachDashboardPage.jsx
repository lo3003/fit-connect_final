// src/pages/CoachDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../services/supabaseClient';
import ClientsPage from './ClientsPage'; 
import ClientDetailPage from './ClientDetailPage';
import ProgramsPage from './ProgramsPage';
import ProgramDetailPage from './ProgramDetailPage';
import ClientHistoryPage from './ClientHistoryPage'; // On importe la nouvelle page d'historique

const AccountPage = () => (
    <div className="screen">
        <div className="content-centered">
            <h2>Mon Compte</h2>
            <div className="button-group">
                <button className="secondary" onClick={() => supabase.auth.signOut()}>
                    Se déconnecter
                </button>
            </div>
        </div>
    </div>
);

const CoachDashboardPage = () => {
  // --- STATES DE NAVIGATION ---
  const [activeView, setActiveView] = useState('clients'); // Vue principale ('clients', 'programs', 'account')
  const [selectedClient, setSelectedClient] = useState(null); // Pour afficher le détail d'un client
  const [selectedProgram, setSelectedProgram] = useState(null); // Pour afficher le détail d'un programme
  const [historyClient, setHistoryClient] = useState(null); // Pour afficher l'historique d'un client

  // --- STATES DE DONNÉES ---
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- GESTION DES DONNÉES ---
  // Fonction unifiée pour récupérer toutes les données du coach
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Récupérer les clients
      const { data: clientsData } = await supabase.from('clients').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
      if (clientsData) setClients(clientsData);

      // Récupérer les programmes
      const { data: programsData } = await supabase.from('programs').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
      if (programsData) setPrograms(programsData);
    }
    setLoading(false);
  }, []);

  // Récupère les données au premier chargement
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- GESTION DES ACTIONS ---
  // Appelé après modification ou suppression d'un client
  const handleClientAction = (updatedClient = null) => {
    fetchData(); // On rafraîchit toutes les données
    setSelectedClient(updatedClient); // On reste sur la page de détail si c'est une modification
  };
  
  // Appelé après modification ou suppression d'un programme
  const handleProgramAction = (updatedProgram = null) => {
    fetchData(); // On rafraîchit toutes les données
    if (updatedProgram) {
      setSelectedProgram(updatedProgram);
    } else {
      setSelectedProgram(null); // On revient à la liste si c'est une suppression
    }
  };

  // --- AFFICHAGE CONDITIONNEL DES PAGES ---
  const renderActiveView = () => {
    // Priorité 1 : Afficher la page d'historique
    if (historyClient) {
      return <ClientHistoryPage client={historyClient} onBack={() => setHistoryClient(null)} />;
    }
    // Priorité 2 : Afficher les pages de détail
    if (selectedClient) {
      return <ClientDetailPage 
                client={selectedClient} 
                programs={programs} 
                onBack={() => setSelectedClient(null)} 
                onClientAction={handleClientAction} 
                onViewHistory={setHistoryClient} // Passe la fonction pour ouvrir l'historique
              />;
    }
    if (selectedProgram) {
      return <ProgramDetailPage program={selectedProgram} onBack={() => setSelectedProgram(null)} onProgramAction={handleProgramAction} />;
    }
    
    // Sinon, afficher la vue principale sélectionnée dans la barre de navigation
    switch (activeView) {
      case 'clients':
        return <ClientsPage clients={clients} loading={loading} onSelectClient={setSelectedClient} onClientAdded={handleClientAction} />;
      case 'programs':
        return <ProgramsPage programs={programs} loading={loading} onSelectProgram={setSelectedProgram} onProgramAdded={handleProgramAction} />;
      case 'account':
        return <AccountPage />;
      default:
        return <ClientsPage clients={clients} loading={loading} onSelectClient={setSelectedClient} onClientAdded={handleClientAction} />;
    }
  };
  
  // On n'affiche la barre de navigation que sur les écrans principaux
  const showNav = !selectedClient && !selectedProgram && !historyClient;

  return (
    <div className="dashboard-layout">
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
    </div>
  );
};

export default CoachDashboardPage;