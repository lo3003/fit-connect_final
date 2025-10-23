// src/pages/CoachDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../services/supabaseClient';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import ProgramsPage from './ProgramsPage';
import ProgramEditorPage from './ProgramEditorPage'; // Renommé de ProgramDetailPage
import ClientHistoryPage from './ClientHistoryPage';

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
  const [activeView, setActiveView] = useState('clients');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null); // On ne garde que l'ID
  const [historyClient, setHistoryClient] = useState(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false); // Nouvel état pour la création

  // --- STATES DE DONNÉES ---
  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- GESTION DES DONNÉES ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: clientsData } = await supabase.from('clients').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
      if (clientsData) setClients(clientsData);

      const { data: programsData } = await supabase.from('programs').select('*').eq('coach_id', user.id).order('created_at', { ascending: false });
      if (programsData) setPrograms(programsData);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleBackFromEditor = () => {
      setSelectedProgramId(null);
      setIsCreatingProgram(false);
      fetchData(); // Rafraîchir les données au cas où il y a eu des changements
  }

  // --- AFFICHAGE CONDITIONNEL DES PAGES ---
  const renderActiveView = () => {
    if (historyClient) {
      return <ClientHistoryPage client={historyClient} onBack={() => setHistoryClient(null)} />;
    }
    if (selectedClient) {
      return <ClientDetailPage
                client={selectedClient}
                programs={programs}
                onBack={() => setSelectedClient(null)}
                onClientAction={() => { fetchData(); setSelectedClient(null); }}
                onViewHistory={setHistoryClient}
              />;
    }
    // Vue de création ou d'édition de programme
    if (isCreatingProgram || selectedProgramId) {
        return <ProgramEditorPage
                    programId={isCreatingProgram ? 'new' : selectedProgramId}
                    onBack={handleBackFromEditor}
                />
    }

    switch (activeView) {
      case 'clients':
        return <ClientsPage clients={clients} loading={loading} onSelectClient={setSelectedClient} onClientAdded={fetchData} />;
      case 'programs':
        return <ProgramsPage
                    programs={programs}
                    loading={loading}
                    onSelectProgram={(program) => setSelectedProgramId(program.id)}
                    onNewProgram={() => setIsCreatingProgram(true)}
                />;
      case 'account':
        return <AccountPage />;
      default:
        return <ClientsPage clients={clients} loading={loading} onSelectClient={setSelectedClient} onClientAdded={fetchData} />;
    }
  };

  const showNav = !selectedClient && !selectedProgramId && !historyClient && !isCreatingProgram;

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