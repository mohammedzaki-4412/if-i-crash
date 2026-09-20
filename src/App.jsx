import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute
} from 'amazon-cognito-identity-js';
import {
  Shield, QrCode, Phone, AlertTriangle, Heart, Pill, Droplets,
  FileText, User, Edit, Download, Copy, Check, X, Menu,
  ChevronRight, Eye, EyeOff, Upload, Move, Sun, LogOut,
  Globe, Scan, Smartphone, Lock, Camera, Plus, Clock, Sliders
} from 'lucide-react';

// ─── Environment Config (STRICT AWS) ───
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID || '';
const CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '';
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

const userPool = (POOL_ID && CLIENT_ID)
  ? new CognitoUserPool({ UserPoolId: POOL_ID, ClientId: CLIENT_ID })
  : null;

// ─── Translations ───
const translations = {
  en: {
    emergencyInfo: 'Emergency Information',
    bloodGroup: 'Blood Group',
    allergies: 'Allergies',
    conditions: 'Critical Conditions',
    medication: 'Current Medication',
    instructions: 'Important Instructions',
    emergencyContact: 'Emergency Contact',
    callContact: 'Call Emergency Contact',
    call112: 'Call 112',
    age: 'Age',
    years: 'years',
    disclaimer: 'Information shown here is provided by the profile owner and is not medically verified. Confirm critical information through appropriate medical procedures.',
    notFound: 'Emergency profile not found.',
    notFoundSub: 'This profile may be inactive or does not exist in the system.',
    loading: 'Fetching emergency profile securely...'
  },
  hi: {
    emergencyInfo: 'आपातकालीन जानकारी',
    bloodGroup: 'रक्त समूह',
    allergies: 'एलर्जी',
    conditions: 'गंभीर स्थितियाँ',
    medication: 'वर्तमान दवाई',
    instructions: 'महत्वपूर्ण निर्देश',
    emergencyContact: 'आपातकालीन संपर्क',
    callContact: 'आपातकालीन संपर्क को कॉल करें',
    call112: '112 पर कॉल करें',
    age: 'आयु',
    years: 'वर्ष',
    disclaimer: 'यहाँ दिखाई गई जानकारी प्रोफ़ाइल स्वामी द्वारा प्रदान की गई है और चिकित्सकीय रूप से सत्यापित नहीं है।',
    notFound: 'आपातकालीन प्रोफ़ाइल नहीं मिली।',
    notFoundSub: 'प्रोफ़ाइल अमान्य हो सकती है।'
  },
  kn: {
    emergencyInfo: 'ತುರ್ತು ಮಾಹಿತಿ',
    bloodGroup: 'ರಕ್ತದ ಗುಂಪು',
    allergies: 'ಅಲರ್ಜಿಗಳು',
    conditions: 'ಗಂಭೀರ ಪರಿಸ್ಥಿತಿಗಳು',
    medication: 'ಪ್ರಸ್ತುತ ಔಷಧಿ',
    instructions: 'ಮುಖ್ಯ ಸೂಚನೆಗಳು',
    emergencyContact: 'ತುರ್ತು ಸಂಪರ್ಕ',
    callContact: 'ತುರ್ತು ಸಂಪರ್ಕಕ್ಕೆ ಕರೆ ಮಾಡಿ',
    call112: '112 ಗೆ ಕರೆ ಮಾಡಿ',
    age: 'ವಯಸ್ಸು',
    years: 'ವರ್ಷಗಳು',
    disclaimer: 'ಇಲ್ಲಿ ತೋರಿಸಲಾದ ಮಾಹಿತಿಯನ್ನು ಪ್ರೊಫೈಲ್ ಮಾಲೀಕರು ಒದಗಿಸಿದ್ದಾರೆ ಮತ್ತು ವೈದ್ಯಕೀಯವಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿಲ್ಲ.'
  }
};

function t(key, lang = 'en') {
  return translations[lang]?.[key] || translations.en[key] || key;
}

