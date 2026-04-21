import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MilestoneService } from '../../services/milestone.service';
import { ToastService } from '../../services/toast.service';
import { MilestoneItem } from '../../models/milestone.model';

@Component({
  selector: 'app-milestones-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './milestones-list.component.html',
  styleUrl: './milestones-list.component.scss'
})
export class MilestonesListComponent implements OnInit {
  milestones: MilestoneItem[] = [];
  isLoading = true;

  constructor(private milestoneService: MilestoneService, private toast: ToastService) {}

  ngOnInit() {
    this.loadMilestones();
  }

  loadMilestones() {
    this.isLoading = true;
    this.milestoneService.getMilestones().subscribe({
      next: (milestones) => (this.milestones = milestones),
      error: (error: Error) => {
        this.toast.error(error.message || 'Failed to load milestones.');
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  deleteMilestone(milestone: MilestoneItem) {
    const confirmed = window.confirm(`Delete "${milestone.title}"? This cannot be undone.`);
    if (!confirmed) return;

    this.milestoneService.deleteMilestone(milestone.id).subscribe({
      next: () => {
        this.toast.success('Milestone deleted.');
        this.milestones = this.milestones.filter((m) => m.id !== milestone.id);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to delete milestone.')
    });
  }
}
