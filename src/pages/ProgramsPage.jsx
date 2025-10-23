// src/pages/ProgramsPage.jsx
import React, { useState } from 'react';
import AddProgramModal from '../components/AddProgramModal';

const ProgramsPage = ({ programs, loading, onSelectProgram, onProgramAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Mes Programmes</h1>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>+</button>
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
            // On rend la carte cliquable ici
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
      
      {isModalOpen && <AddProgramModal onClose={() => setIsModalOpen(false)} onProgramAdded={onProgramAdded} />}
    </div>
  );
};

export default ProgramsPage;