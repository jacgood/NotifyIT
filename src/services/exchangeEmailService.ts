import { Client } from '@microsoft/microsoft-graph-client';
import { authService } from './authService';
import { Email } from '../types';

/**
 * Exchange Online Email Service using Microsoft Graph API
 * This service connects to Microsoft 365 Exchange Online mailboxes
 */
class ExchangeEmailService {
  private graphClient: Client | null = null;
  private lastCheckTime: Date = new Date();

  /**
   * Initialize Microsoft Graph client with authentication
   */
  private async getGraphClient(): Promise<Client> {
    if (!this.graphClient) {
      // Get access token from auth service
      const accessToken = await authService.getAccessToken();
      
      // Initialize Microsoft Graph client
      this.graphClient = Client.init({
        authProvider: (done) => {
          done(null, accessToken);
        }
      });
    }
    return this.graphClient;
  }

  /**
   * Convert Microsoft Graph message to our Email type
   */
  private convertGraphMessageToEmail(message: any): Email {
    return {
      id: message.id,
      from: message.from?.emailAddress?.address || 'unknown@example.com',
      subject: message.subject || '(No Subject)',
      body: message.bodyPreview || '',
      received: new Date(message.receivedDateTime),
      isRead: message.isRead || false,
      priority: message.importance === 'high' ? 'high' : 
               message.importance === 'low' ? 'low' : 'normal'
    };
  }

  /**
   * Fetch critical emails based on filter criteria
   * @returns Promise that resolves to an array of Email objects
   */
  async fetchCriticalEmails(): Promise<Email[]> {
    try {
      const client = await this.getGraphClient();
      let allEmails: Email[] = [];
      
      console.log('Fetching recent emails...');
      try {
        // Fetch the most recent emails without complex filtering
        const response = await client
          .api('/me/messages')
          .select('id,subject,bodyPreview,from,receivedDateTime,isRead,importance')
          .top(50)
          .get();
        
        console.log(`Fetched ${response.value.length} recent emails`);
        
        // Convert to our Email format
        const emails = response.value.map(this.convertGraphMessageToEmail);
        
        // Filter emails client-side based on importance and keywords
        const criticalEmails = emails.filter((email: Email) => {
          const subject = email.subject.toUpperCase();
          return (
            email.priority === 'high' || 
            subject.includes('URGENT') || 
            subject.includes('CRITICAL') || 
            subject.includes('ALERT')
          );
        });
        
        console.log(`Found ${criticalEmails.length} critical emails after filtering`);
        allEmails = criticalEmails;
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
      
      // Sort all emails by received date (newest first)
      allEmails.sort((a, b) => b.received.getTime() - a.received.getTime());
      
      // Update last check time
      this.lastCheckTime = new Date();
      console.log(`Total critical emails: ${allEmails.length}`);
      
      return allEmails;
    } catch (error) {
      console.error('Error fetching emails from Exchange:', error);
      throw error;
    }
  }

  /**
   * Check for new emails since last check
   * @returns Promise that resolves to new emails if any
   */
  async checkForNewEmails(): Promise<Email[]> {
    try {
      const client = await this.getGraphClient();
      let newEmails: Email[] = [];
      
      // Format date for Graph API query
      const lastCheckTimeStr = this.lastCheckTime.toISOString();
      
      console.log('Checking for new emails since', lastCheckTimeStr);
      try {
        // Simple query to get recent emails since last check
        const response = await client
          .api('/me/messages')
          .select('id,subject,bodyPreview,from,receivedDateTime,isRead,importance')
          .filter(`receivedDateTime gt ${lastCheckTimeStr}`)
          .top(30)
          .get();
        
        console.log(`Found ${response.value.length} new emails since last check`);
        
        // Convert to our Email format
        const emails = response.value.map(this.convertGraphMessageToEmail);
        
        // Filter emails client-side based on importance and keywords
        const criticalEmails = emails.filter((email: Email) => {
          const subject = email.subject.toUpperCase();
          return (
            email.priority === 'high' || 
            subject.includes('URGENT') || 
            subject.includes('CRITICAL') || 
            subject.includes('ALERT')
          );
        });
        
        console.log(`Found ${criticalEmails.length} new critical emails after filtering`);
        newEmails = criticalEmails;
      } catch (error) {
        console.error('Error checking for new emails:', error);
      }
      
      // Sort all emails by received date (newest first)
      newEmails.sort((a, b) => b.received.getTime() - a.received.getTime());
      
      // Update last check time
      this.lastCheckTime = new Date();
      console.log(`Total new critical emails: ${newEmails.length}`);
      
      return newEmails;
    } catch (error) {
      console.error('Error checking for new emails:', error);
      return [];
    }
  }

  /**
   * Mark an email as read
   * @param emailId ID of the email to mark as read
   * @returns Promise that resolves to true if successful
   */
  async markAsRead(emailId: string): Promise<boolean> {
    try {
      const client = await this.getGraphClient();
      
      // Update message to mark as read
      await client
        .api(`/me/messages/${emailId}`)
        .update({
          isRead: true
        });
      
      return true;
    } catch (error) {
      console.error('Error marking email as read:', error);
      return false;
    }
  }

  /**
   * Check if user is authenticated with Microsoft
   */
  isAuthenticated(): boolean {
    return authService.isAuthenticated();
  }

  /**
   * Get user email address
   */
  async getUserEmail(): Promise<string> {
    try {
      const client = await this.getGraphClient();
      const user = await client.api('/me').select('mail').get();
      return user.mail || '';
    } catch (error) {
      console.error('Error getting user email:', error);
      return '';
    }
  }
}

// Singleton instance
export const exchangeEmailService = new ExchangeEmailService();
