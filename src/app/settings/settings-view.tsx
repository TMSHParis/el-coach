"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { SPORT_LABEL_TO_SLUG } from "@/lib/ecm-programs";
import { validatePassword } from "@/app/signup/ecm-shared";
import {
  updateRecordsRm,
  updateProgrammes,
  updateNotifPrefs,
  updateLangue,
  updateTheme,
  deleteAccount,
  type RecordsRm,
} from "./actions";
import { useLang, useT } from "@/lib/i18n/provider";
import { LANGS, LANG_META, isLang, type Lang } from "@/lib/i18n/lang";
import { applyTheme, isTheme, type Theme } from "@/lib/theme";
import { deviceTimezone, enablePush } from "@/lib/push-client";
import styles from "./settings.module.css";
import { BackHomeButton } from "@/components/back-home-button";

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

type SettingsProfile = {
  prenom: string;
  /** Programmes actifs simultanés (libellés ECM). */
  programmes: string[];
  recordsRm: Record<string, string>;
  notifCheckinOn: boolean;
  notifCheckinTime: string;
  notifSeance: boolean;
  notifBlessure: boolean;
  notifRecap: boolean;
  langue: string;
  theme: string;
  timezone: string | null;
};

export function SettingsView({
  profile,
  priceLabel,
  stripeEnabled,
  isAdmin,
}: {
  profile: SettingsProfile;
  priceLabel: string;
  stripeEnabled: boolean;
  /** Compte admin : accès illimité, aucun abonnement à afficher. */
  isAdmin: boolean;
}) {
  const router = useRouter();
  const t = useT();
  const { lang, setLang } = useLang();
  const { user } = useUser();
  const { signOut } = useClerk();
  const [modal, setModal] = useState<string | null>(null);

  const [records, setRecords] = useState<RecordsRm>(profile.recordsRm);
  const [programmes, setProgrammes] = useState<string[]>(profile.programmes);
  const [notifCheckinOn, setNotifCheckinOn] = useState(profile.notifCheckinOn);
  const [notifCheckinTime, setNotifCheckinTime] = useState(profile.notifCheckinTime);
  const [notifSeance, setNotifSeance] = useState(profile.notifSeance);
  const [notifBlessure, setNotifBlessure] = useState(profile.notifBlessure);
  const [notifRecap, setNotifRecap] = useState(profile.notifRecap);
  const [theme, setTheme] = useState<Theme>(isTheme(profile.theme) ? profile.theme : "dark");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  function flash(msg: string, ms = 2500) {
    setToast(msg);
    setTimeout(() => setToast(null), ms);
  }

  // Ce profil est la référence (réglages enregistrés dans le profil, valables sur tous les appareils) :
  // cet appareil s'aligne dessus, et le fuseau de l'appareil est mémorisé pour les heures de notification.
  useEffect(() => {
    if (isLang(profile.langue) && profile.langue !== lang) setLang(profile.langue);
    if (isTheme(profile.theme)) applyTheme(profile.theme);
    const tz = deviceTimezone();
    if (tz && tz !== profile.timezone) void updateNotifPrefs({ notifCheckinOn: profile.notifCheckinOn, notifCheckinTime: profile.notifCheckinTime, notifSeance: profile.notifSeance, notifBlessure: profile.notifBlessure, notifRecap: profile.notifRecap }, tz);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const email = user?.primaryEmailAddress?.emailAddress ?? "";
  const initial = (profile.prenom || "?").charAt(0).toUpperCase();

  async function handleSaveRecords() {
    setBusy(true);
    const res = await updateRecordsRm(records);
    setBusy(false);
    if (res.ok) {
      flash(t("st.records.saved"));
      setModal(null);
    }
  }

  /** Un clic ajoute ou retire le programme — au moins un doit rester actif. */
  async function handleToggleProgramme(name: string) {
    const next = programmes.includes(name)
      ? programmes.filter((p) => p !== name)
      : [...programmes, name];
    if (next.length === 0) {
      flash(t("st.programme.keepOne"));
      return;
    }
    setProgrammes(next);
    setBusy(true);
    const res = await updateProgrammes(next);
    setBusy(false);
    if (res.ok) flash(t("st.programme.saved"));
    else setProgrammes(programmes);
  }

  type Prefs = { notifCheckinOn: boolean; notifCheckinTime: string; notifSeance: boolean; notifBlessure: boolean; notifRecap: boolean };
  const prefs: Prefs = { notifCheckinOn, notifCheckinTime, notifSeance, notifBlessure, notifRecap };

  function applyPrefs(next: Prefs) {
    setNotifCheckinOn(next.notifCheckinOn);
    setNotifCheckinTime(next.notifCheckinTime);
    setNotifSeance(next.notifSeance);
    setNotifBlessure(next.notifBlessure);
    setNotifRecap(next.notifRecap);
  }

  /**
   * Un interrupteur : désactiver arrête l'envoi tout de suite ; activer demande l'autorisation du navigateur
   * (et explique le cas iPhone). Refus ou blocage : l'interrupteur reste sur désactivé avec un message.
   */
  async function handleToggle(key: "notifCheckinOn" | "notifSeance" | "notifBlessure" | "notifRecap", value: boolean) {
    const previous = prefs;
    if (value) {
      const res = await enablePush();
      if (!res.ok) {
        flash(
          res.reason === "ios-install"
            ? `${t("st.notif.iosInstall")}. ${t("st.notif.iosInstall.how")}`
            : res.reason === "denied"
              ? t("st.notif.denied")
              : res.reason === "unsupported"
                ? t("st.notif.unsupported")
                : t("st.notif.error"),
          6500,
        );
        applyPrefs(previous);
        return;
      }
    }
    const next = { ...previous, [key]: value };
    applyPrefs(next);
    const res = await updateNotifPrefs(next, deviceTimezone());
    if (res.ok) flash(t("st.notif.saved"));
    else {
      applyPrefs(previous);
      flash(t("st.notif.error"));
    }
  }

  async function handleSaveTime(time: string) {
    const previous = prefs;
    const next = { ...previous, notifCheckinTime: time };
    applyPrefs(next);
    setBusy(true);
    const res = await updateNotifPrefs(next, deviceTimezone());
    setBusy(false);
    if (res.ok) flash(`${t("st.notif.saved")} · ${t("st.notif.checkinTime.note")}`);
    else {
      applyPrefs(previous);
      flash(t("st.notif.error"));
    }
  }

  /** Langue : s'applique tout de suite (contexte client + rafraîchissement des pages serveur), puis enregistrée dans le profil. */
  async function handleSelectLangue(code: Lang) {
    setLang(code);
    router.refresh();
    await updateLangue(code);
    setTimeout(() => setModal(null), 250);
  }

  async function handleSelectTheme(next: Theme) {
    setTheme(next);
    applyTheme(next);
    await updateTheme(next);
    setTimeout(() => setModal(null), 250);
  }

  async function handleLogout() {
    if (!confirm(t("st.logout.confirm"))) return;
    await signOut();
    router.push("/");
  }

  return (
    <div className={styles.root}>
      <div className={styles.topbar}>
        <BackHomeButton />
        <div className={styles.pageTitle}>{t("st.title")}</div>
      </div>

      <div className={styles.profileHero}>
        {user?.hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={user.imageUrl} alt={profile.prenom} className={styles.avatarImg} />
        ) : (
          <div className={styles.avatar}>{initial}</div>
        )}
        <div>
          <div className={styles.profileName}>{profile.prenom}</div>
          <div className={styles.profileEmail}>{email}</div>
          <div className={cx(styles.profileBadge, isAdmin && styles.profileBadgeAdmin)}>
            {isAdmin ? t("st.badge.admin") : t("st.badge.active")}
          </div>
        </div>
      </div>

      {toast && <div className={styles.toast}>{toast}</div>}

      {/* MON PROFIL */}
      <div className={styles.sectionLabel}>{t("st.profile")}</div>
      <div className={styles.group}>
        <Row icon="👤" title={t("st.editProfile")} sub={t("st.editProfile.sub")} onClick={() => router.push("/profile/edit")} />
        <Row icon="🏆" title={t("st.records")} sub={t("st.records.sub")} onClick={() => setModal("records")} />
        <Row
          icon="⚡"
          title={t("st.programme")}
          sub={programmes.join(" · ") || t("st.programme.none")}
          onClick={() => setModal("programme")}
        />
      </div>

      {/* COMPTE & SÉCURITÉ */}
      <div className={styles.sectionLabel}>{t("st.account")}</div>
      <div className={styles.group}>
        <Row icon="📧" title={t("st.email")} sub={email} onClick={() => setModal("email")} />
        <Row icon="🔑" title={t("st.password")} sub={t("st.password.sub")} onClick={() => setModal("password")} />
        <Row icon="🚪" title={t("st.logout")} sub={t("st.logout.sub")} onClick={handleLogout} />
      </div>

      {/* ABONNEMENT — masqué pour un compte admin, qui n'en a pas. */}
      <div className={styles.sectionLabel}>{isAdmin ? t("st.access") : t("st.subscription")}</div>
      {isAdmin ? (
        <div className={cx(styles.subCard, styles.adminCard)}>
          <div className={styles.subName}>{t("st.admin.card")}</div>
          <div className={styles.subPrice}>{t("st.admin.unlimited")}</div>
          <div className={styles.subRenew}>{t("st.admin.all")}</div>
        </div>
      ) : (
        <div className={styles.subCard}>
          <div className={styles.subName}>{t("st.sub.name")}</div>
          <div className={styles.subPrice}>{priceLabel}</div>
          <div className={styles.subRenew}>
            {stripeEnabled ? t("st.sub.renew") : t("st.sub.free")}
          </div>
        </div>
      )}

      {/* NOTIFICATIONS */}
      <div className={styles.sectionLabel}>{t("st.notifs")}</div>
      <div className={styles.group}>
        <Row
          icon="☀️"
          title={t("st.notif.checkin")}
          sub={notifCheckinTime}
          right={<Toggle on={notifCheckinOn} label={t("st.notif.checkin")} onChange={(v) => handleToggle("notifCheckinOn", v)} />}
        />
        <Row
          icon="⏰"
          title={t("st.notif.checkinTime")}
          sub={t("st.notif.checkinTime.sub")}
          value={notifCheckinTime}
          disabled={!notifCheckinOn}
          onClick={notifCheckinOn ? () => setModal("notif-time") : undefined}
        />
        <Row icon="🏋️" title={t("st.notif.seance")} sub={t("st.notif.seance.sub")} right={<Toggle on={notifSeance} label={t("st.notif.seance")} onChange={(v) => handleToggle("notifSeance", v)} />} />
        <Row icon="🔴" title={t("st.notif.blessure")} sub={t("st.notif.blessure.sub")} right={<Toggle on={notifBlessure} label={t("st.notif.blessure")} onChange={(v) => handleToggle("notifBlessure", v)} />} />
        <Row icon="📊" title={t("st.notif.recap")} sub={t("st.notif.recap.sub")} right={<Toggle on={notifRecap} label={t("st.notif.recap")} onChange={(v) => handleToggle("notifRecap", v)} />} />
      </div>

      {/* DONNÉES */}
      <div className={styles.sectionLabel}>{t("st.data")}</div>
      <div className={styles.group}>
        <Row icon="📅" title={t("st.history.checkins")} sub={t("st.history.checkins.sub")} onClick={() => router.push("/history/checkins")} />
        <Row icon="🏋️" title={t("st.history.sessions")} sub={t("st.history.sessions.sub")} onClick={() => router.push("/history/sessions")} />
        <Row icon="📈" title={t("st.progress")} sub={t("st.progress.sub")} onClick={() => router.push("/progress")} />
        <Row icon="📤" title={t("st.export")} sub={t("st.export.sub")} onClick={() => window.open("/api/export-data", "_blank")} />
      </div>

      {/* APPARENCE */}
      <div className={styles.sectionLabel}>{t("st.appearance")}</div>
      <div className={styles.group}>
        <Row icon="🌍" title={t("st.language")} sub={t("st.language.sub")} value={`${LANG_META[lang].flag} ${LANG_META[lang].code}`} onClick={() => setModal("langue")} />
        <Row icon="🎨" title={t("st.theme")} sub={t("st.theme.sub")} value={theme === "light" ? t("st.theme.light") : t("st.theme.dark")} onClick={() => setModal("theme")} />
      </div>

      {/* DANGER */}
      <div className={styles.sectionLabel}>{t("st.danger")}</div>
      <div className={styles.group}>
        <Row icon="🗑️" title={t("st.delete")} sub={t("st.delete.sub")} danger onClick={() => setModal("delete")} />
      </div>

      <div className={styles.versionFooter}>{t("st.footer")}<br />{t("st.footer.by")}</div>

      {/* MODALS */}
      {modal === "records" && (
        <Modal title={t("st.records.title")} onClose={() => setModal(null)}>
          <p className={styles.modalInfo}>{t("st.records.info")}</p>
          {(["squat", "deadlift", "bench", "cleanJerk", "snatch", "ohp"] as const).map((key) => (
            <div className={styles.field} key={key}>
              <label>{t(`st.records.${key}`)}</label>
              <input
                type="number"
                value={records[key] ?? ""}
                onChange={(e) => setRecords((r) => ({ ...r, [key]: e.target.value }))}
              />
            </div>
          ))}
          <button className={styles.btnGold} disabled={busy} onClick={handleSaveRecords}>{t("st.records.saveBtn")}</button>
        </Modal>
      )}

      {modal === "programme" && (
        <Modal title={t("st.programme")} onClose={() => setModal(null)}>
          <p className={styles.modalInfo}>{t("st.programme.info")}</p>
          {Object.keys(SPORT_LABEL_TO_SLUG).map((label) => (
            <div key={label} className={styles.langOpt} onClick={() => handleToggleProgramme(label)}>
              <span className={styles.langName}>{label}</span>
              {programmes.includes(label) && <div className={styles.langCheck}>✓</div>}
            </div>
          ))}
        </Modal>
      )}

      {modal === "email" && <EmailModal currentEmail={email} onClose={() => setModal(null)} onDone={() => flash(t("st.email.done"))} />}
      {modal === "password" && <PasswordModal onClose={() => setModal(null)} onDone={() => flash(t("st.pw.done"))} />}

      {modal === "notif-time" && (
        <TimeModal
          title={t("st.notif.checkinTime")}
          label={t("st.notif.checkinTime.field")}
          note={t("st.notif.checkinTime.note")}
          saveLabel={t("st.save")}
          initial={notifCheckinTime}
          onClose={() => setModal(null)}
          onSave={async (time) => {
            await handleSaveTime(time);
            setModal(null);
          }}
        />
      )}

      {modal === "langue" && (
        <Modal title={t("st.langTitle")} onClose={() => setModal(null)}>
          {LANGS.map((code) => (
            <div key={code} className={styles.langOpt} onClick={() => handleSelectLangue(code)}>
              <span style={{ fontSize: 20 }}>{LANG_META[code].flag}</span>
              <span className={styles.langName}>{LANG_META[code].name}</span>
              {lang === code && <div className={styles.langCheck}>✓</div>}
            </div>
          ))}
        </Modal>
      )}

      {modal === "theme" && (
        <Modal title={t("st.themeTitle")} onClose={() => setModal(null)}>
          {(["light", "dark"] as const).map((th) => (
            <div key={th} className={styles.langOpt} onClick={() => handleSelectTheme(th)}>
              <span className={styles.langName}>{th === "light" ? t("st.theme.light") : t("st.theme.dark")}</span>
              {theme === th && <div className={styles.langCheck}>✓</div>}
            </div>
          ))}
          <p className={styles.modalInfo}>{t("st.themeNote")}</p>
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
  disabled,
  right,
  onClick,
}: {
  icon: string;
  title: string;
  sub: string;
  value?: string;
  badge?: string;
  danger?: boolean;
  /** Ligne grisée et inactive (ex. heure du rappel quand le rappel est désactivé). */
  disabled?: boolean;
  right?: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={cx(styles.row, disabled && styles.rowDisabled)}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      style={{ cursor: onClick && !disabled ? "pointer" : "default" }}
    >
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

function Toggle({ on, label, onChange }: { on: boolean; label: string; onChange: (v: boolean) => void }) {
  return (
    <div
      role="switch"
      aria-checked={on}
      aria-label={label}
      tabIndex={0}
      className={cx(styles.toggle, on && styles.on)}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!on);
      }}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!on);
        }
      }}
    >
      <div className={styles.toggleDot} />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  const t = useT();
  return (
    <div data-hide-scroll-top className={styles.modalOverlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.modalHandle} />
        <div className={styles.modalTitle}>{title}</div>
        <div className={styles.modalContent}>
          {children}
          <button className={styles.btnGhost} onClick={onClose} style={{ marginTop: 8 }}>{t("st.close")}</button>
        </div>
      </div>
    </div>
  );
}

