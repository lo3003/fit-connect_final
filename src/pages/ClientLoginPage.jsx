// src/pages/ClientLoginPage.jsx
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';

const ClientLoginPage = ({ setView }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { addToast } = useNotification();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
        if (password !== confirmPassword) {
            addToast('error', "Les mots de passe ne correspondent pas.");
            setLoading(false);
            return;
        }
        if (!termsAccepted) {
            addToast('error', "Veuillez accepter la politique de confidentialité.");
            setLoading(false);
            return;
        }
    }

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        addToast('success', 'Compte créé ! Vous pouvez vous connecter.');
        setIsSignUp(false);
      } else {
        const { data: { user }, error } = await supabase.auth.signInWithPassword({ email, password });
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
          placeholder="Votre mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        
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

        {isSignUp && (
             <div className="form-options" style={{justifyContent: 'flex-start', marginBottom: '16px'}}>
                <label className="checkbox-container" style={{fontSize: '13px', alignItems: 'flex-start'}}>
                    <input 
                        type="checkbox" 
                        checked={termsAccepted} 
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        style={{marginTop: '3px'}}
                    />
                    <span>
                        J'accepte la <a href="#" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }} style={{color: 'var(--primary-color)'}}>politique de confidentialité</a>.
                    </span>
                </label>
            </div>
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
            setConfirmPassword(''); 
            setTermsAccepted(false);
        }}>
          {isSignUp ? ' Se connecter' : ' Créer un mot de passe'}
        </a>
      </p>

      {showPrivacyModal && <PrivacyPolicyModal onClose={() => setShowPrivacyModal(false)} />}
    </div>
  );
};

export default ClientLoginPage;