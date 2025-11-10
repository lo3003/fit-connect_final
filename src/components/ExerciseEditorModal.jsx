// src/components/ExerciseEditorModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const ExerciseEditorModal = ({ exercise, onClose, onSave }) => {
  const { addToast } = useNotification();
  const [exerciseType, setExerciseType] = useState(exercise?.type || 'Renforcement');

  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    sets: exercise?.sets || '',
    reps: exercise?.reps || '',
    charge: exercise?.charge || '',
    duration_minutes: exercise?.duration_minutes || '',
    intensity: exercise?.intensity || 'Moyenne',
    comment: exercise?.comment || '',
    photo_url: exercise?.photo_url || null,
    rest_time: exercise?.rest_time || '', // Ajout du temps de repos
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  
  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhotoFile(e.target.files[0]);
    }
  };

  const uploadPhoto = async () => {
    if (!photoFile) return formData.photo_url;

    setIsUploading(true);
    const fileName = `${Date.now()}_${photoFile.name}`;
    const { error } = await supabase.storage.from('exercices').upload(fileName, photoFile);

    if (error) {
        setIsUploading(false);
        throw new Error("Erreur lors de l'envoi de la photo.");
    }
    
    const { data: { publicUrl } } = supabase.storage.from('exercices').getPublicUrl(fileName);
      
    setIsUploading(false);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newPhotoUrl = await uploadPhoto();
      const finalData = { ...formData, type: exerciseType, id: exercise?.id || `temp-${Date.now()}`, photo_url: newPhotoUrl };
      onSave(finalData);
      onClose();
    } catch (error) {
      addToast('error', error.message);
    }
  };

  const photoPreview = photoFile ? URL.createObjectURL(photoFile) : formData.photo_url;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{exercise ? "Modifier l'exercice" : "Nouvel exercice"}</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="type-selector">
            <button type="button" onClick={() => setExerciseType('Renforcement')} className={exerciseType === 'Renforcement' ? 'active' : ''}>💪 Renforcement</button>
            <button type="button" onClick={() => setExerciseType('Cardio')} className={exerciseType === 'Cardio' ? 'active' : ''}>❤️ Cardio</button>
          </div>
          
          <div className="form-field">
            <label>Nom de l'exercice</label>
            <input name="name" value={formData.name} onChange={handleChange} required />
          </div>
          
          {exerciseType === 'Renforcement' ? (
            <>
              <div className="form-row">
                <div className="form-field"><label>Séries</label><input name="sets" type="number" value={formData.sets} onChange={handleChange} /></div>
                <div className="form-field"><label>Répétitions</label><input name="reps" type="number" value={formData.reps} onChange={handleChange} /></div>
              </div>
              <div className="form-field"><label>Charge (optionnel)</label><input name="charge" value={formData.charge} onChange={handleChange} placeholder="Ex: 10kg, élastique..." /></div>
            </>
          ) : (
            <>
              <div className="form-field"><label>Durée (min)</label><input name="duration_minutes" type="number" value={formData.duration_minutes} onChange={handleChange} /></div>
              <div className="form-field"><label>Intensité</label><select name="intensity" value={formData.intensity} onChange={handleChange}><option>Faible</option><option>Moyenne</option><option>Haute</option></select></div>
            </>
          )}
          
          <div className="form-field">
            <label>Temps de repos après (optionnel)</label>
            <input name="rest_time" value={formData.rest_time} onChange={handleChange} placeholder="Ex: 60s, 1m30..." />
          </div>

          <div className="form-field">
            <label>Commentaire (optionnel)</label>
            <textarea name="comment" value={formData.comment} onChange={handleChange} rows="2" placeholder="Ex: bien gainer les abdos..."></textarea>
          </div>

          <div className="form-field">
            <label>Photo (optionnel)</label>
            <label className="photo-upload-label interactive">
              {photoPreview && <img src={photoPreview} alt="Aperçu" className="photo-preview-thumb" />}
              <span>{photoFile ? photoFile.name : "Cliquer pour choisir une image"}</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>
          
          <button type="submit" disabled={isUploading}>{isUploading ? 'Envoi...' : 'Sauvegarder'}</button>
        </form>
      </div>
    </div>
  );
};

export default ExerciseEditorModal;