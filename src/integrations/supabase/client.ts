import { apiUrl } from "@/lib/api";

type Row = Record<string, any>;
type QueryResult<T> = { data: T | null; error: { message: string } | null };
type AuthSession = { user: { id: string; email: string } } | null;
type AuthChangeHandler = (event: string, session: AuthSession) => void;

type LocalDb = {
  profiles: Row[];
  documents: Row[];
  carousel_slides: Row[];
  subscription_plans: Row[];
  system_settings: Row[];
  transactions: Row[];
  purchased_workflows: Row[];
  subscriptions: Row[];
  activity_logs: Row[];
  auth_users: Row[];
};

const DB_KEY = "auton8n_local_db_v2";
const SESSION_KEY = "auton8n_auth_session_v1";
const listeners = new Set<AuthChangeHandler>();

const defaultDb: LocalDb = {
  profiles: [],
  documents: [],
  carousel_slides: [],
  subscription_plans: [
    { id: crypto.randomUUID(), name: "Pro", price: 29, features: ["Premium workflows"], is_popular: true },
    { id: crypto.randomUUID(), name: "Enterprise", price: 99, features: ["Team support"], is_popular: false },
  ],
  system_settings: [{ key: "subscriptions_enabled", value: true }],
  transactions: [],
  purchased_workflows: [],
  subscriptions: [],
  activity_logs: [],
  auth_users: [],
};

function loadDb(): LocalDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return structuredClone(defaultDb);
    const parsed = JSON.parse(raw) as Partial<LocalDb>;
    return {
      ...structuredClone(defaultDb),
      ...parsed,
    } as LocalDb;
  } catch {
    return structuredClone(defaultDb);
  }
}

