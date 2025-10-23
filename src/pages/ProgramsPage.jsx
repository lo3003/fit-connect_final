// src/pages/ProgramsPage.jsx
import React from 'react';

const ProgramsPage = ({ programs, loading, onSelectProgram, onNewProgram }) => {
  return (
    <div className="screen">
      <div className="page-header">
        <h1>Mes Programmes</h1>
        {/* Ce bouton déclenche maintenant la création via le dashboard */}
        <button className="add-button" onClick={onNewProgram}>+</button>
      </div>

      {loading && <p className="loading-text">Chargement des programmes...</p>}

      {!loading && programs.length === 0 && (
        <div className="empty-state">
          <p>Vous n'avez créé aucun programme.</p>
          <p>Cliquez sur '+' pour commencer.</p>
        </div>
      )}

      {!loading && programs.length > 0 && (
        <div className="program-list">
          {programs.map(program => (
            <div key={program.id} className="program-card clickable" onClick={() => onSelectProgram(program)}>
              <div className={`program-icon ${program.type.toLowerCase()}`}>
                {program.type === 'Renforcement' ? '💪' : '❤️'}
              </div>
              <div className="program-info">
                <h3>{program.name}</h3>
                <p>{program.type}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProgramsPage;