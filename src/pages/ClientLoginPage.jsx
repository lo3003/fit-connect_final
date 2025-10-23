// src/pages/ClientLoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const ClientLoginPage = ({ onLoginSuccess, setView }) => {
  const [fullName, setFullName] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // LA CORRECTION EST ICI : on remplace .eq() par .ilike() pour le nom
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .ilike('full_name', fullName.trim()) // <-- CHANGEMENT ICI
        .eq('client_code', clientCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        throw new Error("Nom d'utilisateur ou code incorrect.");
      }

      onLoginSuccess(data);

    } catch (error) {
      addToast('error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={() => setView('home')}>← Retour</a>
      <div className="content-centered">
        <h2>Accès Client</h2>
        <p>Entrez votre nom et le code fourni par votre coach.</p>
      </div>
      <form onSubmit={handleLogin} className="auth-form">
        <input
          type="text"
          placeholder="Votre nom complet"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Votre code d'accès"
          value={clientCode}
          onChange={(e) => setClientCode(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Connexion...' : 'Accéder à mon espace'}
        </button>
      </form>
    </div>
  );
};

export default ClientLoginPage;