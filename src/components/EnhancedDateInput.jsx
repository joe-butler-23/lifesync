import React from 'react';

const EnhancedDateInput = ({ value, onChange, placeholder, mode, onModeChange }) => {
  const handleDateChange = (e) => {
    onChange(e.target.value);
  };

  const handleModeToggle = () => {
    onModeChange(mode === 'natural' ? 'picker' : 'natural');
  };

  const formatDateForInput = (dateValue) => {
    if (!dateValue) return '';
    if (mode === 'picker') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }
    return dateValue;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-gray-700 text-sm font-bold">
          Due Date
        </label>
        <button
          type="button"
          onClick={handleModeToggle}
          className="text-xs text-blue-600 hover:text-blue-800"
        >
          {mode === 'natural' ? 'Use Date Picker' : 'Use Natural Language'}
        </button>
      </div>

      {mode === 'natural' ? (
        <input
          type="text"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={value}
          onChange={handleDateChange}
          placeholder={placeholder || 'e.g., today, tomorrow, next monday, 2024-12-31'}
        />
      ) : (
        <input
          type="date"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          value={formatDateForInput(value)}
          onChange={handleDateChange}
        />
      )}

      <div className="text-xs text-gray-500">
        {mode === 'natural'
          ? 'Try: today, tomorrow, next monday, in 2 weeks, 2024-12-31'
          : 'Select a date from the calendar'}
      </div>
    </div>
  );
};

export default EnhancedDateInput;
