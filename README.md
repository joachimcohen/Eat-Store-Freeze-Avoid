# Eat, Store, Freeze, Avoid

A free, mobile-first web app. Type a food's name or photograph its date label, and get one plain verdict: **Eat**, **Store**, **Freeze**, **Avoid** or **No verified info**. Every answer comes from one checked data file and shows its source.

Private prototype. Not for public use until a partner organisation agrees to the use of its guidance.

## Where things are

| What | Where |
| --- | --- |
| Requirements and decisions | `docs/REQUIREMENTS.md` (decisions at the bottom) |
| Source data, synonyms and quiz drafts | `docs/` |
| **All food advice** (categories, synonyms, facts, quiz, every piece of wording) | `src/data/foods.json` |
| The decision rules | `src/rules/verdict.ts` |
| Automated tests | `src/**/*.test.ts` |

## Editing the data file

`src/data/foods.json` is the only place advice lives. Every category, synonym, fact and quiz question has `"checked": false`. Change it to `true` once you've checked it against its source. The tests confirm that:

- every guidance window matches `docs/Source_data.md` exactly
- every quiz answer is what the app itself would say, on any day of the year
- no text says "safe", uses an em dash or includes a personal name

## Commands

```bash
npm install
npm test        # run all the checks
npm run dev     # run the app on this computer
npm run build   # build for hosting
```

## Hosting

This is a static site, so Vercel hosts it for free. `vercel.json`, `public/robots.txt` and a meta tag tell search engines not to index it.

Open Food Facts product data is used under the Open Database Licence.

## Entering dates

Dates are typed into Day / Month / Year boxes, in the order Australian packs print them, and shown back in words ("That's Thursday 5 November 2026"). The phone's own date box isn't used: it follows the phone's language and can be month-first. "Today" is the phone's own date in its own time zone (tested for Melbourne, Brisbane and Perth, including daylight saving).

## Reading date labels (switched off)

Set `settings.dateScanner` to `true` in the data file to bring it back.


The main way is the live date viewfinder: the person fits the date inside a thin box, and the app reads just that strip from the camera at full detail (contrast stretched, a local cut-off that copes with glare, and dot-matrix dots joined), frame after frame, until two readings agree. Torch and zoom buttons appear where the phone supports them. A photo is the fallback:


Photos are read on the phone by Tesseract (text recognition running in the browser). Its files are copied into `public/ocr` by `scripts/copy-ocr-files.mjs` before each build, so nothing is fetched from elsewhere. Each photo is read four ways (plain, and with the dots of dot-matrix print joined by three amounts), and the date most readings agree on is pre-filled. On a tie the earlier date and use-by are chosen. The person always checks the result.

## Install on a phone

Open the site link on the phone, then:

- **iPhone (Safari):** tap Share, then **Add to Home Screen**.
- **Android (Chrome):** tap the ⋮ menu, then **Add to Home screen** (or **Install app**).

After the first visit it works offline. While prototyping it always loads the newest version when there is a connection.

## Barcodes

Scanning reads the barcode on the phone (zxing-wasm, served from this app). Only the barcode number is sent, to Open Food Facts, to get the product name and categories. The app then offers up to three likely food types to tap ("Is it one of these?"), using `offCategories` in the data file first and the synonyms second; frozen products only match frozen categories. The person always confirms, and their choice is remembered for that barcode on that phone only.

## Before each update goes live

```bash
npm test               # all rule, data and wording checks
npm run check-links    # checks every recipe link
npm run check-links -- --fix   # hides links that are gone (404 or 410)
```

## Acknowledgements

This tool was created on the lands of the Wurundjeri Woi-wurrung people of the Kulin Nation in Melbourne. We acknowledge them as the Traditional Owners and pay our respects to their Elders past and present.

It was created with the support of AI (Claude, by Anthropic), which helped write the code and draft the wording. The answers in the app don't come from AI: they come from fixed rules and the checked data file.
