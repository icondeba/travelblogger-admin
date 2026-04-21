import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AwardApiModel, AwardCreateRequest, AwardItem } from '../models/award.model';

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
export class AwardService {
  constructor(private http: HttpClient) {}

  getAwards(): Observable<AwardItem[]> {
    return this.http.get<ApiResponse<AwardApiModel[]>>(`${environment.apiBaseUrl}/api/awards`).pipe(
      map((r) => this.unwrapData(r, 'Failed to load awards').map((i) => this.toAward(i))),
      catchError((e) => this.handleError(e, 'Failed to load awards.'))
    );
  }

  getAward(id: string): Observable<AwardItem> {
    return this.http.get<ApiResponse<AwardApiModel>>(`${environment.apiBaseUrl}/api/awards/${id}`).pipe(
      map((r) => this.toAward(this.unwrapData(r, 'Failed to load award'))),
      catchError((e) => this.handleError(e, 'Failed to load award.'))
    );
  }

  createAward(payload: AwardCreateRequest): Observable<AwardItem> {
    return this.http.post<ApiResponse<AwardApiModel>>(`${environment.apiBaseUrl}/api/awards`, payload).pipe(
      map((r) => this.toAward(this.unwrapData(r, 'Failed to create award'))),
      catchError((e) => this.handleError(e, 'Failed to create award.'))
    );
  }

  updateAward(id: string, payload: AwardCreateRequest): Observable<AwardItem> {
    return this.http.put<ApiResponse<AwardApiModel>>(`${environment.apiBaseUrl}/api/awards/${id}`, payload).pipe(
      map((r) => this.toAward(this.unwrapData(r, 'Failed to update award'))),
      catchError((e) => this.handleError(e, 'Failed to update award.'))
    );
  }

  deleteAward(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/api/awards/${id}`).pipe(
      map(() => void 0),
      catchError((e) => this.handleError(e, 'Failed to delete award.'))
    );
  }

  private toAward(item: AwardApiModel): AwardItem {
    return {
      id: this.read<string>(item, 'id', 'Id') ?? '',
      year: this.read<string>(item, 'year', 'Year') ?? '',
      title: this.read<string>(item, 'title', 'Title') ?? '',
      organization: this.read<string>(item, 'organization', 'Organization') ?? '',
      description: this.read<string>(item, 'description', 'Description') ?? '',
      image: this.read<string>(item, 'image', 'Image') ?? '',
      createdAt: this.read<string>(item, 'createdAt', 'CreatedAt') ?? ''
    };
  }

  private unwrapData<T>(response: ApiEnvelope<T>, fallback: string): T {
    const success = response.success ?? response.Success ?? false;
    const data = response.data ?? response.Data ?? null;
    const message = response.message ?? response.Message ?? fallback;
    if (!success || data === null || data === undefined) throw new Error(message);
    return data;
  }

  private handleError(error: unknown, fallback: string): Observable<never> {
    if (error instanceof Error && !(error instanceof HttpErrorResponse)) return throwError(() => error);
    if (error instanceof HttpErrorResponse) {
      const apiError = error.error as Partial<ApiEnvelope<unknown>> | string | null;
      if (typeof apiError === 'string' && apiError.trim()) return throwError(() => new Error(apiError));
      if (apiError && typeof apiError === 'object') {
        const msg = (apiError as ApiEnvelope<unknown>).message ?? (apiError as ApiEnvelope<unknown>).Message;
        if (typeof msg === 'string' && msg.trim()) return throwError(() => new Error(msg));
      }
    }
    return throwError(() => new Error(fallback));
  }

  private read<T>(obj: unknown, ...keys: string[]): T | undefined {
    if (!obj || typeof obj !== 'object') return undefined;
    const r = obj as Record<string, unknown>;
    for (const k of keys) if (k in r) return r[k] as T;
    return undefined;
  }
}
