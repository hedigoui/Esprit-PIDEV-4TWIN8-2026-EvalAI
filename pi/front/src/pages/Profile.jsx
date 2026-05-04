import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Edit3, Camera, Save, X, Shield, Star } from 'lucide-react';
import styles from '../styles/shared.module.css';
import StudentSidebar from '../components/StudentSidebar';
import TeacherSidebar from '../components/TeacherSidebar';
import AdminSidebar from '../components/AdminSidebar';
import TopNavbar from '../components/TopNavbar';
import { useI18n } from '../i18n/I18nProvider';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useI18n();

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', gender: 'male', phone: '', bio: '', avatar: ''
  });

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`
    .toUpperCase()
    .trim() || 'U';

  useEffect(() => {
    let isMounted = true;
    let didFetch = false;
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.id) {
      setUser(userData);
      setFormData({
        firstName: userData.firstName || '', lastName: userData.lastName || '',
        email: userData.email || '', gender: userData.gender || 'male',
        phone: userData.phone || '', bio: userData.bio || '', avatar: userData.avatar || ''
      });

      const token = localStorage.getItem('token');
      if (token) {
        didFetch = true;
        fetch(`http://localhost:3000/users/profile/${userData.id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
          .then(async (res) => ({ ok: res.ok, data: await res.json() }))
          .then(({ ok, data }) => {
            const resolvedId = data?.id || data?._id;
            if (!ok || !resolvedId) return;
            if (!isMounted) return;
            const refreshedUser = { ...userData, ...data, id: resolvedId };
            localStorage.setItem('user', JSON.stringify(refreshedUser));
            setUser(refreshedUser);
            setFormData({
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              gender: data.gender || 'male',
              phone: data.phone || '',
              bio: data.bio || '',
              avatar: data.avatar || ''
            });
          })
          .catch((err) => {
            console.error('Profile fetch error:', err);
          })
          .finally(() => {
            if (isMounted) setLoading(false);
          });
      }
    } else { navigate('/'); }
    if (!didFetch) setLoading(false);
    return () => { isMounted = false; };
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/users/profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, ...data, gender: formData.gender };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser); setSuccess(t('profile.updated')); setEditing(false);
      } else { setError(data.message || t('profile.updateFailed')); }
    } catch (error) { console.error('Profile update error:', error); setError(t('profile.connectFailed')); }
    finally { setSaving(false); }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) { setError(t('profile.avatarInvalidType')); return; }
    if (file.size > 5 * 1024 * 1024) { setError(t('profile.avatarTooLarge')); return; }
    const fd = new FormData(); fd.append('avatar', file);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3000/users/profile/${user.id}/avatar`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: fd
      });
      const data = await response.json();
      if (response.ok) {
        const updatedUser = { ...user, avatar: data.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser); setFormData(prev => ({ ...prev, avatar: data.avatar }));
        setSuccess(t('profile.avatarUpdated'));
      } else { setError(data.message || t('profile.avatarUploadFailed')); }
    } catch (error) { console.error('Avatar upload error:', error); setError(t('profile.avatarUploadFailed')); }
  };

  const getSidebar = () => {
    if (!user) return null;
    switch (user.role) {
      case 'student': return <StudentSidebar />;
      case 'instructor': return <TeacherSidebar />;
      case 'admin': return <AdminSidebar />;
      default: return null;
    }
  };

  const inputStyle = (isEditing) => ({
    width: '100%',
    padding: '0.8rem 1rem',
    background: isEditing ? 'var(--bg-card-solid)' : 'var(--bg-card)',
    border: `1.5px solid ${isEditing ? '#E31837' : 'var(--border-light)'}`,
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
    opacity: isEditing ? 1 : 0.8,
    cursor: isEditing ? 'text' : 'not-allowed',
    outline: 'none',
    boxShadow: isEditing ? '0 0 0 3px rgba(227,24,55,0.08)' : 'none',
    fontFamily: 'inherit',
  });

  if (loading) return (
    <div className={styles.layout}>
      {getSidebar()}
      <div className={styles.mainContent}>
        <TopNavbar />
        <div className={styles.content} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{t('profile.loading')}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        .prof-root { animation: fadeUp 0.35s ease; }
        .prof-section-bar { width:4px; height:20px; background:linear-gradient(180deg,#E31837,#B71C1C); border-radius:2px; }
        .prof-field label { display:block; font-size:0.82rem; font-weight:600; color:var(--text-secondary); margin-bottom:0.4rem; }
        .prof-field input, .prof-field select, .prof-field textarea {
          width:100%; padding:0.8rem 1rem; border-radius:12px; font-size:0.9rem;
          font-family:inherit; outline:none; transition:all 0.2s ease;
        }
        .prof-field input:focus, .prof-field select:focus, .prof-field textarea:focus { border-color:#E31837 !important; box-shadow:0 0 0 3px rgba(227,24,55,0.08) !important; }
      `}</style>
      <div className={styles.layout}>
        {getSidebar()}
        <div className={styles.mainContent}>
          <TopNavbar />
          <div className={styles.content}>
            <div className="prof-root">
              {/* Page Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#E31837', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.3rem' }}>{t('profile.accountKicker')}</div>
                  <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', margin: 0 }}>{t('profile.title')}</h1>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.25rem' }}>{t('profile.sub')}</p>
                </div>
                <button onClick={() => setEditing(!editing)} style={{
                  padding: '0.65rem 1.5rem',
                  background: editing ? 'var(--bg-card-solid)' : 'linear-gradient(135deg,#E31837,#B71C1C)',
                  border: editing ? '1.5px solid var(--border-light)' : 'none',
                  borderRadius: '12px', color: editing ? 'var(--text-secondary)' : '#fff',
                  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  transition: 'all 0.2s ease',
                  boxShadow: editing ? 'none' : '0 4px 16px rgba(227,24,55,0.35)',
                }}>
                  {editing ? <X size={16} /> : <Edit3 size={16} />}
                  {editing ? t('profile.cancel') : t('profile.editProfile')}
                </button>
              </div>

              {/* Alerts */}
              {error && (
                <div style={{ background: '#fef2f4', border: '1px solid #fecdd3', color: '#be123c', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  {error}
                </div>
              )}
              {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                  {success}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
                {/* LEFT: Avatar Card */}
                <div>
                  <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)', overflow: 'hidden', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                    {/* Red header strip */}
                    <div style={{ height: '90px', background: 'linear-gradient(135deg,#E31837,#B71C1C)', position: 'relative' }}>
                      <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                    {/* Avatar */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 1.5rem 1.5rem', marginTop: '-48px', position: 'relative', zIndex: 1 }}>
                      <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        {formData.avatar ? (
                          <img
                            src={formData.avatar}
                            alt="Profile"
                            style={{ width: 96, height: 96, borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--bg-card-solid)', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}
                          />
                        ) : (
                          <div style={{
                            width: 96,
                            height: 96,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'linear-gradient(135deg, #E31837, #B71C1C)',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '1.6rem',
                            border: '4px solid var(--bg-card-solid)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                          }}>
                            {initials}
                          </div>
                        )}
                        {editing && (
                          <label style={{
                            position: 'absolute', bottom: 4, right: 4,
                            width: 32, height: 32, background: 'linear-gradient(135deg,#E31837,#B71C1C)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 2px 8px rgba(227,24,55,0.4)',
                          }}>
                            <Camera size={15} color="#fff" />
                            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                          </label>
                        )}
                      </div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', textAlign: 'center' }}>
                        {formData.firstName} {formData.lastName}
                      </h3>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.75rem', textAlign: 'center' }}>{formData.email}</p>
                      <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '5px',
                        padding: '0.35rem 0.9rem',
                        background: 'rgba(227,24,55,0.08)', color: '#E31837',
                        borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700,
                        textTransform: 'capitalize', border: '1px solid rgba(227,24,55,0.15)',
                      }}>
                        <Shield size={12} /> {user?.role || t('profile.roleFallback')}
                      </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderTop: '1px solid var(--border-light)' }}>
                      {[
                        { label: t('profile.yearsActive'), value: new Date().getFullYear() - new Date(user?.createdAt || '2024').getFullYear() },
                        { label: t('profile.phone'), value: formData.phone ? `✓ ${t('profile.phoneSet')}` : t('profile.phoneNotSet') }
                      ].map(({ label, value }) => (
                        <div key={label} style={{ padding: '1rem', textAlign: 'center', borderRight: '1px solid var(--border-light)' }}>
                          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{value}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.06em' }}>{label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RIGHT: Form Card */}
                <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-light)', padding: '2rem', boxShadow: '0 2px 20px rgba(0,0,0,0.04)' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>{t('profile.personalInfo')}</h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '2rem' }}>
                    {editing ? t('profile.personalSubEdit') : t('profile.personalSubView')}
                  </p>

                  {/* Basic Info */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <div className="prof-section-bar" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('profile.basicInfo')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      {[
                        { name: 'firstName', label: t('profile.firstName'), type: 'text', placeholder: t('profile.firstName') },
                        { name: 'lastName', label: t('profile.lastName'), type: 'text', placeholder: t('profile.lastName') },
                      ].map(({ name, label, type, placeholder }) => (
                        <div className="prof-field" key={name}>
                          <label>{label}</label>
                          <input type={type} name={name} value={formData[name]}
                            onChange={handleInputChange} disabled={!editing} placeholder={placeholder}
                            style={inputStyle(editing)} />
                        </div>
                      ))}
                      <div className="prof-field">
                        <label>{t('profile.gender')}</label>
                        <select name="gender" value={formData.gender} onChange={handleInputChange} disabled={!editing} style={inputStyle(editing)}>
                          <option value="male">{t('profile.genderMale')}</option>
                          <option value="female">{t('profile.genderFemale')}</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div style={{ marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <div className="prof-section-bar" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('profile.contactInfo')}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      <div className="prof-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Mail size={13} style={{ color: '#9ca3af' }} /> {t('profile.emailAddress')}
                        </label>
                        <input type="email" name="email" value={formData.email}
                          onChange={handleInputChange} disabled={!editing} placeholder="your@email.com"
                          style={inputStyle(editing)} />
                      </div>
                      <div className="prof-field">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Phone size={13} style={{ color: '#9ca3af' }} /> {t('profile.phoneNumber')}
                        </label>
                        <input type="tel" name="phone" value={formData.phone}
                          onChange={handleInputChange} disabled={!editing} placeholder="+1 (555) 000-0000"
                          style={inputStyle(editing)} />
                      </div>
                    </div>
                  </div>

                  {/* About */}
                  <div style={{ marginBottom: editing ? '2rem' : 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem' }}>
                      <div className="prof-section-bar" />
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{t('profile.aboutMe')}</span>
                    </div>
                    <div className="prof-field">
                      <textarea name="bio" value={formData.bio} onChange={handleInputChange}
                        disabled={!editing} placeholder={t('profile.aboutPlaceholder')}
                        rows={4} style={{ ...inputStyle(editing), resize: 'vertical', lineHeight: 1.6 }} />
                    </div>
                  </div>

                  {/* Save Actions */}
                  {editing && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
                      <button onClick={() => setEditing(false)} style={{
                        padding: '0.75rem 1.5rem', background: 'var(--bg-card)',
                        border: '1.5px solid var(--border-light)', borderRadius: '12px',
                        color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                      }}>
                        {t('profile.cancel')}
                      </button>
                      <button onClick={handleSave} disabled={saving} style={{
                        padding: '0.75rem 1.5rem',
                        background: saving ? 'var(--bg-card)' : 'linear-gradient(135deg,#E31837,#B71C1C)',
                        border: 'none', borderRadius: '12px',
                        color: saving ? 'var(--text-muted)' : '#fff',
                        fontWeight: 700, fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', gap: '7px',
                        boxShadow: saving ? 'none' : '0 4px 14px rgba(227,24,55,0.35)',
                        transition: 'all 0.2s ease',
                      }}>
                        {saving ? (
                          <><div style={{ width: 15, height: 15, border: '2px solid #cbd5e1', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> {t('profile.saving')}</>
                        ) : (
                          <><Save size={15} /> {t('profile.saveChanges')}</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
    </>
  );
};

export default Profile;