import { Task } from '../../types';
import { useAuth } from '../../contexts/AuthContext';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: number, complete: boolean) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
}

const recurrenceLabels: Record<string, string> = {
  NONE: 'חד פעמי',
  DAILY: 'יומי',
  WEEKLY: 'שבועי',
  MONTHLY: 'חודשי'
};

export function TaskItem({ task, onToggleComplete, onEdit, onDelete }: TaskItemProps) {
  const { isAdmin } = useAuth();
  const isComplete = task.isCompleteForDate ?? task.isComplete;

  return (
    <div className={`task-item ${isComplete ? 'completed' : ''}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={isComplete}
          onChange={(e) => onToggleComplete(task.id, e.target.checked)}
          id={`task-${task.id}`}
        />
        <label htmlFor={`task-${task.id}`} className="checkbox-label"></label>
      </div>

      <div className="task-content">
        <div className="task-header">
          <h3 className="task-title">{task.title}</h3>
          {task.recurrence !== 'NONE' && (
            <span className="recurrence-badge">{recurrenceLabels[task.recurrence]}</span>
          )}
        </div>

        {task.description && (
          <p className="task-description">{task.description}</p>
        )}

        <div className="task-time">
          <span>{task.startTime} - {task.endTime}</span>
        </div>
      </div>

      {isAdmin && (
        <div className="task-actions">
          <button
            onClick={() => onEdit(task)}
            className="btn-icon btn-edit"
            title="ערוך"
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="btn-icon btn-delete"
            title="מחק"
          >
            🗑️
          </button>
        </div>
      )}
    </div>
  );
}
