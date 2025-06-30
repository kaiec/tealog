export interface Tea {
  id: string;
  name: string;
  type?: string;
  notes?: string;
}

export interface Brewing {
  id: string;
  teaId: string;
  date: string; // ISO string
  amount: number; // grams
}

export interface Infusion {
  id: string;
  brewingId: string;
  waterAmount: number; // ml
  temperature: number; // Celsius
  steepTime: number; // seconds
  tasteNotes?: string;
} 