


import React, { useState } from 'react';
import { Plus, Search, FileText, Trash2, Clock, LogOut, ChevronRight, LayoutGrid, List as ListIcon, Zap } from 'lucide-react';
import { SavedResume, User, PageView } from '../types';
import { Logo } from './Logo';
import { Footer } from './Footer';

interface DashboardProps {
  user: User;
  resumes: SavedResume[];
  onCreate: () => void;
  onOpen: (resume: SavedResume) => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
  onAddCredits: () => void;
  onNavigate: (page: PageView, subPage?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, resumes, onCreate, onOpen, onDelete, onLogout, onAddCredits, onNavigate }) => {
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  const filteredResumes = resumes.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase()) || 
    (r.baseResumeData?.fullName || '').toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      


      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-grow w-full">
        
        {/* Actions Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">My Resumes</h2>
            <p className="text-slate-500 text-sm mt-1">Manage your base resumes and tailored variations.</p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
             <div className="relative flex-grow md:flex-grow-0">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search resumes..." 
                 className="w-full md:w-64 pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             <div className="flex bg-white border border-slate-200 rounded-lg p-1 gap-1">
               <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}><LayoutGrid size={18}/></button>
               <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}><ListIcon size={18}/></button>
             </div>
             <button 
               onClick={onCreate}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 shadow-md shadow-indigo-200 transition-all"
             >
               <Plus size={18} /> New Resume
             </button>
          </div>
        </div>

        {/* Content Area */}
        {filteredResumes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center shadow-sm">
             <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
               <FileText size={32} />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">No resumes found</h3>
             <p className="text-slate-500 max-w-sm mx-auto mb-6">Create your first base resume to get started. You can then tailor it to infinite job descriptions.</p>
             <button 
               onClick={onCreate}
               className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 transition-all inline-flex items-center gap-2"
             >
               <Plus size={18} /> Create First Resume
             </button>
          </div>
        ) : (
          <div className={view === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
            {filteredResumes.map(resume => (
              <div 
                key={resume.id} 
                className={`group bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex ${view === 'list' ? 'flex-row items-center p-4' : 'flex-col'}`}
              >
                 {view === 'grid' ? (
                   // Grid Item
                   <>
                      <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                           <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-lg">
                             {(resume.baseResumeData?.fullName || 'U').charAt(0)}
                           </div>
                           <button onClick={() => onDelete(resume.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1">
                             <Trash2 size={16} />
                           </button>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1 truncate">{resume.title}</h3>
                        <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                          <Clock size={12} /> Modified {formatDate(resume.lastModified)}
                        </p>
                        
                        <div className="flex items-center gap-2 mb-6">
                           <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${resume.tailoredResumeData ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                             {resume.tailoredResumeData ? 'Tailored' : 'Base Draft'}
                           </span>
                           <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-indigo-50 text-indigo-600 uppercase">
                             {resume.config.template}
                           </span>
                        </div>

                        <button 
                          onClick={() => onOpen(resume)}
                          className="w-full py-2 bg-slate-50 text-slate-700 font-bold text-sm rounded-lg hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                        >
                          Open Editor <ChevronRight size={14} />
                        </button>
                      </div>
                   </>
                 ) : (
                   // List Item
                   <>
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold flex-shrink-0 mr-4">
                         {(resume.baseResumeData?.fullName || 'U').charAt(0)}
                      </div>
                      <div className="flex-grow min-w-0 mr-4">
                        <h3 className="font-bold text-slate-800 truncate">{resume.title}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                           <span>Modified {formatDate(resume.lastModified)}</span>
                           <span>•</span>
                           <span>{resume.tailoredResumeData ? 'Tailored' : 'Base Draft'}</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                         <button onClick={() => onOpen(resume)} className="px-4 py-2 bg-indigo-50 text-indigo-600 font-bold text-xs rounded hover:bg-indigo-100">Open</button>
                         <button onClick={() => onDelete(resume.id)} className="p-2 text-slate-400 hover:text-red-500 rounded hover:bg-red-50"><Trash2 size={16}/></button>
                      </div>
                   </>
                 )}
              </div>
            ))}
          </div>
        )}

      </main>

      <Footer onNavigate={onNavigate} />
    </div>
  );
};
