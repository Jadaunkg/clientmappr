import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Search,
  Rocket,
  MapPin,
  BadgeCheck,
  Users,
  Briefcase,
  Code2,
  Building2,
  TrendingUp,
  Filter,
  Download,
  DollarSign,
  ArrowRight,
  Globe,
  Phone,
  Star,
  Clock,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const SupercutsDemo = () => (
  <div className="bg-slate-900 rounded-xl border border-slate-700 shadow-2xl overflow-hidden scale-[0.9] origin-top-left md:scale-100 transition-all duration-500 hover:shadow-cyan-500/20">
    <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
      <div>
        <h3 className="text-white font-bold text-lg">SUPERCUTS</h3>
        <p className="text-slate-400 text-sm">Hair Salon</p>
      </div>
      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-2 py-1 rounded-full border border-emerald-500/30">
        Operational
      </span>
    </div>
    <div className="p-4 space-y-3">
      <div className="flex gap-2 items-start text-sm">
        <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <span className="text-slate-300">502 N 325 E, Ogden, UT 84404</span>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <Database className="w-4 h-4 text-blue-400 shrink-0" />
        <span className="text-slate-300">Category: <span className="text-white font-medium">hair_salon</span></span>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <Phone className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-slate-300">+1 801-782-9238</span>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <Globe className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="text-blue-400 underline truncate">www.supercuts.com/locations/...</span>
      </div>
      <div className="flex gap-2 items-center text-sm">
        <Star className="w-4 h-4 text-amber-400 shrink-0 fill-amber-400" />
        <span className="text-amber-400 font-bold">4.7</span>
        <span className="text-slate-400 text-xs">(723 reviews)</span>
      </div>
      <div className="flex gap-2 items-start text-sm">
        <Clock className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
        <div className="text-slate-300">
          <p>Mon - Sat: 10:00 AM – 6:00 PM</p>
          <p className="text-slate-500">Sunday: Closed</p>
        </div>
      </div>
      <div className="pt-3 flex flex-wrap gap-1.5">
        {['hair salon', 'barber shop', 'beauty salon', 'service'].map(tag => (
          <span key={tag} className="text-[10px] uppercase tracking-wider bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
            {tag}
          </span>
        ))}
      </div>
    </div>
  </div>
);

const FilterDemo = () => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden scale-[0.9] origin-top md:scale-100">
    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-blue-600" />
        <h3 className="text-slate-900 font-bold">Advanced Filters</h3>
      </div>
      <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">120 leads</span>
    </div>
    <div className="p-4 grid grid-cols-2 gap-3 text-sm">
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-1">City</p>
        <div className="border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-700">All Cities</div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-1">State</p>
        <div className="border border-blue-400 ring-1 ring-blue-400 rounded px-2 py-1.5 bg-white text-slate-900 font-medium">TX</div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-1">Category</p>
        <div className="border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-700">All Categories</div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-1">Has Website</p>
        <div className="border border-slate-200 rounded px-2 py-1.5 bg-slate-50 text-slate-700">No</div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-1">Min Rating</p>
        <div className="border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-900">0</div>
      </div>
      <div>
        <p className="text-xs text-slate-500 font-semibold mb-1">Max Rating</p>
        <div className="border border-slate-200 rounded px-2 py-1.5 bg-white text-slate-900">5</div>
      </div>
    </div>
    <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex justify-end gap-2">
      <div className="text-slate-500 px-3 py-1.5 text-sm font-medium">Clear</div>
      <div className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-sm">Apply Filters</div>
    </div>
  </div>
);

