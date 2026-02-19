export interface EmailSender {
  sendMagicLink(email: string, url: string): Promise<void>;
}
