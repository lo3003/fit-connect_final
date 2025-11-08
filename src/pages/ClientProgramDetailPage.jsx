// src/pages/ClientProgramDetailPage.jsx
import React, { useState, useMemo, useEffect } from 'react';
import WorkoutFeedbackModal from '../components/WorkoutFeedbackModal';
import RestTimerView from '../components/RestTimerView';

const ClientProgramDetailPage = ({ assignment, client, onBack, onWorkoutLogged, isDesktop }) => {
  const program = assignment.programs;
  // On garde aussi les titres de section pour la playlist Desktop si on veut,
  // mais pour simplifier la navigation, gardons uniquement les exercices jouables pour l'instant.
  const exercises = useMemo(() => program.exercises
    .filter(item => !item.is_section_header)
    .sort((a, b) => a.order - b.order), [program.exercises]);

  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [sessionState, setSessionState] = useState('exercise'); // 'exercise' or 'rest'

  const totalExercises = exercises.length;
  const currentExercise = exercises[currentExerciseIndex];
  const nextExercise = exercises[currentExerciseIndex + 1];

  // --- CORRECTION ICI : On définit isLastExercise avant handleNext ---
  const isLastExercise = currentExerciseIndex === totalExercises - 1;

  // Permet de changer d'exercice en cliquant dans la playlist (Desktop seulement)
  const jumpToExercise = (index) => {
      if (index >= 0 && index < totalExercises) {
          setCurrentExerciseIndex(index);
          setSessionState('exercise');
      }
  }

  // --- CORRECTION ICI : Mise à jour de la logique handleNext ---
  const handleNext = () => {
    // 1. On marque toujours l'exercice courant comme terminé
    const newCompleted = new Set(completedExercises);
    newCompleted.add(currentExercise.id);
    setCompletedExercises(newCompleted);

    // 2. Logique de navigation ou de fin
    if (isLastExercise) {
        // SI C'EST LE DERNIER : On ouvre explicitement la modale de feedback.
        setShowFeedbackModal(true);
    } else if (currentExercise.rest_time) {
        // Sinon, s'il y a du repos, on passe en mode repos
        setSessionState('rest');
    } else {
        // Sinon, on passe directement au suivant
        goToNextExercise();
    }
  };

  const goToNextExercise = () => {
    setSessionState('exercise');
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex(currentExerciseIndex + 1);
    }
  };

  const handlePreviousExercise = () => {
    setSessionState('exercise');
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(currentExerciseIndex - 1);
    }
  };

  const allExercisesCompleted = useMemo(() => {
    return totalExercises > 0 && completedExercises.size === totalExercises;
  }, [completedExercises, totalExercises]);

  // Ce useEffect reste utile pour la première fois qu'on finit tout,
  // mais handleNext gère maintenant les clics suivants sur "Terminer".
  useEffect(() => {
    if (allExercisesCompleted && !showFeedbackModal) {
       // On pourrait l'activer ici aussi, mais handleNext le fait déjà au clic.
       // Gardons-le pour le cas où on finirait par un autre moyen (ex: jumpToExercise)
       // setShowFeedbackModal(true);
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

  // --- COMPOSANT INTERNE : L'écran principal (Exercice ou Repos) ---
  const MainScreen = () => {
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
        <div className="workout-focus-content">
            <div className="workout-header">
            {/* Sur mobile le bouton retour est ici, sur desktop il sera ailleurs */}
            {!isDesktop && <a href="#" className="back-link-workout" onClick={onBack}>Quitter</a>}

            {/* Barre de progression (Mobile uniquement, sur Desktop on a la playlist) */}
            {!isDesktop && (
                <div className="workout-progress">
                    <p>{program.name}</p>
                    <div className="progress-bar-container">
                    <div
                        className="progress-bar-fill"
                        style={{ width: `${((currentExerciseIndex + 1) / totalExercises) * 100}%` }}
                    ></div>
                    </div>
                </div>
            )}
            </div>

            <div className="current-exercise-display">
            {currentExercise.photo_url && (
                <div className="exercise-photo-container">
                    <img src={currentExercise.photo_url} alt={`Illustration pour ${currentExercise.name}`} />
                </div>
            )}

            <h1 className="exercise-name">{currentExercise.name}</h1>

             {currentExercise.comment && (
                <p className="exercise-comment">💡 {currentExercise.comment}</p>
             )}

            {currentExercise.type === 'Renforcement' ? (
                <div className="exercise-details renforcement">
                <div className="detail-block">
                    <span>{currentExercise.sets || '-'}</span>
                    <label>Séries</label>
                </div>
                <div className="detail-separator">×</div>
                <div className="detail-block">
                    <span>{currentExercise.reps || '-'}</span>
                    <label>Répétitions</label>
                </div>
                {currentExercise.charge && (
                    <div className="detail-charge">
                        Charge : <strong>{currentExercise.charge}</strong>
                    </div>
                )}
                </div>
            ) : (
                <div className="exercise-details cardio">
                <div className="detail-block">
                    <span>{currentExercise.duration_minutes || '-'}</span>
                    <label>Minutes</label>
                </div>
                <div className="detail-block">
                    <span>{currentExercise.intensity || '-'}</span>
                    <label>Intensité</label>
                </div>
                </div>
            )}
            </div>

            {!isLastExercise && currentExercise.rest_time && sessionState !== 'rest' && (
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
            <button onClick={handleNext} className="primary-large">
                {isLastExercise ? 'Terminer la séance' : (currentExercise.rest_time ? 'Lancer le repos' : 'Suivant')}
            </button>
            </div>
        </div>
      );
  }

  // --- RENDER FINAL ---
  return (
    <>
      <div className={`screen workout-focus-mode ${isDesktop ? 'desktop-playlist-layout' : ''}`}>

        {/* Zone Principale */}
        <div className="workout-main-area">
             {isDesktop && (
                 <div className="desktop-workout-header">
                     <button onClick={onBack} className="back-button-desktop">← Quitter la séance</button>
                     <h2>{program.name}</h2>
                 </div>
             )}
             <MainScreen />
        </div>

        {/* Sidebar Playlist (Desktop uniquement) */}
        {isDesktop && (
            <div className="workout-playlist-sidebar">
                <h3>Programme</h3>
                <div className="playlist-items">
                    {exercises.map((exo, index) => {
                        const isActive = index === currentExerciseIndex;
                        const isCompleted = completedExercises.has(exo.id);
                        return (
                            <div
                                key={exo.id}
                                className={`playlist-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                                onClick={() => jumpToExercise(index)}
                            >
                                <div className="playlist-item-status">
                                    {isActive ? 'Vm' : (isCompleted ? '✓' : (index + 1))}
                                </div>
                                <div className="playlist-item-info">
                                    <span className="playlist-item-name">{exo.name}</span>
                                    <span className="playlist-item-details">
                                        {exo.type === 'Renforcement'
                                            ? `${exo.sets}x${exo.reps}`
                                            : `${exo.duration_minutes} min`}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        )}

      </div>

      {showFeedbackModal &&
        <WorkoutFeedbackModal
          client={client}
          program={program}
          onClose={() => setShowFeedbackModal(false)}
          onWorkoutLogged={() => {
            onWorkoutLogged();
            onBack(); // Revient au dashboard après validation
          }}
        />
      }
    </>
  );
};

export default ClientProgramDetailPage;