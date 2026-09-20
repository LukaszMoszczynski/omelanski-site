import { BUSINESS, CONTACT } from './site';

export interface RodoSection {
  id: string;
  n: string;
  title: string;
  /** Paragraphs, rendered in order. */
  body: string[];
  /** Lettered sub-points (the legal grounds under art. 6). */
  items?: { label: string; text: string }[];
}

// Wording supplied by the client (klauzula dla Wspólnot Mieszkaniowych), split into
// sections for the table of contents. The firm's own details come from site.ts.
const FIRM = `Zarządzanie Nieruchomościami ${BUSINESS.shortName}`;

export const RODO: RodoSection[] = [
  {
    id: 'administrator',
    n: '01',
    title: 'Administrator danych osobowych',
    body: [
      'Administratorem danych osobowych właścicieli lokali jest właściwa Wspólnota Mieszkaniowa (dalej ADO).',
      'Niniejsza informacja została sporządzona w wykonaniu dyspozycji zawartej w art. 13 Rozporządzenia Parlamentu Europejskiego i Rady (UE) 2016/679 z dnia 27 kwietnia 2016 roku w sprawie ochrony osób fizycznych w związku z przetwarzaniem danych osobowych i w sprawie swobodnego przepływu takich danych oraz uchylenia dyrektywy 95/46/WE (dalej Rozporządzenie).',
    ],
  },
  {
    id: 'podmiot-przetwarzajacy',
    n: '02',
    title: 'Podmiot przetwarzający',
    body: [
      `Firma ${FIRM} z siedzibą w Kamieniu Pomorskim, przy ${BUSINESS.street}, NIP ${BUSINESS.nip}, REGON ${BUSINESS.regon}, jest podmiotem przetwarzającym w rozumieniu Rozporządzenia, czyli przetwarza Państwa dane osobowe w imieniu Wspólnoty Mieszkaniowej.`,
    ],
  },
  {
    id: 'cel-i-podstawa',
    n: '03',
    title: 'Cel i podstawa prawna przetwarzania',
    body: ['Dane osobowe przetwarzane są na następującej podstawie prawnej oraz w następującym celu:'],
    items: [
      {
        label: 'a',
        text: 'art. 6 ust. 1 lit. c i d Rozporządzenia – przetwarzanie danych osobowych jest niezbędne do wypełnienia obowiązku prawnego ciążącego na administratorze oraz przetwarzanie jest niezbędne do ochrony żywotnych interesów osoby, której dane dotyczą, lub innej osoby fizycznej, polegających na sprawowaniu zarządu nieruchomością wspólną w rozumieniu Ustawy z dnia 24 czerwca 1994 r. o własności lokali (Cel). Dane osobowe przetwarzane są przez okres, w jakim lokator, którego dane osobowe dotyczą, jest członkiem Wspólnoty Mieszkaniowej, oraz przez okres do upływu terminów przedawnienia roszczeń.',
      },
      {
        label: 'b',
        text: 'art. 6 ust. 1 lit. c Rozporządzenia – przetwarzanie jest niezbędne do wypełnienia obowiązku prawnego ciążącego na administratorze, polegającego na wypełnieniu obowiązków rachunkowych, podatkowych, fiskalnych, ubezpieczeniowych, socjalnych wynikających lub związanych z przynależnością właściciela lokalu, którego dane dotyczą, do Wspólnoty Mieszkaniowej.',
      },
      {
        label: 'c',
        text: 'art. 6 ust. 1 lit. c Rozporządzenia – przetwarzanie jest niezbędne do celów wynikających z prawnie uzasadnionych interesów realizowanych przez ADO, polegającego na archiwizowaniu i przechowywaniu dokumentacji związanej z zarządem nieruchomością wspólną. Dane osobowe przetwarzane będą przez okres do 10 lat od momentu zakończenia przetwarzania na innych podstawach prawnych.',
      },
    ],
  },
  {
    id: 'odbiorcy',
    n: '04',
    title: 'Odbiorcy danych',
    body: [
      `Odbiorcami danych osobowych są Zarząd Wspólnoty Mieszkaniowej, właściciele lokali, uprawnieni do przetwarzania danych osobowych pracownicy firmy ${FIRM} oraz mogą być inne podmioty przetwarzające dane w rozumieniu Rozporządzenia, np. podmioty świadczące usługi informatyczne, administracyjne, finansowe, budowlane lub prawne.`,
    ],
  },
  {
    id: 'prawa',
    n: '05',
    title: 'Prawa osoby, której dane dotyczą',
    body: [
      'Przysługuje Państwu prawo dostępu do treści swoich danych i ich sprostowania, usunięcia, ograniczenia przetwarzania, prawo do przenoszenia danych oraz prawo do wniesienia sprzeciwu wobec przetwarzania, a także prawo wniesienia skargi do organu nadzoru – na zasadach wskazanych w Rozporządzeniu (art. 15–22 Rozporządzenia).',
    ],
  },
  {
    id: 'obowiazek-podania-danych',
    n: '06',
    title: 'Obowiązek podania danych',
    body: [
      'Podanie danych osobowych jest wymogiem ustawowym. Podanie danych osobowych nie jest warunkiem zawarcia umowy. Każdy właściciel lokalu należący do Wspólnoty Mieszkaniowej jest zobowiązany do podania danych osobowych. Niepodanie danych osobowych mogłoby narazić na szkodę właściciela nieruchomości lub Wspólnotę Mieszkaniową oraz wpłynąć na wzajemne prawa i obowiązki.',
    ],
  },
  {
    id: 'profilowanie',
    n: '07',
    title: 'Zautomatyzowane podejmowanie decyzji',
    body: ['ADO nie przetwarza danych osobowych w procesie zautomatyzowanego podejmowania decyzji, w tym profilowania.'],
  },
  {
    id: 'kontakt',
    n: '08',
    title: 'Kontakt w sprawie danych',
    body: [
      'Odpowiedzi na wszelkie pytania związane z przetwarzaniem danych osobowych członków Wspólnoty Mieszkaniowej udzielają administratorzy.',
      `Pytania i wnioski można kierować także do biura: ${CONTACT.email}, tel. ${CONTACT.phone}, ${CONTACT.hoursShort}. Wnioski dotyczące danych osobowych można składać osobiście w biurze przy ${BUSINESS.street}, listownie lub pocztą elektroniczną.`,
    ],
  },
];

export const RODO_COOKIES_NOTE =
  'Strona nie używa własnych plików cookies ani narzędzi analitycznych. Wybrany motyw kolorystyczny (jasny lub ciemny) jest zapisywany wyłącznie w pamięci Twojej przeglądarki (localStorage) i nie jest przesyłany do nas. Na stronie głównej i na stronie Kontakt osadzona jest mapa Google Maps — jej wyświetlenie powoduje połączenie z serwerami Google LLC, które mogą zapisać pliki cookies i odnotować adres IP urządzenia. Zasady przetwarzania danych przez Google opisuje polityka prywatności Google.';
