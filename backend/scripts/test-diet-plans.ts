#!/usr/bin/env ts-node

// Test script for diet plan creation and notifications

import { dietPlansService } from '../src/services/dietPlans';
import { notificationsService } from '../src/services/notifications';

async function testDietPlanNotifications() {
  console.log('Testing diet plan creation and notifications...');

  try {
    // Test data - using a mock patient ID (assuming it exists)
    const testPatientId = 'test-patient-id';
    const testDietitianId = 'test-dietitian-id';

    const dietPlanData = {
      patientId: testPatientId,
      dietitianId: testDietitianId,
      title: 'Test Ayurvedic Diet Plan',
      description: 'A test diet plan for notification testing',
      dietDays: [
        {
          day: 'Monday',
          meals: [
            {
              time: '08:00',
              name: 'Breakfast',
              items: ['Oatmeal', 'Banana', 'Green Tea'],
              notes: 'Start your day with light breakfast'
            },
            {
              time: '13:00',
              name: 'Lunch',
              items: ['Brown Rice', 'Lentils', 'Spinach'],
              notes: 'Balanced lunch for energy'
            }
          ]
        }
      ],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('Creating diet plan...');
    const createdPlan = await dietPlansService.create(dietPlanData);
    console.log('Diet plan created:', createdPlan.id);

    // Check if notification was created
    console.log('Checking for notifications...');
    const notifications = await notificationsService.getAll(testPatientId);
    const dietPlanNotifications = notifications.filter(n =>
      n.type === 'diet_plan_delivery' || n.type === 'diet_plan_activation'
    );

    console.log(`Found ${dietPlanNotifications.length} diet plan notifications:`);
    dietPlanNotifications.forEach(notification => {
      console.log(`- ${notification.type}: ${notification.title}`);
      console.log(`  Message: ${notification.message}`);
    });

    // Test activation notification by updating isActive from false to true
    console.log('\nTesting activation notification...');

    // First set to inactive
    await dietPlansService.update(createdPlan.id, { isActive: false });
    console.log('Set diet plan to inactive');

    // Then activate it
    await dietPlansService.update(createdPlan.id, { isActive: true });
    console.log('Activated diet plan');

    // Check for new notification
    const updatedNotifications = await notificationsService.getAll(testPatientId);
    const activationNotifications = updatedNotifications.filter(n => n.type === 'diet_plan_activation');

    console.log(`Found ${activationNotifications.length} activation notifications after update`);

    if (activationNotifications.length > dietPlanNotifications.filter(n => n.type === 'diet_plan_activation').length) {
      console.log('✅ Activation notification created successfully!');
    } else {
      console.log('❌ Activation notification not created');
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

async function main() {
  console.log('Starting diet plan notification tests...\n');

  await testDietPlanNotifications();

  console.log('\nDiet plan notification tests completed.');
}

main().catch(console.error);