import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoryService } from '../../services/story.service';
import { ToastService } from '../../services/toast.service';
import { Story } from '../../models/story.model';

@Component({
  selector: 'app-stories-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './stories-list.component.html',
  styleUrl: './stories-list.component.scss'
})
export class StoriesListComponent implements OnInit {
  stories: Story[] = [];
  isLoading = true;

  constructor(private storyService: StoryService, private toast: ToastService) {}

  ngOnInit() {
    this.loadStories();
  }

  loadStories() {
    this.isLoading = true;
    this.storyService.getStories().subscribe({
      next: (stories) => (this.stories = stories),
      error: (error: Error) => this.toast.error(error.message || 'Failed to load stories.'),
      complete: () => (this.isLoading = false)
    });
  }

  deleteStory(story: Story) {
    const confirmed = window.confirm(`Delete "${story.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.storyService.deleteStory(story.id).subscribe({
      next: () => {
        this.toast.success('Story deleted.');
        this.stories = this.stories.filter((item) => item.id !== story.id);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to delete story.')
    });
  }
}
