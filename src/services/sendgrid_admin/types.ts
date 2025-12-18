// Simplified types for email activity only
export interface EmailActivity {
  msgId: string;
  email: string;
  fromEmail?: string;
  subject?: string;
  event: string;
  timestamp: number;
  status?: string;
  opens?: number;
  clicks?: number;
  htmlContent?: string;
  plainContent?: string;
}

export interface GetEmailActivityInput {
  limit?: number;
  query?: string;
  msgId?: string;
}

export interface EmailDetails {
  msgId: string;
  to: string;
  from: string;
  subject: string;
  htmlContent?: string;
  plainContent?: string;
  timestamp: number;
  status: string;
}
