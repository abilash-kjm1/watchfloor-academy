import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Route, Routes } from 'react-router-dom'
import './styles/index.css'
import { ProgressProvider } from './progress/store'
import { Layout } from './components/Layout'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import { Curriculum, ModulePage } from './pages/Curriculum'
import LessonPage from './pages/LessonPage'
import Glossary from './pages/Glossary'
import KqlReference from './pages/KqlReference'
import Sc200 from './pages/Sc200'
import ExamPractice from './pages/ExamPractice'
import Interview from './pages/Interview'
import Daily from './pages/Daily'
import Tickets from './pages/Tickets'
import { Bookmarks, Notes, Settings, StudyPlan } from './pages/Mine'
import NotFound from './pages/NotFound'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProgressProvider>
      <HashRouter>
        <Layout>
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
            <Route path="/notes" element={<Notes />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/plan" element={<StudyPlan />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </HashRouter>
    </ProgressProvider>
  </StrictMode>,
)
