import type {
  ExamDetail,
  ExamSummary,
  Flashcard,
  GenerateFlashcardsRequest,
} from "@/src/types/flashcards";

export const mockFlashcards: Flashcard[] = [
  {
    id: "fc_001",
    front: "¿Qué es un grafo en matemáticas discretas?",
    back: "Un grafo G = (V, E) es un par formado por un conjunto de vértices V y un conjunto de aristas E que conectan pares de vértices.",
    doc_id: "doc_001",
    doc_title: "Matemáticas Discretas — Cap. 4",
    type: "definition",
    created_at: "2026-06-18T10:00:00Z",
  },
  {
    id: "fc_002",
    front: "¿Qué establece la Tercera Forma Normal (3FN)?",
    back: "Una relación está en 3FN si está en 2FN y ningún atributo no clave depende transitivamente de la clave primaria.",
    doc_id: "doc_002",
    doc_title: "Bases de Datos — Unidad 3",
    type: "concept",
    created_at: "2026-06-19T11:00:00Z",
  },
  {
    id: "fc_003",
    front: "¿Cuándo aplicar el patrón Factory Method?",
    back: "Cuando una clase no puede anticipar la clase de objetos que debe crear, o cuando una clase delega la creación a sus subclases.",
    doc_id: "doc_003",
    doc_title: "Ingeniería de Software — Patrones",
    type: "application",
    created_at: "2026-06-22T14:00:00Z",
  },
  {
    id: "fc_004",
    front: "¿Qué es un camino euleriano?",
    back: "Un camino que recorre cada arista del grafo exactamente una vez. Existe si el grafo es conexo y tiene exactamente 0 o 2 vértices de grado impar.",
    doc_id: "doc_001",
    doc_title: "Matemáticas Discretas — Cap. 4",
    type: "concept",
    created_at: "2026-06-23T09:00:00Z",
  },
];

export const mockExams: ExamSummary[] = [
  {
    id: "exam_001",
    title: "Examen — Matemáticas Discretas",
    doc_title: "Matemáticas Discretas — Cap. 4",
    question_count: 10,
    types: ["mcq", "true_false"],
    created_at: "2026-06-25T16:00:00Z",
  },
  {
    id: "exam_002",
    title: "Examen — Normalización BD",
    doc_title: "Bases de Datos — Unidad 3",
    question_count: 8,
    types: ["mcq", "open"],
    created_at: "2026-06-27T10:00:00Z",
  },
];

let flashcardsStore = [...mockFlashcards];
const examsStore = [...mockExams];

export function getMockFlashcards(): Flashcard[] {
  return [...flashcardsStore];
}

export function getMockExams(): ExamSummary[] {
  return [...examsStore];
}

export function generateMockFlashcards(
  request: GenerateFlashcardsRequest,
): Flashcard[] {
  const generated: Flashcard[] = Array.from({ length: request.count }, (_, i) => ({
    id: `fc_${Date.now()}_${i}`,
    front: `[${request.type}] Pregunta generada #${i + 1}`,
    back: "Respuesta generada por IA a partir del documento seleccionado.",
    doc_id: request.doc_ids[0] ?? "doc_001",
    doc_title: "Documento seleccionado",
    type: request.type,
    created_at: new Date().toISOString(),
  }));
  flashcardsStore = [...generated, ...flashcardsStore];
  return generated;
}

export function removeMockFlashcard(id: string): boolean {
  const before = flashcardsStore.length;
  flashcardsStore = flashcardsStore.filter((f) => f.id !== id);
  return flashcardsStore.length < before;
}

export function getMockExamDetail(id: string): ExamDetail | null {
  const summary = examsStore.find((e) => e.id === id);
  if (!summary) return null;

  return {
    ...summary,
    questions: [
      {
        id: "q1",
        type: "mcq",
        prompt: "¿Cuál es la complejidad de Dijkstra con cola de prioridad?",
        options: ["O(V²)", "O(E log V)", "O(V + E)", "O(E²)"],
        correct_answer: "O(E log V)",
      },
      {
        id: "q2",
        type: "true_false",
        prompt: "Todo árbol con n vértices tiene exactamente n-1 aristas.",
        correct_answer: "true",
      },
      {
        id: "q3",
        type: "open",
        prompt: "Explica la diferencia entre BCNF y 3FN.",
      },
    ],
  };
}
