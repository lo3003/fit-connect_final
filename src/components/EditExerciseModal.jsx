// src/components/EditExerciseModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const EditExerciseModal = ({ exercise, program, onClose, onExerciseUpdated }) => {
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: exercise.name || '',
    description: exercise.description || '',
    sets: exercise.sets || '',
    reps: exercise.reps || '',
    duration_minutes: exercise.duration_minutes || '',
    intensity: exercise.intensity || 'Moyenne',
  });

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const exerciseData = {
      name: formData.name,
      description: formData.description,
    };
    if (program.type === 'Renforcement') {
      exerciseData.sets = formData.sets;
      exerciseData.reps = formData.reps;
    } else {
      exerciseData.duration_minutes = formData.duration_minutes;
      exerciseData.intensity = formData.intensity;
    }

    try {
      const { error } = await supabase.from('exercises').update(exerciseData).eq('id', exercise.id);
      if (error) throw error;
      
      addToast('success', `Exercice "${formData.name}" mis à jour.`);
      onExerciseUpdated();
      onClose();
    } catch (error) {
      addToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Modifier l'Exercice</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Nom de l'exercice" required />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description..." rows="3"></textarea>
          
          {program.type === 'Renforcement' ? (
            <div className="form-row">
              <input name="sets" type="number" value={formData.sets} onChange={handleChange} placeholder="Séries" required />
              <input name="reps" type="number" value={formData.reps} onChange={handleChange} placeholder="Répétitions" required />
            </div>
          ) : (
            <div className="form-row">
              <input name="duration_minutes" type="number" value={formData.duration_minutes} onChange={handleChange} placeholder="Durée (min)" required />
              <select name="intensity" value={formData.intensity} onChange={handleChange}>
                <option>Faible</option><option>Moyenne</option><option>Haute</option>
              </select>
            </div>
          )}
          
          <button type="submit" disabled={loading}>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</button>
        </form>
      </div>
    </div>
  );
};

export default EditExerciseModal;