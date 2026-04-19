import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  private fb = inject(FormBuilder);
  isSubmitting = false;
  errorMessage = '';

  readonly form = this.fb.nonNullable.group({
    userId: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService
  ) {}

  submit() {
    this.errorMessage = '';
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const { userId, password } = this.form.getRawValue();
    this.auth.login(userId, password).subscribe({
      next: () => {
        this.toast.success('Welcome back!');
        this.router.navigate(['/admin/dashboard']);
      },
      error: () => {
        this.errorMessage = 'Login failed. Please check your credentials.';
        this.toast.error('Login failed. Please try again.');
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }
}
