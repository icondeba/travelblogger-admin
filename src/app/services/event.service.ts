import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { EventApiModel, EventApiRequest, EventCreateRequest, EventItem } from '../models/event.model';

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

@Injectable({ providedIn: 'root' })
export class EventService {
  constructor(private http: HttpClient) {}

  getEvents(): Observable<EventItem[]> {
    return this.http.get<ApiResponse<EventApiModel[]>>(`${environment.apiBaseUrl}/api/events`).pipe(
      map((response) => this.unwrapData(response, 'Failed to load events').map((item) => this.toEvent(item))),
      catchError((error) => this.handleError(error, 'Failed to load events.'))
    );
  }

  getEvent(id: string): Observable<EventItem> {
    return this.getEvents().pipe(
      map((events) => {
        const event = events.find((item) => item.id === id);
        if (!event) {
          throw new Error('Event not found');
        }
        return event;
      }),
      catchError((error) => this.handleError(error, 'Failed to load event.'))
    );
  }

  createEvent(payload: EventCreateRequest): Observable<EventItem> {
    const request: EventApiRequest = this.toRequest(payload);
    return this.http.post<ApiResponse<EventApiModel>>(`${environment.apiBaseUrl}/api/events`, request).pipe(
      map((response) => this.toEvent(this.unwrapData(response, 'Failed to create event'))),
      catchError((error) => this.handleError(error, 'Failed to create event.'))
    );
  }

  updateEvent(id: string, payload: EventCreateRequest): Observable<EventItem> {
    const request: EventApiRequest = this.toRequest(payload);
    return this.http.put<ApiResponse<EventApiModel>>(`${environment.apiBaseUrl}/api/events/${id}`, request).pipe(
      map((response) => this.toEvent(this.unwrapData(response, 'Failed to update event'))),
      catchError((error) => this.handleError(error, 'Failed to update event.'))
    );
  }

  deleteEvent(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/api/events/${id}`).pipe(
      map(() => void 0),
      catchError((error) => this.handleError(error, 'Failed to delete event.'))
    );
  }

  private toRequest(payload: EventCreateRequest): EventApiRequest {
    return {
      title: payload.title,
      description: payload.details,
      location: payload.location,
      image: payload.image,
      eventDate: payload.eventDate
    };
  }

  private toEvent(item: EventApiModel): EventItem {
    return {
      id: this.readProp<string>(item, 'id', 'Id') ?? '',
      title: this.readProp<string>(item, 'title', 'Title') ?? '',
      details: this.readProp<string>(item, 'description', 'Description') ?? '',
      location: this.readProp<string>(item, 'location', 'Location') ?? '',
      image: this.readProp<string>(item, 'image', 'Image') ?? '',
      eventDate: this.readProp<string>(item, 'eventDate', 'EventDate') ?? '',
      createdAt: this.readProp<string>(item, 'createdAt', 'CreatedAt') ?? ''
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
