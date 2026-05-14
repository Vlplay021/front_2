import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { lazy, Suspense } from 'react'

const Home = lazy(() => import('./pages/Home'))
const About = lazy(() => import('./pages/About'))

function App() {
  return (
    <BrowserRouter>
      <div>
        <nav style={{ padding: '1rem', backgroundColor: '#f0f0f0', marginBottom: '1rem' }}>
          <Link to="/" style={{ marginRight: '1rem' }}>Главная</Link>
          <Link to="/about">О нас</Link>
        </nav>
        <Suspense fallback={<div className="loader">Загрузка...</div>}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  )
}

export default App