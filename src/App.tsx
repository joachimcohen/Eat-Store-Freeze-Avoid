import { useCallback, useEffect, useRef, useState } from 'react'
import { Carton } from './components/Carton'
import { CAP_COLOURS } from './components/verdictStyle'
import { data } from './data'
import { emptyDraft, type Draft } from './draft'
import { combineReadings } from './lib/label'
import { readLabelTexts } from './lib/ocr'
import { foodFromLabelText, type FoodChoice } from './lib/search'
import { lookupProduct, matchProduct, rememberedFood, rememberFood } from './lib/products'
import { localToday } from './rules/dates'
import { decideVerdict } from './rules/verdict'
import { Confirm } from './screens/Confirm'
import { Find } from './screens/Find'
import { Quiz } from './screens/Quiz'
import { Result } from './screens/Result'
import { RulesCheck } from './screens/RulesCheck'
import { Scan } from './screens/Scan'
import { About } from './screens/About'
import { DidYouKnow, Disclaimer } from './screens/Intro'
import { prefs } from './lib/prefs'

type Screen = 'find' | 'scan' | 'confirm' | 'result' | 'rules' | 'quiz' | 'disclaimer' | 'disclaimer-again' | 'fact' | 'about'

export default function App() {
  const [screen, setScreenState] = useState<Screen>(() => {
    // The disclaimer must be accepted before anything else.
    if (!prefs.disclaimerAccepted()) return 'disclaimer'
    if (location.hash === '#rules') return 'rules'
    if (location.hash === '#quiz') return 'quiz'
    if (location.hash === '#about') return 'about'
    return prefs.factsHidden() ? 'find' : 'fact'
  })
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const photoRun = useRef(0)
  const main = useRef<HTMLDivElement>(null)

  // Phone back button moves between screens.
  const go = useCallback((next: Screen) => {
    history.pushState({ screen: next }, '', next === 'rules' || next === 'quiz' || next === 'about' ? `#${next}` : location.pathname)
    setScreenState(next)
  }, [])
  useEffect(() => {
    const onPop = (e: PopStateEvent) => setScreenState((e.state?.screen as Screen) ?? 'find')
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  // Move focus to the new screen's heading, for screen readers.
  useEffect(() => {
    main.current?.querySelector<HTMLElement>('h1')?.focus()
    scrollTo(0, 0)
  }, [screen])

  const update = (d: Partial<Draft>) =>
    setDraft((old) => {
      // A food type chosen after scanning a barcode is remembered on this phone.
      if (d.food && old.barcode && old.barcode.status !== 'looking') rememberFood(old.barcode.code, d.food)
      return { ...old, ...d }
    })

  const scanned = useCallback(async (code: string) => {
    photoRun.current++
    const remembered = rememberedFood(code)
    if (remembered) {
      setDraft({ ...emptyDraft, food: remembered, dateType: remembered.usualDateType, barcode: { status: 'remembered', code, food: remembered } })
      go('confirm')
      return
    }
    setDraft({ ...emptyDraft, barcode: { status: 'looking', code } })
    go('confirm')
    const r = await lookupProduct(code)
    setDraft((d) => {
      if (d.barcode?.code !== code) return d
      if (r.status !== 'found') return { ...d, barcode: { status: r.status, code } }
      return { ...d, barcode: { status: 'found', code, name: r.product.name, brand: r.product.brand, suggestion: matchProduct(r.product) } }
    })
  }, [go])

  const startAgain = () => {
    photoRun.current++
    setDraft(emptyDraft)
    go('find')
  }

  const pickFood = (food: FoodChoice) => {
    setDraft({ ...emptyDraft, food, dateType: food.usualDateType })
    go('confirm')
  }

  const readPhoto = async (file: File) => {
    const run = ++photoRun.current
    setDraft((d) => ({ ...d, label: { status: 'reading', progress: 0 } }))
    if (screen !== 'confirm') go('confirm')
    try {
      const texts = await readLabelTexts(file, (progress) => {
        if (run === photoRun.current) setDraft((d) => (d.label.status === 'reading' ? { ...d, label: { status: 'reading', progress } } : d))
      })
      if (run !== photoRun.current) return
      const reading = combineReadings(texts, localToday())
      const suggestedFood = foodFromLabelText(texts.join('\n'))
      setDraft((d) => ({
        ...d,
        label: { status: 'done', reading, suggestedFood },
        // Pre-fill only; the person checks these on the Confirm screen.
        dateType: reading.dateType ?? d.dateType,
        date: reading.date ?? d.date,
      }))
    } catch {
      if (run === photoRun.current) setDraft((d) => ({ ...d, label: { status: 'failed' } }))
    }
  }

  const result = draft.food && draft.dateType
    ? decideVerdict({
        category: draft.food.category,
        dateType: draft.dateType,
        date: draft.date || null,
        today: localToday(),
        opened: draft.opened === 'opened',
        storedProperly: draft.stored === 'yes',
        damaged: draft.damaged === 'yes',
        freezeWindowDays: data.settings.freezeWindowDays,
      })
    : null

  const cap = screen === 'result' && result ? CAP_COLOURS[result.verdict] : CAP_COLOURS.default

  return (
    <Carton
      capColour={cap}
      onHome={startAgain}
      footer={screen === 'disclaimer' ? <p>Private prototype. General guidance only.</p> :
        <>
          <p>Private prototype. General guidance only.</p>
          <p className="mt-2">
            <FooterLink onClick={() => go('about')}>About and sources</FooterLink>
            <span aria-hidden="true"> · </span>
            <FooterLink onClick={() => go('disclaimer-again')}>Disclaimer</FooterLink>
            <span aria-hidden="true"> · </span>
            <FooterLink onClick={() => go('rules')}>Rules check</FooterLink>
          </p>
        </>
      }
    >
      <div ref={main}>
        {screen === 'find' && <Find onPick={pickFood} onPhoto={readPhoto} onScan={() => go('scan')} onQuiz={() => go('quiz')} />}
        {screen === 'scan' && <Scan onCode={scanned} onSkip={() => go('find')} />}
        {screen === 'confirm' && <Confirm draft={draft} update={update} onPhoto={readPhoto} onSubmit={() => go('result')} />}
        {screen === 'result' && result && draft.food && (
          <Result result={result} food={draft.food} fromBarcode={draft.barcode !== null} onChange={() => go('confirm')} onNotRight={() => { update({ food: null }); go('confirm') }} onAgain={startAgain} />
        )}
        {screen === 'result' && !result && <Find onPick={pickFood} onPhoto={readPhoto} onScan={() => go('scan')} onQuiz={() => go('quiz')} />}
        {screen === 'rules' && <RulesCheck />}
        {screen === 'quiz' && <Quiz onDone={startAgain} />}
        {screen === 'disclaimer' && <Disclaimer onAccept={() => { prefs.acceptDisclaimer(); setScreenState(prefs.factsHidden() ? 'find' : 'fact') }} />}
        {screen === 'disclaimer-again' && <Disclaimer again onAccept={() => history.back()} />}
        {screen === 'fact' && <DidYouKnow onDone={() => setScreenState('find')} />}
        {screen === 'about' && <About onShowDisclaimer={() => go('disclaimer-again')} onShowFacts={() => go('fact')} />}
      </div>
    </Carton>
  )
}

function FooterLink({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="inline-flex min-h-11 items-center underline underline-offset-4">{children}</button>
}
