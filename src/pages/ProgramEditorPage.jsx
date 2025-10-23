// src/pages/ProgramEditorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';

const ProgramEditorPage = ({ programId, onBack }) => {
  const { addToast } = useNotification();
  const [program, setProgram] = useState({ name: '', type: 'Renforcement' });
  const [exercises, setExercises] = useState([]);
  const [newExercise, setNewExercise] = useState({
    name: '', description: '', sets: '', reps: '', duration_minutes: '', intensity: 'Moyenne',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  const isNewProgram = programId === 'new';

  const fetchProgramData = useCallback(async () => {
    if (isNewProgram) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: programData, error: programError } = await supabase.from('programs').select('*').eq('id', programId).single();
    if (programError) {
      addToast('error', "Impossible de charger le programme.");
      onBack();
      return;
    }
    setProgram(programData);

    const { data: exercisesData } = await supabase.from('exercises').select('*').eq('program_id', programId).order('id', { ascending: true });
    setExercises(exercisesData || []);
    setLoading(false);
  }, [programId, isNewProgram, addToast, onBack]);

  useEffect(() => {
    fetchProgramData();
  }, [fetchProgramData]);

  const handleProgramChange = (e) => {
    const { name, value } = e.target;
    setProgram(p => ({ ...p, [name]: value }));
  };

  const handleNewExerciseChange = (e) => {
    const { name, value } = e.target;
    setNewExercise(ex => ({ ...ex, [name]: value }));
  };

  const handleAddExercise = () => {
    if (!newExercise.name) {
      addToast('error', "Le nom de l'exercice est requis.");
      return;
    }
    setExercises([...exercises, { ...newExercise, id: `temp-${Date.now()}` }]);
    setNewExercise({ name: '', description: '', sets: '', reps: '', duration_minutes: '', intensity: 'Moyenne' });
  };

  const handleDeleteExercise = (id) => {
    setExercises(exercises.filter(ex => ex.id !== id));
    setExerciseToDelete(null);
    addToast('success', "Exercice retiré de la liste.");
  };

  const handleSaveProgram = async () => {
    setIsSaving(true);
    if (!program.name) {
      addToast('error', "Le nom du programme est requis.");
      setIsSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let savedProgram = program;

      if (isNewProgram) {
        const { data, error } = await supabase
          .from('programs')
          .insert({ name: program.name, type: program.type, coach_id: user.id })
          .select()
          .single();
        if (error) throw error;
        savedProgram = data;
      } else {
        const { data, error } = await supabase
          .from('programs')
          .update({ name: program.name, type: program.type })
          .eq('id', program.id)
          .select()
          .single();
        if (error) throw error;
        savedProgram = data;
      }

      await supabase.from('exercises').delete().eq('program_id', savedProgram.id);

      const exercisesToInsert = exercises.map(ex => ({
        program_id: savedProgram.id,
        name: ex.name,
        description: ex.description,
        sets: program.type === 'Renforcement' ? ex.sets : null,
        reps: program.type === 'Renforcement' ? ex.reps : null,
        duration_minutes: program.type === 'Cardio' ? ex.duration_minutes : null,
        intensity: program.type === 'Cardio' ? ex.intensity : null,
      }));

      if (exercisesToInsert.length > 0) {
        const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert);
        if (exercisesError) throw exercisesError;
      }

      addToast('success', `Programme "${savedProgram.name}" sauvegardé.`);
      onBack();

    } catch (error) {
      addToast('error', `Erreur: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


  if (loading) {
    return <div className="screen"><p className="loading-text">Chargement du programme...</p></div>;
  }

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={onBack}>← Retour aux programmes</a>
      
      <div className="program-form-group">
        <h2>{isNewProgram ? "Nouveau Programme" : "Modifier le Programme"}</h2>
        <input name="name" value={program.name} onChange={handleProgramChange} placeholder="Nom du programme" required />
        <div className="type-selector">
          <button type="button" onClick={() => setProgram({...program, type: 'Renforcement'})} className={program.type === 'Renforcement' ? 'active' : ''}>
            💪 Renforcement
          </button>
          <button type="button" onClick={() => setProgram({...program, type: 'Cardio'})} className={program.type === 'Cardio' ? 'active' : ''}>
            ❤️ Cardio
          </button>
        </div>
      </div>

      <div className="page-header" style={{marginTop: '30px', marginBottom: '16px'}}>
        <h3>Exercices</h3>
      </div>
      
      {exercises.length === 0 && (
          <div className="empty-state" style={{margin: '20px 0'}}><p>Aucun exercice ajouté.</p></div>
      )}

      {exercises.length > 0 && (
        <div className="exercise-list">
          {exercises.map(exo => (
            <div key={exo.id} className="exercise-card">
              <div className="exercise-card-info">
                <h3>{exo.name}</h3>
                {program.type === 'Renforcement' && <p>{exo.sets} séries × {exo.reps} reps</p>}
                {program.type === 'Cardio' && <p>{exo.duration_minutes} min - Intensité {exo.intensity}</p>}
              </div>
              <div className="exercise-card-actions">
                <button className="options-button" onClick={() => setExerciseToDelete(exo)}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="add-exercise-form">
        <h4>Ajouter un nouvel exercice</h4>
        <div className="form-field">
            <label htmlFor="new-name">Nom de l'exercice</label>
            <input id="new-name" name="name" value={newExercise.name} onChange={handleNewExerciseChange} placeholder="Ex: Pompes" />
        </div>
        
        {program.type === 'Renforcement' ? (
          <div className="form-row">
            <div className="form-field">
                <label htmlFor="new-sets">Séries</label>
                <input id="new-sets" name="sets" type="number" value={newExercise.sets} onChange={handleNewExerciseChange} placeholder="Ex: 3" />
            </div>
            <div className="form-field">
                <label htmlFor="new-reps">Répétitions</label>
                <input id="new-reps" name="reps" type="number" value={newExercise.reps} onChange={handleNewExerciseChange} placeholder="Ex: 12" />
            </div>
          </div>
        ) : (
          <>
            <div className="form-field">
                <label htmlFor="new-duration">Durée (en minutes)</label>
                <input id="new-duration" name="duration_minutes" type="number" value={newExercise.duration_minutes} onChange={handleNewExerciseChange} placeholder="Ex: 15" />
            </div>
            <div className="form-field">
                <label htmlFor="new-intensity">Intensité</label>
                <select id="new-intensity" name="intensity" value={newExercise.intensity} onChange={handleNewExerciseChange}>
                    <option>Faible</option><option>Moyenne</option><option>Haute</option>
                </select>
            </div>
          </>
        )}
        <button className="secondary" onClick={handleAddExercise}>+ Ajouter au programme</button>
      </div>

      <div className="button-group">
        <button onClick={handleSaveProgram} disabled={isSaving}>
          {isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}
        </button>
      </div>

      {exerciseToDelete && <ConfirmModal title="Supprimer l'exercice" message={`Êtes-vous sûr de vouloir supprimer "${exerciseToDelete.name}" de ce programme ?`} onConfirm={() => handleDeleteExercise(exerciseToDelete.id)} onCancel={() => setExerciseToDelete(null)} />}
    </div>
  );
};

export default ProgramEditorPage;