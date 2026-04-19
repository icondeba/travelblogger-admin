export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  submittedAt: string;
  replyMessage: string;
  repliedAt: string | null;
}
