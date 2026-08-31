import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileSignature, FileText, Award, FileCheck } from 'lucide-react';
import AdminLayout from '../components/AdminLayout';
import '../styles/tailwind.css';

const LETTERS = [
  { label: 'Generate Letter of Intent', path: '/admin/essentials/letter-of-intent', icon: FileSignature },
  { label: 'Generate Offer Letter', path: '/admin/essentials/offer-letter', icon: FileText },
  { label: 'Generate Experience Letter', path: '/admin/essentials/experience-letter', icon: Award },
  { label: 'Generate Relieving Letter', path: '/admin/essentials/relieving-letter', icon: FileCheck },
];

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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {LETTERS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="flex flex-col items-start gap-3 rounded-xl border border-border/80 bg-card p-4 text-left shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex size-10 items-center justify-center rounded-xl bg-client/10 text-client">
                <Icon className="size-5" />
              </div>
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
            </button>
          );
        })}
      </div>
    </AdminLayout>
  );
}

export default EssentialsPage;
