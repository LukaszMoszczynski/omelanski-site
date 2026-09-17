import { ACTS } from '../data/acts';
import { ABOUT, HERO } from '../data/content';
import { DUTIES } from '../data/duties';
import { NAV, PAGES } from '../data/pages';
import { RODO, RODO_COOKIES_NOTE } from '../data/rodo';
import { AFTER_HOURS, BUSINESS, CONTACT, EKARTOTEKA_URL, EMERGENCY } from '../data/site';

type Abs = (path: string) => string;

const SUMMARY =
  'Firma z Kamienia Pomorskiego zajmująca się administrowaniem, zarządzaniem i rozliczaniem Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych w powiecie kamieńskim i gryfickim.';

export function buildLlmsTxt(abs: Abs): string {
  return [
    `# ${BUSINESS.name}`,
    '',
    `> ${SUMMARY}`,
    '',
    `Biuro: ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}. Tel. ${CONTACT.phone}, telefon/fax ${CONTACT.phoneFax}, e-mail ${CONTACT.email}. Godziny: ${CONTACT.hoursShort}.`,
    '',
    '## Strony',
    '',
    ...NAV.map((p) => `- [${p.nav}](${abs(p.path)}): ${p.description}`),
    '',
    '## Optional',
    '',
    `- [Pełna treść strony](${abs('/llms-full.txt')}): cała treść serwisu w jednym pliku`,
    `- [E-kartoteka](${EKARTOTEKA_URL}): panel mieszkańca (saldo, opłaty, media, uchwały) – wymaga logowania`,
    '',
  ].join('\n');
}

export function buildLlmsFullTxt(abs: Abs): string {
  const out: string[] = [`# ${BUSINESS.name}`, '', `> ${SUMMARY}`, ''];

  out.push(`## ${PAGES.home.nav} (${abs(PAGES.home.path)})`, '', `### ${HERO.title}`, '', HERO.lead, '');
  out.push(`### ${ABOUT.title}`, '', ...ABOUT.paragraphs.flatMap((p) => [p, '']));
  out.push('### Ważne telefony', '', ...EMERGENCY.map((e) => `- ${e.label}: ${e.number}`), '');

  out.push(`## ${PAGES.offer.nav} (${abs(PAGES.offer.path)})`, '', 'Zakres podstawowy, modyfikowany indywidualnie na życzenie Wspólnoty.', '');
  for (const group of DUTIES) {
    out.push(`### ${group.label}: ${group.head}`, '', ...group.items.map((i) => `- ${i}`), '');
  }

  out.push(`## ${PAGES.acts.nav} (${abs(PAGES.acts.path)})`, '');
  for (const act of ACTS) out.push(`- [${act.title}](${act.href}) – ${act.citation}`);
  out.push('', `Uchwały i regulaminy Wspólnoty są dostępne po zalogowaniu do systemu E-kartoteka: ${EKARTOTEKA_URL}`, '');

  out.push(`## ${PAGES.rodo.title} (${abs(PAGES.rodo.path)})`, '');
  for (const r of RODO) out.push(`### ${r.n}. ${r.title}`, '', r.body, '');
  out.push('### Pliki cookies', '', RODO_COOKIES_NOTE, '');

  out.push(
    `## ${PAGES.contact.nav} (${abs(PAGES.contact.path)})`,
    '',
    `- Adres: ${BUSINESS.street}, ${BUSINESS.postalCode} ${BUSINESS.city}`,
    `- Telefon: ${CONTACT.phone}`,
    `- Telefon/fax: ${CONTACT.phoneFax}`,
    `- E-mail: ${CONTACT.email}`,
    `- Godziny otwarcia: ${CONTACT.hoursDays}, ${CONTACT.hoursTime}`,
    '',
    '### Awaria po godzinach pracy biura',
    '',
    ...AFTER_HOURS.map((a) => `- ${a.label}: ${a.number}`),
    '',
  );
  return out.join('\n');
}
