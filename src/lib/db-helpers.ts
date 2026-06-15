import cuid from "cuid"

// As tabelas são geridas por Prisma: id @default(cuid()) é gerado no cliente,
// não na BD. updatedAt (@updatedAt) também não tem default na BD. Estes helpers
// preenchem o que o cliente tem de fornecer no insert.

export function newId(): string {
  return cuid()
}

export function now(): string {
  return new Date().toISOString()
}

/**
 * Insert para tabelas Prisma COM coluna updatedAt (sem default na BD):
 * users, trainees, courses, client_orgs, training_plans, training_actions,
 * training_sessions. Preenche id + updatedAt. createdAt tem default now().
 */
export function withDbDefaults<T extends Record<string, unknown>>(
  payload: T
): T & { id: string; updatedAt: string } {
  return {
    id: newId(),
    updatedAt: now(),
    ...payload,
  }
}

/**
 * Insert para tabelas Prisma SEM coluna updatedAt: trainers, rooms,
 * contracts, course_modules, training_areas. Só preenche id. Enviar
 * updatedAt a estas tabelas dá erro 42703 (column does not exist).
 */
export function withId<T extends Record<string, unknown>>(
  payload: T
): T & { id: string } {
  return {
    id: newId(),
    ...payload,
  }
}
