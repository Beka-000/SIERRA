/**
 * lib/branches.ts
 *
 * Единое место хранения всех данных о филиалах SIERRA Coffee.
 * Чтобы изменить адрес, телефон, статус или координаты — правь только этот файл.
 *
 * Координаты (lat/lng) используются для маркеров на карте 2ГИС.
 * Источники координат указаны в комментариях к каждому филиалу.
 * Если координаты null — маркер на карте не отображается.
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
  phoneNote?:  string;           // пометка к телефону
  hours?:      string;           // режим работы (если известен)
  mapsQuery:   string;           // поисковый запрос для 2ГИС
  status:      BranchStatus;
  statusNote?: string;           // примечание к статусу
  isPublic:    boolean;          // показывать ли на публичном сайте
  // Координаты для карты 2ГИС. null = нет данных, маркер не показывается.
  lat:         number | null;
  lng:         number | null;
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
    // Источник: OSM Nominatim — найден как «Sierra Coffee», way 160749112
    lat: 42.8746,
    lng: 74.5886,
  },
  {
    id:        "dushanbinka",
    name:      "SIERRA Coffee Dushanbinka",
    address:   "ул. Токтоналиева, 62, Бишкек",
    phone:     "+996770969690",
    mapsQuery: "SIERRA Coffee Душанбинка ул. Токтоналиева 62 Бишкек",
    status:    "open",
    isPublic:  true,
    // Источник: OSM Nominatim — здание №62 по ул. Токтоналиева А., way 52704001
    lat: 42.8442,
    lng: 74.5925,
  },
  {
    id:        "ak-emir",
    name:      "SIERRA Coffee Ak-Emir",
    address:   "ул. Московская, 69, Бишкек",
    phone:     "+996770969675",
    mapsQuery: "SIERRA Coffee Ак-Эмир ул. Московская 69 Бишкек",
    status:    "open",
    isPublic:  true,
    // Источник: OSM Nominatim — здание №69 по ул. Московская, way 53017679
    lat: 42.8694,
    lng: 74.6125,
  },
  {
    id:        "auca",
    name:      "SIERRA Coffee AUCA",
    address:   "ул. Аалы Токомбаева, 7/6, кампус AUCA, Бишкек",
    phone:     "+996770969673",
    mapsQuery: "AUCA Бишкек ул. Аалы Токомбаева 7/6",
    status:    "open",
    isPublic:  true,
    // Источник: OSM Nominatim — кампус AUCA, relation 13341522
    lat: 42.8117,
    lng: 74.6271,
  },
  {
    id:        "asyl-tash",
    name:      "SIERRA Coffee Asyl Tash",
    address:   "ул. Ибраимова, 115/1, БЦ Asyl Tash, Бишкек",
    phone:      "+996770969637",
    phoneNote:  "В некоторых справочниках указан также +996 770 969 630",
    mapsQuery:  "БЦ Asyl Tash ул. Ибраимова 115/1 Бишкек",
    status:     "open",
    isPublic:   true,
    // Источник: OSM Nominatim — здание «Асыл-Таш» №115 по ул. Ибраимова, way 619670367
    lat: 42.8740,
    lng: 74.6198,
  },
  {
    id:          "igemberdieva",
    name:        "SIERRA Coffee — Игембердиева",
    address:     "ул. Игембердиева, 1/а, Бишкек",
    phone:       null,
    mapsQuery:   "ул. Игембердиева 1а Бишкек",
    status:      "open",
    statusNote:  "Телефон уточняется",
    isPublic:    true,
    // Координаты не найдены в надёжных источниках — маркер не отображается
    lat: null,
    lng: null,
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
    // Источник: ICAO UCFM / IATA FRU, подтверждено несколькими авиационными базами данных
    lat: 43.0613,
    lng: 74.4776,
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
    // Источник: OSM Nominatim — здание 95/1 по просп. Чынгыза Айтматова, way 452349436
    lat: 42.8394,
    lng: 74.5831,
  },
];

/** Только публичные, не скрытые филиалы */
export function getPublicBranches(): Branch[] {
  return BRANCHES.filter((b) => b.isPublic && b.status !== "hidden");
}

/** Только публичные филиалы с известными координатами (для маркеров на карте) */
export function getMappableBranches(): Branch[] {
  return getPublicBranches().filter((b) => b.lat !== null && b.lng !== null);
}

/** Форматирует телефон для отображения: +996770969664 → +996 770 969 664 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("996") && digits.length === 12) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return raw;
}
