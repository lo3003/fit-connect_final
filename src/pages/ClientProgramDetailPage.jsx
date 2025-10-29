// src/pages/ClientProgramDetailPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import WorkoutFeedbackModal from '../components/WorkoutFeedbackModal';

const ClientProgramDetailPage = ({ assignment, client, onBack, onWorkoutLogged }) => {
  const program = assignment.programs;
  const exercises = program.exercises.sort((a, b) => a.id - b.id);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const totalExercises = exercises.length;
  const currentExercise = exercises[currentExerciseIndex];

  // Quand le client termine un exercice (en cliquant sur Suivant/Terminer)
  const handleCompleteExercise = () => {
    const newCompleted = new Set(completedExercises);
    newCompleted.add(currentExercise.id);
    setCompletedExercises(newCompleted);

    // Si ce n'est pas le dernier exercice, on passe au suivant
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };
  
  // Aller à l'exercice précédent
  const handlePreviousExercise = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  // Vérifie si tous les exercices sont marqués comme complétés pour afficher la modale
  const allExercisesCompleted = useMemo(() => {
    return totalExercises > 0 && completedExercises.size === totalExercises;
  }, [completedExercises, totalExercises]);

  useEffect(() => {
    if (allExercisesCompleted) {
      setShowFeedbackModal(true);
    }
  }, [allExercisesCompleted]);

  // Si pas d'exercice, on affiche un message
  if (!currentExercise) {
    return (
      <div className="screen workout-focus-mode">
         <a href="#" className="back-link" onClick={onBack}>← Retour</a>
         <div className="empty-state" style={{flex: 1, justifyContent: 'center'}}>
            <p>Ce programme ne contient aucun exercice.</p>
         </div>
      </div>
    );
  }

  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  return (
    <>
      <div className="screen workout-focus-mode">
        {/* En-tête avec progression */}
        <div className="workout-header">
          <a href="#" className="back-link-workout" onClick={onBack}>Quitter</a>
          <div className="workout-progress">
            <p>{program.name}</p>
            <div className="progress-bar-container">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Affichage de l'exercice en cours */}
        <div className="current-exercise-display">
          {currentExercise.photo_url && (
            <div className="exercise-photo-container">
                <img src={currentExercise.photo_url} alt={`Illustration pour ${currentExercise.name}`} />
            </div>
          )}
          
          <h1 className="exercise-name">{currentExercise.name}</h1>
          
          {program.type === 'Renforcement' ? (
            <div className="exercise-details renforcement">
              <div className="detail-block">
                <span>{currentExercise.sets}</span>
                <label>Séries</label>
              </div>
              <div className="detail-separator">×</div>
              <div className="detail-block">
                <span>{currentExercise.reps}</span>
                <label>Répétitions</label>
              </div>
            </div>
          ) : (
            <div className="exercise-details cardio">
              <div className="detail-block">
                <span>{currentExercise.duration_minutes}</span>
                <label>Minutes</label>
              </div>
              <div className="detail-block">
                <span>{currentExercise.intensity}</span>
                <label>Intensité</label>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="workout-navigation">
          <button 
            className="secondary" 
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
          >
            Précédent
          </button>
          <button onClick={handleCompleteExercise}>
            {isLastExercise ? 'Terminer la séance' : 'Suivant'}
          </button>
        </div>
      </div>
      
      {showFeedbackModal && 
        <WorkoutFeedbackModal 
          client={client}
          program={program}
          onClose={() => setShowFeedbackModal(false)}
          onWorkoutLogged={() => {
            onWorkoutLogged();
            onBack();
          }}
        />
      }
    </>
  );
};

export default ClientProgramDetailPage;