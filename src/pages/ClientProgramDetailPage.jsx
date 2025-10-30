// src/pages/ClientProgramDetailPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import WorkoutFeedbackModal from '../components/WorkoutFeedbackModal';
import RestTimerView from '../components/RestTimerView'; // Importer le nouveau composant

const ClientProgramDetailPage = ({ assignment, client, onBack, onWorkoutLogged }) => {
  const program = assignment.programs;
  // On s'assure de filtrer les titres de section pour ne garder que les exercices
  const exercises = program.exercises
    .filter(item => !item.is_section_header)
    .sort((a, b) => a.order - b.order);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  
  // Nouvel état pour gérer le mode : 'exercise' ou 'rest'
  const [sessionState, setSessionState] = useState('exercise');

  const totalExercises = exercises.length;
  const currentExercise = exercises[currentExerciseIndex];
  const nextExercise = exercises[currentExerciseIndex + 1];

  const handleNext = () => {
    // Marquer l'exercice comme terminé
    const newCompleted = new Set(completedExercises);
    newCompleted.add(currentExercise.id);
    setCompletedExercises(newCompleted);

    // S'il y a un temps de repos et que ce n'est pas le dernier exercice, passer en mode repos
    if (currentExercise.rest_time && currentExerciseIndex < totalExercises - 1) {
      setSessionState('rest');
    } else {
      // Sinon, passer à l'exercice suivant directement
      goToNextExercise();
    }
  };
  
  const goToNextExercise = () => {
    setSessionState('exercise'); // Repasser en mode exercice
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };
  
  const handlePreviousExercise = () => {
    setSessionState('exercise'); // S'assurer de revenir en mode exercice
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const allExercisesCompleted = useMemo(() => {
    return totalExercises > 0 && completedExercises.size === totalExercises;
  }, [completedExercises, totalExercises]);

  useEffect(() => {
    if (allExercisesCompleted) {
      setShowFeedbackModal(true);
    }
  }, [allExercisesCompleted]);

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

  // AFFICHAGE CONDITIONNEL : EXERCICE OU REPOS
  if (sessionState === 'rest') {
    return (
        <RestTimerView 
            duration={currentExercise.rest_time}
            nextExerciseName={nextExercise?.name || "Fin de la séance"}
            onComplete={goToNextExercise}
            onSkip={goToNextExercise}
        />
    );
  }

  return (
    <>
      <div className="screen workout-focus-mode">
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

        <div className="current-exercise-display">
          {currentExercise.photo_url && (
            <div className="exercise-photo-container">
                <img src={currentExercise.photo_url} alt={`Illustration pour ${currentExercise.name}`} />
            </div>
          )}
          
          <h1 className="exercise-name">{currentExercise.name}</h1>
          
          {currentExercise.type === 'Renforcement' ? (
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
        
        {!isLastExercise && currentExercise.rest_time && (
            <div className="next-rest-display">
                <p>Repos à suivre : <strong>{currentExercise.rest_time}</strong></p>
            </div>
        )}

        <div className="workout-navigation">
          <button 
            className="secondary" 
            onClick={handlePreviousExercise}
            disabled={currentExerciseIndex === 0}
          >
            Précédent
          </button>
          <button onClick={handleNext}>
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