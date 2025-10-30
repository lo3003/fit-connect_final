// src/pages/ExerciseLibraryPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import ConfirmModal from '../components/ConfirmModal';
import { useNotification } from '../contexts/NotificationContext';

const ExerciseLibraryPage = () => {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const { addToast } = useNotification();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);

    const fetchLibrary = useCallback(async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase
                .from('exercises')
                .select('*')
                .eq('coach_id', user.id)
                .eq('is_template', true)
                .order('name', { ascending: true });
            
            if (error) {
                addToast('error', "Impossible de charger la bibliothèque d'exercices.");
            } else {
                setExercises(data);
            }
        }
        setLoading(false);
    }, [addToast]);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const handleOpenModalForNew = () => {
        setItemToEdit(null);
        setIsModalOpen(true);
    };

    const handleOpenModalForEdit = (exercise) => {
        setItemToEdit(exercise);
        setIsModalOpen(true);
    };

    const handleSaveExercise = async (exerciseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        
        // --- CORRECTION ICI ---
        // On nettoie les données avant de les envoyer à Supabase
        const dataToSave = {
            name: exerciseData.name,
            type: exerciseData.type,
            comment: exerciseData.comment || null,
            photo_url: exerciseData.photo_url || null,
            rest_time: exerciseData.rest_time || null,
            charge: exerciseData.charge || null,
            // On s'assure que les champs numériques vides sont bien 'null'
            sets: exerciseData.sets || null,
            reps: exerciseData.reps || null,
            duration_minutes: exerciseData.duration_minutes || null,
            intensity: exerciseData.intensity || null,
            // On ajoute les métadonnées
            coach_id: user.id,
            is_template: true,
            program_id: null,
        };
        // --- FIN DE LA CORRECTION ---

        let error;
        if (itemToEdit) { // Mise à jour
            ({ error } = await supabase.from('exercises').update(dataToSave).eq('id', itemToEdit.id));
        } else { // Création
            ({ error } = await supabase.from('exercises').insert(dataToSave));
        }

        if (error) {
            addToast('error', `Erreur de sauvegarde: ${error.message}`);
        } else {
            addToast('success', `Exercice "${dataToSave.name}" sauvegardé.`);
            fetchLibrary(); // Rafraîchir la liste
        }
    };

    const handleDeleteExercise = async () => {
        const { error } = await supabase.from('exercises').delete().eq('id', itemToDelete.id);
        if (error) {
            addToast('error', `Erreur: ${error.message}`);
        } else {
            addToast('success', `Exercice "${itemToDelete.name}" supprimé.`);
            fetchLibrary();
        }
        setItemToDelete(null);
    };

    const filteredExercises = exercises.filter(exo => 
        exo.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="screen">
                <div className="page-header">
                    <h1>Bibliothèque</h1>
                    <button className="add-button" onClick={handleOpenModalForNew}>+</button>
                </div>
                <input 
                    type="text" 
                    placeholder="Rechercher un exercice..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ marginBottom: '24px' }}
                />

                {loading && <p className="loading-text">Chargement...</p>}

                {!loading && filteredExercises.length === 0 && (
                    <div className="empty-state">
                        <p>{searchTerm ? "Aucun exercice ne correspond à votre recherche." : "Votre bibliothèque est vide. Cliquez sur '+' pour commencer."}</p>
                    </div>
                )}
                
                {!loading && (
                    <div className="exercise-list editor">
                        {filteredExercises.map(exo => (
                            <div key={exo.id} className="exercise-card editor" onClick={() => handleOpenModalForEdit(exo)}>
                                <div className="exercise-card-main-content">
                                    <div className={`exercise-type-icon ${exo.type?.toLowerCase()}`}>{exo.type === 'Renforcement' ? '💪' : '❤️'}</div>
                                    <div className="exercise-card-info"><h3>{exo.name}</h3></div>
                                </div>
                                <button className="delete-icon" onClick={(e) => { e.stopPropagation(); setItemToDelete(exo); }}>🗑️</button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            {isModalOpen && <ExerciseEditorModal exercise={itemToEdit} onClose={() => setIsModalOpen(false)} onSave={handleSaveExercise} />}
            {itemToDelete && <ConfirmModal title="Supprimer l'exercice" message={`Voulez-vous vraiment supprimer "${itemToDelete.name}" de votre bibliothèque ?`} onConfirm={handleDeleteExercise} onCancel={() => setItemToDelete(null)} />}
        </>
    );
};

export default ExerciseLibraryPage;