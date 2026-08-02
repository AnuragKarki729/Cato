export type University = {
  unitId: string;
  name: string;
  aliases: string[];
  domains: string[];
  city: string;
  state: string;
  normalizedSearchText: string;
};

export type UniversitySearchResponse = {
  universities: University[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
};

export type UniversityMatchResponse = {
  university: University | null;
};
