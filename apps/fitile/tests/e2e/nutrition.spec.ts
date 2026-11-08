import { expect, test } from '@playwright/test'

test('adds a food and opens barcode entry', async ({ page }) => {
  await page.goto('/food')
  await page.getByRole('button', { name: 'Add food' }).click()
  await page.getByRole('button', { name: 'Add Skyr yoghurt' }).click()
  await expect(page.getByText('Skyr yoghurt')).toBeVisible()
  await page.getByRole('button', { name: /Scan barcode/ }).click()
  await page.getByLabel('Enter barcode number').fill('4008400401829')
  await expect(page.getByRole('button', { name: 'Look up' })).toBeEnabled()
})
