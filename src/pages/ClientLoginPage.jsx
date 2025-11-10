// src/pages/ClientLoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';

const ClientLoginPage = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // 1. Nouvel état pour la confirmation
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 2. Vérification de correspondance lors de l'inscription
    if (isSignUp && password !== confirmPassword) {
        addToast('error', "Les mots de passe ne correspondent pas.");
        setLoading(false);
        return;
    }

    try {
      if (isSignUp) {
        // --- INSCRIPTION ---
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        addToast('success', 'Compte créé ! Vous pouvez vous connecter.');
        setIsSignUp(false);
      } else {
        // --- CONNEXION ---
        const { data: { user }, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;

        if (user) {
          const { data: clientData, error: clientError } = await supabase
            .from('clients')
            .select('*')
            .eq('auth_user_id', user.id)
            .single();

          if (clientError || !clientData) {
            throw new Error("Aucun profil client associé à ce compte. Contactez votre coach.");
          }
          // La redirection est gérée automatiquement par App.jsx grâce au listener onAuthStateChange
        }
      }
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
        <h2>{isSignUp ? 'Créer mon accès' : 'Espace Client'}</h2>
        <p>{isSignUp ? 'Créez un mot de passe pour sécuriser votre compte.' : 'Connectez-vous pour voir votre programme.'}</p>
      </div>
      <form onSubmit={handleAuth} className="auth-form">
        <input
          type="email"
          placeholder="Votre adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Votre mot de passe (6+ caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        
        {/* 3. Champ de confirmation visible uniquement en mode inscription */}
        {isSignUp && (
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
        )}

        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : (isSignUp ? "S'inscrire" : 'Se connecter')}
        </button>
      </form>
      
      <p className="auth-toggle">
        {isSignUp ? 'Déjà un compte ?' : 'Première visite ?'}
        <a href="#" onClick={(e) => { 
            e.preventDefault(); 
            setIsSignUp(!isSignUp);
            // On vide les erreurs ou les champs si on veut être propre
            setConfirmPassword(''); 
        }}>
          {isSignUp ? ' Se connecter' : ' Créer un mot de passe'}
        </a>
      </p>
    </div>
  );
};

export default ClientLoginPage;