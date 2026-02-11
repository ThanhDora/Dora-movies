export interface Movie {
  id: string;
  slug: string;
  name: string;
  origin_name: string;
  thumb_url?: string;
  poster_url?: string;
  url: string;
  content?: string;
  publish_year?: number;
  quality?: string;
  language?: string;
  type?: string;
  episode_current?: string;
  episode_total?: string;
  episode_time?: string;
  status?: string;
  view_total?: number;
  view_day?: number;
  view_week?: number;
  view_month?: number;
  rating_star?: number;
  rating_count?: number;
  is_recommended?: boolean;
  is_copyright?: boolean;
  notify?: string;
  showtimes?: string;
  trailer_url?: string;
  regions?: Region[];
  categories?: Category[];
  tags?: Tag[];
  actors?: Actor[];
  directors?: Director[];
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  name: string;
  slug: string;
  server: string;
  type: string;
  link: string;
  url: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  url: string;
  seo_title?: string;
}

export interface Region {
  id: string;
  name: string;
  slug: string;
  url: string;
  seo_title?: string;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export interface Actor {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export interface Director {
  id: string;
  name: string;
  slug: string;
  url: string;
}

export interface Catalog {
  id: string;
  name: string;
  slug: string;
  value?: string;
  seo_title?: string;
}

export interface MenuItem {
  name: string;
  link: string;
  children?: MenuItem[];
}

export interface SearchResultItem {
  title: string;
  original_title: string;
  year?: number;
  total_episode?: string;
  image: string;
  image_poster: string;
  slug: string;
}

export interface SectionData {
  label: string;
  template?: string;
  show_template?: string;
  data: Movie[];
  topview?: Movie[];
  link?: string;
}

export interface HomeData {
  menu: MenuItem[];
  tops?: SectionData[];
  slider?: SectionData | null;
  sections?: SectionData[];
  title?: string;
  settings?: Record<string, string>;
}

export interface CatalogParams {
  search?: string;
  categorys?: string;
  regions?: string;
  years?: string;
  types?: string;
  sorts?: string;
  page?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number;
  to: number;
  path: string;
  first_page_url: string;
  last_page_url: string;
  next_page_url: string | null;
  prev_page_url: string | null;
  links: { url: string | null; label: string; active: boolean }[];
}

export interface RateResponse {
  status: boolean;
  rating_star: string;
  rating_count: number;
}
