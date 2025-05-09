import React from 'react';
import { Email } from '../types';

interface EmailListProps {
  emails: Email[];
  onEmailClick?: (emailId: string) => void;
}

const EmailList: React.FC<EmailListProps> = ({ emails, onEmailClick }) => {
  // Format date for display
  const formatDate = (date: Date): string => {
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      // Today, show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      // Not today, show date and time
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  const handleEmailClick = (emailId: string) => {
    if (onEmailClick) {
      onEmailClick(emailId);
    }
  };

  if (emails.length === 0) {
    return <p className="text-gray-500 text-center py-4">No critical emails received yet.</p>;
  }

  return (
    <ul className="list-none p-0 m-0">
      {emails.map((email) => (
        <li 
          key={email.id} 
          className={`py-3 px-4 border-b border-gray-200 last:border-b-0 cursor-pointer ${!email.isRead ? 'bg-blue-50' : ''}`}
          onClick={() => handleEmailClick(email.id)}
        >
          <div className="flex justify-between mb-1">
            <span className="font-semibold">{email.from}</span>
            <span className="text-gray-500 text-sm">{formatDate(email.received)}</span>
          </div>
          <div className={`font-medium mb-1 ${email.priority === 'high' ? 'text-red-600 font-bold' : ''}`}>
            {email.subject}
            {email.priority === 'high' && ' [HIGH PRIORITY]'}
          </div>
          <div className="text-gray-700 text-sm leading-relaxed">{email.body}</div>
        </li>
      ))}
    </ul>
  );
};

export default EmailList;