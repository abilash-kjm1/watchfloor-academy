import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import './styles/index.css'
import { ProgressProvider } from './progress/store'
import { Layout } from './components/Layout'
import { ErrorBoundary, PageSkeleton } from './components/Boundary'
import Home from './pages/Home'
import NotFound from './pages/NotFound'

// Pages load on demand so the first visit downloads less.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Curriculum = lazy(() => import('./pages/Curriculum').then(m => ({ default: m.Curriculum })))
const ModulePage = lazy(() => import('./pages/Curriculum').then(m => ({ default: m.ModulePage })))
const LessonPage = lazy(() => import('./pages/LessonPage'))
const Glossary = lazy(() => import('./pages/Glossary'))
const KqlReference = lazy(() => import('./pages/KqlReference'))
const Sc200 = lazy(() => import('./pages/Sc200'))
const ExamPractice = lazy(() => import('./pages/ExamPractice'))
const Interview = lazy(() => import('./pages/Interview'))
const Daily = lazy(() => import('./pages/Daily'))
const Tickets = lazy(() => import('./pages/Tickets'))
const Flashcards = lazy(() => import('./pages/Flashcards'))
const Notes = lazy(() => import('./pages/Mine').then(m => ({ default: m.Notes })))
const Bookmarks = lazy(() => import('./pages/Mine').then(m => ({ default: m.Bookmarks })))
const StudyPlan = lazy(() => import('./pages/Mine').then(m => ({ default: m.StudyPlan })))
const Settings = lazy(() => import('./pages/Mine').then(m => ({ default: m.Settings })))

function AppRoutes() {
  const loc = useLocation()
  return (
    <ErrorBoundary resetKey={loc.pathname}>
      <Suspense fallback={<PageSkeleton />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/module/:id" element={<ModulePage />} />
          <Route path="/lesson/:id" element={<LessonPage />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/kql" element={<KqlReference />} />
          <Route path="/sc200" element={<Sc200 />} />
          <Route path="/sc200/practice" element={<ExamPractice />} />
          <Route path="/interview" element={<Interview />} />
          <Route path="/daily" element={<Daily />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/notes" element={<Notes />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/plan" element={<StudyPlan />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <HashRouter>
        <Layout>
          <AppRoutes />
        </Layout>
      </HashRouter>
    </ProgressProvider>
  </StrictMode>,
)
