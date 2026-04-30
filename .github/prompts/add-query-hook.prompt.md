---
description: "Generate a typed React Query hook file and matching Axios API file for a new resource, using the query-key factory pattern"
argument-hint: "Resource name (singular), e.g. response, user, tag"
agent: "agent"
---

Generate a typed React Query hook and Axios API layer for the resource: **$args**

## Steps

### 1. Create the API file at `src/api/<resource>.ts`

Follow the pattern from [src/api/questionnaires.ts](../../src/api/questionnaires.ts):

```ts
import { apiClient } from '@/lib/axios'
import type { <Resource> } from '@/types'

export async function get<Resources>(): Promise<<Resource>[]> {
  const { data } = await apiClient.get<<Resource>[]>('/<resources>')
  return data
}

export async function get<Resource>(id: string): Promise<<Resource>> {
  const { data } = await apiClient.get<<Resource>>(`/<resources>/${id}`)
  return data
}

export async function create<Resource>(
  payload: Omit<<Resource>, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<<Resource>> {
  const { data } = await apiClient.post<<Resource>>('/<resources>', payload)
  return data
}

export async function update<Resource>(
  id: string,
  payload: Partial<Omit<<Resource>, 'id' | 'createdAt' | 'updatedAt'>>,
): Promise<<Resource>> {
  const { data } = await apiClient.patch<<Resource>>(`/<resources>/${id}`, payload)
  return data
}

export async function delete<Resource>(id: string): Promise<void> {
  await apiClient.delete(`/<resources>/${id}`)
}
```

- Use `apiClient` from `@/lib/axios` — auth headers are injected automatically.
- Payload types use `Omit<T, 'id' | 'createdAt' | 'updatedAt'>`.

### 2. Add the TypeScript interface to `src/types/index.ts`

Add a new interface for the resource alongside existing types.

### 3. Create the hook file at `src/hooks/use<Resource>s.ts`

Follow the query-key factory pattern from [src/hooks/useQuestionnaires.ts](../../src/hooks/useQuestionnaires.ts):

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { get<Resources>, get<Resource>, create<Resource>, update<Resource>, delete<Resource> } from '@/api/<resource>'
import type { <Resource> } from '@/types'

export const <resource>Keys = {
  all: ['<resources>'] as const,
  detail: (id: string) => ['<resources>', id] as const,
}

export function use<Resources>() {
  return useQuery({ queryKey: <resource>Keys.all, queryFn: get<Resources> })
}

export function use<Resource>(id: string) {
  return useQuery({
    queryKey: <resource>Keys.detail(id),
    queryFn: () => get<Resource>(id),
    enabled: !!id,
  })
}

export function useCreate<Resource>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: create<Resource>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: <resource>Keys.all })
    },
  })
}

export function useUpdate<Resource>(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Omit<<Resource>, 'id' | 'createdAt' | 'updatedAt'>>) =>
      update<Resource>(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: <resource>Keys.all })
      queryClient.invalidateQueries({ queryKey: <resource>Keys.detail(id) })
    },
  })
}

export function useDelete<Resource>() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: delete<Resource>,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: <resource>Keys.all })
    },
  })
}
```

**Key rules:**
- Every mutation `onSuccess` must call `queryClient.invalidateQueries()` to keep lists fresh.
- `useUpdate` invalidates both `all` and `detail(id)` keys.
- `detail` queries include `enabled: !!id` to prevent fetching with an empty id.

### 4. Run `pnpm lint` and fix any issues before finishing.
