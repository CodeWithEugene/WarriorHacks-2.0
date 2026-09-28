import { fail, ok } from "@/lib/api"
import { getTeamByCoachToken, listCheckIns } from "@/lib/teams"

export async function GET(_req: Request, ctx: { params: Promise<{ token: string; id: string }> }) {
  const { token, id } = await ctx.params
  const team = await getTeamByCoachToken(token)
  if (!team) return fail(404, "not_found", "Not found.")
  const rows = await listCheckIns(team, id)
  return ok(rows, { headers: { "Cache-Control": "no-store" } })
}
