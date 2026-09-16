"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { programTemplates } from "@/lib/programming";
import { validatePassword } from "@/app/signup/ecm-shared";
import {
  updateRecordsRm,
  updateProgramme,
  updateNotifPrefs,
  updateLangue,
  deleteAccount,
  type RecordsRm,
} from "./actions";
import styles from "./settings.module.css";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type SettingsProfile = {
  prenom: string;
  programme: string;
  recordsRm: Record<string, string>;
  notifCheckinOn: boolean;
  notifCheckinTime: string;
  notifSeance: boolean;
  notifBlessure: boolean;
  notifRecap: boolean;
  langue: string;
};

const LANGUES = [
  { code: "fr", flag: "🇫🇷", name: "Français" },
  { code: "en", flag: "🇬🇧", name: "English" },
  { code: "es", flag: "🇪🇸", name: "Español" },
];

export function SettingsView({
  profile,
  priceLabel,
  stripeEnabled,
}: {
  profile: SettingsProfile;
  priceLabel: string;
  stripeEnabled: boolean;
}) {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [modal, setModal] = useState<string | null>(null);

  const [records, setRecords] = useState<RecordsRm>(profile.recordsRm);
  const [programme, setProgramme] = useState(profile.programme);
  const [notifCheckinOn, setNotifCheckinOn] = useState(profile.notifCheckinOn);
  const [notifCheckinTime, setNotifCheckinTime] = useState(profile.notifCheckinTime);
  const [notifSeance, setNotifSeance] = useState(profile.notifSeance);
  const [notifBlessure, setNotifBlessure] = useState(profile.notifBlessure);
  const [notifRecap, setNotifRecap] = useState(profile.notifRecap);
  const [langue, setLangue] = useState(profile.langue);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (profile.prenom || "?").charAt(0).toUpperCase();

  async function handleSaveRecords() {
    setBusy(true);
    const res = await updateRecordsRm(records);
    setBusy(false);
    if (res.ok) {
      flash("Records mis à jour");
      setModal(null);
    }
  }

  async function handleSaveProgramme(slug: string) {
    setBusy(true);
    const res = await updateProgramme(slug);
    setBusy(false);
    if (res.ok) {
      setProgramme(res.name);
      flash("Programme mis à jour");
      setModal(null);
    }
  }

  async function handleSaveNotifs() {
    setBusy(true);
    await updateNotifPrefs({ notifCheckinOn, notifCheckinTime, notifSeance, notifBlessure, notifRecap });
    setBusy(false);
    flash("Préférences enregistrées");
  }

  async function handleSelectLangue(code: string) {
    setLangue(code);
    await updateLangue(code);
    setTimeout(() => setModal(null), 250);
  }

  async function handleLogout() {
    if (!confirm("Se déconnecter ?")) return;
    await signOut();
    router.push("/");
  }

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <button className={styles.backBtn} onClick={() => router.push("/dashboard")}>←</button>
        <div className={styles.pageTitle}>Réglages</div>
      </div>

      <div className={styles.profileHero}>
        <div className={styles.avatar}>{initial}</div>
        <div>
          <div className={styles.profileName}>{profile.prenom}</div>
          <div className={styles.profileEmail}>{email}</div>
          <div className={styles.profileBadge}>⚡ Coaching Adaptatif · Actif</div>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {/* MON PROFIL */}
      <div className={styles.sectionLabel}>Mon profil</div>
      <div className={styles.group}>
        <Row icon="👤" title="Modifier mon profil athlète" sub="Programme · Niveau · Objectifs · Compléments · Blessures" onClick={() => router.push("/profile/edit")} />
        <Row icon="🏆" title="Mes records personnels (RM)" sub="Back Squat · Deadlift · Bench Press · Clean..." onClick={() => setModal("records")} />
        <Row icon="⚡" title="Changer de programme" sub={programme} onClick={() => setModal("programme")} />
      </div>

      {/* COMPTE & SÉCURITÉ */}
      <div className={styles.sectionLabel}>Compte &amp; Sécurité</div>
      <div className={styles.group}>
        <Row icon="📧" title="Modifier l'email" sub={email} onClick={() => setModal("email")} />
        <Row icon="🔑" title="Modifier le mot de passe" sub="15 caractères min · 1 chiffre · 1 symbole" onClick={() => setModal("password")} />
        <Row icon="🚪" title="Déconnexion" sub="Retour à la page d'accueil" onClick={handleLogout} />
      </div>

      {/* ABONNEMENT */}
      <div className={styles.sectionLabel}>Abonnement</div>
      <div className={styles.subCard}>
        <div className={styles.subName}>COACHING ADAPTATIF</div>
        <div className={styles.subPrice}>{priceLabel}</div>
        <div className={styles.subRenew}>
          {stripeEnabled ? "Prochain renouvellement : —" : "Paiement pas encore configuré — Free Trial active."}
        </div>
      </div>

      {/* NOTIFICATIONS */}
      <div className={styles.sectionLabel}>Notifications</div>
      <div className={styles.group}>
        <Row
          icon="☀️"
          title="Rappel check-in du matin"
          sub={notifCheckinTime}
          right={<Toggle on={notifCheckinOn} onChange={(v) => { setNotifCheckinOn(v); handleSaveNotifs(); }} />}
        />
        <Row icon="⏰" title="Heure du rappel check-in" sub="Modifier l'heure de notification" value={notifCheckinTime} onClick={() => setModal("notif-time")} />
        <Row icon="🏋️" title="Rappel séance du jour" sub="Notification 30 min avant la séance prévue" right={<Toggle on={notifSeance} onChange={(v) => { setNotifSeance(v); handleSaveNotifs(); }} />} />
        <Row icon="🔴" title="Alertes blessures" sub="Notification si blessure persistante > 5 jours" right={<Toggle on={notifBlessure} onChange={(v) => { setNotifBlessure(v); handleSaveNotifs(); }} />} />
        <Row icon="📊" title="Récapitulatif de la semaine" sub="Chaque dimanche soir · résumé performances" right={<Toggle on={notifRecap} onChange={(v) => { setNotifRecap(v); handleSaveNotifs(); }} />} />
      </div>

      {/* DONNÉES */}
      <div className={styles.sectionLabel}>Données &amp; Historique</div>
      <div className={styles.group}>
        <Row icon="📅" title="Historique des check-ins" sub="Voir tous mes check-ins passés" onClick={() => router.push("/history/checkins")} />
        <Row icon="🏋️" title="Historique des séances" sub="Durées · performances · blocs complétés" onClick={() => router.push("/history/sessions")} />
        <Row icon="📈" title="Ma progression" sub="Poids · Score ECM · streaks" onClick={() => router.push("/progress")} />
        <Row icon="📤" title="Exporter mes données" sub="Télécharger toutes mes données en JSON" onClick={() => window.open("/api/export-data", "_blank")} />
      </div>

      {/* APPARENCE */}
      <div className={styles.sectionLabel}>Apparence</div>
      <div className={styles.group}>
        <Row icon="🌍" title="Langue" sub="Français · English · Español" value={LANGUES.find((l) => l.code === langue)?.flag + " " + langue.toUpperCase()} onClick={() => setModal("langue")} />
        <Row icon="🎨" title="Thème" sub="Noir · ECM Standard" badge="Bientôt" />
      </div>

      {/* DANGER */}
      <div className={styles.sectionLabel}>Zone de danger</div>
      <div className={styles.group}>
        <Row icon="🗑️" title="Supprimer mon compte" sub="Action irréversible · toutes les données supprimées" danger onClick={() => setModal("delete")} />
      </div>

      <div className={styles.versionFooter}>EL COACH METHOD<br />by El Coach · 2026</div>

      {/* MODALS */}
      {modal === "records" && (
        <Modal title="Records personnels" onClose={() => setModal(null)}>
          <p className={styles.modalInfo}>Tes RM servent de base pour les charges prescrites par le Coaching Adaptatif.</p>
          {([
            ["squat", "Back Squat 1RM (kg)"],
            ["deadlift", "Deadlift 1RM (kg)"],
            ["bench", "Bench Press 1RM (kg)"],
            ["cleanJerk", "Clean & Jerk 1RM (kg)"],
            ["snatch", "Snatch 1RM (kg)"],
            ["ohp", "Overhead Press 1RM (kg)"],
          ] as const).map(([key, label]) => (
            <div className={styles.field} key={key}>
              <label>{label}</label>
              <input
                type="number"
                value={records[key] ?? ""}
                onChange={(e) => setRecords((r) => ({ ...r, [key]: e.target.value }))}
              />
            </div>
          ))}
          <button className={styles.btnGold} disabled={busy} onClick={handleSaveRecords}>Sauvegarder mes records</button>
        </Modal>
      )}

      {modal === "programme" && (
        <Modal title="Changer de programme" onClose={() => setModal(null)}>
          <p className={styles.modalInfo}>Le changement prend effet dès ton prochain check-in.</p>
          {programTemplates.map((t) => (
            <div key={t.slug} className={styles.langOpt} onClick={() => handleSaveProgramme(t.slug)}>
              <span className={styles.langName}>{t.name}</span>
              {programme === t.name && <div className={styles.langCheck}>✓</div>}
            </div>
          ))}
        </Modal>
      )}

      {modal === "email" && <EmailModal currentEmail={email} onClose={() => setModal(null)} onDone={() => flash("Email mis à jour")} />}
      {modal === "password" && <PasswordModal onClose={() => setModal(null)} onDone={() => flash("Mot de passe mis à jour")} />}

      {modal === "notif-time" && (
        <Modal title="Heure du rappel check-in" onClose={() => setModal(null)}>
          <div className={styles.field}>
            <label>Heure de notification</label>
            <input type="time" value={notifCheckinTime} onChange={(e) => setNotifCheckinTime(e.target.value)} />
          </div>
          <button
            className={styles.btnGold}
            onClick={async () => {
              await handleSaveNotifs();
              setModal(null);
            }}
          >
            Sauvegarder
          </button>
        </Modal>
      )}

      {modal === "langue" && (
        <Modal title="Langue" onClose={() => setModal(null)}>
          {LANGUES.map((l) => (
            <div key={l.code} className={styles.langOpt} onClick={() => handleSelectLangue(l.code)}>
              <span style={{ fontSize: 20 }}>{l.flag}</span>
              <span className={styles.langName}>{l.name}</span>
              {langue === l.code && <div className={styles.langCheck}>✓</div>}
            </div>
          ))}
        </Modal>
      )}

      {modal === "delete" && (
        <DeleteModal
          onClose={() => setModal(null)}
          onDeleted={async () => {
            await signOut();
            router.push("/");
          }}
        />
      )}
    </div>
  );
}

