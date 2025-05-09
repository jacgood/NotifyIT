import { Email } from '../types';

/**
 * Email service to handle email fetching and processing
 * Note: This is a mock implementation. In a real app, this would connect to 
 * email APIs like Gmail or Outlook using OAuth2 authentication.
 */
class EmailService {
  private mockEmails: Email[] = [
    {
      id: 'email-1',
      from: 'monitoring@company.com',
      subject: 'CRITICAL: Database server at 95% capacity',
      body: 'The primary database server is approaching capacity limits. Please investigate immediately.',
      received: new Date(Date.now() - 35 * 60000), // 35 minutes ago
      isRead: false,
      priority: 'high'
    },
    {
      id: 'email-2',
      from: 'alerts@company.com',
      subject: 'URGENT: Authentication service down',
      body: 'The authentication service is not responding. Users are unable to log in. Immediate action required.',
      received: new Date(Date.now() - 120 * 60000), // 2 hours ago
      isRead: true,
      priority: 'high'
    },
    {
      id: 'email-3',
      from: 'monitoring@company.com',
      subject: 'WARNING: High CPU usage detected',
      body: 'The application server is experiencing high CPU usage. Please investigate at your convenience.',
      received: new Date(Date.now() - 240 * 60000), // 4 hours ago
      isRead: true,
      priority: 'normal'
    }
  ];

  /**
   * Fetch critical emails
   * @returns Promise that resolves to an array of Email objects
   */
  fetchCriticalEmails(): Promise<Email[]> {
    // In a real implementation, this would make API calls to email providers
    return Promise.resolve([...this.mockEmails]);
  }

  /**
   * Check for new emails
   * This is a mock implementation that has a chance to generate a new critical email
   * @returns Promise that resolves to new emails if any
   */
  checkForNewEmails(): Promise<Email[]> {
    return new Promise((resolve) => {
      // 20% chance of receiving a new critical email (for demo purposes)
      if (Math.random() < 0.2) {
        const criticalSubjects = [
          'CRITICAL: Service outage detected',
          'URGENT: Security breach detected',
          'CRITICAL: Network connectivity issues',
          'ALERT: Web server not responding',
          'CRITICAL: Payment processing failure'
        ];
        
        const criticalBodies = [
          'Our monitoring system has detected a service outage. Immediate action required.',
          'Potential security breach detected on production servers. Please investigate immediately.',
          'Network connectivity issues affecting multiple services. Users are reporting timeouts.',
          'The main web server is not responding to health checks for the past 5 minutes.',
          'Payment processing service is failing with error code 500. Transactions are being rejected.'
        ];
        
        const randomIndex = Math.floor(Math.random() * criticalSubjects.length);
        const newEmail: Email = {
          id: `email-${Date.now()}`,
          from: Math.random() > 0.5 ? 'alerts@company.com' : 'monitoring@company.com',
          subject: criticalSubjects[randomIndex],
          body: criticalBodies[randomIndex],
          received: new Date(),
          isRead: false,
          priority: 'high'
        };
        
        this.mockEmails = [newEmail, ...this.mockEmails];
        resolve([newEmail]);
      } else {
        resolve([]);
      }
    });
  }

  /**
   * Mark an email as read
   * @param emailId ID of the email to mark as read
   * @returns Promise that resolves to true if successful
   */
  markAsRead(emailId: string): Promise<boolean> {
    const emailIndex = this.mockEmails.findIndex(email => email.id === emailId);
    if (emailIndex !== -1) {
      this.mockEmails[emailIndex].isRead = true;
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  }
}

// Singleton instance
export const emailService = new EmailService();