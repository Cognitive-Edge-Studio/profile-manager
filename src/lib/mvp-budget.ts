export const MODEL_VERSION = '1.0 · supplied-cost planner'

export const features = [
  { id: 'accounts', title: 'User accounts', description: 'Let people sign in and choose what each person can see or do.' },
  { id: 'payments', title: 'Take payments', description: 'Take one-time or regular payments, give refunds, or pay sellers.' },
  { id: 'notifications', title: 'Emails & reminders', description: 'Send order updates, reminders, or messages in the app.' },
  { id: 'admin', title: 'Tools for your team', description: 'Give your team a place to manage people, requests, and records.' },
  { id: 'files', title: 'Files & search', description: 'Upload documents, find records, or filter results.' },
  { id: 'integrations', title: 'Connect other tools', description: 'Link to another tool or bring in records you already have.' },
  { id: 'ai', title: 'AI features', description: 'Use AI to answer questions, summarize text, or find information.' },
] as const

export type FeatureId = typeof features[number]['id']
export type ScopeChoice = 'now' | 'later' | 'manual'
export type CostStatus = 'unknown' | 'entered' | 'included' | 'none'
export type CostEntry = { status: CostStatus; low: string; high: string }
export type Expense = { id: string; name: string; cadence: 'monthly' | 'once'; amount: string }
export type Plan = {
  project: string; user: string; task: string; platform: string; roles: string;
  readiness: string; dependencies: string; deadline: string;
  choices: Record<FeatureId, ScopeChoice>; defer: FeatureId[];
  mode: 'cost' | 'hours'; currency: 'USD' | 'GBP' | 'EUR' | 'BDT'; rate: string;
  costs: Record<string, CostEntry>; months: number; expenses: Expense[];
  notes: string; example: boolean;
}

export const foundations = [
  { id: 'planning', title: 'Planning & design', description: 'Plan the work and design how the screens look and behave.' },
  { id: 'core', title: 'Main feature & setup', description: 'Build the main task and the setup it needs. Keep features priced separately below out of this amount.' },
  { id: 'quality', title: 'Testing & checks', description: 'Check that tasks work, the right people have access, and problems are handled.' },
  { id: 'release', title: 'Launch & handover', description: 'Put the product online, check it works, and hand over the code and instructions.' },
] as const

const blankEntry = (): CostEntry => ({ status: 'unknown', low: '', high: '' })
export function initialPlan(): Plan {
  return {
    project: '', user: '', task: '', platform: 'Website (desktop and mobile)', roles: 'Not sure yet',
    readiness: 'Just an idea', dependencies: '', deadline: '',
    choices: Object.fromEntries(features.map(feature => [feature.id, 'later'])) as Record<FeatureId, ScopeChoice>,
    defer: [], mode: 'cost', currency: 'USD', rate: '',
    costs: Object.fromEntries([...foundations, ...features].map(item => [item.id, blankEntry()])),
    months: 3,
    expenses: [
      { id: 'hosting', name: 'Hosting & paid tools', cadence: 'monthly', amount: '' },
      { id: 'support', name: 'Support & maintenance', cadence: 'monthly', amount: '' },
      { id: 'iteration', name: 'Changes after launch', cadence: 'once', amount: '' },
    ],
    notes: '', example: false,
  }
}

export function examplePlan(): Plan {
  const plan = initialPlan()
  plan.project = 'Wholesale order portal'
  plan.user = 'Existing wholesale customers and one staff member'
  plan.task = 'Submit an order request and get stock confirmation.'
  plan.roles = 'Customers + staff'
  plan.readiness = 'Rough sketches or layouts'
  plan.choices = { accounts: 'now', payments: 'later', notifications: 'now', admin: 'now', files: 'later', integrations: 'now', ai: 'later' }
  plan.defer = ['integrations']
  plan.dependencies = 'Automatic stock confirmation needs a connection to the stock system. Another option is for staff to check stock and reply.'
  plan.deadline = 'Flexible, after checking access to the stock system'
  const values: Record<string, [string, string]> = {
    planning: ['600', '900'], core: ['2000', '3000'], quality: ['500', '800'], release: ['300', '500'],
    accounts: ['400', '600'], notifications: ['150', '250'], admin: ['400', '650'], integrations: ['800', '1400'],
  }
  for (const [id, [low, high]] of Object.entries(values)) plan.costs[id] = { status: 'entered', low, high }
  plan.expenses[0].amount = '40'
  plan.expenses[1].amount = '100'
  plan.expenses[2].amount = '600'
  plan.notes = 'Made-up example amounts to show how the calculator works. They aren’t market prices or Shibly’s rates. If staff check stock by hand, add any cost for their time separately.'
  plan.example = true
  return plan
}

