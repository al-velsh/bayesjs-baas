// Comprehensive analysis of failing tests

console.log('=== Analysis of Failing Tests ===\n');

console.log('Test 2: 3-node chain with hidden variable');
console.log('  Network: Node_1 (root) → Node_2 (hidden) → Node_3 (leaf)');
console.log('  Evidence: {Node_1: {T:0.8, F:0.2}, Node_3: {T:0.3, F:0.7}}');
console.log('  Expected: Node_1 CPT = {T: 0.8, F: 0.2}');
console.log('  Got: Node_1 CPT = {T: 0.9998, F: 0.0002}');
console.log('  Status: Node_2 is HIDDEN (partially observed)');
console.log('');

console.log('Test 3: Parent-child with full observation');
console.log('  Network: PARENT (root) → CHILD (child)');
console.log('  Evidence: 20 observations like:');
console.log('    {PARENT: {T:0.95, F:0.05}, CHILD: {T:0.90, F:0.10}}');
console.log('    {PARENT: {T:0.05, F:0.95}, CHILD: {T:0.10, F:0.90}}');
console.log('  Expected: P(CHILD=T | PARENT=T) = 1.0 (perfect correlation)');
console.log('  Got: P(CHILD=T | PARENT=T) = 0.8869');
console.log('  Status: FULLY OBSERVED (no hidden variables)');
console.log('');

console.log('=== Key Insight ===\n');

console.log('For Test 3 (fully observed):');
console.log('  Currently using: original network prior, weight by soft evidence');
console.log('  Problem: This treats soft evidence as INDEPENDENT probabilities');
console.log('  Example: P(PARENT=T, CHILD=T) = 0.95 × 0.90 = 0.855');
console.log('  But this assumes independence!');
console.log('');
console.log('  The data shows strong correlation: when PARENT is highly T, CHILD is highly T');
console.log('  The test expects CPT to learn this correlation perfectly');
console.log('');

console.log('For Test 2 (hidden variable):');
console.log('  Currently using: pass all soft evidence to inference on current network');
console.log('  Problem: Soft evidence on Node_1 is used as likelihood weight in inference');
console.log('  This creates feedback: learned CPT influences inference, which influences learning');
console.log('  After several EM iterations, it converges to near 1.0 instead of 0.8');
console.log('');

console.log('=== The Core Problem ===\n');
console.log('Soft evidence has TWO roles that are being confused:');
console.log('');
console.log('1. As TRAINING DATA: "I have fractional observations"');
console.log('   For a node without parents: counts should equal soft evidence');
console.log('   For a node with parents: counts should reflect joint with parents');
console.log('');
console.log('2. As INFERENCE CONDITION: "What if I observed X with these likelihoods?"');
console.log('   Used to infer hidden variables given observed ones');
console.log('');
console.log('Current EM implementation conflates these!');
console.log('');
console.log('For OBSERVED nodes: soft evidence = training data (role #1)');
console.log('For HIDDEN nodes: use soft evidence on observed nodes to infer (role #2)');
console.log('');

console.log('=== Proposed Fix ===\n');
console.log('The key insight: In EM, we distinguish between:');
console.log('  - Parameters we are LEARNING (use data directly)');
console.log('  - Hidden variables we are INFERRING (use current params + evidence)');
console.log('');
console.log('For soft evidence on OBSERVED variables:');
console.log('  - Should be treated as fractional training examples');
console.log('  - NOT passed to inference as likelihood weights');
console.log('');
console.log('For soft evidence used to INFER hidden variables:');
console.log('  - Can be passed to inference as likelihood weights');
console.log('  - But only after computing fractional counts for observed nodes');
console.log('');
console.log('This requires a different algorithm than standard EM!');
