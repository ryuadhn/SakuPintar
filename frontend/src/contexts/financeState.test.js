import test from 'node:test';
import assert from 'node:assert/strict';
import { createFreshFinanceState, normalizeFinanceState } from './financeState.js';

const financeCollections = [
    'wallets',
    'transactions',
    'recurringRules',
    'reminders',
    'savingsGoals',
    'invitations',
];

test('fresh finance state contains no user finance data', () => {
    const state = createFreshFinanceState();

    for (const collection of financeCollections) {
        assert.deepEqual(state[collection], [], `${collection} should start empty`);
    }
    assert.deepEqual(state.budgets, {});
    assert.ok(state.categories.length > 0, 'default categories remain available');
});

test('fresh states are independent and have no seeded money values', () => {
    const first = createFreshFinanceState();
    const second = createFreshFinanceState();

    first.wallets.push({ id: 'wallet-1', initialBalance: 100 });
    first.categories[0].name = 'Changed';

    assert.deepEqual(second.wallets, []);
    assert.notEqual(second.categories[0].name, 'Changed');
    assert.deepEqual(second.budgets, {});
});

test('explicit empty persisted arrays stay empty', () => {
    const state = normalizeFinanceState({
        wallets: [],
        categories: [],
        transactions: [],
        budgets: {},
        recurringRules: [],
        reminders: [],
        savingsGoals: [],
        invitations: [],
    });

    for (const collection of financeCollections) {
        assert.deepEqual(state[collection], [], `${collection} empty result must not be seeded`);
    }
    assert.deepEqual(state.budgets, {});
    assert.deepEqual(state.categories, []);
});

test('missing persisted state falls back to fresh empty finance data', () => {
    const state = normalizeFinanceState(null);

    for (const collection of financeCollections) {
        assert.deepEqual(state[collection], []);
    }
    assert.deepEqual(state.budgets, {});
    assert.ok(state.categories.length > 0);
});
