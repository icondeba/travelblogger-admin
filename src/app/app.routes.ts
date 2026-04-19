import { Routes } from '@angular/router';
import { adminRoutes } from './admin/admin.routes';
import { environment } from '../environments/environment';

const defaultAdminRoute = environment.production ? 'admin/login' : 'admin/dashboard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: defaultAdminRoute
  },
  {
    path: 'admin',
    children: adminRoutes
  },
  { path: '**', redirectTo: defaultAdminRoute }
];
