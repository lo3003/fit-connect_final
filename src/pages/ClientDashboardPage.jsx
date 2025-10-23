// src/pages/ClientDashboardPage.jsx
import React, { useState, useCallback, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import ClientBottomNav from '../components/ClientBottomNav';
import ClientProgramPage from './ClientProgramPage';
import ClientProgramDetailPage from './ClientProgramDetailPage';

const ClientAccountPage = ({ client, onLogout }) => ( /* ... (Pas de changement ici) ... */
    <div className="screen"><div className="content-centered"><h2>Mon Compte</h2><p>Connecté en tant que {client.full_name}</p><div className="button-group"><button className="secondary" onClick={onLogout}>Se déconnecter</button></div></div></div>
);

const ClientDashboardPage = ({ client, onLogout }) => {
  const [activeView, setActiveView] = useState('program');
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchClientData = useCallback(async () => {
    setLoading(true);
    const { data: programsData } = await supabase
      .from('client_programs')
      .select(`*, programs (*, exercises (*))`)
      .eq('client_id', client.id);
    if (programsData) setAssignedPrograms(programsData);

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
                client={client} // On passe les infos du client
                onBack={() => setSelectedAssignment(null)}
                onWorkoutLogged={fetchClientData} // On rafraîchit tout après un log
              />;
    }

    switch (activeView) {
      case 'program':
        return <ClientProgramPage assignedPrograms={assignedPrograms} workoutLogs={workoutLogs} loading={loading} onSelectProgram={setSelectedAssignment} />;
      case 'account':
        return <ClientAccountPage client={client} onLogout={onLogout} />;
      default:
        return <ClientProgramPage assignedPrograms={assignedPrograms} workoutLogs={workoutLogs} loading={loading} onSelectProgram={setSelectedAssignment} />;
    }
  };

  const showNav = !selectedAssignment;

  return (
    <div className="dashboard-layout">
      <main className="dashboard-content">
        {renderActiveView()}
      </main>
      {showNav && <ClientBottomNav activeView={activeView} setActiveView={setActiveView} />}
    </div>
  );
};

export default ClientDashboardPage;