import React, { useMemo } from 'react';
import { ResumeData, TemplateId, Experience, Education } from '../types';
import { MapPin, Sparkles } from 'lucide-react';

interface ResumePreviewProps {
  data: ResumeData;
  baseData?: ResumeData | null;
  isTailored?: boolean;
  template: TemplateId;
  showLogos: boolean;
}

// --- DATA HELPERS ---

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

    // Look ahead for same company (case-insensitive)
    while (
      j < experience.length && 
      experience[j].company.trim().toLowerCase() === current.company.trim().toLowerCase()
    ) {
      groupItems.push(experience[j]);
      j++;
    }

    if (groupItems.length > 1) {
      groups.push({
        isGroup: true,
        company: current.company,
        website: current.website,
        items: groupItems
      });
    } else {
      groups.push({
        isGroup: false,
        company: current.company,
        website: current.website,
        items: [current]
      });
    }
    i = j;
  }
  return groups;
};

// Helper to get favicon/logo URL
const getLogoUrl = (website?: string) => {
  if (!website) return null;
  return `https://www.google.com/s2/favicons?domain=${website}&sz=128`;
};

// --- SHARED SUB-COMPONENTS ---

const LogoBox: React.FC<{ website?: string, showLogos: boolean, fallback: string }> = ({ website, showLogos, fallback }) => {
  const logoUrl = getLogoUrl(website);
  
  if (!showLogos) return null;

  return (
    <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex-shrink-0 flex items-center justify-center overflow-hidden shadow-sm print:shadow-none print:border-slate-300">
      {logoUrl ? (
        <img src={logoUrl} alt="Logo" className="w-6 h-6 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
      ) : (
        <span className="text-xs font-bold text-slate-400">{fallback.charAt(0)}</span>
      )}
    </div>
  );
};

