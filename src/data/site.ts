export const BUSINESS = {
  name: 'Radosław Omelański – Zarządzanie Nieruchomościami',
  shortName: 'Radosław Omelański',
  tagline: 'Zarządzanie Nieruchomościami',
  street: 'ul. Jedności Narodowej 1/4',
  postalCode: '72-400',
  city: 'Kamień Pomorski',
  region: 'zachodniopomorskie',
  nip: '9860145783',
  regon: '527844342',
  areaServed: ['Powiat kamieński', 'Powiat gryficki'],
} as const;

export const CONTACT = {
  phone: '518 629 878',
  phoneFax: '91 32 17 878',
  email: 'biuro@omelanska.com',
  hoursShort: 'pon.–pt. 8.00–16.00',
  hoursDays: 'od poniedziałku do piątku',
  hoursTime: '8.00 – 16.00',
} as const;

export const EKARTOTEKA_URL = 'https://ekartoteka.omelanska.com/';

export const MAPS_URL =
  'https://www.google.com/maps/search/?api=1&query=' +
  encodeURIComponent('ul. Jedności Narodowej 1/4, 72-400 Kamień Pomorski');

export interface EmergencyNumber {
  label: string;
  number: string;
  /** Shown in the top bar: on all widths, only on desktop, or not at all. */
  topBar: 'all' | 'desktop' | false;
  /** Shown in the home phone grid on mobile. */
  mobileGrid: boolean;
  highlight?: boolean;
}

// Order and labels verbatim from design 2a.
export const EMERGENCY: EmergencyNumber[] = [
  { label: 'Tel. Alarmowy', number: '112', topBar: 'all', mobileGrid: true, highlight: true },
  { label: 'Straż pożarna', number: '998', topBar: 'all', mobileGrid: true },
  { label: 'Pogot. ratunkowe', number: '999', topBar: false, mobileGrid: true },
  { label: 'Policja', number: '997', topBar: false, mobileGrid: true },
  { label: 'Straż Miejska', number: '986', topBar: false, mobileGrid: false },
  { label: 'Gazownicze', number: '992', topBar: 'all', mobileGrid: true },
  { label: 'Ciepłownicze', number: '993', topBar: 'desktop', mobileGrid: false },
  { label: 'Wodociągowe', number: '994', topBar: 'all', mobileGrid: true },
  { label: 'Energetyczne', number: '991', topBar: 'desktop', mobileGrid: false },
];

// Kontakt page, "Awaria po godzinach pracy biura".
export const AFTER_HOURS = [
  { label: 'Pogotowie energetyczne', number: '991' },
  { label: 'Pogotowie gazowe', number: '992' },
  { label: 'Pogotowie wodno-kanalizacyjne', number: '994' },
];
