import ifctService from '../src/services/ifct';

async function demo() {
  console.log('=== IFCT2017 Database Demo ===\n');

  // Query for "apple"
  console.log('1. Searching for foods containing "apple":');
  const apples = ifctService.findFood('apple');
  if (apples.length > 0) {
    const apple = apples[0]; // Take first result
    console.log(`Found: ${apple.name}`);
    console.log('Nutritional values (per 100g):');
    console.log(`- Energy: ${apple.enerc} kcal`);
    console.log(`- Protein: ${apple.protcnt} g`);
    console.log(`- Fat: ${apple.fatce} g`);
    console.log(`- Carbohydrates: ${apple.choavldf} g`);
    console.log(`- Fiber: ${apple.fibtg} g`);
    console.log(`- Water: ${apple.water} g`);
  } else {
    console.log('No apples found');
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Query for foods with Protein > 10g
  console.log('2. Foods with Protein > 10g per 100g:');
  const highProteinFoods = ifctService.findByNutrient('protcnt', 10.1, 100);
  console.log(`Found ${highProteinFoods.length} foods:`);

  highProteinFoods.slice(0, 10).forEach((food, index) => {
    console.log(`${index + 1}. ${food.name} - Protein: ${food.protcnt}g`);
  });

  if (highProteinFoods.length > 10) {
    console.log(`... and ${highProteinFoods.length - 10} more`);
  }

  // Close the database
  ifctService.close();
  console.log('\nDemo completed successfully!');
}

// Run the demo
demo().catch(console.error);