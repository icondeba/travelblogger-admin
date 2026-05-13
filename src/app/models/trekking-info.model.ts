export interface TrekkingInfoItem {
  id: string;
  title: string;
  location: string;
  difficulty: string;
  duration: string;
  bestSeason: string;
  details: string;
  route: string;
  mapEmbedUrl: string;
  image: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrekkingInfoCreateRequest {
  title: string;
  location: string;
  difficulty: string;
  duration: string;
  bestSeason: string;
  details: string;
  route: string;
  mapEmbedUrl: string;
  image: string;
}

export interface TrekkingInfoApiModel extends TrekkingInfoCreateRequest {
  id: string;
  createdAt: string;
  updatedAt: string;
}
