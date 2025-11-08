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
import ConfirmModal from '../components/ConfirmModal';
import useWindowSize from '../hooks/useWindowSize';

// IMPORTS NOUVEAUX
import CoachInboxPage from './CoachInboxPage';
import CoachChatPage from './CoachChatPage';

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
  
  // États de navigation existants
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [historyClient, setHistoryClient] = useState(null);
  const [isCreatingProgram, setIsCreatingProgram] = useState(false);
  
  // NOUVEAU : État pour le client avec qui on chatte
  const [chatClient, setChatClient] = useState(null);

  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState(false);

  const [isDirty, setIsDirty] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

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

  const handleNavigation = (targetView) => {
      if (targetView === activeView && !selectedClient && !selectedProgramId && !isCreatingProgram && !chatClient) return;

      if (isDirty) {
          setPendingNavigation(() => () => performNavigation(targetView));
          setShowUnsavedModal(true);
      } else {
          performNavigation(targetView);
      }
  };

  const performNavigation = (targetView) => {
      // Reset de tous les états de sous-page
      setSelectedClient(null);
      setSelectedProgramId(null);
      setHistoryClient(null);
      setIsCreatingProgram(false);
      setChatClient(null); // Reset du chat

      setActiveView(targetView);
      setIsDirty(false);
      setShowUnsavedModal(false);
  };

  const handleBack = (force = false) => {
      const isForced = (force === true);

      if (!isForced && isDirty) {
          setPendingNavigation(() => () => {
             // Reset complet force si on confirme quitter
             performNavigation(activeView); // Revient à la vue principale courante
          });
          setShowUnsavedModal(true);
      } else {
          // Logique de retour standard
          if (selectedProgramId || isCreatingProgram) {
              setSelectedProgramId(null); setIsCreatingProgram(false); fetchData();
          } else if (chatClient) {
              // Si on était dans un chat, on revient là d'où on venait.
              // Simplification : si on est dans l'onglet 'messages', on revient à la liste inbox.
              // Si on est dans 'clients', on revient au détail client.
              setChatClient(null); 
          } else if (historyClient) {
              setHistoryClient(null);
          } else if (selectedClient) {
              setSelectedClient(null);
          }
      }
  }

  // Handler pour ouvrir le chat depuis n'importe où
  const handleOpenChat = (clientToChatWith) => {
      setChatClient(clientToChatWith);
      // Optionnel : si on veut que l'onglet actif devienne 'messages' quand on ouvre un chat
      // setActiveView('messages'); 
  };

  const confirmNavigation = () => {
      if (pendingNavigation) pendingNavigation();
      setPendingNavigation(null);
      setShowUnsavedModal(false);
  };

  const cancelNavigation = () => {
      setPendingNavigation(null);
      setShowUnsavedModal(false);
  };

  const renderActiveView = () => {
    // 1. Les vues "prioritaires" (sous-pages)
    if (chatClient) {
        return <CoachChatPage client={chatClient} onBack={() => handleBack()} isDesktop={isDesktop} />;
    }
    if (historyClient) {
      return <ClientHistoryPage client={historyClient} onBack={() => handleBack()} />;
    }
    if (selectedClient) {
      return <ClientDetailPage
                client={selectedClient}
                programs={programs}
                onBack={() => handleBack()}
                onClientAction={() => { fetchData(); setSelectedClient(null); }}
                onViewHistory={setHistoryClient}
                onOpenChat={handleOpenChat} // Nouveau prop
              />;
    }
    if (isCreatingProgram || selectedProgramId) {
        return <ProgramEditorPage
                    programId={isCreatingProgram ? 'new' : selectedProgramId}
                    onBack={handleBack}
                    onDirtyChange={setIsDirty}
                />
    }

    // 2. Les vues principales (onglets)
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
      case 'messages': // NOUVEAU CAS
        return <CoachInboxPage 
                    onSelectClient={handleOpenChat}
                />;
      case 'library':
        return <ExerciseLibraryPage 
                  isModalOpen={isLibraryModalOpen}
                  setIsModalOpen={setIsLibraryModalOpen}
                />;
      case 'account':
        return <AccountPage />;
      default:
        return <ClientsPage clients={clients} loading={loading} onSelectClient={setSelectedClient} onClientAdded={fetchData} isModalOpen={isAddClientModalOpen} setIsModalOpen={setIsAddClientModalOpen} />;
    }
  };

  const showNav = isDesktop || (
                  !selectedClient && 
                  !selectedProgramId && 
                  !historyClient && 
                  !isCreatingProgram &&
                  !chatClient // Cache la nav mobile si dans un chat
                );

  return (
    <div className={`dashboard-layout coach-dashboard ${isDesktop ? 'desktop' : 'mobile'}`}>
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && <BottomNav activeView={activeView} setActiveView={handleNavigation} />}

      {showUnsavedModal && (
          <ConfirmModal
              title="Modifications non enregistrées"
              message="Vous avez des modifications en cours. Si vous quittez cette page, elles seront perdues. Voulez-vous vraiment quitter ?"
              confirmText="Quitter sans sauvegarder"
              cancelText="Rester"
              onConfirm={confirmNavigation}
              onCancel={cancelNavigation}
          />
      )}
    </div>
  );
};

export default CoachDashboardPage;