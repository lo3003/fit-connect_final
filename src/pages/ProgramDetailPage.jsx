// src/pages/ProgramDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

import AddExerciseModal from '../components/AddExerciseModal';
import EditExerciseModal from '../components/EditExerciseModal'; // On va créer ce fichier
import ConfirmModal from '../components/ConfirmModal';
import EditProgramModal from '../components/EditProgramModal';

const OptionsIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="5" cy="12" r="2"/></svg>
);

const ProgramDetailPage = ({ program, onBack, onProgramAction }) => {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useNotification();
  
  // États pour les modales
  const [isAddExoModalOpen, setIsAddExoModalOpen] = useState(false);
  const [isEditProgModalOpen, setIsEditProgModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);
  
  // État pour le menu d'options de l'exercice
  const [activeMenu, setActiveMenu] = useState(null);

  const fetchExercises = useCallback(async () => {
    const { data } = await supabase.from('exercises').select('*').eq('program_id', program.id).order('id', { ascending: true });
    if (data) setExercises(data);
    setLoading(false);
  }, [program.id]);

  useEffect(() => { setLoading(true); fetchExercises(); }, [fetchExercises]);

  const handleDeleteExercise = async () => {
    try {
      const { error } = await supabase.from('exercises').delete().eq('id', exerciseToDelete.id);
      if (error) throw error;
      addToast('success', `Exercice "${exerciseToDelete.name}" supprimé.`);
      setExerciseToDelete(null);
      fetchExercises(); // Rafraîchit la liste
    } catch (error) {
      addToast('error', error.message);
    }
  };

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={onBack}>← Retour aux programmes</a>
      
      <div className="detail-header">
        <div>
          <h1>{program.name}</h1>
          <p className="subtitle">{program.type}</p>
        </div>
        <div className="header-actions">
            <button className="icon-button" onClick={() => setIsEditProgModalOpen(true)} title="Modifier le programme">✏️</button>
            <button className="icon-button" onClick={() => onProgramAction()} title="Supprimer le programme">🗑️</button>
        </div>
      </div>
      
      <div className="page-header" style={{marginTop: '20px'}}>
        <h3>Exercices</h3>
        <button className="add-button" onClick={() => setIsAddExoModalOpen(true)}>+</button>
      </div>

      {loading && <p className="loading-text">Chargement...</p>}
      {!loading && exercises.length === 0 && <div className="empty-state"><p>Aucun exercice dans ce programme.</p></div>}
      
      {!loading && exercises.length > 0 && (
        <div className="exercise-list">
          {exercises.map(exo => (
            <div key={exo.id} className="exercise-card">
              <div className="exercise-card-info">
                <h3>{exo.name}</h3>
                {program.type === 'Renforcement' && <p>{exo.sets} séries × {exo.reps} reps</p>}
                {program.type === 'Cardio' && <p>{exo.duration_minutes} min - Intensité {exo.intensity}</p>}
              </div>
              <div className="exercise-card-actions">
                <button className="options-button" onClick={() => setActiveMenu(activeMenu === exo.id ? null : exo.id)}>
                    <OptionsIcon />
                </button>
                {activeMenu === exo.id && (
                    <div className="options-menu">
                        <button onClick={() => { setExerciseToEdit(exo); setActiveMenu(null); }}>Modifier</button>
                        <button onClick={() => { setExerciseToDelete(exo); setActiveMenu(null); }}>Supprimer</button>
                    </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Les modales */}
      {isAddExoModalOpen && <AddExerciseModal program={program} onClose={() => setIsAddExoModalOpen(false)} onExerciseAdded={fetchExercises} />}
      {exerciseToEdit && <EditExerciseModal exercise={exerciseToEdit} program={program} onClose={() => setExerciseToEdit(null)} onExerciseUpdated={() => { fetchExercises(); setExerciseToEdit(null); }} />}
      {exerciseToDelete && <ConfirmModal title="Supprimer l'exercice" message={`Êtes-vous sûr de vouloir supprimer "${exerciseToDelete.name}" ?`} onConfirm={handleDeleteExercise} onCancel={() => setExerciseToDelete(null)} />}
      {isEditProgModalOpen && <EditProgramModal program={program} onClose={() => setIsEditProgModalOpen(false)} onProgramUpdated={(updatedProg) => { onProgramAction(updatedProg); setIsEditProgModalOpen(false); }} />}
    </div>
  );
};

export default ProgramDetailPage;