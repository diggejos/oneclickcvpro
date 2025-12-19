import React, { useMemo, useEffect, useRef, useState } from 'react';
import { ResumeData, TemplateId, Experience, Education, ResumeLanguage } from '../types';
import { MapPin, Sparkles } from 'lucide-react';
import { SECTION_TITLES } from './Editor';

interface ResumePreviewProps {
  data: ResumeData;
  baseData?: ResumeData | null;
  isTailored?: boolean;
  template: TemplateId;
  showLogos: boolean;
  language?: ResumeLanguage; // ✅ Added
}

// ✅ Translation helper
const getTitle = (key: string, lang: string = 'English') => {
  return SECTION_TITLES[key]?.[lang] || SECTION_TITLES[key]?.['English'] || key;
};

interface ExperienceGroup {
  isGroup: boolean;
  company: string;
  website?: string;
  items: Experience[];
}

const groupExperience = (experience: Experience[]): ExperienceGroup[] => {
  const groups: ExperienceGroup[] = [];
  if (!experience || experience.length === 0) return groups;
  let i = 0;
  while (i < experience.length) {
    const current = experience[i];
    const groupItems = [current];
    let j = i + 1;
    while (j < experience.length && experience[j].company.trim().toLowerCase() === current.company.trim().toLowerCase()) {
      groupItems.push(experience[j]);
      j++;
    }
    groups.push({ isGroup: groupItems.length > 1, company: current.company, website: current.website, items: groupItems });
    i = j;
  }
  return groups;
};

const getLogoUrl = (website?: string) => {
  if (!website) return null;
  return `https://www.google.com/s2/favicons?domain=${website}&sz=128`;
};

const LogoBox: React.FC<{ website?: string, showLogos: boolean, fallback: string }> = ({ website, showLogos, fallback }) => {
  if (!showLogos) return null;
  const logoUrl = getLogoUrl(website);
  return (
    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm print:shadow-none print:border-slate-300">
      {logoUrl ? <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} /> : <span className="text-xs font-bold text-slate-400">{fallback.charAt(0)}</span>}
    </div>
  );
};

