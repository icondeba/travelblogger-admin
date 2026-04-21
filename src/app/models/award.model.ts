export interface AwardItem {
  id: string;
  year: string;
  title: string;
  organization: string;
  description: string;
  image: string;
  createdAt: string;
}

export interface AwardCreateRequest {
  year: string;
  title: string;
  organization: string;
  description: string;
  image: string;
}

export interface AwardApiModel {
  id?: string;
  Id?: string;
  year?: string;
  Year?: string;
  title?: string;
  Title?: string;
  organization?: string;
  Organization?: string;
  description?: string;
  Description?: string;
  image?: string;
  Image?: string;
  createdAt?: string;
  CreatedAt?: string;
}
