export type CardCategories = {
  category: string;
  steamid: number;
  name: string;
  releaseDate: string; 
  developer: string;
  capsuleImage: string;
}

export type SteamCategories = {
  category: string;
  id: number;
  name: string;
  releaseDate: string;
  developer: string;
  ageRating: number;
  capsuleImage: string;
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
  reviewDesc: string | undefined;
  totalCriticReviews: number | 'N/A' | undefined;
  totalUserReviews: number | 'N/A' | undefined;
  totalTopCriticReviews: number | 'N/A' | undefined;
  tier: { name: string | undefined; url: string | undefined };
  capsuleImage: string | undefined;
  url: string | undefined;
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
  reviewDesc: string | undefined;
  totalPositive: number | 'N/A' | undefined;
  totalNegative: number | 'N/A' | undefined;
  totalReviews: number | 'N/A' | undefined;
  currentPlayers?: number | undefined;
  headerImage: string | undefined;
  capsuleImage: string | undefined;
  url: string | undefined;
  devUrl: string | undefined;
}