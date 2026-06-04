import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import DriversPage from './pages/DriversPage';
import RidesPage from './pages/RidesPage';
import IncidentsPage from './pages/IncidentsPage';
import FinancePage from './pages/FinancePage';
import PricingPage from './pages/PricingPage';
import LoginPage from './pages/LoginPage';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/overview" replace />} />
        <Route path="overview"  element={<OverviewPage />} />
        <Route path="drivers"   element={<DriversPage />} />
        <Route path="rides"     element={<RidesPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="finance"   element={<FinancePage />} />
        <Route path="pricing"   element={<PricingPage />} />
      </Route>
    </Routes>
  );
}
