# Eat, Store, Freeze, Avoid: Prototype Requirements

Nov 1, 2026

## Overview

Eat, Store, Freeze, Avoid is a free, mobile-first web app. A person types a food's name or photographs its label, then gets one plain verdict drawn only from a fixed, checked data file. Version 1 is a private prototype for the project owner to test and later show to Foodbank Victoria, OzHarvest or similar organisations.

- **Audience:** anyone in Australia. No login and no organisation branding for now.
- **Status:** private, unlisted link. Not public until a partner agrees to the use of its guidance.
- **Main goal:** ease of use. A verdict in a few taps, reliable enough to trust, with clear limits.
- **Food Finder:** built on its own first, but designed so it can later become a tab in the Campus or Community Food Finder.

### Principles

1. **The app never writes food advice.** Text recognition only reads the product name and date. Every verdict comes from the data file.
2. **No match, no answer.** If a food isn't in the data file, the app says "No verified information yet" and never guesses.
3. **Use-by is a safety rule. Best-before is a quality guide.**
4. **Every answer shows its source** and the date that source was last reviewed.
5. **Free to run:** no paid AI, no server and no database for the prototype.
6. **No personal data collected.** Photos are read on the phone and never uploaded.

## User experience

The app has three main screens: Find, Confirm and Result. A first-visit disclaimer and an About page sit alongside them.

1. **Find (home).** A search box with suggestions as you type, matching food names and everyday synonyms (for example "UHT" finds long-life milk). A large **Scan** button opens the camera: first the barcode to identify the food, then the date label. A **Browse** list shows the food categories.
2. **Confirm.** Shows the matched food, the date type and the date.
   - The photo is of the date label. Text recognition looks for "Best Before", "Use By" and a date, then pre-fills them for the user to check or correct. The food itself comes from typing or browsing; it is only pre-filled from the photo when a known synonym appears in the label text, and the user always confirms it.
   - If the date type can't be read, the user picks: Best before, Use by, No date or Not sure.
   - Two quick questions: **Opened or unopened?** and **Stored as the label says?** (for example kept in the fridge).
3. **Result.** A large verdict word with its colour and icon, so colour is never the only signal. Below it:
   - one line saying why
   - an "eat by about" date, where one applies
   - what to check
   - a freezing note
   - the source line
   - a short disclaimer
   - a "Report a problem" link.

### The verdicts

| Verdict | Colour | What the user is told |
| --- | --- | --- |
| Store | Amber | Not at its date yet. Keep it, with a storage tip. |
| Eat | Green | Past best-before but within the guidance. Eat it soon and check it looks and smells right first. |
| Freeze | Blue | Use-by is today or very close. Freeze it today if it's suitable, otherwise eat it today. |
| Avoid | Red | Past use-by, outside the guidance, damaged or not stored properly. Don't eat it. If shopping, don't buy it. |
| No verified info | Grey | We don't have checked information for this. If in doubt, throw it out. |

### Other screens and behaviour

- **First-visit disclaimer** that the user must acknowledge. It can be viewed again from the footer.
- **About page** listing every source, its last-reviewed date and how verdicts are worked out.
- **Add to home screen** and **works offline** after the first visit, so it's usable in a supermarket with poor reception.
- **Shopping line (optional for version 1):** on Eat and Freeze results, a short line for people looking at reduced items, such as "Only buy if you'll eat or freeze it by this date."

### Showing the match

When a search or label photo matches through a synonym, the result card says exactly what it was matched to, for example **"cheddar → matched to: Hard cheese (Foodbank Victoria category)"**. A **Not right?** link takes the user back to choose another category. This avoids someone acting on advice meant for a different food.

### Did you know (on opening)

Each time the app opens, a short card shows one fact about date labels before the Find screen, with **Next fact** and **Got it** buttons. A **Don't show again** option keeps it on the device only.

- Facts come from a small, sourced list in the data file, each with its source line. Examples:
  - Best-before is about quality. Use-by is about safety (FSANZ).
  - Food can still be sold after its best-before date, but not after its use-by date (FSANZ).
  - Use-by food can be frozen before its date to keep it longer, and should be used straight after thawing (Foodbank Victoria).
  - Food past its use-by date shouldn't be eaten even if it looks and smells fine (Better Health Channel).

