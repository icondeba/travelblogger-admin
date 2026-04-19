import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  constructor(private auth: AuthService, private router: Router) {}

  get userId() {
    return this.auth.userId ?? 'admin';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/admin/login']);
  }
}
