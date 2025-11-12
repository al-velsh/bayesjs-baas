// Debug Test 1 behavior

const { createNetwork, learningFromEvidence } = require('./dist/bayes');

const node1 = {
  id: 'Node_1',
  states: ['True', 'False'],
  parents: [],
  cpt: { True: 0.50, False: 0.50 },
};

const network = createNetwork(node1);

// Just 2 observations for simplicity
const evidence = [
  { Node_1: { True: 0.12, False: 0.88 } },
  { Node_1: { True: 0.12, False: 0.88 } },
];

console.log('=== Debugging Test 1 ===\n');
console.log('Initial CPT:', network.Node_1.cpt);
console.log('Evidence (2 observations):', evidence);
console.log('');

const learned = learningFromEvidence(network, evidence);

console.log('Learned CPT:', learned.Node_1.cpt);
console.log('');
console.log('Expected: {True: 0.12, False: 0.88}');
console.log('Got:', learned.Node_1.cpt);
