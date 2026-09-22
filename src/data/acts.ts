export interface LegalAct {
  kind: string;
  title: string;
  citation: string;
  /** Official text in the Dziennik Ustaw (ISAP). */
  href: string;
  /** Copy of the act served from this site, under `public/akty/`. */
  pdf?: string;
}

// The acts the client publishes, each with the text they supplied as a PDF.
export const ACTS: LegalAct[] = [
  {
    kind: 'Ustawa',
    title: 'Ustawa o własności lokali',
    citation: 'Dz.U. 1994 nr 85 poz. 388, z późn. zm.',
    href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940850388',
    pdf: '/akty/ustawa-o-wlasnosci-lokali.pdf',
  },
  {
    kind: 'Kodeks',
    title: 'Kodeks cywilny – Dział IV. Współwłasność',
    citation: 'Dz.U. 1964 nr 16 poz. 93, z późn. zm.',
    href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19640160093',
    pdf: '/akty/kodeks-cywilny-wspolwlasnosc.pdf',
  },
];
