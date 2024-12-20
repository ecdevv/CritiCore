export type CardCategories = {
  category: string;
  ocid?: number;
  steamid?: number;
  name: string;
  releaseDate: string; 
  developer: string;
  headerImage: { og: string; blur: string | undefined }
  capsuleImage: { og: string; blur: string | undefined }
}

export type GameCategories = {
  category?: string;
  id: number;
  name: string;
  releaseDate: string;
  developer?: string;
  ageRating?: number;
  headerImage: string | undefined;
  capsuleImage: string | undefined;
}

export type OCData = {
  status: number;
  id: number | undefined;
  name: string | undefined;
  releaseDate: string | undefined;
  developer: string | undefined;
  publisher: string | undefined;
  hasLootBoxes: boolean | undefined;
  percentRec: number | 'N/A' | undefined;
  criticScore: number | 'N/A' | undefined;
  userScore: number | 'N/A' | undefined;
  totalCriticReviews: number | 'N/A' | undefined;
  totalUserReviews: number | 'N/A' | undefined;
  totalTopCriticReviews: number | 'N/A' | undefined;
  tier: { name: string | undefined; url: string | undefined };
  url: string | undefined;
  capsuleImage: string | undefined
}

export type SteamData = {
  status: number;
  id: number | undefined;
  name: string | undefined;
  releaseDate: string | undefined;
  developer: string | undefined;
  publisher: string | undefined;
  ageRating: number | undefined;
  criticScore: number | 'N/A' | undefined;
  userScore: number | 'N/A' | undefined;
  totalPositive: number | 'N/A' | undefined;
  totalNegative: number | 'N/A' | undefined;
  totalReviews: number | 'N/A' | undefined;
  reviewDesc: string | undefined;
  url: string | undefined;
  devUrl: string | undefined;
  headerImage: string | undefined;
  capsuleImage: string | undefined;
  currentPlayers?: number | undefined;
}