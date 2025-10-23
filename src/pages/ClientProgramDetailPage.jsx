// src/pages/ClientProgramDetailPage.jsx
import React, { useState, useMemo } from 'react';
import WorkoutFeedbackModal from '../components/WorkoutFeedbackModal';

const ClientProgramDetailPage = ({ assignment, client, onBack, onWorkoutLogged }) => {
  const program = assignment.programs;
  const exercises = program.exercises.sort((a,b) => a.id - b.id);
  
  const [checkedExoIds, setCheckedExoIds] = useState(new Set());
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleCheck = (exoId) => {
    const newCheckedIds = new Set(checkedExoIds);
    if (newCheckedIds.has(exoId)) {
      newCheckedIds.delete(exoId);
    } else {
      newCheckedIds.add(exoId);
    }
    setCheckedExoIds(newCheckedIds);
  };
  
  // On vérifie si tous les exercices sont cochés
  const allExercisesChecked = useMemo(() => {
    return exercises.length > 0 && checkedExoIds.size === exercises.length;
  }, [checkedExoIds, exercises.length]);

  // Déclencher la modale quand tout est coché
  React.useEffect(() => {
    if (allExercisesChecked) {
      setShowFeedbackModal(true);
    }
  }, [allExercisesChecked]);

  return (
    <div className="screen">
      <a href="#" className="back-link" onClick={onBack}>← Mes programmes</a>
      
      <div className="detail-header">
        <div>
          <h1>{program.name}</h1>
          <p className="subtitle">{program.type}</p>
        </div>
      </div>

      <div className="exercise-list client-detail-list">
        {exercises.map((exo, index) => {
          const isChecked = checkedExoIds.has(exo.id);
          return (
            <div key={exo.id} className={`exercise-card client-detail ${isChecked ? 'checked' : ''}`} onClick={() => handleCheck(exo.id)}>
              <div className="exercise-number">{index + 1}</div>
              <div className="exercise-card-info">
                <h3>{exo.name}</h3>
                {program.type === 'Renforcement' && <p>{exo.sets} séries × {exo.reps} reps</p>}
                {program.type === 'Cardio' && <p>{exo.duration_minutes} min - Intensité {exo.intensity}</p>}
              </div>
              <div className={`exercise-status ${isChecked ? 'checked' : ''}`}>
                {isChecked && '✔️'}
              </div>
            </div>
          );
        })}
      </div>
      
      {showFeedbackModal && 
        <WorkoutFeedbackModal 
          client={client}
          program={program}
          onClose={() => setShowFeedbackModal(false)}
          onWorkoutLogged={() => {
            onWorkoutLogged(); // Rafraîchit les données du dashboard
            onBack(); // Revient à la liste des programmes
          }}
        />
      }
    </div>
  );
};

export default ClientProgramDetailPage;