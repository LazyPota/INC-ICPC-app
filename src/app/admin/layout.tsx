import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import {
  ShieldAlert,
  BarChart3,
  Users,
  FileQuestion,
  Brain,
  ShieldCheck,
  Download,
  ExternalLink,
  FileText,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-[#070d17] text-slate-100 flex flex-col md:flex-row selection:bg-blue-600 selection:text-white">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800/80 flex flex-col justify-between shrink-0">
        <div>
          {/* Brand */}
          <div className="p-5 border-b border-slate-800/80 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight">Admin Console</h1>
              <p className="text-[11px] text-slate-400">ICPC INC 2026 Qualification</p>
            </div>
          </div>

          {/* Admin Email Tag */}
          <div className="px-5 py-3 border-b border-slate-900 bg-slate-900/30 text-[11px]">
            <span className="text-slate-500 block">Logged in as Admin:</span>
            <span className="text-slate-300 font-mono font-semibold truncate block">
              {session.email}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs font-semibold">
            <Link
              href="/admin"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Overview</span>
            </Link>

            <Link
              href="/admin/candidates"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Candidates</span>
            </Link>

            <Link
              href="/admin/assessments"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <FileQuestion className="w-4 h-4 text-indigo-400" />
              <span>Assessments & Questions</span>
            </Link>

            <Link
              href="/admin/grading"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Brain className="w-4 h-4 text-purple-400" />
              <span>AI Grading & Overrides</span>
            </Link>

            <Link
              href="/admin/integrity"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>Integrity & Proctor Logs</span>
            </Link>

            <Link
              href="/admin/reports"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <FileText className="w-4 h-4 text-rose-400" />
              <span>Confidential Reports</span>
            </Link>

            <a
              href="/api/admin/export"
              download
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900 transition-colors"
            >
              <Download className="w-4 h-4 text-sky-400" />
              <span>Export CSV</span>
            </a>
          </nav>
        </div>

        {/* Footer controls */}
        <div className="p-4 border-t border-slate-800/80 space-y-2 text-xs">
          <Link
            href="/dashboard"
            className="flex items-center justify-between px-3 py-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
          >
            <span>Candidate View</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </aside>

      {/* Main Administrative Viewport */}
      <div className="flex-1 overflow-y-auto min-h-screen">
        {children}
      </div>
    </div>
  );
}
