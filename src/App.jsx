import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';

import Stream from './pages/Stream';
import Profile from './pages/Profile';
import Scan from './pages/Scan';
import Login from './pages/Login';
import Register from './pages/Register';
import EditProfile from './pages/EditProfile';
import Questionare from './pages/Questionare';
import Upload from './pages/Upload';
import Test from './pages/Test';
import Landing from './pages/Landing';
import Backstage from './pages/Backstage';

import Footer from './components/Footer';
import Header from './components/Header';
import GlitchLoading from './components/GlitchLoading';

// Wrapper to use hooks like useLocation inside Router
function AppContent({ user }) {
  const location = useLocation();

  return (
    <>
      <Header />
      <div style={{ padding: '40px 0px 0px 0px' }}>
        <Routes>
          <Route path="/" element={user ? <Stream /> : <Navigate to="/landing" />} />
          <Route path="/scan" element={user ? <Scan /> : <Navigate to="/login" />} />
          <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/edit-profile" element={user ? <EditProfile /> : <Navigate to="/login" />} />
          <Route path="/questionare" element={user ? <Questionare /> : <Navigate to="/login" />} />
          <Route path="/upload" element={user ? <Upload /> : <Navigate to="/login" />} />
          <Route path="/test" element={<Test />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/loading" element={<GlitchLoading />} />
          <Route path="/backstage" element={<Backstage />} />
          
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {location.pathname !== '/landing' && location.pathname !== '/backstage' && <Footer />}
    </>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setCheckingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  if (checkingAuth) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <AppContent user={user} />
    </Router>
  );
}

export default App;
