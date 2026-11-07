const current='preparing', requested='preparing';
const noop = current.trim().toLowerCase()===requested.trim().toLowerCase();
console.log('preparing->preparing noop', noop, 'would DB write?', !noop, 'would show error?', false);
const next='ready'; console.log('preparing->ready allowed', ['ready','cancelled'].includes(next));
