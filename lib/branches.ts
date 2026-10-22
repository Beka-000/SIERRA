/**
 * lib/branches.ts
 *
 * Единое место хранения всех данных о филиалах SIERRA Coffee.
 * Чтобы изменить адрес, телефон или статус — правь только этот файл.
 */

export type BranchStatus =
  | "open"         // работает, статус подтверждён
  | "unconfirmed"  // статус требует уточнения
  | "hidden";      // скрыт с сайта (например, временно закрыт)

export interface Branch {
  id:          string;
  name:        string;
  address:     string;
  phone:       string | null;    // null = не подтверждён
  phoneNote?:  string;           // пометка к телефону (например, об альтернативном номере)
  hours?:      string;           // режим работы (если известен)
  mapsQuery:   string;           // поисковый запрос для Google Maps
  status:      BranchStatus;
  statusNote?: string;           // примечание к статусу
  isPublic:    boolean;          // показывать ли на публичном сайте
}

export const BRANCHES: Branch[] = [
  {
    id:        "manas",
    name:      "SIERRA Coffee Manas",
    address:   "пр. Манаса, 57/1, Бишкек",
    phone:     "+996770969664",
    mapsQuery: "SIERRA Coffee Манас пр. Манаса 57/1 Бишкек",
    status:    "open",
    isPublic:  true,
  },
  {
    id:        "dushanbinka",
    name:      "SIERRA Coffee Dushanbinka",
    address:   "ул. Токтоналиева, 62, Бишкек",
    phone:     "+996770969690",
    mapsQuery: "SIERRA Coffee Душанбинка ул. Токтоналиева 62 Бишкек",
    status:    "open",
    isPublic:  true,
  },
  {
    id:        "ak-emir",
    name:      "SIERRA Coffee Ak-Emir",
    address:   "ул. Московская, 69, Бишкек",
    phone:     "+996770969675",
    mapsQuery: "SIERRA Coffee Ак-Эмир ул. Московская 69 Бишкек",
    status:    "open",
    isPublic:  true,
  },
  {
    id:        "auca",
    name:      "SIERRA Coffee AUCA",
    address:   "ул. Аалы Токомбаева, 7/6, кампус AUCA, Бишкек",
    phone:     "+996770969673",
    mapsQuery: "AUCA Бишкек ул. Аалы Токомбаева 7/6",
    status:    "open",
    isPublic:  true,
  },
  {
    id:        "asyl-tash",
    name:      "SIERRA Coffee Asyl Tash",
    address:   "ул. Ибраимова, 115/1, БЦ Asyl Tash, Бишкек",
    // Основной номер. Альтернативный: +996770969630 — см. phoneNote
    phone:      "+996770969637",
    phoneNote:  "В некоторых справочниках указан также +996 770 969 630",
    mapsQuery:  "БЦ Asyl Tash ул. Ибраимова 115/1 Бишкек",
    status:     "open",
    isPublic:   true,
  },
  {
    id:          "igemberdieva",
    name:        "SIERRA Coffee — Игембердиева",
    address:     "ул. Игембердиева, 1/а, Бишкек",
    phone:       null,         // телефон не подтверждён
    mapsQuery:   "ул. Игембердиева 1а Бишкек",
    status:      "open",
    statusNote:  "Телефон уточняется",
    isPublic:    true,
  },
  {
    id:          "airport",
    name:        "SIERRA Coffee — аэропорт Манас",
    address:     "Международный аэропорт «Манас», Бишкек",
    phone:       "+996770162601",
    mapsQuery:   "Аэропорт Манас Бишкек",
    status:      "unconfirmed",
    statusNote:  "Актуальность работы филиала уточняется",
    isPublic:    true,
  },
  {
    id:          "optima-hq",
    name:        "SIERRA Coffee Optima HQ",
    address:     "пр. Чынгыза Айтматова, 95/1, Бишкек",
    phone:       "+996770969685",
    mapsQuery:   "пр. Чынгыза Айтматова 95/1 Бишкек",
    status:      "unconfirmed",
    statusNote:  "Может быть корпоративным объектом — уточните перед визитом",
    isPublic:    true,
  },
];

/** Только публичные, не скрытые филиалы */
export function getPublicBranches(): Branch[] {
  return BRANCHES.filter((b) => b.isPublic && b.status !== "hidden");
}

/** Форматирует телефон для отображения: +996770969664 → +996 770 969 664 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("996") && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return raw;
}
