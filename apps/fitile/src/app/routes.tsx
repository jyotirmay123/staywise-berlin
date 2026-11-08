import { Navigate, Route, Routes } from 'react-router-dom'
import { TodayPage } from '../features/today/TodayPage'
import { AuthCallbackPage } from '../features/auth/AuthCallbackPage'
import { ProfilePage } from '../features/settings/ProfilePage'
import { OnboardingPage } from '../features/onboarding/OnboardingPage'
import { TrainPage } from '../features/training/TrainPage'
import { RecoveryPage } from '../features/recovery/RecoveryPage'
import { FoodPage } from '../features/nutrition/FoodPage'
import { ProgressPage } from '../features/progress/ProgressPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<TodayPage />} />
      <Route path="/train" element={<TrainPage />} />
      <Route path="/recovery" element={<RecoveryPage />} />
      <Route path="/food" element={<FoodPage />} />
      <Route path="/progress" element={<ProgressPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="*" element={<Navigate replace to="/" />} />
    </Routes>
  )
}
