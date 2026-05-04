import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronLeft, ChevronRight, Clock, Eye, ListChecks, RefreshCw, Search, SlidersHorizontal, User, ClipboardCheck, TrendingUp, CheckCircle, AlertCircle } from 'lucide-react';
import TeacherSidebar from '../../components/TeacherSidebar';
import TopNavbar from '../../components/TopNavbar';
import styles from '../../styles/shared.module.css';
import { oralPerformanceService } from '../services/oralPerformance.service';

const pageStyles = `
  @keyframes teFadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes tePulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(0.85)} }
  @keyframes teShimmer { from{background-position:-200% 0} to{background-position:200% 0} }
  @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }

  .te-root { animation: teFadeIn 0.28s cubic-bezier(0.4,0,0.2,1); }

  /* ── HERO HEADER ── */
  .te-hero {
    background: linear-gradient(135deg, #E31837 0%, #9B0000 60%, #6B0000 100%);
    border-radius: 22px;
    padding: 2rem 2.5rem;
    margin-bottom: 1.5rem;
    display: flex; align-items: center; justify-content: space-between;
    position: relative; overflow: hidden;
    box-shadow: 0 12px 40px rgba(227,24,55,0.22);
  }
  .te-hero::before {
    content: ''; position: absolute; top: -80px; right: -80px;
    width: 260px; height: 260px; border-radius: 50%;
    background: rgba(255,255,255,0.06); pointer-events: none;
  }
  .te-hero::after {
    content: ''; position: absolute; bottom: -50px; left: 30%;
    width: 180px; height: 180px; border-radius: 50%;
    background: rgba(255,255,255,0.04); pointer-events: none;
  }
  .te-hero-left { position: relative; z-index: 1; }
  .te-hero-kicker {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 0.68rem; font-weight: 700; color: rgba(255,255,255,0.7);
    text-transform: uppercase; letter-spacing: 0.12em;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.18);
    padding: 0.3rem 0.75rem; border-radius: 99px; margin-bottom: 0.6rem;
  }
  .te-hero-title {
    font-size: 1.85rem; font-weight: 800; color: #fff;
    letter-spacing: -0.03em; margin: 0 0 0.35rem; line-height: 1.15;
  }
  .te-hero-sub { color: rgba(255,255,255,0.65); font-size: 0.88rem; margin: 0; line-height: 1.5; }
  .te-hero-right { position: relative; z-index: 1; flex-shrink: 0; }
  .te-live-badge {
    display: inline-flex; align-items: center; gap: 7px;
    background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2);
    border-radius: 12px; padding: 0.6rem 1rem;
    color: rgba(255,255,255,0.9); font-size: 0.78rem; font-weight: 600;
    backdrop-filter: blur(8px);
  }
  .te-dot {
    width: 8px; height: 8px; border-radius: 50%;
    background: #4ade80; animation: tePulse 1.8s infinite;
    box-shadow: 0 0 0 3px rgba(74,222,128,0.25);
  }

  /* ── STAT CARDS ── */
  .te-stats {
    display: grid; grid-template-columns: repeat(4,1fr);
    gap: 0.85rem; margin-bottom: 1.25rem;
  }
  @media(max-width:900px){ .te-stats{grid-template-columns:repeat(2,1fr);} }
  @media(max-width:560px){ .te-stats{grid-template-columns:1fr;} }

  .te-stat {
    background: #fff; border: 1px solid #f1f5f9;
    border-radius: 18px; padding: 1.1rem 1.25rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative; overflow: hidden;
  }
  .te-stat:hover { transform:translateY(-2px); box-shadow:0 6px 24px rgba(0,0,0,0.08); }
  .te-stat-accent {
    position: absolute; top:0; left:0; right:0; height:3px;
    border-radius: 18px 18px 0 0;
  }
  .te-stat-icon {
    width: 36px; height: 36px; border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 0.75rem;
  }
  .te-stat-val {
    font-size: 1.7rem; font-weight: 800; color: #0f172a;
    letter-spacing: -0.03em; line-height: 1; margin-bottom: 0.2rem;
  }
  .te-stat-lbl {
    font-size: 0.74rem; color: #94a3b8; font-weight: 600;
    text-transform: uppercase; letter-spacing: 0.07em;
  }

  /* ── FILTERS PANEL ── */
  .te-filters {
    background: #fff; border: 1px solid #f1f5f9;
    border-radius: 18px; padding: 1.25rem 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 16px rgba(0,0,0,0.04);
  }
  .te-filter-title {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1rem;
  }
  .te-filter-title-text {
    font-size: 0.78rem; font-weight: 700; color: #374151;
    display: flex; align-items: center; gap: 6px;
  }
  .te-filter-top {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr;
    gap: 0.85rem; margin-bottom: 0.85rem;
  }
  @media(max-width:1100px){ .te-filter-top{grid-template-columns:1fr 1fr;} }
  @media(max-width:680px){ .te-filter-top{grid-template-columns:1fr;} }

  .te-filter-field { display:flex; flex-direction:column; gap:0.35rem; }
  .te-filter-label {
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.09em;
    font-weight: 700; color: #94a3b8;
  }
  .te-search-wrap { position: relative; }
  .te-search-icon {
    position: absolute; top:50%; left:0.85rem;
    transform:translateY(-50%); color:#94a3b8; pointer-events:none;
  }
  .te-input, .te-select {
    height: 42px; border-radius: 12px;
    border: 1.5px solid #e5e7eb; background: #f9fafb;
    padding: 0 0.9rem; font-size: 0.86rem; color: #0f172a;
    outline: none; width: 100%; font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
  }
  .te-input.search { padding-left: 2.4rem; }
  .te-input:focus, .te-select:focus {
    border-color: #E31837; background: #fff;
    box-shadow: 0 0 0 3px rgba(227,24,55,0.08);
  }

  .te-filter-bottom {
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.75rem; flex-wrap: wrap; padding-top: 0.85rem;
    border-top: 1px solid #f8fafc;
  }

  /* Status tabs */
  .te-status-tabs {
    display: inline-flex; gap: 4px;
    background: #f8fafc; border: 1px solid #f1f5f9;
    border-radius: 12px; padding: 4px;
  }
  .te-status-tab {
    border: none; border-radius: 9px; padding: 0.35rem 0.85rem;
    font-size: 0.78rem; font-weight: 700; cursor: pointer;
    color: #64748b; background: transparent; transition: all 0.15s;
    display: flex; align-items: center; gap: 5px;
  }
  .te-status-tab:hover { background: rgba(0,0,0,0.04); color: #374151; }
  .te-status-tab.all.active { background: #0f172a; color: #fff; }
  .te-status-tab.pending.active { background: linear-gradient(135deg,#E31837,#B71C1C); color: #fff; }
  .te-status-tab.graded.active { background: linear-gradient(135deg,#16a34a,#15803d); color: #fff; }

  /* Quick date chips */
  .te-quick-ranges { display: inline-flex; gap: 5px; flex-wrap: wrap; }
  .te-chip {
    border: 1.5px solid #e5e7eb; background: #f9fafb; color: #64748b;
    border-radius: 99px; padding: 0.3rem 0.8rem;
    font-size: 0.75rem; font-weight: 700; cursor: pointer;
    transition: all 0.15s;
  }
  .te-chip:hover { border-color: #E31837; color: #E31837; background: #fef2f4; }
  .te-chip.active { border-color: #E31837; background: rgba(227,24,55,0.08); color: #E31837; }

  .te-reset {
    height: 38px; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #f8fafc;
    padding: 0 0.9rem; font-size: 0.8rem; font-weight: 700;
    color: #64748b; cursor: pointer; display: flex; align-items: center; gap: 5px;
    transition: all 0.15s;
  }
  .te-reset:hover { border-color: #E31837; color: #E31837; background: #fef2f4; }

  .te-active-badge {
    display: inline-flex; align-items: center; gap: 5px;
    background: rgba(227,24,55,0.08); border: 1px solid rgba(227,24,55,0.15);
    color: #E31837; font-size: 0.74rem; font-weight: 700;
    padding: 0.3rem 0.7rem; border-radius: 99px;
  }

  /* Result count */
  .te-result-bar {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;
  }
  .te-result-count {
    font-size: 0.8rem; color: #64748b; font-weight: 600;
  }
  .te-result-count strong { color: #0f172a; }

  /* ── ITEM CARDS ── */
  .te-list { display: flex; flex-direction: column; gap: 0.6rem; }

  .te-item {
    background: #fff; border: 1px solid #f1f5f9;
    border-radius: 16px; padding: 1rem 1.25rem;
    display: flex; align-items: center; gap: 1rem;
    transition: all 0.2s; position: relative; overflow: hidden;
  }
  .te-item:hover {
    border-color: rgba(227,24,55,0.2);
    box-shadow: 0 4px 20px rgba(0,0,0,0.07);
    transform: translateY(-1px);
  }
  .te-item::before {
    content: ''; position: absolute; left:0; top:15%; bottom:15%;
    width: 3px; border-radius: 0 3px 3px 0;
    background: transparent; transition: background 0.2s;
  }
  .te-item:hover::before { background: linear-gradient(180deg,#E31837,#B71C1C); }

  .te-item-avatar {
    width: 46px; height: 46px; border-radius: 14px; flex-shrink: 0;
    background: linear-gradient(135deg, rgba(227,24,55,0.12), rgba(183,28,28,0.06));
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 0.88rem; color: #E31837;
  }
  .te-item-main { flex: 1; min-width: 0; }
  .te-item-top {
    display: flex; align-items: center; gap: 0.6rem;
    margin-bottom: 0.3rem; flex-wrap: wrap;
  }
  .te-topic {
    font-size: 0.92rem; font-weight: 700; color: #0f172a;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    max-width: 280px;
  }
  .te-student-tag {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.76rem; color: #64748b; font-weight: 500;
    background: #f8fafc; border: 1px solid #f1f5f9;
    padding: 0.18rem 0.6rem; border-radius: 99px;
  }
  .te-item-meta {
    display: flex; align-items: center; gap: 1rem;
    font-size: 0.74rem; color: #94a3b8; flex-wrap: wrap;
  }
  .te-meta-item { display: flex; align-items: center; gap: 4px; }

  .te-status-badge {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.72rem; font-weight: 700; border-radius: 99px; padding: 0.25rem 0.65rem;
    flex-shrink: 0;
  }
  .te-status-badge.pending {
    color: #be123c; background: #fef2f4; border: 1px solid #fecdd3;
  }
  .te-status-badge.graded {
    color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0;
  }

  .te-score-pill {
    display: inline-flex; align-items: center; gap: 4px;
    font-size: 0.78rem; font-weight: 800; color: #0f172a;
    background: #f8fafc; border: 1px solid #f1f5f9;
    border-radius: 99px; padding: 0.25rem 0.7rem; flex-shrink: 0;
  }

  .te-open-btn {
    display: inline-flex; align-items: center; gap: 6px;
    border: none; border-radius: 12px; padding: 0.6rem 1rem;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    color: #fff; font-weight: 700; font-size: 0.8rem;
    cursor: pointer; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(227,24,55,0.3);
    transition: all 0.2s;
  }
  .te-open-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(227,24,55,0.4);
  }

  /* Loading skeleton */
  .te-skeleton {
    background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);
    background-size: 200% 100%;
    animation: teShimmer 1.4s infinite;
    border-radius: 12px; height: 72px; margin-bottom: 0.6rem;
  }

  .te-empty {
    padding: 3.5rem 1.5rem; text-align: center;
    background: #fff; border: 1.5px dashed #e5e7eb;
    border-radius: 18px;
  }
  .te-empty-icon {
    width: 64px; height: 64px; border-radius: 18px;
    background: rgba(227,24,55,0.06); color: #E31837;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 1rem;
  }
  .te-empty-title { font-size: 1rem; font-weight: 700; color: #0f172a; margin-bottom: 0.4rem; }
  .te-empty-sub { font-size: 0.85rem; color: #94a3b8; }

  /* ── PAGINATION ── */
  .te-pagination-wrap {
    margin-top: 1.25rem; padding: 1rem 1.25rem;
    background: #fff; border: 1px solid #f1f5f9; border-radius: 16px;
    display: flex; align-items: center; justify-content: space-between;
    gap: 0.75rem; flex-wrap: wrap;
    box-shadow: 0 2px 10px rgba(0,0,0,0.03);
  }
  .te-pagination-meta {
    display: inline-flex; align-items: center; gap: 0.6rem;
    font-size: 0.78rem; color: #64748b; font-weight: 600;
  }
  .te-pagination-select {
    height: 34px; border-radius: 9px; border: 1.5px solid #e5e7eb;
    background: #f9fafb; padding: 0 0.6rem; font-size: 0.78rem;
    color: #0f172a; outline: none; cursor: pointer; font-family: inherit;
  }
  .te-pagination-select:focus { border-color: #E31837; box-shadow: 0 0 0 3px rgba(227,24,55,0.08); }
  .te-pagination { display: inline-flex; align-items: center; gap: 4px; flex-wrap: wrap; }
  .te-page-btn {
    min-width: 36px; height: 36px; border-radius: 10px;
    border: 1.5px solid #e5e7eb; background: #fff;
    color: #374151; font-size: 0.8rem; font-weight: 700;
    display: inline-flex; align-items: center; justify-content: center; gap: 3px;
    cursor: pointer; padding: 0 0.5rem; transition: all 0.15s;
  }
  .te-page-btn:hover:not(:disabled):not(.active) {
    border-color: #E31837; color: #E31837; background: #fef2f4;
  }
  .te-page-btn.active {
    background: linear-gradient(135deg,#E31837,#B71C1C);
    color: #fff; border-color: transparent;
    box-shadow: 0 3px 10px rgba(227,24,55,0.3);
  }
  .te-page-btn:disabled { opacity:0.4; cursor:not-allowed; }
  .te-page-ellipsis { color:#94a3b8; font-size:0.85rem; padding:0 0.2rem; }
`;

function formatDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleString(); } catch { return '—'; }
}

function formatShortDate(value) {
  if (!value) return '—';
  try { return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return '—'; }
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

function normalizeScore(raw) {
  if (raw == null || isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function isProfileLookupable(id) {
  if (!id) return false;
  const value = String(id).trim();
  if (!value) return false;
  if (value.includes('@')) return true;
  return /^[a-fA-F0-9]{24}$/.test(value);
}

export default function TeacherEvaluations() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [quickRange, setQuickRange] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const currentUser = useMemo(() => {
    try { const raw = localStorage.getItem('user'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  useEffect(() => {
    let active = true;
    let timerId;
    const load = async () => {
      const instructorId = currentUser?.id;
      if (!instructorId) { setLoading(false); return; }
      try {
        if (active && items.length === 0) setLoading(true);
        const performances = await oralPerformanceService.getInstructorPerformances(instructorId);
        const sorted = [...(performances || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        if (!active) return;
        setItems(sorted);
        setLastSync(new Date());
        const ids = Array.from(new Set(sorted.map(p => p.studentId).filter(Boolean)));
        const missing = ids.filter(id => !profiles[id] && isProfileLookupable(id));
        if (missing.length > 0) {
          const rows = await Promise.all(missing.map(async id => {
            try { const raw = await oralPerformanceService.getUserProfile(id); const profile = raw && typeof raw === 'object' && raw.data ? raw.data : raw; return [id, profile]; }
            catch { return [id, null]; }
          }));
          if (!active) return;
          const next = {};
          for (const [id, profile] of rows) { if (profile) next[id] = profile; }
          setProfiles(prev => ({ ...prev, ...next }));
        }
      } finally { if (active) setLoading(false); }
    };
    load();
    timerId = window.setInterval(load, 8000);
    return () => { active = false; if (timerId) window.clearInterval(timerId); };
  }, [currentUser?.id]);

  const filteredItems = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;
    return items.filter(item => {
      const p = profiles[item.studentId];
      const full = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '';
      const studentName = (full || p?.email || item.studentId || '').toLowerCase();
      const topic = String(item.title || '').toLowerCase();
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (query && !studentName.includes(query) && !topic.includes(query)) return false;
      const created = new Date(item.createdAt).getTime();
      if (fromTime != null && created < fromTime) return false;
      if (toTime != null && created > toTime) return false;
      return true;
    });
  }, [items, profiles, searchText, statusFilter, fromDate, toDate]);

  const activeFilters = useMemo(() => {
    let count = 0;
    if (searchText.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [searchText, statusFilter, fromDate, toDate]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredItems.length / pageSize)), [filteredItems.length, pageSize]);
  const pagedItems = useMemo(() => { const start = (currentPage - 1) * pageSize; return filteredItems.slice(start, start + pageSize); }, [filteredItems, currentPage, pageSize]);

  const paginationWindow = useMemo(() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    if (start > 2) pages.push('left-ellipsis');
    for (let i = start; i <= end; i++) pages.push(i);
    if (end < totalPages - 1) pages.push('right-ellipsis');
    pages.push(totalPages);
    return pages;
  }, [currentPage, totalPages]);

  useEffect(() => { setCurrentPage(1); }, [searchText, statusFilter, fromDate, toDate, quickRange, pageSize]);
  useEffect(() => { setCurrentPage(prev => Math.min(prev, totalPages)); }, [totalPages]);

  const applyQuickRange = (range) => {
    setQuickRange(range);
    if (range === 'all') { setFromDate(''); setToDate(''); return; }
    const now = new Date();
    const to = now.toISOString().slice(0, 10);
    let from = to;
    if (range === '7d') { const d = new Date(now); d.setDate(d.getDate() - 6); from = d.toISOString().slice(0, 10); }
    if (range === '30d') { const d = new Date(now); d.setDate(d.getDate() - 29); from = d.toISOString().slice(0, 10); }
    setFromDate(from); setToDate(to);
  };

  const resetFilters = () => { setSearchText(''); setStatusFilter('all'); setFromDate(''); setToDate(''); setQuickRange('all'); setCurrentPage(1); };

  const stats = useMemo(() => ({
    total: items.length,
    graded: items.filter(i => i.status === 'graded').length,
    pending: items.filter(i => i.status !== 'graded').length,
    filtered: filteredItems.length,
  }), [items, filteredItems]);

  const firstIdx = filteredItems.length === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastIdx = Math.min(currentPage * pageSize, filteredItems.length);

  return (
    <div className={styles.layout || 'layout'}>
      <style>{pageStyles}</style>
      <TeacherSidebar />
      <div className={styles.mainContent || 'main-content'}>
        <TopNavbar />
        <main className={styles.content || 'content'}>
          <div className="te-root">

            {/* ── HERO ── */}
            <div className="te-hero">
              <div className="te-hero-left">
                <div className="te-hero-kicker">
                  <ClipboardCheck size={12} /> Evaluation Manager
                </div>
                <h1 className="te-hero-title">All Evaluations</h1>
                <p className="te-hero-sub">Detailed list of your evaluation sessions with live registration updates.</p>
              </div>
              <div className="te-hero-right">
                <div className="te-live-badge">
                  <span className="te-dot" />
                  Live sync
                  <RefreshCw size={13} style={{ animation: loading ? 'spin 1.2s linear infinite' : 'none', opacity: loading ? 1 : 0.7 }} />
                  {lastSync ? new Date(lastSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                </div>
              </div>
            </div>

            {/* ── STATS ── */}
            <div className="te-stats">
              {[
                { label: 'Total Sessions', value: stats.total, accent: '#E31837', iconBg: 'rgba(227,24,55,0.08)', iconColor: '#E31837', icon: <ClipboardCheck size={17} /> },
                { label: 'Graded', value: stats.graded, accent: '#22c55e', iconBg: 'rgba(34,197,94,0.08)', iconColor: '#22c55e', icon: <CheckCircle size={17} /> },
                { label: 'Pending Review', value: stats.pending, accent: '#f59e0b', iconBg: 'rgba(245,158,11,0.08)', iconColor: '#f59e0b', icon: <AlertCircle size={17} /> },
                { label: 'Filtered Results', value: stats.filtered, accent: '#3b82f6', iconBg: 'rgba(59,130,246,0.08)', iconColor: '#3b82f6', icon: <TrendingUp size={17} /> },
              ].map(({ label, value, accent, iconBg, iconColor, icon }) => (
                <div className="te-stat" key={label}>
                  <div className="te-stat-accent" style={{ background: `linear-gradient(90deg,${accent},${accent}88)` }} />
                  <div className="te-stat-icon" style={{ background: iconBg, color: iconColor }}>{icon}</div>
                  <div className="te-stat-val">{value}</div>
                  <div className="te-stat-lbl">{label}</div>
                </div>
              ))}
            </div>

            {/* ── FILTERS ── */}
            <div className="te-filters">
              <div className="te-filter-title">
                <div className="te-filter-title-text">
                  <SlidersHorizontal size={14} /> Filters & Search
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
                  {activeFilters > 0 && (
                    <div className="te-active-badge">
                      {activeFilters} active
                    </div>
                  )}
                  <button className="te-reset" onClick={resetFilters}>
                    <RefreshCw size={12} /> Reset
                  </button>
                </div>
              </div>

              <div className="te-filter-top">
                <div className="te-filter-field">
                  <label className="te-filter-label">Search</label>
                  <div className="te-search-wrap">
                    <Search size={15} className="te-search-icon" />
                    <input className="te-input search" placeholder="Student name or topic…" value={searchText} onChange={e => setSearchText(e.target.value)} />
                  </div>
                </div>
                <div className="te-filter-field">
                  <label className="te-filter-label">From Date</label>
                  <input className="te-input" type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setQuickRange('custom'); }} />
                </div>
                <div className="te-filter-field">
                  <label className="te-filter-label">To Date</label>
                  <input className="te-input" type="date" value={toDate} onChange={e => { setToDate(e.target.value); setQuickRange('custom'); }} />
                </div>
              </div>

              <div className="te-filter-bottom">
                <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                  <div>
                    <div className="te-filter-label" style={{ marginBottom:'0.4rem' }}>Status</div>
                    <div className="te-status-tabs">
                      <button className={`te-status-tab all${statusFilter === 'all' ? ' active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                      <button className={`te-status-tab pending${statusFilter === 'pending' ? ' active' : ''}`} onClick={() => setStatusFilter('pending')}>Pending</button>
                      <button className={`te-status-tab graded${statusFilter === 'graded' ? ' active' : ''}`} onClick={() => setStatusFilter('graded')}>Graded</button>
                    </div>
                  </div>
                  <div>
                    <div className="te-filter-label" style={{ marginBottom:'0.4rem' }}>Quick Range</div>
                    <div className="te-quick-ranges">
                      {[{ k:'all',l:'All time'},{k:'today',l:'Today'},{k:'7d',l:'Last 7 days'},{k:'30d',l:'Last 30 days'}].map(({k,l}) => (
                        <button key={k} className={`te-chip${quickRange===k?' active':''}`} onClick={() => applyQuickRange(k)}>{l}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── RESULTS BAR ── */}
            <div className="te-result-bar">
              <span className="te-result-count">
                Showing <strong>{filteredItems.length}</strong> evaluation{filteredItems.length !== 1 ? 's' : ''}
                {activeFilters > 0 && <span style={{ color:'#94a3b8' }}> (filtered from {items.length} total)</span>}
              </span>
            </div>

            {/* ── LIST ── */}
            {loading ? (
              <div>
                {[1,2,3,4].map(i => <div key={i} className="te-skeleton" />)}
              </div>
            ) : (
              <div className="te-list">
                {filteredItems.length === 0 && (
                  <div className="te-empty">
                    <div className="te-empty-icon"><ClipboardCheck size={28} /></div>
                    <div className="te-empty-title">No evaluations found</div>
                    <div className="te-empty-sub">
                      {activeFilters > 0 ? 'Try adjusting or resetting your filters.' : 'No sessions have been recorded yet.'}
                    </div>
                  </div>
                )}
                {pagedItems.map(item => {
                  const p = profiles[item.studentId];
                  const full = p ? `${p.firstName || ''} ${p.lastName || ''}`.trim() : '';
                  const studentName = full || p?.email || item.studentId || 'Student';
                  const isGraded = item.status === 'graded';
                  const score = normalizeScore(item.totalScore);

                  return (
                    <div key={item._id} className="te-item">
                      {/* Avatar */}
                      <div className="te-item-avatar">
                        {getInitials(studentName)}
                      </div>

                      {/* Main content */}
                      <div className="te-item-main">
                        <div className="te-item-top">
                          <span className="te-topic">{item.title || 'Untitled session'}</span>
                          <span className={`te-status-badge ${isGraded ? 'graded' : 'pending'}`}>
                            {isGraded ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
                            {isGraded ? 'Graded' : 'Pending'}
                          </span>
                        </div>
                        <div style={{ marginBottom:'0.3rem' }}>
                          <span className="te-student-tag"><User size={11} /> {studentName}</span>
                        </div>
                        <div className="te-item-meta">
                          <span className="te-meta-item">
                            <Calendar size={12} /> {formatShortDate(item.createdAt)}
                          </span>
                          <span className="te-meta-item">
                            <Clock size={12} /> Updated {formatShortDate(item.updatedAt || item.createdAt)}
                          </span>
                        </div>
                      </div>

                      {/* Score */}
                      {score != null && (
                        <div className="te-score-pill">
                          <ListChecks size={13} style={{ color:'#94a3b8' }} />
                          {score}<span style={{ fontWeight:400, color:'#94a3b8', fontSize:'0.72rem' }}>/100</span>
                        </div>
                      )}

                      {/* CTA */}
                      <button
                        className="te-open-btn"
                        onClick={() =>
                          navigate(`/teacher/evaluate/${item.studentId}/${item._id}`, {
                            state: { studentName },
                          })
                        }
                      >
                        <Eye size={14} /> Open
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── PAGINATION ── */}
            {!loading && filteredItems.length > 0 && (
              <div className="te-pagination-wrap">
                <div className="te-pagination-meta">
                  <span>{firstIdx}–{lastIdx} of {filteredItems.length}</span>
                  <span style={{ color:'#e5e7eb' }}>|</span>
                  <span>Rows per page</span>
                  <select className="te-pagination-select" value={pageSize} onChange={e => setPageSize(Number(e.target.value))}>
                    {[5,8,12,20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="te-pagination">
                  <button className="te-page-btn" disabled={currentPage<=1} onClick={() => setCurrentPage(p => Math.max(1,p-1))} aria-label="Previous">
                    <ChevronLeft size={15} />
                  </button>
                  {paginationWindow.map((p, idx) =>
                    typeof p !== 'number'
                      ? <span key={`${p}-${idx}`} className="te-page-ellipsis">…</span>
                      : <button key={p} className={`te-page-btn${currentPage===p?' active':''}`} onClick={() => setCurrentPage(p)} aria-label={`Page ${p}`}>{p}</button>
                  )}
                  <button className="te-page-btn" disabled={currentPage>=totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages,p+1))} aria-label="Next">
                    <ChevronRight size={15} />
                  </button>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}