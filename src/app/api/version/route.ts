// Identifiant du déploiement en cours : l'app ouverte le compare au sien pour se recharger après une mise à jour.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ id: process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" }, { headers: { "cache-control": "no-store" } });
}
