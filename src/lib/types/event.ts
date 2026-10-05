export interface Event {
  id: string;
  title: string;
  description?: string;
  image?: string | null;
  start_date: string;
  end_date: string;
  published_at?: string;
  published_by?: string;
  status?: "draft" | "published" | "archived";
  created_at?: string;
}
