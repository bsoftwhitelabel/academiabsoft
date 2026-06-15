import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import type { ClientOrg, TrainingArea, Contract } from "@/types/domain"

export interface CourseLookup {
  id: string
  name: string
  durationHours: number | null
  status: string | null
}
export interface PlanLookup {
  id: string
  name: string
  status: string | null
}
export interface RoomLookup {
  id: string
  name: string
}
export interface TrainerLookup {
  id: string
  users: { firstName: string | null; lastName: string | null } | null
}

export function usePublishedCourses() {
  return useQuery({
    queryKey: ["lookup", "courses_published"],
    queryFn: async (): Promise<CourseLookup[]> => {
      const { data, error } = await supabase
        .from("courses")
        .select("id,name,durationHours,status")
        .eq("status", "PUBLISHED")
        .order("name")
      if (error) throw error
      return (data ?? []) as CourseLookup[]
    },
  })
}

export function usePlansLookup() {
  return useQuery({
    queryKey: ["lookup", "plans"],
    queryFn: async (): Promise<PlanLookup[]> => {
      const { data, error } = await supabase
        .from("training_plans")
        .select("id,name,status")
        .order("name")
      if (error) throw error
      return (data ?? []) as PlanLookup[]
    },
  })
}

export function useRoomsLookup() {
  return useQuery({
    queryKey: ["lookup", "rooms"],
    queryFn: async (): Promise<RoomLookup[]> => {
      const { data, error } = await supabase
        .from("rooms")
        .select("id,name")
        .order("name")
      if (error) throw error
      return (data ?? []) as RoomLookup[]
    },
  })
}

export function useTrainersLookup() {
  return useQuery({
    queryKey: ["lookup", "trainers"],
    queryFn: async (): Promise<TrainerLookup[]> => {
      const { data, error } = await supabase
        .from("trainers")
        .select("id,users(firstName,lastName)")
        .limit(1000)
      if (error) throw error
      return (data ?? []) as unknown as TrainerLookup[]
    },
  })
}

export function useContractsByOrg(clientOrgId: string | undefined) {
  return useQuery({
    queryKey: ["lookup", "contracts", clientOrgId],
    enabled: !!clientOrgId,
    queryFn: async (): Promise<Contract[]> => {
      const { data, error } = await supabase
        .from("contracts")
        .select("*")
        .eq("clientOrgId", clientOrgId as string)
        .order("startDate", { ascending: false })
      if (error) throw error
      return (data ?? []) as Contract[]
    },
  })
}

export function useClientOrgs() {
  return useQuery({
    queryKey: ["lookup", "client_orgs"],
    queryFn: async (): Promise<ClientOrg[]> => {
      const { data, error } = await supabase
        .from("client_orgs")
        .select("*")
        .order("name")
      if (error) throw error
      return (data ?? []) as ClientOrg[]
    },
  })
}

export function useTrainingAreas() {
  return useQuery({
    queryKey: ["lookup", "training_areas"],
    queryFn: async (): Promise<TrainingArea[]> => {
      const { data, error } = await supabase
        .from("training_areas")
        .select("*")
        .order("name")
      if (error) throw error
      return (data ?? []) as TrainingArea[]
    },
  })
}
