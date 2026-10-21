export interface ShowcaseCategory {
  id: string;
  label: string;
  countKey?: string;
}

export type CategoryId = string;

export interface ProductOrProject {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  description: string;
  longDescription: string;
  imageUrl: string;
  gallery?: string[];
  tags: string[];
  price?: string;
  status: 'Disponible' | 'En desarrollo' | 'Caso de estudio' | 'Exclusivo' | 'Implementación Inmediata';
  demoUrl?: string;
  features: string[];
  technologies: string[];
  year: string;
  deliverables?: string[];
  slideNumber?: string;
  themeColor?: 'lime' | 'orange' | 'zinc' | 'cyan' | 'teal';
  deckMetrics?: { label: string; value: string }[];
}

export interface UserProfile {
  name: string;
  avatarUrl?: string;
  title: string;
  tagline: string;
  bio: string;
  location: string;
  email: string;
  whatsapp?: string;
  whatsappNumber?: string;
  availability: string;
  stats: { label: string; value: string; helper?: string }[];
  socials: { name: string; url: string; icon: string }[];
  experience: { role: string; company: string; period: string; description: string }[];
  skills: { category: string; items: string[] }[];
  workflow: { step: string; title: string; description: string }[];
  clientLogos?: { name: string; industry: string }[];
  credentials?: { label: string; code: string }[];
}
