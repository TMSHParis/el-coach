"use client";

import { useState } from "react";
import styles from "./dashboard.module.css";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const DAYS_FR = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];
const MONTHS_FR = [
  "JANVIER", "FÉVRIER", "MARS", "AVRIL", "MAI", "JUIN",
  "JUILLET", "AOÛT", "SEPTEMBRE", "OCTOBRE", "NOVEMBRE", "DÉCEMBRE",
];

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

export function CalendarWeek() {
  const [offset, setOffset] = useState(0);
  const days = getWeekDays(offset);
  const now = new Date();
  const todayStr = now.toDateString();
  const months = [...new Set(days.map((d) => d.getMonth()))];
  const monthLabel = months.map((m) => MONTHS_FR[m]).join(" / ") + " " + days[0].getFullYear();

  return (
    <div className={styles.cal}>
      <div className={styles.calNav}>
        <button className={styles.calArrow} onClick={() => setOffset((o) => o - 1)}>‹</button>
        <div className={styles.calMonth}>{monthLabel}</div>
        <button className={styles.calArrow} onClick={() => setOffset((o) => o + 1)}>›</button>
      </div>
      <div className={styles.calDays}>
        {days.map((d, i) => {
          const isToday = d.toDateString() === todayStr;
          const hasSession = isToday || d < now;
          return (
            <div
              key={i}
              className={cx(
                styles.calDay,
                hasSession && styles.hasSession,
                isToday && styles.today,
                isToday && styles.activeDay,
              )}
            >
              <div className={styles.calDayLabel}>{DAYS_FR[i]}</div>
              <div className={styles.calDayNum}>{d.getDate()}</div>
              <div className={styles.calDot} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
