
export interface OutfitSuggestion {
  top: string;
  bottom: string;
  outerwear?: string;
  shoes: string;
  accessories: string[];
  reasoning: string;
}

export interface MakeupSuggestion {
  face: string;
  eyes: string;
  lips: string;
  technique: string;
}

export interface StyleSession {
  id: string;
  date: string;
  vibe: string;
  outfit: OutfitSuggestion;
  makeup: MakeupSuggestion;
  feedback?: string;
  rating?: number;
  imageUrl?: string;
}

export enum AppTab {
  TODAY = 'today',
  FIT_CHECK = 'fit-check',
  HISTORY = 'history'
}
