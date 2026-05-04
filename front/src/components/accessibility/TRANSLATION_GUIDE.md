# How to Translate ALL Page Content

This guide shows how to use translations in any page component so that **all content translates when users change the language**.

## Quick Start

### 1. Import the Translation Hook

```javascript
import { useTranslation } from 'react-i18next';

// In your component:
const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('student.dashboard')}</h1>
      <p>{t('messages.welcome')}</p>
    </div>
  );
};
```

### 2. Translation Key Format

Keys follow the pattern: `namespace.key`

```javascript
t('student.dashboard')        // → "Student Dashboard" / "Tableau de bord étudiant" / "لوحة تحكم الطالب"
t('common.logout')            // → "Logout" / "Déconnexion" / "تسجيل الخروج"
t('login.welcomeTitle')       // → "Welcome to EvalAI Platform" / etc.
```

### 3. Common Namespaces

| Namespace | Use For |
|-----------|---------|
| `common` | Universal buttons, labels (Login, Logout, Save, etc.) |
| `login` | Login page content |
| `student` | Student dashboard & pages |
| `teacher` | Teacher dashboard & pages |
| `admin` | Admin dashboard & pages |
| `practice` | Practice session pages |
| `messages` | Messages, notifications, errors |
| `accessibility` | Voice assistant, language switcher |

## Examples

### Example 1: Simple Button Label

**Before (Hardcoded):**
```javascript
<button>Logout</button>
```

**After (Translated):**
```javascript
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const { t } = useTranslation();
  
  return <button>{t('common.logout')}</button>;
};
```

---

### Example 2: Form with Labels and Placeholders

**Before (Hardcoded):**
```javascript
<form>
  <label>Email</label>
  <input placeholder="Enter your email" />
  <label>Password</label>
  <input placeholder="Enter your password" />
  <button>Login</button>
</form>
```

**After (Translated):**
```javascript
import { useTranslation } from 'react-i18next';

const LoginForm = () => {
  const { t } = useTranslation();
  
  return (
    <form>
      <label>{t('common.email')}</label>
      <input placeholder={t('login.emailPlaceholder')} />
      <label>{t('common.password')}</label>
      <input placeholder={t('login.passwordPlaceholder')} />
      <button>{t('login.loginButton')}</button>
    </form>
  );
};
```

---

### Example 3: Dynamic Lists/Tables

**Before (Hardcoded):**
```javascript
const columns = [
  { header: 'Student Name', key: 'name' },
  { header: 'Score', key: 'score' },
  { header: 'Level', key: 'level' },
];
```

**After (Translated):**
```javascript
import { useTranslation } from 'react-i18next';

const StudentTable = () => {
  const { t } = useTranslation();
  
  const columns = [
    { header: t('common.name'), key: 'name' },
    { header: t('student.score'), key: 'score' },
    { header: t('student.level'), key: 'level' },
  ];
  
  return <table>{/* render columns */}</table>;
};
```

---

### Example 4: Error Messages

**Before (Hardcoded):**
```javascript
if (error) {
  return <div>An error occurred. Please try again.</div>;
}
```

**After (Translated):**
```javascript
import { useTranslation } from 'react-i18next';

const ErrorMessage = ({ error }) => {
  const { t } = useTranslation();
  
  if (error) {
    return <div>{t('messages.error')}: {error}</div>;
  }
};
```

---

### Example 5: Dashboard Titles & Sections

**Before (Hardcoded):**
```javascript
<h1>Student Dashboard</h1>
<section>
  <h2>Your Activity</h2>
  <p>Overall Score: {score}</p>
</section>
```

**After (Translated):**
```javascript
import { useTranslation } from 'react-i18next';

const StudentDashboard = ({ score }) => {
  const { t } = useTranslation();
  
  return (
    <>
      <h1>{t('student.dashboard')}</h1>
      <section>
        <h2>{t('student.activityTitle')}</h2>
        <p>{t('student.overallScore')}: {score}</p>
      </section>
    </>
  );
};
```

---

## Adding New Translations

### Step 1: Add Key to All Language Files

**src/locales/en.json:**
```json
{
  "mySection": {
    "myKey": "My English Text"
  }
}
```

**src/locales/fr.json:**
```json
{
  "mySection": {
    "myKey": "Mon texte en français"
  }
}
```

**src/locales/ar.json:**
```json
{
  "mySection": {
    "myKey": "نصي بالعربية"
  }
}
```

### Step 2: Use in Component

```javascript
<div>{t('mySection.myKey')}</div>

// Renders based on current language:
// EN: "My English Text"
// FR: "Mon texte en français"
// AR: "نصي بالعربية"
```

---

## Advanced Usage

### Fallback Values

```javascript
// If key doesn't exist, use fallback
t('nonexistent.key', 'Default text')
```

### Interpolation (Variables)

In your JSON:
```json
{
  "messages": {
    "welcome": "Welcome, {{name}}!"
  }
}
```

In component:
```javascript
<p>{t('messages.welcome', { name: 'John' })}</p>
```

---

## Important Notes

✅ **DO THIS:**
- Use translation keys everywhere
- Add new translations to ALL 3 language files
- Use consistent key naming
- Put UI text in appropriate namespaces

❌ **DON'T DO THIS:**
- Mix hardcoded and translated text
- Forget to add translations to FR or AR files
- Use generic key names (use `student.dashboard` not `title`)
- Store translated text in state if possible (keep it in render)

---

## Quick Reference: All Available Keys

See these files for all available translation keys:
- `src/locales/en.json` - English keys
- `src/locales/fr.json` - French translations
- `src/locales/ar.json` - Arabic translations

Search for the key you need, or add a new one following the pattern above!

---

## Testing Translations

1. Click the language switcher (top-right globe button)
2. Select a language (FR or AR)
3. All page content should translate instantly
4. Refresh page - language persists in localStorage

---

## Need Help?

- Check existing pages like `Login.jsx` for examples
- Look at language files to see available keys
- Use the translation hook: `const { t } = useTranslation();`
- Add new keys to all 3 language files simultaneously
