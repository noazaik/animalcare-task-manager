interface TaskFiltersProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export function TaskFilters({ selectedDate, onDateChange }: TaskFiltersProps) {
  const today = new Date().toISOString().split('T')[0];

  const goToToday = () => {
    onDateChange(today);
  };

  const goToPrevDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const goToNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    onDateChange(date.toISOString().split('T')[0]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="task-filters">
      <div className="date-nav">
        <button onClick={goToPrevDay} className="btn-nav">→</button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="date-input"
        />
        <button onClick={goToNextDay} className="btn-nav">←</button>
      </div>
      <div className="date-display">
        <span>{formatDate(selectedDate)}</span>
        {selectedDate !== today && (
          <button onClick={goToToday} className="btn-today">
            היום
          </button>
        )}
      </div>
    </div>
  );
}
