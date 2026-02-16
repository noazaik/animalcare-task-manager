import { useState, useEffect, useCallback } from 'react';
import { Task, TaskFormData } from '../types';
import * as api from '../services/api';

export function useTasks(selectedDate: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.getTasks(selectedDate);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת משימות');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (data: TaskFormData) => {
    await api.createTask(data);
    await fetchTasks();
  };

  const updateTask = async (id: number, data: Partial<TaskFormData>) => {
    await api.updateTask(id, data);
    await fetchTasks();
  };

  const deleteTask = async (id: number) => {
    await api.deleteTask(id);
    await fetchTasks();
  };

  const toggleComplete = async (id: number, complete: boolean) => {
    await api.toggleTaskCompletion(id, complete, selectedDate);
    await fetchTasks();
  };

  const reorderTasks = async (taskIds: number[]) => {
    await api.reorderTasks(taskIds);
    await fetchTasks();
  };

  return {
    tasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    reorderTasks,
    refetch: fetchTasks
  };
}
