import React, { useMemo, useState } from "react";
import { ResumeData } from "../types";
import { X, Save, Plus, Trash2 } from "lucide-react";

interface EditModalProps {
  data: ResumeData;
  onSave: (newData: ResumeData) => void;
  onClose: () => void;
}

type TabKey = "personal" | "summary" | "skills" | "experience" | "education";

export const EditModal: React.FC<EditModalProps> = ({ data, onSave, onClose }) => {
  const [formData, setFormData] = useState<ResumeData>(JSON.parse(JSON.stringify(data)));
  const [tab, setTab] = useState<TabKey>("personal");

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  // ---------- Experience helpers ----------
  const updateExperience = (idx: number, field: string, value: any) => {
    const newExp = [...formData.experience];
    newExp[idx] = { ...newExp[idx], [field]: value };
    setFormData({ ...formData, experience: newExp });
  };

  const updateExpPoint = (expIdx: number, pointIdx: number, value: string) => {
    const newExp = [...formData.experience];
    newExp[expIdx].points = [...(newExp[expIdx].points || [])];
    newExp[expIdx].points[pointIdx] = value;
    setFormData({ ...formData, experience: newExp });
  };

  const addExpPoint = (expIdx: number) => {
    const newExp = [...formData.experience];
    const pts = [...(newExp[expIdx].points || [])];
    pts.push("New achievement...");
    newExp[expIdx] = { ...newExp[expIdx], points: pts };
    setFormData({ ...formData, experience: newExp });
  };

  const removeExpPoint = (expIdx: number, pointIdx: number) => {
    const newExp = [...formData.experience];
    const pts = [...(newExp[expIdx].points || [])].filter((_, i) => i !== pointIdx);
    newExp[expIdx] = { ...newExp[expIdx], points: pts };
    setFormData({ ...formData, experience: newExp });
  };

  const addExperience = () => {
    const newExp = [
      ...formData.experience,
      {
        role: "New Role",
        company: "",
        website: "",
        duration: "",
        points: ["New achievement..."],
      },
    ];
    setFormData({ ...formData, experience: newExp });
  };

  const removeExperience = (idx: number) => {
    const exp = formData.experience[idx];
    const label = `${exp?.role || "this role"} at ${exp?.company || "company"}`.trim();
    if (!window.confirm(`Delete ${label}?`)) return;
    const newExp = formData.experience.filter((_, i) => i !== idx);
    setFormData({ ...formData, experience: newExp });
  };

  // ---------- Education helpers ----------
  const educationSafe = useMemo(() => formData.education || [], [formData.education]);

  const updateEducation = (idx: number, field: string, value: any) => {
    const newEdu = [...educationSafe];
    newEdu[idx] = { ...newEdu[idx], [field]: value };
    setFormData({ ...formData, education: newEdu });
  };

  const addEducation = () => {
    const newEdu = [
      ...educationSafe,
      { school: "New School", degree: "", year: "", website: "" },
    ];
    setFormData({ ...formData, education: newEdu });
  };

  const removeEducation = (idx: number) => {
    const edu = educationSafe[idx];
    const label = `${edu?.school || "this entry"}${edu?.degree ? ` (${edu.degree})` : ""}`;
    if (!window.confirm(`Delete ${label}?`)) return;
    const newEdu = educationSafe.filter((_, i) => i !== idx);
    setFormData({ ...formData, education: newEdu });
  };

  // ---------- UI helpers ----------
  const TabButton = ({ k, label }: { k: TabKey; label: string }) => (
    <button
      onClick={() => setTab(k)}
      className={[
        "px-3 py-2 text-xs font-semibold rounded-lg border",
        tab === k
          ? "bg-indigo-600 text-white border-indigo-600"
          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50",
      ].join(" ")}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl max-h-[90vh] rounded-xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-800">Edit Resume Content</h2>
            <div className="flex flex-wrap gap-2">
              <TabButton k="personal" label="Personal" />
              <TabButton k="summary" label="Summary" />
              <TabButton k="skills" label="Skills" />
              <TabButton k="experience" label="Experience" />
              <TabButton k="education" label="Education" />
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" type="button">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50">
          {/* Personal */}
          {tab === "personal" && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                Personal Info
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Full Name</label>
                  <input
                    className="w-full p-2 text-sm border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600">Location</label>
                  <input
                    className="w-full p-2 text-sm border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.location || ""}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-semibold text-slate-600">Contact Info</label>
                  <input
                    className="w-full p-2 text-sm border border-slate-300 rounded bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={formData.contactInfo || ""}
                    onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Summary */}
          {tab === "summary" && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                Summary
              </h3>
              <textarea
                className="w-full p-2 text-sm border border-slate-300 rounded bg-white text-slate-900 h-32 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                value={formData.summary || ""}
                onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              />
            </section>
          )}

          {/* Skills */}
          {tab === "skills" && (
            <section className="space-y-3">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider border-b pb-1">
                Skills
              </h3>
              <textarea
                className="w-full p-2 text-sm border border-slate-300 rounded bg-white text-slate-900 h-24 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                value={(formData.skills || []).join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    skills: e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Separate skills with commas"
              />
              <p className="text-[10px] text-slate-400">Separate skills with commas</p>
            </section>
          )}

          {/* Experience */}
          {tab === "experience" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Experience
                </h3>
                <button
                  onClick={addExperience}
                  className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
                  type="button"
                >
                  <Plus size={12} /> Add role
                </button>
              </div>

              {formData.experience.map((exp, i) => (
                <div key={i} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <input
                        className="p-2 text-sm font-bold border border-slate-300 rounded bg-white text-slate-900"
                        value={exp.role || ""}
                        onChange={(e) => updateExperience(i, "role", e.target.value)}
                        placeholder="Role"
                      />
                      <input
                        className="p-2 text-sm border border-slate-300 rounded bg-white text-slate-900"
                        value={exp.company || ""}
                        onChange={(e) => updateExperience(i, "company", e.target.value)}
                        placeholder="Company"
                      />
                      <input
                        className="p-2 text-xs border border-slate-300 rounded bg-white text-slate-900"
                        value={exp.duration || ""}
                        onChange={(e) => updateExperience(i, "duration", e.target.value)}
                        placeholder="Duration"
                      />
                      <input
                        className="p-2 text-xs border border-slate-300 rounded bg-white text-slate-900"
                        value={exp.website || ""}
                        onChange={(e) => updateExperience(i, "website", e.target.value)}
                        placeholder="Website (domain.com) for Logo"
                      />
                    </div>

                    <button
                      onClick={() => removeExperience(i)}
                      className="shrink-0 p-2 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50"
                      type="button"
                      title="Delete role"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="space-y-2 pl-1">
                    <label className="text-xs font-semibold text-slate-500">Bullet Points</label>
                    {(exp.points || []).map((point, pIdx) => (
                      <div key={pIdx} className="flex gap-2">
                        <input
                          className="flex-grow p-1.5 text-xs border border-slate-300 rounded bg-white text-slate-900"
                          value={point}
                          onChange={(e) => updateExpPoint(i, pIdx, e.target.value)}
                        />
                        <button
                          onClick={() => removeExpPoint(i, pIdx)}
                          className="p-2 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50"
                          type="button"
                          title="Delete bullet"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => addExpPoint(i)}
                      className="text-xs text-indigo-600 flex items-center gap-1 hover:underline mt-2"
                      type="button"
                    >
                      <Plus size={12} /> Add bullet
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Education */}
          {tab === "education" && (
            <section className="space-y-4">
              <div className="flex items-center justify-between border-b pb-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                  Education
                </h3>
                <button
                  onClick={addEducation}
                  className="text-xs font-semibold text-indigo-600 flex items-center gap-1 hover:underline"
                  type="button"
                >
                  <Plus size={12} /> Add education
                </button>
              </div>

              {educationSafe.length === 0 && (
                <div className="text-sm text-slate-500 bg-white border border-slate-200 rounded-lg p-4">
                  No education entries yet. Click <span className="font-semibold">Add education</span>.
                </div>
              )}

              {educationSafe.map((edu, i) => (
                <div key={i} className="p-4 bg-white rounded-lg border border-slate-200 space-y-3 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      <input
                        className="p-2 text-sm font-bold border border-slate-300 rounded bg-white text-slate-900"
                        value={edu.school || ""}
                        onChange={(e) => updateEducation(i, "school", e.target.value)}
                        placeholder="School"
                      />
                      <input
                        className="p-2 text-sm border border-slate-300 rounded bg-white text-slate-900"
                        value={edu.degree || ""}
                        onChange={(e) => updateEducation(i, "degree", e.target.value)}
                        placeholder="Degree"
                      />
                      <input
                        className="p-2 text-xs border border-slate-300 rounded bg-white text-slate-900"
                        value={edu.year || ""}
                        onChange={(e) => updateEducation(i, "year", e.target.value)}
                        placeholder="Year"
                      />
                      <input
                        className="p-2 text-xs border border-slate-300 rounded bg-white text-slate-900"
                        value={edu.website || ""}
                        onChange={(e) => updateEducation(i, "website", e.target.value)}
                        placeholder="Website (domain.edu) for Logo"
                      />
                    </div>

                    <button
                      onClick={() => removeEducation(i)}
                      className="shrink-0 p-2 rounded-lg border border-slate-200 text-red-500 hover:bg-red-50"
                      type="button"
                      title="Delete education"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-2"
            type="button"
          >
            <Save size={16} /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
