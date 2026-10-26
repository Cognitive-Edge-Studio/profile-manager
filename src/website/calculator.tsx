'use client'
// Ported from the existing site; approved copy is unchanged.
import { useEffect, useRef, useState } from 'react'
import { Link, useWebsiteRuntime } from './runtime'
import type { ArticleSummary } from './types'
import { ArrowLeft, ArrowRight, ArrowUpRight, Calculator, Check, ChevronDown, CircleHelp, Clock3, Copy, Download, FileText, Layers3, Plus, Printer, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { Button } from './components/ui/button'
import { CalendlyIcon } from './components/calendly-icon'
import { ArticleArt } from './components/article-art'
import { activeItems, amount, budgetSummary, calculateBudget, examplePlan, features, initialPlan, MODEL_VERSION, money, range, reviewFlags, type CostEntry, type Plan } from '../lib/mvp-budget'



let memoryPlan: Plan | null = null
let memoryStep = 0
const steps = ['Your idea', 'What to build', 'Your costs', 'Review & compare']
const readingDescriptions: Record<string, string> = {
  'mvp-feature-prioritization': 'Choose what to build now and what can wait.',
  'how-to-build-an-mvp': 'Plan your first version with one developer.',
}

function NumberField({ label, value, onChange, placeholder = 'Still to check', invalid = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; invalid?: boolean }) {
  return <label className="calc-number"><span>{label}</span><input type="number" inputMode="decimal" min="0" max="100000000" step="0.01" value={value} placeholder={placeholder} onChange={event => onChange(event.target.value)} aria-invalid={invalid || undefined} /></label>
}

export function CalculatorIntro({ heading, lead }: { heading: string; lead: string }) {
  return <header className="calc-hero">
    <div><p className="eyebrow"><Calculator size={15} /> A little help with your next idea</p><h1>{heading}<br /><span>Plan your first version</span></h1><p className="calc-lead">{lead}</p><div className="calc-trust"><span><Check size={15} /> Free, no email needed</span><span><Check size={15} /> See how it adds up</span></div></div>
    <div className="calc-intro-note"><span className="calc-note-icon"><FileText size={24} strokeWidth={1.5} /></span><p>What do you need to build?<br /><strong>Let’s put the costs together</strong></p><p>Use costs you’ve been given, or enter hours and an hourly price. If you need a quote from Shibly, share your plan so he can review the work with you.</p><a href="#how-it-works">How does this work? <ArrowRight size={15} /></a></div>
  </header>
}

export function CalculatorMethodology() {
  return <section id="how-it-works" className="calc-method">
    <div className="calc-method-heading"><p className="eyebrow">Questions you might have</p><h2>Let’s make sense of<br />your budget</h2><p>Here’s how the numbers add up, what they include, and what you may still need to ask a developer.</p><Link className="text-link" to="/blog/mvp-development-cost/">Read the MVP development cost guide <ArrowUpRight size={15} /></Link></div>
    <div className="calc-method-details">
      <details open><summary>What is an MVP cost calculator?<ChevronDown size={18} /></summary><p>An MVP, or minimum viable product, is a first version with enough features for people to use and give you feedback. An MVP cost calculator helps you plan what it might cost to build and run that version. This one adds up the costs or hours you enter. You can compare a smaller version and see which costs still need checking. A quote from a developer comes after a review of the work.</p></details>
      <details><summary>How does it work out my build cost?<ChevronDown size={18} /></summary><p>It adds the lower and higher amounts you enter for each part of the build. If you enter hours, it multiplies them by your hourly price. Leave the higher amount blank if you have one fixed amount. Choose “Already included” for work covered by another amount you’ve entered, so you don’t count it twice.</p></details>
      <details><summary>What if I don’t know the costs yet?<ChevronDown size={18} /></summary><p>That’s fine. Leave them blank and they’ll stay marked “Still to check.” You can download your plan and take the missing questions to a developer. The total stays marked incomplete until every cost is filled in or covered by another amount.</p></details>
      <details><summary>What about costs after launch?<ChevronDown size={18} /></summary><p>Add the bills you expect once people start using your product, such as hosting to keep it online, paid tools, and support. Monthly amounts repeat for the number of months you choose. “Pay once” amounts are added once during that time. For a yearly bill due during those months, choose “Pay once.” Check what your quote already covers before adding the same cost again.</p></details>
      <details><summary>How can I compare a smaller version?<ChevronDown size={18} /></summary><p>Choose a feature you could leave for later. If you entered a separate cost for it, that amount comes out of the smaller build budget. Costs for the rest of the build stay the same. If the feature is included in another amount, you’ll need a new estimate to know the saving. Also check whether the smaller version needs different tools or more work from you or your team.</p></details>
      <details><summary>Can I use this as a final quote?<ChevronDown size={18} /></summary><p>Use it as a starting point for a conversation. The numbers come from what you enter, and the final cost could fall outside your range. Share your plan with Shibly to review the work, open questions, timing, and price. You’ll also need to check taxes, payment dates, and any costs your quote leaves out.</p></details>
      <details><summary>Will my answers be saved or sent?<ChevronDown size={18} /></summary><p>Your answers stay while you move between pages on this site. Refreshing or closing the page clears them, so download a summary if you want to keep it. “Talk about my project” puts your summary in the contact form for you to review and edit. It sends nothing until you send the message. Booking a call on Calendly is separate.</p></details>
    </div>
  </section>
}

export default function MvpCalculator({ readingArticles, heading: pageHeading, lead }: { readingArticles: ArticleSummary[]; heading: string; lead: string }) {
  const { profile } = useWebsiteRuntime()
  const [plan, setPlan] = useState<Plan>(() => memoryPlan ?? initialPlan())
  const [step, setStep] = useState(memoryStep)
  const [notice, setNotice] = useState('')
  const heading = useRef<HTMLHeadingElement>(null)
  const previousStep = useRef(step)
  useEffect(() => { memoryPlan = plan; memoryStep = step }, [plan, step])
  useEffect(() => {
    if (previousStep.current !== step) { heading.current?.focus(); previousStep.current = step }
  }, [step])
  const budget = calculateBudget(plan)
  const smaller = calculateBudget(plan, true)
  const flags = reviewFlags(plan)
  const deferred = features.filter(feature => plan.choices[feature.id] === 'now' && plan.defer.includes(feature.id))
  const now = features.filter(feature => plan.choices[feature.id] === 'now')
  const hasOperating = budget.expenses.some(expense => expense.value !== null)
  const update = <K extends keyof Plan>(key: K, value: Plan[K]) => { setPlan(current => ({ ...current, [key]: value })); setNotice('') }
  const updateCost = (id: string, value: Partial<CostEntry>) => setPlan(current => ({ ...current, costs: { ...current.costs, [id]: { ...current.costs[id], ...value } } }))
  const displayBuild = (result = budget) => result.hasKnown ? range(result.low, result.high, plan.currency) : 'Still to check'
  const reset = () => { setPlan(initialPlan()); setStep(0); setNotice('A fresh plan is ready.'); }
  const loadExample = () => { setPlan(examplePlan()); setStep(0); setNotice('Example loaded. All amounts are made up.'); }
  const download = () => {
    const blob = new Blob([budgetSummary(plan)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url; anchor.download = 'mvp-first-release-budget.txt'; anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
    setNotice('Your summary is downloaded, including the costs you still need to check.')
  }
  const copy = async () => {
    try { await navigator.clipboard.writeText(budgetSummary(plan)); setNotice('Summary copied.') }
    catch { setNotice('Copy is unavailable in this browser. Use Download summary to keep a copy.'); }
  }
  const changeMode = (mode: Plan['mode']) => {
    if (mode === plan.mode) return
    setPlan(current => ({ ...current, mode, rate: '', costs: initialPlan().costs }))
    setNotice('Your build amounts have been cleared for this way of calculating. Your running costs are still there.')
  }
  const changeCurrency = (currency: Plan['currency']) => {
    if (currency === plan.currency) return
    setPlan(current => ({ ...current, currency, rate: '', costs: initialPlan().costs, expenses: current.expenses.map(expense => ({ ...expense, amount: '' })) }))
    setNotice('Your amounts have been cleared. Add them in the new currency; they haven’t been converted.')
  }
  return <div className="mvp-tool container">
    <p className="breadcrumb calc-breadcrumb"><Link to="/">Home</Link><span>/</span>MVP cost calculator</p>
    <CalculatorIntro heading={pageHeading} lead={lead} />
    <div className="calc-workspace-head"><div><p className="eyebrow">Your plan for the first version</p><p>Four steps. One budget you can review.</p></div><div className="calc-workspace-actions"><button onClick={loadExample}><Sparkles size={15} />Try an example</button><button onClick={reset}><RotateCcw size={14} />Start fresh</button></div></div>
    {plan.example && <div className="calc-example" role="note"><Sparkles size={18} /><p><strong>This is a made-up example</strong> These amounts show how the calculator works. They aren’t Shibly’s prices. Start fresh to use your own figures.</p><button onClick={reset}>Use my own project <ArrowRight size={14} /></button></div>}
    <div className="calc-workspace" id="planner">
      <section className="calc-form-card" aria-label="MVP budget planner">
        <nav className="calc-steps" aria-label="Calculator steps">{steps.map((name, index) => <button key={name} onClick={() => setStep(index)} aria-current={step === index ? 'step' : undefined}><span>{index < step ? <Check size={14} /> : index + 1}</span><span>{name}</span></button>)}</nav>
        <div className="calc-step-body">
          <div className="calc-step-heading"><span>Step {step + 1} of 4</span><h2 tabIndex={-1} ref={heading}>{['What should your first version do?', 'What do you need in the first version?', 'What costs do you know so far?', 'Let’s review your budget'][step]}</h2><p>{['What should someone be able to do with your product? It’s fine if you haven’t worked out every detail.', 'Choose what the app needs to do now, what your team can do by hand, and what can wait.', 'Add amounts from a quote, or use your own hours and hourly price. Leave anything you don’t know blank.', 'Check what’s included and what’s missing. Then see whether a smaller version could work for you.'][step]}</p></div>
          {step === 0 && <div className="calc-fields">
            <label>Project name <span className="calc-optional">Optional</span><input value={plan.project} maxLength={100} onChange={event => update('project', event.target.value)} placeholder="e.g. A wholesale order portal" /></label>
            <label>Who is the first version for?<input value={plan.user} maxLength={240} onChange={event => update('user', event.target.value)} placeholder="e.g. Existing customers and a staff member" /></label>
            <label>What’s the one task they need to complete?<textarea value={plan.task} maxLength={600} onChange={event => update('task', event.target.value)} placeholder="e.g. Submit an order request and receive confirmation." rows={3} /><small>For example, a customer could place an order and get confirmation.</small></label>
            <div className="calc-field-pair"><label>Where will people use it?<select value={plan.platform} onChange={event => update('platform', event.target.value)}>{['Website (desktop and mobile)', 'Mobile app', 'Website + mobile app', 'Not sure yet'].map(value => <option key={value}>{value}</option>)}</select></label><label>Who needs access to the app?<select value={plan.roles} onChange={event => update('roles', event.target.value)}>{['Not sure yet', 'One group of users', 'Customers + staff', 'Buyers + sellers + staff', 'Something else'].map(value => <option key={value}>{value}</option>)}</select></label></div>
            <label>What are you starting with?<select value={plan.readiness} onChange={event => update('readiness', event.target.value)}>{['Just an idea', 'Rough sketches or layouts', 'Finished screen designs', 'Some code or a working product'].map(value => <option key={value}>{value}</option>)}</select></label>
            <label>Is there an important date? <span className="calc-optional">Optional</span><input value={plan.deadline} maxLength={200} onChange={event => update('deadline', event.target.value)} placeholder="The date and why it matters" /><small>Add a date to discuss with your developer. The calculator can’t tell you when the build will be ready.</small></label>
          </div>}
          {step === 1 && <div className="calc-fields">
            <div className="calc-core-note"><Layers3 size={18} /><p><strong>Keep the main task in your plan</strong> {plan.task || 'Add the main task in step 1, then choose the features you need to make it work.'}</p></div>
            <div className="calc-feature-list">{features.map(feature => <fieldset key={feature.id} className="calc-feature"><legend>{feature.title}</legend><p>{feature.description}</p><div className="calc-segment" role="group" aria-label={`${feature.title} choice`}>{(['now', 'manual', 'later'] as const).map(choice => <button key={choice} type="button" aria-pressed={plan.choices[feature.id] === choice} onClick={() => update('choices', { ...plan.choices, [feature.id]: choice })}>{choice === 'now' ? 'Build now' : choice === 'manual' ? 'Do by hand' : 'Later'}</button>)}</div></fieldset>)}</div>
            <label>Any tools, data, or questions to check? <span className="calc-optional">Optional</span><textarea value={plan.dependencies} maxLength={700} onChange={event => update('dependencies', event.target.value)} rows={3} placeholder="Does it need to connect to another tool, use existing records, or handle private information? What are you unsure about?" /><small>A developer will need to check existing designs, code, and other tools before saying how much work they can save.</small></label>
          </div>}
          {step === 2 && <div className="calc-fields">
            <div className="calc-basis-head"><label>Currency<select value={plan.currency} onChange={event => changeCurrency(event.target.value as Plan['currency'])}>{['USD', 'GBP', 'EUR', 'BDT'].map(value => <option key={value}>{value}</option>)}</select></label><p>Use one currency for all amounts. Changing it clears your amounts so you can enter them again.</p></div>
            <fieldset className="calc-basis"><legend>How would you like to enter build costs?</legend><div className="calc-mode-options"><button aria-pressed={plan.mode === 'cost'} onClick={() => changeMode('cost')}><FileText size={19} /><strong>I have cost estimates</strong><span>Add amounts from a quote or your own plan.</span></button><button aria-pressed={plan.mode === 'hours'} onClick={() => changeMode('hours')}><Calculator size={19} /><strong>I have hours and an hourly price</strong><span>Multiply the hours by a price per hour.</span></button></div><p>Switching between these options clears your build amounts. You’ll need to enter your own hours and prices.</p></fieldset>
            {plan.mode === 'hours' && <div className="calc-rate"><NumberField label={`Your hourly price (${plan.currency}/hour)`} value={plan.rate} onChange={value => update('rate', value)} invalid={!!plan.rate && (amount(plan.rate) === null || amount(plan.rate) === 0)} /><p>Use an hourly price you’ve been given or want to compare. Enter an amount above 0. Shibly’s rates aren’t filled in here.</p></div>}
            <div className="calc-section-label"><h3>Building your product</h3><span>{plan.mode === 'hours' ? 'Hours for each part' : `Amounts in ${plan.currency}`}</span></div>
            <p className="calc-field-help">Add each cost separately. If you have one quote for the whole build, put it under Main feature & setup and mark the covered items “Already included.” Leave the higher amount blank if you have one fixed amount.</p>
            <div className="calc-cost-list">{activeItems(plan).map(item => {
              const entry = plan.costs[item.id]
              const error = budget.rows.find(row => row.id === item.id)?.error
              return <div className="calc-cost-row" key={item.id}><div className="calc-cost-label"><h4>{item.title}</h4><p>{item.description}</p></div><label className="calc-cost-status"><span>{item.title} treatment</span><select value={entry.status} onChange={event => updateCost(item.id, { status: event.target.value as CostEntry['status'] })}><option value="unknown">Still to check</option><option value="entered">Add an amount</option><option value="included">Already included</option><option value="none">Not needed</option></select></label>{entry.status === 'included' || entry.status === 'none' ? <p className="calc-included">{entry.status === 'included' ? 'Another amount you entered covers this work. Add a note saying which one.' : 'You’ve left this work out. Check that people can still do what they need to do.'}</p> : <div className="calc-range-fields"><NumberField label={`${item.title} — lower${plan.mode === 'hours' ? ' hours' : ''}`} value={entry.low} onChange={low => updateCost(item.id, { low, status: 'entered' })} invalid={!!error} /><NumberField label={`${item.title} — higher${plan.mode === 'hours' ? ' hours' : ''}`} value={entry.high} onChange={high => updateCost(item.id, { high, status: 'entered' })} placeholder="Same as lower" invalid={!!error} /></div>}{error && <p className="calc-input-error" role="alert">{error}</p>}</div>
            })}</div>
            <div className="calc-section-label calc-operations-title"><h3>After launch</h3><label>Plan for<select value={plan.months} onChange={event => update('months', Number(event.target.value))}>{[1, 3, 6, 12].map(months => <option key={months} value={months}>{months} {months === 1 ? 'month' : 'months'}</option>)}</select></label></div>
            <p className="calc-field-help">Add the bills you expect after launch, such as hosting, paid tools, and support. Include any charges that depend on usage. Choose “Pay once” for a bill due once during these months. Enter 0 only if you know there’s no charge.</p>
            <div className="calc-expenses">{plan.expenses.map(expense => <div className="calc-expense" key={expense.id}><label><span>What’s this cost for?</span><input aria-label={`Name for ${expense.name || 'expense'}`} value={expense.name} maxLength={90} onChange={event => update('expenses', plan.expenses.map(item => item.id === expense.id ? { ...item, name: event.target.value } : item))} /></label><label><span>How often?</span><select aria-label={`${expense.name} payment frequency`} value={expense.cadence} onChange={event => update('expenses', plan.expenses.map(item => item.id === expense.id ? { ...item, cadence: event.target.value as 'monthly' | 'once' } : item))}><option value="monthly">Monthly</option><option value="once">Pay once</option></select></label><NumberField label={`${expense.name || 'Expense'} amount`} value={expense.amount} onChange={value => update('expenses', plan.expenses.map(item => item.id === expense.id ? { ...item, amount: value } : item))} invalid={!!expense.amount && amount(expense.amount) === null} /><button className="calc-remove" aria-label={`Remove ${expense.name || 'expense'}`} onClick={() => update('expenses', plan.expenses.filter(item => item.id !== expense.id))}><Trash2 size={16} /></button>{expense.amount && amount(expense.amount) === null && <p className="calc-input-error">Enter 0 or more, with up to two digits after the decimal point.</p>}</div>)}</div>
            <button className="calc-add-expense" onClick={() => update('expenses', [...plan.expenses, { id: `custom-${Date.now()}-${plan.expenses.length}`, name: 'Additional expense', cadence: 'monthly', amount: '' }])}><Plus size={16} />Add an expense</button>
            <label>Anything else we should know? <span className="calc-optional">Optional</span><textarea rows={3} value={plan.notes} maxLength={1200} onChange={event => update('notes', event.target.value)} placeholder="Where did your amounts come from? What does the quote include? Who will do the tasks outside the app?" /></label>
          </div>}
          {step === 3 && <div className="calc-review">
            {!plan.task && <div className="calc-attention"><CircleHelp size={18} /><p>Add your main task in step 1 so a developer knows what you want to build.</p></div>}
            <div className="calc-scope-review"><h3>{plan.project || 'Your first version'}</h3><p>{plan.task || 'Add the main thing people need to do.'}</p><dl><div><dt>For</dt><dd>{plan.user || 'Still to check'}</dd></div><div><dt>Works on</dt><dd>{plan.platform}</dd></div><div><dt>Starting with</dt><dd>{plan.readiness}</dd></div></dl><div className="calc-scope-tags">{now.length ? now.map(feature => <span key={feature.id}>{feature.title}</span>) : <span>Just the main feature</span>}</div><button className="calc-inline-action" onClick={() => setStep(1)}>Change your features <ArrowRight size={14} /></button></div>
            <div className="calc-section-label"><h3>Where the build money goes</h3><button className="calc-inline-action" onClick={() => setStep(2)}>Edit amounts <ArrowRight size={14} /></button></div>
            <div className="calc-breakdown">{budget.rows.map(row => <div key={row.id}><span>{row.title}</span><strong>{row.status === 'included' ? 'Already included' : row.status === 'none' ? 'Not needed' : row.low === null ? 'Still to check' : range(row.low, row.high!, plan.currency)}</strong></div>)}</div>
            {budget.orphaned.length > 0 && <p className="calc-input-error">You’ve marked work as “Already included,” but haven’t added an amount that covers it yet.</p>}
            {budget.missing.some(row => row.error) && <p className="calc-input-error">Some amounts in step 3 need fixing. They haven’t been added to the total yet.</p>}
            <div className="calc-compare"><div><span className="calc-mini-icon"><Layers3 size={19} /></span><h3>What could wait until later?</h3><p>Pick a feature you could leave for later. Compare the build costs, then check what the change would mean for your users and your team.</p></div>{now.length ? <div className="calc-defer-list">{now.map(feature => <label key={feature.id}><input type="checkbox" checked={plan.defer.includes(feature.id)} onChange={event => update('defer', event.target.checked ? [...plan.defer, feature.id] : plan.defer.filter(id => id !== feature.id))} /><span>Leave {feature.title.toLowerCase()} for later</span></label>)}</div> : <p className="calc-field-help">Choose features to build now in step 2, then come back to compare a smaller version.</p>}<div className="calc-comparison-grid"><div><span>Your first version</span><strong>{displayBuild()}</strong><small>{budget.complete ? 'Build estimate' : 'Costs so far · incomplete'}</small></div><div className={deferred.length ? 'has-comparison' : ''}><span>Smaller version</span><strong>{deferred.length ? displayBuild(smaller) : 'Pick a feature above'}</strong><small>{deferred.length ? smaller.complete ? 'Build estimate' : 'Costs so far · incomplete' : 'Keep the main task working'}</small></div></div>{deferred.length > 0 && <p className="calc-comparison-note">{deferred.every(feature => budget.rows.some(row => row.id === feature.id && row.status === 'entered' && row.low !== null)) ? 'We’ve taken out the separate amounts you entered for these features.' : 'Some of these features don’t have a separate cost yet, so we can’t show what leaving them out would save.'} The rest of the build costs stay the same. Check running costs and any extra work for your team before choosing this version.</p>}</div>
            <div className="calc-review-operating"><div className="calc-section-label"><h3>Your {plan.months}-month trial</h3><span>After launch</span></div>{budget.expenses.map(expense => <div className="calc-operating-line" key={expense.id}><span>{expense.name}<small>{expense.cadence === 'monthly' ? 'Monthly × ' + plan.months : 'Pay once'}</small></span><strong>{expense.value === null ? 'Still to check' : money(expense.value * (expense.cadence === 'monthly' ? plan.months : 1), plan.currency)}</strong></div>)}<p className="calc-field-help">Check expected usage, bill dates, taxes, and any extra money you want to set aside. Remove a cost only if you won’t need it or another amount already covers it.</p></div>
            {flags.length > 0 && <div className="calc-review-flags"><h3>Things to check together</h3><ul>{flags.map(flag => <li key={flag}>{flag}</li>)}</ul></div>}
            <div className="calc-export"><h3>Keep a copy of your plan</h3><p>Your summary includes your features, costs, comparison, and anything still to check. No email needed.</p><div><Button variant="outline" onClick={download}><Download size={16} />Download summary</Button><button onClick={() => window.print()}><Printer size={16} />Print / save PDF</button><button onClick={copy}><Copy size={15} />Copy</button></div></div>
          </div>}
        </div>
        <div className="calc-step-footer"><button disabled={step === 0} onClick={() => setStep(value => value - 1)}><ArrowLeft size={16} />Back</button><span>{step + 1} / 4</span>{step < 3 ? <Button onClick={() => setStep(value => value + 1)}>{step === 2 ? 'Review my budget' : 'Continue'}<ArrowRight size={16} /></Button> : <Button variant="outline" onClick={download}><Download size={16} />Save summary</Button>}</div>
      </section>
      <aside className="calc-summary" aria-label="Live budget summary"><div className="calc-summary-top"><span><Calculator size={18} /></span><p>Your budget, taking shape</p><span className="calc-live-dot" aria-hidden="true" /></div><div className="calc-summary-amount" aria-live="polite" aria-atomic="true"><p>{budget.complete ? 'Build estimate' : 'Build costs entered so far'}</p><strong>{displayBuild()}</strong><span>{budget.complete ? `All ${budget.rows.length} build costs filled in or covered` : `${budget.missing.length + budget.orphaned.length} build ${budget.missing.length + budget.orphaned.length === 1 ? 'cost needs' : 'costs need'} checking`}</span></div><div className="calc-summary-lines"><div><span>Building your product</span><strong>{displayBuild()}</strong></div><div><span>{plan.months}-month running costs</span><strong>{hasOperating ? money(budget.operating, plan.currency) : 'Still to check'}</strong></div><div className="calc-summary-total"><span>{budget.complete && !budget.missingExpenses.length ? 'Build + running costs' : 'Total entered so far'}</span><strong>{budget.hasKnown || hasOperating ? range(budget.totalLow, budget.totalHigh, plan.currency) : 'Still to check'}</strong></div></div><p className="calc-summary-caption">{budget.complete && !budget.missingExpenses.length ? 'These totals use your figures. Check what’s included before agreeing to the work.' : `Incomplete: ${budget.missing.length + budget.orphaned.length} build and ${budget.missingExpenses.length} running costs still to check. Missing costs haven’t been added.`}</p><div className="calc-summary-basis"><span>How we added it up</span><p>{plan.mode === 'hours' ? amount(plan.rate) !== null && amount(plan.rate)! > 0 ? `Your hours × ${money(amount(plan.rate)!, plan.currency)}/hour` : 'Add an hourly price to turn your hours into costs' : `Amounts you entered · ${plan.currency}`}</p><small>{plan.example ? 'Made-up example amounts, just to show how it works.' : 'These are your figures. Ask Shibly to review the work for a quote.'}</small></div><div className="calc-summary-scope"><span>What you’re building</span><p>{plan.task || 'Start with one thing you want people to be able to do.'}</p><small>{now.length} features to build · {features.filter(feature => plan.choices[feature.id] === 'manual').length} done by hand</small></div>{step < 3 ? <button className="calc-summary-review" onClick={() => setStep(3)}>See the details & compare <ArrowRight size={15} /></button> : <div className="calc-summary-contact"><Link className="button button-primary button-default inline-flex items-center justify-center gap-2" to="/contact/" state={{ calculatorSummary: budgetSummary(plan).slice(0, 7800) }}>Talk about my project <ArrowUpRight size={16} /></Link><p>You can check and change your summary before you send it.</p><a href={profile.calendly} target="_blank" rel="noreferrer"><CalendlyIcon size={16} />Book a conversation <ArrowUpRight size={14} /></a></div>}</aside>
    </div>
    <p className="calc-status" role="status">{notice}</p>
    <CalculatorMethodology />
    <section className="calc-reading" aria-labelledby="calculator-reading-title">
      <div className="calc-reading-intro"><p className="eyebrow">Make the next decision easier</p><h2 id="calculator-reading-title">A little planning goes a long way</h2><Button asChild className="calc-reading-cta"><Link to="/contact/">Talk through your open questions <ArrowUpRight size={16} /></Link></Button></div>
      <div className="calc-reading-cards">{readingArticles.map(article => <article className="journal-card calc-reading-card" key={article.slug}>
        <Link to={`/blog/${article.slug}/`} className="journal-card-link"><ArticleArt kind={article.kind} image={article.image} /><div className="journal-card-copy"><div className="journal-meta"><span>{article.category}</span><span className="reading-time"><Clock3 size={12} />{article.minutes} min read</span></div><h3>{article.title}</h3><p>{readingDescriptions[article.slug]}</p><span className="journal-read">Read article <ArrowUpRight size={16} /></span></div></Link>
      </article>)}</div>
    </section>
    <div className="calc-print"><h1>MVP first-release budget</h1><p>Prepared with Shibly Noman’s budget planner · {MODEL_VERSION}</p><pre>{budgetSummary(plan)}</pre></div>
  </div>
}