const SkillBadge: React.FC<{ skill: string; isNew: boolean }> = ({ skill, isNew }) => (
  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md border mr-2 mb-2 transition-colors break-inside-avoid ${isNew ? 'bg-emerald-100 text-emerald-800 border-emerald-200 print:bg-slate-100 print:text-slate-700 print:border-slate-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
    {skill}
    {isNew && <span className="print:hidden ml-1 text-emerald-600">•</span>}
  </span>
);

const RoleDetails: React.FC<{ exp: Experience; isGrouped?: boolean }> = ({ exp, isGrouped }) => (
  <div className={`mb-3 ${isGrouped ? 'mt-2' : ''} break-inside-avoid`}>
    <div className="flex justify-between items-baseline mb-1">
      <h3 className={`${isGrouped ? 'text-sm' : 'text-md'} font-bold text-slate-900`}>{exp.role}</h3>
      <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-4">{exp.duration}</span>
    </div>
    {!isGrouped && <div className="text-sm text-slate-600 italic mb-2 font-medium">{exp.company}</div>}
    
    {/* ✅ Additional Info Field */}
    {exp.additionalInfo && <div className="text-xs text-slate-500 mb-1 italic">{exp.additionalInfo}</div>}

    <ul className="list-disc list-outside ml-4 space-y-1">
      {exp.points.map((point, pIdx) => (
        <li key={pIdx} className="text-sm text-slate-700 leading-snug pl-1 marker:text-slate-400">{point}</li>
      ))}
    </ul>
  </div>
);

const ExperienceBlock: React.FC<{ group: ExperienceGroup; showLogos: boolean }> = ({ group, showLogos }) => {
  if (group.isGroup) {
    return (
      <div className="mb-6 break-inside-avoid page-break-inside-avoid">
        <div className="flex gap-4 items-start">
          <LogoBox website={group.website} showLogos={showLogos} fallback={group.company} />
          <div className="flex-grow">
            <div className="mb-2 border-l-2 border-slate-200 pl-3 -ml-3 py-1">
               <h3 className="text-md font-bold text-slate-800">{group.company}</h3>
               <p className="text-xs text-slate-500">Multiple Roles</p>
            </div>
            <div className="space-y-4 relative">
               <div className="absolute left-[-11px] top-2 bottom-2 w-0.5 bg-slate-200 hidden sm:block"></div>
               {group.items.map((exp, idx) => <RoleDetails key={exp.id || idx} exp={exp} isGrouped />)}
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="mb-6 break-inside-avoid page-break-inside-avoid">
      <div className="flex gap-4 items-start">
        <LogoBox website={group.items[0].website} showLogos={showLogos} fallback={group.items[0].company} />
        <div className="flex-grow"><RoleDetails exp={group.items[0]} isGrouped={false} /></div>
      </div>
    </div>
  );
};

const EducationItem: React.FC<{ edu: Education; showLogos: boolean; compact?: boolean }> = ({ edu, showLogos, compact }) => (
   <div className={`flex gap-3 items-start break-inside-avoid page-break-inside-avoid ${compact ? 'mb-3' : 'mb-4'}`}>
      <LogoBox website={edu.website} showLogos={showLogos} fallback={edu.school} />
      <div className="flex-grow">
        {compact ? (
           <>
             <div className="text-xs font-bold text-slate-900">{edu.degree}</div>
             <div className="text-xs text-slate-600">{edu.school}</div>
             <div className="text-[10px] text-slate-400 mt-0.5">{edu.year}</div>
           </>
        ) : (
          <div>
             <div className="flex justify-between items-start">
               <div>
                 <div className="text-sm font-bold text-slate-800">{edu.school}</div>
                 <div className="text-sm text-slate-600">{edu.degree}</div>
               </div>
               <span className="text-xs text-slate-500 font-medium">{edu.year}</span>
             </div>
             {/* ✅ Grade and Additional Info */}
             <div className="flex gap-3 mt-1 text-xs text-slate-500">
                {edu.grade && <span className="font-medium text-indigo-600">Grade: {edu.grade}</span>}
                {edu.additionalInfo && <span className="italic">{edu.additionalInfo}</span>}
             </div>
           </div>
        )}
      </div>
   </div>
);

export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, baseData, isTailored, template, showLogos, language = 'English' }) => {
  const experienceGroups = useMemo(() => groupExperience(data.experience), [data.experience]);
  const isNewSkill = (skill: string) => !isTailored || !baseData ? false : !baseData.skills.some(s => s.toLowerCase() === skill.toLowerCase());
  const isSummaryChanged = () => !isTailored || !baseData ? false : data.summary !== baseData.summary;
  const hasPhoto = !!data.profileImage;

  // ✅ MOBILE SCALING LOGIC
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const parentWidth = containerRef.current.parentElement?.clientWidth || window.innerWidth;
      const baseWidth = 794; 
      const padding = 32; 
      const available = parentWidth - padding;
      setScale(available < baseWidth ? available / baseWidth : 1);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const renderClassic = () => (
    <>
       <header className="border-b-2 border-slate-800 pb-6 mb-6 flex gap-6 items-start break-inside-avoid">
        {hasPhoto && <img src={data.profileImage} alt={data.fullName} className="w-24 h-24 rounded-lg object-cover shadow-sm border border-slate-200 print:shadow-none" />}
        <div className="flex-grow">
          <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-wider mb-2">{data.fullName}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-medium">
            {data.location && <div className="flex items-center gap-1"><MapPin size={14} /><span>{data.location}</span></div>}
            <div className="flex items-center gap-1"><span className="opacity-75">{data.contactInfo}</span></div>
          </div>
        </div>
      </header>
      <section className={`mb-6 p-2 -mx-2 rounded-md transition-colors break-inside-avoid ${isSummaryChanged() ? 'bg-blue-50/50 print:bg-transparent' : ''}`}>
        <div className="flex items-center gap-2 mb-2 border-b border-slate-300 pb-1">
           <h2 className="text-lg font-bold text-slate-900 uppercase">{getTitle("Professional Summary", language)}</h2>
           {isSummaryChanged() && <span className="print:hidden text-[10px] font-bold text-blue-600 bg-blue-100 px-2 rounded-full flex items-center gap-1"><Sparkles size={10} /> Adapted</span>}
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
      </section>
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold text-slate-900 uppercase border-b border-slate-300 mb-3 pb-1">{getTitle("Core Competencies", language)}</h2>
        <div className="flex flex-wrap">{data.skills.map((skill, idx) => <SkillBadge key={idx} skill={skill} isNew={isNewSkill(skill)} />)}</div>
      </section>
      <section className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 uppercase border-b border-slate-300 mb-4 pb-1 break-inside-avoid">{getTitle("Experience", language)}</h2>
        <div>{experienceGroups.map((group, idx) => <ExperienceBlock key={idx} group={group} showLogos={showLogos} />)}</div>
      </section>
      {data.education && data.education.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-900 uppercase border-b border-slate-300 mb-4 pb-1">{getTitle("Education", language)}</h2>
          <div className="space-y-3">{data.education.map((edu, idx) => <EducationItem key={edu.id || idx} edu={edu} showLogos={showLogos} />)}</div>
        </section>
      )}
    </>
  );

  return (
    <div ref={containerRef} className="flex justify-center origin-top-left" style={{ transform: `scale(${scale})`, transformOrigin: 'top center', marginBottom: `-${(1 - scale) * 100}%` }}>
      <div id="resume-preview-content" className="resume-preview-container w-[210mm] min-h-[297mm] bg-white shadow-2xl p-10 text-slate-800">
        {/* Render Classic for now (can expand to Modern/Minimal) */}
        {renderClassic()} 
      </div>
    </div>
  );
};
