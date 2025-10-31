import { test, expect } from '@playwright/test';

const signUpData = [
  { email: 'test1@example.com', password: 'password123', name: 'Test User 1', expectedSuccess: true },
  { email: '', password: 'password123', name: 'Test User 2', expectedSuccess: false }
];

const searchData = [
  { productName: 'Valid Product', expectedResults: true },
  { productName: 'Invalid Product', expectedResults: false }
];

test.describe('Account Creation Tests', () => {
  signUpData.forEach(({ email, password, name, expectedSuccess }) => {
    test(`✅ Account Creation - ${expectedSuccess ? 'Success' : 'Failure'}`, async ({ page }) => {
      await page.goto('/signup');
      await page.fill('#email', email);
      await page.fill('#password', password);
      await page.fill('#name', name);
      await page.click('button[type="submit"]');

      if (expectedSuccess) {
        await expect(page.locator('.success-message')).toBeVisible();
      } else {
        await expect(page.locator('.error-message')).toBeVisible();
      }
    });
  });
});


test.describe('Product Search Tests', () => {
  searchData.forEach(({ productName, expectedResults }) => {
    test(`✅ Product Search - ${expectedResults ? 'Results Found' : 'No Results'}`, async ({ page }) => {
      await page.goto('/');
      await page.fill('#search-bar', productName);
      await page.press('#search-bar', 'Enter');

      if (expectedResults) {
        await expect(page.locator('.search-results')).toBeVisible();
      } else {
        await expect(page.locator('.no-results-message')).toBeVisible();
      }
    });
  });
});


test.describe('Other Tests', () => {
  test('✅ Add to Cart - Success', async ({ page }) => {
    await page.goto('/');
    await page.click('.product-image');
    await page.selectOption('#quantity', '1');
    await page.click('button[type="submit"]'); // Add to Cart button
    await expect(page.locator('.success-message')).toBeVisible();
  });

  test('✅ Add to Cart - Out of Stock', async ({ page }) => {
    await page.goto('/');
    await page.click('.out-of-stock-product .product-image'); // Assuming a class for out-of-stock products
    await page.click('button[type="submit"]'); // Add to Cart button
    await expect(page.locator('.error-message')).toBeVisible();
  });

  // ... (Similarly implement other tests like Wishlist, Checkout, Promotions, Address Management, Reviews, Filtering, Two-Factor Authentication)
});