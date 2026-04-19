import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AboutService } from '../../services/about.service';
import { ToastService } from '../../services/toast.service';
import { AboutRecord } from '../../models/about.model';

@Component({
  selector: 'app-about-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './about-editor.component.html',
  styleUrl: './about-editor.component.scss'
})
export class AboutEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  isLoading = true;
  isSaving = false;
  isEditing = false;
  loadError = '';
  imagePreview = '';
  aboutRecord: AboutRecord | null = null;

  readonly form = this.fb.nonNullable.group({
    heading: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(250)]],
    biography: ['', [Validators.required, Validators.minLength(20)]],
    profileImageUrl: ['', Validators.required]
  });

  constructor(private aboutService: AboutService, private toast: ToastService) {}

  ngOnInit() {
    this.loadAbout();
  }

  loadAbout() {
    this.isLoading = true;
    this.loadError = '';
    this.aboutService.getAbout().subscribe({
      next: (record) => {
        this.aboutRecord = record;
        if (record) {
          this.form.patchValue({
            heading: record.heading,
            biography: record.biography,
            profileImageUrl: record.profileImageUrl
          });
          this.imagePreview = record.profileImageUrl;
          this.isEditing = false;
        } else {
          this.form.reset({
            heading: '',
            biography: '',
            profileImageUrl: ''
          });
          this.imagePreview = '';
          this.isEditing = true;
        }
        this.isLoading = false;
      },
      error: () => {
        this.aboutRecord = null;
        this.isEditing = true;
        this.form.reset({
          heading: '',
          biography: '',
          profileImageUrl: ''
        });
        this.imagePreview = '';
        this.loadError = 'Could not load existing About Me data from API. You can still edit and save.';
        this.toast.error('Failed to load about content.');
        this.isLoading = false;
      }
    });
  }

  startEditing() {
    if (this.aboutRecord) {
      this.form.patchValue({
        heading: this.aboutRecord.heading,
        biography: this.aboutRecord.biography,
        profileImageUrl: this.aboutRecord.profileImageUrl
      });
      this.imagePreview = this.aboutRecord.profileImageUrl;
    }
    this.isEditing = true;
  }

  cancelEditing() {
    if (this.aboutRecord) {
      this.form.patchValue({
        heading: this.aboutRecord.heading,
        biography: this.aboutRecord.biography,
        profileImageUrl: this.aboutRecord.profileImageUrl
      });
      this.imagePreview = this.aboutRecord.profileImageUrl;
      this.isEditing = false;
      return;
    }

    this.form.reset({
      heading: '',
      biography: '',
      profileImageUrl: ''
    });
    this.imagePreview = '';
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
        this.form.patchValue({ profileImageUrl: base64 });
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
    const value = this.form.getRawValue();
    const payload = {
      heading: value.heading,
      biography: value.biography,
      profileImageUrl: value.profileImageUrl
    };

    this.aboutService.updateAbout(payload).subscribe({
      next: (updated) => {
        this.loadError = '';
        this.aboutRecord = updated;
        this.imagePreview = updated.profileImageUrl;
        this.form.patchValue({
          heading: updated.heading,
          biography: updated.biography,
          profileImageUrl: updated.profileImageUrl
        });
        this.isEditing = false;
        this.toast.success('About content updated.');
        this.isSaving = false;
      },
      error: (error: HttpErrorResponse) => {
        const serverMessage = this.extractErrorMessage(error);
        const needsBase64Retry =
          payload.profileImageUrl.startsWith('http://') ||
          payload.profileImageUrl.startsWith('https://');

        if (needsBase64Retry && serverMessage.toLowerCase().includes('base64')) {
          this.resolveImagePayload(payload.profileImageUrl)
            .then((base64Image) => {
                this.aboutService
                  .updateAbout({
                    heading: payload.heading,
                    biography: payload.biography,
                    profileImageUrl: base64Image
                  })
                .subscribe({
                  next: (updated) => {
                    this.loadError = '';
                    this.aboutRecord = updated;
                    this.imagePreview = updated.profileImageUrl;
                    this.form.patchValue({
                      heading: updated.heading,
                      biography: updated.biography,
                      profileImageUrl: updated.profileImageUrl
                    });
                    this.isEditing = false;
                    this.toast.success('About content updated.');
                  },
                  error: (retryError: HttpErrorResponse) => {
                    const retryMessage = this.extractErrorMessage(retryError);
                    this.toast.error(retryMessage || 'Failed to update about content.');
                  },
                  complete: () => (this.isSaving = false)
                });
            })
            .catch(() => {
              this.toast.error('Failed to update about content.');
              this.isSaving = false;
            });
          return;
        }

        this.toast.error(serverMessage || 'Failed to update about content.');
        this.isSaving = false;
      }
    });
  }

  deleteAbout() {
    if (!this.aboutRecord) {
      return;
    }

    const confirmed = window.confirm('Delete existing About Me data? This cannot be undone.');
    if (!confirmed) {
      return;
    }

    this.isSaving = true;
    this.aboutService.deleteAbout(this.aboutRecord.id).subscribe({
      next: () => {
        this.loadError = '';
        this.aboutRecord = null;
        this.form.reset({
          heading: '',
          biography: '',
          profileImageUrl: ''
        });
        this.imagePreview = '';
        this.isEditing = true;
        this.toast.success('About content deleted.');
      },
      error: (error: HttpErrorResponse) => {
        const message = this.extractErrorMessage(error);
        this.toast.error(message || 'Failed to delete about content.');
      },
      complete: () => (this.isSaving = false)
    });
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

  private async resolveImagePayload(image: string): Promise<string> {
    if (image.startsWith('data:')) {
      return image;
    }

    if (image.startsWith('http://') || image.startsWith('https://')) {
      const response = await fetch(image);
      if (!response.ok) {
        throw new Error('Failed to download existing image');
      }
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result ?? ''));
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      });
    }

    return image;
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const payload = error.error as Record<string, unknown> | undefined;
    if (!payload) {
      return '';
    }

    const message = payload['message'] ?? payload['Message'];
    return typeof message === 'string' ? message : '';
  }
}