### Quiz: Eat, Store, Freeze or Avoid?

A short quiz from the home screen, for learning and for use in workshops and pantries.

- Each question shows a **label photo** or a **text scenario**, for example "Yoghurt, best before 10 days ago, unopened, kept in the fridge". The user picks one of the four verdicts.
- The answer screen explains why, using the same rules and source line as the real result card, so the quiz can never teach something the app wouldn't say.
- Photos are the project owner's own photos of real packs, cropped to the date label with brands hidden. No stock or website images.
- 10 questions a round, drawn from a bank the project owner writes in the data file. Scores stay on the device only.

## Decision logic

Verdicts are worked out by fixed rules, checked in order, with the first match winning. When in doubt, the rules always fall back to the safer verdict.

&#91;embedded content: verdict flow · 6 checks, 5 outcomes\]

An opened food, or one missing from the data file without a use-by date, stops at No verified info. A use-by food not in the data file still gets the use-by rules, with "check the pack for freezing advice" in place of a freezing note. Damaged or badly stored food is Avoid at any point.

**Inputs:** the food's entry in the data file, the date type, the date, today's date, opened or unopened, and stored properly or not.

**Exception to rule 1:** a food not in the data file but with a use-by date skips rule 1 and goes straight to the use-by rules. Its card says "Not in our list, so these are the general use-by rules", and freezing is shown as "check the pack for freezing advice".

1. **Not in the data file:** No verified info.
2. **Not stored as the label says, or packaging damaged:** Avoid.
3. **Opened:** No verified info. The Foodbank guide covers unopened food only. This changes once a food safety source for opened products is added.
4. **No date on the pack:** No verified info.
5. **Date type "Not sure":** treat it as a use-by date.
6. **Use-by date:**
   1. Today is after the date: **Avoid**, with no exceptions and no look-and-smell advice.
   2. Today is the use-by date or the day before, and the food is marked freezable: **Freeze** ("freeze today or eat today").
   3. Today is the date and the food isn't freezable: **Eat** ("eat today").
   4. Otherwise: **Store**.
7. **Best-before date:**
   1. Today is on or before the date: **Store**.
   2. The entry allows no time past the date (for example baby food): **Avoid** once the date has passed.
   3. Today is within the date plus the entry's guidance window: **Eat**, showing "eat by about \[date + window\]".
   4. Beyond the window: **Avoid**, worded as "outside the guidance we use, so we can't say it's OK".

**Settings the project owner controls:** the freeze window (set at 1 day before the use-by date) and the wording of every verdict.

## Data and sources

All advice lives in one data file that the project owner can edit. Each entry names its source, and a higher-ranked source always overrides a lower one.

### Source ranking

