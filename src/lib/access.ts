import { cache } from "react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkEnabled } from "./clerk";

// Droits d'accès à l'app — module **serveur uniquement**. Le rôle admin se
// pose à la main dans le dashboard Clerk (fiche utilisateur → Metadata →
// Public metadata → { "role": "admin" }) et n'est jamais modifiable depuis
// l'app : aucune Server Action, aucune route n'écrit dans publicMetadata.
//
// Ne jamais décider d'un accès à partir de `user.publicMetadata` lu côté
// client : c'est une valeur que le navigateur peut manipuler. Toute vérification
// passe par ce module, appelé dans un Server Component, une Server Action ou un
// Route Handler.

/**
 * Compte administrateur : accès complet et gratuit, sans jamais passer par
 * Stripe. Lu depuis Clerk à chaque requête, donc l'ajout du rôle prend effet
 * immédiatement, sans reconnexion.
 *
 * `cache()` dédoublonne l'appel Clerk à l'échelle d'une requête : plusieurs
 * composants peuvent l'appeler sans multiplier les allers-retours.
 */
export const isAdmin = cache(async (): Promise<boolean> => {
  if (!clerkEnabled) return false;
  try {
    const session = await auth();
    if (!session.userId) return false;
    const user = await currentUser();
    return user?.publicMetadata?.role === "admin";
  } catch (err) {
    // Clerk injoignable : on refuse le privilège plutôt que de l'accorder à tort.
    console.error("isAdmin: lecture du rôle Clerk impossible:", err);
    return false;
  }
});

/**
 * Droit d'utiliser l'app (dashboard, check-in, séances, progression, réglages).
 *
 * Aujourd'hui aucun abonnement Stripe n'est vérifié nulle part : tout le monde
 * est en Free Trial et personne n'est bloqué. Le jour où la vérification
 * d'abonnement arrive, elle se branche **ici et nulle part ailleurs** — les
 * pages appellent déjà cette fonction, et le court-circuit admin reste vrai.
 */
export async function hasFullAccess(): Promise<boolean> {
  if (await isAdmin()) return true;
  // TODO(P3) : remplacer par la vérification de l'abonnement Stripe actif.
  return true;
}
