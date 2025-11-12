// Analyze Test 2: 3-node chain with hidden variable

console.log('=== Test 2 Analysis: Node_1 → Node_2 → Node_3 ===\n');

console.log('Network structure:');
console.log('  Node_1: No parents, CPT = {T: 0.5, F: 0.5}');
console.log('  Node_2: Parent = Node_1, CPT = uniform (0.5 regardless of parent)');
console.log('  Node_3: Parent = Node_2, CPT = uniform (0.5 regardless of parent)');
console.log('');

console.log('Evidence (1 observation):');
console.log('  Node_1: {T: 0.8, F: 0.2}');
console.log('  Node_2: HIDDEN (no evidence)');
console.log('  Node_3: {T: 0.3, F: 0.7}');
console.log('');

console.log('Test expectation: Node_1 learns CPT = {T: 0.8, F: 0.2}');
console.log('Current result: Node_1 learns CPT = {T: 0.9412, F: 0.0588}');
console.log('');

console.log('=== Why should Node_1 learn {T: 0.8, F: 0.2}? ===\n');

console.log('This is the MARGINAL probability given in the soft evidence.');
console.log('The soft evidence directly states: P(Node_1=T) = 0.8');
console.log('');
console.log('But wait! Node_2 is hidden. So this is an EM problem.');
console.log('');

console.log('=== EM Algorithm Trace ===\n');

console.log('Iteration 0 (initial):');
console.log('  Network: Node_1 CPT = {T: 0.5, F: 0.5}');
console.log('');

console.log('E-step:');
console.log('  Given soft evidence on Node_1 and Node_3, infer Node_2');
console.log('  P(Node_2 | Node_1 soft, Node_3 soft) using current network');
console.log('');

console.log('  For each (Node_1, Node_2, Node_3) combination:');
console.log('    P(combo) = P(Node_1) × P(Node_2|Node_1) × P(Node_3|Node_2)');
console.log('    Weight = soft_Node_1[state] × soft_Node_3[state]');
console.log('');

console.log('  Example: (T, T, T):');
console.log('    P(T,T,T) = 0.5 × 0.5 × 0.5 = 0.125');
console.log('    Weight = 0.8 × 0.3 = 0.24');
console.log('    Weighted count = 0.125 × 0.24 = 0.03');
console.log('');

console.log('  Example: (T, T, F):');
console.log('    P(T,T,F) = 0.5 × 0.5 × 0.5 = 0.125');
console.log('    Weight = 0.8 × 0.7 = 0.56');
console.log('    Weighted count = 0.125 × 0.56 = 0.07');
console.log('');

console.log('  Example: (F, T, T):');
console.log('    P(F,T,T) = 0.5 × 0.5 × 0.5 = 0.125');
console.log('    Weight = 0.2 × 0.3 = 0.06');
console.log('    Weighted count = 0.125 × 0.06 = 0.0075');
console.log('');

console.log('After normalization, for Node_1:');
console.log('  Counts: T = (0.03 + 0.07 + 0.03 + 0.07) = 0.20');
console.log('  Counts: F = (0.0075 + 0.0175 + 0.0075 + 0.0175) = 0.05');
console.log('  Total = 0.25');
console.log('  CPT: T = 0.20/0.25 = 0.8, F = 0.05/0.25 = 0.2 ✓');
console.log('');

console.log('=== The Problem ===\n');
console.log('My current implementation:');
console.log('  1. Separates hard and soft evidence');
console.log('  2. Runs inference with NO evidence (gets uniform prior)');
console.log('  3. Weights by soft evidence');
console.log('');
console.log('This is WRONG for hidden variables!');
console.log('');
console.log('For hidden variables, soft evidence MUST be passed to inference');
console.log('so that the posterior correctly accounts for the relationships');
console.log('between observed and hidden variables.');
console.log('');

console.log('=== The Fix ===\n');
console.log('For partially observed (has hidden variables):');
console.log('  - Pass soft evidence TO inference (as likelihood weights)');
console.log('  - Use the posterior directly as expected counts');
console.log('  - Do NOT weight again afterwards!');
console.log('');
console.log('The feedback loop issue only applies to FULLY observed cases.');
