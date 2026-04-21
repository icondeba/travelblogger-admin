export interface MilestoneItem {
  id: string;
  year: string;
  title: string;
  description: string;
  createdAt: string;
}

export interface MilestoneCreateRequest {
  year: string;
  title: string;
  description: string;
}

export interface MilestoneApiModel {
  id?: string;
  Id?: string;
  year?: string;
  Year?: string;
  title?: string;
  Title?: string;
  description?: string;
  Description?: string;
  createdAt?: string;
  CreatedAt?: string;
}
