#!/usr/bin/env ts-node

// Seed script for AYUSH policies and Ayurvedic guidelines

import { policiesService } from '../src/services/policies';
import { PolicyDocument } from '../src/types';

const ayushPolicies: Omit<PolicyDocument, 'id'>[] = [
  {
    title: 'Dietary Guidelines for Vata Dosha Management',
    category: 'dietary_guidelines',
    source: 'ministry_of_ayush',
    referenceNumber: 'AYUSH/VATA/2023/001',
    summary: 'Comprehensive dietary recommendations for balancing Vata dosha through warm, moist, and grounding foods.',
    fullContent: `
# Dietary Guidelines for Vata Dosha Management

## Core Principles
- Prefer warm, cooked foods over cold, raw foods
- Include healthy fats and oils for lubrication
- Eat regular, grounding meals to stabilize Vata
- Favor sweet, sour, and salty tastes over pungent, bitter, and astringent

## Recommended Foods
### Grains
- Rice (especially basmati)
- Wheat (in moderation)
- Oats and barley

### Vegetables
- Cooked root vegetables (carrots, beets, sweet potatoes)
- Leafy greens (spinach, kale - well cooked)
- Asparagus, zucchini

### Fruits
- Sweet, ripe fruits (bananas, mangoes, dates)
- Cooked apples and pears
- Avoid raw fruits in excess

### Dairy
- Warm milk with ghee
- Yogurt (fresh and homemade)
- Cheese (in moderation)

### Oils and Fats
- Ghee (clarified butter)
- Sesame oil
- Olive oil

## Foods to Avoid or Limit
- Raw vegetables and salads
- Cold beverages
- Dried fruits
- Beans and lentils (if not properly prepared)
- Excessive caffeine and alcohol

## Meal Timing
- Eat three regular meals daily
- Avoid skipping meals
- Have dinner before 8 PM
- Include small snacks if needed

## Cooking Methods
- Steaming, boiling, and stewing preferred
- Use warming spices like ginger, cinnamon, and cumin
- Avoid microwaving and excessive frying
    `,
    keyPrinciples: [
      'Warm, cooked foods stabilize Vata',
      'Include healthy fats for lubrication',
      'Regular meal timing prevents imbalance',
      'Sweet, sour, salty tastes are pacifying'
    ],
    applicableConditions: ['Anxiety', 'Insomnia', 'Dry skin', 'Constipation', 'Joint pain', 'Irregular digestion'],
    targetAudience: ['dietitians', 'patients'],
    tags: ['vata', 'dosha', 'dietary', 'ayurveda', 'balancing', 'warm foods', 'ghee', 'regular meals'],
    doshaRelevance: {
      vata: true,
      pitta: false,
      kapha: false
    },
    seasonalRelevance: ['autumn', 'winter'],
    effectiveDate: new Date('2023-01-01'),
    isActive: true,
    createdBy: 'system-admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    title: 'Pitta Dosha Dietary Guidelines',
    category: 'dietary_guidelines',
    source: 'ccras',
    referenceNumber: 'CCRAS/PITTA/2023/002',
    summary: 'Cooling dietary recommendations for Pitta dosha balance focusing on mild, sweet, and bitter tastes.',
    fullContent: `
# Pitta Dosha Dietary Guidelines

## Core Principles
- Emphasize cooling, non-spicy foods
- Favor sweet, bitter, and astringent tastes
- Include healthy fats but avoid excessive oil
- Eat at moderate temperatures

## Recommended Foods
### Grains
- Wheat, rice, barley
- Oats (cooked)
- Quinoa

### Vegetables
- Leafy greens (lettuce, spinach, kale)
- Cucumber, zucchini, broccoli
- Sweet potatoes, carrots (cooked)

### Fruits
- Sweet fruits (grapes, melons, mangoes)
- Apples, pears, berries
- Coconut

### Dairy
- Milk (cool or at room temperature)
- Ghee (in moderation)
- Cottage cheese

### Oils and Fats
- Ghee, olive oil, coconut oil (moderate use)
- Avoid excessive heating of oils

## Foods to Avoid
- Spicy, pungent foods
- Sour foods (except lemon in small amounts)
- Excessive salt
- Fried foods
- Alcohol and caffeine

## Meal Timing
- Eat three balanced meals
- Allow 3-4 hours between meals for digestion
- Avoid eating when angry or stressed
- Cool water between meals

## Cooking Methods
- Steaming and boiling preferred
- Use cooling spices like coriander, fennel, mint
- Avoid excessive spices and chilies
    `,
    keyPrinciples: [
      'Cooling foods pacify Pitta',
      'Sweet, bitter, astringent tastes are beneficial',
      'Moderate temperatures prevent aggravation',
      'Avoid spicy and sour foods'
    ],
    applicableConditions: ['Acid reflux', 'Skin rashes', 'Irritability', 'Excessive hunger', 'Inflammation'],
    targetAudience: ['dietitians', 'patients'],
    tags: ['pitta', 'dosha', 'cooling', 'dietary', 'ayurveda', 'sweet taste', 'bitter taste'],
    doshaRelevance: {
      vata: false,
      pitta: true,
      kapha: false
    },
    seasonalRelevance: ['summer'],
    effectiveDate: new Date('2023-01-01'),
    isActive: true,
    createdBy: 'system-admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    title: 'Kapha Dosha Nutritional Guidelines',
    category: 'dietary_guidelines',
    source: 'ccras',
    referenceNumber: 'CCRAS/KAPHA/2023/003',
    summary: 'Light, warm, and stimulating dietary recommendations for Kapha dosha balance.',
    fullContent: `
# Kapha Dosha Nutritional Guidelines

## Core Principles
- Favor light, dry, warm foods
- Include pungent, bitter, and astringent tastes
- Minimize heavy, oily, cold foods
- Emphasize digestion-stimulating foods

## Recommended Foods
### Grains
- Barley, millet, buckwheat
- Corn, rye
- Brown rice (in moderation)

### Vegetables
- Leafy greens, broccoli, cauliflower
- Radishes, onions, garlic
- Asparagus, celery, cabbage

### Fruits
- Apples, pears, cranberries
- Pomegranates, berries
- Avoid sweet, heavy fruits

### Dairy
- Low-fat milk or goat milk
- Small amounts of ghee
- Avoid heavy creams and cheeses

### Oils and Fats
- Minimal oil use
- Mustard oil, sunflower oil in small amounts
- Ghee for cooking (sparingly)

## Foods to Avoid
- Heavy, oily foods
- Sweet, cold foods
- Excessive dairy
- Wheat and refined flours
- Deep-fried foods

## Meal Timing
- Eat light breakfast
- Main meal at noon
- Light dinner before sunset
- Allow 4-5 hours between meals

## Cooking Methods
- Baking, grilling, stir-frying
- Use warming spices like ginger, black pepper, mustard
- Light cooking methods preferred
    `,
    keyPrinciples: [
      'Light, dry foods reduce Kapha',
      'Warming spices stimulate digestion',
      'Pungent, bitter, astringent tastes are pacifying',
      'Minimize heavy, sweet foods'
    ],
    applicableConditions: ['Weight gain', 'Congestion', 'Lethargy', 'Slow digestion', 'Depression', 'Edema'],
    targetAudience: ['dietitians', 'patients'],
    tags: ['kapha', 'dosha', 'light foods', 'warming', 'stimulating', 'ayurveda'],
    doshaRelevance: {
      vata: false,
      pitta: false,
      kapha: true
    },
    seasonalRelevance: ['spring'],
    effectiveDate: new Date('2023-01-01'),
    isActive: true,
    createdBy: 'system-admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    title: 'Seasonal Diet Recommendations - Winter',
    category: 'seasonal_recommendations',
    source: 'ministry_of_ayush',
    referenceNumber: 'AYUSH/SEASON/WINTER/2023',
    summary: 'Winter dietary guidelines emphasizing warming foods, healthy fats, and immune-boosting nutrients.',
    fullContent: `
# Winter Dietary Guidelines

## Core Principles
- Focus on warming, nourishing foods
- Include healthy fats for insulation
- Boost immunity with root vegetables and spices
- Maintain digestive fire (Agni)

## Recommended Foods
### Grains
- Whole wheat, rice, oats
- Include warming porridges

### Vegetables
- Root vegetables (carrots, beets, turnips)
- Onions, garlic, ginger
- Cooked leafy greens

### Fruits
- Citrus fruits (oranges, lemons)
- Apples, pears
- Dried fruits (dates, figs, raisins)

### Proteins
- Nuts and seeds (almonds, walnuts)
- Lentils and beans (well-cooked)
- Warm soups with protein

### Spices and Herbs
- Ginger, garlic, cinnamon
- Black pepper, turmeric
- Cumin, coriander

## Winter-Specific Recommendations
- Include golden milk (turmeric latte)
- Eat root vegetable soups
- Include fermented foods for gut health
- Stay hydrated with warm fluids

## Foods to Moderate
- Excessive raw foods
- Cold beverages
- Heavy, hard-to-digest foods
    `,
    keyPrinciples: [
      'Warming foods combat winter cold',
      'Root vegetables provide grounding nutrition',
      'Immune-boosting spices are essential',
      'Healthy fats provide insulation'
    ],
    applicableConditions: ['Cold sensitivity', 'Dry skin', 'Joint stiffness', 'Low immunity', 'Digestive issues'],
    targetAudience: ['dietitians', 'patients'],
    tags: ['winter', 'seasonal', 'warming', 'immunity', 'root vegetables', 'golden milk'],
    doshaRelevance: {
      vata: true,
      pitta: false,
      kapha: false
    },
    seasonalRelevance: ['winter'],
    effectiveDate: new Date('2023-01-01'),
    isActive: true,
    createdBy: 'system-admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    title: 'Food Combination Principles',
    category: 'food_combinations',
    source: 'classical_texts',
    referenceNumber: 'CLASSICAL/FOOD-COMBINATIONS/001',
    summary: 'Traditional Ayurvedic principles for compatible and incompatible food combinations.',
    fullContent: `
# Ayurvedic Food Combination Principles

## Compatible Combinations
### Protein + Vegetables
- Lentils with leafy greens
- Beans with non-starchy vegetables
- Chicken/fish with vegetables

### Grains + Proteins
- Rice with lentils (khichdi)
- Wheat with vegetables
- Millet with vegetables

### Dairy Combinations
- Milk with sweet fruits
- Yogurt with mild spices
- Cheese with compatible vegetables

## Incompatible Combinations (Viruddha Ahara)
### Protein + Protein
- Milk + fish/meat/eggs
- Yogurt + meat/fish
- Cheese + meat/fish

### Fruit Combinations
- Milk + sour fruits
- Banana + milk (in excess)
- Fruit + vegetables (in same meal)

### Grain + Dairy
- Bread + milk (creates mucus)
- Rice + yogurt (heavy combination)

### Other Incompatibles
- Honey + ghee (in equal amounts)
- Radish + milk
- Leafy greens + dairy

## Timing Considerations
- Allow 2-3 hours between incompatible foods
- Eat fruits separately from main meals
- Avoid mixing hot and cold foods

## Individual Constitution
- Vata: More flexible with combinations
- Pitta: Sensitive to incompatible foods
- Kapha: Can handle some combinations but avoid heaviness
    `,
    keyPrinciples: [
      'Avoid incompatible food combinations',
      'Respect digestive capacity',
      'Consider individual constitution',
      'Allow proper time between meals'
    ],
    applicableConditions: ['Digestive disorders', 'Food allergies', 'Indigestion', 'Toxin accumulation'],
    targetAudience: ['dietitians'],
    tags: ['food combinations', 'viruddha ahara', 'compatibility', 'digestion', 'classical'],
    doshaRelevance: {
      vata: true,
      pitta: true,
      kapha: true
    },
    effectiveDate: new Date('2023-01-01'),
    isActive: true,
    createdBy: 'system-admin',
    createdAt: new Date(),
    updatedAt: new Date()
  },

  {
    title: 'Diabetes Management Through Ayurveda',
    category: 'therapeutic_diets',
    source: 'ccras',
    referenceNumber: 'CCRAS/DIABETES/2023/004',
    summary: 'Ayurvedic dietary approach for diabetes management focusing on bitter tastes and blood sugar regulation.',
    fullContent: `
# Ayurvedic Diabetes Management

## Core Principles
- Balance blood sugar through diet
- Include bitter, astringent tastes
- Regulate Kapha and Pitta doshas
- Support pancreatic function

## Recommended Foods
### Grains
- Barley, millet, amaranth
- Brown rice (in moderation)
- Oats (steel-cut)

### Vegetables
- Bitter gourd (karela)
- Bitter melon, fenugreek leaves
- Leafy greens, broccoli
- Onions, garlic

### Fruits
- Bitter fruits (when available)
- Apples, pears, berries
- Small amounts of citrus
- Avoid sweet fruits

### Proteins
- Lean proteins
- Lentils (in moderation)
- Small amounts of chicken/fish
- Avoid excessive red meat

### Herbs and Spices
- Fenugreek, turmeric
- Cinnamon, cumin
- Bitter melon extracts
- Gymnema sylvestre

## Foods to Avoid
- Refined sugars and sweets
- White flour products
- Excessive sweet fruits
- Heavy, oily foods
- Excessive dairy

## Meal Structure
- Small, frequent meals
- Include fiber-rich foods
- Monitor portion sizes
- Regular meal timing

## Lifestyle Integration
- Regular exercise (walking)
- Stress management
- Adequate sleep
- Regular health monitoring
    `,
    keyPrinciples: [
      'Bitter tastes regulate blood sugar',
      'Small, frequent meals prevent spikes',
      'Include fiber-rich foods',
      'Balance Kapha and Pitta doshas'
    ],
    applicableConditions: ['Diabetes', 'Prediabetes', 'Insulin resistance', 'Metabolic syndrome'],
    targetAudience: ['dietitians', 'patients'],
    tags: ['diabetes', 'blood sugar', 'bitter taste', 'therapeutic', 'kapha', 'pitta'],
    doshaRelevance: {
      vata: false,
      pitta: true,
      kapha: true
    },
    effectiveDate: new Date('2023-01-01'),
    isActive: true,
    createdBy: 'system-admin',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function seedPolicies() {
  console.log('🌱 Seeding AYUSH policies and guidelines...');

  try {
    let successCount = 0;
    let errorCount = 0;

    for (const policy of ayushPolicies) {
      try {
        await policiesService.create(policy);
        successCount++;
        console.log(`✅ Created policy: ${policy.title}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to create policy: ${policy.title}`, error);
      }
    }

    console.log(`\n📊 Seeding completed:`);
    console.log(`   ✅ Successfully created: ${successCount} policies`);
    console.log(`   ❌ Failed to create: ${errorCount} policies`);

    // Get statistics
    const stats = await policiesService.getStats();
    console.log(`\n📈 Current policy statistics:`);
    console.log(`   Total policies: ${stats.total}`);
    console.log(`   Active policies: ${stats.active}`);
    console.log(`   Categories:`, stats.byCategory);
    console.log(`   Sources:`, stats.bySource);

  } catch (error) {
    console.error('❌ Error seeding policies:', error);
    process.exit(1);
  }
}

// Run the seeding function
if (require.main === module) {
  seedPolicies()
    .then(() => {
      console.log('🎉 Policy seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Policy seeding failed:', error);
      process.exit(1);
    });
}

export { seedPolicies };