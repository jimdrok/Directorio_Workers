export type PublicationStatus = 'draft' | 'published' | 'paused';
export interface User {
  email: string;
  admin: boolean;
}
export interface DirectoryConfig {
  categories: string[];
  parishes: string[];
}
export interface Testimonial {
  name: string;
  text: string;
}
export interface ProfileFields {
  demo?: boolean;
  name: string;
  category: string;
  phone: string;
  location: string;
  areas: string[];
  description: string;
  experience: number | '';
  avatar: string;
  photos: string[];
  testimonials: Testimonial[];
}
export interface WorkerProfile extends ProfileFields {
  id?: string;
  status: PublicationStatus;
  hidden?: boolean;
}
export interface PublicProfile extends ProfileFields {
  id: string;
}
export interface Category {
  id: number;
  name: string;
  active: number;
}
export interface AdminData {
  profiles: WorkerProfile[];
  categories: Category[];
}
export const emptyProfile: WorkerProfile = {
  name: '',
  category: '',
  phone: '',
  location: '',
  areas: [],
  description: '',
  experience: '',
  avatar: '',
  photos: [],
  testimonials: [],
  status: 'draft',
};
export const statusLabels: Record<PublicationStatus, string> = {
  draft: 'Borrador',
  published: 'Publicado',
  paused: 'Pausado',
};
