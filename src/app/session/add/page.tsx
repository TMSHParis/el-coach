import { getT } from "@/lib/i18n/server";
import { getUserId } from "@/lib/user-id";
import { prisma } from "@/lib/prisma";
import { BackHomeButton } from "@/components/back-home-button";
import { ecmFontVariables } from "@/app/signup/ecm-fonts";
import { ActivityPicker } from "./activity-picker";
import styles from "./add.module.css";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("sp.add.title") };
}

export default async function AddActivityPage() {
  const { t } = await getT();
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
        <div className={styles.kickerTop}>{t("sp.add.kicker")}</div>
        <div className={styles.title}>{t("sp.add.h1")}</div>
        <div className={styles.sub}>{t("sp.add.sub")}</div>
      </div>
      <div className={styles.fw}>
        <ActivityPicker programmes={programmes} />
      </div>
    </div>
  );
}
