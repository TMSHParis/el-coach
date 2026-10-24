import { PageLoading } from "@/components/page-loading";
import { getT } from "@/lib/i18n/server";

export default async function Loading() {
  const { t } = await getT();
  return <PageLoading label={t("ci.loading.page")} />;
}
