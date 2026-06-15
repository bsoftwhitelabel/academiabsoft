import { createCrudHooks } from "./crud"
import type { ClientOrg, TrainingArea, Contract, Room } from "@/types/domain"

// Submódulos de Gestão com tabela confirmada na introspecção.
// hasUpdatedAt: client_orgs tem updatedAt; training_areas/rooms/contracts NÃO.
export const clientOrgsCrud = createCrudHooks<ClientOrg>({
  table: "client_orgs",
  queryKey: "mgmt_client_orgs",
  orderBy: "name",
  injectTenant: true,
  hasUpdatedAt: true,
})

// training_areas: escrita restrita a SUPER_ADMIN (Decisão 3 RLS). Sem tenant.
export const trainingAreasCrud = createCrudHooks<TrainingArea>({
  table: "training_areas",
  queryKey: "mgmt_training_areas",
  orderBy: "name",
  hasUpdatedAt: false,
})

export const roomsCrud = createCrudHooks<Room>({
  table: "rooms",
  queryKey: "mgmt_rooms",
  orderBy: "name",
  injectTenant: true,
  hasUpdatedAt: false,
})

export const contractsCrud = createCrudHooks<Contract>({
  table: "contracts",
  queryKey: "mgmt_contracts",
  orderBy: "createdAt",
  ascending: false,
  hasUpdatedAt: false,
})
