import React, { useState } from 'react';

const EditEventModal = ({ event, onClose, onSave, onDelete }) => {
  const [editedTitle, setEditedTitle] = useState(event.title);
  const [editedStartDate, setEditedStartDate] = useState(
    new Date(event.start).toISOString().split('T')[0]
  );
  const [editedStartTime, setEditedStartTime] = useState(
    new Date(event.start).toTimeString().slice(0, 5)
  );
  const [editedEndDate, setEditedEndDate] = useState(
    new Date(event.end).toISOString().split('T')[0]
  );
  const [editedEndTime, setEditedEndTime] = useState(
    new Date(event.end).toTimeString().slice(0, 5)
  );
  const [editedLocation, setEditedLocation] = useState(event.location || '');
  const [editedDescription, setEditedDescription] = useState(event.description || '');

  const handleSave = () => {
    // Combine date and time for start and end
    const startDateTime = new Date(`${editedStartDate}T${editedStartTime}`);
    const endDateTime = new Date(`${editedEndDate}T${editedEndTime}`);

    const eventData = {
      summary: editedTitle,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      location: editedLocation,
      description: editedDescription,
    };

    onSave(event.id, eventData);
    onClose();
  };

  const handleDelete = () => {
    onDelete(event.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h3 className="text-xl font-bold mb-4">Edit Calendar Event</h3>
        
        <div className="mb-4">
          <label htmlFor="editEventTitle" className="block text-gray-700 text-sm font-bold mb-2">Event Title</label>
          <input
            type="text"
            id="editEventTitle"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            placeholder="e.g., Team Meeting"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Date</label>
            <input
              type="date"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedStartDate}
              onChange={(e) => setEditedStartDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">Start Time</label>
            <input
              type="time"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedStartTime}
              onChange={(e) => setEditedStartTime(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">End Date</label>
            <input
              type="date"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedEndDate}
              onChange={(e) => setEditedEndDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2">End Time</label>
            <input
              type="time"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={editedEndTime}
              onChange={(e) => setEditedEndTime(e.target.value)}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="editEventLocation" className="block text-gray-700 text-sm font-bold mb-2">Location (Optional)</label>
          <input
            type="text"
            id="editEventLocation"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            value={editedLocation}
            onChange={(e) => setEditedLocation(e.target.value)}
            placeholder="e.g., Conference Room A"
          />
        </div>

        <div className="mb-6">
          <label htmlFor="editEventDescription" className="block text-gray-700 text-sm font-bold mb-2">Description (Optional)</label>
          <textarea
            id="editEventDescription"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            placeholder="Event details..."
          />
        </div>

        <div className="flex justify-between">
          <button
            onClick={handleDelete}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            Delete Event
          </button>
          <div className="flex space-x-4">
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
