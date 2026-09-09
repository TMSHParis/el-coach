"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyEcmProfile, updateEcmProfile, type EcmProfileCookie } from "@/app/signup/actions";
import {
  cx,
  OBJECTIFS,
  EQUIPEMENTS,
  RESTRICTIONS,
  COMPLEMENTS,
  emptyEcmProfile,
  MoMulti,
  MoMultiCapped,
  YesNo,
  SportBlock,
} from "@/app/signup/ecm-shared";
import styles from "@/app/signup/ecm-signup.module.css";

/**
 * Contenu de /profile/edit. Aucun garde-fou d'auth ici — le middleware
 * (src/middleware.ts) protège déjà /profile/edit et redirige vers
 * /signin?redirect=/profile/edit avant que cette page ne s'affiche.
 */
export function ProfileEditForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<EcmProfileCookie>(emptyEcmProfile());
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [objError, setObjError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyEcmProfile().then((p) => {
      if (cancelled) return;
      if (p) setProfile(p);
      else setNotFound(true);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setField = (patch: Partial<EcmProfileCookie>) => setProfile((d) => ({ ...d, ...patch }));
  const setSportField = (sport: "s1" | "s2", patch: Partial<EcmProfileCookie["s1"]>) =>
    setField({ [sport]: { ...profile[sport], ...patch } } as Partial<EcmProfileCookie>);
  const toggleDay = (sport: "s1" | "s2", day: string) => {
    const jours = profile[sport].jours;
    const next = jours.includes(day) ? jours.filter((d) => d !== day) : [...jours, day];
    setSportField(sport, { jours: next });
  };
  const toggleMulti = (key: "rest" | "comp", value: string) => {
    const arr = profile[key];
    const next = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
    setField({ [key]: next } as Partial<EcmProfileCookie>);
  };
  const toggleObjectif = (value: string) => {
    const next = profile.obj.includes(value) ? profile.obj.filter((v) => v !== value) : [...profile.obj, value];
    setField({ obj: next });
  };
  const onObjectifExceed = () => {
    setObjError(true);
    setTimeout(() => setObjError(false), 1500);
  };

  async function handleSave() {
    setSaving(true);
    setError(null);
    const result = await updateEcmProfile(profile);
    if (!result.ok) {
      setSaving(false);
      setError(result.error);
      return;
    }
    router.push("/checkin");
  }

  if (loading) {
    return (
      <div className={styles.updateGate}>
        <div className={styles.logo}>
          EL <span>COACH</span>
        </div>
        <p style={{ color: "#8a8a8a" }}>Chargement de ton profil…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className={styles.updateGate}>
        <div className={styles.logo}>
          EL <span>COACH</span>
        </div>
        <h2 style={{ fontSize: "1.4rem", fontWeight: 600 }}>Pas encore de profil ECM sur ce compte.</h2>
        <p style={{ color: "#8a8a8a", fontSize: "0.9rem", maxWidth: 360 }}>
          Termine d&apos;abord ton inscription depuis <a href="/signup" style={{ color: "inherit" }}>/signup</a>.
        </p>
      </div>
    );
  }

  return (
    <div className={cx(styles.ecmRoot)} style={{ minHeight: "auto" }}>
      <div className={styles.right} style={{ maxWidth: 640, margin: "0 auto" }}>
        {error && (
          <div className="mb-4 border-l-2 border-red-400 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
        )}

        {/* Personnel */}
        <div className={styles.qc}>
          <div className={styles.ql}>
            <i>👤</i> Prénom &amp; Âge
          </div>
          <div className={styles.nr} style={{ gap: 8, marginBottom: 8 }}>
            <input
              className={styles.ecmInput}
              type="text"
              style={{ flex: 2 }}
              value={profile.prenom}
              onChange={(e) => setField({ prenom: e.target.value })}
            />
            <input
              className={cx(styles.ecmInput, styles.ecmNum)}
              type="number"
              style={{ flex: 1 }}
              value={profile.age}
              onChange={(e) => setField({ age: e.target.value })}
            />
            <span className={styles.nu}>ans</span>
          </div>
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>
            <i>📏</i> Morphologie
          </div>
          <div className={styles.nr} style={{ gap: 8 }}>
            <input
              className={cx(styles.ecmInput, styles.ecmNum)}
              type="number"
              style={{ flex: 1 }}
              value={profile.taille}
              onChange={(e) => setField({ taille: e.target.value })}
            />
            <span className={styles.nu}>cm</span>
            <input
              className={cx(styles.ecmInput, styles.ecmNum)}
              type="number"
              step={0.1}
              style={{ flex: 1 }}
              value={profile.poids}
              onChange={(e) => setField({ poids: e.target.value })}
            />
            <span className={styles.nu}>kg</span>
          </div>
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>
            <i>🎯</i> Objectifs <span className={styles.hint}>(2 maximum)</span>
          </div>
          <MoMultiCapped options={OBJECTIFS} values={profile.obj} max={2} onToggle={toggleObjectif} onExceed={onObjectifExceed} />
          {objError && <div style={{ marginTop: 6, fontSize: "0.8rem", color: "var(--error)" }}>2 objectifs maximum</div>}
        </div>

        {/* Sportif */}
        <SportBlock title="⚡ SPORT PRINCIPAL" sport={profile.s1} onField={(p) => setSportField("s1", p)} onDay={(d) => toggleDay("s1", d)} />
        {profile.s2on && (
          <SportBlock
            title="🥈 SPORT SECONDAIRE"
            sport={profile.s2}
            onField={(p) => setSportField("s2", p)}
            onDay={(d) => toggleDay("s2", d)}
            onRemove={() => setField({ s2on: false })}
          />
        )}
        {!profile.s2on && (
          <button className={styles.asb} type="button" onClick={() => setField({ s2on: true })}>
            + AJOUTER UN 2ÈME SPORT
          </button>
        )}
        <div className={styles.qc}>
          <div className={styles.ql}>
            <i>🏗️</i> Accès équipement
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {EQUIPEMENTS.map((o) => (
              <div
                key={o}
                className={cx(styles.mo, profile.equip === o && styles.sel)}
                onClick={() => setField({ equip: o })}
              >
                <div className={styles.mc}>{profile.equip === o ? "✓" : ""}</div>
                {o}
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition */}
        <div className={styles.qc}>
          <div className={styles.ql}>
            <i>⏱️</i> Jeûne intermittent ?
          </div>
          <YesNo value={profile.jeune} onChange={(v) => setField({ jeune: v })} />
          {profile.jeune && (
            <div style={{ marginTop: 10 }}>
              <div className={styles.dl}>Type de jeûne</div>
              <div className={styles.opts} style={{ marginBottom: 10 }}>
                {["16:8", "18:6", "20:4", "Autre"].map((o) => (
                  <button key={o} type="button" className={cx(styles.opt, profile.tj === o && styles.sel)} onClick={() => setField({ tj: o })}>
                    {o}
                  </button>
                ))}
              </div>
              <div className={styles.dl}>Fenêtre alimentaire</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className={styles.mi} type="text" placeholder="12h00" style={{ flex: 1 }} value={profile.df} onChange={(e) => setField({ df: e.target.value })} />
                <span style={{ fontFamily: "var(--font-bebas)", fontSize: "1.2rem", color: "var(--accent)" }}>→</span>
                <input className={styles.mi} type="text" placeholder="20h00" style={{ flex: 1 }} value={profile.ff} onChange={(e) => setField({ ff: e.target.value })} />
              </div>
            </div>
          )}
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>
            🚫 Restrictions / Allergies <span className={styles.hint}>(plusieurs choix)</span>
          </div>
          <MoMulti options={RESTRICTIONS} values={profile.rest} onToggle={(v) => toggleMulti("rest", v)} />
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>💧 Hydratation quotidienne</div>
          <div className={styles.opts}>
            {["Moins de 1.5L", "1.5 - 2L", "2 - 3L", "Plus de 3L"].map((o) => (
              <button key={o} type="button" className={cx(styles.opt, profile.hydra === o && styles.sel)} onClick={() => setField({ hydra: o })}>
                {o}
              </button>
            ))}
          </div>
        </div>

        {/* Santé & compléments */}
        <div className={styles.qc}>
          <div className={styles.ql}>🤕 Blessures chroniques ?</div>
          <YesNo value={profile.bles} onChange={(v) => setField({ bles: v })} />
          {profile.bles && (
            <div style={{ marginTop: 8 }}>
              <textarea className={styles.ecmTa} placeholder="Décris tes blessures..." value={profile.bt} onChange={(e) => setField({ bt: e.target.value })} />
            </div>
          )}
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>
            💊 Compléments alimentaires <span className={styles.hint}>(plusieurs choix)</span>
          </div>
          <MoMulti options={COMPLEMENTS} values={profile.comp} onToggle={(v) => toggleMulti("comp", v)} />
          <div style={{ marginTop: 8 }}>
            <div className={styles.dl}>➕ Autres</div>
            <input className={styles.ecmInput} type="text" value={profile.ca} onChange={(e) => setField({ ca: e.target.value })} />
          </div>
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>😴 Qualité de sommeil</div>
          <div className={styles.opts}>
            {["😴 Très bonne", "🌤 Correcte", "😓 Difficile", "😫 Très mauvaise"].map((o) => (
              <button key={o} type="button" className={cx(styles.opt, profile.qs === o && styles.sel)} onClick={() => setField({ qs: o })}>
                {o}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.qc}>
          <div className={styles.ql}>⏰ Durée de sommeil moyenne</div>
          <div className={styles.opts}>
            {["Moins de 6h", "6h - 7h", "7h - 8h", "Plus de 8h"].map((o) => (
              <button key={o} type="button" className={cx(styles.opt, profile.ds === o && styles.sel)} onClick={() => setField({ ds: o })}>
                {o}
              </button>
            ))}
          </div>
        </div>

        <button className={styles.btnNext} type="button" disabled={saving} onClick={handleSave} style={{ marginTop: 16 }}>
          {saving ? "Enregistrement…" : "Enregistrer mes modifications"}
        </button>
      </div>
    </div>
  );
}
