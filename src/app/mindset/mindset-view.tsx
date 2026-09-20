"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import styles from "./mindset.module.css";

const DELAY_MS = 4000;

export function MindsetView({ message }: { message: string }) {
  const router = useRouter();

  useEffect(() => {
    // replace : le retour depuis le dashboard ramène avant le check-in, pas ici.
    const timer = setTimeout(() => router.replace("/dashboard"), DELAY_MS);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className={styles.root}>
      <p className={styles.message}>{message}</p>
      <button type="button" className={styles.go} onClick={() => router.replace("/dashboard")}>
        Allons-y →
      </button>
      <div className={styles.progress} />
    </div>
  );
}