function Row({
  icon,
  title,
  sub,
  value,
  badge,
  danger,
  right,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  value?: string;
  badge?: string;
  danger?: boolean;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div className={styles.row} onClick={onClick} style={{ cursor: onClick ? "pointer" : "default" }}>
      <div className={styles.rowIcon}>{icon}</div>
      <div className={styles.rowBody}>
        <div className={cx(styles.rowTitle, danger && styles.danger)}>{title}</div>
        <div className={styles.rowSub}>{sub}</div>
      </div>
      <div className={styles.rowRight}>
        {value && <span className={styles.rowValue}>{value}</span>}
        {badge && <span className={styles.rowBadge}>{badge}</span>}
        {right}
        {!right && !badge && onClick && <span className={styles.rowArrow}>›</span>}
      </div>
    </div>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className={cx(styles.toggle, on && styles.on)}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
    >
      <div className={styles.toggleDot} />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHandle} />
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalContent}>
          {children}
          <button className={styles.btnGhost} onClick={onClose} style={{ marginTop: 8 }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ currentEmail, onClose, onDone }: { currentEmail: string; onClose: () => void; onDone: () => void }) {
  const { user } = useUser();
  const [step, setStep] = useState<"input" | "code">("input");
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [emailId, setEmailId] = useState<string | null>(null);

  async function handleSend() {
    if (!user || !newEmail.includes("@")) return;
    setBusy(true);
    setError(null);
    try {
      const emailResource = await user.createEmailAddress({ email: newEmail });
      setEmailId(emailResource.id);
      await emailResource.prepareVerification({ strategy: "email_code" });
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'envoyer le code.");
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!user || !emailId) return;
    setBusy(true);
    setError(null);
    try {
      const emailResource = user.emailAddresses.find((e) => e.id === emailId);
      if (!emailResource) throw new Error("Adresse introuvable.");
      await emailResource.attemptVerification({ code });
      await user.update({ primaryEmailAddressId: emailId });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Code invalide.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Modifier l'email" onClose={onClose}>
      {step === "input" ? (
        <>
          <div className={styles.field}>
            <label>Email actuel</label>
            <input type="email" value={currentEmail} disabled />
          </div>
          <div className={styles.field}>
            <label>Nouvel email</label>
            <input type="email" placeholder="nouvel@email.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          {error && <div className={styles.errorText}>{error}</div>}
          <button className={styles.btnGold} disabled={busy} onClick={handleSend}>
            {busy ? "Envoi…" : "Envoyer le code de vérification"}
          </button>
        </>
      ) : (
        <>
          <p className={styles.modalInfo}>Code envoyé à {newEmail}.</p>
          <div className={styles.field}>
            <label>Code reçu</label>
            <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>
          {error && <div className={styles.errorText}>{error}</div>}
          <button className={styles.btnGold} disabled={busy || code.length < 6} onClick={handleVerify}>
            {busy ? "Vérification…" : "Confirmer le nouvel email"}
          </button>
        </>
      )}
    </Modal>
  );
}

function PasswordModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { user } = useUser();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    if (!user) return;
    const pwErr = validatePassword(next);
    if (pwErr) {
      setError(pwErr);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await user.updatePassword({ currentPassword: current, newPassword: next });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de changer le mot de passe.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Modifier le mot de passe" onClose={onClose}>
      <div className={styles.field}>
        <label>Mot de passe actuel</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label>Nouveau mot de passe</label>
        <input type="password" placeholder="15 car. min · 1 chiffre · 1 symbole" value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
      <button className={styles.btnGold} disabled={busy} onClick={handleSave}>
        {busy ? "Mise à jour…" : "Changer le mot de passe"}
      </button>
    </Modal>
  );
}

function DeleteModal({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (text !== "SUPPRIMER") {
      setError('Tape "SUPPRIMER" pour confirmer');
      return;
    }
    setBusy(true);
    const res = await deleteAccount();
    setBusy(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await onDeleted();
  }

  return (
    <Modal title="Supprimer le compte" onClose={onClose}>
      <p className={cx(styles.modalInfo, styles.modalInfoDanger)}>
        Action irréversible. Toutes tes données seront supprimées définitivement : profil · check-ins · historique.
      </p>
      <div className={styles.field}>
        <label>Confirme en tapant &quot;SUPPRIMER&quot;</label>
        <input type="text" placeholder="SUPPRIMER" value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
      <button className={styles.btnRed} disabled={busy} onClick={handleDelete}>
        {busy ? "Suppression…" : "Supprimer définitivement mon compte"}
      </button>
    </Modal>
  );
}
