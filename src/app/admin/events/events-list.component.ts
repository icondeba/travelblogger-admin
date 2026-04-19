import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';
import { EventItem } from '../../models/event.model';

@Component({
  selector: 'app-events-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './events-list.component.html',
  styleUrl: './events-list.component.scss'
})
export class EventsListComponent implements OnInit {
  events: EventItem[] = [];
  isLoading = true;

  constructor(private eventService: EventService, private toast: ToastService) {}

  ngOnInit() {
    this.loadEvents();
  }

  loadEvents() {
    this.isLoading = true;
    this.eventService.getEvents().subscribe({
      next: (events) => (this.events = events),
      error: (error: Error) => {
        this.toast.error(error.message || 'Failed to load events.');
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  deleteEvent(eventItem: EventItem) {
    const confirmed = window.confirm(`Delete "${eventItem.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.eventService.deleteEvent(eventItem.id).subscribe({
      next: () => {
        this.toast.success('Event deleted.');
        this.events = this.events.filter((item) => item.id !== eventItem.id);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to delete event.')
    });
  }
}
