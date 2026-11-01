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
