import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { MilestoneApiModel, MilestoneCreateRequest, MilestoneItem } from '../models/milestone.model';

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
export class MilestoneService {
  constructor(private http: HttpClient) {}

  getMilestones(): Observable<MilestoneItem[]> {
    return this.http.get<ApiResponse<MilestoneApiModel[]>>(`${environment.apiBaseUrl}/api/milestones`).pipe(
      map((r) => this.unwrapData(r, 'Failed to load milestones').map((i) => this.toMilestone(i))),
      catchError((e) => this.handleError(e, 'Failed to load milestones.'))
    );
  }

  getMilestone(id: string): Observable<MilestoneItem> {
    return this.http.get<ApiResponse<MilestoneApiModel>>(`${environment.apiBaseUrl}/api/milestones/${id}`).pipe(
      map((r) => this.toMilestone(this.unwrapData(r, 'Failed to load milestone'))),
      catchError((e) => this.handleError(e, 'Failed to load milestone.'))
    );
  }

  createMilestone(payload: MilestoneCreateRequest): Observable<MilestoneItem> {
    return this.http.post<ApiResponse<MilestoneApiModel>>(`${environment.apiBaseUrl}/api/milestones`, payload).pipe(
      map((r) => this.toMilestone(this.unwrapData(r, 'Failed to create milestone'))),
      catchError((e) => this.handleError(e, 'Failed to create milestone.'))
    );
  }

  updateMilestone(id: string, payload: MilestoneCreateRequest): Observable<MilestoneItem> {
    return this.http.put<ApiResponse<MilestoneApiModel>>(`${environment.apiBaseUrl}/api/milestones/${id}`, payload).pipe(
      map((r) => this.toMilestone(this.unwrapData(r, 'Failed to update milestone'))),
      catchError((e) => this.handleError(e, 'Failed to update milestone.'))
    );
  }

  deleteMilestone(id: string): Observable<void> {
    return this.http.delete<void>(`${environment.apiBaseUrl}/api/milestones/${id}`).pipe(
      map(() => void 0),
      catchError((e) => this.handleError(e, 'Failed to delete milestone.'))
    );
  }

  private toMilestone(item: MilestoneApiModel): MilestoneItem {
    return {
      id: this.read<string>(item, 'id', 'Id') ?? '',
      year: this.read<string>(item, 'year', 'Year') ?? '',
      title: this.read<string>(item, 'title', 'Title') ?? '',
      description: this.read<string>(item, 'description', 'Description') ?? '',
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
