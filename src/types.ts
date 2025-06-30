export interface Tea {
  id: string;
  name: string;
  type?: string;
  notes?: string;
}

export type TeaAmountUnit = 'g' | 'tsp' | 'bag';

export interface Brewing {
  id: string;
  teaId: string;
  date: string; // ISO string
  amount: number;
  unit: TeaAmountUnit;
}

export interface Infusion {
  id: string;
  brewingId: string;
  waterAmount: number; // ml
  temperature: number; // Celsius
  steepTime: number; // seconds
  tasteNotes?: string;
} 