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

const uid = () => Math.random().toString(36).slice(2, 10);

export const initialTerms: Term[] = [
  {
    id: "t1",
    name: "2026 Güýz",
    courses: [
      {
        id: "c1",
        name: "Emeli Aňa Giriş",
        code: "CS401",
        color: "oklch(0.7 0.17 268)",
        notes: [
          {
            id: "n1",
            title: "1-nji hepde: Aň näme?",
            week: 1,
            updatedAt: "2026-06-15",
            tags: ["aralyk", "kesgitlemeler"],
            blocks: [
              { id: uid(), type: "h1", content: "Aň näme?" },
              { id: uid(), type: "text", content: "Aň — bilim almak we ony ulanmak ukybydyr. Emeli aňda biz muny gözleg, öwrenmek we pikir ýöretmek arkaly modelleşdirýäris." },
              { id: uid(), type: "h2", content: "Esasy kesgitlemeler" },
              { id: uid(), type: "list", content: "Agent: töwerege seredip, hereket edýän düzgüň\nRasional agent: garaşylýan netijäni iň ýokary çykarýar\nGurşaw: agentden daşky ähli zat" },
              { id: uid(), type: "image", caption: "4-nji slaýd: Agent–gurşaw aýlawy" },
            ],
          },
          {
            id: "n2",
            title: "2-nji hepde: Gözleg algoritmleri",
            week: 2,
            updatedAt: "2026-06-17",
            tags: ["algoritmler", "aralyk"],
            blocks: [
              { id: uid(), type: "h1", content: "Gözleg algoritmleri" },
              { id: uid(), type: "text", content: "BFS basgançaklaýyn gözleýär; DFS çuňluga gidýär. A* heuristika ulanyp gözlegi ugrukdyrýar." },
              { id: uid(), type: "code", language: "python", content: "def bfs(graph, start, goal):\n    queue = [(start, [start])]\n    while queue:\n        node, path = queue.pop(0)\n        if node == goal: return path\n        for nb in graph[node]:\n            queue.append((nb, path + [nb]))" },
            ],
          },
        ],
      },
      {
        id: "c2",
        name: "Maglumat Gurluşlary",
        code: "CS201",
        color: "oklch(0.72 0.16 165)",
        notes: [
          {
            id: "n3",
            title: "1-nji hepde: Massiwler we baglanyşykly sanawlar",
            week: 1,
            updatedAt: "2026-06-12",
            tags: ["esaslar"],
            blocks: [
              { id: uid(), type: "h1", content: "Massiwler we baglanyşykly sanawlar" },
              { id: uid(), type: "text", content: "Massiwler O(1) tötänleýin elýeterlilik berýär; baglanyşykly sanawlar belli ýerde O(1) goşulma berýär." },
              { id: uid(), type: "code", language: "typescript", content: "class Node<T> {\n  next: Node<T> | null = null;\n  constructor(public value: T) {}\n}" },
            ],
          },
          {
            id: "n4",
            title: "2-nji hepde: Agaçlar we aýlanma",
            week: 2,
            updatedAt: "2026-06-16",
            tags: ["agaçlar", "rekursiýa"],
            blocks: [
              { id: uid(), type: "h1", content: "Agaçlar we aýlanma" },
              { id: uid(), type: "text", content: "Ikilik agaçlary in-order, pre-order we post-order aýlanmany goldaýar." },
            ],
          },
        ],
      },
      {
        id: "c3",
        name: "Çyzykly Algebra",
        code: "MATH211",
        color: "oklch(0.72 0.15 50)",
        notes: [
          {
            id: "n5",
            title: "1-nji hepde: Wektorlar we giňişlikler",
            week: 1,
            updatedAt: "2026-06-10",
            tags: ["wektorlar", "jemleýji"],
            blocks: [
              { id: uid(), type: "h1", content: "Wektorlar we wektor giňişlikleri" },
              { id: uid(), type: "text", content: "Wektor giňişligi goşulma we skalar köpeltme boýunça ýapykdyr." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t2",
    name: "2026 Ýaz",
    courses: [
      {
        id: "c4",
        name: "Matematiki Analiz II",
        code: "MATH102",
        color: "oklch(0.7 0.18 15)",
        notes: [
          {
            id: "n6",
            title: "1-nji hepde: Integral gaýtalama",
            week: 1,
            updatedAt: "2026-02-10",
            tags: ["gaýtalama"],
            blocks: [
              { id: uid(), type: "h1", content: "Integral gaýtalama" },
              { id: uid(), type: "text", content: "Integral — egri astyndaky meýdandyr. Esasy teorema önümler bilen integrallary baglanyşdyrýar." },
            ],
          },
        ],
      },
    ],
  },
];

export const allTags = ["aralyk", "jemleýji", "kesgitlemeler", "algoritmler", "esaslar", "agaçlar", "rekursiýa", "wektorlar", "gaýtalama"];
