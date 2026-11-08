import { expect, test } from '@playwright/test'

test('starts the recommended workout from Today', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: /Start workout/ }).click()
  await expect(page).toHaveURL(/\/train$/)
  await expect(page.getByRole('heading', { name: 'Train what’s ready.' })).toBeVisible()
})

test('switches recommendation source and logs a set', async ({ page }) => {
  await page.goto('/train')
  await page.getByRole('button', { name: /AI Coach/ }).click()
  await expect(page.getByText('AI alternative preview')).toBeVisible()
  await page.getByRole('button', { name: 'Smart plan' }).click()
  await page.getByRole('button', { name: /Start workout/ }).click()
  await page.getByRole('button', { name: /^Complete .* set 1$/ }).first().click()
  await expect(page.getByText(/1 of \d+ sets/)).toBeVisible()
})
