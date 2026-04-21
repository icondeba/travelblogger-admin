import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AwardService } from '../../services/award.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-award-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './award-editor.component.html',
  styleUrl: './award-editor.component.scss'
})
export class AwardEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEdit = false;
  isLoading = true;
  isSaving = false;
  imagePreview = '';
  private awardId = '';

  readonly form = this.fb.nonNullable.group({
    year: ['', Validators.required],
    title: ['', Validators.required],
    organization: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    image: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private awardService: AwardService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.awardId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.awardId;

    if (this.isEdit) {
      this.awardService.getAward(this.awardId).subscribe({
        next: (award) => {
          this.form.patchValue({
            year: award.year,
            title: award.title,
            organization: award.organization,
            description: award.description,
            image: award.image
          });
          this.imagePreview = award.image;
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.toast.error(error.message || 'Failed to load award.');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const error = this.validateImage(file);
    if (error) {
      this.toast.error(error);
      input.value = '';
      return;
    }

    this.toBase64(file)
      .then((base64) => {
        this.form.patchValue({ image: base64 });
        this.imagePreview = base64;
      })
      .catch(() => this.toast.error('Failed to process image.'));
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue();

    if (this.isEdit) {
      this.awardService.updateAward(this.awardId, payload).subscribe({
        next: () => {
          this.toast.success('Award updated.');
          this.router.navigate(['/admin/awards']);
        },
        error: (error: Error) => this.toast.error(error.message || 'Failed to update award.'),
        complete: () => (this.isSaving = false)
      });
      return;
    }

    this.awardService.createAward(payload).subscribe({
      next: () => {
        this.toast.success('Award created.');
        this.router.navigate(['/admin/awards']);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to create award.'),
      complete: () => (this.isSaving = false)
    });
  }

  cancel() {
    this.router.navigate(['/admin/awards']);
  }

  private validateImage(file: File): string | null {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) return 'Only JPG, PNG, or WEBP images are allowed.';
    if (file.size > 5 * 1024 * 1024) return 'Image must be under 5MB.';
    return null;
  }

  private toBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}