function saveDb(db: LocalDb): void {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

function getSession(): AuthSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

function setSession(session: AuthSession): void {
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

function emitAuth(event: string): void {
  const session = getSession();
  listeners.forEach((handler) => handler(event, session));
}

function normalizeRows(input: unknown): Row[] {
  if (Array.isArray(input)) return input as Row[];
  if (input && typeof input === "object") return [input as Row];
  return [];
}

function applyFilters(rows: Row[], filters: Array<{ type: "eq" | "in"; key: string; value: any }>): Row[] {
  return filters.reduce((acc, f) => {
    if (f.type === "eq") return acc.filter((r) => r?.[f.key] === f.value);
    if (f.type === "in") {
      const values = Array.isArray(f.value) ? f.value : [];
      return acc.filter((r) => values.includes(r?.[f.key]));
    }
    return acc;
  }, rows);
}

function applyOrders(rows: Row[], orders: Array<{ key: string; ascending: boolean }>): Row[] {
  return [...rows].sort((a, b) => {
    for (const order of orders) {
      const av = a?.[order.key];
      const bv = b?.[order.key];
      if (av === bv) continue;
      if (av == null) return order.ascending ? -1 : 1;
      if (bv == null) return order.ascending ? 1 : -1;
      if (av < bv) return order.ascending ? -1 : 1;
      if (av > bv) return order.ascending ? 1 : -1;
    }
    return 0;
  });
}

async function fetchWorkflowsFromApi(): Promise<Row[]> {
  const res = await fetch(apiUrl("/api/admin/workflows"));
  if (!res.ok) throw new Error(`Failed to fetch workflows: ${res.status}`);
  const json = (await res.json()) as { workflows?: Row[] };
  return Array.isArray(json.workflows) ? json.workflows : [];
}

class QueryBuilder {
  private table: string;
  private mode: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private payload: Row[] = [];
  private filters: Array<{ type: "eq" | "in"; key: string; value: any }> = [];
  private orders: Array<{ key: string; ascending: boolean }> = [];
  private limitCount: number | null = null;
  private forceSingle: "single" | "maybeSingle" | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns?: string): this {
    this.mode = this.mode === "insert" || this.mode === "update" || this.mode === "upsert" ? this.mode : "select";
    return this;
  }

  insert(value: unknown): this {
    this.mode = "insert";
    this.payload = normalizeRows(value).map((r) => ({ id: r.id ?? crypto.randomUUID(), ...r }));
    return this;
  }

  update(value: unknown): this {
    this.mode = "update";
    this.payload = normalizeRows(value);
    return this;
  }

  upsert(value: unknown): this {
    this.mode = "upsert";
    this.payload = normalizeRows(value).map((r) => ({ id: r.id ?? crypto.randomUUID(), ...r }));
    return this;
  }

  delete(): this {
    this.mode = "delete";
    return this;
  }

  eq(key: string, value: any): this {
    this.filters.push({ type: "eq", key, value });
    return this;
  }

  in(key: string, value: any[]): this {
    this.filters.push({ type: "in", key, value });
    return this;
  }

  order(key: string, options?: { ascending?: boolean }): this {
    this.orders.push({ key, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number): this {
    this.limitCount = count;
    return this;
  }

  single(): Promise<QueryResult<Row>> {
    this.forceSingle = "single";
    return this.execute() as Promise<QueryResult<Row>>;
  }

  maybeSingle(): Promise<QueryResult<Row | null>> {
    this.forceSingle = "maybeSingle";
    return this.execute() as Promise<QueryResult<Row | null>>;
  }

  then<TResult1 = QueryResult<Row[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<Row[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }

  private async execute(): Promise<QueryResult<any>> {
    try {
      if (this.table === "workflows") {
        return await this.executeWorkflows();
      }
      if (this.table === "payment_types") {
        return await this.executePaymentTypes();
      }
      return this.executeLocalTable();
    } catch (error: any) {
      return { data: null, error: { message: error?.message ?? "Unknown error" } };
    }
  }

  private async executeWorkflows(): Promise<QueryResult<any>> {
    if (this.mode === "select") {
      let rows = await fetchWorkflowsFromApi();
      rows = applyFilters(rows, this.filters);
      if (this.orders.length > 0) rows = applyOrders(rows, this.orders);
      if (this.limitCount != null) rows = rows.slice(0, this.limitCount);
      return this.finalizeRows(rows);
    }

    if (this.mode === "insert") {
      const created: Row[] = [];
      for (const row of this.payload) {
        const res = await fetch(apiUrl("/api/admin/workflows"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(row),
        });
        if (!res.ok) throw new Error(`Create workflow failed: ${res.status}`);
        const json = await res.json().catch(() => ({}));
        created.push(json?.workflow ?? row);
      }
      return this.finalizeRows(created);
    }

    if (this.mode === "update") {
      const id = this.filters.find((f) => f.type === "eq" && f.key === "id")?.value;
      if (!id) throw new Error("Workflow update requires id filter");
      const body = this.payload[0] ?? {};
      const res = await fetch(apiUrl(`/api/admin/workflows/${id}`), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Update workflow failed: ${res.status}`);
      const json = await res.json().catch(() => ({}));
      return this.finalizeRows([json?.workflow ?? { id, ...body }]);
    }

    if (this.mode === "delete") {
      const id = this.filters.find((f) => f.type === "eq" && f.key === "id")?.value;
      if (!id) throw new Error("Workflow delete requires id filter");
      const res = await fetch(apiUrl(`/api/admin/workflows/${id}`), { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete workflow failed: ${res.status}`);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  private async executePaymentTypes(): Promise<QueryResult<any>> {
    if (this.mode !== "select") return { data: null, error: null };
    const res = await fetch(apiUrl("/api/admin/payment-methods"));
    if (!res.ok) throw new Error(`Failed to fetch payment methods: ${res.status}`);
    const json = (await res.json()) as { methods?: Row[] };
    let rows: Row[] = (json.methods ?? []).map((m) => ({
      id: m.id,
      name: m.name,
      is_enabled: !!m.is_enabled,
    }));
    rows = applyFilters(rows, this.filters);
    return this.finalizeRows(rows);
  }

  private executeLocalTable(): QueryResult<any> {
    const db = loadDb();
    const tableRows = Array.isArray((db as any)[this.table]) ? ([...(db as any)[this.table]] as Row[]) : [];

    if (this.mode === "select") {
      let rows = applyFilters(tableRows, this.filters);
      if (this.orders.length > 0) rows = applyOrders(rows, this.orders);
      if (this.limitCount != null) rows = rows.slice(0, this.limitCount);

      if (this.table === "activity_logs") {
        const profilesMap = new Map((db.profiles || []).map((p) => [p.id, p]));
        rows = rows.map((r) => ({
          ...r,
          profiles: r.user_id ? { full_name: profilesMap.get(r.user_id)?.full_name ?? null, avatar_url: profilesMap.get(r.user_id)?.avatar_url ?? null } : null,
        }));
      }

      return this.finalizeRows(rows);
    }

    if (this.mode === "insert") {
      const nextRows = this.payload.map((row) => ({
        id: row.id ?? crypto.randomUUID(),
        created_at: row.created_at ?? new Date().toISOString(),
        ...row,
      }));
      (db as any)[this.table] = [...tableRows, ...nextRows];
      saveDb(db);
      return this.finalizeRows(nextRows);
    }

    if (this.mode === "upsert") {
      const next = [...tableRows];
      for (const row of this.payload) {
        if (this.table === "system_settings" && row.key) {
          const idx = next.findIndex((r) => r.key === row.key);
          if (idx >= 0) next[idx] = { ...next[idx], ...row };
          else next.push({ id: row.id ?? crypto.randomUUID(), ...row });
          continue;
        }
        const idx = next.findIndex((r) => r.id === row.id);
        if (idx >= 0) next[idx] = { ...next[idx], ...row };
        else next.push({ id: row.id ?? crypto.randomUUID(), ...row });
      }
      (db as any)[this.table] = next;
      saveDb(db);
      return this.finalizeRows(this.payload);
    }

    if (this.mode === "update") {
      const update = this.payload[0] ?? {};
      const rows = tableRows.map((r) => {
        const ok = applyFilters([r], this.filters).length > 0;
        return ok ? { ...r, ...update, updated_at: new Date().toISOString() } : r;
      });
      (db as any)[this.table] = rows;
      saveDb(db);
      const changed = rows.filter((r) => applyFilters([r], this.filters).length > 0);
      return this.finalizeRows(changed);
    }

    if (this.mode === "delete") {
      const kept = tableRows.filter((r) => applyFilters([r], this.filters).length === 0);
      (db as any)[this.table] = kept;
      saveDb(db);
      return { data: null, error: null };
    }

    return { data: null, error: null };
  }

  private finalizeRows(rows: Row[]): QueryResult<any> {
    if (this.forceSingle === "single") {
      if (rows.length === 0) return { data: null, error: { message: "No rows" } };
      return { data: rows[0], error: null };
    }
    if (this.forceSingle === "maybeSingle") {
      return { data: rows[0] ?? null, error: null };
    }
    return { data: rows, error: null };
  }
}

const auth = {
  async signUp(payload: { email: string; password: string; options?: { data?: { full_name?: string; username?: string } } }): Promise<QueryResult<null>> {
    const db = loadDb();
    const exists = db.auth_users.some((u) => u.email.toLowerCase() === payload.email.toLowerCase());
    if (exists) {
      return { data: null, error: { message: "User already exists" } };
    }

    const userId = crypto.randomUUID();
    db.auth_users.push({ id: userId, email: payload.email, password: payload.password, created_at: new Date().toISOString() });
    db.profiles.push({
      id: userId,
      username: payload.options?.data?.username ?? "",
      full_name: payload.options?.data?.full_name ?? "",
      website: "",
      avatar_url: "",
      role: "admin",
      updated_at: new Date().toISOString(),
    });
    saveDb(db);

    const session = { user: { id: userId, email: payload.email } };
    setSession(session);
    emitAuth("SIGNED_IN");
    return { data: null, error: null };
  },

  async signInWithPassword(payload: { email: string; password: string }): Promise<QueryResult<null>> {
    const db = loadDb();
    const found = db.auth_users.find(
      (u) => u.email.toLowerCase() === payload.email.toLowerCase() && u.password === payload.password
    );
    if (!found) {
      return { data: null, error: { message: "Invalid email or password" } };
    }

    const session = { user: { id: found.id, email: found.email } };
    setSession(session);
    emitAuth("SIGNED_IN");
    return { data: null, error: null };
  },

  async getSession(): Promise<{ data: { session: AuthSession } }> {
    return { data: { session: getSession() } };
  },

  onAuthStateChange(callback: AuthChangeHandler): { data: { subscription: { unsubscribe: () => void } } } {
    listeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => listeners.delete(callback),
        },
      },
    };
  },

  async signOut(): Promise<QueryResult<null>> {
    setSession(null);
    emitAuth("SIGNED_OUT");
    return { data: null, error: null };
  },
};

export const supabase = {
  auth,
  from(table: string): QueryBuilder {
    return new QueryBuilder(table);
  },
};
