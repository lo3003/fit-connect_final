// src/components/ExerciseEditorModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const ExerciseEditorModal = ({ programType, exercise, onClose, onSave }) => {
  const { addToast } = useNotification();
  const [formData, setFormData] = useState({
    name: exercise?.name || '',
    sets: exercise?.sets || '',
    reps: exercise?.reps || '',
    duration_minutes: exercise?.duration_minutes || '',
    intensity: exercise?.intensity || 'Moyenne',
    photo_url: exercise?.photo_url || null,
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
    const { error } = await supabase.storage
      .from('exercices')
      .upload(fileName, photoFile);

    if (error) {
        setIsUploading(false);
        throw new Error(`Erreur d'upload: ${error.message}`);
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('exercices')
      .getPublicUrl(fileName);
      
    setIsUploading(false);
    return publicUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newPhotoUrl = await uploadPhoto();
      const finalData = { ...formData, id: exercise?.id || `temp-${Date.now()}`, photo_url: newPhotoUrl };
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
          <div className="form-field">
            <label htmlFor="name">Nom de l'exercice</label>
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Ex: Pompes" required />
          </div>
          
          {programType === 'Renforcement' ? (
            <div className="form-row">
              <div className="form-field"><label>Séries</label><input name="sets" type="number" value={formData.sets} onChange={handleChange} placeholder="3" /></div>
              <div className="form-field"><label>Répétitions</label><input name="reps" type="number" value={formData.reps} onChange={handleChange} placeholder="12" /></div>
            </div>
          ) : (
            <div className="form-row">
              <div className="form-field"><label>Durée (min)</label><input name="duration_minutes" type="number" value={formData.duration_minutes} onChange={handleChange} placeholder="15" /></div>
              <div className="form-field"><label>Intensité</label><select name="intensity" value={formData.intensity} onChange={handleChange}><option>Faible</option><option>Moyenne</option><option>Haute</option></select></div>
            </div>
          )}

          <div className="form-field">
            <label>Photo (optionnel)</label>
            <label className="photo-upload-label interactive">
              {photoPreview && <img src={photoPreview} alt="Aperçu" className="photo-preview-thumb" />}
              <span>{photoFile ? photoFile.name : "Cliquer pour choisir une image"}</span>
              <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
            </label>
          </div>
          
          <button type="submit" disabled={isUploading}>{isUploading ? 'Envoi photo...' : 'Sauvegarder'}</button>
        </form>
      </div>
    </div>
  );
};

export default ExerciseEditorModal;