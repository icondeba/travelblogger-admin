import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TrekkingInfoService } from '../../services/trekking-info.service';
import { ToastService } from '../../services/toast.service';
import { TrekkingInfoItem } from '../../models/trekking-info.model';

@Component({
  selector: 'app-trekking-list',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe],
  templateUrl: './trekking-list.component.html',
  styleUrl: './trekking-list.component.scss'
})
export class TrekkingListComponent implements OnInit {
  items: TrekkingInfoItem[] = [];
  isLoading = true;

  constructor(private trekkingService: TrekkingInfoService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.isLoading = true;
    this.trekkingService.getItems().subscribe({
      next: (items) => (this.items = items),
      error: (error: Error) => {
        this.toast.error(error.message || 'Failed to load trekking information.');
        this.isLoading = false;
      },
      complete: () => (this.isLoading = false)
    });
  }

  deleteItem(item: TrekkingInfoItem): void {
    const confirmed = window.confirm(`Delete "${item.title}"? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    this.trekkingService.deleteItem(item.id).subscribe({
      next: () => {
        this.toast.success('Trekking information deleted.');
        this.items = this.items.filter((current) => current.id !== item.id);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to delete trekking information.')
    });
  }
}
