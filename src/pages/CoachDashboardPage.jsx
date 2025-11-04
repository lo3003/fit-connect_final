// src/pages/CoachDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import BottomNav from '../components/BottomNav';
import { supabase } from '../services/supabaseClient';
import ClientsPage from './ClientsPage';
import ClientDetailPage from './ClientDetailPage';
import ProgramsPage from './ProgramsPage';
import ProgramEditorPage from './ProgramEditorPage';
import ClientHistoryPage from './ClientHistoryPage';
import ExerciseLibraryPage from './ExerciseLibraryPage';
import useWindowSize from '../hooks/useWindowSize'; 

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
  const [activeView, setActiveView] = useState('clients');
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const [clients, setClients] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const { width } = useWindowSize(); 
  const isDesktop = width > 900; 

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
      fetchData();
  }

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
    if (isCreatingProgram || selectedProgramId) {
        return <ProgramEditorPage
                    programId={isCreatingProgram ? 'new' : selectedProgramId}
                    onBack={handleBackFromEditor}
                />
    }

    switch (activeView) {
      case 'clients':
        return <ClientsPage 
                  clients={clients} 
                  loading={loading} 
                  onSelectClient={setSelectedClient} 
                  onClientAdded={fetchData} 
                  isModalOpen={isAddClientModalOpen}
                  setIsModalOpen={setIsAddClientModalOpen}
                />;
      case 'programs':
        return <ProgramsPage
                    programs={programs}
                    loading={loading}
                    onSelectProgram={(program) => setSelectedProgramId(program.id)}
                    onNewProgram={() => setIsCreatingProgram(true)}
                />;
      case 'library':
        return <ExerciseLibraryPage 
                  isModalOpen={isLibraryModalOpen}
                  setIsModalOpen={setIsLibraryModalOpen}
                />;
      case 'account':
        return <AccountPage />;
      default:
        return <ClientsPage 
                  clients={clients} 
                  loading={loading} 
                  onSelectClient={setSelectedClient} 
                  onClientAdded={fetchData} 
                  isModalOpen={isAddClientModalOpen}
                  setIsModalOpen={setIsAddClientModalOpen}
                />;
    }
  };

  const showNav = isDesktop || (
                  !selectedClient && 
                  !selectedProgramId && 
                  !historyClient && 
                  !isCreatingProgram && 
                  !isAddClientModalOpen &&
                  !isLibraryModalOpen
                );

  return (
    // --- MODIFICATION ICI : Ajout de la classe "coach-dashboard" ---
    <div className={`dashboard-layout coach-dashboard ${isDesktop ? 'desktop' : 'mobile'}`}>
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && <BottomNav activeView={activeView} setActiveView={setActiveView} />}
    </div>
  );
};

export default CoachDashboardPage;