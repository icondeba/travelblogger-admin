import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-event-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './event-editor.component.html',
  styleUrl: './event-editor.component.scss'
})
export class EventEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEdit = false;
  isLoading = true;
  isSaving = false;
  imagePreview = '';
  private eventId = '';

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    location: ['', Validators.required],
    eventDate: ['', Validators.required],
    details: ['', [Validators.required, Validators.minLength(10)]],
    image: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private eventService: EventService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.eventId;

    if (this.isEdit) {
      this.eventService.getEvent(this.eventId).subscribe({
        next: (eventItem) => {
          const eventDate = eventItem.eventDate
            ? new Date(eventItem.eventDate).toISOString().split('T')[0]
            : '';
          this.form.patchValue({
            title: eventItem.title,
            location: eventItem.location,
            eventDate,
            details: eventItem.details,
            image: eventItem.image
          });
          this.imagePreview = eventItem.image;
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.toast.error(error.message || 'Failed to load event.');
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

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    const payload = this.form.getRawValue();

    if (this.isEdit) {
      this.eventService.updateEvent(this.eventId, payload).subscribe({
        next: () => {
          this.toast.success('Event updated.');
          this.router.navigate(['/admin/events']);
        },
        error: (error: Error) => this.toast.error(error.message || 'Failed to update event.'),
        complete: () => (this.isSaving = false)
      });
      return;
    }

    this.eventService.createEvent(payload).subscribe({
      next: () => {
        this.toast.success('Event created.');
        this.router.navigate(['/admin/events']);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to create event.'),
      complete: () => (this.isSaving = false)
    });
  }

  cancel() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/events']);
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
