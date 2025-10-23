// src/components/EditClientModal.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext'; // On importe le hook

const EditClientModal = ({ client, onClose, onClientUpdated }) => {
  const { addToast } = useNotification(); // On utilise le hook
  // ... (le reste du state et des fonctions reste identique) ...
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: client.full_name || '', email: client.email || '', initial_weight_kg: client.initial_weight_kg || '',
    height_cm: client.height_cm || '', age: client.age || '', main_goal: client.main_goal || '', fitness_level: client.fitness_level || 'Débutant',
  });
  const handleChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clients').update(formData).eq('id', client.id).select().single();
      if (error) throw error;

      // On remplace alert() par notre nouvelle notification
      addToast('success', `Informations de "${formData.full_name}" mises à jour.`);

      onClientUpdated(data);
      onClose();
    } catch (error) {
      addToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
        {/* Le JSX du formulaire reste identique */}
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2>Modifier le Client</h2><button onClick={onClose} className="close-button">&times;</button></div>
            <form onSubmit={handleSubmit} className="modal-form">
                <input name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Nom complet" required />
                <input name="email" type="email" value={formData.email} onChange={handleChange} placeholder="Adresse e-mail (optionnel)" />
                <div className="form-row">
                    <input name="initial_weight_kg" type="number" value={formData.initial_weight_kg} onChange={handleChange} placeholder="Poids (kg)" />
                    <input name="height_cm" type="number" value={formData.height_cm} onChange={handleChange} placeholder="Taille (cm)" />
                    <input name="age" type="number" value={formData.age} onChange={handleChange} placeholder="Âge" />
                </div>
                <input name="main_goal" value={formData.main_goal} onChange={handleChange} placeholder="Objectif principal" />
                <select name="fitness_level" value={formData.fitness_level} onChange={handleChange}>
                    <option>Débutant</option><option>Intermédiaire</option><option>Avancé</option>
                </select>
                <button type="submit" disabled={loading}>{loading ? 'Sauvegarde...' : 'Sauvegarder'}</button>
            </form>
        </div>
    </div>
  );
};

export default EditClientModal;