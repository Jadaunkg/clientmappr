import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, User, Settings, Target, BarChart2, Zap, Globe, TrendingUp, BookOpen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyStats } from '../services/leadsService';

function StatCard({ label, value, note, icon: Icon, loading, accent }) {
  const accentColor = {
    blue: 'text-blue-600 bg-blue-50',
    green: 'text-green-600 bg-green-50',
    amber: 'text-amber-600 bg-amber-50',
    indigo: 'text-indigo-600 bg-indigo-50',
  }[accent] || 'text-slate-400 bg-slate-50';

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <span className={`rounded-lg p-2 ${accentColor}`}>
            <Icon className="w-4 h-4" />
          </span>
        )}
      </div>
      <p className="mt-2 text-3xl font-bold text-slate-900">
        {loading ? (
          <span className="inline-block h-8 w-16 animate-pulse rounded bg-slate-200" />
        ) : (
          value
        )}
      </p>
      <p className="mt-1 text-xs text-slate-500">{note}</p>
    </div>
  );
}

export function Dashboard() {
  const { state } = useAuth();
  const userName = state.user?.full_name || state.user?.fullName || 'there';
  const userTier = state.user?.subscription_tier || state.user?.subscriptionTier || 'free_trial';

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setStatsLoading(true);

    getMyStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStats({ totalRuns: 0, todayRuns: 0, totalLeads: 0, leadsNoWebsite: 0 });
        }
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const tierLabel = {
    free_trial: 'Free Trial',
    starter: 'Starter',
    professional: 'Professional',
    enterprise: 'Enterprise',
  }[userTier] || userTier;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Welcome back, {userName}</h2>
        <p className="mt-2 text-slate-600">
          Your account is active on <span className="font-semibold text-slate-900">{tierLabel}</span>.{' '}
          Each discovery run fetches up to <strong>60 leads</strong> from Google Maps.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Leads in Account"
          value={stats?.totalLeads ?? 0}
          note="Saved leads across all your discovery runs"
          icon={TrendingUp}
          accent="blue"
          loading={statsLoading}
        />
        <StatCard
          label="No-Website Leads"
          value={stats?.leadsNoWebsite ?? 0}
          note="Businesses you can pitch a site to"
          icon={Globe}
          accent="green"
          loading={statsLoading}
        />
        <StatCard
          label="Discovery Runs Today"
          value={stats?.todayRuns ?? 0}
          note="Google Maps searches today"
          icon={Zap}
          accent="amber"
          loading={statsLoading}
        />
        <StatCard
          label="Total Discovery Runs"
          value={stats?.totalRuns ?? 0}
          note="Total searches you've ever run"
          icon={BarChart2}
          accent="indigo"
          loading={statsLoading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Link
          to="/search"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-blue-50 p-2">
              <Search className="w-5 h-5 text-blue-600" />
            </span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">Discover New Leads</h3>
          <p className="mt-1 text-sm text-slate-600">Find up to 60 verified businesses per search.</p>
        </Link>

        <Link
          to="/my-leads"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-green-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-green-50 p-2">
              <BookOpen className="w-5 h-5 text-green-600" />
            </span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">My Leads</h3>
          <p className="mt-1 text-sm text-slate-600">
            Browse your <strong>{stats?.totalLeads ?? 0}</strong> saved leads and filter by city, type, or website status.
          </p>
        </Link>

        <Link
          to="/profile"
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="rounded-lg bg-slate-100 p-2">
              <User className="w-5 h-5 text-slate-600" />
            </span>
            <ArrowRight className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="mt-4 font-semibold text-slate-900">Your Profile</h3>
          <p className="mt-1 text-sm text-slate-600">Review account details, subscription, and settings.</p>
        </Link>
      </div>

      <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex items-start gap-3">
          <Target className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-slate-900">Recommended next step</h3>
            <p className="text-sm text-slate-600 mt-1">
              Search with a focused query like{' '}
              <span className="font-medium text-slate-900">Plumbers in Austin, TX</span> to quickly
              generate 60 qualified leads — then visit{' '}
              <Link to="/my-leads" className="text-blue-600 underline font-medium">My Leads</Link> to
              browse and filter them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
