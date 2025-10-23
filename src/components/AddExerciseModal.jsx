// src/components/AddExerciseModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const AddExerciseModal = ({ program, onClose, onExerciseAdded }) => {
  const { addToast } = useNotification();
  const [loading, setLoading] = useState(false);
  
  // State initial du formulaire
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // Champs pour Renforcement
    sets: '',
    reps: '',
    // Champs pour Cardio
    duration_minutes: '',
    intensity: 'Moyenne',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // On ne garde que les champs pertinents pour le type de programme
    const exerciseData = {
      program_id: program.id,
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
      const { error } = await supabase.from('exercises').insert(exerciseData);
      if (error) throw error;
      
      addToast('success', `Exercice "${formData.name}" ajouté au programme.`);
      onExerciseAdded(); // Rafraîchit la liste sur la page de détail
      onClose(); // Ferme la modale
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
          <h2>Nouvel Exercice</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <input name="name" value={formData.name} onChange={handleChange} placeholder="Nom de l'exercice (ex: Pompes)" required />
          <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description, instructions... (optionnel)" rows="3"></textarea>
          
          {/* Champs conditionnels */}
          {program.type === 'Renforcement' ? (
            <div className="form-row">
              <input name="sets" type="number" value={formData.sets} onChange={handleChange} placeholder="Séries" required />
              <input name="reps" type="number" value={formData.reps} onChange={handleChange} placeholder="Répétitions" required />
            </div>
          ) : (
            <div className="form-row">
              <input name="duration_minutes" type="number" value={formData.duration_minutes} onChange={handleChange} placeholder="Durée (min)" required />
              <select name="intensity" value={formData.intensity} onChange={handleChange}>
                <option>Faible</option>
                <option>Moyenne</option>
                <option>Haute</option>
              </select>
            </div>
          )}
          
          <p className="small-info">Vous pourrez ajouter une photo plus tard.</p>
          <button type="submit" disabled={loading}>{loading ? 'Ajout...' : 'Ajouter exercice'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddExerciseModal;