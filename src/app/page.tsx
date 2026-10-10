'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterCandidateSchema, LoginCandidateSchema, type RegisterCandidateInput, type LoginCandidateInput } from '@/lib/validations/auth';
import { Terminal, ShieldCheck, Cpu, Code2, BrainCircuit, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const registerForm = useForm<RegisterCandidateInput>({
    resolver: zodResolver(RegisterCandidateSchema),
    defaultValues: {
      fullName: '',
      studentEmail: '',
      password: '',
      intendedDivision: 'problem_analysis',
    },
  });

  const loginForm = useForm<LoginCandidateInput>({
    resolver: zodResolver(LoginCandidateSchema),
    defaultValues: {
      studentEmail: '',
      password: '',
    },
  });

  const onRegister = async (data: RegisterCandidateInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Registration failed');
      }
      router.push('/dashboard');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration error');
    } finally {
      setIsLoading(false);
    }
  };

  const onLogin = async (data: LoginCandidateInput) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.error || 'Login failed');
      }
      if (result.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070d17] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">ICPC INC 2026</h1>
            <p className="text-xs text-slate-400">Candidate Qualification Platform</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
          <span>Qualification Window Active</span>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left Column: Brief and Divisions Info */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-blue-950/70 border border-blue-800/60 text-blue-300">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            President University ICPC Training Team
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Select Your Division & Begin Qualification
          </h2>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Welcome to the 4-day internal qualification period for the ICPC INC 2026 preparation program. Each candidate will receive an assessment containing 3 to 5 comprehensive questions tailored to their selected division, with a 3-hour strict time limit.
          </p>

          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Division Tracks Overview
            </h3>

            {/* Division 1: Problem Analysis */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 shrink-0 mt-0.5">
                  <BrainCircuit className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Problem Analysis</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Focuses on interpreting complex problem statements, extracting hidden constraints, discovering mathematical invariants, and formulating algorithmic approaches.
                  </p>
                </div>
              </div>
            </div>

            {/* Division 2: Algorithm Builder */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-blue-950/60 border border-blue-700/50 text-blue-400 shrink-0 mt-0.5">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Algorithm Builder</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Focuses on deriving mathematically optimal algorithms, rigorous correctness proofs, asymptotic time and space complexity bounds, and edge case boundary proofs.
                  </p>
                </div>
              </div>
            </div>

            {/* Division 3: Programmer */}
            <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:border-slate-700 transition-colors">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-lg bg-cyan-950/60 border border-cyan-700/50 text-cyan-400 shrink-0 mt-0.5">
                  <Code2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Programmer</h4>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Focuses on rapid C++ implementation, standard template library (STL), data structure engineering, debugging under pressure, and passing sandboxed test cases.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Registration / Login Box */}
        <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* Mode Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-lg mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Candidate Registration
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {mode === 'register' ? (
            <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Alex Pratama"
                  {...registerForm.register('fullName')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {registerForm.formState.errors.fullName && (
                  <p className="text-red-400 text-xs mt-1">
                    {registerForm.formState.errors.fullName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Institutional Student Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="name@student.president.ac.id"
                  {...registerForm.register('studentEmail')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Must end in <span className="text-slate-300 font-mono">@student.president.ac.id</span>
                </p>
                {registerForm.formState.errors.studentEmail && (
                  <p className="text-red-400 text-xs mt-1">
                    {registerForm.formState.errors.studentEmail.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Account Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Minimum 6 characters"
                  {...registerForm.register('password')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {registerForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Intended Division <span className="text-red-400">*</span>
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'problem_analysis', label: 'Problem Analysis' },
                    { id: 'algorithm_builder', label: 'Algorithm Builder' },
                    { id: 'programmer', label: 'Programmer' },
                  ].map((div) => (
                    <label
                      key={div.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        registerForm.watch('intendedDivision') === div.id
                          ? 'border-blue-500 bg-blue-950/30 text-white'
                          : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        value={div.id}
                        {...registerForm.register('intendedDivision')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium">{div.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-900/40 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? 'Registering...' : 'Register as Candidate'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Institutional Student Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  placeholder="name@student.president.ac.id"
                  {...loginForm.register('studentEmail')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {loginForm.formState.errors.studentEmail && (
                  <p className="text-red-400 text-xs mt-1">
                    {loginForm.formState.errors.studentEmail.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Your password"
                  {...loginForm.register('password')}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                {loginForm.formState.errors.password && (
                  <p className="text-red-400 text-xs mt-1">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-lg shadow-lg shadow-blue-900/40 transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? 'Signing In...' : 'Sign In to Platform'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 px-6 py-6 text-center text-xs text-slate-500">
        ICPC INC 2026 Qualification Platform • President University Competitive Programming Division • Strict Proctoring Active
      </footer>
    </main>
  );
}
