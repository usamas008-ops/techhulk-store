// Supabase returns at most 1000 rows per request; this keeps asking for the
// next page until a short page comes back or the cap is reached.
type Page<T> = PromiseLike<{ data: T[] | null; error: { message: string } | null }>;

export async function loadAll<T>(
  fetchPage: (from: number, to: number) => Page<T>,
  cap = 20000,
  pageSize = 1000
): Promise<{ rows: T[]; error: string | null; capped: boolean }> {
  const rows: T[] = [];
  for (let from = 0; from < cap; from += pageSize) {
    const { data, error } = await fetchPage(from, from + pageSize - 1);
    if (error) return { rows, error: error.message, capped: false };
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return { rows, error: null, capped: false };
  }
  return { rows, error: null, capped: true };
}

/**
 * True when a Postgres or PostgREST error means a column or table is
 * missing — the signal admin pages use to fall back to a smaller select, or
 * to show a "run this SQL" notice, instead of failing outright.
 */
export function isMissingColumnError(message: string): boolean {
  return /column .* does not exist|could not find the .* column|schema cache/i.test(message);
}
