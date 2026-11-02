import { useCallback, useEffect, useRef, useState } from 'react'
import { Carton } from './components/Carton'
import { CAP_COLOURS } from './components/verdictStyle'
import { data } from './data'
import { emptyDraft, type Draft } from './draft'
import { combineReadings } from './lib/label'
import { readLabelTexts } from './lib/ocr'
import { foodFromLabelText, type FoodChoice } from './lib/search'
import { localToday } from './rules/dates'
import { decideVerdict } from './rules/verdict'
import { Confirm } from './screens/Confirm'
import { Find } from './screens/Find'
import { Quiz } from './screens/Quiz'
import { Result } from './screens/Result'
import { RulesCheck } from './screens/RulesCheck'

type Screen = 'find' | 'confirm' | 'result' | 'rules' | 'quiz'

export default function App() {
  const [screen, setScreenState] = useState<Screen>(() => (location.hash === '#rules' ? 'rules' : location.hash === '#quiz' ? 'quiz' : 'find'))
  const [draft, setDraft] = useState<Draft>(emptyDraft)
  const photoRun = useRef(0)
  const main = useRef<HTMLDivElement>(null)

  // Phone back button moves between screens.
  const go = useCallback((next: Screen) => {
    history.pushState({ screen: next }, '', next === 'rules' || next === 'quiz' ? `#${next}` : location.pathname)
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

  const update = (d: Partial<Draft>) => setDraft((old) => ({ ...old, ...d }))

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
      footer={
        <>
          <p>Private prototype. General guidance only.</p>
          <p className="mt-2">
            <a href="#rules" onClick={(e) => { e.preventDefault(); go('rules') }} className="underline underline-offset-4">Rules check (prototype)</a>
          </p>
        </>
      }
    >
      <div ref={main}>
        {screen === 'find' && <Find onPick={pickFood} onPhoto={readPhoto} onQuiz={() => go('quiz')} />}
        {screen === 'confirm' && <Confirm draft={draft} update={update} onPhoto={readPhoto} onSubmit={() => go('result')} />}
        {screen === 'result' && result && draft.food && (
          <Result result={result} food={draft.food} onChange={() => go('confirm')} onAgain={startAgain} />
        )}
        {screen === 'result' && !result && <Find onPick={pickFood} onPhoto={readPhoto} onQuiz={() => go('quiz')} />}
        {screen === 'rules' && <RulesCheck />}
        {screen === 'quiz' && <Quiz onDone={startAgain} />}
      </div>
    </Carton>
  )
}
