// Analyze why EM with soft evidence fails

console.log('=== Analyzing EM Bug with Soft Evidence ===\n');

console.log('Test 1: Single node network');
console.log('Evidence: {Node_1: {True: 0.12, False: 0.88}} (32 identical observations)');
console.log('Expected: CPT = {True: 0.12, False: 0.88}');
console.log('Got: CPT = {True: ~0, False: ~1}');
console.log('');

console.log('Test 2 (NEW): Three nodes in chain (Node_1 → Node_2 → Node_3)');
console.log('Evidence: {Node_1: {T: 0.8, F: 0.2}, Node_3: {T: 0.3, F: 0.7}}');
console.log('Node_2 is HIDDEN');
console.log('Expected: Node_1 CPT = {T: 0.8, F: 0.2}');
console.log('Got: Node_1 CPT = {T: 0.9998, F: 0.0002}');
console.log('');

console.log('=== HYPOTHESIS: The Bug ===\n');
console.log('When using rawInfer() with soft evidence in the EM algorithm:');
console.log('');
console.log('1. rawInfer() applies soft evidence as likelihood weights');
console.log('2. This modifies the joint distribution');
console.log('3. The marginalized potentials are then used as "expected counts"');
console.log('4. But these potentials are ALREADY weighted by soft evidence!');
console.log('');
console.log('The problem: In EM for parameter learning with soft evidence:');
console.log('  - Soft evidence should represent OBSERVATION UNCERTAINTY');
console.log('  - NOT inference conditions!');
console.log('');
console.log('When we run inference with soft evidence, we get:');
console.log('  P(variables | soft evidence as likelihood)');
console.log('');
console.log('But for parameter learning, we want:');
console.log('  Expected counts based on soft evidence as DATA');
console.log('');
console.log('These are DIFFERENT concepts!');
console.log('');

console.log('=== Example Walkthrough ===\n');
console.log('Evidence: {Node_1: {True: 0.12, False: 0.88}}');
console.log('');
console.log('WRONG approach (current):');
console.log('  1. Run inference: P(Node_1 | soft evidence)');
console.log('  2. Soft evidence weights multiply into potentials');
console.log('  3. After normalization, we get some other distribution');
console.log('  4. Use that as counts → learns wrong CPT');
console.log('');
console.log('CORRECT approach:');
console.log('  For fully observed soft evidence (no hidden variables):');
console.log('    - Directly use soft evidence values as fractional counts');
console.log('    - Counts: True += 0.12, False += 0.88');
console.log('    - This gives CPT = {True: 0.12, False: 0.88} ✓');
console.log('');
console.log('  For partially observed soft evidence (with hidden variables):');
console.log('    - Use EM with inference, BUT...');
console.log('    - Need to properly handle soft evidence as data uncertainty');
console.log('    - NOT as inference conditions');
console.log('');

console.log('=== THE ROOT CAUSE ===\n');
console.log('Soft evidence has TWO different meanings:');
console.log('');
console.log('1. INFERENCE: "What if we observed this uncertain evidence?"');
console.log('   → Use as likelihood weights in inference');
console.log('   → This is what rawInfer() does');
console.log('');
console.log('2. LEARNING: "We have uncertain observations"');
console.log('   → Use as fractional training examples');
console.log('   → Need different handling!');
console.log('');
console.log('The current code uses rawInfer() which implements meaning #1,');
console.log('but parameter learning needs meaning #2!');
