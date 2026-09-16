export interface DutyGroup {
  id: string;
  label: string;
  head: string;
  items: string[];
}

export const DUTIES_NOTE = 'Zakres podstawowy — modyfikowany indywidualnie na życzenie wspólnoty.';

export const DUTIES: DutyGroup[] = [
  {
    id: 'prawo',
    label: 'Prawo',
    head: 'Reprezentacja i obsługa prawna Wspólnoty',
    items: [
      'Reprezentacja wspólnoty na zewnątrz przed organami administracji państwowej i samorządowej.',
      'Reprezentacja wspólnoty przed sądami i organami egzekucyjnymi.',
      'Rejestracja Wspólnoty Mieszkaniowej w Urzędzie Statystycznym i Urzędzie Skarbowym (NIP, REGON).',
      'Opracowanie uchwał i innych aktów normatywnych wspólnoty (regulaminów, statutów).',
      'Reprezentacja wspólnoty w stosunkach pomiędzy właścicielami.',
      'Obowiązkowe ubezpieczenie OC Zarządcy.',
    ],
  },
  {
    id: 'ksiegowosc',
    label: 'Księgowość',
    head: 'Obsługa rachunkowo-księgowa',
    items: [
      'Pełna ewidencja przychodów i kosztów wspólnoty.',
      'Roczne sprawozdania finansowe i rozliczenie planu gospodarczego.',
      'Rozliczenia mediów — woda, ciepło, wywóz nieczystości.',
      'Prowadzenie rozliczeń funduszu remontowego.',
      'Windykacja należności od właścicieli lokali.',
      'Rozliczenia z Urzędem Skarbowym i ZUS.',
    ],
  },
  {
    id: 'administracja',
    label: 'Administracja',
    head: 'Obsługa administracyjna',
    items: [
      'Umowy z dostawcami wody, ciepła, energii elektrycznej i gazu.',
      'Zwoływanie i obsługa zebrań Wspólnoty Mieszkaniowej.',
      'Korespondencja z właścicielami lokali.',
      'Negocjacje warunków umów z wykonawcami i dostawcami.',
      'Prowadzenie i aktualizacja spisu właścicieli lokali.',
      'Ubezpieczenie budynku.',
    ],
  },
  {
    id: 'technika',
    label: 'Technika',
    head: 'Obsługa techniczna nieruchomości',
    items: [
      'Prowadzenie książki obiektu budowlanego.',
      'Kontrole techniczne i przeglądy okresowe budynku oraz instalacji.',
      'Usuwanie awarii i ich skutków.',
      'Przygotowanie planów remontowych.',
      'Nadzór nad pracami i odbiory wykonanych robót.',
      'Utrzymanie porządku i czystości w częściach wspólnych.',
    ],
  },
];
