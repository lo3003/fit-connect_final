// src/pages/ProgramEditorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import ExerciseEditorModal from '../components/ExerciseEditorModal';

const ProgramEditorPage = ({ programId, onBack }) => {
  const { addToast } = useNotification();
  const [program, setProgram] = useState({ name: '', type: 'Renforcement' });
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState(null);
  const [exerciseToDelete, setExerciseToDelete] = useState(null);

  const isNewProgram = programId === 'new';

  const fetchProgramData = useCallback(async () => {
    if (isNewProgram) { setLoading(false); return; }
    setLoading(true);
    const { data: programData } = await supabase.from('programs').select('*').eq('id', programId).single();
    if (programData) setProgram(programData);

    const { data: exercisesData } = await supabase.from('exercises').select('*').eq('program_id', programId).order('id', { ascending: true });
    setExercises(exercisesData || []);
    setLoading(false);
  }, [programId, isNewProgram]);

  useEffect(() => { fetchProgramData(); }, [fetchProgramData]);

  const handleOpenModalForNew = () => {
    setExerciseToEdit(null);
    setIsModalOpen(true);
  };
  
  const handleOpenModalForEdit = (exercise) => {
    setExerciseToEdit(exercise);
    setIsModalOpen(true);
  };

  const handleSaveExercise = (exerciseData) => {
    const existingIndex = exercises.findIndex(ex => ex.id === exerciseData.id);
    if (existingIndex > -1) {
      const updatedExercises = [...exercises];
      updatedExercises[existingIndex] = exerciseData;
      setExercises(updatedExercises);
    } else {
      setExercises([...exercises, exerciseData]);
    }
  };
  
  const handleDeleteExercise = () => {
    setExercises(exercises.filter(ex => ex.id !== exerciseToDelete.id));
    setExerciseToDelete(null);
    addToast('success', "Exercice supprimé.");
  };

  // --- FONCTION CORRIGÉE ---
  const handleSaveProgram = async () => {
    setIsSaving(true);
    if (!program.name.trim()) {
      addToast('error', "Le nom du programme est requis.");
      setIsSaving(false);
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      let savedProgram = program;

      // 1. Sauvegarder ou mettre à jour le programme
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

      // 2. Supprimer tous les exercices existants pour ce programme
      await supabase.from('exercises').delete().eq('program_id', savedProgram.id);

      // 3. Préparer les nouveaux exercices pour l'insertion (AVEC LA CORRECTION)
      if (exercises.length > 0) {
        const exercisesToInsert = exercises.map(ex => ({
          program_id: savedProgram.id,
          name: ex.name,
          description: ex.description,
          sets: program.type === 'Renforcement' ? ex.sets : null,
          reps: program.type === 'Renforcement' ? ex.reps : null,
          duration_minutes: program.type === 'Cardio' ? ex.duration_minutes : null,
          intensity: program.type === 'Cardio' ? ex.intensity : null,
          photo_url: ex.photo_url // <-- LA LIGNE MANQUANTE EST ICI
        }));

        // 4. Insérer la nouvelle liste d'exercices
        const { error: exercisesError } = await supabase.from('exercises').insert(exercisesToInsert);
        if (exercisesError) throw exercisesError;
      }

      addToast('success', `Programme "${savedProgram.name}" sauvegardé.`);
      onBack();

    } catch (error) {
      addToast('error', `Erreur de sauvegarde: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <div className="screen"><p className="loading-text">Chargement...</p></div>;
  }

  return (
    <>
      <div className="screen">
        <a href="#" className="back-link" onClick={onBack}>← Retour aux programmes</a>
        
        <div className="program-form-group">
          <h2>{isNewProgram ? "Nouveau Programme" : "Modifier le Programme"}</h2>
          <input name="name" value={program.name} onChange={(e) => setProgram({...program, name: e.target.value})} placeholder="Nom du programme" />
          <div className="type-selector">
            <button type="button" onClick={() => setProgram({...program, type: 'Renforcement'})} className={program.type === 'Renforcement' ? 'active' : ''}>💪 Renforcement</button>
            <button type="button" onClick={() => setProgram({...program, type: 'Cardio'})} className={program.type === 'Cardio' ? 'active' : ''}>❤️ Cardio</button>
          </div>
        </div>

        <div className="page-header" style={{marginTop: '30px', marginBottom: '16px'}}>
          <h3>Exercices</h3>
        </div>

        {exercises.length === 0 && (
          <div className="empty-state" style={{margin: '20px 0'}}>
            <p>Cliquez sur le bouton ci-dessous pour commencer.</p>
          </div>
        )}

        <div className="exercise-list editor">
            {exercises.map(exo => (
                <div key={exo.id} className="exercise-card editor" onClick={() => handleOpenModalForEdit(exo)}>
                    {exo.photo_url ?
                        <img src={exo.photo_url} alt={exo.name} className="exercise-thumbnail" />
                        : <div className="exercise-thumbnail-placeholder"></div>
                    }
                    <div className="exercise-card-info">
                        <h3>{exo.name}</h3>
                        {program.type === 'Renforcement' && <p>{exo.sets || 0}s × {exo.reps || 0}r</p>}
                        {program.type === 'Cardio' && <p>{exo.duration_minutes || 0}min • {exo.intensity}</p>}
                    </div>
                    <button className="delete-icon" onClick={(e) => { e.stopPropagation(); setExerciseToDelete(exo); }}>🗑️</button>
                </div>
            ))}
        </div>

        <div className="button-group" style={{ marginTop: '24px' }}>
          <button className="secondary" onClick={handleOpenModalForNew}>+ Ajouter un exercice</button>
          <button onClick={handleSaveProgram} disabled={isSaving}>{isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}</button>
        </div>
      </div>
      
      {isModalOpen && <ExerciseEditorModal programType={program.type} exercise={exerciseToEdit} onClose={() => setIsModalOpen(false)} onSave={handleSaveExercise} />}
      {exerciseToDelete && <ConfirmModal title="Supprimer l'exercice" message={`Voulez-vous vraiment supprimer "${exerciseToDelete.name}" ?`} onConfirm={handleDeleteExercise} onCancel={() => setExerciseToDelete(null)} />}
    </>
  );
};

export default ProgramEditorPage;