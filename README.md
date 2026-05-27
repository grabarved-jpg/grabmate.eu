# Arvegeneraator

Lihtne Next.js arvegeneraator Eesti ettevõtetele. Rakendus ei kasuta andmebaasi ega salvesta sisestatud andmeid.

## Funktsioonid

- Arve koostaja ja arve saaja otsing Äriregistri autocomplete teenusest
- Automaatne nime, registrikoodi ja aadressi täitmine
- Arveread koguse, ühiku, hinna ja KM 24% valikuga
- Arve eelvaade samal ekraanil
- PDF salvestamine brauseri print dialoogi kaudu

## Käivitamine

Paigalda esmalt Node.js ja siis käivita projekti kaustas:

```bash
npm install
npm run dev
```

Seejärel ava:

```text
http://localhost:3000
```

## Äriregister

Autocomplete päring käib läbi Next.js API route'i:

```text
/api/company-search?q=ettevotte-nimi
```

See proxy kasutab ametlikku avalikku teenust:

```text
https://ariregister.rik.ee/est/api/autocomplete?q=...
```

Proxy on vajalik, et brauseri CORS piirangud ei segaks.

## Deploy

Soovitatav tee on Vercel:

1. Loo GitHub repo ja pushi projekt sinna.
2. Vercelis vali `New Project`.
3. Vali GitHub repo.
4. Deploy.
5. Lisa Verceli `Settings -> Domains` all `grabmate.eu`.
6. Lisa Zone DNS-i Verceli näidatud A või CNAME kirje.
