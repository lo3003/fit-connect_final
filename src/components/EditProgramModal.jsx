// src/components/EditProgramModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const EditProgramModal = ({ program, onClose, onProgramUpdated }) => {
  const [name, setName] = useState(program.name);
  const [type, setType] = useState(program.type);
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('programs')
        .update({ name, type })
        .eq('id', program.id)
        .select()
        .single();
        
      if (error) throw error;

      addToast('success', `Programme "${name}" mis à jour.`);
      onProgramUpdated(data); // On renvoie le programme mis à jour
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
          <h2>Modifier le Programme</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du programme" required />
          <div className="type-selector">
            <button type="button" onClick={() => setType('Renforcement')} className={type === 'Renforcement' ? 'active' : ''}>
              💪 Renforcement
            </button>
            <button type="button" onClick={() => setType('Cardio')} className={type === 'Cardio' ? 'active' : ''}>
              ❤️ Cardio
            </button>
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Sauvegarde...' : 'Sauvegarder les modifications'}</button>
        </form>
      </div>
    </div>
  );
};

export default EditProgramModal;