const SkillBadge: React.FC<{ skill: string; isNew: boolean }> = ({ skill, isNew }) => {
  return (
    <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-md border mr-2 mb-2 transition-colors break-inside-avoid
      ${isNew 
        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 print:bg-slate-100 print:text-slate-700 print:border-slate-200' 
        : 'bg-slate-100 text-slate-700 border-slate-200'
      }`}>
      {skill}
      {isNew && <span className="print:hidden ml-1 text-emerald-600">•</span>}
    </span>
  );
};

// Renders a single role's details
const RoleDetails: React.FC<{ exp: Experience; isGrouped?: boolean }> = ({ exp, isGrouped }) => (
  <div className={`mb-3 ${isGrouped ? 'mt-2' : ''} break-inside-avoid`}>
    <div className="flex justify-between items-baseline mb-1">
      <h3 className={`${isGrouped ? 'text-sm' : 'text-md'} font-bold text-slate-900`}>
        {exp.role}
      </h3>
      <span className="text-xs text-slate-500 font-medium whitespace-nowrap ml-4">{exp.duration}</span>
    </div>
    {!isGrouped && <div className="text-sm text-slate-600 italic mb-2 font-medium">{exp.company}</div>}
    
    <ul className="list-disc list-outside ml-4 space-y-1">
      {exp.points.map((point: string, pIdx: number) => (
        <li key={pIdx} className="text-sm text-slate-700 leading-snug pl-1 marker:text-slate-400">
          {point}
        </li>
      ))}
    </ul>
  </div>
);

// Renders a block (either a single job or a group of jobs at same company)
const ExperienceBlock: React.FC<{ group: ExperienceGroup; showLogos: boolean }> = ({ group, showLogos }) => {
  if (group.isGroup) {
    return (
      <div className="mb-6 break-inside-avoid page-break-inside-avoid">
        <div className="flex gap-4 items-start">
          <LogoBox website={group.website} showLogos={showLogos} fallback={group.company} />
          <div className="flex-grow">
            {/* Group Header */}
            <div className="mb-2 border-l-2 border-slate-200 pl-3 -ml-3 py-1">
               <h3 className="text-md font-bold text-slate-800">{group.company}</h3>
               <p className="text-xs text-slate-500">Multiple Roles</p>
            </div>
            
            {/* Roles */}
            <div className="space-y-4 relative">
               {/* Vertical connector line for groups */}
               <div className="absolute left-[-11px] top-2 bottom-2 w-0.5 bg-slate-200 hidden sm:block"></div>
               
               {group.items.map((exp, idx) => (
                 <div key={idx} className="relative">
                    <RoleDetails exp={exp} isGrouped />
                 </div>
               ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Single Item
  return (
    <div className="mb-6 break-inside-avoid page-break-inside-avoid">
      <div className="flex gap-4 items-start">
        <LogoBox website={group.items[0].website} showLogos={showLogos} fallback={group.items[0].company} />
        <div className="flex-grow">
          <RoleDetails exp={group.items[0]} isGrouped={false} />
        </div>
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
          <div className="flex justify-between items-start">
             <div>
               <div className="text-sm font-bold text-slate-800">{edu.school}</div>
               <div className="text-sm text-slate-600">{edu.degree}</div>
             </div>
             <span className="text-xs text-slate-500 font-medium">{edu.year}</span>
           </div>
        )}
      </div>
   </div>
);


export const ResumePreview: React.FC<ResumePreviewProps> = ({ data, baseData, isTailored, template, showLogos }) => {
  
  // Group Experience Logic
  const experienceGroups = useMemo(() => groupExperience(data.experience), [data.experience]);

  // Diff helper: Check if a skill is new (not in base)
  const isNewSkill = (skill: string) => {
    if (!isTailored || !baseData) return false;
    return !baseData.skills.some(s => s.toLowerCase() === skill.toLowerCase());
  };

  // Diff helper: Check if summary changed significantly
  const isSummaryChanged = () => {
    if (!isTailored || !baseData) return false;
    return data.summary !== baseData.summary;
  };

  const hasPhoto = !!data.profileImage;

  // --- TEMPLATE LAYOUTS ---

  // 1. CLASSIC (Standard vertical stack)
  const renderClassic = () => (
    <>
       {/* Header */}
       <header className="border-b-2 border-slate-800 pb-6 mb-6 flex gap-6 items-start break-inside-avoid">
        {hasPhoto && (
           <img src={data.profileImage} alt={data.fullName} className="w-24 h-24 rounded-lg object-cover shadow-sm border border-slate-200 print:shadow-none" />
        )}
        <div className="flex-grow">
          <h1 className="text-4xl font-bold text-slate-900 uppercase tracking-wider mb-2">
            {data.fullName}
          </h1>
          <div className="flex flex-wrap gap-4 text-sm text-slate-600 font-medium">
            {data.location && (
              <div className="flex items-center gap-1">
                <MapPin size={14} />
                <span>{data.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span className="opacity-75">{data.contactInfo}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Summary */}
      <section className={`mb-6 p-2 -mx-2 rounded-md transition-colors break-inside-avoid ${isSummaryChanged() ? 'bg-blue-50/50 print:bg-transparent' : ''}`}>
        <div className="flex items-center gap-2 mb-2 border-b border-slate-300 pb-1">
           <h2 className="text-lg font-bold text-slate-900 uppercase">Professional Summary</h2>
           {isSummaryChanged() && <span className="print:hidden text-[10px] font-bold text-blue-600 bg-blue-100 px-2 rounded-full flex items-center gap-1"><Sparkles size={10} /> Adapted</span>}
        </div>
        <p className="text-sm leading-relaxed text-slate-700">{data.summary}</p>
      </section>

      {/* Skills */}
      <section className="mb-6 break-inside-avoid">
        <h2 className="text-lg font-bold text-slate-900 uppercase border-b border-slate-300 mb-3 pb-1">Core Competencies</h2>
        <div className="flex flex-wrap">
          {data.skills.map((skill, idx) => (
            <SkillBadge key={idx} skill={skill} isNew={isNewSkill(skill)} />
          ))}
        </div>
      </section>

      {/* Experience */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-slate-900 uppercase border-b border-slate-300 mb-4 pb-1 break-inside-avoid">Professional Experience</h2>
        <div>
          {experienceGroups.map((group, idx) => (
            <ExperienceBlock key={idx} group={group} showLogos={showLogos} />
          ))}
        </div>
      </section>

      {/* Education */}
      {data.education && data.education.length > 0 && (
        <section className="break-inside-avoid">
          <h2 className="text-lg font-bold text-slate-900 uppercase border-b border-slate-300 mb-4 pb-1">Education</h2>
          <div className="space-y-3">
            {data.education.map((edu, idx) => <EducationItem key={idx} edu={edu} showLogos={showLogos} />)}
          </div>
        </section>
      )}
    </>
  );

  // 2. MODERN (Sidebar layout) - Flexbox fallback for print stability
  const renderModern = () => (
    <div className="flex flex-col md:flex-row gap-8 print:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-1/3 print:w-1/3 border-r border-slate-200 pr-6 flex flex-col gap-8">
         <div className="text-center break-inside-avoid">
            {hasPhoto ? (
               <img src={data.profileImage} alt={data.fullName} className="w-32 h-32 rounded-full object-cover mx-auto mb-4 border-4 border-indigo-50 shadow-md print:border-slate-100 print:shadow-none" />
            ) : (
               <div className="w-20 h-20 bg-indigo-100 text-indigo-400 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold print:bg-slate-100 print:text-slate-600">
                  {data.fullName.charAt(0)}
               </div>
            )}
            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Contact</h2>
            <div className="text-xs text-slate-600 space-y-2 mb-6 text-left">
               <p className="flex gap-2"><MapPin size={12} className="mt-0.5 text-indigo-500 print:text-slate-500"/> {data.location}</p>
               <p className="break-words">{data.contactInfo.split('|').map((c, i) => <span key={i} className="block mb-1">{c.trim()}</span>)}</p>
            </div>
         </div>

         <div className="break-inside-avoid">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b-2 border-indigo-500 pb-1 mb-3 print:border-slate-800">Skills</h2>
            <div className="flex flex-wrap gap-1">
               {data.skills.map((skill, idx) => (
                  <SkillBadge key={idx} skill={skill} isNew={isNewSkill(skill)} />
               ))}
            </div>
         </div>

         {data.education && (
            <div className="break-inside-avoid">
               <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest border-b-2 border-indigo-500 pb-1 mb-3 print:border-slate-800">Education</h2>
               <div className="space-y-4">
                  {data.education.map((edu, idx) => <EducationItem key={idx} edu={edu} showLogos={showLogos} compact />)}
               </div>
            </div>
         )}
      </aside>

      {/* Main Content */}
      <main className="w-full md:w-2/3 print:w-2/3 pt-2">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight break-inside-avoid">
          {data.fullName.split(' ')[0]} <span className="text-indigo-600 print:text-slate-900">{data.fullName.split(' ').slice(1).join(' ')}</span>
        </h1>
        
        <section className="mb-8 break-inside-avoid">
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              Profile
              {isSummaryChanged() && <span className="w-2 h-2 rounded-full bg-blue-400 print:hidden" title="Adapted"></span>}
           </h3>
           <p className="text-sm text-slate-700 leading-relaxed border-l-4 border-indigo-100 pl-4 print:border-slate-200">
              {data.summary}
           </p>
        </section>

        <section>
           <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 break-inside-avoid">Experience</h3>
           <div>
              {experienceGroups.map((group, idx) => (
                <ExperienceBlock key={idx} group={group} showLogos={showLogos} />
              ))}
           </div>
        </section>
      </main>
    </div>
  );

  // 3. MINIMAL (Clean, centered, serif)
  const renderMinimal = () => (
    <div className="font-serif text-slate-800">
      <header className="text-center border-b border-slate-300 pb-8 mb-8 break-inside-avoid">
         {hasPhoto && (
            <img src={data.profileImage} alt={data.fullName} className="w-20 h-20 rounded-full object-cover mx-auto mb-4 grayscale" />
         )}
         <h1 className="text-3xl font-normal text-slate-900 tracking-widest uppercase mb-3">{data.fullName}</h1>
         <div className="text-xs text-slate-500 font-sans tracking-wide uppercase flex justify-center gap-4">
            <span>{data.location}</span>
            <span>•</span>
            <span>{data.contactInfo}</span>
         </div>
      </header>

      <section className="mb-8 text-center max-w-lg mx-auto break-inside-avoid">
         <p className="text-sm italic leading-relaxed">{data.summary}</p>
      </section>

      <section className="mb-8">
         <h2 className="text-xs font-bold font-sans text-center uppercase tracking-widest text-slate-400 mb-6 break-inside-avoid">Experience</h2>
         <div className="space-y-8">
            {experienceGroups.map((group, idx) => (
               <div key={idx} className="relative pl-8 border-l border-slate-200 ml-4 break-inside-avoid">
                  <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-white border border-slate-300 rounded-full"></div>
                  
                  <div className="flex gap-4 items-start">
                     {showLogos && <div className="mt-1"><LogoBox website={group.website} showLogos={true} fallback={group.company} /></div>}
                     
                     <div className="flex-grow">
                        {/* Group vs Single Handling for Minimal */}
                        {group.isGroup ? (
                           <>
                              <div className="text-sm italic text-slate-600 mb-3 font-bold">{group.company}</div>
                              {group.items.map((exp, i) => (
                                 <div key={i} className="mb-4 last:mb-0">
                                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-1">
                                       <h3 className="text-md font-bold">{exp.role}</h3>
                                       <span className="font-sans text-xs text-slate-400 uppercase tracking-wide">{exp.duration}</span>
                                    </div>
                                    <ul className="list-none space-y-1.5">
                                       {exp.points.map((point: string, pIdx: number) => (
                                          <li key={pIdx} className="text-sm text-slate-700 pl-0 relative">
                                             <span className="mr-2 text-slate-300">-</span> {point}
                                          </li>
                                       ))}
                                    </ul>
                                 </div>
                              ))}
                           </>
                        ) : (
                           <>
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline mb-2">
                                 <h3 className="text-md font-bold">{group.items[0].role}</h3>
                                 <span className="font-sans text-xs text-slate-400 uppercase tracking-wide">{group.items[0].duration}</span>
                              </div>
                              <div className="text-sm italic text-slate-600 mb-2">{group.items[0].company}</div>
                              <ul className="list-none space-y-1.5">
                                 {group.items[0].points.map((point: string, pIdx: number) => (
                                    <li key={pIdx} className="text-sm text-slate-700 pl-0 relative">
                                       <span className="mr-2 text-slate-300">-</span> {point}
                                    </li>
                                 ))}
                              </ul>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </section>

      <div className="grid grid-cols-2 gap-8 mt-8 pt-8 border-t border-slate-100 break-inside-avoid">
         <div>
            <h2 className="text-xs font-bold font-sans uppercase tracking-widest text-slate-400 mb-4">Education</h2>
            {data.education && data.education.map((edu, idx) => (
               <div key={idx} className="mb-3 flex gap-3">
                   {showLogos && <LogoBox website={edu.website} showLogos={true} fallback={edu.school} />}
                   <div>
                     <div className="font-bold text-sm">{edu.school}</div>
                     <div className="text-sm italic text-slate-600">{edu.degree}</div>
                     <div className="text-xs text-slate-400 font-sans mt-1">{edu.year}</div>
                   </div>
               </div>
            ))}
         </div>
         <div>
            <h2 className="text-xs font-bold font-sans uppercase tracking-widest text-slate-400 mb-4">Skills</h2>
            <div className="text-sm leading-loose">
               {data.skills.join(" • ")}
            </div>
         </div>
      </div>
    </div>
  );


  return (
    <div id="resume-preview-content" className="resume-preview-container w-full max-w-[210mm] bg-white shadow-2xl mx-auto p-8 md:p-16 text-slate-800 relative transition-all duration-500">
      
      {/* Visual Legend for Screen Only */}
      {isTailored && baseData && (
        <div className="absolute top-4 right-4 print:hidden flex gap-3 text-xs font-medium bg-slate-50 p-2 rounded-lg border border-slate-100 opacity-75 hover:opacity-100 transition-opacity z-10">
          <span className="flex items-center gap-1 text-emerald-700">
            <span className="w-2 h-2 rounded-full bg-emerald-200 border border-emerald-400"></span>
            New
          </span>
           <span className="flex items-center gap-1 text-slate-500">
            <span className="w-2 h-2 rounded-full bg-slate-200 border border-slate-300"></span>
            Base
          </span>
        </div>
      )}

      {template === 'modern' && renderModern()}
      {template === 'minimal' && renderMinimal()}
      {template === 'classic' && renderClassic()}
      
    </div>
  );
};