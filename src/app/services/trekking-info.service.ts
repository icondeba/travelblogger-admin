import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  TrekkingInfoApiModel,
  TrekkingInfoCreateRequest,
  TrekkingInfoItem
} from '../models/trekking-info.model';

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
export class TrekkingInfoService {
  private readonly endpoint = `${environment.apiBaseUrl}/api/trekking`;

  constructor(private http: HttpClient) {}

  getItems(): Observable<TrekkingInfoItem[]> {
    return this.http.get<ApiResponse<TrekkingInfoApiModel[]>>(this.endpoint).pipe(
      map((response) => this.unwrapData(response, 'Failed to load trekking information').map((item) => this.toItem(item))),
      catchError((error) => this.handleError(error, 'Failed to load trekking information.'))
    );
  }

  getItem(id: string): Observable<TrekkingInfoItem> {
    return this.http.get<ApiResponse<TrekkingInfoApiModel>>(`${this.endpoint}/${encodeURIComponent(id)}`).pipe(
      map((response) => this.toItem(this.unwrapData(response, 'Failed to load trekking information'))),
      catchError((error) => this.handleError(error, 'Failed to load trekking information.'))
    );
  }

  createItem(payload: TrekkingInfoCreateRequest): Observable<TrekkingInfoItem> {
    return this.http.post<ApiResponse<TrekkingInfoApiModel>>(this.endpoint, payload).pipe(
      map((response) => this.toItem(this.unwrapData(response, 'Failed to create trekking information'))),
      catchError((error) => this.handleError(error, 'Failed to create trekking information.'))
    );
  }

  updateItem(id: string, payload: TrekkingInfoCreateRequest): Observable<TrekkingInfoItem> {
    return this.http.put<ApiResponse<TrekkingInfoApiModel>>(`${this.endpoint}/${encodeURIComponent(id)}`, payload).pipe(
      map((response) => this.toItem(this.unwrapData(response, 'Failed to update trekking information'))),
      catchError((error) => this.handleError(error, 'Failed to update trekking information.'))
    );
  }

  deleteItem(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${encodeURIComponent(id)}`).pipe(
      map(() => void 0),
      catchError((error) => this.handleError(error, 'Failed to delete trekking information.'))
    );
  }

  private toItem(item: TrekkingInfoApiModel): TrekkingInfoItem {
    return {
      id: this.readProp<string>(item, 'id', 'Id') ?? '',
      title: this.readProp<string>(item, 'title', 'Title') ?? '',
      location: this.readProp<string>(item, 'location', 'Location') ?? '',
      difficulty: this.readProp<string>(item, 'difficulty', 'Difficulty') ?? '',
      duration: this.readProp<string>(item, 'duration', 'Duration') ?? '',
      bestSeason: this.readProp<string>(item, 'bestSeason', 'BestSeason') ?? '',
      details: this.readProp<string>(item, 'details', 'Details') ?? '',
      route: this.readProp<string>(item, 'route', 'Route') ?? '',
      mapEmbedUrl: this.readProp<string>(item, 'mapEmbedUrl', 'MapEmbedUrl') ?? '',
      image: this.readProp<string>(item, 'image', 'Image') ?? '',
      createdAt: this.readProp<string>(item, 'createdAt', 'CreatedAt') ?? '',
      updatedAt: this.readProp<string>(item, 'updatedAt', 'UpdatedAt') ?? ''
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
