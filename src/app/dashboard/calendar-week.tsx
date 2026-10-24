"use client";

import { useState, useTransition } from "react";
import styles from "./dashboard.module.css";
import { getDayDetail, type DayDetail } from "./actions";
import { dateKey } from "@/lib/date-key";
import { useLang } from "@/lib/i18n/provider";
import { formatDate } from "@/lib/i18n";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

function getWeekDays(offset: number): Date[] {
  const now = new Date();
  const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export function CalendarWeek({ checkinDates }: { checkinDates: string[] }) {
  const { lang, t } = useLang();
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<DayDetail | null>(null);
  const [pending, startTransition] = useTransition();
  const days = getWeekDays(offset);
  const now = new Date();
  const todayStr = now.toDateString();
  const checkinSet = new Set(checkinDates);
  const months = [...new Set(days.map((d) => d.getMonth()))];
  const monthLabel =
    months
      .map((m) => formatDate(lang, days.find((d) => d.getMonth() === m)!, { month: "long" }).toUpperCase())
      .join(" / ") +
    " " +
    days[0].getFullYear();

  function handleDayClick(d: Date) {
    const key = dateKey(d);
    if (!checkinSet.has(key)) {
      setSelected({ date: key, hasCheckin: false, ecm: null, seance: null });
      return;
    }
    startTransition(async () => {
      const detail = await getDayDetail(key);
      setSelected(detail);
    });
  }

  return (
    <div className={styles.cal}>
      <div className={styles.calNav}>
        <button className={styles.calArrow} onClick={() => setOffset((o) => o - 1)}>‹</button>
        <div className={styles.calMonth}>{monthLabel}</div>
        <button className={styles.calArrow} onClick={() => setOffset((o) => o + 1)}>›</button>
      </div>
      <div className={styles.calDays}>
        {days.map((d, i) => {
          const key = dateKey(d);
          const isToday = d.toDateString() === todayStr;
          const hasSession = checkinSet.has(key);
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleDayClick(d)}
              className={cx(
                styles.calDay,
                hasSession && styles.hasSession,
                isToday && styles.today,
                isToday && styles.activeDay,
              )}
              style={{ cursor: "pointer", border: "none", background: "none" }}
            >
              <div className={styles.calDayLabel}>{formatDate(lang, d, { weekday: "short" }).replace(".", "").toUpperCase()}</div>
              <div className={styles.calDayNum}>{d.getDate()}</div>
              {hasSession && <div className={styles.calDot} />}
            </button>
          );
        })}
      </div>
      {selected && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 14px",
            border: "1px solid var(--bd)",
            borderRadius: 4,
            fontSize: 12,
            color: "var(--m)",
          }}
        >
          {pending ? (
            t("dash.cal.loading")
          ) : !selected.hasCheckin ? (
            <>
              <strong style={{ color: "var(--w)" }}>{selected.date}</strong> — {t("dash.cal.noData")}
            </>
          ) : (
            <>
              <strong style={{ color: "var(--w)" }}>{selected.date}</strong>
              {selected.ecm ? (
                <>
                  {" — "}
                  {t("dash.cal.score", {
                    letter: selected.ecm.letter,
                    n: selected.ecm.numeric,
                    seance: selected.seance ?? t("dash.cal.seanceUnknown"),
                  })}
                </>
              ) : (
                <> — {t("dash.cal.noPlan")}</>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
