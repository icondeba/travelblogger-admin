import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AwardService } from '../../services/award.service';
import { ToastService } from '../../services/toast.service';
import { AwardItem } from '../../models/award.model';

@Component({
  selector: 'app-awards-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './awards-list.component.html',
  styleUrl: './awards-list.component.scss'
})
export class AwardsListComponent implements OnInit {
  awards: AwardItem[] = [];
  isLoading = true;

  constructor(private awardService: AwardService, private toast: ToastService) {}

  ngOnInit() {
    this.loadAwards();
  }

  loadAwards() {
    this.isLoading = true;
    this.awardService.getAwards().subscribe({
      next: (awards) => (this.awards = awards),
      error: (error: Error) => {
        this.toast.error(error.message || 'Failed to load awards.');
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  deleteAward(award: AwardItem) {
    const confirmed = window.confirm(`Delete "${award.title}"? This cannot be undone.`);
    if (!confirmed) return;

    this.awardService.deleteAward(award.id).subscribe({
      next: () => {
        this.toast.success('Award deleted.');
        this.awards = this.awards.filter((a) => a.id !== award.id);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to delete award.')
    });
  }
}
