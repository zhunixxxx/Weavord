import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/Home'
import ImportPage from './pages/Import'
import WordListPage from './pages/WordList'
import WordDetailPage from './pages/WordDetail'
import StudyPage from './pages/Study'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/words" element={<WordListPage />} />
          <Route path="/words/:id" element={<WordDetailPage />} />
          <Route path="/study" element={<StudyPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
