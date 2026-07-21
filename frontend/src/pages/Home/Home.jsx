import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
  GraduationCap, ArrowRight, PlayCircle, TrendingUp, BookOpen,
  Upload, Users, Rss, BarChart2, MessageSquare, UserPlus,
  CheckCircle, ShieldCheck, Lock, Globe, Shield, Star, Menu,
  Cpu, Binary, Atom, Dna, HeartPulse, FlaskConical,
  Settings, Brain, Palette, Briefcase, Scale, Leaf, Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const AnimatedSection = ({ children, className = "", delay = "0ms" }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? 'animate-in' : 'opacity-0'}`}
      style={{ '--delay': delay, animationDelay: delay }}
    >
      {children}
    </div>
  );
};

const CountUpNumber = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp = null;
    const easeOutQuad = (t) => t * (2 - t);
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(easeOutQuad(progress) * end);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);
  }, [end, duration, isVisible]);

  // Format based on type of number (e.g., 98.9 vs 50000)
  // IMPORTANT: magnitude checks must come BEFORE decimal check,
  // otherwise floating-point animation values (e.g. 1535999.9999) hit the
  // decimal branch and display as raw unformatted millions.
  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 10000) return (num / 1000).toFixed(0) + "k";
    if (num % 1 !== 0) return num.toFixed(1); // small decimals (e.g. 98.9%)
    return Math.floor(num).toString();
  };

  return <span ref={ref}>{formatNumber(count)}{suffix}</span>;
};

const Home = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [typewriterText, setTypewriterText] = useState("");
  const fullText = "Connection";
  const [isAnnual, setIsAnnual] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tickerPaused, setTickerPaused] = useState(false);
  const [platformStats, setPlatformStats] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [statsRes, catRes] = await Promise.all([
          api.get('/landing/stats'),
          api.get('/landing/categories')
        ]);
        if (statsRes.data?.success) setPlatformStats(statsRes.data.data);
        if (catRes.data?.success) setCategories(catRes.data.data);
      } catch (err) {
        console.error('Failed to fetch landing data', err);
      }
    };
    fetchLandingData();
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    let i = 0;
    // Delay start for typewriter to match hero stagger
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setTypewriterText(fullText.substring(0, i + 1));
        i++;
        if (i === fullText.length) clearInterval(interval);
      }, 80);
      return () => clearInterval(interval);
    }, 1000); // 1000ms delay before typing
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans overflow-x-hidden">

      {/* SECTION 1 — TOP NAVIGATION BAR */}
      <div className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-md border-b border-[#E2E8F0] py-3'
          : 'bg-transparent py-5'
        }`}>
        <nav className="max-w-[1200px] mx-auto px-4 md:px-6 flex items-center justify-between">
          {/* Logo & Company Name */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-blue-500/30">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-[22px] font-black text-[#0F172A] tracking-tight">ResearchConnect</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: 'Features', href: '#features' },
              { label: 'Research', href: '#research' },
              { label: 'Community', href: '#community' },
              { label: 'About', href: '#about' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-[15px] font-semibold text-[#475569] hover:text-[#2563EB] transition-colors duration-200"
              >
                {item.label}
              </a>
            ))}
          </div>

          {/* Auth Actions (Login / Register) */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="bg-white border-2 border-[#E2E8F0] text-[#0F172A] hover:text-[#2563EB] hover:border-[#BFDBFE] rounded-xl px-5 py-2 text-[15px] font-bold transition-all shadow-sm"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-[#2563EB] hover:bg-[#1D4ED8] text-white rounded-xl px-6 py-2.5 text-[15px] font-bold transition-colors shadow-md shadow-blue-500/20"
            >
              Sign Up
            </Link>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden text-[#0F172A]" onClick={() => setMobileNavOpen(!mobileNavOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </nav>
      </div>

      {/* SECTION 2 — HERO SECTION */}
      <section className="relative flex items-center justify-center pt-28 pb-16 px-4 overflow-hidden">
        {/* Advanced Decorative Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-blue-400/20 to-indigo-500/20 blur-[80px] rounded-full animate-blob mix-blend-multiply" />
          <div className="absolute top-[20%] right-[-10%] w-[450px] h-[450px] bg-gradient-to-bl from-purple-400/20 to-pink-500/20 blur-[80px] rounded-full animate-blob mix-blend-multiply" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-gradient-to-tr from-cyan-400/20 to-blue-500/20 blur-[80px] rounded-full animate-blob mix-blend-multiply" style={{ animationDelay: '4s' }} />
        </div>

        <div className="relative z-10 w-full max-w-[900px] mx-auto px-4 flex flex-col items-center text-center">

          {/* Top Pill Badge */}
          <div className="animate-fade-up flex items-center gap-2 rounded-full border border-blue-200/60 bg-white/50 backdrop-blur-md px-5 py-2 mb-10 shadow-[0_8px_20px_rgba(37,99,235,0.08)] hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)] hover:border-blue-300 transition-all cursor-pointer">
            <Star className="w-[16px] h-[16px] text-[#2563EB] fill-[#2563EB] animate-pulse" />
            <span className="text-[#2563EB] text-[14px] font-bold tracking-wide uppercase">Trusted by 50,000+ researchers</span>
            <div className="relative ml-2">
              <div className="w-[8px] h-[8px] bg-[#22C55E] rounded-full" />
              <div className="absolute inset-0 bg-[#22C55E] rounded-full animate-pulse-ring" />
            </div>
          </div>

          {/* Main Heading */}
          <div className="flex flex-col gap-1 md:gap-3">
            <h1 className="text-[52px] md:text-[76px] font-black tracking-tighter text-[#0F172A] leading-[1.1] animate-hero-text-in">
              Where Research
            </h1>
            <h1 className="text-[52px] md:text-[76px] font-black tracking-tighter text-[#0F172A] leading-[1.1] flex items-center justify-center flex-wrap animate-hero-text-in" style={{ animationDelay: '150ms' }}>
              Meets <span className="ml-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 animate-gradient-shift bg-[length:200%_auto] border-r-4 border-indigo-600 pr-2 whitespace-nowrap overflow-hidden">
                {typewriterText}
              </span>
            </h1>
            <h1 className="text-[52px] md:text-[76px] font-black tracking-tighter text-[#0F172A] leading-[1.1] animate-hero-text-in drop-shadow-sm" style={{ animationDelay: '300ms' }}>
              &amp; Impact
            </h1>
          </div>

          {/* Subtitle */}
          <p className="mt-6 max-w-[560px] mx-auto text-[#475569] text-[18px] leading-[1.7] animate-fade-up" style={{ animationDelay: '500ms' }}>
            Publish research, discover citations, collaborate with peers, and grow your academic impact — all in one intelligent platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-10 animate-fade-up w-full max-w-[400px] sm:max-w-none justify-center" style={{ animationDelay: '800ms' }}>
            <Link to="/register" className="group flex items-center justify-center gap-2 bg-gradient-to-r from-[#2563EB] to-[#4F46E5] text-white text-[18px] md:text-[20px] font-bold rounded-2xl px-12 py-5 transition-all hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] active:scale-95 animate-gradient-shift bg-[length:200%_200%] w-full sm:w-auto">
              Sign Up for Free
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
            </Link>
          </div>

          {/* Social Proof */}
          <div className="mt-12 flex flex-col md:flex-row items-center gap-4 animate-fade-up" style={{ animationDelay: '1000ms' }}>
            <div className="flex">
              {['#EF4444', '#F59E0B', '#22C55E', '#3B82F6', '#8B5CF6'].map((color, i) => (
                <div key={i} className={`w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold ${i !== 0 ? '-ml-3' : ''}`} style={{ backgroundColor: color }}>
                  {['AB', 'CD', 'EF', 'GH', 'IJ'][i]}
                </div>
              ))}
            </div>
            <div className="text-[#475569] text-[14px]">
              Join 50,000+ researchers from MIT, Stanford, Oxford...
            </div>
            <div className="flex items-center gap-1 text-[#F59E0B]">
              {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="w-4 h-4 fill-current" />)}
              <span className="text-[#0F172A] font-bold text-sm ml-1">4.9/5 rating</span>
            </div>
          </div>

          {/* Hero Visual - Dashboard Mockup */}
          <AnimatedSection delay="1200ms" className="mt-12 relative w-full">
            <div className="relative animate-scale-in w-full">

              {/* Top Floating Badge */}
              <div className="hidden md:flex absolute -top-8 right-0 md:-right-8 bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] px-5 py-3 items-center gap-3 animate-float-slow z-20 hover:scale-105 transition-transform ring-1 ring-slate-900/5">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-100 to-green-50 flex items-center justify-center shadow-inner">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-sm font-black text-green-600">+24%</div>
                  <div className="text-[11px] text-slate-500 font-semibold leading-none">citations this month</div>
                </div>
              </div>

              {/* Left side floating badge */}
              <div className="hidden md:flex absolute top-[40%] -left-8 bg-white/80 backdrop-blur-xl border border-white/80 rounded-2xl shadow-[0_16px_40px_rgba(0,0,0,0.08)] px-4 py-3 items-center gap-3 animate-float-slow z-20 hover:scale-105 transition-transform ring-1 ring-slate-900/5" style={{ animationDelay: '1.5s' }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-50 flex items-center justify-center shadow-inner">
                  <Users className="w-4 h-4 text-indigo-600" />
                </div>
                <div className="text-[11px] font-bold text-slate-800 whitespace-nowrap leading-tight">12 collaboration<br />requests</div>
              </div>

              {/* The Main Card */}
              <div className="relative bg-white/70 backdrop-blur-2xl border border-white/80 rounded-[24px] shadow-[0_40px_100px_rgba(37,99,235,0.15)] animate-float text-left mx-auto w-full max-w-[820px] overflow-hidden ring-1 ring-slate-900/5">
                <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent pointer-events-none" />

                {/* Window chrome */}
                <div className="relative flex items-center gap-2 px-6 py-4 border-b border-white/40 bg-white/40 backdrop-blur-md">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm" />
                    <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[11px] text-slate-500 font-semibold bg-white/50 backdrop-blur-sm shadow-sm border border-white/60 px-4 py-1.5 rounded-full inline-flex items-center gap-1.5"><Lock className="w-3 h-3" /> researchconnect.io/dashboard</span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 sm:grid-cols-5 gap-4">

                  {/* LEFT: Profile + Stats */}
                  <div className="sm:col-span-2 flex flex-col gap-3">

                    {/* Profile */}
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#2563EB] to-[#4F46E5] text-white flex items-center justify-center text-sm font-black shrink-0">SC</div>
                      <div>
                        <div className="font-bold text-[#0F172A] text-sm leading-tight">Dr. Sarah Chen</div>
                        <div className="text-[#475569] text-[11px]">MIT • Quantum Physics</div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          <span className="text-[10px] text-[#22C55E] font-semibold">Active researcher</span>
                        </div>
                      </div>
                    </div>

                    {/* KPI Stats with CountUp */}
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Reads', val: 1200, suffix: '', delta: '+8%', color: '#DBEAFE' },
                        { label: 'Citations', val: 48, suffix: '', delta: '+5', color: '#DCFCE7' },
                        { label: 'h-index', val: 12, suffix: '', delta: 'Top 5%', color: '#EDE9FE' },
                      ].map((s, i) => (
                        <AnimatedSection key={i} delay={`${1400 + i * 100}ms`} className="rounded-xl p-2 text-center" style={{ backgroundColor: s.color }}>
                          <div className="text-base font-black text-[#0F172A]">
                            <CountUpNumber end={s.val} duration={1500} suffix={s.suffix} />
                          </div>
                          <div className="text-[9px] text-[#475569] font-semibold leading-tight">{s.label}</div>
                          <div className="text-[9px] text-[#22C55E] font-bold mt-0.5">{s.delta}</div>
                        </AnimatedSection>
                      ))}
                    </div>

                    {/* Mini Bar Chart */}
                    <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-bold text-[#0F172A]">Citations / Month</span>
                        <span className="text-[9px] text-[#22C55E] font-bold">▲ Trending</span>
                      </div>
                      <div className="flex items-end gap-1 h-10">
                        {[3, 5, 4, 7, 6, 9, 8, 12, 10, 14, 11, 15].map((v, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-sm"
                            style={{
                              height: `${(v / 15) * 100}%`,
                              background: i === 11
                                ? 'linear-gradient(to top, #2563EB, #4F46E5)'
                                : i >= 9
                                  ? 'rgba(37,99,235,0.4)'
                                  : 'rgba(37,99,235,0.15)'
                            }}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[8px] text-[#94A3B8]">Jan</span>
                        <span className="text-[8px] text-[#94A3B8]">Dec</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: Activity + Paper */}
                  <div className="sm:col-span-3 flex flex-col gap-3">

                    {/* Recent Activity with staggered animations */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold text-[#0F172A]">Recent Activity</span>
                        <span className="text-[9px] text-[#2563EB] font-semibold cursor-pointer">View all →</span>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        {[
                          { icon: UserPlus, label: 'Collaboration request from Dr. Park', time: '2m ago', color: 'bg-[#DBEAFE]', tc: 'text-[#2563EB]', dot: '#2563EB', isNew: false },
                          { icon: BookOpen, label: '3 new citations today', time: '1h ago', color: 'bg-[#DCFCE7]', tc: 'text-[#22C55E]', dot: '#22C55E', isNew: true },
                          { icon: TrendingUp, label: 'h-index updated to 12', time: '3h ago', color: 'bg-[#EDE9FE]', tc: 'text-[#4F46E5]', dot: '#4F46E5', isNew: false },
                          { icon: Users, label: 'Prof. Zhang viewed your profile', time: '5h ago', color: 'bg-[#FEF3C7]', tc: 'text-[#F59E0B]', dot: '#F59E0B', isNew: false },
                        ].map((item, i) => (
                          <AnimatedSection key={i} delay={`${1500 + i * 150}ms`} className="[&.animate-in]:animate-fade-up">
                            <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#E2E8F0] hover:border-[#BFDBFE] transition-colors">
                              <div className={`w-6 h-6 rounded-full ${item.color} flex items-center justify-center shrink-0 relative`}>
                                <item.icon className={`w-3 h-3 ${item.tc}`} />
                                {item.isNew && (
                                  <div className="absolute -top-0.5 -right-0.5">
                                    <div className="w-2 h-2 bg-[#22C55E] rounded-full animate-ping" />
                                    <div className="absolute inset-0 w-2 h-2 bg-[#22C55E] rounded-full" />
                                  </div>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-[#0F172A] flex-1 truncate">{item.label}</span>
                              <span className="text-[9px] text-[#94A3B8] font-medium shrink-0">{item.time}</span>
                            </div>
                          </AnimatedSection>
                        ))}
                      </div>
                    </div>

                    {/* Top Paper with animated progress bar */}
                    <AnimatedSection delay="2200ms" className="[&.animate-in]:animate-fade-up">
                      <div className="bg-gradient-to-br from-[#EFF6FF] to-[#EDE9FE] rounded-xl p-3 border border-[#DBEAFE]">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-2">
                            <div className="text-[9px] font-bold text-[#2563EB] uppercase tracking-wide mb-1">📄 Top Publication</div>
                            <div className="text-[11px] font-bold text-[#0F172A] leading-tight line-clamp-2">Quantum Entanglement in Neural Networks: A Novel Approach</div>
                            <div className="text-[9px] text-[#475569] mt-1">Nature Physics · 2024</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-sm font-black text-[#2563EB]">48</div>
                            <div className="text-[8px] text-[#475569]">citations</div>
                          </div>
                        </div>
                        {/* Impact bar with scroll-triggered animation */}
                        <div className="mt-2">
                          <div className="flex justify-between text-[9px] text-[#475569] mb-1">
                            <span>Research Impact Score</span>
                            <span className="font-bold text-[#2563EB]"><CountUpNumber end={72} duration={1500} suffix=" / 100" /></span>
                          </div>
                          <div className="h-1 w-full bg-white/60 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-[#2563EB] to-[#4F46E5] transition-all duration-1000" style={{ width: '72%' }} />
                          </div>
                        </div>
                      </div>
                    </AnimatedSection>

                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>

        </div>
      </section>

      {/* SECTION 3 — STATS TICKER */}
      <section
        className="w-full bg-gradient-to-r from-[#2563EB] to-[#4F46E5] py-4 overflow-hidden flex whitespace-nowrap"
        onMouseEnter={() => setTickerPaused(true)}
        onMouseLeave={() => setTickerPaused(false)}
      >
        <div
          className="flex gap-8 items-center animate-ticker"
          style={{ animationPlayState: tickerPaused ? 'paused' : 'running' }}
        >
          {Array(4).fill([
            `${platformStats ? (platformStats.researchers/1000).toFixed(1) + 'k+' : '50,000+'} Researchers`, 
            `${platformStats ? (platformStats.publications/1000000).toFixed(1) + 'M+' : '2.4M'} Publications`, 
            `${platformStats ? platformStats.countries + '+' : '180+'} Countries`,
            "98.9% Uptime", "4.9★ Rating", "500K Citations Tracked", 
            `${platformStats ? (platformStats.universities/1000).toFixed(1) + 'k+' : '10K+'} Institutions`
          ]).flat().map((item, index) => (
            <div key={index} className="flex items-center gap-8 text-white text-[14px] font-semibold">
              <span>{item}</span>
              <span className="text-white/40 text-[10px]">◆</span>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3.5 — RESEARCH CATEGORIES */}
      <section id="research" className="bg-[#F8FAFC] py-24 px-4 border-t border-[#E2E8F0]">
        <div className="max-w-[1200px] mx-auto text-center">
          <AnimatedSection>
            <span className="inline-block bg-[#EDE9FE] text-[#4F46E5] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Disciplines
            </span>
            <h2 className="text-[40px] md:text-[48px] font-bold text-[#0F172A] leading-tight">
              Explore diverse research fields
            </h2>
            <p className="mt-4 text-[#475569] text-[18px] max-w-[600px] mx-auto mb-16">
              Connect with researchers and discover publications across various academic disciplines.
            </p>
          </AnimatedSection>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-left mx-auto max-w-[1050px]">
            {(categories.length > 0 ? categories : [
              { name: 'Computer Science', count: 4250, icon: 'Cpu' },
              { name: 'Mathematics', count: 1820, icon: 'Binary' },
              { name: 'Physics', count: 2980, icon: 'Atom' },
              { name: 'Biology & Life Sciences', count: 3410, icon: 'Dna' },
              { name: 'Medicine & Healthcare', count: 4120, icon: 'HeartPulse' },
              { name: 'Chemistry', count: 1890, icon: 'FlaskConical' },
              { name: 'Economics & Finance', count: 1240, icon: 'TrendingUp' },
              { name: 'Social Sciences', count: 2150, icon: 'Users' },
              { name: 'Earth & Environmental', count: 1560, icon: 'Globe' },
              { name: 'Engineering', count: 3100, icon: 'Settings' },
              { name: 'Psychology', count: 1750, icon: 'Brain' },
              { name: 'Arts & Humanities', count: 1420, icon: 'Palette' },
              { name: 'Business & Management', count: 2890, icon: 'Briefcase' },
              { name: 'Law & Political Science', count: 1150, icon: 'Scale' },
              { name: 'Agriculture', count: 980, icon: 'Leaf' }
            ]).map((cat, i) => {
              const IconMap = { Cpu, Binary, Atom, Dna, HeartPulse, FlaskConical, TrendingUp, Users, Globe, Settings, Brain, Palette, Briefcase, Scale, Leaf };
              const Icon = IconMap[cat.icon] || BookOpen;
              return (
                <AnimatedSection key={i} delay={`${i * 100}ms`} className="[&.animate-in]:animate-fade-up">
                  <div className="group bg-white border border-[#E2E8F0] hover:border-[#4F46E5] hover:shadow-[0_8px_30px_rgba(79,70,229,0.12)] rounded-2xl p-6 text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col h-full">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#F5F3FF] group-hover:from-[#4F46E5] group-hover:to-[#3730A3] flex items-center justify-center mb-5 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-[#4F46E5] group-hover:text-white transition-colors duration-300" />
                    </div>
                    <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">{cat.name}</h3>
                    <div className="mt-auto pt-4 flex items-center justify-between border-t border-[#F1F5F9]">
                      <span className="text-[13px] font-semibold text-[#475569]">{cat.count.toLocaleString()} publications</span>
                      <ArrowRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#4F46E5] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>

          <AnimatedSection delay="300ms" className="mt-12 text-center [&.animate-in]:animate-fade-up">
            <Link to="/register" className="inline-flex items-center justify-center gap-2 text-[#64748B] text-[16px] font-semibold hover:text-[#4F46E5] transition-colors group">
              <span>...and many more disciplines</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </AnimatedSection>
        </div>
      </section>

      {/* SECTION 4 — FEATURES */}
      <section id="features" className="bg-white py-24 px-4">
        <div className="relative z-10 w-full max-w-[960px] mx-auto flex flex-col items-center text-center">
          <AnimatedSection delay="0ms">
            <span className="inline-block bg-[#DBEAFE] text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Features
            </span>
            <h2 className="text-[40px] md:text-[48px] font-bold text-[#0F172A] leading-tight">
              Everything you need to advance your research
            </h2>
            <p className="mt-4 text-[#475569] text-[18px] max-w-[560px] mx-auto">
              Discover powerful tools designed specifically for the academic workflow.
            </p>
          </AnimatedSection>

          {/* Compact Checkerboard Grid */}
          <div className="flex flex-wrap justify-center gap-6 mt-16 text-left mx-auto max-w-[850px]">
            {/* Feature 1 (Featured) */}
            <AnimatedSection delay="100ms" className="[&.animate-in]:animate-stagger-fade">
              <div className="group relative bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] overflow-hidden aspect-square flex flex-col justify-between w-[240px]">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#2563EB] to-[#4F46E5]" />
                <div className="absolute top-4 right-4 bg-[#DCFCE7] text-[#22C55E] text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                  Most Used
                </div>
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#DBEAFE] to-[#EFF6FF] flex items-center justify-center mb-4">
                    <Upload className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Smart Publishing</h3>
                  <p className="text-[#475569] text-[13px] leading-snug line-clamp-3">
                    Upload papers in seconds with automatic metadata extraction and formatting.
                  </p>
                </div>
                <Link to="/register" className="text-[#2563EB] font-bold text-[13px] flex items-center gap-1 group-hover:gap-2 transition-all mt-3">
                  Learn more <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Feature 2 */}
            <AnimatedSection delay="150ms" className="[&.animate-in]:animate-stagger-fade">
              <div className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] aspect-square flex flex-col justify-between w-[240px]">
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#DCFCE7] to-[#F0FDF4] flex items-center justify-center mb-4">
                    <BookOpen className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Citation Tracking</h3>
                  <p className="text-[#475569] text-[13px] leading-snug line-clamp-3">
                    Monitor who cites your work in real-time with alerts and advanced h-index.
                  </p>
                </div>
                <Link to="/register" className="text-[#22C55E] font-bold text-[13px] flex items-center gap-1 group-hover:gap-2 transition-all mt-3">
                  Explore citations <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Feature 3 */}
            <AnimatedSection delay="200ms" className="[&.animate-in]:animate-stagger-fade">
              <div className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] aspect-square flex flex-col justify-between w-[240px]">
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#EDE9FE] to-[#F5F3FF] flex items-center justify-center mb-4">
                    <Users className="w-5 h-5 text-[#4F46E5]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Peer Collaboration</h3>
                  <p className="text-[#475569] text-[13px] leading-snug line-clamp-3">
                    Connect seamlessly with co-authors and reviewers across 180+ countries.
                  </p>
                </div>
                <Link to="/register" className="text-[#4F46E5] font-bold text-[13px] flex items-center gap-1 group-hover:gap-2 transition-all mt-3">
                  Collaborators <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Feature 4 */}
            <AnimatedSection delay="250ms" className="[&.animate-in]:animate-stagger-fade">
              <div className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] aspect-square flex flex-col justify-between w-[240px]">
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#FEF3C7] to-[#FFFBEB] flex items-center justify-center mb-4">
                    <Rss className="w-5 h-5 text-[#F59E0B]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Intelligent Feed</h3>
                  <p className="text-[#475569] text-[13px] leading-snug line-clamp-3">
                    A personalized AI-curated research feed based entirely on your interests.
                  </p>
                </div>
                <Link to="/register" className="text-[#F59E0B] font-bold text-[13px] flex items-center gap-1 group-hover:gap-2 transition-all mt-3">
                  Explore feed <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Feature 5 */}
            <AnimatedSection delay="300ms" className="[&.animate-in]:animate-stagger-fade">
              <div className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] aspect-square flex flex-col justify-between w-[240px]">
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#DBEAFE] to-[#EFF6FF] flex items-center justify-center mb-4">
                    <BarChart2 className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Impact Analytics</h3>
                  <p className="text-[#475569] text-[13px] leading-snug line-clamp-3">
                    Track reads, downloads, citations, and engagement with beautiful charts.
                  </p>
                </div>
                <Link to="/register" className="text-[#2563EB] font-bold text-[13px] flex items-center gap-1 group-hover:gap-2 transition-all mt-3">
                  View analytics <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Feature 6 */}
            <AnimatedSection delay="350ms" className="[&.animate-in]:animate-stagger-fade">
              <div className="group bg-white border border-[#E2E8F0] rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)] aspect-square flex flex-col justify-between w-[240px]">
                <div>
                  <div className="w-[44px] h-[44px] rounded-xl bg-gradient-to-br from-[#FCE7F3] to-[#FDF2F8] flex items-center justify-center mb-4">
                    <MessageSquare className="w-5 h-5 text-[#DB2777]" />
                  </div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] mb-2">Academic Chat</h3>
                  <p className="text-[#475569] text-[13px] leading-snug line-clamp-3">
                    Encrypted messaging for researchers with file sharing and citation tools.
                  </p>
                </div>
                <Link to="/register" className="text-[#DB2777] font-bold text-[13px] flex items-center gap-1 group-hover:gap-2 transition-all mt-3">
                  Start messaging <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* SECTION 5 — HOW IT WORKS */}
      <section id="steps" className="bg-[#F8FAFC] py-24 px-4 overflow-hidden">
        <div className="max-w-[1200px] mx-auto text-center">
          <AnimatedSection>
            <span className="inline-block bg-[#DBEAFE] text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Steps
            </span>
            <h2 className="text-[40px] font-bold text-[#0F172A] leading-tight">
              Get started in 3 simple steps
            </h2>
          </AnimatedSection>

          <div className="flex flex-wrap justify-center gap-6 mt-16 max-w-[1050px] mx-auto">

            {/* Step 1 */}
            <AnimatedSection delay="0ms" className="[&.animate-in]:animate-fade-up">
              <div className="relative bg-white p-6 rounded-2xl border border-[#E2E8F0] text-left aspect-square flex flex-col justify-between w-[300px] hover:border-[#BFDBFE] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    <span className="text-white text-[15px] font-black">01</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                    <UserPlus className="w-5 h-5 text-[#2563EB]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">Create Your Profile</h3>
                  <p className="text-[#475569] text-[14px] mb-4 leading-snug">
                    Sign up, add your research interests, and connect your ORCID.
                  </p>
                  <ul className="space-y-2 mb-4">
                    {['Institutional verification', 'ORCID integration', 'Interest tags'].map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] text-[#475569] font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22C55E] shrink-0" /> <span className="truncate">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/register" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2563EB] hover:gap-2.5 transition-all mt-auto">
                  Create your profile <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Step 2 */}
            <AnimatedSection delay="150ms" className="[&.animate-in]:animate-fade-up">
              <div className="relative bg-white p-6 rounded-2xl border border-[#E2E8F0] text-left aspect-square flex flex-col justify-between w-[300px] hover:border-[#BFDBFE] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    <span className="text-white text-[15px] font-black">02</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#DBEAFE] flex items-center justify-center shrink-0">
                    <Upload className="w-5 h-5 text-[#2563EB]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">Publish Your Work</h3>
                  <p className="text-[#475569] text-[14px] mb-4 leading-snug">
                    Upload your preprints and we'll handle metadata and DOI.
                  </p>
                  <ul className="space-y-2 mb-4">
                    {['Auto metadata extraction', 'DOI registration', 'Visibility controls'].map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] text-[#475569] font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22C55E] shrink-0" /> <span className="truncate">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/register" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2563EB] hover:gap-2.5 transition-all mt-auto">
                  Publish your first paper <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

            {/* Step 3 */}
            <AnimatedSection delay="300ms" className="[&.animate-in]:animate-fade-up">
              <div className="relative bg-white p-6 rounded-2xl border border-[#E2E8F0] text-left aspect-square flex flex-col justify-between w-[300px] hover:border-[#BFDBFE] hover:shadow-lg transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
                    <span className="text-white text-[15px] font-black">03</span>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-[#DCFCE7] flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-[#22C55E]" />
                  </div>
                </div>
                <div>
                  <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">Track Your Impact</h3>
                  <p className="text-[#475569] text-[14px] mb-4 leading-snug">
                    Watch citations grow and connect with peers who cite you.
                  </p>
                  <ul className="space-y-2 mb-4">
                    {['Real-time citations', 'Analytics dashboard', 'Peer connections'].map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-[13px] text-[#475569] font-medium">
                        <CheckCircle className="w-3.5 h-3.5 text-[#22C55E] shrink-0" /> <span className="truncate">{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <Link to="/register" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#2563EB] hover:gap-2.5 transition-all mt-auto">
                  Track your impact <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </AnimatedSection>

          </div>
        </div>
      </section>

      {/* SECTION 6 — SOCIAL PROOF / TESTIMONIALS */}
      <section id="community" className="bg-white py-16 px-4">
        <div className="max-w-[1200px] mx-auto text-center">
          <AnimatedSection>
            <h3 className="text-[18px] font-semibold text-[#475569] mb-10">
              Trusted by researchers at the world's leading institutions
            </h3>
          </AnimatedSection>

          {/* Animated Infinite Scroll Ticker for Institutions */}
          <div className="relative overflow-hidden mb-16">
            {/* Fade edges */}
            <div className="absolute left-0 top-0 w-24 h-full bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 w-24 h-full bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

            {/* Row 1 — scroll left */}
            <div className="flex gap-0 mb-4" style={{ animation: 'ticker 35s linear infinite' }}>
              {[
                'MIT', 'Stanford', 'Oxford', 'Harvard', 'ETH Zurich', 'Cambridge', 'Caltech', 'NUS',
                'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IISc Bangalore', 'IIT Kanpur', 'AIIMS Delhi',
                'MIT', 'Stanford', 'Oxford', 'Harvard', 'ETH Zurich', 'Cambridge', 'Caltech', 'NUS',
                'IIT Bombay', 'IIT Delhi', 'IIT Madras', 'IISc Bangalore', 'IIT Kanpur', 'AIIMS Delhi',
              ].map((uni, i) => (
                <div key={i} className="flex items-center shrink-0">
                  <span className="text-[15px] font-bold text-[#94A3B8] hover:text-[#2563EB] transition-colors cursor-default px-6 whitespace-nowrap">{uni}</span>
                  <span className="text-[#E2E8F0] text-[10px]">◆</span>
                </div>
              ))}
            </div>

            {/* Row 2 — scroll right (reverse) */}
            <div className="flex gap-0" style={{ animation: 'ticker 45s linear infinite reverse' }}>
              {[
                'IIT Kharagpur', 'IIT Roorkee', 'NIT Trichy', 'TIFR Mumbai', 'BITS Pilani', 'JNU Delhi',
                'Princeton', 'Yale', 'Columbia', 'UCL', 'Imperial College', 'TU Munich', 'EPFL', 'Peking Univ',
                'IIT Kharagpur', 'IIT Roorkee', 'NIT Trichy', 'TIFR Mumbai', 'BITS Pilani', 'JNU Delhi',
                'Princeton', 'Yale', 'Columbia', 'UCL', 'Imperial College', 'TU Munich', 'EPFL', 'Peking Univ',
              ].map((uni, i) => (
                <div key={i} className="flex items-center shrink-0">
                  <span className="text-[14px] font-semibold text-[#CBD5E1] hover:text-[#4F46E5] transition-colors cursor-default px-5 whitespace-nowrap">{uni}</span>
                  <span className="text-[#E2E8F0] text-[10px]">◇</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-left mx-auto max-w-[1050px]">
            {[
              {
                quote: "ResearchConnect transformed how I track citations. I discovered two papers citing my work that I'd completely missed. The real-time alerts are invaluable.",
                name: "Dr. Elena Rossetti", role: "Professor of Bioinformatics", uni: "University of Bologna"
              },
              {
                quote: "The peer messaging feature helped me find a co-author in Singapore within a week. We've since published two papers together.",
                name: "Dr. Marcus Webb", role: "Research Scientist", uni: "MIT CSAIL"
              },
              {
                quote: "My h-index visibility improved just by having all my publications in one verified place. Other researchers can actually find my work now.",
                name: "Prof. Aisha Diallo", role: "Climate Research Lead", uni: "Oxford"
              }
            ].map((t, i) => (
              <AnimatedSection key={i} delay={`${i * 200}ms`} className="[&.animate-in]:animate-stagger-fade">
                <div className="bg-white border border-[#E2E8F0] rounded-2xl p-6 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-lg transition-all flex flex-col justify-between aspect-square w-[320px]">
                  <div>
                    <div className="flex gap-1 mb-4 text-[#F59E0B]">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} className="w-4 h-4 fill-current" />)}
                    </div>
                    <p className="text-[#0F172A] text-[15px] leading-[1.7] italic mb-6">
                      "{t.quote}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-slate-200 to-slate-100 flex items-center justify-center shrink-0 text-[#0F172A] font-bold">
                      {t.name.split(' ').map(n => n[0]).join('').replace('D', '').replace('P', '').slice(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold text-[#0F172A] text-[14px]">{t.name}</div>
                      <div className="text-[#475569] text-[12px]">{t.role} • {t.uni}</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 — STATS SECTION */}
      <section className="bg-gradient-to-r from-[#F0F7FF] to-[#EDE9FE] py-20 px-4">
        <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { end: platformStats ? platformStats.researchers : 50000, suffix: '+', label: 'Active Researchers', icon: Users },
            { end: platformStats ? platformStats.publications : 2400000, suffix: '+', label: 'Publications Indexed', icon: BookOpen },
            { end: 98.9, suffix: '%', label: 'Platform Uptime', icon: Shield },
            { end: platformStats ? platformStats.countries : 180, suffix: '+', label: 'Countries Represented', icon: Globe }
          ].map((stat, i) => (
            <AnimatedSection key={i} delay={`${i * 150}ms`} className="[&.animate-in]:animate-fade-up flex flex-col items-center text-center">
              <div className="text-[40px] md:text-[56px] font-black text-[#0F172A]">
                <CountUpNumber end={stat.end} suffix={stat.suffix} />
              </div>
              <div className="text-[#475569] text-[16px] font-medium mb-2">{stat.label}</div>
              <stat.icon className="w-5 h-5 text-[#2563EB]" />
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* SECTION 8 — PRICING SECTION (REMOVED AS PER USER REQUEST) */}

      {/* SECTION 9 — ABOUT */}
      <section id="about" className="bg-[#F8FAFC] py-24 px-4">
        <div className="max-w-[1200px] mx-auto">

          {/* Header */}
          <AnimatedSection className="text-center mb-16">
            <span className="inline-block bg-[#DBEAFE] text-[#2563EB] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              About Us
            </span>
            <h2 className="text-[40px] font-bold text-[#0F172A] leading-tight mb-4">
              Built for the world's research community
            </h2>
            <p className="text-[#475569] text-[17px] max-w-[600px] mx-auto leading-relaxed">
              We're building the platform researchers always wished existed — open, collaborative, and built around science.
            </p>
          </AnimatedSection>

          {/* Two-col: mission points + stats */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">

            {/* Left — mission points */}
            <AnimatedSection delay="100ms" className="[&.animate-in]:animate-fade-up">
              <div className="bg-white border border-[#E2E8F0] rounded-2xl p-8 h-full">
                <h3 className="text-[20px] font-bold text-[#0F172A] mb-6">What drives us</h3>
                <div className="space-y-5">
                  {[
                    { icon: BookOpen, color: 'bg-[#DBEAFE]', tc: 'text-[#2563EB]', title: 'Our Mission', desc: 'To make academic research more discoverable, collaborative, and impactful — for every researcher, at every institution worldwide.' },
                    { icon: Globe, color: 'bg-[#DCFCE7]', tc: 'text-[#22C55E]', title: 'Global by Design', desc: 'Researchers from 180+ countries — including IIT Bombay, IISc, AIIMS, MIT, Oxford, and ETH Zurich — use ResearchConnect every day.' },
                    { icon: ShieldCheck, color: 'bg-[#EDE9FE]', tc: 'text-[#4F46E5]', title: 'Open & Trustworthy', desc: 'All preprints are freely accessible. Researcher data is never sold. We are and always will be a privacy-first platform.' },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4 items-start">
                      <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center shrink-0 mt-0.5`}>
                        <item.icon className={`w-5 h-5 ${item.tc}`} />
                      </div>
                      <div>
                        <div className="font-bold text-[#0F172A] text-[15px] mb-1">{item.title}</div>
                        <p className="text-[#475569] text-[14px] leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>

            {/* Right — stats grid */}
            <AnimatedSection delay="200ms" className="[&.animate-in]:animate-fade-up">
              <div className="grid grid-cols-2 gap-4 h-full">
                {[
                  { icon: Users, color: 'bg-[#DBEAFE]', tc: 'text-[#2563EB]', val: platformStats ? `${(platformStats.researchers/1000).toFixed(1)}k+` : '50,000+', label: 'Active Researchers', sub: 'from 180+ countries' },
                  { icon: BookOpen, color: 'bg-[#DCFCE7]', tc: 'text-[#22C55E]', val: platformStats ? `${(platformStats.publications/1000000).toFixed(1)}M+` : '2.4M+', label: 'Publications Indexed', sub: 'across all fields' },
                  { icon: TrendingUp, color: 'bg-[#EDE9FE]', tc: 'text-[#4F46E5]', val: '98.9%', label: 'Platform Uptime', sub: 'always available' },
                  { icon: Globe, color: 'bg-[#FEF3C7]', tc: 'text-[#F59E0B]', val: platformStats ? `${platformStats.countries}+` : '180+', label: 'Countries', sub: 'global reach' },
                ].map((s, i) => (
                  <div key={i} className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col gap-3 hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(37,99,235,0.10)] transition-all">
                    <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center`}>
                      <s.icon className={`w-5 h-5 ${s.tc}`} />
                    </div>
                    <div>
                      <div className="text-[26px] font-black text-[#0F172A] leading-tight">{s.val}</div>
                      <div className="text-[13px] font-semibold text-[#0F172A]">{s.label}</div>
                      <div className="text-[11px] text-[#94A3B8]">{s.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            </AnimatedSection>
          </div>

          {/* Values Cards — match feature card style exactly */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: BookOpen, color: 'bg-[#DBEAFE]', tc: 'text-[#2563EB]', title: 'Science First', desc: 'Every feature is designed with researchers in mind. We talk to scientists, not just engineers, before building anything.' },
              { icon: Users, color: 'bg-[#DCFCE7]', tc: 'text-[#22C55E]', title: 'Community Driven', desc: 'Our roadmap is shaped by the research community. Top-requested features get built next — always.' },
              { icon: ShieldCheck, color: 'bg-[#EDE9FE]', tc: 'text-[#4F46E5]', title: 'Open Access', desc: 'Preprints are free, data is portable, and we never lock your research behind a paywall — ever.' },
            ].map((v, i) => (
              <AnimatedSection key={i} delay={`${i * 150}ms`} className="[&.animate-in]:animate-stagger-fade">
                <div className="group bg-white border border-[#E2E8F0] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#BFDBFE] hover:shadow-[0_16px_48px_rgba(37,99,235,0.12)] h-full flex items-start gap-5 text-left">
                  <div className={`w-[52px] h-[52px] rounded-xl ${v.color} flex items-center justify-center shrink-0`}>
                    <v.icon className={`w-6 h-6 ${v.tc}`} />
                  </div>
                  <div>
                    <h3 className="text-[18px] font-bold text-[#0F172A] mb-2">{v.title}</h3>
                    <p className="text-[#475569] text-[15px] leading-relaxed">{v.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>

        </div>
      </section>

      {/* SECTION 10 — CTA BANNER */}
      <section className="relative w-full bg-gradient-to-br from-[#2563EB] to-[#4F46E5] py-24 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-white/5 rounded-full animate-blob-move" />
        <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-white/5 rounded-full animate-blob-move" style={{ animationDelay: '2s' }} />

        <div className="relative z-10 max-w-[800px] mx-auto px-4 text-center">
          <AnimatedSection className="[&.animate-in]:animate-fade-up">
            <h2 className="text-[40px] md:text-[48px] font-bold text-white mb-6 leading-tight">
              Ready to advance your research?
            </h2>
            <p className="text-white/80 text-[18px] mb-10 max-w-[600px] mx-auto">
              Join 50,000+ researchers who have already published, connected, and grown their impact.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link to="/register" className="bg-white text-[#2563EB] font-bold px-10 py-4 rounded-xl hover:bg-[#F8FAFC] hover:-translate-y-1 transition-transform shadow-xl shadow-blue-900/20 text-center">
                Start Free Today
              </Link>
            </div>

            <div className="flex flex-col md:flex-row justify-center items-center gap-6 text-white/70 text-[14px]">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" /> No credit card required
              </div>
              <div className="hidden md:block w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5" /> Free forever plan
              </div>
              <div className="hidden md:block w-1 h-1 rounded-full bg-white/30" />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" /> 50k+ researchers
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* SECTION 10 — FOOTER */}
      <footer className="bg-[#0F172A] relative overflow-hidden">
        {/* Subtle gradient top accent */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#2563EB]/40 to-transparent" />

        {/* Decorative background glow */}
        <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-[#2563EB]/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-[#4F46E5]/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-[1200px] mx-auto px-6 pt-16 pb-8">
          {/* Top section: Brand + Newsletter */}
          <div className="flex flex-col lg:flex-row justify-between gap-10 mb-14">
            {/* Brand column */}
            <div className="max-w-sm">
              <Link to="/" className="flex items-center gap-3 mb-5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563EB] to-[#4F46E5] flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
                  <GraduationCap className="w-5.5 h-5.5 text-white" />
                </div>
                <span className="text-[20px] font-black text-white tracking-tight">
                  Research<span className="text-[#60A5FA]">Connect</span>
                </span>
              </Link>
              <p className="text-[#94A3B8] text-[14px] leading-relaxed mb-6">
                The next-generation AI-driven academic collaboration and discovery network. Empowering researchers worldwide to connect, share, and accelerate global innovation.
              </p>
              {/* Social icons with proper SVG icons */}
              <div className="flex gap-3">
                <a href="https://twitter.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#2563EB]/20 hover:border-[#2563EB]/30 transition-all duration-200 group" aria-label="Twitter">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-[#0A66C2]/20 hover:border-[#0A66C2]/30 transition-all duration-200 group" aria-label="LinkedIn">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noreferrer" className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200 group" aria-label="GitHub">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" /></svg>
                </a>
              </div>
            </div>

            {/* Newsletter */}
            <div className="max-w-md w-full lg:w-auto">
              <h4 className="text-white font-bold text-[14px] mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#60A5FA]" />
                Stay Updated
              </h4>
              <p className="text-[#94A3B8] text-[13px] mb-4 leading-relaxed">
                Get the latest research insights, platform updates, and collaboration opportunities delivered to your inbox.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-[13px] text-white placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/50 focus:border-[#2563EB]/50 transition-all"
                />
                <button
                  onClick={() => toast.success('Subscribed successfully!')}
                  className="bg-gradient-to-r from-[#2563EB] to-[#4F46E5] hover:from-[#1D4ED8] hover:to-[#4338CA] text-white font-bold text-[13px] px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 active:scale-95 whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
              <p className="text-[11px] text-[#475569] mt-2.5">
                No spam, ever. Unsubscribe anytime.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-10" />

          {/* Link columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Platform */}
            <div>
              <h4 className="text-white font-bold text-[13px] uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                Platform
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Features', to: '#features' },
                  { label: 'Publications', to: '/register' },
                  { label: 'Citations', to: '/register' },
                  { label: 'Analytics Dashboard', to: '/register' },
                  { label: 'Messaging', to: '/register' },
                  { label: 'Developer API', to: '/register' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[#94A3B8] text-[13px] hover:text-white hover:pl-1 transition-all duration-200 inline-flex items-center gap-1.5"
                    >
                      <span className="text-[#475569] group-hover:text-[#2563EB] transition-colors">›</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Research */}
            <div>
              <h4 className="text-white font-bold text-[13px] uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                Research
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Discover Papers', to: '/search' },
                  { label: 'Top Researchers', to: '/discover/researchers' },
                  { label: 'Trending Topics', to: '/trending' },
                  { label: 'Open Access', to: '/register' },
                  { label: 'Journals & Preprints', to: '/register' },
                  { label: 'Datasets', to: '/register' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[#94A3B8] text-[13px] hover:text-white hover:pl-1 transition-all duration-200 inline-flex items-center gap-1.5"
                    >
                      <span className="text-[#475569] group-hover:text-[#22C55E] transition-colors">›</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h4 className="text-white font-bold text-[13px] uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4F46E5]" />
                Community
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'Network', to: '/network' },
                  { label: 'Collaborations', to: '/collaborations' },
                  { label: 'Events & Conferences', to: '/register' },
                  { label: 'Funding Opportunities', to: '/register' },
                  { label: 'Jobs Board', to: '/register' },
                  { label: 'Help Center', to: '/register' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[#94A3B8] text-[13px] hover:text-white hover:pl-1 transition-all duration-200 inline-flex items-center gap-1.5"
                    >
                      <span className="text-[#475569] group-hover:text-[#4F46E5] transition-colors">›</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-bold text-[13px] uppercase tracking-wider mb-5 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                Company
              </h4>
              <ul className="space-y-3">
                {[
                  { label: 'About Us', to: '/about' },
                  { label: 'Blog', to: '/about' },
                  { label: 'Careers', to: '/about' },
                  { label: 'Press Kit', to: '/about' },
                  { label: 'Privacy Policy', to: '/privacy' },
                  { label: 'Terms of Service', to: '/terms' },
                ].map(l => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[#94A3B8] text-[13px] hover:text-white hover:pl-1 transition-all duration-200 inline-flex items-center gap-1.5"
                    >
                      <span className="text-[#475569] group-hover:text-[#F59E0B] transition-colors">›</span>
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-14 pt-8 border-t border-white/8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-[12px] text-[#64748B]">
              <span>© {new Date().getFullYear()} ResearchConnect. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
                All systems operational
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[12px] text-[#64748B]">
              <span>Made with</span>
              <span className="text-[#EF4444]">♥</span>
              <span>for researchers, by researchers</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Home;
