// src/pages/ClientDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ClientBottomNav from '../components/ClientBottomNav';
import ClientHeaderNav from '../components/ClientHeaderNav'; // 1. Importer le Header
import useWindowSize from '../hooks/useWindowSize'; // 2. Importer le hook
import ClientProgramPage from './ClientProgramPage';
import ClientProgramDetailPage from './ClientProgramDetailPage';

const ClientAccountPage = ({ client, onLogout }) => (
    <div className="screen">
        <div className="content-centered">
            <h2>Mon Compte</h2>
            <p>Connecté en tant que {client.full_name}</p>
            <div className="button-group">
                <button className="secondary" onClick={onLogout}>Se déconnecter</button>
            </div>
        </div>
    </div>
);

const ClientDashboardPage = ({ client, onLogout }) => {
  const [activeView, setActiveView] = useState('program');
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const { width } = useWindowSize(); // 3. Utiliser le hook
  const isDesktop = width > 900;

  const fetchClientData = useCallback(async () => {
    setLoading(true);
    const { data: programsData } = await supabase
      .from('client_programs')
      .select(`*, programs (*, exercises (*))`)
      .eq('client_id', client.id);
      
    if (programsData) {
        // On filtre les assignations dont le programme a été supprimé
        const validPrograms = programsData.filter(assignment => assignment.programs);
        setAssignedPrograms(validPrograms);
    }

    const { data: logsData } = await supabase.from('workout_logs').select('*').eq('client_id', client.id);
    if (logsData) setWorkoutLogs(logsData);
    
    setLoading(false);
  }, [client.id]);

  useEffect(() => {
    fetchClientData();
  }, [fetchClientData]);

  const renderActiveView = () => {
    if (selectedAssignment) {
      return <ClientProgramDetailPage 
                assignment={selectedAssignment} 
                client={client}
                onBack={() => setSelectedAssignment(null)}
                onWorkoutLogged={fetchClientData}
              />;
    }

    switch (activeView) {
      case 'program':
        return <ClientProgramPage 
                  client={client} 
                  assignedPrograms={assignedPrograms} 
                  workoutLogs={workoutLogs} 
                  loading={loading} 
                  onSelectProgram={setSelectedAssignment} 
               />;
      case 'account':
        return <ClientAccountPage client={client} onLogout={onLogout} />;
      default:
        return <ClientProgramPage 
                  client={client} 
                  assignedPrograms={assignedPrograms} 
                  workoutLogs={workoutLogs} 
                  loading={loading} 
                  onSelectProgram={setSelectedAssignment} 
               />;
    }
  };

  // 4. La logique pour "montrer la nav" reste la même
  const showNav = !selectedAssignment;

  return (
    // 5. On retire les classes 'desktop'/'mobile' d'ici, App.jsx s'en charge
    <div className="dashboard-layout"> 
      {/* 6. Afficher le Header sur PC, le BottomNav sur Mobile */}
      {showNav && isDesktop && <ClientHeaderNav activeView={activeView} setActiveView={setActiveView} />}
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && !isDesktop && <ClientBottomNav activeView={activeView} setActiveView={setActiveView} />}
    </div>
  );
};

export default ClientDashboardPage;