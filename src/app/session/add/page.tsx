import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { ActivityPicker } from "./activity-picker";
import styles from "./add.module.css";

export const metadata = { title: "Ajouter une activité — EL COACH METHOD" };

export default async function AddActivityPage() {
  const userId = await getUserId();
  const profile = userId
    ? await prisma.profile.findUnique({ where: { userId }, select: { programme: true, programmes: true } })
    : null;
  const programmes = profile
    ? profile.programmes.length > 0
      ? profile.programmes
      : [profile.programme].filter((p): p is string => Boolean(p))
    : [];

  return (
    <div className={`${ecmFontVariables} ${styles.root}`}>
      <div className={styles.hero}>
        <div style={{ marginBottom: 14 }}>
          <BackHomeButton />
        </div>
        <div className={styles.kickerTop}>Nouvelle activité</div>
        <div className={styles.title}>AJOUTER UNE ACTIVITÉ</div>
        <div className={styles.sub}>Une 2e séance pour aujourd&apos;hui — ton check-in du matin reste inchangé.</div>
      </div>
      <div className={styles.fw}>
        <ActivityPicker programmes={programmes} />
      </div>
    </div>
  );
}
