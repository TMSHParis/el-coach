import Link from "next/link";
import { isCheckinDoneToday } from "./actions";
import { CheckinForm } from "./checkin-form";
import { checkinFontVariables } from "./checkin-fonts";
import styles from "./checkin.module.css";

export const metadata = { title: "Check-in du jour — EL COACH METHOD" };

export default async function CheckinPage() {
  const doneToday = await isCheckinDoneToday();

  if (doneToday) {
    return (
      <div className={checkinFontVariables}>
        <div className={styles.checkinRoot}>
          <div className={styles.hero}>
            <div className={styles.logo}>⚡</div>
            <div className={styles.bn}>EL COACH METHOD</div>
            <div className={styles.bt}>Daily Performance Check-In</div>
          </div>
          <div className={styles.doneBanner}>
            <div className={styles.doneIcon}>✅</div>
            <div className={styles.doneTitle}>Check-in déjà validé</div>
            <div className={styles.doneSub}>
              Tu as déjà complété ton check-in aujourd&apos;hui.
              <br />
              Ton dashboard est à jour.
            </div>
            <Link href="/dashboard" className={styles.doneBtn}>
              Voir mon dashboard →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={checkinFontVariables}>
      <CheckinForm />
    </div>
  );
}
