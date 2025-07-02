import React, { useState } from 'react';

const EditEventModal = ({ event, onClose, onSave, onDelete }) => {
  const [title, setTitle] = useState(event?.title || '');
  const [startTime, setStartTime] = useState(
    event?.start ? new Date(event.start).toISOString().slice(0, 16) : ''
  );
  const [endTime, setEndTime] = useState(
    event?.end ? new Date(event.end).toISOString().slice(0, 16) : ''
  );
  const [description, setDescription] = useState(event?.description || '');

  const handleSave = () => {
    const eventData = {
      title,
      start: new Date(startTime).toISOString(),
      end: new Date(endTime).toISOString(),
      description
    };
    onSave(event.id, eventData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDelete(event.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Edit Event</h3>

        <div className="mb-4">
          <label htmlFor="eventTitle" className="block text-gray-700 text-sm font-bold mb-2">
            Event Title
          </label>
          <input
            type="text"
            id="eventTitle"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="eventStart" className="block text-gray-700 text-sm font-bold mb-2">
            Start Time
          </label>
          <input
            type="datetime-local"
            id="eventStart"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="eventEnd" className="block text-gray-700 text-sm font-bold mb-2">
            End Time
          </label>
          <input
            type="datetime-local"
            id="eventEnd"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div className="mb-6">
          <label htmlFor="eventDescription" className="block text-gray-700 text-sm font-bold mb-2">
            Description
          </label>
          <textarea
            id="eventDescription"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Delete Event
          </button>
          <div className="space-x-4">
            <button
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditEventModal;