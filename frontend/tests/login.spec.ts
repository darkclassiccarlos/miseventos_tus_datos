import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
    test('should login successfully with valid credentials', async ({ page }) => {
        // Start from the home page
        await page.goto('/');

        // Click on the login button (Iniciar Sesión)
        await page.click('text=Iniciar Sesión');

        // Verify we are on the login page
        await expect(page).toHaveURL('/login');

        // Fill the login form
        // The previous implementation used standard MUI textfields
        await page.fill('input[type="email"]', 'admin@miseventos.com');
        await page.fill('input[type="password"]', 'password123');

        // Submit the form
        await page.click('button:has-text("Ingresar")');

        // Verify redirection to home page
        await expect(page).toHaveURL('/');

        // Verify that the login button is gone and the user's name or logout is present
        // The Navbar shows Logout button when authenticated
        await expect(page.locator('button:has-text("Cerrar Sesión")')).toBeVisible();
    });

    test('should show error message with invalid credentials', async ({ page }) => {
        await page.goto('/login');

        await page.fill('input[type="email"]', 'wrong@example.com');
        await page.fill('input[type="password"]', 'wrongpassword');
        await page.click('button:has-text("Ingresar")');

        // The login page shows an Alert on error
        await expect(page.locator('.MuiAlert-message')).toBeVisible();
    });
});