/** Empty, invalid, and non-finite values must never become a zero estimate. */
export function amount(value: string): number | null {
  if (!value.trim()) return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 && number <= 100_000_000 && Math.abs(number * 100 - Math.round(number * 100)) < 0.000001 ? number : null
}

export function activeItems(plan: Plan, smaller = false) {
  return [...foundations, ...features.filter(feature => plan.choices[feature.id] === 'now' && !(smaller && plan.defer.includes(feature.id)))]
}

export function entryRange(entry: CostEntry, mode: Plan['mode'], rate: string) {
  if (entry.status === 'none' || entry.status === 'included') return { low: 0, high: 0, error: '' }
  if (entry.status === 'unknown') return { low: null, high: null, error: '' }
  const low = amount(entry.low)
  const high = entry.high.trim() ? amount(entry.high) : low
  if (low === null || high === null) return { low: null, high: null, error: 'Enter 0 or more, with up to two digits after the decimal point.' }
  if (high < low) return { low: null, high: null, error: 'The higher amount can’t be less than the lower amount.' }
  const multiplier = mode === 'hours' ? amount(rate) : 1
  if (multiplier === null || (mode === 'hours' && multiplier === 0)) return { low: null, high: null, error: '' }
  const rounded = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100
  return { low: rounded(low * multiplier), high: rounded(high * multiplier), error: '' }
}

export function calculateBudget(plan: Plan, smaller = false) {
  const rows = activeItems(plan, smaller).map(item => ({ ...item, ...entryRange(plan.costs[item.id], plan.mode, plan.rate), status: plan.costs[item.id].status }))
  const missing = rows.filter(row => row.low === null)
  const priced = rows.filter(row => row.status === 'entered' && row.low !== null)
  // An "included above" item requires an actual priced line to include it in.
  const orphaned = priced.length === 0 ? rows.filter(row => row.status === 'included') : []
  const expenses = plan.expenses.map(expense => ({ ...expense, value: amount(expense.amount) }))
  const missingExpenses = expenses.filter(expense => expense.value === null)
  const cents = (value: number) => Math.round((value + Number.EPSILON) * 100)
  const operating = expenses.reduce((sum, expense) => sum + cents(expense.value ?? 0) * (expense.cadence === 'monthly' ? plan.months : 1), 0) / 100
  const low = rows.reduce((sum, row) => sum + cents(row.low ?? 0), 0) / 100
  const high = rows.reduce((sum, row) => sum + cents(row.high ?? 0), 0) / 100
  return {
    rows, low, high, missing, orphaned, priced,
    complete: missing.length === 0 && orphaned.length === 0,
    hasKnown: priced.length > 0 || rows.some(row => row.status === 'none'),
    operating, expenses, missingExpenses,
    totalLow: (cents(low) + cents(operating)) / 100, totalHigh: (cents(high) + cents(operating)) / 100,
  }
}

export function reviewFlags(plan: Plan): string[] {
  return [
    ...(plan.platform !== 'Website (desktop and mobile)' ? ['Talk with your developer about the work needed for each device or app.'] : []),
    ...(plan.choices.integrations === 'now' ? ['Check access to the other tools, what happens if a connection fails, and whether records need cleaning up.'] : []),
    ...(plan.choices.ai === 'now' ? ['Agree how to check AI answers, handle mistakes, protect data, and pay for usage.'] : []),
    ...(plan.readiness === 'Some code or a working product' ? ['Have a developer check the existing code before assuming it can be used again.'] : []),
    ...(Object.values(plan.choices).includes('manual') ? ['Decide who will do tasks by hand, how much time they’ll need, how quickly they can respond, and whether that time will cost money.'] : []),
  ]
}

