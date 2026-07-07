import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/AdminLayout';
import '../styles/Dashboard.css';

function EssentialsPage({ userName, onLogout }) {
  const navigate = useNavigate();

  return (
    <AdminLayout
      userName={userName}
      onLogout={onLogout}
      activeItem="essentials"
      title="Essentials"
      subtitle="Generate HR letters from one place."
    >
      <div className="essentials-grid">
            <button
              type="button"
              className="essentials-card"
              onClick={() => navigate('/admin/essentials/letter-of-intent')}
            >
              <span>Generate Letter of Intent</span>
            </button>
            <button
              type="button"
              className="essentials-card"
              onClick={() => navigate('/admin/essentials/offer-letter')}
            >
              <span>Generate Offer Letter</span>
            </button>
            <button
              type="button"
              className="essentials-card"
              onClick={() => navigate('/admin/essentials/experience-letter')}
            >
              <span>Generate Experience Letter</span>
            </button>
            <button
              type="button"
              className="essentials-card"
              onClick={() => navigate('/admin/essentials/relieving-letter')}
            >
              <span>Generate Relieving Letter</span>
            </button>
      </div>
    </AdminLayout>
  );
}

export default EssentialsPage;
