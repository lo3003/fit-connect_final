import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';

const CoachAuthPage = ({ setView }) => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // Nouvel état pour la confirmation
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    // Vérification de la confirmation du mot de passe lors de l'inscription
    if (!isLoginView && password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setLoading(false);
      return; // On arrête l'exécution ici
    }

    try {
      if (isLoginView) {
        // Logique de Connexion
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        // Logique d'Inscription
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        
        if (data.user) {
          const { error: insertError } = await supabase
            .from('coaches')
            .insert({ id: data.user.id, full_name: fullName });
          if (insertError) throw insertError;
          
          alert('Inscription réussie ! Veuillez consulter vos e-mails pour valider votre compte.');
          setIsLoginView(true); // Redirige vers la vue de connexion
        }
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={() => setView('home')}>← Retour</a>
      <div className="content-centered">
        <h2>{isLoginView ? 'Connexion Coach' : 'Créer un compte Coach'}</h2>
        <p>{isLoginView ? 'Accédez à votre tableau de bord.' : 'Rejoignez la plateforme dès maintenant.'}</p>
      </div>
      <form onSubmit={handleAuth} className="auth-form">
        {!isLoginView && (
          <input
            type="text"
            placeholder="Nom complet"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Adresse e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Mot de passe (6+ caractères)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength="6"
          required
        />
        {/* Champ de confirmation ajouté ici */}
        {!isLoginView && (
          <input
            type="password"
            placeholder="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        )}
        
        {/* Options du formulaire (case à cocher) ajoutées ici */}
        {isLoginView && (
            <div className="form-options">
                <label className="checkbox-container">
                    <input type="checkbox" defaultChecked />
                    Rester connecté
                </label>
            </div>
        )}

        {error && <p className="error-message">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Chargement...' : (isLoginView ? 'Se connecter' : "S'inscrire")}
        </button>
      </form>
      <p className="auth-toggle">
        {isLoginView ? 'Pas encore de compte ?' : 'Déjà un compte ?'}
        <a href="#" onClick={() => {
            setIsLoginView(!isLoginView);
            setError(null); // Réinitialise les erreurs en changeant de vue
        }}>
          {isLoginView ? " S'inscrire" : ' Se connecter'}
        </a>
      </p>
    </div>
  );
};

export default CoachAuthPage;