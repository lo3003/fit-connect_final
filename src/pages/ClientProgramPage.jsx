// src/pages/ClientProgramPage.jsx
import React from 'react';

const CheckmarkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" fill="currentColor"/>
  </svg>
);
const PlayIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 5v14l11-7L8 5z" fill="currentColor"/>
    </svg>
);


const ClientProgramPage = ({ assignedPrograms, workoutLogs, loading, onSelectProgram, client }) => {
  const welcomeMessage = (client && client.full_name) 
    ? `Bonjour, ${client.full_name.split(' ')[0]} !`
    : "Bonjour !";

  const featuredAssignment = assignedPrograms.length > 0 ? assignedPrograms[0] : null;
  const otherAssignments = assignedPrograms.slice(1);

  const ProgramCard = ({ assignment, isFeatured = false }) => {
    if (!assignment || !assignment.programs) {
        return null;
    }

    const logsForThisProgram = workoutLogs.filter(log => log.program_id === assignment.programs.id);
    const lastLogDate = logsForThisProgram.length > 0 ? new Date(logsForThisProgram[0].completed_at).toLocaleDateString('fr-FR') : null;
    const exerciseCount = Array.isArray(assignment.programs.exercises) ? assignment.programs.exercises.length : 0;

    if (isFeatured) {
      return (
        <div className="featured-program-card clickable" onClick={() => onSelectProgram(assignment)}>
          <div className="featured-program-info">
            <p>Prochaine séance</p>
            <h3>{assignment.programs.name}</h3>
            <span>{assignment.programs.type} • {exerciseCount} exercices</span>
          </div>
          <button className="start-workout-btn">Commencer</button>
        </div>
      );
    }

    // --- NOUVELLE CARTE DE PROGRAMME AMÉLIORÉE ---
    return (
      <div className="program-card client clickable" onClick={() => onSelectProgram(assignment)}>
        <div className={`program-icon ${assignment.programs.type.toLowerCase()}`}>
          {assignment.programs.type === 'Renforcement' ? '💪' : '❤️'}
        </div>
        <div className="program-info">
          <h3>{assignment.programs.name}</h3>
          <p className="program-stats">
            {assignment.programs.type} • {exerciseCount} exercices
          </p>
        </div>
        <div className={`program-status ${lastLogDate ? 'completed' : 'todo'}`}>
            {lastLogDate ? <CheckmarkIcon /> : <PlayIcon />}
        </div>
      </div>
    );
  };

  return (
    <div className="screen client-dashboard">
      <div className="client-header">
        <h1>{welcomeMessage}</h1>
        <p className="subtitle">Prêt pour votre séance ?</p>
      </div>

      {loading && <p className="loading-text">Chargement...</p>}
      
      {!loading && assignedPrograms.length === 0 && (
        <div className="empty-state"><p>Votre coach ne vous a encore assigné aucun programme.</p></div>
      )}

      {!loading && featuredAssignment && (
        <>
          <ProgramCard assignment={featuredAssignment} isFeatured={true} />
          
          {otherAssignments.length > 0 && (
            <h3 className="other-programs-title">Autres programmes</h3>
          )}

          <div className="program-list">
            {otherAssignments.map(assignment => (
              <ProgramCard key={assignment.id} assignment={assignment} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ClientProgramPage;