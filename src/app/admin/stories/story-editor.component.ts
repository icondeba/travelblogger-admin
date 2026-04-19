import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { QuillModule } from 'ngx-quill';
import { StoryService } from '../../services/story.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-story-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillModule],
  templateUrl: './story-editor.component.html',
  styleUrl: './story-editor.component.scss'
})
export class StoryEditorComponent implements OnInit {
  private fb = inject(FormBuilder);
  isEdit = false;
  isLoading = true;
  isSaving = false;
  imagePreview = '';
  private storyId = '';
  private slugTouched = false;
  private autoSlugging = false;

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    slug: ['', Validators.required],
    excerpt: ['', [Validators.required, Validators.maxLength(500)]],
    status: ['Draft' as 'Draft' | 'Published', Validators.required],
    content: ['', Validators.required],
    image: [''],
    publishDate: ['']
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private storyService: StoryService,
    private toast: ToastService
  ) {}

  ngOnInit() {
    this.storyId = this.route.snapshot.paramMap.get('id') ?? '';
    this.isEdit = !!this.storyId;

    this.form.controls.title.valueChanges.subscribe((value) => {
      if (!this.slugTouched) {
        this.autoSlugging = true;
        this.form.controls.slug.setValue(this.slugify(value ?? ''), { emitEvent: true });
        this.autoSlugging = false;
      }
    });

    this.form.controls.slug.valueChanges.subscribe(() => {
      if (!this.autoSlugging) {
        this.slugTouched = true;
      }
    });

    if (this.isEdit) {
      this.storyService.getStory(this.storyId).subscribe({
        next: (story) => {
          const publishDate = story.publishDate
            ? new Date(story.publishDate).toISOString().split('T')[0]
            : '';
          this.form.patchValue({
            title: story.title,
            slug: story.slug,
            excerpt: story.excerpt,
            status: story.status,
            content: story.content,
            image: story.image,
            publishDate
          });
          this.imagePreview = story.image;
          this.isLoading = false;
        },
        error: (error: Error) => {
          this.toast.error(error.message || 'Failed to load story.');
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
    const value = this.form.getRawValue();
    const payload = {
      title: value.title,
      slug: value.slug,
      excerpt: value.excerpt,
      status: value.status,
      content: value.content,
      image: value.image,
      publishedAt: value.publishDate ? new Date(value.publishDate).toISOString() : null
    };

    if (this.isEdit) {
      this.storyService.updateStory(this.storyId, payload).subscribe({
        next: () => {
          this.toast.success('Story updated.');
          this.router.navigate(['/admin/stories']);
        },
        error: (error: Error) => this.toast.error(error.message || 'Failed to update story.'),
        complete: () => (this.isSaving = false)
      });
      return;
    }

    this.storyService.createStory(payload).subscribe({
      next: () => {
        this.toast.success('Story created.');
        this.router.navigate(['/admin/stories']);
      },
      error: (error: Error) => this.toast.error(error.message || 'Failed to create story.'),
      complete: () => (this.isSaving = false)
    });
  }

  cancel() {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }

    this.router.navigate(['/admin/stories']);
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
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
