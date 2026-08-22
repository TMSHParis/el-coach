"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { submitCheckin, type CheckinGender, type SleepPhotoAnalysis } from "./actions";
import styles from "./checkin.module.css";

const cx = (...classes: (string | false | undefined)[]) => classes.filter(Boolean).join(" ");

const ENERGIE_LABELS = ["", "Très bas", "Bas", "Faible", "Moyen−", "Moyen", "Moyen+", "Bien", "Très bien", "Excellent", "⚡ Max"];
const MOTIV_LABELS = ["", "Nulle", "Très basse", "Basse", "Faible", "Moyenne", "Correcte", "Bonne", "Très bonne", "Excellente", "🔥 Max"];

const SEANCE_GROUPS: { label: string; options: string[] }[] = [
  { label: "🛋️ REPOS", options: ["🛋️ Repos complet", "🚶 Récupération active"] },
  {
    label: "⚡ PROGRAMMATIONS ECM",
    options: ["⚡ CrossFit Pure", "🔥 Hybrid Engine", "🏁 Hyrox Pure", "💪 Volume Block Hypertrophy", "🏠 At Home"],
  },
  {
    label: "🥊 SPORTS DE COMBAT",
    options: ["🥊 Boxe Thaï / Muay Thai", "🥋 MMA", "🥊 Boxe anglaise", "🥋 Jiu-Jitsu brésilien", "🥋 Judo / Lutte"],
  },
  { label: "🏃 CARDIO & ENDURANCE", options: ["🏃 Running", "🚴 Cyclisme", "🏊 Natation", "⛷️ Trail"] },
  { label: "⚽ SPORTS COLLECTIFS", options: ["⚽ Football", "🏀 Basketball", "🏈 Rugby", "🎾 Tennis / Padel"] },
  { label: "🧘 MOBILITÉ", options: ["🧘 Yoga / Pilates", "🤸 Calisthénie", "🧗 Escalade"] },
];

type FormState = {
  gender: CheckinGender;
  sleepPhotoPreview: string | null;
  sleepPhoto: boolean;
  sleepCoucher: string;
  sleepReveil: string;
  sleepDuree: string;
  sleepFc: string;
  sleepHrv: string;
  sleepRecup: string;
  sleepAnalysis: SleepPhotoAnalysis | null;
  sleepAnalyzing: boolean;
  poids: string;
  jambes: string;
  douleur: boolean | null;
  douleurTxt: string;
  cycle: boolean | null;
  cycleDouleur: string;
  cycleJour: string;
  energie: number | null;
  motivation: number | null;
  mental: string;
  stress: string;
  libido: string;
  seance: string;
  travail: boolean | null;
  soirPerformance: boolean | null;
  notes: string;
};

const INITIAL_STATE: FormState = {
  gender: "h",
  sleepPhotoPreview: null,
  sleepPhoto: false,
  sleepCoucher: "",
  sleepReveil: "",
  sleepDuree: "",
  sleepFc: "",
  sleepHrv: "",
  sleepRecup: "",
  sleepAnalysis: null,
  sleepAnalyzing: false,
  poids: "",
  jambes: "",
  douleur: null,
  douleurTxt: "",
  cycle: null,
  cycleDouleur: "",
  cycleJour: "",
  energie: null,
  motivation: null,
  mental: "",
  stress: "",
  libido: "",
  seance: "",
  travail: null,
  soirPerformance: null,
  notes: "",
};

