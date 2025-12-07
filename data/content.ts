
import { BlogPost } from "../types";

export const LEGAL_CONTENT = {
  impressum: {
    title: "Legal Notice (Impressum)",
    content: `
      <h3 class="font-bold text-lg mb-2">Provider</h3>
      <p class="mb-4">
        Josua Diggelmann<br>
        Altstetterstrasse<br>
        8047 Zurich, Switzerland
      </p>
      
      <h4 class="font-bold mb-1">Contact</h4>
      <p class="mb-4">Email: <a href="mailto:contact@oneclickcvpro.com" class="text-indigo-600 hover:underline">Contact via Email</a></p>
      
      <h3 class="font-bold text-lg mb-2 mt-6">Legal Disclaimer</h3>
      <p class="mb-4">The contents of this site have been created with the greatest care. However, we cannot guarantee the accuracy, completeness, or timeliness of the information provided. As a service provider, we are responsible for our own content on these pages according to general laws.</p>
      
      <p>Liability for links: Our offer contains links to external third-party websites, the content of which we have no influence on. Therefore, we cannot assume any liability for this external content. The respective provider or operator of the pages is always responsible for the content of the linked pages.</p>
    `
  },
  privacy: {
    title: "Privacy Policy",
    content: `
      <p class="mb-4">At OneClickCVPro, we take your privacy seriously. This policy describes how we collect, use, and handle your data.</p>
      
      <h3 class="font-bold text-lg mb-2">1. Data Collection</h3>
      <p class="mb-4">We collect data you provide directly to us, such as your name, email address, resume content, and payment information. We also collect data automatically, such as your IP address and device information.</p>
      
      <h3 class="font-bold text-lg mb-2">2. Use of Data</h3>
      <p class="mb-4">We use your data to provide our services, process payments, and improve our platform. We do not sell your personal data to third parties.</p>
      
      <h3 class="font-bold text-lg mb-2">3. Resume Data Processing</h3>
      <p class="mb-4">Your resume data is processed by our AI providers (Google Gemini) solely for the purpose of generating your CV. Data is transiently processed and stored securely in your browser's local storage or our encrypted database if logged in.</p>
      
      <h3 class="font-bold text-lg mb-2">4. Your Rights</h3>
      <p>You have the right to access, correct, or delete your personal data. Contact us at privacy@oneclickcvpro.com for assistance.</p>
    `
  },
  terms: {
    title: "Terms of Service",
    content: `
      <p class="mb-4">Welcome to OneClickCVPro. By using our website, you agree to these terms.</p>
      
      <h3 class="font-bold text-lg mb-2">1. Service Description</h3>
      <p class="mb-4">OneClickCVPro provides AI-powered resume building and tailoring services. Results may vary and should be reviewed by the user before use.</p>
      
      <h3 class="font-bold text-lg mb-2">2. User Accounts</h3>
      <p class="mb-4">You are responsible for safeguarding your account credentials. We are not liable for any loss or damage arising from your failure to do so.</p>
      
      <h3 class="font-bold text-lg mb-2">3. Payments & Credits</h3>
      <p class="mb-4">Credits purchased are non-refundable unless required by law. Unused credits do not expire.</p>
      
      <h3 class="font-bold text-lg mb-2">4. Liability</h3>
      <p>OneClickCVPro is provided "as is". We make no warranties regarding the success of your job applications.</p>
    `
  }
};

