/** Âge en années révolues à partir de la date de naissance — recalculé à chaque lecture. */
export function ageFromDateNaissance(dateNaissance: Date | string | null | undefined): number | null {
  if (!dateNaissance) return null;
  const birth = typeof dateNaissance === "string" ? new Date(dateNaissance) : dateNaissance;
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday =
    now.getMonth() < birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}
