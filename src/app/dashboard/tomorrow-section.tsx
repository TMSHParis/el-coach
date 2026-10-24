import type { TomorrowCard } from "@/lib/tomorrow-plan";
import styles from "./tomorrow-section.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

/** Section « DEMAIN » : une carte par créneau prévu demain (ordre de l'heure), avec ses conseils courts. */
export function TomorrowSection({ title, cards }: { title: string; cards: TomorrowCard[] }) {
  return (
    <section aria-label={title}>
      <div className={styles.title}>{title}</div>
      <div className={styles.stack}>
        {cards.map((c, i) => (
          <article key={i} className={cx(styles.card, c.kind === "horsEcm" && styles.horsEcm, c.kind === "repos" && styles.repos)}>
            <div className={styles.top}>
              <div className={styles.icon} aria-hidden>
                {c.icon}
              </div>
              <div className={styles.names}>
                <div className={styles.name}>{c.name}</div>
                <div className={styles.sub}>{c.sub}</div>
              </div>
              {c.heure && <div className={styles.time}>{c.heure}</div>}
            </div>
            {c.tips.length > 0 && (
              <div className={styles.tips}>
                {c.tips.map((tip) => (
                  <div key={tip.key} className={styles.tip}>
                    <span className={styles.tipIcon} aria-label={tip.label} role="img">
                      {tip.icon}
                    </span>
                    <p className={styles.tipText}>{tip.text}</p>
                  </div>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
