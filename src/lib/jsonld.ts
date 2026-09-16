import { BUSINESS, CONTACT, MAPS_URL } from '../data/site';
import { telHref } from './phone';

type Abs = (path: string) => string;

const e164 = (display: string) => telHref(display).replace('tel:', '');

export function businessJsonLd(abs: Abs): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateAgent',
    '@id': `${abs('/')}#firma`,
    name: BUSINESS.name,
    url: abs('/'),
    logo: abs('/apple-touch-icon.png'),
    image: abs('/og.png'),
    description:
      'Administrowanie, zarządzanie i rozliczanie Wspólnot Mieszkaniowych oraz Spółdzielni Mieszkaniowych w powiecie kamieńskim i gryfickim.',
    telephone: e164(CONTACT.phone),
    faxNumber: e164(CONTACT.phoneFax),
    email: CONTACT.email,
    taxID: BUSINESS.nip,
    identifier: { '@type': 'PropertyValue', propertyID: 'REGON', value: BUSINESS.regon },
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postalCode,
      addressLocality: BUSINESS.city,
      addressRegion: BUSINESS.region,
      addressCountry: 'PL',
    },
    hasMap: MAPS_URL,
    areaServed: BUSINESS.areaServed.map((name) => ({ '@type': 'AdministrativeArea', name })),
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '16:00',
      },
    ],
  };
}

export function breadcrumbJsonLd(abs: Abs, page: { path: string; nav: string }): Record<string, unknown> | null {
  if (page.path === '/') return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Strona główna', item: abs('/') },
      { '@type': 'ListItem', position: 2, name: page.nav, item: abs(page.path) },
    ],
  };
}
