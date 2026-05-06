import Header from './components/Header';
import SectionIntroduction from './components/SectionIntroduction';
import SectionProfile from './components/SectionProfile';
import WhackAMole from './components/WhackAMole';
import './App.css';

function App() {
  return (
    <div className="app-container">
      <Header />
      <main>
        <SectionIntroduction />
        <SectionProfile />
        <WhackAMole />
      </main>
      <footer style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
        <p>© {new Date().getFullYear()} 期中網站. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default App;
