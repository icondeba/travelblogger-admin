import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

export const AuthGuard: CanActivateFn = () => {
  if (!environment.production) {
    return true;
  }

  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.isAuthenticated) {
    return true;
  }
  return router.createUrlTree(['/admin/login']);
};
