import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MilestoneService } from '../../services/milestone.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-milestone-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './milestone-editor.component.html',
  styleUrl: './milestone-editor.component.scss'
})
export class MilestoneEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEdit = false;
  isLoading = true;
  isSaving = false;
  private milestoneId = '';

  readonly form = this.fb.nonNullable.group({
    year: ['', Validators.required],
    title: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]]
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private milestoneService: MilestoneService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.milestoneId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.milestoneId;

    if (this.isEdit) {
      this.milestoneService.getMilestone(this.milestoneId).subscribe({
        next: (milestone) => {
          this.form.patchValue({
            year: milestone.year,
            title: milestone.title,
            description: milestone.description
          });
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.toast.error(error.message || 'Failed to load milestone.');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue();

    if (this.isEdit) {
      this.milestoneService.updateMilestone(this.milestoneId, payload).subscribe({
        next: () => {
          this.toast.success('Milestone updated.');
          this.router.navigate(['/admin/milestones']);
        },
        error: (error: Error) => this.toast.error(error.message || 'Failed to update milestone.'),
        complete: () => (this.isSaving = false)
      });
      return;
    }

    this.milestoneService.createMilestone(payload).subscribe({
      next: () => {
        this.toast.success('Milestone created.');
        this.router.navigate(['/admin/milestones']);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to create milestone.'),
      complete: () => (this.isSaving = false)
    });
  }

  cancel() {
    this.router.navigate(['/admin/milestones']);
  }
}
