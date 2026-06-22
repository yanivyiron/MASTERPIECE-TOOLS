import React from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useAuth } from '../context/AuthContext';
import { Pencil, Eye } from 'lucide-react';

/** Floating bottom-left button — only visible to logged-in admins on PUBLIC pages.
 * Toggles the live visual editor overlay. */
const FloatingEditToggle = () => {
  const { user } = useAuth();
  const { editMode, setEditMode } = useSiteConfig();
  if (!user) return null;
  // Don't show on /admin/* — only on the public site
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return null;
  return (
    <button
      onClick={() => setEditMode(!editMode)}
      data-testid="floating-edit-toggle"
      className={`fixed bottom-5 left-5 z-[60] inline-flex items-center gap-2 px-4 py-2.5 border-2 shadow-lg transition-all ${editMode ? 'bg-orange-500 text-black border-orange-300' : 'bg-black text-white border-orange-500/60 hover:border-orange-500'}`}
      title="Toggle Wix-style live editor"
    >
      {editMode ? <Eye className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
      <span className="text-[10px] uppercase tracking-widest font-bold">{editMode ? 'Exit edit mode' : 'Edit site'}</span>
    </button>
  );
};

export default FloatingEditToggle;
