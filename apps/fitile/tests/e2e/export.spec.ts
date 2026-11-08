import { expect, test } from '@playwright/test'

test('downloads a portable JSON archive', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('tab', { name: 'Data & sync' }).click()
  const downloadEvent = page.waitForEvent('download')
  await page.getByRole('button', { name: 'JSON' }).click()
  const download = await downloadEvent
  expect(download.suggestedFilename()).toMatch(/^fittile-export-\d{4}-\d{2}-\d{2}\.json$/)
})
