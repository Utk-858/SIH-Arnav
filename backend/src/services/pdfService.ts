import * as puppeteer from 'puppeteer';
import { DietPlan, Patient, FoodItem } from '../types';
import { FirestoreService } from './firestore';

export class PDFService {
  private static browser: puppeteer.Browser | null = null;

  private static async getBrowser(): Promise<puppeteer.Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    }
    return this.browser;
  }

  static async generateDietChartPDF(dietPlan: DietPlan, patient: Patient): Promise<Uint8Array> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();

    // Get food items for nutritional data
    const foodItems = await this.getFoodItemsForDietPlan(dietPlan);

    // Calculate nutritional summary
    const nutritionalSummary = this.calculateNutritionalSummary(dietPlan, foodItems);

    const html = this.generateDietChartHTML(dietPlan, patient, nutritionalSummary, foodItems);

    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Add custom CSS for print
    await page.addStyleTag({
      content: `
        @media print {
          body { margin: 0; }
          .page-break { page-break-before: always; }
          .no-print { display: none; }
        }
        @page { margin: 1cm; }
      `
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '1cm',
        right: '1cm',
        bottom: '1cm',
        left: '1cm'
      }
    });

    await page.close();
    return pdfBuffer;
  }

  private static async getFoodItemsForDietPlan(dietPlan: DietPlan): Promise<Map<string, FoodItem>> {
    const foodItems = new Map<string, FoodItem>();

    // Extract all food item names from the diet plan
    const foodNames: string[] = [];
    dietPlan.dietDays?.forEach(day => {
      day.meals?.forEach(meal => {
        meal.items?.forEach(item => {
          // Extract food name (assuming format like "Rice (100g)" or just "Rice")
          const name = item.split(' (')[0].trim();
          if (!foodNames.includes(name)) {
            foodNames.push(name);
          }
        });
      });
    });

    // Query food database for these items
    if (foodNames.length > 0) {
      try {
        const foods = await FirestoreService.getAll<FoodItem>('foods', (query) =>
          query.where('name', 'in', foodNames.slice(0, 10)) // Firestore 'in' limit is 10
        );

        foods.forEach(food => {
          foodItems.set(food.name.toLowerCase(), food);
        });
      } catch (error) {
        console.error('Error fetching food items:', error);
      }
    }

    return foodItems;
  }

  private static calculateNutritionalSummary(dietPlan: DietPlan, foodItems: Map<string, FoodItem>) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let totalFiber = 0;

    let dayCount = 0;

    dietPlan.dietDays?.forEach(day => {
      dayCount++;
      day.meals?.forEach(meal => {
        meal.items?.forEach(item => {
          const name = item.split(' (')[0].trim().toLowerCase();
          const quantity = this.extractQuantity(item);
          const foodItem = foodItems.get(name);

          if (foodItem?.nutritionalData) {
            const multiplier = quantity / 100; // Assuming nutritional data is per 100g
            totalCalories += foodItem.nutritionalData.calories * multiplier;
            totalProtein += foodItem.nutritionalData.protein * multiplier;
            totalCarbs += (foodItem.nutritionalData.carbohydrates || 0) * multiplier;
            totalFat += foodItem.nutritionalData.fat * multiplier;
            totalFiber += (foodItem.nutritionalData.fiber || 0) * multiplier;
          }
        });
      });
    });

    // Average per day
    const avgCalories = Math.round(totalCalories / dayCount);
    const avgProtein = Math.round(totalProtein / dayCount);
    const avgCarbs = Math.round(totalCarbs / dayCount);
    const avgFat = Math.round(totalFat / dayCount);
    const avgFiber = Math.round(totalFiber / dayCount);

    return {
      daily: { calories: avgCalories, protein: avgProtein, carbs: avgCarbs, fat: avgFat, fiber: avgFiber },
      total: { calories: totalCalories, protein: totalProtein, carbs: totalCarbs, fat: totalFat, fiber: totalFiber }
    };
  }

  private static extractQuantity(item: string): number {
    const match = item.match(/\((\d+)g?\)/);
    return match ? parseInt(match[1]) : 100; // Default to 100g if no quantity specified
  }

  private static generateDietChartHTML(
    dietPlan: DietPlan,
    patient: Patient,
    nutritionalSummary: any,
    foodItems: Map<string, FoodItem>
  ): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ayurvedic Diet Chart - ${patient.name}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        .header {
            text-align: center;
            border-bottom: 3px solid #2d5a27;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .header h1 {
            color: #2d5a27;
            margin: 0;
            font-size: 28px;
        }

        .header .subtitle {
            color: #666;
            font-size: 16px;
            margin: 5px 0;
        }

        .patient-info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #2d5a27;
        }

        .patient-info h2 {
            margin-top: 0;
            color: #2d5a27;
            font-size: 20px;
        }

        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 15px;
        }

        .info-item {
            display: flex;
            flex-direction: column;
        }

        .info-label {
            font-weight: bold;
            color: #555;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .info-value {
            font-size: 14px;
            margin-top: 2px;
        }

        .nutrition-summary {
            background: linear-gradient(135deg, #2d5a27, #4a7c59);
            color: white;
            padding: 25px;
            border-radius: 12px;
            margin-bottom: 30px;
        }

        .nutrition-summary h2 {
            margin-top: 0;
            font-size: 22px;
            text-align: center;
        }

        .nutrition-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .nutrition-item {
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            padding: 15px;
            border-radius: 8px;
        }

        .nutrition-value {
            font-size: 24px;
            font-weight: bold;
            display: block;
        }

        .nutrition-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            opacity: 0.9;
        }

        .day-section {
            margin-bottom: 40px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            overflow: hidden;
        }

        .day-header {
            background: #2d5a27;
            color: white;
            padding: 15px 20px;
            font-size: 18px;
            font-weight: bold;
        }

        .meal-section {
            padding: 20px;
            border-bottom: 1px solid #f0f0f0;
        }

        .meal-section:last-child {
            border-bottom: none;
        }

        .meal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }

        .meal-name {
            font-size: 16px;
            font-weight: bold;
            color: #2d5a27;
        }

        .meal-time {
            background: #e8f5e8;
            color: #2d5a27;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }

        .food-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 8px 0;
            border-bottom: 1px solid #f8f9fa;
        }

        .food-item:last-child {
            border-bottom: none;
        }

        .food-name {
            font-weight: 500;
        }

        .food-props {
            font-size: 11px;
            color: #666;
            background: #f8f9fa;
            padding: 2px 6px;
            border-radius: 3px;
        }

        .meal-notes {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 4px;
            padding: 10px;
            margin-top: 10px;
            font-size: 13px;
            color: #856404;
        }

        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
            font-size: 12px;
        }

        .ayurvedic-badge {
            display: inline-block;
            background: #2d5a27;
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 10px;
            margin-left: 5px;
        }

        @media print {
            body { margin: 0; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Ayurvedic Diet Management System</h1>
        <div class="subtitle">Personalized Diet Chart</div>
    </div>

    <div class="patient-info">
        <h2>Patient Information</h2>
        <div class="info-grid">
            <div class="info-item">
                <div class="info-label">Patient Name</div>
                <div class="info-value">${patient.name}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Patient Code</div>
                <div class="info-value">${patient.code}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Age & Gender</div>
                <div class="info-value">${patient.age} years, ${patient.gender}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Dosha Type</div>
                <div class="info-value">${patient.doshaType || 'Not specified'}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Plan Title</div>
                <div class="info-value">${dietPlan.title}</div>
            </div>
            <div class="info-item">
                <div class="info-label">Generated On</div>
                <div class="info-value">${new Date().toLocaleDateString('en-IN')}</div>
            </div>
        </div>
    </div>

    <div class="nutrition-summary">
        <h2>Daily Nutritional Summary</h2>
        <div class="nutrition-grid">
            <div class="nutrition-item">
                <span class="nutrition-value">${nutritionalSummary.daily.calories}</span>
                <span class="nutrition-label">Calories</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${nutritionalSummary.daily.protein}g</span>
                <span class="nutrition-label">Protein</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${nutritionalSummary.daily.carbs}g</span>
                <span class="nutrition-label">Carbs</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${nutritionalSummary.daily.fat}g</span>
                <span class="nutrition-label">Fat</span>
            </div>
            <div class="nutrition-item">
                <span class="nutrition-value">${nutritionalSummary.daily.fiber}g</span>
                <span class="nutrition-label">Fiber</span>
            </div>
        </div>
    </div>

    ${dietPlan.dietDays?.map((day, dayIndex) => `
        <div class="day-section">
            <div class="day-header">Day ${dayIndex + 1}: ${day.day}</div>
            ${day.meals?.map(meal => `
                <div class="meal-section">
                    <div class="meal-header">
                        <div class="meal-name">${meal.name || 'Meal'}</div>
                        <div class="meal-time">${meal.time}</div>
                    </div>
                    ${meal.items?.map(item => {
                        const foodName = item.split(' (')[0].trim();
                        const foodItem = foodItems.get(foodName.toLowerCase());
                        const ayurvedicProps = foodItem?.ayurvedicProperties;

                        return `
                            <div class="food-item">
                                <div class="food-name">${item}</div>
                                ${ayurvedicProps ? `
                                    <div class="food-props">
                                        ${ayurvedicProps.rasa.slice(0, 2).join(', ')}
                                        ${ayurvedicProps.virya === 'Hot' ? '<span class="ayurvedic-badge">Hot</span>' : '<span class="ayurvedic-badge">Cold</span>'}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    }).join('')}
                    ${meal.notes ? `
                        <div class="meal-notes">
                            <strong>Notes:</strong> ${meal.notes}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
    `).join('')}

    <div class="footer">
        <p>This diet chart has been prepared according to Ayurvedic principles and personalized for your health needs.</p>
        <p>Please consult your healthcare provider before making significant changes to your diet.</p>
        <p>Generated by SolveAI Ayurvedic Diet Management System</p>
    </div>
</body>
</html>`;
  }

  static async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}