const DATE_STR = new Date().toLocaleDateString("fr-FR", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function CheckinForm() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [d, setD] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const set = (patch: Partial<FormState>) => setD((prev) => ({ ...prev, ...patch }));
  const g = d.gender;
  const isH = g === "h";

  function handlePhoto(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = String(e.target?.result ?? "");
      set({ sleepPhoto: true, sleepPhotoPreview: dataUrl, sleepAnalyzing: true });

      const [, base64] = dataUrl.split(",");
      try {
        const res = await fetch("/api/analyze-sleep-photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64, mediaType: file.type }),
        });
        if (!res.ok) throw new Error(await res.text());
        const analysis = (await res.json()) as SleepPhotoAnalysis;
        set({
          sleepAnalysis: analysis,
          sleepAnalyzing: false,
          sleepCoucher: analysis.coucher ?? d.sleepCoucher,
          sleepReveil: analysis.reveil ?? d.sleepReveil,
          sleepDuree: analysis.total ?? d.sleepDuree,
        });
      } catch {
        // Analyse indisponible (clé absente, erreur réseau...) — la saisie manuelle reste possible.
        set({ sleepAnalyzing: false });
      }
    };
    reader.readAsDataURL(file);
  }

  function validate(): string[] {
    const miss: string[] = [];
    const sleepOk = d.sleepPhoto || d.sleepDuree || d.sleepCoucher;
    if (!sleepOk) miss.push("Sommeil");
    if (!d.jambes) miss.push("Jambes");
    if (d.douleur === null) miss.push("Douleur");
    if (!isH && d.cycle === null) miss.push("Cycle menstruel");
    if (!d.energie) miss.push("Énergie");
    if (!d.motivation) miss.push("Motivation");
    if (!d.mental) miss.push("Mental");
    if (!d.stress) miss.push("Stress");
    if (!d.libido) miss.push("Libido");
    if (!d.seance) miss.push("Séance");
    if (d.travail === null) miss.push("Travail");
    if (isH && d.soirPerformance === null) miss.push("Soir performance");
    return miss;
  }

  async function handleSubmit() {
    const miss = validate();
    setMissing(miss);
    if (miss.length) return;

    setSubmitting(true);
    const result = await submitCheckin({
      genre: g,
      sleepPhoto: d.sleepPhoto,
      sleepCoucher: d.sleepCoucher,
      sleepReveil: d.sleepReveil,
      sleepDuree: d.sleepDuree,
      sleepFc: d.sleepFc,
      sleepHrv: d.sleepHrv,
      sleepRecup: d.sleepRecup,
      sleepAnalysis: d.sleepAnalysis,
      poids: d.poids,
      jambes: d.jambes,
      douleur: d.douleur,
      douleurDetail: d.douleurTxt,
      cycle: isH ? null : d.cycle,
      cycleDouleur: isH ? "" : d.cycleDouleur,
      cycleJour: isH ? "" : d.cycleJour,
      energie: d.energie,
      motivation: d.motivation,
      mental: d.mental,
      stress: d.stress,
      libido: d.libido,
      seance: d.seance,
      travail: d.travail,
      soirPerformance: isH ? d.soirPerformance : null,
      notes: d.notes,
    });
    if (!result.ok) {
      setSubmitting(false);
      setMissing([result.error]);
      return;
    }
    router.push("/dashboard");
  }

  return (
    <div className={styles.checkinRoot}>
      {submitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner} />
          <div className={styles.loadingText}>Génération de ton plan...</div>
        </div>
      )}

      <div className={styles.hero}>
        <div className={styles.logo}>⚡</div>
        <div className={styles.bn}>EL COACH METHOD</div>
        <div className={styles.bt}>Daily Performance Check-In</div>
        <div className={styles.hdiv} />
        <div className={styles.dateRow}>
          <div className={styles.datePill}>{DATE_STR}</div>
          <div className={cx(styles.sportBadge, isH ? styles.h : styles.f)}>
            {isH ? "♂ HOMME — CHECK-IN" : "♀ FEMME — CHECK-IN"}
          </div>
        </div>
      </div>

      {missing.length > 0 && (
        <div className={styles.errorBanner}>
          {missing.length === 1 && missing[0].startsWith("Vérifie")
            ? missing[0]
            : `Complète les champs : ${missing.join(", ")}`}
        </div>
      )}

      <div className={styles.genderTabs}>
        <div
          className={cx(styles.gtab, isH && styles.activeH)}
          onClick={() => set({ gender: "h" })}
        >
          ♂ HOMME
          <div className={styles.gtabSub}>Version masculine</div>
        </div>
        <div
          className={cx(styles.gtab, !isH && styles.activeF)}
          onClick={() => set({ gender: "f" })}
        >
          ♀ FEMME
          <div className={styles.gtabSub}>Version féminine</div>
        </div>
      </div>

      <div className={styles.fw}>
        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>😴 Sommeil</div>
        <div className={cx(styles.qc, (d.sleepPhoto || d.sleepDuree) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>📱</i> Suivi sommeil <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <label className={cx(styles.photoZone, isH ? styles.ph : styles.pf)}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => handlePhoto(e.target.files?.[0])}
            />
            {d.sleepPhotoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img className={styles.prev} src={d.sleepPhotoPreview} alt="" />
            ) : (
              <>
                <div className={styles.pi}>📸</div>
                <div className={styles.pt}>
                  <strong className={isH ? styles.h : styles.f}>Capture de ta montre connectée</strong>
                  Apple Watch, Garmin, Polar, Whoop...
                </div>
              </>
            )}
          </label>
          {d.sleepAnalyzing && (
            <div className={cx(styles.pok, isH ? styles.h : styles.f)}>⏳ Analyse de la photo...</div>
          )}
          {d.sleepPhoto && !d.sleepAnalyzing && (
            <div className={cx(styles.pok, isH ? styles.h : styles.f)}>
              {d.sleepAnalysis ? "✅ Photo analysée — champs pré-remplis" : "✅ Photo sommeil ajoutée"}
            </div>
          )}
          <div className={styles.orSep}>ou saisie manuelle</div>
          <div className={styles.smw}>
            <div className={styles.smt}>Entre tes données manuellement</div>
            <div className={styles.smg}>
              <div className={styles.smi}>
                <label>🌙 Coucher</label>
                <input type="text" placeholder="23h00" value={d.sleepCoucher} onChange={(e) => set({ sleepCoucher: e.target.value })} />
              </div>
              <div className={styles.smi}>
                <label>☀️ Réveil</label>
                <input type="text" placeholder="07h00" value={d.sleepReveil} onChange={(e) => set({ sleepReveil: e.target.value })} />
              </div>
              <div className={styles.smi}>
                <label>⏱️ Durée</label>
                <input type="text" placeholder="7h30" value={d.sleepDuree} onChange={(e) => set({ sleepDuree: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className={cx(styles.qc, styles.opt)}>
          <div className={styles.ql}>
            <i>⌚</i> Données montre <span className={styles.bo}>Facultatif</span>
          </div>
          <div className={styles.wg}>
            <div className={styles.wi}>
              <label>❤️ FC repos</label>
              <input type="text" placeholder="58 bpm" value={d.sleepFc} onChange={(e) => set({ sleepFc: e.target.value })} />
            </div>
            <div className={styles.wi}>
              <label>📊 HRV</label>
              <input type="text" placeholder="45 ms" value={d.sleepHrv} onChange={(e) => set({ sleepHrv: e.target.value })} />
            </div>
            <div className={styles.wi}>
              <label>⏱️ Récup.</label>
              <input type="text" placeholder="18h" value={d.sleepRecup} onChange={(e) => set({ sleepRecup: e.target.value })} />
            </div>
          </div>
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>🌅 Corps au réveil</div>
        <div className={cx(styles.qc, styles.opt, d.poids && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>⚖️</i> Poids ce matin <span className={styles.bo}>Facultatif</span>
          </div>
          <div className={styles.nr}>
            <input
              type="number"
              className={styles.ni}
              placeholder="—"
              min={30}
              max={200}
              step={0.1}
              value={d.poids}
              onChange={(e) => set({ poids: e.target.value })}
            />
            <span className={styles.nu}>kg</span>
          </div>
        </div>

        <div className={cx(styles.qc, d.jambes && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🦵</i> État des jambes <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["🪶 Légères", "⚡ Légèrement lourdes", "🪨 Lourdes"]} value={d.jambes} onChange={(v) => set({ jambes: v })} />
        </div>

        <div className={cx(styles.qc, d.douleur !== null && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🤕</i> Douleur physique <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <YesNo gender={g} value={d.douleur} onChange={(v) => set({ douleur: v })} />
          {d.douleur && (
            <div style={{ marginTop: 9 }}>
              <input type="text" placeholder="Décris la douleur..." value={d.douleurTxt} onChange={(e) => set({ douleurTxt: e.target.value })} />
            </div>
          )}
        </div>

        {!isH && (
          <div className={cx(styles.qc, d.cycle !== null && styles.onF)} style={{ borderColor: "rgba(236,72,153,.2)" }}>
            <div className={styles.ql}>
              <i>🌸</i> Cycle menstruel en cours <span className={styles.bf}>Requis</span>
            </div>
            <YesNo gender={g} value={d.cycle} onChange={(v) => set({ cycle: v })} />
            {d.cycle && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 12, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>
                  💊 Douleurs menstruelles
                </div>
                <div className={styles.opts} style={{ marginBottom: 10 }}>
                  <OptRow
                    gender={g}
                    options={["✅ Aucune", "🟡 Légères", "🔴 Intenses"]}
                    value={d.cycleDouleur}
                    onChange={(v) => set({ cycleDouleur: v })}
                  />
                </div>
                <div style={{ fontSize: 12, color: "var(--m)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 7 }}>
                  📅 Jour du cycle
                </div>
                <div className={styles.nr}>
                  <input
                    type="number"
                    className={styles.ni}
                    placeholder="—"
                    min={1}
                    max={35}
                    style={{ maxWidth: 80 }}
                    value={d.cycleJour}
                    onChange={(e) => set({ cycleJour: e.target.value })}
                  />
                  <span className={styles.nu}>/ ~28 jours</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>⚡ Vitalité</div>
        <div className={cx(styles.qc, Boolean(d.energie) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🔋</i> Énergie <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <div className={styles.sr}>
            <div className={cx(styles.sv, isH ? styles.h : styles.f)}>{d.energie ?? "—"}</div>
            <div className={styles.slr}>
              <span>{d.energie ? ENERGIE_LABELS[d.energie] : "Appuie sur une barre"}</span>/10
            </div>
          </div>
          <Track height={36} value={d.energie} onPick={(v) => set({ energie: v })} fillClass={isH ? styles.fh : styles.ff} />
        </div>

        <div className={cx(styles.qc, Boolean(d.motivation) && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💥</i> Motivation <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <div className={styles.sr}>
            <div className={cx(styles.sv, styles.motiv)}>{d.motivation ?? "—"}</div>
            <div className={styles.slr}>
              <span>{d.motivation ? MOTIV_LABELS[d.motivation] : "Appuie sur une barre"}</span>/10
            </div>
          </div>
          <Track height={26} value={d.motivation} onPick={(v) => set({ motivation: v })} fillClass={styles.fm} />
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>🧠 Mental &amp; Bien-être</div>
        <div className={cx(styles.qc, d.mental && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🧠</i> État mental <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["✨ Clair", "🌤 Moyen", "🌫 Brouillard"]} value={d.mental} onChange={(v) => set({ mental: v })} />
        </div>

        <div className={cx(styles.qc, d.stress && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>😤</i> Stress <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["😌 Faible", "😐 Modéré", "😰 Élevé"]} value={d.stress} onChange={(v) => set({ stress: v })} />
        </div>

        <div className={cx(styles.qc, d.libido && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>❤️</i> Libido <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <OptRow gender={g} options={["🔥 Bonne", "💛 Moyenne", "🩶 Basse"]} value={d.libido} onChange={(v) => set({ libido: v })} />
        </div>

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>📅 Planning du jour</div>
        <div className={cx(styles.qc, d.seance && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>🏋️</i> Séance du jour <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <select className={styles.ss} value={d.seance} onChange={(e) => set({ seance: e.target.value })}>
            <option value="" disabled>
              Choisir ta séance...
            </option>
            {SEANCE_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className={cx(styles.qc, d.travail !== null && (isH ? styles.onH : styles.onF))}>
          <div className={styles.ql}>
            <i>💼</i> Journée de travail <span className={isH ? styles.bh : styles.bf}>Requis</span>
          </div>
          <YesNo gender={g} value={d.travail} onChange={(v) => set({ travail: v })} />
        </div>

        {isH && (
          <div className={cx(styles.qc, d.soirPerformance !== null && styles.onH)}>
            <div className={styles.ql}>
              <i>🌙</i> Soir performance <span className={styles.bh}>Requis</span>
            </div>
            <YesNo gender={g} value={d.soirPerformance} onChange={(v) => set({ soirPerformance: v })} />
          </div>
        )}

        <div className={cx(styles.sl, isH ? styles.blue : styles.pink)}>📝 Notes</div>
        <div className={cx(styles.qc, styles.opt)}>
          <div className={styles.ql}>
            <i>📝</i> Observations <span className={styles.bo}>Facultatif</span>
          </div>
          <input type="text" placeholder="Ressenti particulier, événement..." value={d.notes} onChange={(e) => set({ notes: e.target.value })} />
        </div>

        <button className={styles.sub} disabled={submitting} onClick={handleSubmit}>
          ⚡ VALIDER MON CHECK-IN
        </button>
      </div>
    </div>
  );
}

function OptRow({
  gender,
  options,
  value,
  onChange,
}: {
  gender: CheckinGender;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className={styles.opts}>
      {options.map((o) => (
        <div
          key={o}
          className={cx(styles.optBtn, value === o && (gender === "h" ? styles.selH : styles.selF))}
          onClick={() => onChange(o)}
        >
          {o}
        </div>
      ))}
    </div>
  );
}

function YesNo({
  gender,
  value,
  onChange,
}: {
  gender: CheckinGender;
  value: boolean | null;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className={styles.yn}>
      <div
        className={cx(styles.ynb, styles.y, value === true && (gender === "h" ? styles.selH : styles.selF))}
        onClick={() => onChange(true)}
      >
        ✓ OUI
      </div>
      <div
        className={cx(styles.ynb, styles.n, value === false && (gender === "h" ? styles.selH : styles.selF))}
        onClick={() => onChange(false)}
      >
        ✗ NON
      </div>
    </div>
  );
}

function Track({
  height,
  value,
  onPick,
  fillClass,
}: {
  height: 36 | 26;
  value: number | null;
  onPick: (v: number) => void;
  fillClass: string;
}) {
  return (
    <div className={styles.track} style={{ height }}>
      {Array.from({ length: 10 }, (_, i) => i + 1).map((i) => (
        <div
          key={i}
          className={cx(styles.bar, value !== null && i <= value && fillClass)}
          style={{ height: height === 36 ? 10 + i * 4 : 7 + i * 3 }}
          onClick={() => onPick(i)}
        />
      ))}
    </div>
  );
}