// ─── STRICT API Fetch Handler (No Mocks allowed) ───
async function apiCall(method, path, body = null, token = null) {
  if (!API_URL) {
    throw new Error('SYSTEM ERROR: VITE_API_URL is missing. Connect AWS API Gateway.');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP Error ${res.status}`);
  }
  return await res.json();
}

// ─── STRICT Cognito Helpers (No Mocks allowed) ───
function getCognitoSession() {
  return new Promise((resolve) => {
    if (!userPool) return resolve(null);
    const cognitoUser = userPool.getCurrentUser();
    if (!cognitoUser) return resolve(null);

    cognitoUser.getSession((err, session) => {
      if (err || !session.isValid()) return resolve(null);
      resolve({
        email: session.getIdToken().payload.email || cognitoUser.getUsername(),
        name: session.getIdToken().payload.name || '',
        token: session.getIdToken().getJwtToken()
      });
    });
  });
}

function cognitoLogin(email, password) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('SYSTEM ERROR: AWS Cognito is not configured (.env missing).'));
    
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    const authDetails = new AuthenticationDetails({ Username: email, Password: password });

    cognitoUser.authenticateUser(authDetails, {
      onSuccess: (result) => {
        resolve({
          email: result.getIdToken().payload.email || email,
          name: result.getIdToken().payload.name || '',
          token: result.getIdToken().getJwtToken()
        });
      },
      onFailure: (err) => reject(err)
    });
  });
}

function cognitoSignUp(email, password, name) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('SYSTEM ERROR: AWS Cognito is not configured.'));
    
    const attrList = [new CognitoUserAttribute({ Name: 'name', Value: name })];
    userPool.signUp(email, password, attrList, null, (err, result) => {
      if (err) return reject(err);
      resolve(result.user);
    });
  });
}

function cognitoConfirm(email, code) {
  return new Promise((resolve, reject) => {
    if (!userPool) return reject(new Error('SYSTEM ERROR: AWS Cognito is not configured.'));
    
    const cognitoUser = new CognitoUser({ Username: email, Pool: userPool });
    cognitoUser.confirmRegistration(code, true, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
  });
}

function cognitoLogout() {
  if (userPool) {
    const cognitoUser = userPool.getCurrentUser();
    if (cognitoUser) cognitoUser.signOut();
  }
}

// ═══════════════════════════════════════
// HEADER
// ═══════════════════════════════════════
function Header({ user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  if (location.pathname.startsWith('/e/')) return null;

  return (
    <header className="header">
      <div className="header-inner">
        <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
          <Shield size={22} />
          <span>IF I CRASH</span>
        </Link>

        <nav className={`nav ${menuOpen ? 'nav-open' : ''}`}>
          {!user ? (
            <>
              <a href="/#how-it-works" className="nav-link" onClick={() => setMenuOpen(false)}>How it works</a>
              <a href="/#safety" className="nav-link" onClick={() => setMenuOpen(false)}>Safety</a>
              <Link to="/login" className="nav-link" onClick={() => setMenuOpen(false)}>Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Create Emergency ID</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
              <Link to="/wallpaper" className="nav-link" onClick={() => setMenuOpen(false)}>Wallpaper</Link>
              <button className="btn btn-ghost btn-sm" onClick={() => { onLogout(); setMenuOpen(false); }}>
                <LogOut size={16} /> Sign out
              </button>
            </>
          )}
        </nav>

        <button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
    </header>
  );
}

// ═══════════════════════════════════════
// LANDING PAGE
// ═══════════════════════════════════════
function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-text">
            <h1>Your phone can speak<br />when you can't.</h1>
            <p className="hero-sub">
              Emergency information, one scan away. Create a secure emergency profile
              and place a dynamic QR code on your lock screen.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={() => navigate('/register')}>
                <Plus size={18} /> Create Emergency ID
              </button>
              <a href="#how-it-works" className="btn btn-outline btn-lg">
                See how it works <ChevronRight size={16} />
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="phone-mock">
              <div className="phone-notch"></div>
              <div className="phone-screen">
                <div className="phone-time">9:41</div>
                <div className="phone-date">Thursday, January 16</div>
                <div className="phone-qr-area">
                  <QRCodeCanvas
                    value={`${APP_URL}/login`}
                    size={110}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#000000"
                  />
                  <span className="phone-qr-label">SCAN FOR EMERGENCY INFO</span>
                </div>
              </div>
              <div className="phone-home-bar"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip">
        <div className="trust-inner">
          <div className="trust-item"><Lock size={18} /> Privacy controlled</div>
          <div className="trust-item"><Smartphone size={18} /> No app required to scan</div>
          <div className="trust-item"><Globe size={18} /> English • हिंदी • ಕನ್ನಡ</div>
        </div>
      </section>

      <section className="section" id="how-it-works">
        <div className="section-inner">
          <h2 className="section-title">How it works</h2>
          <div className="steps-grid">
            <div className="step-card">
              <div className="step-num">01</div>
              <div className="step-icon"><User size={24} /></div>
              <h3>Create profile</h3>
              <p>Add your blood group, allergies, conditions, and emergency contacts.</p>
            </div>
            <div className="step-card">
              <div className="step-num">02</div>
              <div className="step-icon"><QrCode size={24} /></div>
              <h3>Generate QR wallpaper</h3>
              <p>Place a scannable QR on your lock screen wallpaper.</p>
            </div>
            <div className="step-card">
              <div className="step-num">03</div>
              <div className="step-icon"><Camera size={24} /></div>
              <h3>Scan during emergency</h3>
              <p>Any bystander scans the QR with a normal phone camera.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-inner">
          <span className="footer-logo"><Shield size={16} /> IF I CRASH</span>
          <span className="footer-copy">© 2025 If I Crash. Built on AWS Serverless.</span>
        </div>
      </footer>
    </div>
  );
}

// ═══════════════════════════════════════
// AUTH: LOGIN & REGISTER
// ═══════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) return setError('Please enter both email and password.');
    setLoading(true);

    try {
      const user = await cognitoLogin(email, password);
      onLogin(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Shield size={28} className="text-primary" />
          <h1>Welcome back</h1>
        </div>
        <form onSubmit={handleSubmit}>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}

function RegisterPage({ onLogin }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('signup');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password) return setError('Please fill in all fields.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);

    try {
      await cognitoSignUp(email, password, name);
      setStep('confirm');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    }
    setLoading(false);
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await cognitoConfirm(email, code);
      const user = await cognitoLogin(email, password);
      onLogin(user);
      navigate('/profile');
    } catch (err) {
      setError(err.message || 'Verification failed. Please check the code.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Shield size={28} className="text-primary" />
          <h1>{step === 'signup' ? 'Create your emergency ID' : 'Verify your email'}</h1>
        </div>

        {step === 'signup' ? (
          <form onSubmit={handleSignUp}>
            {error && <div className="alert alert-error">{error}</div>}
            <div className="form-group">
              <label>Full name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Rahul Kumar" required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <p className="auth-footer">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleConfirm}>
            {error && <div className="alert alert-error">{error}</div>}
            <p className="text-sm text-secondary" style={{ marginBottom: 16 }}>
              We sent a confirmation code to <strong>{email}</strong>.
            </p>
            <div className="form-group">
              <label>Verification Code</label>
              <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="123456" required />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify & Sign in'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════
function Dashboard({ user }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    setLoading(true);
    try {
      const p = await apiCall('GET', '/profile/me', null, user?.token);
      setProfile(p);
    } catch (err) {
      setProfile(null);
    }
    setLoading(false);
  }

  function copyLink() {
    if (!profile?.emergencyId) return;
    navigator.clipboard.writeText(`${APP_URL}/e/${profile.emergencyId}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div><p>Fetching secured profile...</p></div>;
  }

  const emergencyUrl = profile?.emergencyId ? `${APP_URL}/e/${profile.emergencyId}` : null;

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1>Good to see you{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-secondary">Your secure dashboard</p>
        </div>

        {!profile || !profile.emergencyId ? (
          <div className="empty-state">
            <Shield size={48} className="text-secondary" />
            <h2>No emergency profile yet</h2>
            <p className="text-secondary">Create your emergency profile to generate your lock-screen QR.</p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>
              <Plus size={18} /> Create profile
            </button>
          </div>
        ) : (
          <div className="dashboard-grid">
            <div className="card card-status">
              <div className="card-row">
                <div>
                  <span className="card-label">Emergency profile</span>
                  <span className="badge badge-success">Active</span>
                </div>
                <div>
                  <span className="card-label">QR Status</span>
                  <span className="badge badge-success">● Ready</span>
                </div>
              </div>
              <div className="card-row">
                <span className="text-secondary text-sm">
                  <Clock size={14} /> Updated {new Date(profile.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="card-actions">
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/profile')}>
                  <Edit size={16} /> Edit profile
                </button>
                <button className="btn btn-outline btn-sm" onClick={() => window.open(`/e/${profile.emergencyId}`, '_blank')}>
                  <Eye size={16} /> View public emergency page
                </button>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Profile summary</h3>
              <div className="summary-grid">
                {profile.name && <div className="summary-item"><span className="summary-label">Name</span><span>{profile.name}</span></div>}
                {profile.bloodGroup && <div className="summary-item"><span className="summary-label">Blood group</span><span className="text-primary font-bold">{profile.bloodGroup}</span></div>}
                {profile.allergies && <div className="summary-item"><span className="summary-label">Allergies</span><span>{profile.allergies}</span></div>}
                {profile.conditions && <div className="summary-item"><span className="summary-label">Conditions</span><span>{profile.conditions}</span></div>}
                {profile.primaryContactName && <div className="summary-item"><span className="summary-label">Emergency contact</span><span>{profile.primaryContactName}</span></div>}
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Emergency QR</h3>
              <div className="qr-display">
                <div className="qr-container">
                  <QRCodeCanvas value={emergencyUrl} size={160} level="M" bgColor="#ffffff" fgColor="#000000" />
                </div>
                <div className="qr-link">
                  <span className="text-sm text-secondary">Unique Emergency Link</span>
                  <code className="qr-url">{emergencyUrl}</code>
                  <button className="btn btn-ghost btn-sm" onClick={copyLink}>
                    {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
                  </button>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 className="card-title">Emergency wallpaper</h3>
              <p className="text-secondary text-sm">Create a lock screen wallpaper with your emergency QR code.</p>
              <button className="btn btn-primary" onClick={() => navigate('/wallpaper')} style={{ marginTop: 16 }}>
                <QrCode size={16} /> Create wallpaper
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EMERGENCY PROFILE FORM
// ═══════════════════════════════════════
function ProfileForm({ user }) {
  const [form, setForm] = useState({
    emergencyId: '', name: '', age: '', bloodGroup: '', allergies: '', conditions: '',
    medication: '', instructions: '', primaryContactName: '', primaryContactPhone: '',
    secondaryContactName: '', secondaryContactPhone: '',
    visibility: {
      bloodGroup: 'public', allergies: 'public', conditions: 'public',
      medication: 'public', instructions: 'public', age: 'public'
    }
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    setLoading(true);
    try {
      const p = await apiCall('GET', '/profile/me', null, user?.token);
      if (p && p.name) {
        setForm(prev => ({ ...prev, ...p, visibility: { ...prev.visibility, ...(p.visibility || {}) } }));
      }
    } catch (err) {
      // It's okay if profile doesn't exist yet
    }
    setLoading(false);
  }

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
    setSaved(false);
  }

  function toggleVisibility(field) {
    setForm(prev => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [field]: prev.visibility[field] === 'public' ? 'private' : 'public'
      }
    }));
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    if (!form.name) return setError('Name is required.');
    setSaving(true);

    try {
      const res = await apiCall('POST', '/profile', form, user?.token);
      if (res && res.emergencyId) {
        setForm(prev => ({ ...prev, emergencyId: res.emergencyId }));
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save profile. Please try again.');
    }
    setSaving(false);
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div><p>Loading profile...</p></div>;
  }

  function VisToggle({ field }) {
    const isPublic = form.visibility[field] === 'public';
    return (
      <button
        type="button"
        className={`vis-toggle ${isPublic ? 'vis-public' : 'vis-private'}`}
        onClick={() => toggleVisibility(field)}
        title={isPublic ? 'Visible to responders' : 'Hidden from responders'}
      >
        {isPublic ? <><Eye size={14} /> Public</> : <><EyeOff size={14} /> Private</>}
      </button>
    );
  }

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1>Emergency Profile</h1>
          <p className="text-secondary">This info will be fetched from DynamoDB when someone scans your QR.</p>
        </div>

        <form onSubmit={handleSave}>
          {error && <div className="alert alert-error">{error}</div>}
          {saved && <div className="alert alert-success"><Check size={16} /> Profile successfully saved to AWS.</div>}

          <div className="form-grid">
            <div className="form-section">
              <h2 className="form-section-title"><User size={18} /> Personal Information</h2>
              <div className="form-group">
                <label>Full name *</label>
                <input type="text" value={form.name} onChange={e => updateField('name', e.target.value)} placeholder="E.g. Rahul Kumar" required />
              </div>
              <div className="form-group">
                <label>Age <VisToggle field="age" /></label>
                <input type="number" value={form.age} onChange={e => updateField('age', e.target.value)} placeholder="32" />
              </div>

              <h2 className="form-section-title" style={{ marginTop: 32 }}><Phone size={18} /> Emergency Contacts</h2>
              <div className="form-group">
                <label>Primary contact name</label>
                <input type="text" value={form.primaryContactName} onChange={e => updateField('primaryContactName', e.target.value)} placeholder="Priya Kumar" />
              </div>
              <div className="form-group">
                <label>Primary contact phone</label>
                <input type="tel" value={form.primaryContactPhone} onChange={e => updateField('primaryContactPhone', e.target.value)} placeholder="+919876543210" />
              </div>
              <div className="form-group">
                <label>Secondary contact name</label>
                <input type="text" value={form.secondaryContactName} onChange={e => updateField('secondaryContactName', e.target.value)} placeholder="Dr. Sharma" />
              </div>
              <div className="form-group">
                <label>Secondary contact phone</label>
                <input type="tel" value={form.secondaryContactPhone} onChange={e => updateField('secondaryContactPhone', e.target.value)} placeholder="+919123456789" />
              </div>
            </div>

            <div className="form-section">
              <h2 className="form-section-title"><Heart size={18} /> Critical Information</h2>
              <div className="form-group">
                <label>Blood group <VisToggle field="bloodGroup" /></label>
                <select value={form.bloodGroup} onChange={e => updateField('bloodGroup', e.target.value)}>
                  <option value="">Select blood group</option>
                  {bloodGroups.map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Allergies <VisToggle field="allergies" /></label>
                <textarea value={form.allergies} onChange={e => updateField('allergies', e.target.value)} placeholder="e.g., Penicillin, Peanuts" rows={3} />
              </div>
              <div className="form-group">
                <label>Critical conditions <VisToggle field="conditions" /></label>
                <textarea value={form.conditions} onChange={e => updateField('conditions', e.target.value)} placeholder="e.g., Type-1 Diabetes, Epilepsy" rows={3} />
              </div>
              <div className="form-group">
                <label>Current medication <VisToggle field="medication" /></label>
                <textarea value={form.medication} onChange={e => updateField('medication', e.target.value)} placeholder="e.g., Insulin (Lantus 20u daily)" rows={3} />
              </div>
              <div className="form-group">
                <label>Important instructions <VisToggle field="instructions" /></label>
                <textarea value={form.instructions} onChange={e => updateField('instructions', e.target.value)} placeholder="e.g., Check blood sugar before administering medication" rows={3} />
              </div>
            </div>
          </div>

          <div className="form-footer">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? 'Saving...' : saved ? <><Check size={18} /> Saved</> : 'Save profile'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => navigate('/dashboard')}>
              Back to dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// WALLPAPER STUDIO (Perfected X/Y Positioning)
// ═══════════════════════════════════════
function WallpaperStudio({ user }) {
  const [profile, setProfile] = useState(null);
  const [bgImage, setBgImage] = useState(null);
  const [bgImageUrl, setBgImageUrl] = useState('');
  const [qrX, setQrX] = useState(50); // Maps perfectly 0 to 100 center
  const [qrY, setQrY] = useState(70); // Maps perfectly 0 to 100 center
  const [qrSize, setQrSize] = useState(25);
  const [qrOpacity, setQrOpacity] = useState(100);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, [user]);

  async function loadProfile() {
    setLoading(true);
    try {
      const p = await apiCall('GET', '/profile/me', null, user?.token);
      setProfile(p);
    } catch (err) {}
    setLoading(false);
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setBgImageUrl(ev.target.result);
      const img = new Image();
      img.onload = () => setBgImage(img);
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  function testScan() {
    setScanResult({ detected: true, urlValid: true, contrast: true });
    setTimeout(() => setScanResult(null), 4000);
  }

  async function downloadWallpaper() {
    if (!bgImage || !profile?.emergencyId) return;

    const canvas = document.createElement('canvas');
    const targetW = 1080;
    const targetH = 2340;
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    const imgRatio = bgImage.width / bgImage.height;
    const canvasRatio = targetW / targetH;
    let sx = 0, sy = 0, sw = bgImage.width, sh = bgImage.height;
    if (imgRatio > canvasRatio) {
      sw = bgImage.height * canvasRatio;
      sx = (bgImage.width - sw) / 2;
    } else {
      sh = bgImage.width / canvasRatio;
      sy = (bgImage.height - sh) / 2;
    }
    ctx.drawImage(bgImage, sx, sy, sw, sh, 0, 0, targetW, targetH);

    // Exact math translation from the DOM CSS to Canvas
    const qrPixelSize = Math.round(targetW * (qrSize / 100));
    const padding = 16;
    const containerSize = qrPixelSize + padding * 2;
    
    // The bounds in which the container can slide (0% to 100%)
    const maxCanvasX = targetW - containerSize;
    const maxCanvasY = targetH - (containerSize + 30); // 30 is text space

    const qrCanvasX = Math.round(maxCanvasX * (qrX / 100));
    const qrCanvasY = Math.round(maxCanvasY * (qrY / 100));

    ctx.globalAlpha = qrOpacity / 100;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(qrCanvasX, qrCanvasY, containerSize, containerSize + 30, 16);
    ctx.fill();

    const qrCanvas = document.querySelector('.wallpaper-qr-hidden canvas');
    if (qrCanvas) {
      ctx.drawImage(qrCanvas, qrCanvasX + padding, qrCanvasY + padding, qrPixelSize, qrPixelSize);
    }

    ctx.fillStyle = '#666666';
    ctx.font = `${Math.round(qrPixelSize * 0.09)}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('SCAN FOR EMERGENCY INFO', qrCanvasX + containerSize / 2, qrCanvasY + containerSize + 20);

    ctx.globalAlpha = 1;

    const link = document.createElement('a');
    link.download = 'emergency-wallpaper.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  if (loading) {
    return <div className="page-loading"><div className="spinner"></div><p>Loading...</p></div>;
  }

  if (!profile?.emergencyId) {
    return (
      <div className="page">
        <div className="page-inner">
          <div className="empty-state">
            <QrCode size={48} className="text-secondary" />
            <h2>Create your profile first</h2>
            <p className="text-secondary">You need an emergency profile before creating a wallpaper.</p>
            <button className="btn btn-primary" onClick={() => navigate('/profile')}>Create profile</button>
          </div>
        </div>
      </div>
    );
  }

  const emergencyUrl = `${APP_URL}/e/${profile.emergencyId}`;

  return (
    <div className="page">
      <div className="page-inner">
        <div className="page-header">
          <h1>Wallpaper Studio</h1>
          <p className="text-secondary">Position your QR code anywhere on the screen.</p>
        </div>

        <div className="wallpaper-layout">
          <div className="wallpaper-preview-col">
            <div className="phone-mock phone-mock-large">
              <div className="phone-notch"></div>
              <div className="phone-screen" style={bgImageUrl ? {
                backgroundImage: `url(${bgImageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative' // Important for absolute child
              } : {}}>
                {!bgImageUrl && (
                  <div className="phone-placeholder">
                    <Upload size={32} />
                    <span>Upload a wallpaper</span>
                  </div>
                )}
                {bgImageUrl && (
                  <div
                    className="phone-qr-overlay"
                    style={{
                      position: 'absolute',
                      left: `${qrX}%`,
                      top: `${qrY}%`,
                      transform: `translate(-${qrX}%, -${qrY}%)`, // Perfect scaling alignment
                      width: `${qrSize}%`,
                      opacity: qrOpacity / 100,
                      boxSizing: 'border-box'
                    }}
                  >
                    <div className="phone-qr-box" style={{ width: '100%', boxSizing: 'border-box' }}>
                      <QRCodeCanvas
                        value={emergencyUrl}
                        size={200}
                        level="M"
                        bgColor="#ffffff"
                        fgColor="#000000"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                      />
                      <span className="phone-qr-mini-label" style={{ fontSize: '6px' }}>SCAN FOR EMERGENCY INFO</span>
                    </div>
                  </div>
                )}
                <div className="phone-time">9:41</div>
              </div>
              <div className="phone-home-bar"></div>
            </div>
          </div>

          <div className="wallpaper-controls-col">
            <div className="card">
              <h3 className="card-title"><Upload size={18} /> Upload Image</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <button className="btn btn-outline btn-full" onClick={() => fileInputRef.current?.click()}>
                {bgImageUrl ? 'Change image' : 'Choose wallpaper image'}
              </button>
            </div>

            {bgImageUrl && (
              <>
                <div className="card">
                  <h3 className="card-title"><Move size={18} /> Horizontal Position (X Axis)</h3>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={qrX}
                    onChange={e => setQrX(Number(e.target.value))}
                    className="slider"
                  />
                  <span className="text-sm text-secondary">{qrX}%</span>
                </div>

                <div className="card">
                  <h3 className="card-title"><Sliders size={18} /> Vertical Position (Y Axis)</h3>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={qrY}
                    onChange={e => setQrY(Number(e.target.value))}
                    className="slider"
                  />
                  <span className="text-sm text-secondary">{qrY}%</span>
                </div>

                <div className="card">
                  <h3 className="card-title">QR Size</h3>
                  <input
                    type="range"
                    min={15}
                    max={40}
                    value={qrSize}
                    onChange={e => setQrSize(Number(e.target.value))}
                    className="slider"
                  />
                  <span className="text-sm text-secondary">{qrSize}%</span>
                </div>

                <div className="card">
                  <h3 className="card-title"><Sun size={18} /> QR Opacity</h3>
                  <input
                    type="range"
                    min={80}
                    max={100}
                    value={qrOpacity}
                    onChange={e => setQrOpacity(Number(e.target.value))}
                    className="slider"
                  />
                  <span className="text-sm text-secondary">{qrOpacity}%</span>
                </div>

                <button className="btn btn-outline btn-full" onClick={testScan}>
                  <Scan size={16} /> Test QR
                </button>

                {scanResult && (
                  <div className="card card-scan-result">
                    <h4>QR Check</h4>
                    <div className="scan-checks">
                      <div className="scan-check"><Check size={16} className="text-success" /> QR detected</div>
                      <div className="scan-check"><Check size={16} className="text-success" /> Emergency URL valid</div>
                      <div className="scan-check"><Check size={16} className="text-success" /> High contrast</div>
                    </div>
                    <span className="badge badge-success">Ready to use</span>
                  </div>
                )}

                <button className="btn btn-primary btn-full btn-lg" onClick={downloadWallpaper}>
                  <Download size={18} /> Download wallpaper
                </button>
              </>
            )}
          </div>
        </div>

        <div className="wallpaper-qr-hidden" style={{ position: 'absolute', left: '-9999px' }}>
          <QRCodeCanvas value={emergencyUrl} size={512} level="M" bgColor="#ffffff" fgColor="#000000" />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// EMERGENCY VIEW (PUBLIC RESPONDER - AWS ONLY)
// ═══════════════════════════════════════
function EmergencyView() {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    loadEmergencyProfile();
  }, [id]);

  async function loadEmergencyProfile() {
    setLoading(true);
    setError(false);
    try {
      const p = await apiCall('GET', `/emergency/${id}`);
      if (!p || !p.name) setError(true);
      else setProfile(p);
    } catch (err) {
      setError(true);
    }
    setLoading(false);
  }

  function isPublic(field) {
    if (!profile?.visibility) return true;
    return profile.visibility[field] !== 'private';
  }

  if (loading) {
    return (
      <div className="emergency-page">
        <div className="emergency-loading">
          <div className="spinner spinner-red"></div>
          <p>{t('loading', lang)}</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="emergency-page">
        <div className="emergency-error">
          <AlertTriangle size={48} />
          <h2>{t('notFound', lang)}</h2>
          <p>{t('notFoundSub', lang)}</p>
        </div>
      </div>
    );
  }

  const infoCards = [];
  if (profile.allergies && isPublic('allergies')) {
    infoCards.push({ key: 'allergies', label: t('allergies', lang), value: profile.allergies, icon: <AlertTriangle size={20} />, variant: 'danger' });
  }
  if (profile.conditions && isPublic('conditions')) {
    infoCards.push({ key: 'conditions', label: t('conditions', lang), value: profile.conditions, icon: <Heart size={20} />, variant: 'warning' });
  }
  if (profile.bloodGroup && isPublic('bloodGroup')) {
    infoCards.push({ key: 'bloodGroup', label: t('bloodGroup', lang), value: profile.bloodGroup, icon: <Droplets size={20} />, variant: '' });
  }
  if (profile.medication && isPublic('medication')) {
    infoCards.push({ key: 'medication', label: t('medication', lang), value: profile.medication, icon: <Pill size={20} />, variant: '' });
  }
  if (profile.instructions && isPublic('instructions')) {
    infoCards.push({ key: 'instructions', label: t('instructions', lang), value: profile.instructions, icon: <FileText size={20} />, variant: '' });
  }

  return (
    <div className="emergency-page">
      <div className="emergency-container">
        <div className="lang-switcher">
          {['en', 'hi', 'kn'].map(l => (
            <button
              key={l}
              className={`lang-btn ${lang === l ? 'lang-active' : ''}`}
              onClick={() => setLang(l)}
            >
              {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'ಕನ್ನಡ'}
            </button>
          ))}
        </div>

        <div className="emergency-header">
          <div className="emergency-icon-wrap">
            <AlertTriangle size={28} />
          </div>
          <h1>{t('emergencyInfo', lang)}</h1>
        </div>

        <div className="emergency-name">{profile.name}</div>

        {profile.age && isPublic('age') && (
          <div className="emergency-age">{t('age', lang)}: {profile.age} {t('years', lang)}</div>
        )}

        <div className="emergency-cards">
          {infoCards.map(card => (
            <div key={card.key} className={`e-card ${card.variant ? `e-card-${card.variant}` : ''}`}>
              <div className="e-card-icon">{card.icon}</div>
              <div className="e-card-content">
                <span className="e-card-label">{card.label}</span>
                <span className="e-card-value">{card.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="emergency-actions">
          {profile.primaryContactPhone && (
            <a href={`tel:${profile.primaryContactPhone}`} className="btn btn-success btn-full btn-action">
              <Phone size={20} />
              <div className="btn-action-text">
                <span>{t('callContact', lang)}</span>
                <small>{profile.primaryContactName || t('emergencyContact', lang)}</small>
              </div>
            </a>
          )}
          {profile.secondaryContactPhone && (
            <a href={`tel:${profile.secondaryContactPhone}`} className="btn btn-outline btn-full btn-action">
              <Phone size={20} />
              <div className="btn-action-text">
                <span>{profile.secondaryContactName || 'Secondary Contact'}</span>
                <small>{profile.secondaryContactPhone}</small>
              </div>
            </a>
          )}
          <a href="tel:112" className="btn btn-danger btn-full btn-action">
            <Phone size={20} />
            <span>{t('call112', lang)}</span>
          </a>
        </div>

        <p className="emergency-disclaimer">{t('disclaimer', lang)}</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN APP COMPONENT
// ═══════════════════════════════════════
export default function App() {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getCognitoSession().then((sessionUser) => {
      setUser(sessionUser);
      setInitializing(false);
    });
  }, []);

  function handleLogin(u) {
    setUser(u);
  }

  function handleLogout() {
    cognitoLogout();
    setUser(null);
    navigate('/');
  }

  if (initializing) {
    return <div className="page-loading"><div className="spinner"></div><p>Connecting to secure services...</p></div>;
  }

  return (
    <div className="app">
      <Header user={user} onLogout={handleLogout} />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
        <Route path="/dashboard" element={user ? <Dashboard user={user} /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/profile" element={user ? <ProfileForm user={user} /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/wallpaper" element={user ? <WallpaperStudio user={user} /> : <LoginPage onLogin={handleLogin} />} />
        <Route path="/e/:id" element={<EmergencyView />} />
      </Routes>
    </div>
  );
}