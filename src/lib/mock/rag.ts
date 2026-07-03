import type { RagQuery, RagQueryRequest } from "@/src/types/rag";

export const mockRagHistory: RagQuery[] = [
  {
    id: "rag_001",
    question: "¿Qué es el patrón Strategy y cuándo se usa?",
    answer:
      "El patrón Strategy define una familia de algoritmos intercambiables encapsulados en clases separadas. Permite cambiar el comportamiento en tiempo de ejecución sin modificar el código cliente, ideal cuando existen múltiples variantes de un algoritmo (por ejemplo, distintas estrategias de chunking en el pipeline RAG).",
    sources: [
      {
        chunk_id: "chk_101",
        document_title: "Ingeniería de Software — Patrones",
        page: 12,
        excerpt:
          "Strategy (Comportamental): encapsula algoritmos intercambiables...",
      },
      {
        chunk_id: "chk_102",
        document_title: "Proyecto UTBookLM — Arquitectura",
        page: 8,
        excerpt: "ChunkingStrategy: RecursiveTextChunker, SemanticChunker...",
      },
    ],
    doc_ids: ["doc_003"],
    created_at: "2026-06-29T10:30:00Z",
  },
  {
    id: "rag_002",
    question: "¿Cuáles son las formas normales en bases de datos?",
    answer:
      "Las formas normales (1FN, 2FN, 3FN y BCNF) son reglas para organizar datos y eliminar redundancia. La 1FN exige valores atómicos; la 2FN elimina dependencias parciales; la 3FN elimina dependencias transitivas; BCNF refuerza la 3FN cuando hay múltiples claves candidatas.",
    sources: [
      {
        chunk_id: "chk_201",
        document_title: "Bases de Datos — Unidad 3",
        page: 5,
        excerpt: "Primera forma normal (1FN): cada celda contiene un valor atómico...",
      },
    ],
    doc_ids: ["doc_002"],
    created_at: "2026-06-28T15:00:00Z",
  },
];

let historyStore = [...mockRagHistory];

export function getMockRagHistory(): RagQuery[] {
  return [...historyStore];
}

export function mockRagQuery(request: RagQueryRequest): RagQuery {
  const query: RagQuery = {
    id: `rag_${Date.now()}`,
    question: request.question,
    answer:
      "Esta es una respuesta simulada del motor RAG. Cuando el backend esté disponible, recibirás una respuesta generada con citas exactas a los fragmentos de tus documentos indexados en ChromaDB.",
    sources: [
      {
        chunk_id: "chk_mock",
        document_title: "Documento seleccionado",
        page: 1,
        excerpt: "Fragmento de ejemplo del documento consultado...",
      },
    ],
    doc_ids: request.doc_ids,
    created_at: new Date().toISOString(),
  };
  historyStore = [query, ...historyStore];
  return query;
}
