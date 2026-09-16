export interface LegalAct {
  kind: string;
  title: string;
  citation: string;
  href: string;
}

// Proposal from the design; client to confirm the final list.
export const ACTS: LegalAct[] = [
  {
    kind: 'Ustawa',
    title: 'Ustawa o własności lokali',
    citation: 'Dz.U. 1994 nr 85 poz. 388, z późn. zm.',
    href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940850388',
  },
  {
    kind: 'Ustawa',
    title: 'Ustawa Prawo budowlane',
    citation: 'Dz.U. 1994 nr 89 poz. 414, z późn. zm.',
    href: 'https://isap.sejm.gov.pl/isap.nsf/DocDetails.xsp?id=WDU19940890414',
  },
];
