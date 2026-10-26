import test from 'node:test'
import assert from 'node:assert/strict'
import { amount, initialPlan, examplePlan, calculateBudget, budgetSummary, entryRange } from '../src/lib/mvp-budget.ts'

test('an unanswered plan is incomplete and has no confirmed zero estimate', () => {
  const result = calculateBudget(initialPlan())
  assert.equal(result.hasKnown, false)
  assert.equal(result.complete, false)
  assert.equal(result.missing.length, 4)
  assert.equal(result.missingExpenses.length, 3)
  assert.match(budgetSummary(initialPlan()), /Build costs entered so far \(incomplete\): Still to check/)
})

test('the imaginary portal budget totals build work and the chosen operating period', () => {
  const result = calculateBudget(examplePlan())
  assert.equal(result.low, 5150)
  assert.equal(result.high, 8100)
  assert.equal(result.operating, 1020)
  assert.equal(result.totalLow, 6170)
  assert.equal(result.totalHigh, 9120)
  assert.equal(result.complete, true)
})

test('deferring an independently priced integration leaves shared foundations unchanged', () => {
  const plan = examplePlan()
  const alternative = calculateBudget(plan, true)
  assert.equal(alternative.low, 4350)
  assert.equal(alternative.high, 6700)
  assert.equal(alternative.rows.find(row => row.id === 'core').low, 2000)
  assert.equal(calculateBudget(plan).rows.filter(row => row.id === 'accounts').length, 1)
})

test('an included capability does not create a fictional saving', () => {
  const plan = examplePlan()
  plan.costs.integrations.status = 'included'
  assert.equal(calculateBudget(plan).low, calculateBudget(plan, true).low)
  assert.equal(calculateBudget(plan).high, calculateBudget(plan, true).high)
})

test('a complete project quote can contain the other work without being counted twice', () => {
  const plan = initialPlan()
  for (const entry of Object.values(plan.costs)) entry.status = 'included'
  plan.costs.core = { status: 'entered', low: '5000', high: '' }
  const result = calculateBudget(plan)
  assert.equal(result.low, 5000)
  assert.equal(result.high, 5000)
  assert.equal(result.complete, true)
})

test('included work without a containing amount is unresolved', () => {
  const plan = initialPlan()
  for (const entry of Object.values(plan.costs)) entry.status = 'included'
  const result = calculateBudget(plan)
  assert.equal(result.orphaned.length, 4)
  assert.equal(result.complete, false)
  assert.equal(result.hasKnown, false)
})

test('hours remain unpriced until a positive rate is supplied', () => {
  const plan = initialPlan()
  plan.mode = 'hours'
  plan.costs.core = { status: 'entered', low: '10', high: '15' }
  assert.equal(calculateBudget(plan).hasKnown, false)
  plan.rate = '0'
  assert.equal(calculateBudget(plan).hasKnown, false)
  plan.rate = '50'
  assert.equal(calculateBudget(plan).low, 500)
  assert.equal(calculateBudget(plan).high, 750)
  assert.equal(calculateBudget(plan).complete, false)
})

test('negative, non-finite, blank, and reversed ranges never enter a subtotal', () => {
  for (const value of ['', ' ', '-1', 'Infinity', 'NaN', '100000001', '0.001']) assert.equal(amount(value), null)
  assert.equal(amount('0'), 0)
  const plan = initialPlan()
  plan.costs.core = { status: 'entered', low: '200', high: '100' }
  assert.equal(calculateBudget(plan).hasKnown, false)
  assert.match(calculateBudget(plan).missing[1].error, /higher amount can’t/)
})

test('monthly payments repeat, while payments due once in the period do not', () => {
  const plan = initialPlan()
  plan.months = 6
  plan.expenses = [{ id: 'monthly', name: 'Service', cadence: 'monthly', amount: '25' }, { id: 'renewal', name: 'Annual renewal due', cadence: 'once', amount: '120' }]
  assert.equal(calculateBudget(plan).operating, 270)
})

test('monetary arithmetic sums cents rather than binary floating point residues', () => {
  const plan = initialPlan()
  plan.costs.core = { status: 'entered', low: '0.10', high: '' }
  plan.costs.release = { status: 'entered', low: '0.20', high: '' }
  assert.equal(calculateBudget(plan).low, 0.30)
  assert.deepEqual(entryRange({ status: 'entered', low: '1.25', high: '1.5' }, 'hours', '42.50'), { low: 53.13, high: 63.75, error: '' })
})

test('unknown operating costs remain distinct from an explicitly entered zero', () => {
  const plan = initialPlan()
  plan.expenses[0].amount = '0'
  const result = calculateBudget(plan)
  assert.equal(result.missingExpenses.length, 2)
  assert.equal(result.expenses[0].value, 0)
})

test('exports preserve example attribution, partial totals, and scope-review questions', () => {
  const plan = examplePlan()
  plan.costs.integrations = { status: 'unknown', low: '', high: '' }
  const summary = budgetSummary(plan)
  assert.match(summary, /MADE-UP EXAMPLE/)
  assert.match(summary, /Build costs entered so far \(incomplete\)/)
  assert.match(summary, /Connect other tools: Still to check/)
  assert.match(summary, /Check access to the other tools/)
  assert.doesNotMatch(summary, /undefined|NaN/)
})
