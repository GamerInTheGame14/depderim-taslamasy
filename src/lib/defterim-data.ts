export type Block =
  | { id: string; type: "h1" | "h2" | "text" | "list"; content: string }
  | { id: string; type: "code"; language: string; content: string }
  | { id: string; type: "image"; caption: string; src?: string };

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

const uid = () => Math.random().toString(36).slice(2, 10);

export const initialTerms: Term[] = [
  {
    id: "t1",
    name: "2026 Fall",
    courses: [
      {
        id: "c1",
        name: "Introduction to AI",
        code: "CS401",
        color: "oklch(0.7 0.17 268)",
        notes: [
          {
            id: "n1",
            title: "Week 1: What is Intelligence?",
            week: 1,
            updatedAt: "2026-06-15",
            tags: ["midterm", "definitions"],
            blocks: [
              { id: uid(), type: "h1", content: "What is Intelligence?" },
              { id: uid(), type: "text", content: "Intelligence is the ability to acquire and apply knowledge. In AI, we model this through search, learning, and reasoning." },
              { id: uid(), type: "h2", content: "Key Definitions" },
              { id: uid(), type: "list", content: "Agent: an entity that perceives and acts\nRational agent: maximizes expected performance\nEnvironment: everything outside the agent" },
              { id: uid(), type: "image", caption: "Slide 4: Agent-environment loop" },
            ],
          },
          {
            id: "n2",
            title: "Week 2: Search Algorithms",
            week: 2,
            updatedAt: "2026-06-17",
            tags: ["algorithms", "midterm"],
            blocks: [
              { id: uid(), type: "h1", content: "Search Algorithms" },
              { id: uid(), type: "text", content: "BFS explores level by level; DFS goes deep first. A* uses a heuristic to guide search." },
              { id: uid(), type: "code", language: "python", content: "def bfs(graph, start, goal):\n    queue = [(start, [start])]\n    while queue:\n        node, path = queue.pop(0)\n        if node == goal: return path\n        for nb in graph[node]:\n            queue.append((nb, path + [nb]))" },
            ],
          },
        ],
      },
      {
        id: "c2",
        name: "Data Structures",
        code: "CS201",
        color: "oklch(0.72 0.16 165)",
        notes: [
          {
            id: "n3",
            title: "Week 1: Arrays & Linked Lists",
            week: 1,
            updatedAt: "2026-06-12",
            tags: ["basics"],
            blocks: [
              { id: uid(), type: "h1", content: "Arrays & Linked Lists" },
              { id: uid(), type: "text", content: "Arrays give O(1) random access; linked lists give O(1) insertion at known positions." },
              { id: uid(), type: "code", language: "typescript", content: "class Node<T> {\n  next: Node<T> | null = null;\n  constructor(public value: T) {}\n}" },
            ],
          },
          {
            id: "n4",
            title: "Week 2: Trees & Traversal",
            week: 2,
            updatedAt: "2026-06-16",
            tags: ["trees", "recursion"],
            blocks: [
              { id: uid(), type: "h1", content: "Trees & Traversal" },
              { id: uid(), type: "text", content: "Binary trees support in-order, pre-order, and post-order traversal." },
            ],
          },
        ],
      },
      {
        id: "c3",
        name: "Linear Algebra",
        code: "MATH211",
        color: "oklch(0.72 0.15 50)",
        notes: [
          {
            id: "n5",
            title: "Week 1: Vectors & Spaces",
            week: 1,
            updatedAt: "2026-06-10",
            tags: ["vectors", "final"],
            blocks: [
              { id: uid(), type: "h1", content: "Vectors & Vector Spaces" },
              { id: uid(), type: "text", content: "A vector space is closed under addition and scalar multiplication." },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "t2",
    name: "2026 Spring",
    courses: [
      {
        id: "c4",
        name: "Calculus II",
        code: "MATH102",
        color: "oklch(0.7 0.18 15)",
        notes: [
          {
            id: "n6",
            title: "Week 1: Integration Review",
            week: 1,
            updatedAt: "2026-02-10",
            tags: ["review"],
            blocks: [
              { id: uid(), type: "h1", content: "Integration Review" },
              { id: uid(), type: "text", content: "The integral is the area under a curve. Fundamental theorem connects derivatives and integrals." },
            ],
          },
        ],
      },
    ],
  },
];

export const allTags = ["midterm", "final", "definitions", "algorithms", "basics", "trees", "recursion", "vectors", "review"];

export const todaySchedule = [
  { time: "09:00", course: "Introduction to AI", room: "B-204", color: "oklch(0.7 0.17 268)" },
  { time: "11:00", course: "Data Structures", room: "Lab 3", color: "oklch(0.72 0.16 165)" },
  { time: "14:00", course: "Linear Algebra", room: "A-101", color: "oklch(0.72 0.15 50)" },
];
