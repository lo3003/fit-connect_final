// src/components/AddProgramModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const AddProgramModal = ({ onClose, onProgramAdded }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('Renforcement');
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Coach non identifié.");

      const { error } = await supabase.from('programs').insert({
        coach_id: user.id,
        name,
        type,
      });
      if (error) throw error;
      
      addToast('success', `Programme "${name}" créé avec succès !`);
      onProgramAdded();
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
          <h2>Nouveau Programme</h2>
          <button onClick={onClose} className="close-button">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nom du programme (ex: Haut du corps)" required />
          <div className="type-selector">
            <button type="button" onClick={() => setType('Renforcement')} className={type === 'Renforcement' ? 'active' : ''}>
              💪 Renforcement
            </button>
            <button type="button" onClick={() => setType('Cardio')} className={type === 'Cardio' ? 'active' : ''}>
              ❤️ Cardio
            </button>
          </div>
          <button type="submit" disabled={loading}>{loading ? 'Création...' : 'Créer et ajouter des exercices'}</button>
        </form>
      </div>
    </div>
  );
};

export default AddProgramModal;