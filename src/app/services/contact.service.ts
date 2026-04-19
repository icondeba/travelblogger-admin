import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ContactMessage } from '../models/contact.model';
import { ApiResponse } from '../models/api-response.model';

interface ApiEnvelope<T> {
  success?: boolean;
  Success?: boolean;
  message?: string;
  Message?: string;
  data?: T | null;
  Data?: T | null;
  errors?: string[];
  Errors?: string[];
}

interface ContactMessageApiModel {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
  submittedAt: string;
  replyMessage: string;
  repliedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class ContactService {
  readonly isSupported = true;
  private readonly endpoint = `${environment.apiBaseUrl}/api/contact-messages`;

  constructor(private http: HttpClient) {}

  getMessages(): Observable<ContactMessage[]> {
    return this.http.get<ApiResponse<ContactMessageApiModel[]>>(this.endpoint).pipe(
      map((response) => this.unwrapData(response, 'Failed to load messages').map((item) => this.toMessage(item))),
      catchError((error) => this.handleError(error, 'Failed to load messages.'))
    );
  }

  replyToMessage(id: string, replyMessage: string): Observable<ContactMessage> {
    return this.http
      .post<ApiResponse<ContactMessageApiModel>>(`${this.endpoint}/${id}/reply`, { replyMessage })
      .pipe(
        map((response) => this.toMessage(this.unwrapData(response, 'Failed to send reply'))),
        catchError((error) => this.handleError(error, 'Failed to send reply.'))
      );
  }

  private toMessage(item: ContactMessageApiModel): ContactMessage {
    return {
      id: this.readProp<string>(item, 'id', 'Id') ?? '',
      name: this.readProp<string>(item, 'name', 'Name') ?? '',
      email: this.readProp<string>(item, 'email', 'Email') ?? '',
      phoneNumber: this.readProp<string>(item, 'phoneNumber', 'PhoneNumber') ?? '',
      message: this.readProp<string>(item, 'message', 'Message') ?? '',
      submittedAt: this.readProp<string>(item, 'submittedAt', 'SubmittedAt') ?? '',
      replyMessage: this.readProp<string>(item, 'replyMessage', 'ReplyMessage') ?? '',
      repliedAt: this.readProp<string | null>(item, 'repliedAt', 'RepliedAt') ?? null
    };
  }

  private unwrapData<T>(response: ApiEnvelope<T>, fallbackMessage: string): T {
    const success = response.success ?? response.Success ?? false;
    const data = response.data ?? response.Data ?? null;
    const message = response.message ?? response.Message ?? fallbackMessage;

    if (!success || data === null || data === undefined) {
      throw new Error(message);
    }

    return data;
  }

  private handleError(error: unknown, fallbackMessage: string): Observable<never> {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) {
      return throwError(() => error);
    }

    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as Partial<ApiEnvelope<unknown>> | string | null;

      if (typeof apiError === 'string' && apiError.trim().length > 0) {
        return throwError(() => new Error(apiError));
      }

      if (apiError && typeof apiError === 'object') {
        const message = apiError.message ?? apiError.Message;
        const errors = apiError.errors ?? apiError.Errors;

        if (typeof message === 'string' && message.trim().length > 0) {
          return throwError(() => new Error(message));
        }

        if (Array.isArray(errors) && errors.length > 0) {
          return throwError(() => new Error(errors.join(' ')));
        }
      }
    }

    return throwError(() => new Error(fallbackMessage));
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
