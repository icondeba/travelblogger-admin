export interface EventItem {
  id: string;
  title: string;
  location: string;
  details: string;
  image: string;
  eventDate: string;
  createdAt: string;
}

export interface EventCreateRequest {
  title: string;
  location: string;
  details: string;
  image: string;
  eventDate: string;
}

export interface EventApiModel {
  id: string;
  title: string;
  description: string;
  location: string;
  image: string;
  eventDate: string;
  createdAt: string;
}

export interface EventApiRequest {
  title: string;
  description: string;
  location: string;
  image: string;
  eventDate: string;
}
