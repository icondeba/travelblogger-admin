import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoryService } from '../../services/story.service';
import { ContactService } from '../../services/contact.service';
import { EventService } from '../../services/event.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  storiesCount = 0;
  eventsCount = 0;
  messagesCount: number | null = null;
  readonly contactApiAvailable: boolean;
  isLoading = true;

  constructor(
    private storyService: StoryService,
    private eventService: EventService,
    private contactService: ContactService
  ) {
    this.contactApiAvailable = this.contactService.isSupported;
  }

  ngOnInit() {
    this.isLoading = true;
    let pendingRequests = 2;
    const finalizeRequest = () => {
      pendingRequests -= 1;
      if (pendingRequests <= 0) {
        this.isLoading = false;
      }
    };

    this.storyService.getStories().subscribe({
      next: (stories) => (this.storiesCount = stories.length),
      error: () => finalizeRequest(),
      complete: () => finalizeRequest()
    });

    this.eventService.getEvents().subscribe({
      next: (events) => (this.eventsCount = events.length),
      error: () => finalizeRequest(),
      complete: () => finalizeRequest()
    });

    if (this.contactApiAvailable) {
      this.contactService.getMessages().subscribe({
        next: (messages) => (this.messagesCount = messages.length),
        error: () => (this.messagesCount = null)
      });
    }
  }
}
