import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

interface AuthResponse {
  userId?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly sessionKey = 'admin_session_active';
  private readonly userIdKey = 'admin_user_id';
  private readonly userIdSubject = new BehaviorSubject<string | null>(this.getStoredUserId());

  readonly userId$ = this.userIdSubject.asObservable();

  constructor(private http: HttpClient) {}

  login(userId: string, password: string) {
    return this.http
      .post<ApiResponse<AuthResponse>>(`${environment.apiBaseUrl}/api/auth/login`, { userId, password })
      .pipe(
        tap((response) => {
          const success = this.readProp<boolean>(response, 'success', 'Success');
          const message = this.readProp<string>(response, 'message', 'Message') ?? 'Login failed';
          const data = this.readProp<Record<string, unknown> | null>(response, 'data', 'Data');
          const validatedUserId = this.readProp<string>(data, 'userId', 'UserId') ?? userId;

          if (!success) {
            throw new Error(message);
          }

          if (this.isBrowser()) {
            localStorage.setItem(this.sessionKey, 'true');
            localStorage.setItem(this.userIdKey, validatedUserId);
          }
          this.userIdSubject.next(validatedUserId);
        }),
        map(() => void 0)
      );
  }

  logout() {
    if (this.isBrowser()) {
      localStorage.removeItem(this.sessionKey);
      localStorage.removeItem(this.userIdKey);
    }
    this.userIdSubject.next(null);
  }

  get userId(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.userIdKey) : null;
  }

  get isAuthenticated(): boolean {
    return this.isBrowser() && localStorage.getItem(this.sessionKey) === 'true';
  }

  private getStoredUserId(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.userIdKey) : null;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private readProp<T>(obj: unknown, ...keys: string[]): T | undefined {
    if (!obj || typeof obj !== 'object') {
      return undefined;
    }

    const record = obj as Record<string, unknown>;
    for (const key of keys) {
      if (key in record) {
        return record[key] as T;
      }
    }

    return undefined;
  }
}
