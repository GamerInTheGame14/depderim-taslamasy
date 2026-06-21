export type Block =
  | { id: string; type: "h1" | "h2" | "text" | "list"; content: string }
  | { id: string; type: "code"; language: string; content: string }
  | { id: string; type: "image"; caption: string; src?: string }
  | { id: string; type: "video"; caption: string; src?: string; start?: number; end?: number };

export interface Note {
  id: string;
  title: string;
  week: number;
  updatedAt: string;
  tags: string[];
  blocks: Block[];
}

export interface Course {
  id: string;
  name: string;
  code: string;
  color: string;
  notes: Note[];
}

export interface Term {
  id: string;
  name: string;
  courses: Course[];
}

// 0 = Duşenbe (Mon) ... 6 = Ýekşenbe (Sun)
export interface ScheduleEntry {
  id: string;
  day: number;
  time: string; // "HH:MM"
  courseId?: string;
  title: string;
  room: string;
  color: string;
}

export const dayNames = ["Duşenbe", "Sişenbe", "Çarşenbe", "Penşenbe", "Anna", "Şenbe", "Ýekşenbe"];

export const allTags = ["aralyk", "jemleýji", "kesgitlemeler", "algoritmler", "esaslar", "agaçlar", "rekursiýa", "wektorlar", "gaýtalama"];