export const BLOG_POSTS: BlogPost[] = [
  {
    id: "1",
    title: "How AI is Changing the Job Market in 2025: A Survival Guide",
    excerpt: "Recruiters are using AI to screen resumes. Learn how semantic search works and how to optimize your application to beat the bots.",
    date: "Oct 15, 2025",
    author: "Sarah Jenkins, HR Tech Expert",
    tags: ["AI", "Career Advice", "Future of Work"],
    image: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=800",
    content: `
      <p class="mb-6 text-lg leading-relaxed font-medium text-slate-700">The job market has undergone a seismic shift. Applicant Tracking Systems (ATS) have been around for years, but the new wave of AI-driven recruitment tools goes far beyond simple keyword matching. In 2025, if you aren't writing for the algorithm, you aren't getting read by a human.</p>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">The Rise of Semantic Search</h3>
      <p class="mb-4 leading-relaxed">Modern recruiters don't just look for "Java" or "Sales". They use semantic search to understand the <em>context</em> of your experience. Old-school ATS looked for exact matches. If the job description said "React.js" and you wrote "ReactJS", you might have been filtered out. </p>
      
      <p class="mb-4 leading-relaxed">Today's AI is smarter. It understands that "Client Relations", "Account Management", and "Customer Success" are conceptually related. However, it also grades you on <strong>relevance density</strong>.</p>
      
      <div class="bg-indigo-50 p-6 rounded-xl border border-indigo-100 my-8">
        <h4 class="font-bold text-indigo-900 mb-2">Key Takeaway</h4>
        <p class="text-indigo-800 text-sm">Your resume needs to map semantically to the job description. It's not about stuffing keywords in white text; it's about mirroring the language, tone, and priorities of the employer.</p>
      </div>

      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">How OneClickCVPro Beats the System</h3>
      <p class="mb-4 leading-relaxed">This is where <strong>AI Tailoring</strong> shines. Manually rewriting your resume for every application is exhausting and prone to error. By using our AI engine, we analyze the semantic vector of the Job Description and rewrite your bullet points to align with it.</p>
      
      <ul class="list-disc pl-6 mb-6 space-y-3 text-slate-700">
        <li><strong>Contextual Rephrasing:</strong> We change "Managed a team" to "Orchestrated a cross-functional squad" if the JD values leadership and agile terminology.</li>
        <li><strong>Skill Prioritization:</strong> If the job emphasizes Python over JavaScript, our AI reorders your skills section to highlight Python first.</li>
        <li><strong>Impact Quantification:</strong> AI suggests adding metrics where they are missing, prompting you to turn generic statements into data-driven achievements.</li>
      </ul>

      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">Quality over Quantity</h3>
      <p class="mb-4 leading-relaxed">Gone are the days of "spray and pray". With AI tailoring, you can send 10 highly targeted applications in the time it used to take to write one cover letter. Quality is now scalable.</p>

      <p class="mb-4 leading-relaxed">The future of hiring is here. It's not about cheating the system; it's about speaking the system's language so that your true value can be recognized by the human decision-maker at the end of the pipeline.</p>
    `
  },
  {
    id: "2",
    title: "5 Keywords That Ruin Your Resume (And What to Use Instead)",
    excerpt: "Stop using buzzwords like 'hard worker' and 'synergy'. They take up valuable space. Here is the definitive list of action verbs that convert.",
    date: "Oct 02, 2025",
    author: "David Chen, Senior Recruiter",
    tags: ["Resume Tips", "Mistakes", "Hiring"],
    image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=800",
    content: `
      <p class="mb-6 text-lg leading-relaxed font-medium text-slate-700">We've all seen them. "Hard worker", "Team player", "Synergy". These words are the resume equivalent of elevator music: generic, uninspiring, and largely ignored by recruiters. In a competitive market, every inch of your resume is real estate. Don't waste it on fluff.</p>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">1. "Responsible for"</h3>
      <p class="mb-4 leading-relaxed">This is the most common offender. "Responsible for" describes your duties, not your achievements. Anyone can be responsible for something and still do a terrible job at it.</p>
      <p class="mb-4 leading-relaxed text-emerald-700 font-medium">✅ Instead use: "Spearheaded", "Executed", "Delivered", or "Managed".</p>
      <p class="italic text-slate-500 mb-6">Example: "Increased sales by 20%" sounds infinitely better than "Responsible for sales growth".</p>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">2. "Expert"</h3>
      <p class="mb-4 leading-relaxed">Unless you have a PhD or are a recognized industry thought leader, avoid self-proclaiming as an expert. It triggers skepticism. Let your experience speak for itself.</p>
      <p class="mb-4 leading-relaxed text-emerald-700 font-medium">✅ Instead use: "Specialist in...", "Certified in...", or simply list the advanced projects you've completed.</p>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">3. "Creative" / "Innovative"</h3>
      <p class="mb-4 leading-relaxed">Show, don't tell. If you are creative, mention the design awards you won, the novel marketing campaign you launched, or the patent you filed.</p>
      <p class="mb-4 leading-relaxed text-emerald-700 font-medium">✅ Instead use: "Designed", "Authored", "Conceptualized".</p>

      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">4. "Team Player"</h3>
      <p class="mb-4 leading-relaxed">This is a baseline expectation, not a skill. Proving you work well with others happens through your bullet points about cross-functional collaboration.</p>
      <p class="mb-4 leading-relaxed text-emerald-700 font-medium">✅ Instead use: "Collaborated with", "Partnered with", "Mentored".</p>

      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">5. "Hard Worker"</h3>
      <p class="mb-4 leading-relaxed">This is subjective and unverifiable. Instead, demonstrate your work ethic through output volume or reliability.</p>
      <p class="mb-4 leading-relaxed text-emerald-700 font-medium">✅ Instead use: "Surpassed targets", "Achieved 100% uptime", "Completed ahead of schedule".</p>

      <hr class="my-8 border-slate-200"/>
      
      <p class="text-slate-600">The goal of your resume is to paint a picture of competence and impact. Weak words dilute that picture. Strong action verbs make it vivid. Go through your resume today and Ctrl+F these words out of existence.</p>
    `
  },
  {
    id: "3",
    title: "From LinkedIn to Hired: A Full Stack Success Story",
    excerpt: "Case Study: How Marco transformed his outdated LinkedIn profile into a tailored CV and landed a Senior Engineer role at a FAANG company.",
    date: "Sep 28, 2025",
    author: "Editorial Team",
    tags: ["Success Story", "LinkedIn", "Tech"],
    image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=800",
    content: `
      <p class="mb-6 text-lg leading-relaxed font-medium text-slate-700">Marco was a talented Full Stack Developer with 6 years of experience, but his resume was a mess. He hadn't updated it in 3 years, relying entirely on his LinkedIn profile which was more of a data dump than a marketing document. When he decided to apply for a dream role at a major tech company, he knew he needed a change.</p>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">The Challenge</h3>
      <p class="mb-4 leading-relaxed">Marco wanted to apply for a Senior Engineer role. The job description emphasized "System Design", "Scalability", and "Team Leadership". His LinkedIn profile, however, was full of technical jargon about specific, outdated libraries he used in 2021.</p>
      <p class="mb-4 leading-relaxed">He applied to 5 companies with his standard PDF export from LinkedIn. He got <strong>zero</strong> responses.</p>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">The Solution: OneClickCVPro</h3>
      <p class="mb-4 leading-relaxed">Marco used our platform to import his LinkedIn PDF. He then pasted the Senior Engineer Job Description into the tailoring engine. In 30 seconds, the AI re-architected his resume.</p>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
        <div class="bg-red-50 p-6 rounded-xl border border-red-100">
           <h4 class="font-bold text-red-800 mb-2 border-b border-red-200 pb-2">Before (LinkedIn Dump)</h4>
           <ul class="list-disc pl-4 text-sm text-red-700 space-y-2">
             <li>Used React and Node.js for the main app.</li>
             <li>Fixed bugs in the payment system.</li>
             <li>Helped junior developers when they got stuck.</li>
             <li>Wrote unit tests with Jest.</li>
           </ul>
        </div>
        <div class="bg-emerald-50 p-6 rounded-xl border border-emerald-100">
           <h4 class="font-bold text-emerald-800 mb-2 border-b border-emerald-200 pb-2">After (AI Tailored)</h4>
           <ul class="list-disc pl-4 text-sm text-emerald-700 space-y-2">
             <li>Architected scalable RESTful systems serving 1M+ daily users using Node.js.</li>
             <li>Optimized payment processing latency by 40% through refactoring legacy code.</li>
             <li>Mentored 3 junior developers to promotion, conducting weekly code reviews.</li>
             <li>Established TDD best practices, increasing code coverage from 40% to 90%.</li>
           </ul>
        </div>
      </div>
      
      <h3 class="text-2xl font-bold text-slate-800 mt-10 mb-4">The Outcome</h3>
      <p class="mb-4 leading-relaxed">Notice the difference? The AI didn't invent facts; it translated Marco's work into the language of <em>seniority</em> and <em>impact</em>.</p>
      
      <p class="leading-relaxed">Marco reapplied to similar roles with his new CV. He received 3 interview requests within a week and landed an offer at a top-tier tech firm 3 weeks later. Your experience matters, but how you frame it matters more.</p>
    `
  }
];
