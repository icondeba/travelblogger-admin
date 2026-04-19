import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

interface MediaUploadResponse {
  url: string;
}

@Injectable({ providedIn: 'root' })
export class MediaService {
  constructor(private http: HttpClient) {}

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<MediaUploadResponse>(`${environment.apiBaseUrl}/api/media/upload`, formData)
      .pipe(map((response) => response.url));
  }
}
