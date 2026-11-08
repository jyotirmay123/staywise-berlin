export const onboardingSteps = ['goal', 'split', 'equipment', 'schedule'] as const
export type OnboardingStep = (typeof onboardingSteps)[number]
