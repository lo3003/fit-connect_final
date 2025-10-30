// src/pages/ProgramEditorPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { useNotification } from '../contexts/NotificationContext';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ConfirmModal from '../components/ConfirmModal';
import ExerciseEditorModal from '../components/ExerciseEditorModal';
import AddFromLibraryModal from '../components/AddFromLibraryModal';

const DragHandleIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle>
    </svg>
);

const SortableItem = ({ item, onEdit, onDelete }) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
    const style = { transform: CSS.Transform.toString(transform), transition };

    if (item.is_section_header) {
        return (
            <div ref={setNodeRef} style={style} className="section-header-item">
                <div {...attributes} {...listeners} className="drag-handle"><DragHandleIcon /></div>
                <h4 className="section-title">{item.name}</h4>
                <button className="delete-icon" onClick={() => onDelete(item)}>🗑️</button>
            </div>
        );
    }

    return (
        <div ref={setNodeRef} style={style} className="exercise-card editor indented">
            <div className="exercise-content-wrapper">
                <div {...attributes} {...listeners} className="drag-handle"><DragHandleIcon /></div>
                <div className="exercise-card-main-content" onClick={() => onEdit(item)}>
                    <div className={`exercise-type-icon ${item.type?.toLowerCase()}`}>{item.type === 'Renforcement' ? '💪' : '❤️'}</div>
                    <div className="exercise-card-info">
                        <h3>{item.name}</h3>
                        {item.type === 'Renforcement' && <p>{item.sets || 0}s × {item.reps || 0}r • {item.charge || 'Poids libre'}</p>}
                        {item.type === 'Cardio' && <p>{item.duration_minutes || 0}min • {item.intensity}</p>}
                    </div>
                </div>
                <button className="delete-icon" onClick={() => onDelete(item)}>🗑️</button>
            </div>
            {item.rest_time && (
                <div className="rest-time-indicator">
                    🕒 <span>Repos : {item.rest_time}</span>
                </div>
            )}
        </div>
    );
};


