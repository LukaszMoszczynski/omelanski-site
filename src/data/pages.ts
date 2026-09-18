export interface PageMeta {
  path: string;
  nav: string;
  title: string;
  description: string;
}

export const PAGES = {
  home: {
    path: '/',
    nav: 'Strona główna',
    title: 'Radosław Omelański – Zarządzanie Nieruchomościami, Kamień Pomorski',
    description:
      'Administrowanie i rozliczanie Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych w powiecie kamieńskim i gryfickim. Biuro w Kamieniu Pomorskim.',
  },
  acts: {
    path: '/akty-prawne/',
    nav: 'Akty prawne',
    title: 'Akty prawne',
    description:
      'Przepisy, na których opiera się administrowanie Wspólnotą Mieszkaniową: ustawa o własności lokali i Prawo budowlane – z odnośnikami do Dziennika Ustaw.',
  },
  offer: {
    path: '/oferta/',
    nav: 'Oferta',
    title: 'Oferta dla Wspólnot i Spółdzielni',
    description:
      'Zakres obsługi Wspólnot Mieszkaniowych: prawo, księgowość, administracja i technika. Ofertę dopasowujemy indywidualnie do potrzeb Wspólnoty.',
  },
  rodo: {
    path: '/rodo/',
    nav: 'RODO',
    title: 'Klauzula informacyjna RODO',
    description:
      'Informacja o przetwarzaniu danych osobowych właścicieli lokali i mieszkańców nieruchomości administrowanych przez Radosław Omelański Zarządzanie Nieruchomościami.',
  },
  contact: {
    path: '/kontakt/',
    nav: 'Kontakt',
    title: 'Kontakt',
    description:
      'Biuro w Kamieniu Pomorskim, ul. Jedności Narodowej 1/4. Tel. 518 629 878, e-mail biuro@omelanski.com, pon.–pt. 8.00–16.00. Numery pogotowia po godzinach.',
  },
} as const satisfies Record<string, PageMeta>;

export const NAV: PageMeta[] = [PAGES.home, PAGES.acts, PAGES.offer, PAGES.rodo, PAGES.contact];

/** Full <title>: home uses its own title, subpages get the brand suffix. */
export function fullTitle(page: PageMeta): string {
  return page.path === '/' ? page.title : `${page.title} | Radosław Omelański – Zarządzanie Nieruchomościami`;
}
