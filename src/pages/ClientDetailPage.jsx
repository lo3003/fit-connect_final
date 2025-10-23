// src/pages/ClientDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import EditClientModal from '../components/EditClientModal';
import AssignProgramModal from '../components/AssignProgramModal';

// Petite icône SVG pour la copie
const CopyIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
  </svg>
);

const ClientDetailPage = ({ client, programs, onBack, onClientAction, onViewHistory }) => {
  const { addToast } = useNotification();
  const [assignedPrograms, setAssignedPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  // États pour les modales
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [programToUnassign, setProgramToUnassign] = useState(null);

  const fetchAssignedPrograms = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('client_programs').select(`programs (id, name, type)`).eq('client_id', client.id);
    if (data) setAssignedPrograms(data.map(item => item.programs));
    setLoading(false);
  }, [client.id]);

  useEffect(() => {
    fetchAssignedPrograms();
  }, [fetchAssignedPrograms]);

  const handleDelete = async () => { 
    try {
        const { error } = await supabase.from('clients').delete().eq('id', client.id);
        if (error) throw error;
        addToast('success', `Client "${client.full_name}" supprimé.`);
        onClientAction();
    } catch (error) { addToast('error', "Erreur : " + error.message); }
  };
  
  const handleUnassignProgram = async () => {
    if (!programToUnassign) return;
    try {
        const { error } = await supabase.from('client_programs').delete().match({ client_id: client.id, program_id: programToUnassign.id });
        if (error) throw error;
        addToast('success', `Le programme a été retiré.`);
        setProgramToUnassign(null);
        fetchAssignedPrograms();
    } catch (error) {
        addToast('error', error.message);
        setProgramToUnassign(null);
    }
  };

  // Nouvelle fonction pour copier le code
  const handleCopyCode = () => {
    navigator.clipboard.writeText(client.client_code);
    addToast('success', 'Code d\'accès copié !');
  };

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={onBack}>← Retour à la liste</a>
      
      <div className="detail-card">
        <h2>{client.full_name}</h2>
        {/* Mise à jour de l'affichage du code client */}
        <div className="client-code-wrapper" onClick={handleCopyCode} title="Copier le code">
          <span>Code d'accès : <strong>{client.client_code}</strong></span>
          <CopyIcon />
        </div>
        
        <div className="info-grid" style={{marginTop: '24px'}}>
          <div><span>Objectif</span><p>{client.main_goal || 'N/A'}</p></div>
          <div><span>Niveau</span><p>{client.fitness_level || 'N/A'}</p></div>
          <div><span>Poids initial</span><p>{client.initial_weight_kg ? `${client.initial_weight_kg} kg` : 'N/A'}</p></div>
          <div><span>Taille</span><p>{client.height_cm ? `${client.height_cm} cm` : 'N/A'}</p></div>
          <div><span>Âge</span><p>{client.age || 'N/A'}</p></div>
          <div><span>Email</span><p>{client.email || 'N/A'}</p></div>
        </div>
      </div>
      
      <div className="button-group" style={{marginTop: '20px'}}>
        <button className="secondary" onClick={() => onViewHistory(client)}>Voir l'historique d'activité</button>
      </div>

      <div className="page-header" style={{marginTop: '20px'}}>
        <h3>Programmes Assignés</h3>
        <button className="add-button" onClick={() => setShowAssignModal(true)}>+</button>
      </div>

      {loading && <p className="loading-text">Chargement...</p>}
      {!loading && assignedPrograms.length === 0 && <div className="empty-state"><p>Aucun programme assigné.</p></div>}
      {!loading && assignedPrograms.length > 0 && (
        <div className="program-list">
          {assignedPrograms.map(program => (
            <div key={program.id} className="program-card">
              <div className={`program-icon ${program.type.toLowerCase()}`}>
                {program.type === 'Renforcement' ? '💪' : '❤️'}
              </div>
              <div className="program-info">
                <h3>{program.name}</h3>
                <p>{program.type}</p>
              </div>
              <button className="unassign-button" title="Retirer le programme" onClick={() => setProgramToUnassign(program)}>
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="button-group">
        <button onClick={() => setShowEditModal(true)}>Modifier les informations</button>
        <button className="danger" onClick={() => setShowDeleteConfirm(true)}>Supprimer le client</button>
      </div>
      
      {showEditModal && <EditClientModal client={client} onClose={() => setShowEditModal(false)} onClientUpdated={(uc) => { onClientAction(uc); fetchAssignedPrograms(); }} />}
      {showDeleteConfirm && <ConfirmModal title="Supprimer le client" message={`Êtes-vous sûr de vouloir supprimer ${client.full_name} ?`} onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />}
      {showAssignModal && <AssignProgramModal client={client} programs={programs} assignedProgramIds={assignedPrograms.map(p => p.id)} onClose={() => setShowAssignModal(false)} onProgramAssigned={fetchAssignedPrograms} />}
      {programToUnassign && <ConfirmModal title="Retirer le programme" message={`Retirer le programme "${programToUnassign.name}" de ce client ?`} onConfirm={handleUnassignProgram} onCancel={() => setProgramToUnassign(null)} confirmText="Oui, retirer" />}
    </div>
  );
};

export default ClientDetailPage;