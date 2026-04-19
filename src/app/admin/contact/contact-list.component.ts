import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../services/contact.service';
import { ToastService } from '../../services/toast.service';
import { ContactMessage } from '../../models/contact.model';

@Component({
  selector: 'app-contact-list',
  standalone: true,
  imports: [CommonModule, DatePipe, FormsModule],
  templateUrl: './contact-list.component.html',
  styleUrl: './contact-list.component.scss'
})
export class ContactListComponent implements OnInit {
  messages: ContactMessage[] = [];
  isLoading = true;
  activeReplyId = '';
  replyText = '';
  isReplying = false;
  readonly apiAvailable: boolean;

  constructor(private contactService: ContactService, private toast: ToastService) {
    this.apiAvailable = contactService.isSupported;
  }

  ngOnInit() {
    if (!this.apiAvailable) {
      this.isLoading = false;
      return;
    }

    this.contactService.getMessages().subscribe({
      next: (messages) => (this.messages = messages),
      error: (error: Error) => {
        this.toast.error(error.message || 'Failed to load messages.');
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  startReply(message: ContactMessage) {
    this.activeReplyId = message.id;
    this.replyText = message.replyMessage ?? '';
  }

  cancelReply() {
    this.activeReplyId = '';
    this.replyText = '';
  }

  sendReply(message: ContactMessage) {
    const trimmed = this.replyText.trim();
    if (!trimmed) {
      this.toast.error('Reply message is required.');
      return;
    }

    this.isReplying = true;
    this.contactService.replyToMessage(message.id, trimmed).subscribe({
      next: (updated) => {
        this.messages = this.messages.map((item) => (item.id === updated.id ? updated : item));
        this.toast.success('Reply sent and notifications delivered.');
        this.cancelReply();
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to send reply.'),
      complete: () => (this.isReplying = false)
    });
  }
}
