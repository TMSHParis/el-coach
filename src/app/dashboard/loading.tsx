"use client";

import { PageLoading } from "@/components/page-loading";
import { useT } from "@/lib/i18n/provider";

export default function Loading() {
  const t = useT();
  return <PageLoading label={t("dash.loading")} />;
}
