"use client";

import { useActionState } from "react";
import { Loader2, Send } from "lucide-react";
import { useT } from "@/lib/i18n/provider";
import { submitCoachApplication, type ApplyFormState } from "./actions";

const categories = ["STRENGTH", "HYPERTROPHY", "CONDITIONING", "ENDURANCE", "MOBILITY"];
const levels = ["BEGINNER", "INTERMEDIATE", "ADVANCED"];

export function ApplyForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<ApplyFormState | undefined, FormData>(
    submitCoachApplication,
    undefined,
  );
  const errors = state && !state.ok ? state.errors : {};

  return (
    <form action={formAction} className="mt-12 space-y-16">
      <Section n="01" title={t("lg.apply.s1")}>
        <Grid2>
          <Field label={t("lg.apply.fullName")} name="fullName" error={errors.fullName} required />
          <Field label={t("lg.apply.handle")} name="handle" placeholder={t("lg.apply.handlePh")} error={errors.handle} required />
          <Field label={t("lg.apply.email")} name="email" type="email" error={errors.email} required />
          <Field label={t("lg.apply.location")} name="location" placeholder="Paris, FR" error={errors.location} required />
          <Field label={t("lg.apply.title")} name="title" placeholder="S&C Coach · Powerlifting" error={errors.title} required />
          <Field label={t("lg.apply.yearsExp")} name="yearsExp" type="number" min={0} max={60} error={errors.yearsExp} required />
          <Field label={t("lg.apply.instagram")} name="instagram" placeholder={t("lg.apply.instagramPh")} />
          <Field label={t("lg.apply.website")} name="website" placeholder={t("lg.apply.websitePh")} />
        </Grid2>
        <Textarea
          label={t("lg.apply.bio")}
          name="bio"
          rows={5}
          placeholder={t("lg.apply.bioPh")}
          error={errors.bio}
          required
        />
        <Field
          label={t("lg.apply.specialties")}
          name="specialties"
          placeholder={t("lg.apply.specialtiesPh")}
          error={errors.specialties}
          required
        />
      </Section>

      <Section n="02" title={t("lg.apply.s2")}>
        <Field label={t("lg.apply.title")} name="pTitle" placeholder={t("lg.apply.pTitlePh")} error={errors.pTitle} required />
        <Grid2>
          <Select label={t("lg.apply.category")} name="pCategory" options={categories} error={errors.pCategory} required />
          <Select label={t("lg.apply.level")} name="pLevel" options={levels} error={errors.pLevel} required />
          <Field label={t("lg.apply.weeks")} name="pWeeks" type="number" min={1} max={52} error={errors.pWeeks} required />
          <Field label={t("lg.apply.sessions")} name="pSessions" type="number" min={1} max={14} error={errors.pSessions} required />
          <Field label={t("lg.apply.price")} name="pPrice" type="number" min={5} max={500} step="0.5" error={errors.pPrice} required />
        </Grid2>
        <Textarea
          label={t("lg.apply.description")}
          name="pDescription"
          rows={5}
          placeholder={t("lg.apply.descriptionPh")}
          error={errors.pDescription}
          required
        />
        <Field
          label={t("lg.apply.outcomes")}
          name="pOutcomes"
          placeholder={t("lg.apply.outcomesPh")}
          error={errors.pOutcomes}
          required
        />
        <Field
          label={t("lg.apply.equipment")}
          name="pEquipment"
          placeholder={t("lg.apply.equipmentPh")}
          error={errors.pEquipment}
          required
        />
      </Section>

      <div className="hairline-t pt-8">
        <button type="submit" disabled={pending} className="btn-primary w-full disabled:opacity-60 md:w-auto">
          {pending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          {pending ? t("lg.apply.sending") : t("lg.apply.submit")}
        </button>
        {state && !state.ok && (
          <p className="mono mt-4 text-xs text-red-400">
            {t("lg.apply.fixFields", { n: Object.keys(state.errors).length })}
          </p>
        )}
      </div>
    </form>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-6">
      <div>
        <div className="label">[ {n} ]</div>
        <h2 className="mt-2 text-2xl font-semibold md:text-3xl">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({
  label,
  name,
  type = "text",
  placeholder,
  error,
  required,
  min,
  max,
  step,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
}) {
  return (
    <label className="block">
      <div className="label flex items-center justify-between">
        <span>
          {label}
          {required && <span className="ml-1 text-white">*</span>}
        </span>
        {error && <span className="text-red-400 normal-case tracking-normal">{error}</span>}
      </div>
      <input
        name={name}
        type={type}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        className="mono mt-2 w-full border border-[color:var(--c-1f1f1f)] bg-[var(--c-0a0a0a)] px-4 py-3 text-sm outline-none focus:border-white"
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  rows = 4,
  placeholder,
  error,
  required,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="label flex items-center justify-between">
        <span>
          {label}
          {required && <span className="ml-1 text-white">*</span>}
        </span>
        {error && <span className="text-red-400 normal-case tracking-normal">{error}</span>}
      </div>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        className="mono mt-2 w-full resize-none border border-[color:var(--c-1f1f1f)] bg-[var(--c-0a0a0a)] px-4 py-3 text-sm outline-none focus:border-white"
      />
    </label>
  );
}

function Select({
  label,
  name,
  options,
  error,
  required,
}: {
  label: string;
  name: string;
  options: string[];
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="label flex items-center justify-between">
        <span>
          {label}
          {required && <span className="ml-1 text-white">*</span>}
        </span>
        {error && <span className="text-red-400 normal-case tracking-normal">{error}</span>}
      </div>
      <select
        name={name}
        defaultValue=""
        className="mono mt-2 w-full border border-[color:var(--c-1f1f1f)] bg-[var(--c-0a0a0a)] px-4 py-3 text-sm outline-none focus:border-white"
      >
        <option value="" disabled>
          —
        </option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