export function money(value: number, currency: Plan['currency']) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 }).format(value)
}
export function range(low: number, high: number, currency: Plan['currency']) {
  return low === high ? money(low, currency) : `${money(low, currency)} – ${money(high, currency)}`
}

export function budgetSummary(plan: Plan) {
  const budget = calculateBudget(plan)
  const smaller = calculateBudget(plan, true)
  const lines = [
    'MVP FIRST-VERSION BUDGET', `Model: ${MODEL_VERSION}`,
    ...(plan.example ? ['MADE-UP EXAMPLE — these amounts aren’t Shibly’s prices or a quote.'] : []),
    `Project: ${plan.project || 'Not named'}`, `For: ${plan.user || 'Still to check'}`,
    `Main task: ${plan.task || 'Still to check'}`, `Works on: ${plan.platform}`, `People using it: ${plan.roles}`,
    `Starting point: ${plan.readiness}`, `Date to discuss: ${plan.deadline || 'Still to check'}`,
    `Tools, data, and open questions: ${plan.dependencies || 'Still to check'}`,
    '', ...(['now', 'manual', 'later'] as const).map(choice => `${choice === 'now' ? 'Build now' : choice === 'manual' ? 'Do by hand' : 'Later'}: ${features.filter(feature => plan.choices[feature.id] === choice).map(feature => feature.title).join(', ') || 'None selected'}`),
    '', `How the costs were entered: ${plan.mode === 'hours' ? `Your hours × hourly price (${amount(plan.rate) === null ? 'rate to confirm' : `${money(amount(plan.rate)!, plan.currency)}/hour`})` : 'Costs or quotes you entered'}. All amounts in ${plan.currency}.`,
    `${budget.complete ? 'Build estimate' : 'Build costs entered so far (incomplete)'}: ${budget.hasKnown ? range(budget.low, budget.high, plan.currency) : 'Still to check'}`,
    ...budget.rows.map(row => `${row.title}: ${row.status === 'included' ? 'Covered by another amount you entered' : row.status === 'none' ? 'Not needed' : row.low === null ? `Still to check${row.error ? ` — ${row.error}` : ''}` : range(row.low, row.high!, plan.currency)}`),
    ...budget.orphaned.map(row => `Unresolved: ${row.title} is marked included, but you haven’t entered an amount that covers it.`),
    '', `Running costs for: ${plan.months} months after launch`,
    ...budget.expenses.map(expense => `${expense.name}: ${expense.value === null ? 'Still to check' : money(expense.value, plan.currency)} ${expense.cadence === 'monthly' ? '/month' : '(one time in period)'}`),
    `${budget.complete && budget.missingExpenses.length === 0 ? 'Build + running costs' : 'Build + running costs so far (incomplete)'}: ${budget.hasKnown || budget.expenses.some(expense => expense.value !== null) ? range(budget.totalLow, budget.totalHigh, plan.currency) : 'Still to check'}`,
    ...(plan.defer.some(id => plan.choices[id] === 'now') ? ['', `Features left for later: ${features.filter(feature => plan.defer.includes(feature.id) && plan.choices[feature.id] === 'now').map(feature => feature.title).join(', ')}`, `${smaller.complete ? 'Smaller build estimate' : 'Smaller build costs so far (incomplete)'}: ${smaller.hasKnown ? range(smaller.low, smaller.high, plan.currency) : 'Still to check'}`, 'Check the rest of the build, running costs, and any work your team will do by hand. A feature covered by another amount needs a new estimate before you know the saving.'] : []),
    '', ...reviewFlags(plan), `Notes: ${plan.notes || 'None added'}`,
    'This plan adds up the figures you entered. It is a starting point for a discussion, not a final quote. Missing costs still need checking. No delivery date or currency conversion is worked out. Check taxes, bill dates, extra money to set aside, and anything left out.',
  ]
  return lines.join('\n')
}
