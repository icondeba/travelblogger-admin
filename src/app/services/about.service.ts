import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AboutApiModel, AboutContent, AboutRecord, AboutUpsertRequest } from '../models/about.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({ providedIn: 'root' })
export class AboutService {
  private readonly endpoint = `${environment.apiBaseUrl}/api/about-me`;

  constructor(private http: HttpClient) {}

  getAbout(): Observable<AboutRecord | null> {
    return this.readAbout().pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of(null);
        }
        return throwError(() => error);
      })
    );
  }

  updateAbout(payload: AboutContent): Observable<AboutRecord> {
    return this.updateAboutRequest(payload);
  }

  deleteAbout(id: string): Observable<void> {
    return this.deleteAboutRequest(id);
  }

  private toRecord(data: AboutApiModel): AboutRecord {
    return {
      id: this.readProp(data, 'id', 'Id') ?? '',
      heading: this.readProp(data, 'heading', 'Heading') ?? '',
      biography: this.readProp(data, 'content', 'Content') ?? '',
      profileImageUrl: this.readProp(data, 'image', 'Image') ?? '',
      updatedAt: this.readProp(data, 'updatedAt', 'UpdatedAt') ?? ''
    };
  }

  private parseApiResponse<T>(response: ApiResponse<T>): { success: boolean; message: string; data: T | null } {
    const success = this.readProp(response, 'success', 'Success');
    const message = this.readProp(response, 'message', 'Message') ?? '';
    const data = this.readProp(response, 'data', 'Data');

    return {
      success: Boolean(success),
      message: String(message),
      data: (data as T | null) ?? null
    };
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

  private readAbout(): Observable<AboutRecord> {
    return this.http.get<ApiResponse<AboutApiModel> | AboutApiModel>(this.endpoint).pipe(
      map((response) => {
        if (this.looksLikeAboutModel(response)) {
          return this.toRecord(response);
        }

        const parsed = this.parseApiResponse(response);
        if (!parsed.success || !parsed.data) {
          throw new Error(parsed.message || 'Failed to load about content');
        }

        return this.toRecord(parsed.data);
      })
    );
  }

  private updateAboutRequest(payload: AboutContent): Observable<AboutRecord> {
    const request: AboutUpsertRequest = {
      heading: payload.heading,
      content: payload.biography,
      image: payload.profileImageUrl
    };

    return this.http.put<ApiResponse<AboutApiModel> | AboutApiModel>(this.endpoint, request).pipe(
      map((response) => {
        if (this.looksLikeAboutModel(response)) {
          return this.toRecord(response);
        }

        const parsed = this.parseApiResponse(response);
        if (!parsed.success || !parsed.data) {
          throw new Error(parsed.message || 'Failed to update about content');
        }

        return this.toRecord(parsed.data);
      })
    );
  }

  private deleteAboutRequest(id: string): Observable<void> {
    const endpoint = `${this.endpoint}/${id}`;
    return this.http.delete(endpoint).pipe(
      map(() => void 0),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404 || error.status === 405) {
          return this.http.delete(this.endpoint).pipe(map(() => void 0));
        }
        return throwError(() => error);
      })
    );
  }

  private looksLikeAboutModel(response: unknown): response is AboutApiModel {
    const id = this.readProp<string>(response, 'id', 'Id');
    const content = this.readProp<string>(response, 'content', 'Content');
    return typeof id === 'string' && typeof content === 'string';
  }
}
