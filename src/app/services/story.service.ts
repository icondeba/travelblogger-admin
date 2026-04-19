import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { Story, StoryApiModel, StoryCreateRequest } from '../models/story.model';

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
export class StoryService {
  constructor(private http: HttpClient) {}

  getStories(): Observable<Story[]> {
    return this.http.get<ApiResponse<StoryApiModel[]>>(`${environment.apiBaseUrl}/api/articles`).pipe(
      map((response) => this.unwrapData(response, 'Failed to load stories').map((item) => this.toStory(item))),
      catchError((error) => this.handleError(error, 'Failed to load stories.'))
    );
  }

  getStory(id: string): Observable<Story> {
    return this.http.get<ApiResponse<StoryApiModel>>(`${environment.apiBaseUrl}/api/articles/id/${id}`).pipe(
      map((response) => this.toStory(this.unwrapData(response, 'Failed to load story'))),
      catchError((error) => this.handleError(error, 'Failed to load story.'))
    );
  }

  createStory(payload: StoryCreateRequest): Observable<Story> {
    return this.http
      .post<ApiResponse<StoryApiModel>>(`${environment.apiBaseUrl}/api/articles`, payload)
      .pipe(
        map((response) => this.toStory(this.unwrapData(response, 'Failed to create story'))),
        catchError((error) => this.handleError(error, 'Failed to create story.'))
      );
  }

  updateStory(id: string, payload: StoryCreateRequest): Observable<Story> {
    return this.http
      .put<ApiResponse<StoryApiModel>>(`${environment.apiBaseUrl}/api/articles/${id}`, payload)
      .pipe(
        map((response) => this.toStory(this.unwrapData(response, 'Failed to update story'))),
        catchError((error) => this.handleError(error, 'Failed to update story.'))
      );
  }

  deleteStory(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/api/articles/${id}`).pipe(
      map(() => void 0),
      catchError((error) => this.handleError(error, 'Failed to delete story.'))
    );
  }

  private toStory(item: StoryApiModel): Story {
    const statusValue = this.readProp<StoryApiModel['status']>(item, 'status', 'Status');
    const status = statusValue === 1 || statusValue === 'Published' ? 'Published' : 'Draft';

    return {
      id: this.readProp<string>(item, 'id', 'Id') ?? '',
      title: this.readProp<string>(item, 'title', 'Title') ?? '',
      slug: this.readProp<string>(item, 'slug', 'Slug') ?? '',
      content: this.readProp<string>(item, 'content', 'Content') ?? '',
      excerpt: this.readProp<string>(item, 'excerpt', 'Excerpt') ?? '',
      image: this.readProp<string>(item, 'image', 'Image') ?? '',
      status,
      publishDate: this.readProp<string | null>(item, 'publishedAt', 'PublishedAt') ?? null,
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
