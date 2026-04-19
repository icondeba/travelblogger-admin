export interface AboutContent {
  heading: string;
  biography: string;
  profileImageUrl: string;
}

export interface AboutRecord extends AboutContent {
  id: string;
  updatedAt: string;
}

export interface AboutApiModel {
  id: string;
  heading: string;
  content: string;
  image: string;
  updatedAt: string;
}

export interface AboutUpsertRequest {
  heading: string;
  content: string;
  image: string;
}
