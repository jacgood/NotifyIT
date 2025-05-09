import React, { useState } from 'react';

interface EmailSettingsProps {
  filters: {
    senders: string[];
    subjects: string[];
    highPriorityOnly: boolean;
  };
  onFiltersChange: (newFilters: any) => void;
}

const EmailSettings: React.FC<EmailSettingsProps> = ({ filters, onFiltersChange }) => {
  const [newSender, setNewSender] = useState('');
  const [newSubject, setNewSubject] = useState('');

  const handlePriorityToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      highPriorityOnly: e.target.checked
    });
  };

  const handleAddSender = () => {
    if (newSender && !filters.senders.includes(newSender)) {
      onFiltersChange({
        ...filters,
        senders: [...filters.senders, newSender]
      });
      setNewSender('');
    }
  };

  const handleRemoveSender = (sender: string) => {
    onFiltersChange({
      ...filters,
      senders: filters.senders.filter(s => s !== sender)
    });
  };

  const handleAddSubject = () => {
    if (newSubject && !filters.subjects.includes(newSubject)) {
      onFiltersChange({
        ...filters,
        subjects: [...filters.subjects, newSubject]
      });
      setNewSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    onFiltersChange({
      ...filters,
      subjects: filters.subjects.filter(s => s !== subject)
    });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 shadow-md flex-1">
      <h2 className="text-xl font-semibold text-slate-800 mt-0 mb-4">Email Filter Settings</h2>
      
      <div className="mb-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="highPriorityOnly"
            checked={filters.highPriorityOnly}
            onChange={handlePriorityToggle}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 mr-2"
          />
          <label htmlFor="highPriorityOnly" className="text-gray-700">Only notify for high priority emails</label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Notify for these senders:</label>
        <div className="space-y-2">
          <div className="flex">
            <input
              type="email"
              value={newSender}
              onChange={(e) => setNewSender(e.target.value)}
              placeholder="Enter email address"
              className="flex-1 p-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="button" 
              onClick={handleAddSender}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.senders.map((sender, index) => (
              <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center">
                <span className="mr-1">{sender}</span>
                <button 
                  onClick={() => handleRemoveSender(sender)}
                  className="text-blue-500 hover:text-blue-700 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-4">
        <label className="block mb-2 font-medium text-gray-700">Notify for these subject keywords:</label>
        <div className="space-y-2">
          <div className="flex">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              placeholder="Enter keyword"
              className="flex-1 p-2 border border-gray-300 rounded-l focus:ring-blue-500 focus:border-blue-500"
            />
            <button 
              type="button" 
              onClick={handleAddSubject}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r transition-colors"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.subjects.map((subject, index) => (
              <div key={index} className="bg-green-100 text-green-800 px-3 py-1 rounded-full flex items-center">
                <span className="mr-1">{subject}</span>
                <button 
                  onClick={() => handleRemoveSubject(subject)}
                  className="text-green-500 hover:text-green-700 font-bold"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailSettings;