import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TrekkingInfoService } from '../../services/trekking-info.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-trekking-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './trekking-editor.component.html',
  styleUrl: './trekking-editor.component.scss'
})
export class TrekkingEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEdit = false;
  isLoading = true;
  isSaving = false;
  imagePreview = '';
  private itemId = '';

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    location: ['', Validators.required],
    difficulty: ['', Validators.required],
    duration: ['', Validators.required],
    bestSeason: ['', Validators.required],
    details: ['', [Validators.required, Validators.minLength(10)]],
    route: ['', [Validators.required, Validators.minLength(10)]],
    mapEmbedUrl: [''],
    image: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private trekkingService: TrekkingInfoService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.itemId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.itemId;

    if (this.isEdit) {
      this.trekkingService.getItem(this.itemId).subscribe({
        next: (item) => {
          this.form.patchValue({
            title: item.title,
            location: item.location,
            difficulty: item.difficulty,
            duration: item.duration,
            bestSeason: item.bestSeason,
            details: item.details,
            route: item.route,
            mapEmbedUrl: item.mapEmbedUrl,
            image: item.image
          });
          this.imagePreview = item.image;
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.toast.error(error.message || 'Failed to load trekking information.');
          this.isLoading = false;
        }
      });
      return;
    }

    this.isLoading = false;
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

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

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue();

    if (this.isEdit) {
      this.trekkingService.updateItem(this.itemId, payload).subscribe({
        next: () => {
          this.toast.success('Trekking information updated.');
          this.router.navigate(['/admin/trekking']);
        },
        error: (error: Error) => this.toast.error(error.message || 'Failed to update trekking information.'),
        complete: () => (this.isSaving = false)
      });
      return;
    }

    this.trekkingService.createItem(payload).subscribe({
      next: () => {
        this.toast.success('Trekking information created.');
        this.router.navigate(['/admin/trekking']);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to create trekking information.'),
      complete: () => (this.isSaving = false)
    });
  }

  cancel(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/trekking']);
  }

  private validateImage(file: File): string | null {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      return 'Only JPG, PNG, or WEBP files are allowed.';
    }

    const maxSizeMb = 5;
    if (file.size > maxSizeMb * 1024 * 1024) {
      return 'Image must be smaller than 5MB.';
    }

    return null;
  }

  private async toBase64(file: File): Promise<string> {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
