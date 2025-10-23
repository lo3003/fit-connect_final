// src/pages/ClientsPage.jsx
import React, { useState } from 'react';
import AddClientModal from '../components/AddClientModal';

const ClientsPage = ({ clients, loading, onSelectClient, onClientAdded }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="screen">
      <div className="page-header">
        <h1>Mes Clients</h1>
        <button className="add-button" onClick={() => setIsModalOpen(true)}>+</button>
      </div>

      {loading && <p className="loading-text">Chargement des clients...</p>}
      
      {!loading && clients.length === 0 && (
        <div className="empty-state">
          <p>Vous n'avez pas encore de client.</p>
          <p>Cliquez sur '+' pour commencer.</p>
        </div>
      )}

      {!loading && clients.length > 0 && (
        <div className="client-list">
          {clients.map(client => (
              <div key={client.id} className="client-card clickable" onClick={() => onSelectClient(client)}>
                  <h3>{client.full_name}</h3>
                  <p>{client.main_goal || 'Objectif non défini'}</p>
              </div>
          ))}
        </div>
      )}
      
      {isModalOpen && <AddClientModal onClose={() => setIsModalOpen(false)} onClientAdded={onClientAdded} />}
    </div>
  );
};

export default ClientsPage;