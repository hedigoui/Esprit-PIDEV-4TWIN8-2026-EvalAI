import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherSidebar from '../../components/TeacherSidebar';
import TopNavbar from '../../components/TopNavbar';
import { Search, Filter, Eye, ClipboardCheck, MessageCircle, Users, TrendingUp, Calendar, Phone, LayoutGrid, List, Video } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { oralPerformanceService } from '../services/oralPerformance.service';
import { useI18n } from '../../i18n/I18nProvider';
import { API_BASE_URL } from '../../config/api.js';

/** Wait until Socket.IO finishes connecting (object exists before handshake completes). */
function waitForSocketConnected(sock, timeoutMs = 15000) {
  if (!sock) return Promise.resolve(false);
  if (sock.connected) return Promise.resolve(true);
  return new Promise((resolve) => {
    const finish = (ok) => {
      clearTimeout(timer);
      sock.off('connect', onConnect);
      sock.off('connect_error', onFail);
      resolve(ok);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    const onConnect = () => finish(true);
    const onFail = () => finish(false);
    sock.once('connect', onConnect);
    sock.once('connect_error', onFail);
  });
}

const studentsPageStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

  .sp-root * { font-family: 'Manrope', sans-serif; box-sizing: border-box; }

  .sp-root {
    display: flex;
    min-height: 100vh;
    background: var(--bg-main);
  }

  .sp-main { flex: 1; overflow-y: auto; min-width: 0; }

  .sp-content {
    max-width: 1280px;
    padding: 2rem 2.5rem;
    margin: 0 auto;
  }

  /* Hero */
  .sp-hero {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #E31837 150%);
    border-radius: 24px;
    padding: 2.5rem;
    margin-bottom: 2rem;
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 20px 60px rgba(227,24,55,0.15);
  }

  .sp-hero::before {
    content: '';
    position: absolute;
    top: -60px; right: -60px;
    width: 300px; height: 300px;
    background: radial-gradient(circle, rgba(227,24,55,0.2) 0%, transparent 70%);
    pointer-events: none;
  }

  .sp-hero-kicker {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.7rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(227,24,55,0.9);
    background: rgba(227,24,55,0.12);
    padding: 0.3rem 0.75rem;
    border-radius: 20px;
    margin-bottom: 0.75rem;
    border: 1px solid rgba(227,24,55,0.2);
  }

  .sp-hero-title {
    font-size: 2rem; font-weight: 800; color: #fff;
    letter-spacing: -0.04em; margin: 0 0 0.5rem; line-height: 1.2;
  }

  .sp-hero-sub {
    color: rgba(255,255,255,0.55); font-size: 0.9rem;
    line-height: 1.6; max-width: 380px; margin: 0;
  }

  .sp-hero-icon {
    width: 90px; height: 90px; border-radius: 50%;
    background: rgba(227,24,55,0.15);
    border: 1px solid rgba(227,24,55,0.25);
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.7); flex-shrink: 0;
  }

  /* Header */
  .sp-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 1.5rem; gap: 1rem; flex-wrap: wrap;
  }

  .sp-stats-row {
    display: flex; gap: 0.75rem;
  }

  .sp-mini-stat {
    display: flex; align-items: center; gap: 0.6rem;
    background: var(--bg-card);
    border: 1px solid var(--border-light);
    border-radius: 14px;
    padding: 0.6rem 1rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }

  .sp-mini-icon {
    width: 32px; height: 32px; border-radius: 10px;
    background: rgba(227,24,55,0.08);
    display: flex; align-items: center; justify-content: center;
  }

  .sp-mini-num {
    font-size: 1.25rem; font-weight: 800; color: var(--text-primary);
    letter-spacing: -0.03em; line-height: 1;
  }

  .sp-mini-label {
    font-size: 0.72rem; color: #94a3b8; font-weight: 500;
  }

  .sp-invite-btn {
    padding: 0.6rem 1.2rem;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    color: #fff;
    font-weight: 700;
    font-size: 0.82rem;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    box-shadow: 0 6px 18px rgba(227,24,55,0.25);
  }

  .sp-modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(15,15,26,0.55);
    backdrop-filter: blur(6px);
    z-index: 200;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .sp-modal {
    width: min(420px, 95vw);
    background: var(--bg-card-solid);
    border-radius: 18px;
    padding: 1.5rem;
    border: 1px solid var(--border-light);
    box-shadow: 0 16px 40px rgba(0,0,0,0.2);
  }

  .sp-modal-title {
    font-size: 1rem;
    font-weight: 800;
    color: var(--text-primary);
    margin-bottom: 0.25rem;
  }

  .sp-modal-sub {
    font-size: 0.82rem;
    color: var(--text-secondary);
    margin-bottom: 1rem;
  }

  .sp-modal-input {
    width: 100%;
    padding: 0.75rem 0.9rem;
    border-radius: 12px;
    border: 1px solid var(--border-light);
    font-size: 0.9rem;
    margin-bottom: 0.9rem;
    background: var(--bg-card-solid);
    color: var(--text-primary);
  }

  .sp-modal-actions {
    display: flex;
    gap: 0.6rem;
    justify-content: flex-end;
  }

  .sp-modal-btn {
    padding: 0.55rem 1rem;
    border-radius: 10px;
    font-weight: 600;
    border: 1px solid var(--border-light);
    background: var(--bg-card);
    cursor: pointer;
  }

  .sp-modal-btn.primary {
    border: none;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    color: #fff;
  }

  /* Controls */
  .sp-controls {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-light);
    padding: 1.25rem 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .sp-filters-row {
    display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .sp-search {
    position: relative; flex: 1; min-width: 200px;
  }

  .sp-search-icon {
    position: absolute; left: 0.85rem; top: 50%;
    transform: translateY(-50%); color: #94a3b8; pointer-events: none;
  }

  .sp-search-input {
    width: 100%;
    padding: 0.7rem 0.75rem 0.7rem 2.5rem;
    border: 1.5px solid var(--border-light);
    border-radius: 12px;
    font-size: 0.875rem;
    font-family: 'Manrope', sans-serif;
    background: var(--bg-card-solid);
    color: var(--text-primary);
    transition: all 0.2s;
    outline: none;
  }

  .sp-search-input:focus {
    border-color: #E31837;
    background: var(--bg-card-solid);
    box-shadow: 0 0 0 3px rgba(227,24,55,0.08);
  }

  .sp-filter-wrap {
    position: relative; display: flex; align-items: center;
  }

  .sp-filter-icon {
    position: absolute; left: 0.85rem; color: #94a3b8; pointer-events: none;
  }

  .sp-filter-select {
    padding: 0.7rem 1rem 0.7rem 2.4rem;
    border: 1.5px solid var(--border-light);
    border-radius: 12px;
    font-size: 0.875rem;
    font-family: 'Manrope', sans-serif;
    background: var(--bg-card-solid);
    color: var(--text-primary);
    cursor: pointer;
    outline: none;
    transition: all 0.2s;
    appearance: none;
    padding-right: 2rem;
  }

  .sp-filter-select:focus {
    border-color: #E31837;
    box-shadow: 0 0 0 3px rgba(227,24,55,0.08);
  }

  .sp-view-toggle {
    display: flex; gap: 4px;
    background: var(--bg-card);
    padding: 4px;
    border-radius: 10px;
  }

  .sp-view-btn {
    width: 34px; height: 34px; border-radius: 8px;
    border: none; cursor: pointer; background: transparent;
    display: flex; align-items: center; justify-content: center;
    color: #94a3b8; transition: all 0.2s;
  }

  .sp-view-btn.active {
    background: var(--bg-card-solid);
    color: #E31837;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  }

  .sp-level-dist {
    display: flex; gap: 1rem; flex-wrap: wrap;
  }

  .sp-level-item {
    display: flex; align-items: center; gap: 0.4rem;
  }

  .sp-level-dot {
    width: 8px; height: 8px; border-radius: 3px;
  }

  .sp-level-name { font-size: 0.78rem; color: #64748b; font-weight: 500; }
  .sp-level-count {
    font-size: 0.78rem; font-weight: 700; color: var(--text-primary);
    background: var(--bg-card); padding: 0.1rem 0.4rem; border-radius: 6px;
  }

  /* Grid */
  .sp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
  }

  .sp-card {
    background: var(--bg-card);
    border-radius: 20px;
    border: 1px solid var(--border-light);
    overflow: hidden;
    transition: all 0.2s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  }

  .sp-card:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.1);
    border-color: rgba(227,24,55,0.15);
  }

  .sp-card-top {
    padding: 1.25rem 1.25rem 0;
    display: flex; align-items: flex-start; justify-content: space-between;
  }

  .sp-avatar {
    width: 52px; height: 52px; border-radius: 16px;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 800; font-size: 1.1rem;
    box-shadow: 0 4px 12px rgba(227,24,55,0.25);
  }

  .sp-status-dot {
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px rgba(0,0,0,0.1);
    margin-top: 4px;
  }

  .sp-card-body { padding: 0.85rem 1.25rem; }

  .sp-student-name {
    font-size: 1rem; font-weight: 700; color: var(--text-primary);
    margin: 0 0 0.2rem; letter-spacing: -0.01em;
  }

  .sp-student-email {
    font-size: 0.78rem; color: #94a3b8; margin: 0 0 0.75rem;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }

  .sp-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; margin-bottom: 0.75rem; }

  .sp-badge {
    font-size: 0.68rem; font-weight: 700;
    padding: 0.2rem 0.6rem; border-radius: 20px; color: white;
  }

  .sp-detail-row {
    display: flex; flex-direction: column; gap: 0.3rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--border-light);
  }

  .sp-detail-item {
    display: flex; align-items: center; gap: 0.4rem;
    font-size: 0.75rem; color: #94a3b8;
  }

  .sp-card-footer {
    padding: 0.85rem 1.25rem;
    display: flex; align-items: center; justify-content: space-between;
  }

  .sp-mini-stats { display: flex; gap: 1.5rem; }

  .sp-mini-stat-item { text-align: center; }

  .sp-mini-stat-num {
    font-size: 1.1rem; font-weight: 800; color: var(--text-primary);
    letter-spacing: -0.02em; display: block;
  }

  .sp-mini-stat-lbl { font-size: 0.65rem; color: #94a3b8; font-weight: 500; }

  .sp-actions { display: flex; gap: 0.4rem; }

  .sp-action-btn {
    width: 36px; height: 36px; border-radius: 10px;
    border: 1.5px solid var(--border-light);
    background: var(--bg-card); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-secondary); transition: all 0.2s;
  }

  .sp-action-btn:hover {
    border-color: #E31837;
    background: rgba(227,24,55,0.06);
    color: #E31837;
    transform: scale(1.05);
  }

  .sp-action-btn.msg:hover {
    border-color: #3b82f6;
    background: rgba(59,130,246,0.06);
    color: #3b82f6;
  }

  /* List view */
  .sp-list { display: flex; flex-direction: column; gap: 0.5rem; }

  .sp-list-item {
    background: var(--bg-card);
    border-radius: 16px;
    border: 1px solid var(--border-light);
    padding: 1rem 1.25rem;
    display: flex; align-items: center; gap: 1rem;
    transition: all 0.2s;
    box-shadow: 0 1px 6px rgba(0,0,0,0.03);
  }

  .sp-list-item:hover {
    border-color: rgba(227,24,55,0.15);
    box-shadow: 0 4px 16px rgba(0,0,0,0.07);
  }

  .sp-list-avatar {
    width: 44px; height: 44px; border-radius: 14px;
    background: linear-gradient(135deg, #E31837, #B71C1C);
    display: flex; align-items: center; justify-content: center;
    color: white; font-weight: 800; font-size: 0.95rem; flex-shrink: 0;
  }

  .sp-list-info { flex: 1; min-width: 0; }

  .sp-list-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.25rem; flex-wrap: wrap; }

  .sp-list-name { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); }

  .sp-list-email { font-size: 0.75rem; color: #94a3b8; }

  .sp-list-meta { display: flex; gap: 1rem; margin-top: 0.35rem; flex-wrap: wrap; }

  .sp-list-meta span { font-size: 0.75rem; color: #94a3b8; font-weight: 500; }

  .sp-list-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }

  /* States */
  .sp-loading {
    text-align: center; padding: 4rem; color: #94a3b8;
  }

  .sp-spinner {
    width: 40px; height: 40px; border-radius: 50%;
    border: 3px solid rgba(227,24,55,0.15);
    border-top-color: #E31837;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 1rem;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  .sp-empty {
    text-align: center; padding: 4rem;
    color: #64748b;
  }

  .sp-empty-icon { font-size: 3rem; margin-bottom: 1rem; }

  .sp-empty h3 { font-size: 1.1rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.5rem; }

  .sp-empty p { font-size: 0.875rem; margin: 0 0 1.25rem; }

  .sp-clear-btn {
    padding: 0.6rem 1.25rem;
    background: rgba(227,24,55,0.08);
    color: #E31837;
    border: 1px solid rgba(227,24,55,0.2);
    border-radius: 10px;
    font-size: 0.875rem;
    font-weight: 600;
    font-family: 'Manrope', sans-serif;
    cursor: pointer;
    transition: all 0.2s;
  }

  .sp-clear-btn:hover {
    background: rgba(227,24,55,0.15);
  }

  .sp-exam-hint {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 0.9rem 1.15rem;
    border-radius: 16px;
    background: rgba(227,24,55,0.06);
    border: 1px solid rgba(227,24,55,0.14);
    margin-bottom: 1.25rem;
    font-size: 0.82rem;
    color: #475569;
    line-height: 1.55;
    font-weight: 500;
  }

  .sp-exam-alert {
    margin-bottom: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 14px;
    font-size: 0.84rem;
    font-weight: 600;
  }

  .sp-exam-alert.warn {
    background: #fffbeb;
    color: #92400e;
    border: 1px solid #fcd34d;
  }

  .sp-exam-alert.err {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
  }

  .sp-action-btn.exam:hover {
    border-color: #7c3aed;
    background: rgba(124,58,237,0.08);
    color: #7c3aed;
  }
`;

const PAGE_SIZE = 20;

function mergeById(prev, next) {
  const map = new Map();
  [...prev, ...next].forEach((item) => {
    const id = item._id?.toString?.() || item._id || item.id;
    if (!id) return;
    map.set(String(id), item);
  });
  return Array.from(map.values());
}

function normalizeDisplayScore(raw) {
  if (raw == null || Number.isNaN(Number(raw))) return null;
  const n = Number(raw);
  if (n <= 10) return Math.round(n * 10);
  return Math.round(Math.min(100, n));
}

function displayName(s, t) {
  const n = `${s.firstName || ''} ${s.lastName || ''}`.trim();
  return n || s.email || t('teacherStudents.studentFallback');
}

function profLabel(p, t) {
  if (!p) return '—';
  const key = String(p).toLowerCase();
  if (key === 'beginner') return t('proficiency.beginner');
  if (key === 'intermediate') return t('proficiency.intermediate');
  if (key === 'advanced') return t('proficiency.advanced');
  if (key === 'proficient') return t('proficiency.proficient');
  return String(p);
}

function getProficiencyColor(p) {
  const c = { beginner: '#ef4444', intermediate: '#f97316', advanced: '#22c55e', proficient: '#8b5cf6' };
  return c[String(p || '').toLowerCase()] || '#64748b';
}

function enrichStudents(students, performances, t) {
  const bySt = {};
  (performances || []).forEach((p) => {
    const sid = p.studentId;
    if (!bySt[sid]) bySt[sid] = { count: 0, scores: [], profs: [] };
    bySt[sid].count++;
    if (p.totalScore != null) bySt[sid].scores.push({ t: p.createdAt, score: p.totalScore });
    if (p.overallProficiency) bySt[sid].profs.push({ t: p.createdAt, p: p.overallProficiency });
  });

  return students.map((s) => {
    const id = s._id?.toString?.() || s._id;
    const ex = bySt[id] || { count: 0, scores: [], profs: [] };
    const scores = [...ex.scores].sort((a, b) => new Date(b.t) - new Date(a.t));
    const profs = [...ex.profs].sort((a, b) => new Date(b.t) - new Date(a.t));
    const lastScore = scores[0]?.score;
    const proficiency = profs[0]?.p || null;
    return { ...s, displayName: displayName(s, t), sessions: ex.count, lastScore: lastScore != null ? normalizeDisplayScore(lastScore) : null, proficiency };
  });
}

const Students = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { t, language } = useI18n();
  const locale = language === 'fr' ? 'fr-FR' : 'en-US';
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [students, setStudents] = useState([]);
  const [performances, setPerformances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteSending, setInviteSending] = useState(false);
  const [examAlert, setExamAlert] = useState(null);
  const loadMoreRef = useRef(null);

  const currentUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }, []);

  useEffect(() => { loadStudents(1, false); }, [currentUser?.id, language]);

  const loadStudents = async (pageToLoad = 1, append = false) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) { setStudents([]); setPerformances([]); setLoading(false); return; }
      if (pageToLoad === 1) setLoading(true); else setLoadingMore(true);
      const instructorId = currentUser?.id;
      const perfData = instructorId && performances.length === 0
        ? await oralPerformanceService.getInstructorPerformances(instructorId)
        : performances;
      const response = await fetch(
        `${API_BASE_URL}/communication/students?page=${pageToLoad}&limit=${PAGE_SIZE}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (response.ok) {
        const data = await response.json();
        const raw = data.data || [];
        if (performances.length === 0) {
          setPerformances(Array.isArray(perfData) ? perfData : []);
        }
        const enriched = enrichStudents(raw, perfData, t);
        setStudents((prev) => mergeById(append ? prev : [], enriched));
        const total = typeof data.total === 'number' ? data.total : raw.length;
        setTotalCount(total);
        setHasMore(pageToLoad * PAGE_SIZE < total);
        setPage(pageToLoad);
      } else { if (!append) { setStudents([]); setPerformances([]); } }
    } catch (error) {
      console.error('Error loading students:', error);
      if (!append) setStudents([]);
    } finally { setLoading(false); setLoadingMore(false); }
  };

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore) {
          void loadStudents(page + 1, true);
        }
      },
      { rootMargin: '200px' },
    );
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, page]);

  const filteredStudents = students.filter((student) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch = student.displayName?.toLowerCase().includes(q) || student.email?.toLowerCase().includes(q);
    const matchesLevel = levelFilter === 'all' || student.proficiency === levelFilter;
    return matchesSearch && matchesLevel;
  });

  const startConversation = (studentId) => { navigate(`/messages/${studentId}`); };

  const studentMongoId = (s) => String(s._id ?? s.id ?? '');

  const startOnlineExam = async (student) => {
    const sid = studentMongoId(student);
    const instructorId = currentUser?.id || currentUser?._id;
    if (!instructorId) {
      setExamAlert({ kind: 'err', text: t('teacherStudents.examNotSignedIn') });
      return;
    }
    if (!socket) {
      setExamAlert({ kind: 'err', text: t('teacherStudents.examSocketMissing') });
      return;
    }
    if (!socket.connected) {
      const ok = await waitForSocketConnected(socket, 15000);
      if (!ok) {
        setExamAlert({ kind: 'err', text: t('teacherStudents.examSocketMissing') });
        return;
      }
    }
    const roomId = `exam_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
    setExamAlert(null);
    let settled = false;
    const to = setTimeout(() => {
      if (settled) return;
      settled = true;
      setExamAlert({ kind: 'err', text: t('teacherStudents.examInviteTimeout') });
    }, 10000);
    // Ensure the teacher is registered on the socket before sending the invite
    socket.emit('register', { userId: String(instructorId) });

    socket.emit(
      'sendExamInvite',
      { studentId: sid, teacherId: String(instructorId), roomId },
      (response) => {
        if (settled) return;
        settled = true;
        clearTimeout(to);
        if (response?.status === 'invite_sent') {
          navigate(`/teacher/exam-room/${roomId}`);
        } else {
          setExamAlert({ kind: 'warn', text: t('teacherStudents.studentOfflineExam') });
        }
      },
    );
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError(t('teacherStudents.inviteEmailRequired'));
      return;
    }
    const token = localStorage.getItem('token');
    if (!token) return;
    setInviteSending(true);
    setInviteError('');
    setInviteSuccess('');
    try {
      const response = await fetch(`${API_BASE_URL}/communication/invitations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentEmail: inviteEmail.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setInviteError(data?.message || t('teacherStudents.inviteFailed'));
        return;
      }
      setInviteSuccess(t('teacherStudents.inviteSuccess'));
      setInviteEmail('');
    } catch (error) {
      setInviteError(t('teacherStudents.inviteFailed'));
    } finally {
      setInviteSending(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = { active: '#10b981', inactive: '#ef4444', pending: '#f59e0b' };
    const key = String(status || '').toLowerCase();
    return colors[key] || '#6b7280';
  };

  const stats = useMemo(() => {
    const total = totalCount ?? students.length;
    const active = students.filter((s) => s.isActive !== false).length;
    const byProf = {
      beginner: students.filter((s) => s.proficiency === 'beginner').length,
      intermediate: students.filter((s) => s.proficiency === 'intermediate').length,
      advanced: students.filter((s) => s.proficiency === 'advanced').length,
      proficient: students.filter((s) => s.proficiency === 'proficient').length,
    };
    return { total, active, byProf };
  }, [students]);

  return (
    <>
      <style>{studentsPageStyles}</style>
      <div className="sp-root">
        <TeacherSidebar />
        <div className="sp-main">
          <TopNavbar />
          <div className="sp-content">

            {/* Hero */}
            <div className="sp-hero">
              <div>
                <div className="sp-hero-kicker">👥 {t('teacherStudents.heroKicker')}</div>
                <h1 className="sp-hero-title">{t('teacherStudents.heroTitle')}</h1>
                <p className="sp-hero-sub">
                  {t('teacherStudents.heroSubtitle')}
                </p>
              </div>
              <div className="sp-hero-icon">
                <Users size={36} strokeWidth={1.5} />
              </div>
            </div>


            {examAlert && (
              <div className={`sp-exam-alert ${examAlert.kind === 'warn' ? 'warn' : 'err'}`}>{examAlert.text}</div>
            )}

            {/* Header with stats */}
            <div className="sp-header">
              <div>
                <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#1a1a2e', letterSpacing: '-0.02em' }}>{t('teacherStudents.directoryTitle')}</h2>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#94a3b8' }}>{t('teacherStudents.directorySub')}</p>
              </div>
              <div className="sp-stats-row">
                <div className="sp-mini-stat">
                  <div className="sp-mini-icon"><Users size={16} color="#E31837" /></div>
                  <div>
                    <div className="sp-mini-num">{stats.total}</div>
                      <div className="sp-mini-label">{t('teacherStudents.totalLabel')}</div>
                  </div>
                </div>
                <div className="sp-mini-stat">
                  <div className="sp-mini-icon" style={{ background: 'rgba(34,197,94,0.08)' }}><TrendingUp size={16} color="#22c55e" /></div>
                  <div>
                    <div className="sp-mini-num">{stats.active}</div>
                      <div className="sp-mini-label">{t('teacherStudents.activeLabel')}</div>
                  </div>
                </div>
              </div>
              <button type="button" className="sp-invite-btn" onClick={() => setInviteOpen(true)}>
                {t('teacherStudents.inviteStudent')}
              </button>
            </div>

            {inviteOpen && (
              <div className="sp-modal-backdrop" onClick={() => setInviteOpen(false)}>
                <div className="sp-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="sp-modal-title">{t('teacherStudents.inviteTitle')}</div>
                  <div className="sp-modal-sub">{t('teacherStudents.inviteSub')}</div>
                  <input
                    type="email"
                    placeholder={t('teacherStudents.invitePlaceholder')}
                    className="sp-modal-input"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  {inviteError && (
                    <div style={{ color: '#dc2626', fontSize: '0.8rem', marginBottom: '0.6rem' }}>{inviteError}</div>
                  )}
                  {inviteSuccess && (
                    <div style={{ color: '#16a34a', fontSize: '0.8rem', marginBottom: '0.6rem' }}>{inviteSuccess}</div>
                  )}
                  <div className="sp-modal-actions">
                    <button type="button" className="sp-modal-btn" onClick={() => setInviteOpen(false)}>
                      {t('teacherStudents.close')}
                    </button>
                    <button
                      type="button"
                      className="sp-modal-btn primary"
                      onClick={sendInvite}
                      disabled={inviteSending}
                    >
                      {inviteSending ? t('teacherStudents.sending') : t('teacherStudents.sendInvite')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="sp-controls">
              <div className="sp-filters-row">
                <div className="sp-search">
                  <Search size={17} className="sp-search-icon" />
                  <input
                    type="text"
                    placeholder={t('teacherStudents.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="sp-search-input"
                  />
                </div>

                <div className="sp-filter-wrap">
                  <Filter size={17} className="sp-filter-icon" />
                  <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)} className="sp-filter-select">
                    <option value="all">{t('teacherStudents.allLevels')}</option>
                    <option value="beginner">{t('proficiency.beginner')}</option>
                    <option value="intermediate">{t('proficiency.intermediate')}</option>
                    <option value="advanced">{t('proficiency.advanced')}</option>
                    <option value="proficient">{t('proficiency.proficient')}</option>
                  </select>
                </div>

                <div className="sp-view-toggle">
                  <button type="button" onClick={() => setViewMode('grid')} className={`sp-view-btn${viewMode === 'grid' ? ' active' : ''}`} title={t('teacherStudents.gridView')}>
                    <LayoutGrid size={16} />
                  </button>
                  <button type="button" onClick={() => setViewMode('list')} className={`sp-view-btn${viewMode === 'list' ? ' active' : ''}`} title={t('teacherStudents.listView')}>
                    <List size={16} />
                  </button>
                </div>
              </div>

              <div className="sp-level-dist">
                {Object.entries(stats.byProf).map(([level, count]) => (
                  <div key={level} className="sp-level-item">
                    <div className="sp-level-dot" style={{ backgroundColor: getProficiencyColor(level) }} />
                    <span className="sp-level-name">{profLabel(level, t)}</span>
                    <span className="sp-level-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Students */}
            {loading ? (
              <div className="sp-loading">
                <div className="sp-spinner" />
                <p>{t('teacherStudents.loadingStudents')}</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="sp-empty">
                <div className="sp-empty-icon">👥</div>
                <h3>{t('teacherStudents.emptyTitle')}</h3>
                <p>{searchTerm || levelFilter !== 'all' ? t('teacherStudents.emptyFiltered') : t('teacherStudents.emptyNone')}</p>
                <button type="button" onClick={() => { setSearchTerm(''); setLevelFilter('all'); }} className="sp-clear-btn">
                  {t('teacherStudents.clearFilters')}
                </button>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="sp-grid">
                {filteredStudents.map((student) => (
                  <div key={student.id || student._id} className="sp-card">
                    <div className="sp-card-top">
                      <div className="sp-avatar">{displayName(student, t).charAt(0).toUpperCase()}</div>
                      <div
                        className="sp-status-dot"
                        style={{ background: student.isActive === false ? '#94a3b8' : '#22c55e' }}
                        title={student.isActive === false ? t('teacherStudents.statusInactive') : t('teacherStudents.statusActive')}
                      />
                    </div>

                    <div className="sp-card-body">
                      <h3 className="sp-student-name">{student.displayName}</h3>
                      <p className="sp-student-email">{student.email}</p>
                      <div className="sp-badges">
                        <span className="sp-badge" style={{ backgroundColor: getProficiencyColor(student.proficiency) }}>
                          {profLabel(student.proficiency, t)}
                        </span>
                        <span className="sp-badge" style={{ backgroundColor: getStatusColor(student.status || 'active') }}>
                          {(() => {
                            const statusKey = String(student.status || 'active').toLowerCase();
                            if (statusKey === 'inactive') return t('teacherStudents.statusInactive');
                            if (statusKey === 'pending') return t('teacherStudents.statusPending');
                            return t('teacherStudents.statusActive');
                          })()}
                        </span>
                      </div>
                      <div className="sp-detail-row">
                        <div className="sp-detail-item">
                          <Phone size={13} />
                          <span>{student.phone || t('teacherStudents.noPhone')}</span>
                        </div>
                        <div className="sp-detail-item">
                          <Calendar size={13} />
                          <span>{t('teacherStudents.joinedOn', { date: student.createdAt ? new Date(student.createdAt).toLocaleDateString(locale) : '—' })}</span>
                        </div>
                      </div>
                    </div>

                    <div className="sp-card-footer">
                      <div className="sp-mini-stats">
                        <div className="sp-mini-stat-item">
                          <span className="sp-mini-stat-num">{student.sessions || 0}</span>
                          <span className="sp-mini-stat-lbl">{t('teacherStudents.sessionsLabel')}</span>
                        </div>
                        <div className="sp-mini-stat-item">
                          <span className="sp-mini-stat-num">{student.lastScore != null ? `${student.lastScore}%` : '—'}</span>
                          <span className="sp-mini-stat-lbl">{t('teacherStudents.lastScore')}</span>
                        </div>
                      </div>
                      <div className="sp-actions">
                        <button type="button" onClick={() => navigate(`/teacher/evaluate/${student._id}`)} className="sp-action-btn" title={t('teacherStudents.openEvaluation')}>
                          <Eye size={15} />
                        </button>
                        <button type="button" onClick={() => navigate(`/teacher/evaluate/${student._id}`)} className="sp-action-btn" title={t('teacherStudents.evaluate')}>
                          <ClipboardCheck size={15} />
                        </button>
                        <button type="button" onClick={() => startConversation(student._id)} className="sp-action-btn msg" title={t('teacherStudents.sendMessage')}>
                          <MessageCircle size={15} />
                        </button>
                        <button type="button" onClick={() => startOnlineExam(student)} className="sp-action-btn exam" title={t('teacherStudents.liveExamShort')}>
                          <Video size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="sp-list">
                {filteredStudents.map((student) => (
                  <div key={student.id || student._id} className="sp-list-item">
                    <div className="sp-list-avatar">{displayName(student, t).charAt(0).toUpperCase()}</div>
                    <div className="sp-list-info">
                      <div className="sp-list-head">
                        <span className="sp-list-name">{student.displayName}</span>
                        <span className="sp-badge" style={{ backgroundColor: getProficiencyColor(student.proficiency) }}>
                          {profLabel(student.proficiency, t)}
                        </span>
                        <span className="sp-badge" style={{ backgroundColor: getStatusColor(student.status || 'active') }}>
                          {(() => {
                            const statusKey = String(student.status || 'active').toLowerCase();
                            if (statusKey === 'inactive') return t('teacherStudents.statusInactive');
                            if (statusKey === 'pending') return t('teacherStudents.statusPending');
                            return t('teacherStudents.statusActive');
                          })()}
                        </span>
                      </div>
                      <div className="sp-list-email">{student.email}</div>
                      <div className="sp-list-meta">
                        <span>{t('teacherStudents.sessionsMeta', { count: student.sessions || 0 })}</span>
                        <span>{t('teacherStudents.scoreMeta', { score: student.lastScore != null ? `${student.lastScore}%` : '—' })}</span>
                        <span>{t('teacherStudents.joinedMeta', { date: student.createdAt ? new Date(student.createdAt).toLocaleDateString(locale) : '—' })}</span>
                      </div>
                    </div>
                    <div className="sp-list-actions">
                      <button type="button" onClick={() => navigate(`/teacher/evaluate/${student._id}`)} className="sp-action-btn" title={t('teacherStudents.evaluate')}>
                        <Eye size={15} />
                      </button>
                      <button type="button" onClick={() => startConversation(student._id)} className="sp-action-btn msg" title={t('teacherStudents.message')}>
                        <MessageCircle size={15} />
                      </button>
                      <button type="button" onClick={() => startOnlineExam(student)} className="sp-action-btn exam" title={t('teacherStudents.liveExamShort')}>
                        <Video size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div ref={loadMoreRef} style={{ height: 1 }} />
            {loadingMore && (
              <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {t('teacherStudents.loadingMore')}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Students;