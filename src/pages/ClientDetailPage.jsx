// src/pages/ClientDetailPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import ConfirmModal from '../components/ConfirmModal';
import EditClientModal from '../components/EditClientModal';
import AssignProgramModal from '../components/AssignProgramModal';

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

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={onBack}>← Retour à la liste</a>
      
      <div className="detail-card">
        <h2>{client.full_name}</h2>
        <p className="client-code">Code d'accès : <strong>{client.client_code}</strong></p>
        
        {/* --- BLOC D'INFORMATIONS RESTAURÉ --- */}
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

      {/* --- BLOC DE LA LISTE DES PROGRAMMES RESTAURÉ --- */}
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
      
      {/* Les modales */}
      {showEditModal && <EditClientModal client={client} onClose={() => setShowEditModal(false)} onClientUpdated={(uc) => { onClientAction(uc); fetchAssignedPrograms(); }} />}
      {showDeleteConfirm && <ConfirmModal title="Supprimer le client" message={`Êtes-vous sûr de vouloir supprimer ${client.full_name} ?`} onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} />}
      {showAssignModal && <AssignProgramModal client={client} programs={programs} assignedProgramIds={assignedPrograms.map(p => p.id)} onClose={() => setShowAssignModal(false)} onProgramAssigned={fetchAssignedPrograms} />}
      {programToUnassign && <ConfirmModal title="Retirer le programme" message={`Retirer le programme "${programToUnassign.name}" de ce client ?`} onConfirm={handleUnassignProgram} onCancel={() => setProgramToUnassign(null)} confirmText="Oui, retirer" />}
    </div>
  );
};

export default ClientDetailPage;