| Rank | Source | Used for | Status |
| --- | --- | --- | --- |
| 1 | [FSANZ, Standard 1.2.5 Date Marking](https://www.foodstandards.gov.au/news/we-hear-you-lets-clear-confusion-around-food-date-labels) | What use-by and best-before mean | Confirmed |
| 2 | [Foodbank Victoria, Expiry and Distribution](https://www.foodbank.org.au/expiry-and-distribution/) (updated 20 Aug 2025) | Best-before windows, the use-by rule, freezing before use-by | Confirmed. Permission not yet sought |
| 3 | [Better Health Channel](https://betterhealth.vic.gov.au/health/healthyliving/food-use-by-and-best-before-dates) (Victorian Government) | Storage, look and smell checks | To review |
| 4 | Food Safety Information Council, or another Australian source the project owner finds | Opened products, leftovers, home freezer times | Project owner searching |
| 5 | OzHarvest Use It Up recipes, Foodbank Victoria recipes, Foodbank cheap recipe ideas (links below) | Rescue and use-it-up ideas | Version 1, links only |

**Also used:** [FSANZ, Storing food safely](https://www.foodstandards.gov.au/business/food-safety/storing-food-safely) (updated 1 Oct 2025) for storage basics: keep the fridge at 5°C or colder, keep frozen food frozen hard, and follow the manufacturer's instructions once a pack is opened. The page is written for food businesses, so its business time limits (such as 5 days for unpackaged ready-to-eat food) are not applied to households.

When two sources disagree, the higher rank wins and the conflict is noted in the entry. Example already found: Foodbank WA's distribution rules say use-by food can't be frozen, while Foodbank Victoria supports freezing before the use-by date. The app follows Victoria plus the government sources.

### Fields in each entry

| Field | Example | Notes |
| --- | --- | --- |
| Name | Hard cheese | Shown on the result card |
| Synonyms | cheddar, edam, tasty cheese | Used by search and text recognition |
| Group | Fresh / chilled | Used for browsing |
| Usual date type | Best before | Pre-selects the Confirm screen |
| Guidance window | 2 months | Empty means none past the date |
| Freezable | Yes / No / Unknown | Unknown means no freezing advice is shown |
| Freezer time | (empty) | Stays empty until a verified source gives it |
| Storage tip | Keep in the fridge |  |
| What to check | Mould, smell | Best-before foods only |
| Source | Foodbank Victoria | Links to the About page |
| Last reviewed | 2026-11-01 | Shown on every result |

### Version 1 coverage

- The food categories in the Foodbank Victoria guide: chilled, frozen, pantry and use-by foods. Non-food items are left out.
- A synonym list mapping everyday products to those categories, for example breakfast cereal maps to "all other shelf-stable products". **The project owner checks every mapping before it goes live.**

Draft synonym list for the project owner to check: Synonyms (draft)

### Known gaps (shown as No verified info until filled)

- Opened products
- Fresh fruit and vegetables
- Fresh milk
- Leftovers and home-cooked food
- How long food keeps once frozen at home

### Copyright and permission

The app stores Foodbank's figures as data with attribution. It doesn't copy their table or wording. The prototype stays private. Before any public release, ask Foodbank Victoria for permission or a partnership.

### Recipe ideas (Use it up)

Result cards for Eat, Store and Freeze show up to 3 recipe links matched to the food. The app links out and never copies recipe text, so the recipes stay with their owners.

- **Sources:** [OzHarvest Use It Up recipes](https://www.ozharvest.org/use-it-up/recipes/), [Foodbank Victoria recipes](https://www.foodbank.org.au/vic/recipes/) and [Foodbank cheap recipe ideas](https://www.foodbank.org.au/cheap-recipe-ideas/).
- **Curated by hand:** none of the three sites has an ingredient search, so the project owner picks recipes and tags each with the foods it uses. Each data entry gets a **Recipe links** field (title, link, source).
- **Starting size:** the two Foodbank pages list about 30 recipes between them. The OzHarvest page couldn't be checked automatically, so the project owner reviews it by hand.
- **Broken links:** a link-check script runs before each update goes live, and any dead link is hidden rather than shown.

## Safety

The app gives guidance, never guarantees, and always leans towards the safer answer.

### Wording rules

- Never say "safe". Say "Foodbank Victoria's guidance for food relief suggests…" or "is generally OK to eat until about…".
- Every result ends with "If in doubt, throw it out."
- Look-and-smell checks appear on best-before results only. On use-by results, the app states that food past its use-by date shouldn't be eaten even if it looks and smells fine (Better Health Channel).
- Avoid results for best-before food say "outside the guidance we use", not "unsafe".

### Disclaimers

- **First visit:** a short screen the user must acknowledge. It says the app is general guidance, isn't medical or legal advice, and depends on the food being unopened, undamaged and stored as labelled. It can be viewed again from the footer.
- **Every result:** a one-line disclaimer and the source line.
- **Allergies:** the app doesn't check allergens or ingredients.

### Extra care

- A standing note on every Eat and Freeze result: people who are pregnant, young children, older people and anyone with a weakened immune system should stick to the dates and check with a health professional.
- Baby food is never shown as OK past its date.
- A link to the [FSANZ food recalls page](https://www.foodstandards.gov.au/food-recalls) on the About page and every Avoid result.

### Guarding against errors

- Text recognition results are always shown for the user to confirm. They're never acted on silently.
- "Not sure" on the date type is treated as use-by.
- A food with no data entry gets No verified info, never the nearest match.
- **Before public release:** a review of the wording by a food safety professional and the partner organisation.

## Technical approach

The prototype is a static installable web app with no server and no database. It costs nothing to host and has nothing to secure.

| Part | Approach | Why |
| --- | --- | --- |
| App | Static site (for example Vite with React, or plain HTML and JavaScript), installable to the home screen | Cheapest and simplest. Claude Code can move it to Next.js and Supabase later if a partner wants it |
| Food data | One JSON file in the code repository | The project owner edits it. Every change is tracked in version history |
| Search | Fuzzy search on the phone (for example Fuse.js) over names and synonyms | Copes with typos. Free |
| Label reading | On-device text recognition (for example Tesseract.js), plus date patterns for Australian formats (DD/MM/YY, 12 MAR 26, BB, BEST BEFORE, USE BY, UB) | Free. Photos never leave the phone |
| Offline | Service worker caches the app and the data file | Works in a supermarket with weak reception |
| Hosting | Vercel or GitHub Pages, free tier | The project owner already uses Vercel and GitHub |
| Private link | Unlisted address, search engines told not to index it | Fine for a prototype with no personal data. Proper access control comes later if needed |
| Code ownership | The project owner's own GitHub account, separate from DUSA | Personal project, unbranded |

### Privacy and accessibility

- No accounts, cookies or tracking. No personal data stored.
- "Report a problem" opens an email for now. An anonymous log of searches that found nothing comes in a later phase.
- Meets WCAG 2.2 AA: verdicts shown as words and icons, not colour alone, with large tap targets and screen reader labels.

### Barcodes

Barcode lookup uses Open Food Facts (decided), a free, open product database with an Australian section. It's part of version 1. Lookups need a connection; offline, the app falls back to typing the food. Barcodes identify the product, not its date, so the date still comes from the label photo.

1. The user scans the barcode. The app looks it up in Open Food Facts and gets the product name, brand and category.
2. The app maps that to a Foodbank Victoria category through the synonym list and shows the suggestion: "Matched to: Yoghurts and dips".
3. **The user always confirms or changes the food type.** If the barcode isn't found, or the match is wrong, an **Add food type** button lets them pick from the category list or search by name.
4. A food type the user picks is remembered on that phone for that barcode, so the next scan is instant. Nothing is sent anywhere.
5. A **Suggest a fix** link lets users report a wrong or missing match to the project owner by email, so the synonym list improves over time.

**Licence:** Open Food Facts data is under the Open Database Licence, so the app credits it ("Product data from Open Food Facts") on results and the About page.

**Why not GS1 or FoodSwitch:** GS1 Australia's verified data needs GS1 membership and has no open API. FoodSwitch (The George Institute) is licensed. Both are worth raising later in partnership talks.

## Scope, next steps and testing

### Not in version 1

Translations, accounts, reminders, live supermarket specials, paid AI, non-food items and copying recipe text into the app.

### Later phases

1. **Phase 2:** add the Australian food safety source (opened products, leftovers, home freezer times), a "buying on special without wasting it" guide.
2. **Phase 3:** partner branding (Foodbank Victoria, OzHarvest or similar), public release, a tab in the Food Finder, an anonymous log of missed searches, and a yearly source review.

### Open questions

- [ ] Find an Australian source for opened products, leftovers and freezer times (project owner)
- [ ] Freeze window: 1 day before the use-by date (decided)
- [ ] Write and check the synonym list mapping everyday foods to Foodbank categories
- [ ] Ask the food insecurity network whether anyone has built something similar
- [ ] Approach Foodbank Victoria or OzHarvest about permission or a partnership
- [ ] Name: Eat, Store, Freeze, Avoid (decided)
- [ ] Any food with a use-by date gets the use-by rules even when it isn't in the data file (decided)

### Acceptance tests for the prototype

- [ ] Searching "pasta" with a best-before date 3 months ago returns **Eat**, an "eat by about" date and the Foodbank Victoria source line
- [ ] Any food with yesterday's use-by date returns **Avoid**, with no look-and-smell advice
- [ ] A food not in the data file returns **No verified info**
- [ ] "Opened" returns **No verified info** in version 1
- [ ] Baby food one day past its best-before returns **Avoid**
- [ ] A photo of a label reading "BEST BEFORE 12 MAR 26" pre-fills the date type and date for confirmation
- [ ] After the first visit, the app works with the phone in flight mode
- [ ] No photo or search is sent over the network; only a scanned barcode number goes to Open Food Facts (checked in the browser's network tab)
- [ ] Every result shows a source and last-reviewed date
- [ ] First-visit disclaimer must be acknowledged before the first search

* [ ] Scanning a barcode that Open Food Facts knows suggests a food type with "Matched to:"; an unknown barcode opens Add food type
* [ ] A food type picked for a barcode is remembered on that phone for the next scan

## Build order for Claude Code

Build in this order, and stop to show the project owner after steps 3, 5 and 7.

1. **Set up:** a static site in a repository on the project owner's own GitHub, deployed free on Vercel, with search engines told not to index it.
2. **Data file:** built only from the Source data tab, the Synonyms tab (every row flagged as needing a check), the Did you know facts and the Quiz bank tab. No figure from anywhere else.
3. **Decision rules:** a separate module with automated tests covering every rule and every acceptance test. Run the tests before building any screen.
4. **Find and Confirm screens,** with typing and browsing first.
5. **Date label reading** on the phone, always shown for the user to confirm.
6. **Barcode lookup** through Open Food Facts, with Add food type and the on-phone memory of picked food types.
7. **Result card,** Did you know card, first-visit disclaimer and About page.
8. **Quiz.**
9. **Finishing:** offline use, add to home screen, accessibility check against WCAG 2.2 AA, and the recipe link checker.
10. **The project owner tests** on their own phone against the acceptance tests.

### Opening prompt for Claude Code

```
Read REQUIREMENTS.md in this folder, including every tab: the main spec, Source data, Synonyms (draft) and Quiz bank (draft).

Before writing any code, give me a plan in plain English: the files you'll create, the build steps in the order set out under "Build order for Claude Code", and a list of anything in the requirements that is unclear or contradictory.

Rules:
- Never invent food safety figures. Every timeframe comes from the Source data tab. Anything not covered shows "No verified info".
- I'm a non-technical project owner, so explain your reasoning as you go.
- Use Australian spelling in everything users see, and no em dashes.

Wait for my OK before starting.
```

**Handing over:** export this doc to Markdown, check the export includes all four tabs, and save it in the project folder as REQUIREMENTS.md.

## Decisions made after the first review (1 Nov 2026)

These override anything above that disagrees.

1. No personal names appear in the app, the data file or the code.
2. Code lives in its own repository, `eat-store-freeze-avoid`.
3. Look: no branding. Styled like a printed date label, such as the dot-matrix print on the top of a milk carton.
4. "Report a problem" and "Suggest a fix" links are left out for now.
5. The Confirm screen asks a third question: "Is the pack damaged, swollen or leaking?" Yes means Avoid.
6. A use-by date always gets the use-by rules, whatever category the food is matched to. A best-before date on a use-by category is treated as "up to the date only".
7. A use-by food on its date whose freezing is unknown gets Eat ("eat today, check the pack for freezing advice"). The day before, it gets Store.
8. "Not sure" on a food that isn't in the list gets the general use-by rules.
9. Unchecked synonyms work in the private prototype but show "match not yet checked". Before a public release, only checked synonyms work.
10. Freezing advice is given only for prepacked fresh meat, fish and ready-to-eat meals (Foodbank Victoria). Every other category is Unknown. Storage tips stay generic and sourced (FSANZ) until sourced ones are added. The unsourced "bagged salad: not suitable for freezing" note is removed.
11. Better Health Channel items are included with a "to review" flag until the page is checked.
12. Choosing "Opened" stops straight away with a message: we can't help with opened food yet; follow the packaging; past its use-by date, don't eat it; if in doubt, throw it out. (The rule for opened food is unchanged.)
13. "Is it opened?" is the first of the three quick questions, below the food and the date, so it isn't skipped after a barcode scan. Choosing Opened stops there with the packaging message.
14. The "Not sure" date type is removed from the screen. The options are Best before, Use by, and "No date, or can't tell", with a hint on how to tell them apart. "Can't tell" gives No verified info (more cautious than treating it as use-by). The rules still accept "Not sure" as use-by, unused.
15. Unchecked matches say: "Note: the matched category was linked by AI and hasn't yet been checked by a human. Proceed with caution." The About page says AI drafted the links between food names, barcodes and categories.