const ProgramEditorPage = ({ programId, onBack }) => {
    const { addToast } = useNotification();
    const [program, setProgram] = useState({ name: '' });
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
    const [showLibraryModal, setShowLibraryModal] = useState(false);
    const [itemToEdit, setItemToEdit] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isCreatingForLibrary, setIsCreatingForLibrary] = useState(false);

    const isNewProgram = programId === 'new';

    const fetchProgramData = useCallback(async () => {
        if (isNewProgram) { setLoading(false); return; }
        setLoading(true);
        const { data: programData } = await supabase.from('programs').select('*').eq('id', programId).single();
        if (programData) {
            setProgram(programData);
            const { data: exercisesData } = await supabase.from('exercises').select('*').eq('program_id', programId).order('order', { ascending: true });
            setItems(exercisesData || []);
        }
        setLoading(false);
    }, [programId, isNewProgram]);

    useEffect(() => { fetchProgramData(); }, [fetchProgramData]);

    const handleOpenModalForEdit = (item) => { 
        if (item.is_section_header) return;
        setItemToEdit(item); 
        setIsCreatingForLibrary(false);
        setIsExerciseModalOpen(true); 
    };

    const handleLaunchCreatorFromLibrary = () => {
        setShowLibraryModal(false);
        setItemToEdit(null);
        setIsCreatingForLibrary(true);
        setIsExerciseModalOpen(true);
    };

    const handleAddSection = () => {
        const sectionName = window.prompt("Nom de la nouvelle section (ex: Échauffement) :");
        if (sectionName && sectionName.trim()) {
            const newSection = { id: `temp-${Date.now()}`, name: sectionName.trim(), is_section_header: true };
            setItems([...items, newSection]);
        }
    };

    const handleSaveItem = (itemData) => {
        const existingIndex = items.findIndex(i => i.id === itemData.id);
        if (existingIndex > -1) {
            const updatedItems = [...items];
            updatedItems[existingIndex] = itemData;
            setItems(updatedItems);
        }
    };

    const handleSaveNewTemplateAndAdd = async (exerciseData) => {
        const { data: { user } } = await supabase.auth.getUser();
        const dataToSave = {
            name: exerciseData.name,
            type: exerciseData.type,
            comment: exerciseData.comment || null,
            photo_url: exerciseData.photo_url || null,
            rest_time: exerciseData.rest_time || null,
            charge: exerciseData.charge || null,
            sets: exerciseData.sets || null,
            reps: exerciseData.reps || null,
            duration_minutes: exerciseData.duration_minutes || null,
            intensity: exerciseData.intensity || null,
            coach_id: user.id,
            is_template: true,
            program_id: null,
        };
    
        const { data: newTemplate, error } = await supabase.from('exercises').insert(dataToSave).select().single();
    
        if (error) {
            addToast('error', `Erreur de sauvegarde: ${error.message}`);
            return;
        }
        
        addToast('success', `Exercice "${newTemplate.name}" ajouté à la bibliothèque.`);
    
        const newItemForProgram = { ...newTemplate, id: `temp-${Date.now()}`, is_template: false };
        setItems(currentItems => [...currentItems, newItemForProgram]);
    };
    
    const handleAddExercisesFromLibrary = (exercisesToAdd) => {
        const newItems = exercisesToAdd.map(template => ({
            ...template,
            id: `temp-${Date.now()}-${Math.random()}`,
            is_template: false,
        }));
        setItems([...items, ...newItems]);
    };

    const handleDeleteItem = () => {
        setItems(items.filter(i => i.id !== itemToDelete.id));
        setItemToDelete(null);
        addToast('success', "Élément supprimé de la liste.");
    };
    
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );

    const handleDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            setItems((currentItems) => {
                const oldIndex = currentItems.findIndex(item => item.id === active.id);
                const newIndex = currentItems.findIndex(item => item.id === over.id);
                return arrayMove(currentItems, oldIndex, newIndex);
            });
        }
    };

    const handleSaveProgram = async () => {
        setIsSaving(true);
        if (!program.name.trim()) {
            addToast('error', "Le nom du programme est requis.");
            setIsSaving(false);
            return;
        }
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let savedProgram = program;
            if (isNewProgram) {
                const { data, error } = await supabase.from('programs').insert({ name: program.name, coach_id: user.id }).select().single();
                if (error) throw error;
                savedProgram = data;
            } else {
                const { data, error } = await supabase.from('programs').update({ name: program.name }).eq('id', program.id).select().single();
                if (error) throw error;
                savedProgram = data;
            }
            await supabase.from('exercises').delete().eq('program_id', savedProgram.id);
            if (items.length > 0) {
                const itemsToInsert = items.map((item, index) => ({
                    program_id: savedProgram.id, order: index, name: item.name, is_section_header: item.is_section_header || false,
                    type: item.type || null, sets: item.sets || null, reps: item.reps || null,
                    charge: item.charge || null, duration_minutes: item.duration_minutes || null,
                    intensity: item.intensity || null, comment: item.comment || null,
                    rest_time: item.rest_time || null, photo_url: item.photo_url || null,
                    coach_id: user.id, is_template: false,
                }));
                const { error: itemsError } = await supabase.from('exercises').insert(itemsToInsert);
                if (itemsError) throw itemsError;
            }
            addToast('success', `Programme "${savedProgram.name}" sauvegardé.`);
            onBack();
        } catch (error) {
            addToast('error', `Erreur de sauvegarde: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleDeleteProgram = async () => {
        if (isNewProgram) return;
        setIsSaving(true);
        try {
            await supabase.from('client_programs').delete().eq('program_id', programId);
            await supabase.from('exercises').delete().eq('program_id', programId);
            const { error } = await supabase.from('programs').delete().eq('id', programId);
            if (error) throw error;
            addToast('success', `Le programme "${program.name}" a été supprimé.`);
            onBack();
        } catch (error) {
            addToast('error', `Erreur lors de la suppression : ${error.message}`);
            setIsSaving(false);
        }
    };
    
    if (loading) return <div className="screen"><p className="loading-text">Chargement...</p></div>;

    return (
        <>
            <div className="screen">
                <a href="#" className="back-link" onClick={onBack}>← Retour aux programmes</a>
                <div className="program-form-group">
                    <h2>{isNewProgram ? "Nouveau Programme" : "Modifier le Programme"}</h2>
                    <input name="name" value={program.name} onChange={(e) => setProgram({ ...program, name: e.target.value })} placeholder="Nom du programme" />
                </div>
                <div className="page-header" style={{ marginTop: '20px', marginBottom: '16px' }}>
                    <h3>Contenu de la séance</h3>
                </div>
                
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={items} strategy={verticalListSortingStrategy}>
                        <div className="exercise-list editor">
                            {items.map(item => (
                                <SortableItem key={item.id} item={item} onEdit={handleOpenModalForEdit} onDelete={setItemToDelete} />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
                
                {items.length === 0 && (
                    <div className="empty-state" style={{margin: '20px 0'}}>
                        <p>Commencez par ajouter une section ou un exercice.</p>
                    </div>
                )}

                <div className="button-group" style={{ marginTop: '24px' }}>
                    <div className="form-row">
                        <button className="secondary" onClick={handleAddSection}>+ Ajouter une section</button>
                        <button className="secondary" onClick={() => setShowLibraryModal(true)}>+ Ajouter un exercice</button>
                    </div>
                    <button onClick={handleSaveProgram} disabled={isSaving}>
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder le programme'}
                    </button>
                    {!isNewProgram && (
                        <button className="danger" onClick={() => setShowDeleteConfirm(true)} disabled={isSaving}>
                            Supprimer le programme
                        </button>
                    )}
                </div>
            </div>
            {isExerciseModalOpen && (
                <ExerciseEditorModal 
                    exercise={itemToEdit} 
                    onClose={() => setIsExerciseModalOpen(false)} 
                    onSave={isCreatingForLibrary ? handleSaveNewTemplateAndAdd : handleSaveItem} 
                />
            )}
            {showLibraryModal && (
                <AddFromLibraryModal 
                    onClose={() => setShowLibraryModal(false)} 
                    onAddExercises={handleAddExercisesFromLibrary}
                    onLaunchCreator={handleLaunchCreatorFromLibrary}
                />
            )}
            {itemToDelete && <ConfirmModal title="Supprimer l'élément" message={`Voulez-vous vraiment supprimer "${itemToDelete.name}" ?`} onConfirm={handleDeleteItem} onCancel={() => setItemToDelete(null)} />}
            {showDeleteConfirm && (
                <ConfirmModal title="Supprimer le Programme" message={`Êtes-vous sûr de vouloir supprimer "${program.name}" ? Ses exercices et ses assignations aux clients seront aussi supprimés. Cette action est irréversible.`} onConfirm={handleDeleteProgram} onCancel={() => setShowDeleteConfirm(false)} confirmText="Oui, supprimer" />
            )}
        </>
    );
};

export default ProgramEditorPage;