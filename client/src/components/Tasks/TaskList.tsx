import { useState } from 'react';
import { Task, TaskFormData } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useTasks } from '../../hooks/useTasks';
import { TaskItem } from './TaskItem';
import { TaskForm } from './TaskForm';
import { TaskFilters } from './TaskFilters';

export function TaskList() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { isAdmin } = useAuth();

  const {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete
  } = useTasks(selectedDate);

  const handleCreateTask = async (data: TaskFormData) => {
    await createTask(data);
    setShowForm(false);
  };

  const handleUpdateTask = async (data: TaskFormData) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
      setEditingTask(null);
    }
  };

  const handleDeleteTask = async (id: number) => {
    if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      await deleteTask(id);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  if (isLoading) {
    return <div className="loading">טוען משימות...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="task-list-container">
      <TaskFilters selectedDate={selectedDate} onDateChange={setSelectedDate} />

      {isAdmin && (
        <div className="task-list-header">
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + משימה חדשה
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <div className="empty-state">
          <p>אין משימות לתאריך זה</p>
        </div>
      ) : (
        <div className="task-list">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={toggleComplete}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {(showForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onCancel={() => {
            setShowForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
