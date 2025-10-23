// src/pages/ClientProgramPage.jsx
import React from 'react';

const ClientProgramPage = ({ assignedPrograms, workoutLogs, loading, onSelectProgram }) => {
  return (
    <div className="screen">
      <h1>Mes Programmes</h1>
      {loading && <p className="loading-text">Chargement...</p>}
      {!loading && assignedPrograms.length === 0 && <div className="empty-state"><p>Aucun programme assigné.</p></div>}
      {!loading && assignedPrograms.length > 0 && (
        <div className="program-list">
          {/* --- LA CORRECTION EST ICI --- */}
          {assignedPrograms
            .filter(assignment => assignment.programs) // On s'assure que le programme lié existe
            .map(assignment => {
              const logsForThisProgram = workoutLogs.filter(log => log.program_id === assignment.programs.id);
              const lastLogDate = logsForThisProgram.length > 0 ? new Date(logsForThisProgram[0].completed_at).toLocaleDateString('fr-FR') : null;
              
              // On s'assure aussi que 'exercises' est bien un tableau
              const exerciseCount = Array.isArray(assignment.programs.exercises) ? assignment.programs.exercises.length : 0;

              return(
                <div key={assignment.id} className="program-card client clickable" onClick={() => onSelectProgram(assignment)}>
                  <div className={`program-icon ${assignment.programs.type.toLowerCase()}`}>
                    {assignment.programs.type === 'Renforcement' ? '💪' : '❤️'}
                  </div>
                  <div className="program-info">
                    <h3>{assignment.programs.name}</h3>
                    {lastLogDate ? (
                      <p className="progress-indicator completed">Terminé le {lastLogDate}</p>
                    ) : (
                      <p className="progress-indicator">{exerciseCount} exercices</p>
                    )}
                  </div>
                  <div className="arrow-indicator">&rarr;</div>
                </div>
              )
          })}
        </div>
      )}
    </div>
  );
};

export default ClientProgramPage;