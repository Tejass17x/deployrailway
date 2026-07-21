import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, Users, Tag, Plus, Check, X } from "lucide-react";
import connectionsService from "../../connections/services/connections.service";
import projectService from "../../../services/project.service";
import { toast } from "react-hot-toast";

const PREDEFINED_TAGS = [
  "AI/ML",
  "Information Retrieval",
  "NLP",
  "Healthcare",
  "IoT",
  "Edge Computing",
  "Computer Vision",
  "Medical Imaging",
  "Blockchain",
  "Research Ethics",
  "Data Security",
];

export default function CreateProjectPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Ongoing");
  const [researchAreas, setResearchAreas] = useState([]);
  const [customTag, setCustomTag] = useState("");
  const [visibility, setVisibility] = useState("Public");
  const [openToCollaboration, setOpenToCollaboration] = useState(false);
  const [deadline, setDeadline] = useState("");
  const [progress, setProgress] = useState(0);

  // Collaborators selection
  const [connections, setConnections] = useState([]);
  const [selectedCollaborators, setSelectedCollaborators] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);
  const [isCollaboratorsDropdownOpen, setIsCollaboratorsDropdownOpen] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setIsLoadingConnections(true);
    connectionsService.getConnections({ limit: 100 })
      .then((res) => setConnections(res.data?.docs || []))
      .catch((err) => console.error("Failed to load connections:", err))
      .finally(() => setIsLoadingConnections(false));
  }, []);

  const handleAddPredefinedTag = (tag) => {
    if (researchAreas.includes(tag)) {
      setResearchAreas((prev) => prev.filter((t) => t !== tag));
    } else {
      setResearchAreas((prev) => [...prev, tag]);
    }
  };

  const handleAddCustomTag = (e) => {
    if (e.key === "Enter" || e.type === "click") {
      e.preventDefault();
      const cleaned = customTag.trim();
      if (cleaned && !researchAreas.includes(cleaned)) {
        setResearchAreas((prev) => [...prev, cleaned]);
        setCustomTag("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setResearchAreas((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const handleToggleCollaborator = (userId) => {
    if (selectedCollaborators.includes(userId)) {
      setSelectedCollaborators((prev) => prev.filter((id) => id !== userId));
    } else {
      setSelectedCollaborators((prev) => [...prev, userId]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        status,
        researchAreas,
        collaborators: selectedCollaborators,
        visibility,
        openToCollaboration,
        progress,
        deadline: deadline ? new Date(deadline).toISOString() : null,
      };

      await projectService.createProject(payload);
      toast.success("Project created successfully!");
      navigate("/projects");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to create project.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  return (
    <div className="w-full min-h-screen bg-slate-50 font-sans text-slate-900 pb-12">
      <div className="max-w-3xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8 flex items-center gap-4 bg-white border border-slate-200 p-5 rounded-3xl shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <button
            onClick={() => navigate("/projects")}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer border border-slate-200 text-slate-500"
            title="Back to Projects"
            type="button"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="text-left">
            <h1 className="text-xl font-black text-[#0F172A] tracking-tight uppercase">Create New Project</h1>
            <p className="text-[10px] text-[#475569] font-bold uppercase tracking-wider mt-0.5">Initiate a research project and invite collaborators</p>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgba(15,23,42,0.02)]">
          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            
            {/* Title */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Project Title <span className="text-rose-500">*</span>
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. AI-Powered Healthcare Diagnostics System"
                maxLength={200}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-semibold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block text-right font-medium">
                {title.length}/200 characters
              </span>
            </div>

            {/* Description */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Provide a comprehensive summary of the research project, objectives, methodologies, and expected outcomes..."
                className="w-full resize-none rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-medium"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Status */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-all font-semibold bg-white cursor-pointer"
                >
                  <option value="Ongoing">Ongoing (Active)</option>
                  <option value="Proposed">Proposed</option>
                  <option value="Completed">Completed</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>

              {/* Visibility */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">Visibility</label>
                <div className="flex gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  {["Public", "Private"].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setVisibility(option)}
                      className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        visibility === option
                          ? "bg-white text-blue-600 shadow-sm border border-slate-100"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Research Areas */}
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">Research Areas</label>
              
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PREDEFINED_TAGS.map((tag) => {
                  const isSelected = researchAreas.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleAddPredefinedTag(tag)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold border transition-all cursor-pointer ${
                        isSelected
                          ? "bg-blue-50 border-blue-200 text-blue-600 shadow-sm"
                          : "bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                    placeholder="Type custom research area and press Enter..."
                    className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-xs text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-all font-semibold"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-4 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add
                </button>
              </div>

              {researchAreas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
                  {researchAreas.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 rounded-md bg-blue-50 border border-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-600"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="rounded hover:bg-blue-100 p-0.5 text-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Expected Deadline */}
              <div>
                <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Calendar size={14} className="text-slate-400" />
                    Expected Deadline
                  </span>
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-blue-500 focus:outline-none transition-all font-semibold"
                />
              </div>

              {/* Progress */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0F172A] uppercase tracking-wider">Progress</label>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{progress}%</span>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                </div>
              </div>
            </div>

            {/* Collaborators */}
            <div className="relative">
              <label className="mb-1.5 block text-xs font-bold text-[#0F172A] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Users size={14} className="text-slate-400" />
                  Collaborators
                </span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsCollaboratorsDropdownOpen(!isCollaboratorsDropdownOpen)}
                  className="w-full text-left rounded-xl border border-slate-200 p-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none transition-all font-semibold bg-white flex justify-between items-center cursor-pointer shadow-sm hover:border-slate-300"
                >
                  <span className="truncate">
                    {selectedCollaborators.length === 0
                      ? "Select collaborators from connections..."
                      : `${selectedCollaborators.length} collaborator(s) selected`}
                  </span>
                  <span className="text-slate-400 text-xs">▼</span>
                </button>

                {isCollaboratorsDropdownOpen && (
                  <div className="absolute left-0 right-0 mt-2 z-10 max-h-48 overflow-y-auto rounded-xl border border-slate-150 bg-white p-2 shadow-xl space-y-1">
                    {isLoadingConnections ? (
                      <p className="text-center py-4 text-xs font-semibold text-slate-400">Loading connections...</p>
                    ) : connections.length === 0 ? (
                      <p className="text-center py-4 text-xs font-semibold text-slate-400">No connections available.</p>
                    ) : (
                      connections.map((c) => {
                        const user = c.user;
                        if (!user) return null;
                        const isChecked = selectedCollaborators.includes(user._id);
                        return (
                          <div
                            key={user._id}
                            onClick={() => handleToggleCollaborator(user._id)}
                            className={`flex items-center justify-between rounded-lg p-2 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors ${
                              isChecked ? "bg-blue-50/50" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={user.profileImage || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                                alt={user.fullName}
                                className="w-6 h-6 rounded-full object-cover border border-slate-105"
                              />
                              <span className="text-slate-700 font-bold">{user.fullName}</span>
                            </div>
                            <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-colors ${
                              isChecked ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 bg-white"
                            }`}>
                              {isChecked && <Check size={10} strokeWidth={3} />}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Open to Collaboration */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-150 p-4 rounded-xl">
              <div className="pr-4 text-left">
                <span className="block text-xs font-bold text-slate-800 uppercase tracking-wider">Open to Collaboration</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">Allow other researchers to apply to this project.</span>
              </div>
              <button
                type="button"
                onClick={() => setOpenToCollaboration(!openToCollaboration)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  openToCollaboration ? "bg-emerald-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    openToCollaboration ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
              <button
                type="button"
                onClick={() => navigate("/projects")}
                className="rounded-xl border border-slate-200 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-8 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40 transition-all shadow-md shadow-blue-500/10 cursor-pointer"
              >
                {isSubmitting ? "Creating..." : "Create Project"}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
