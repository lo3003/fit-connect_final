// src/components/LibraryPanel.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

// Ce panneau affiche la bibliothèque.
// onAddExercise est une fonction qui prend UN exercice en paramètre.
const LibraryPanel = ({ onAddExercise }) => {
    const [library, setLibrary] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchLibrary = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data } = await supabase
                .from('exercises')
                .select('*')
                .eq('coach_id', user.id)
                .eq('is_template', true)
                .order('name', { ascending: true });
            setLibrary(data || []);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const filteredLibrary = library.filter(exo => 
        exo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="library-panel-component">
            <div className="library-panel-header">
                <h3>Bibliothèque</h3>
                <input 
                    type="text" 
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            
            <div className="library-panel-list">
                {loading && <p className="loading-text">Chargement...</p>}
                {!loading && filteredLibrary.length === 0 && (
                    <div className="empty-state">
                        <p>Bibliothèque vide.</p>
                    </div>
                )}
                {!loading && filteredLibrary.map(exo => (
                    <div 
                        key={exo.id} 
                        className="library-panel-item"
                        onClick={() => onAddExercise(exo)} // Au clic, on appelle la fonction parente
                        title="Cliquer pour ajouter au programme"
                    >
                        <div className={`exercise-type-icon ${exo.type?.toLowerCase()}`}>{exo.type === 'Renforcement' ? '💪' : '❤️'}</div>
                        <span className="item-name">{exo.name}</span>
                        <span className="add-icon">+</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default LibraryPanel;