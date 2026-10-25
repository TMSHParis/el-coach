import type { Entries } from "../types";

// Notifications push (partie 5, mission 4A) : titres et textes envoyés par la tâche planifiée.
export const notif = {
  "notif.title.checkin": ["Check-in du matin", "Morning check-in", "Check-in de la mañana"],
  "notif.title.seance": ["Séance du jour", "Today's session", "Sesión de hoy"],
  "notif.title.injury": ["Zone signalée", "Reported area", "Zona indicada"],
  "notif.title.test": ["Test", "Test", "Prueba"],
  "notif.test": ["Test : tes notifications fonctionnent.", "Test: your notifications are working.", "Prueba: tus notificaciones funcionan."],
  "notif.title.recap": ["Récapitulatif de la semaine", "Weekly recap", "Resumen de la semana"],
  "notif.checkin": [
    "Ton check-in du matin t'attend : 1 minute pour adapter ta séance.",
    "Your morning check-in is waiting: 1 minute to adapt your session.",
    "Tu check-in de la mañana te espera: 1 minuto para adaptar tu sesión.",
  ],
  "notif.seance": ["Séance dans 30 min : {name} à {time}.", "Session in 30 min: {name} at {time}.", "Sesión en 30 min: {name} a las {time}."],
  "notif.injury": [
    "Ta zone signalée ({zone}) est active depuis plus de 5 jours : fais le point dans ton profil.",
    "Your reported area ({zone}) has been active for more than 5 days: review it in your profile.",
    "Tu zona indicada ({zone}) lleva activa más de 5 días: revísala en tu perfil.",
  ],
  "notif.recap.none": ["Semaine calme : prêt pour la suivante ?", "Quiet week: ready for the next one?", "Semana tranquila: ¿listo para la siguiente?"],
  "notif.recap.count.one": ["{n} séance", "{n} session", "{n} sesión"],
  "notif.recap.count.many": ["{n} séances", "{n} sessions", "{n} sesiones"],
  "notif.recap.line": ["Cette semaine : {count}", "This week: {count}", "Esta semana: {count}"],
  "notif.recap.duration": ["{duration} au total", "{duration} in total", "{duration} en total"],
  "notif.recap.best": ["Meilleure séance : {name} ({pct} %).", "Best session: {name} ({pct}%).", "Mejor sesión: {name} ({pct} %)."],
} as const satisfies Entries;
