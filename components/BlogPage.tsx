
import React, { useState } from 'react';
import { ArrowLeft, Calendar, Tag, User as UserIcon } from 'lucide-react';
import { Logo } from './Logo';
import { BLOG_POSTS } from '../data/content';
import { BlogPost } from '../types';

interface BlogPageProps {
  onBack: () => void;
  initialPostId?: string;
}

export const BlogPage: React.FC<BlogPageProps> = ({ onBack, initialPostId }) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | undefined>(
    initialPostId ? BLOG_POSTS.find(p => p.id === initialPostId) : undefined
  );

  if (selectedPost) {
    // Single Post View
    return (
      <div className="min-h-screen bg-white">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
             <button onClick={() => setSelectedPost(undefined)} className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-medium">
               <ArrowLeft size={20} /> Back to Blog
             </button>
             <Logo iconOnly />
          </div>
        </nav>

        <article className="max-w-3xl mx-auto px-6 py-12">
          <div className="mb-8">
            <span className="text-indigo-600 font-bold text-sm uppercase tracking-wide bg-indigo-50 px-3 py-1 rounded-full">{selectedPost.tags[0]}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 leading-tight">
            {selectedPost.title}
          </h1>

          <div className="flex items-center gap-6 text-slate-500 text-sm mb-12 border-b border-slate-100 pb-8">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-slate-100 rounded-full"><UserIcon size={14}/></div>
              {selectedPost.author}
            </div>
            <div className="flex items-center gap-2">
               <div className="p-1 bg-slate-100 rounded-full"><Calendar size={14}/></div>
               {selectedPost.date}
            </div>
          </div>

          <div className="relative mb-12 h-64 md:h-96 w-full rounded-2xl overflow-hidden shadow-lg">
             <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-full object-cover" />
          </div>

          <div 
            className="prose prose-lg prose-indigo text-slate-700 max-w-none"
            dangerouslySetInnerHTML={{ __html: selectedPost.content }}
          />

          <div className="mt-16 pt-8 border-t border-slate-200">
             <button onClick={onBack} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-colors">
               Build Your Resume Now
             </button>
          </div>
        </article>
      </div>
    );
  }

  // Blog List View
  return (
    <div className="min-h-screen bg-slate-50">
       <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <Logo />
                <span className="text-slate-300 font-light text-2xl">|</span>
                <span className="font-serif italic text-slate-500 text-lg">Blog</span>
             </div>
             <button onClick={onBack} className="text-sm font-bold text-slate-600 hover:text-indigo-600">
               Go to App
             </button>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-6 py-16">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Latest Career Insights</h1>
            <p className="text-lg text-slate-600">Tips, tricks, and strategies to land your dream job in 2025.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {BLOG_POSTS.map(post => (
              <div 
                key={post.id} 
                className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full"
                onClick={() => setSelectedPost(post)}
              >
                <div className="h-48 overflow-hidden relative">
                   <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                   <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-indigo-600 uppercase tracking-wide shadow-sm">
                      {post.tags[0]}
                   </div>
                </div>
                <div className="p-6 flex-grow flex flex-col">
                   <div className="text-xs text-slate-400 mb-3 flex items-center gap-2">
                      <Calendar size={12}/> {post.date}
                   </div>
                   <h2 className="text-xl font-bold text-slate-800 mb-3 leading-tight group-hover:text-indigo-600 transition-colors">
                     {post.title}
                   </h2>
                   <p className="text-slate-600 text-sm mb-6 flex-grow leading-relaxed line-clamp-3">
                     {post.excerpt}
                   </p>
                   <div className="flex items-center justify-between text-sm font-medium pt-4 border-t border-slate-100">
                      <span className="text-slate-500">{post.author.split(',')[0]}</span>
                      <span className="text-indigo-600 flex items-center gap-1 group">Read Article <ArrowLeft size={14} className="rotate-180 transition-transform group-hover:translate-x-1"/></span>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </main>
    </div>
  );
};
