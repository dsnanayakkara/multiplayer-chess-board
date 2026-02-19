import { EmailSender } from './EmailSender';

export class ConsoleEmailSender implements EmailSender {
  async sendMagicLink(email: string, url: string): Promise<void> {
    console.log(`[magic-link] to=${email} url=${url}`);
  }
}
