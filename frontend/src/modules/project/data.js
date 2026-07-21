import {
  FolderKanban,
  Users,
  BarChart2,
  UserCheck,
  UserPlus,
  FileText,
  MessageSquare,
  Brain,
  HeartPulse,
  ScanLine,
  Boxes,
  Award,
  Archive,
} from "lucide-react";

// ---------------------------------------------------------------------------
// MOCK DATA — swap these out for real API calls later.
// Every shape here (projects, stats, activity, collaborators) is deliberately
// kept flat and simple so it's obvious what a backend response should look
// like when this gets wired up for real.
// ---------------------------------------------------------------------------

export const STATS = [
  { key: "total", label: "Total Projects", value: 6, icon: FolderKanban, tint: "bg-blue-50 text-blue-600" },
  { key: "collaborators", label: "Collaborators", value: 24, icon: Users, tint: "bg-emerald-50 text-emerald-600" },
  { key: "active", label: "Active Projects", value: 6, icon: BarChart2, tint: "bg-violet-50 text-violet-600" },
  { key: "completed", label: "Completed", value: 2, icon: UserCheck, tint: "bg-teal-50 text-teal-600" },
];

export const TABS = ["All Projects", "Owned by Me", "Collaborating", "Invited", "Completed", "Archived"];

export const TAG_STYLES = {
  "AI/ML": "bg-blue-50 text-blue-600",
  "Information Retrieval": "bg-purple-50 text-purple-600",
  NLP: "bg-rose-50 text-rose-600",
  Healthcare: "bg-emerald-50 text-emerald-600",
  IoT: "bg-cyan-50 text-cyan-600",
  "Edge Computing": "bg-rose-50 text-rose-600",
  "Computer Vision": "bg-blue-50 text-blue-600",
  "Medical Imaging": "bg-emerald-50 text-emerald-600",
  Blockchain: "bg-rose-50 text-rose-600",
  "Research Ethics": "bg-blue-50 text-blue-600",
  "Data Security": "bg-orange-50 text-orange-600",
};

export const AVATAR_COLORS = ["bg-orange-300", "bg-indigo-300", "bg-pink-300", "bg-emerald-300", "bg-sky-300"];

export function avatarInitials(seed) {
  return seed.slice(0, 2).toUpperCase();
}

export const PROJECTS = [
  {
    id: 1,
    title: "AI Disease Prediction",
    description: "Predict diseases using machine learning.",
    pi: "Dr. Sharma",
    members: 8,
    collaborators: 8,
    extraAvatars: 2,
    applications: 5,
    progress: 72,
    createdAt: "2026-06-20",
    created: "20 Jun 2026",
    updated: "2 days ago",
    deadline: "2026-08-15",
    status: "Active",
    statusColor: "bg-emerald-500",
    category: "owned",
    visibility: "Public",
    openToCollaboration: true,
    icon: Brain,
    cover: "from-slate-900 via-slate-800 to-indigo-950",
    coverIconColor: "text-indigo-300",
    tags: ["AI/ML", "Healthcare"],
  },
  {
    id: 2,
    title: "Smart Healthcare Monitoring System",
    description:
      "IoT and edge computing based real-time health monitoring and alert system for remote patients.",
    tags: ["Healthcare", "IoT", "Edge Computing"],
    pi: "Dr. Nair",
    members: 6,
    collaborators: 6,
    extraAvatars: 3,
    applications: 2,
    progress: 45,
    status: "Active",
    statusColor: "bg-emerald-500",
    createdAt: "2024-04-28",
    created: "28 Apr 2024",
    updated: "5 days ago",
    deadline: "2026-09-01",
    visibility: "Public",
    icon: HeartPulse,
    cover: "from-slate-900 via-slate-800 to-blue-950",
    coverIconColor: "text-red-400",
    openToCollaboration: false,
    category: "collaborating",
  },
  {
    id: 3,
    title: "Explainable AI for Medical Imaging",
    description:
      "Research on interpretable deep learning models for medical image classification and diagnosis.",
    tags: ["AI/ML", "Computer Vision", "Medical Imaging"],
    pi: "Dr. Iyer",
    members: 7,
    collaborators: 7,
    extraAvatars: 4,
    applications: 3,
    progress: 60,
    status: "Active",
    statusColor: "bg-emerald-500",
    createdAt: "2024-03-15",
    created: "15 Mar 2024",
    updated: "1 week ago",
    deadline: "2026-10-10",
    visibility: "Public",
    icon: ScanLine,
    cover: "from-slate-900 via-slate-800 to-cyan-950",
    coverIconColor: "text-cyan-300",
    openToCollaboration: true,
    category: "owned",
  },
  {
    id: 4,
    title: "Blockchain for Research Integrity",
    description:
      "Exploring blockchain solutions to ensure transparency, reproducibility, and integrity in scientific research.",
    tags: ["Blockchain", "Research Ethics", "Data Security"],
    pi: "Dr. Verma",
    members: 5,
    collaborators: 5,
    extraAvatars: 2,
    applications: 1,
    progress: 30,
    status: "In Progress",
    statusColor: "bg-blue-500",
    createdAt: "2024-02-10",
    created: "10 Feb 2024",
    updated: "2 weeks ago",
    deadline: "2026-11-01",
    visibility: "Private",
    icon: Boxes,
    cover: "from-slate-900 via-slate-800 to-purple-950",
    coverIconColor: "text-cyan-300",
    openToCollaboration: false,
    category: "invited",
  },
  {
    id: 5,
    title: "Peer Review Automation Platform",
    description:
      "A workflow tool that matches manuscripts with qualified reviewers and tracks review-cycle turnaround times.",
    tags: ["AI/ML", "Research Ethics"],
    pi: "Dr. Menon",
    members: 4,
    collaborators: 4,
    extraAvatars: 1,
    applications: 0,
    progress: 100,
    status: "Completed",
    statusColor: "bg-slate-400",
    createdAt: "2024-01-03",
    created: "3 Jan 2024",
    updated: "1 month ago",
    deadline: "2024-06-01",
    visibility: "Public",
    icon: Award,
    cover: "from-slate-900 via-slate-800 to-emerald-950",
    coverIconColor: "text-emerald-300",
    openToCollaboration: false,
    category: "completed",
  },
  {
    id: 6,
    title: "Legacy Citation Graph Archive",
    description:
      "An earlier citation-network visualization project, kept for reference but no longer actively maintained.",
    tags: ["Data Security"],
    pi: "Dr. Rao",
    members: 3,
    collaborators: 3,
    extraAvatars: 0,
    applications: 0,
    progress: 100,
    status: "Archived",
    statusColor: "bg-slate-300",
    createdAt: "2023-08-20",
    created: "20 Aug 2023",
    updated: "6 months ago",
    deadline: null,
    visibility: "Private",
    icon: Archive,
    cover: "from-slate-900 via-slate-800 to-slate-700",
    coverIconColor: "text-slate-400",
    openToCollaboration: false,
    category: "archived",
  },
];

export const ACTIVITY = [
  {
    id: 0,
    name: "Pragya Singh",
    action: "joined the project",
    target: "Explainable AI for Medical Imaging",
    time: "1 day ago",
    icon: UserPlus,
    iconTint: "bg-blue-50 text-blue-500",
  },
  {
    id: 1,
    name: "Pragya Sharma",
    action: "joined the project",
    target: "AI-Powered Research Discovery Engine",
    time: "2 days ago",
    icon: UserPlus,
    iconTint: "bg-blue-50 text-blue-500",
  },
  {
    id: 2,
    name: "Abhishek Patel",
    action: "uploaded a document in",
    target: "Smart Healthcare Monitoring System",
    time: "5 days ago",
    icon: FileText,
    iconTint: "bg-blue-50 text-blue-500",
  },
  {
    id: 3,
    name: "Vishal Tripathi",
    action: "commented on a task in",
    target: "Explainable AI for Medical Imaging",
    time: "1 week ago",
    icon: MessageSquare,
    iconTint: "bg-blue-50 text-blue-500",
  },
  {
    id: 4,
    name: "Binore Mohapatra",
    action: "completed a milestone in",
    target: "Blockchain for Research Integrity",
    time: "2 weeks ago",
    icon: UserCheck,
    iconTint: "bg-emerald-50 text-emerald-500",
  },
];

export const TOP_COLLABORATORS = [
  { id: 1, name: "Pragya Sharma", projects: 5 },
  { id: 2, name: "Abhishek Patel", projects: 4 },
  { id: 3, name: "Pragya Singh", projects: 3 },
];

export const OVERVIEW = [
  { key: "active", label: "Active", value: 6, pct: 50, color: "#10b981" },
  { key: "active2", label: "Active", value: 6, pct: 50, color: "#3b82f6" },
  { key: "completed", label: "Completed", value: 2, pct: 12.5, color: "#9ca3af" },
  { key: "archived", label: "Archived", value: 1, pct: 12.5, color: "#8b5cf6" },
];

// Seed a couple of existing applications so the "pending applications" view
// has something to show right away. Real data would come from your backend.
export const SEED_APPLICATIONS = [
  {
    id: "app-1",
    projectId: 1,
    applicantName: "Rhea Kapoor",
    message:
      "I've published two papers on retrieval-augmented recommendation systems and would love to help with the ranking model.",
    appliedAt: "3 days ago",
    status: "pending",
  },
  {
    id: "app-2",
    projectId: 3,
    applicantName: "Karan Mehta",
    message:
      "I work on model interpretability for radiology imaging and can contribute to the saliency-map evaluation pipeline.",
    appliedAt: "6 days ago",
    status: "pending",
  },
  {
    id: "app-3",
    projectId: 1,
    applicantName: "Pragya Singh",
    message: "Happy to help annotate the training set and review the NLP pipeline.",
    appliedAt: "1 week ago",
    status: "accepted",
  },
];