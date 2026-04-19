export interface Story {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  status: 'Draft' | 'Published';
  publishDate: string | null;
  createdAt: string;
}

export interface StoryCreateRequest {
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  status: 'Draft' | 'Published';
  publishedAt: string | null;
}

export interface StoryApiModel {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  image: string;
  status: 'Draft' | 'Published' | 0 | 1;
  publishedAt: string | null;
  createdAt: string;
}