export function HomePage() {
  const { state } = useAuth();
  const { user } = state;

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans selection:bg-cyan-500/30">

      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20">
              C
            </div>
            <span className="text-white font-bold text-lg tracking-tight">ClientMapr</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                to="/dashboard"
                className="px-5 py-2 rounded-full bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors">
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-5 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
                >
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* HERO SECTION - 3D Aesthetic */}
        <section className="relative pt-20 pb-32 overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px] mix-blend-screen pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-600/20 rounded-full blur-[150px] mix-blend-screen pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">

            {/* Left Copy */}
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-6">
                <Rocket className="w-3.5 h-3.5" />
                The Ultimate B2B Prospecting Engine
              </div>
              <h1 className="text-5xl sm:text-6xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
                Find Local Leads. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500">
                  Filter by Data.
                </span><br />
                Close More Deals.
              </h1>
              <p className="text-lg text-slate-400 mb-8 leading-relaxed">
                Stop scraping messy directories. ClientMapr extracts rich, structured data from Google Maps instantly. Filter by ratings, operational status, website presence, and export directly to your CRM.
              </p>

              <div className="flex flex-wrap gap-4">
                {user ? (
                  <Link to="/dashboard" className="px-8 py-3.5 rounded-full bg-white text-slate-900 font-bold hover:bg-slate-100 transition-colors shadow-xl shadow-white/10 flex items-center gap-2">
                    Go to Dashboard <ArrowRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link to="/signup" className="px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-all hover:scale-105 shadow-xl shadow-cyan-500/25 flex items-center gap-2">
                    Start Free Discovery <ArrowRight className="w-4 h-4" />
                  </Link>
                )}
                <a href="#roi" className="px-8 py-3.5 rounded-full border border-slate-700 bg-slate-800/50 text-white font-semibold hover:bg-slate-800 transition-colors hover:border-slate-600 backdrop-blur-sm">
                  See the ROI Math
                </a>
              </div>
            </div>

            {/* Right 3D Visual */}
            <div className="relative h-[500px] w-full perspective-[1000px] hidden lg:block">
              <div className="absolute inset-0 transform rotate-y-[-15deg] rotate-x-[5deg] translate-z-10 transition-transform duration-700 hover:rotate-y-0 hover:rotate-x-0">
                <div className="absolute top-10 right-10 z-20 w-80 transform -translate-y-4 shadow-2xl shadow-cyan-900/50 rounded-xl">
                  <SupercutsDemo />
                </div>
                <div className="absolute bottom-10 left-0 z-30 w-72 transform translate-y-8 translate-x-12 shadow-2xl shadow-blue-900/50 rounded-xl">
                  <FilterDemo />
                </div>
                {/* Decorative floating CRM export element */}
                <div className="absolute top-1/2 left-20 z-10 bg-slate-800/80 backdrop-blur-md border border-slate-600 rounded-lg p-3 flex items-center gap-3 shadow-xl transform -translate-y-1/2 -rotate-6 animate-pulse">
                  <div className="bg-emerald-500/20 p-2 rounded">
                    <Download className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-white text-sm font-bold">120 Leads Exported</p>
                    <p className="text-slate-400 text-xs">leads_plumber_tx.csv</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ROI SCENARIO SECTION */}
        <section id="roi" className="py-24 bg-[#0F1523] border-y border-white/5 relative overflow-hidden">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">The Math Makes Sense.</h2>
              <p className="text-lg text-slate-400">
                Why pay for data? Because it pays for itself. Here is a real-world scenario of how agencies and freelancers use ClientMapr to secure high-ticket deals quickly.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-6 relative">
              {/* Connecting line for desktop */}
              <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-slate-800 via-cyan-500/50 to-slate-800 -translate-y-1/2 z-0" />

              {[
                {
                  step: '01',
                  metric: '100 Leads',
                  title: 'Run Discovery',
                  desc: 'Search for niches like "Plumbers in Austin" and get 100 fresh, structured Google Maps results in seconds.',
                  icon: Search,
                  color: 'text-blue-400',
                  bg: 'bg-blue-500/10',
                  border: 'border-blue-500/20'
                },
                {
                  step: '02',
                  metric: '10 Prospects',
                  title: 'Filter "No Website"',
                  desc: 'Use Advanced Filters to instantly isolate the 8-10 businesses that have no website and are operational.',
                  icon: Filter,
                  color: 'text-cyan-400',
                  bg: 'bg-cyan-500/10',
                  border: 'border-cyan-500/20'
                },
                {
                  step: '03',
                  metric: '1-2 Deals',
                  title: 'Pitch & Close',
                  desc: 'Export the filtered list to CSV/Excel, load it into your CRM, and send highly targeted outreach pitches.',
                  icon: Users,
                  color: 'text-indigo-400',
                  bg: 'bg-indigo-500/10',
                  border: 'border-indigo-500/20'
                },
                {
                  step: '04',
                  metric: '$1,500+',
                  title: 'Massive ROI',
                  desc: 'Close just one website design deal or SEO retainer and your monthly ClientMapr subscription pays for itself 50x over.',
                  icon: DollarSign,
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-500/10',
                  border: 'border-emerald-500/20'
                }
              ].map((item, i) => (
                <div key={i} className="relative z-10 bg-[#151C2C] border border-slate-700/50 rounded-2xl p-6 text-center hover:-translate-y-2 transition-transform duration-300 shadow-xl shadow-black/20 group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 font-black text-6xl text-white pointer-events-none group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>
                  <div className={`w-14 h-14 mx-auto rounded-xl flex items-center justify-center mb-4 border ${item.bg} ${item.border}`}>
                    <item.icon className={`w-6 h-6 ${item.color}`} />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${item.color}`}>{item.metric}</h3>
                  <h4 className="text-white font-semibold text-lg mb-2">{item.title}</h4>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES GRID */}
        <section className="py-24 relative">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-16 items-center mb-24">
              <div>
                <h2 className="text-3xl font-bold text-white mb-4">Not Just Names. <br /><span className="text-cyan-400">Actionable Data.</span></h2>
                <p className="text-slate-400 text-lg mb-6">
                  We don't just give you a list of names. ClientMapr extracts deep data from places to help you qualify leads before you ever send an email.
                </p>
                <ul className="space-y-4">
                  {[
                    ['Phone & International Formatting', 'Call straight from your CRM with properly formatted numbers.'],
                    ['Google Ratings & Review Counts', 'Target highly-rated businesses that lack a modern web presence.'],
                    ['Business Status', 'Filter out permanently or temporarily closed businesses instantly.'],
                    ['Opening Hours', 'Know exactly when they are open so you can time your cold calls perfectly.'],
                  ].map(([title, desc], i) => (
                    <li key={i} className="flex gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-white block">{title}</strong>
                        <span className="text-slate-400 text-sm">{desc}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="lg:pl-10">
                <SupercutsDemo />
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 lg:pr-10 relative">
                {/* Visual Export flowing to CRM */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-2xl" />
                <div className="relative z-10 flex flex-col items-center">
                  <FilterDemo />
                  <div className="h-12 w-px bg-gradient-to-b from-slate-400 to-emerald-400 my-4" />
                  <div className="bg-[#151C2C] border border-emerald-500/30 p-4 rounded-xl flex items-center gap-4 shadow-xl shadow-emerald-900/20 w-full max-w-sm">
                    <div className="bg-emerald-500/20 p-3 rounded-lg">
                      <Download className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold">Export Ready</h4>
                      <p className="text-slate-400 text-sm">Download to CSV or Excel for your CRM.</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-bold text-white mb-4">Advanced Filters & <br /><span className="text-indigo-400">Unlimited Exports</span></h2>
                <p className="text-slate-400 text-lg mb-6">
                  Don't waste time scrolling. Use our Advanced Filters to instantly isolate the exact parameters you need.
                </p>
                <div className="bg-[#151C2C] border border-slate-700 p-6 rounded-2xl space-y-4">
                  <p className="flex items-center gap-3 text-slate-300">
                    <MapPin className="w-5 h-5 text-cyan-400" /> Dynamic City & Category Dropdowns
                  </p>
                  <p className="flex items-center gap-3 text-slate-300">
                    <Globe className="w-5 h-5 text-indigo-400" /> Detect 'Missing' or 'Social Only' Websites
                  </p>
                  <p className="flex items-center gap-3 text-slate-300">
                    <Star className="w-5 h-5 text-amber-400" /> Filter by Min/Max Google Rating
                  </p>
                  <div className="pt-4 mt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400">
                      Once filtered, export your exact list as a beautifully formatted CSV or Excel file, complete with dynamic filenames based on your filters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="py-24 bg-[#0F1523] border-t border-white/5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Simple, Scalable Pricing</h2>
              <p className="text-lg text-slate-400">
                Cancel anytime. Upgrade when you need more leads.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">

              {/* Starter */}
              <div className="bg-[#151C2C] border border-slate-700 rounded-2xl p-8 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">For solo freelancers and early outreach.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">$39</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Daily lead discovery limits</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> Advanced data filters</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> CSV / Excel Exports</li>
                </ul>
                <Link to="/signup" className="block w-full text-center py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors mt-auto">
                  Start with Starter
                </Link>
              </div>

              {/* Professional */}
              <div className="bg-gradient-to-b from-slate-800 to-[#151C2C] border border-cyan-500/50 rounded-2xl p-8 flex flex-col relative transform md:-translate-y-4 shadow-2xl shadow-cyan-900/20">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Most Popular
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Professional</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">For agencies running outbound every day.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">$79</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Higher discovery limits</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Faster lead processing</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Priority Support</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> All Starter Features</li>
                </ul>
                <Link to="/signup" className="block w-full text-center py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold hover:from-cyan-400 hover:to-blue-500 transition-colors shadow-lg shadow-cyan-500/25 mt-auto">
                  Start Professional
                </Link>
              </div>

              {/* Enterprise */}
              <div className="bg-[#151C2C] border border-slate-700 rounded-2xl p-8 flex flex-col">
                <h3 className="text-xl font-bold text-white mb-2">Growth</h3>
                <p className="text-slate-400 text-sm mb-6 flex-grow">For high-volume prospecting teams.</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">$149</span>
                  <span className="text-slate-500">/mo</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm text-slate-300">
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Maximum daily limits</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Bulk CRM Exports</li>
                  <li className="flex items-center gap-3"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Dedicated Account Manager</li>
                </ul>
                <Link to="/signup" className="block w-full text-center py-3 rounded-xl bg-slate-800 text-white font-bold hover:bg-slate-700 transition-colors mt-auto">
                  Start Growth
                </Link>
              </div>

            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-slate-800 bg-[#070A11] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs">C</div>
            <span className="text-slate-400 font-semibold text-sm">ClientMapr</span>
          </div>
          <p className="text-sm text-slate-500">© 2026 ClientMapr. Built for outbound growth.</p>
          <div className="flex gap-4 text-sm text-slate-500">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;