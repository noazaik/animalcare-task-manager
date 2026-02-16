import { useState, FormEvent, useEffect } from 'react';
import { Task, TaskFormData, Recurrence } from '../../types';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: TaskFormData) => Promise<void>;
  onCancel: () => void;
}

export function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    dueDate: today,
    startTime: '06:00',
    endTime: '14:00',
    recurrence: 'NONE'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        dueDate: task.dueDate.split('T')[0],
        startTime: task.startTime,
        endTime: task.endTime,
        recurrence: task.recurrence
      });
    }
  }, [task]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בשמירת משימה');
    } finally {
      setIsSubmitting(false);
    }
  };

  const recurrenceOptions: { value: Recurrence; label: string }[] = [
    { value: 'NONE', label: 'חד פעמי' },
    { value: 'DAILY', label: 'יומי' },
    { value: 'WEEKLY', label: 'שבועי' },
    { value: 'MONTHLY', label: 'חודשי' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2>{task ? 'עריכת משימה' : 'משימה חדשה'}</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">כותרת *</label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">תיאור</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dueDate">תאריך</label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startTime">שעת התחלה</label>
              <input
                type="time"
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                disabled={isSubmitting}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">שעת סיום</label>
              <input
                type="time"
                id="endTime"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="recurrence">חזרה</label>
            <select
              id="recurrence"
              value={formData.recurrence}
              onChange={(e) => setFormData({ ...formData, recurrence: e.target.value as Recurrence })}
              disabled={isSubmitting}
            >
              {recurrenceOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'שומר...' : 'שמור'}
            </button>
            <button type="button" className="btn-secondary" onClick={onCancel} disabled={isSubmitting}>
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