function TimeModal({
  title,
  label,
  note,
  saveLabel,
  initial,
  onClose,
  onSave,
}: {
  title: string;
  label: string;
  note: string;
  saveLabel: string;
  initial: string;
  onClose: () => void;
  onSave: (time: string) => void | Promise<void>;
}) {
  const [time, setTime] = useState(initial);
  return (
    <Modal title={title} onClose={onClose}>
      <div className={styles.field}>
        <label>{label}</label>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <p className={styles.modalInfo}>{note}</p>
      <button className={styles.btnGold} disabled={!/^\d{2}:\d{2}$/.test(time)} onClick={() => onSave(time)}>
        {saveLabel}
      </button>
    </Modal>
  );
}

function EmailModal({ currentEmail, onClose, onDone }: { currentEmail: string; onClose: () => void; onDone: () => void }) {
  const t = useT();
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
      setError(err instanceof Error ? err.message : t("st.email.sendError"));
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
      if (!emailResource) throw new Error(t("st.email.notFound"));
      await emailResource.attemptVerification({ code });
      await user.update({ primaryEmailAddressId: emailId });
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("st.email.badCode"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("st.email.title")} onClose={onClose}>
      {step === "input" ? (
        <>
          <div className={styles.field}>
            <label>{t("st.email.current")}</label>
            <input type="email" value={currentEmail} disabled />
          </div>
          <div className={styles.field}>
            <label>{t("st.email.new")}</label>
            <input type="email" placeholder={t("st.email.newPlaceholder")} value={newEmail} onChange={(e) => setNewEmail(e.target.value)} />
          </div>
          {error && <div className={styles.errorText}>{error}</div>}
          <button className={styles.btnGold} disabled={busy} onClick={handleSend}>
            {busy ? t("st.email.sending") : t("st.email.send")}
          </button>
        </>
      ) : (
        <>
          <p className={styles.modalInfo}>{t("st.email.sentTo", { email: newEmail })}</p>
          <div className={styles.field}>
            <label>{t("st.email.code")}</label>
            <input type="text" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />
          </div>
          {error && <div className={styles.errorText}>{error}</div>}
          <button className={styles.btnGold} disabled={busy || code.length < 6} onClick={handleVerify}>
            {busy ? t("st.email.verifying") : t("st.email.confirm")}
          </button>
        </>
      )}
    </Modal>
  );
}

function PasswordModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const t = useT();
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
      setError(err instanceof Error ? err.message : t("st.pw.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={t("st.pw.title")} onClose={onClose}>
      <div className={styles.field}>
        <label>{t("st.pw.current")}</label>
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </div>
      <div className={styles.field}>
        <label>{t("st.pw.new")}</label>
        <input type="password" placeholder={t("st.pw.placeholder")} value={next} onChange={(e) => setNext(e.target.value)} />
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
      <button className={styles.btnGold} disabled={busy} onClick={handleSave}>
        {busy ? t("st.pw.updating") : t("st.pw.change")}
      </button>
    </Modal>
  );
}

function DeleteModal({ onClose, onDeleted }: { onClose: () => void; onDeleted: () => void }) {
  const t = useT();
  const word = t("st.delete.word");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (text !== word) {
      setError(t("st.delete.mustType", { word }));
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
    <Modal title={t("st.delete.title")} onClose={onClose}>
      <p className={cx(styles.modalInfo, styles.modalInfoDanger)}>{t("st.delete.info")}</p>
      <div className={styles.field}>
        <label>{t("st.delete.confirmLabel")}</label>
        <input type="text" placeholder={word} value={text} onChange={(e) => setText(e.target.value)} />
      </div>
      {error && <div className={styles.errorText}>{error}</div>}
      <button className={styles.btnRed} disabled={busy} onClick={handleDelete}>
        {busy ? t("st.delete.deleting") : t("st.delete.final")}
      </button>
    </Modal>
  );
}
