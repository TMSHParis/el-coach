"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import styles from "./dashboard.module.css";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

export function SessionTabs({
  recommended,
  recoText,
  labelA,
  labelB,
  subA,
  subB,
  panelA,
  panelB,
}: {
  recommended: "a" | "b";
  recoText: string;
  labelA: string;
  labelB: string;
  subA: string;
  subB: string;
  panelA: ReactNode;
  panelB: ReactNode;
}) {
  const [active, setActive] = useState<"a" | "b">(recommended);

  return (
    <>
      <div className={styles.tabs}>
        <div
          className={cx(styles.tab, active === "a" && styles.activeA)}
          onClick={() => setActive("a")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <div className={styles.tabTitle}>{labelA}</div>
            {recommended === "a" && (
              <div
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--yellow)",
                  padding: "2px 6px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "var(--yellow)",
                }}
              >
                REC
              </div>
            )}
          </div>
          <div className={styles.tabSub}>{subA}</div>
        </div>
        <div
          className={cx(styles.tab, active === "b" && styles.activeB)}
          onClick={() => setActive("b")}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
            <div className={styles.tabTitle}>{labelB}</div>
            {recommended === "b" && (
              <div
                style={{
                  background: "transparent",
                  border: "1.5px solid var(--yellow)",
                  padding: "2px 6px",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: "var(--yellow)",
                }}
              >
                REC
              </div>
            )}
          </div>
          <div className={styles.tabSub}>{subB}</div>
        </div>
      </div>
      <div
        style={{
          background: "var(--s)",
          border: "1px solid var(--bd)",
          borderLeft: "2px solid var(--yellow)",
          padding: "10px 14px",
          marginBottom: 0,
          fontSize: 12,
          color: "var(--m)",
          letterSpacing: 0.5,
        }}
      >
        {recoText}
      </div>
      {active === "a" ? panelA : panelB}
    </>
  );
}
