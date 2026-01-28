# Style Guide

Complete styling reference for maintaining consistent design across projects.

## 🎨 Colors

### Primary Palette

```css
--casino-bg: #100e11 /* Main background */ --casino-border: #1e2938
  /* Borders */ --casino-card: #131216 /* Card backgrounds */;
```

### Accent Colors

```css
--primary-purple: #7717ff /* Primary buttons/accents */
  --primary-purple-hover: #6412e6 --primary-purple-light: #6a14ed
  /* With 20% opacity for alerts */;
```

### Text Colors

```css
--text-primary: rgba(255, 255, 255, 0.87)
  --text-secondary: rgba(255, 255, 255, 0.7) --text-gray: #888
  --text-gray-300: #d1d5db --text-gray-400: #9ca3af --text-gray-600: #4b5563;
```

### Status Colors

#### Error/Red

```css
--error-border: rgba(239, 68, 68, 0.2) --error-bg: rgba(127, 29, 29, 0.8)
  --error-icon: #fca5a5;
```

#### Success/Green

```css
--success-border: rgba(34, 197, 94, 0.2) --success-bg: rgba(20, 83, 45, 0.8)
  --success-icon: #86efac;
```

#### Info/Blue

```css
--info-border: rgba(59, 130, 246, 0.2) --info-bg: rgba(23, 37, 84, 0.8)
  --info-icon: #93c5fd;
```

---

## 📐 Border Radius

```css
--radius-sm: 4px /* Small elements */ --radius-md: 6px /* Default */
  --radius-lg: 8px /* Cards */ --radius-xl: 12px /* Large cards */
  --radius-full: 9999px /* Pills/buttons */;
```

### Usage Examples

- Cards: `rounded-lg` (8px)
- Buttons: `rounded` (6px) or `rounded-full` (pill shape)
- Alerts: `rounded-lg` (8px)
- Modals: `rounded-md` (6px)

---

## 🔤 Typography

### Font Families

```css
font-family: "Aeonik", "Inter", sans-serif;
```

**Import:**

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap");
```

### Font Weights

```css
--font-normal: 400 --font-medium: 500;
```

**Note:** Never use bold (maximum weight is 500)

### Font Sizes

```css
--text-xs: 0.75rem /* 12px */ --text-sm: 0.875rem /* 14px */ --text-base: 1rem
  /* 16px */ --text-lg: 1.125rem /* 18px */ --text-xl: 1.25rem /* 20px */
  --text-2xl: 1.5rem /* 24px */ --text-3xl: 1.875rem /* 30px */;
```

---

## 🃏 Card Styles

### Standard Card

```jsx
<div className="bg-casino-card border border-casino-border rounded-lg px-4 py-2">
  {/* Content */}
</div>
```

### Stat Card (Minimal height)

```jsx
<div className="bg-casino-card border border-casino-border rounded-lg px-4 py-2 flex flex-col justify-center text-center min-h-[80px] space-y-1">
  <div className="flex items-center justify-center gap-2">
    {/* Icon */}
    <p className="text-lg font-medium font-aeonik text-white">{/* Value */}</p>
  </div>
  <h3 className="text-sm font-aeonik text-gray-400">{/* Label */}</h3>
</div>
```

### Interactive Card with Hover

```jsx
<div className="bg-casino-card border border-casino-border rounded-lg p-4 hover:border-white/20 transition-colors cursor-pointer">
  {/* Content */}
</div>
```

---

## 🔘 Button Styles

### Primary Button (Purple)

```jsx
<button className="px-6 py-3 bg-[#7717FF] hover:bg-[#6412E6] text-white rounded font-medium transition-all">
  Button Text
</button>
```

### Secondary Button (White)

```jsx
<button className="bg-white text-casino-bg px-8 py-3 rounded-full font-aeonik font-medium hover:bg-gray-200 transition-colors">
  Button Text
</button>
```

### Disabled State

```jsx
<button className="opacity-50 cursor-not-allowed" disabled>
  Button Text
</button>
```

---

## 🧭 Navbar Structure

### Desktop Navbar

```jsx
<nav className="w-full bg-casino-bg border-b border-casino-border">
  <div className="max-w-19xl mx-auto px-2 sm:px-4 lg:px-6">
    <div className="flex items-center justify-between h-20">
      {/* Left: Logo + Nav Links */}
      <div className="flex items-center space-x-8">
        {/* Logo */}
        <div className="flex-shrink-0">
          <Link
            to="/"
            className="text-white hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Logo" className="w-28 object-contain" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:block">
          <div className="flex items-baseline space-x-6">{/* Nav links */}</div>
        </div>
      </div>

      {/* Right: Social Icons + Connect Button */}
      <div className="hidden md:flex items-center space-x-4">
        {/* Social icons */}
        {/* Connect button */}
      </div>

      {/* Mobile menu button */}
      <div className="md:hidden">{/* Hamburger menu */}</div>
    </div>
  </div>
</nav>
```

### Active Link Style

```jsx
<Link
  to="/path"
  className={`py-1 text-base font-aeonik font-medium transition-colors ${
    isActive
      ? "text-white border-b-2 border-white"
      : "text-white hover:text-gray-300"
  }`}
>
  Link Text
</Link>
```

### Mobile Menu

```jsx
{
  isMobileMenuOpen && (
    <div className="md:hidden fixed inset-0 z-50 bg-casino-bg">
      {/* Close button */}
      <div className="flex justify-end p-4">
        <button
          onClick={toggleMobileMenu}
          className="text-white hover:text-gray-300 p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
        >
          {/* Close icon */}
        </button>
      </div>

      {/* Menu content */}
      <div className="flex flex-col h-full px-6 py-8">
        {/* Navigation links */}
        <div className="space-y-8 mb-auto">
          <Link
            to="/path"
            onClick={closeMobileMenu}
            className={`block text-2xl font-aeonik font-medium ${
              isActive ? "text-white" : "text-white/70 hover:text-white"
            }`}
          >
            Link Text
          </Link>
        </div>

        {/* Bottom section */}
        <div className="space-y-6">{/* Social icons + buttons */}</div>
      </div>
    </div>
  );
}
```

---

## 📏 Spacing System

```css
--space-1: 0.25rem /* 4px */ --space-2: 0.5rem /* 8px */ --space-3: 0.75rem
  /* 12px */ --space-4: 1rem /* 16px */ --space-6: 1.5rem /* 24px */
  --space-8: 2rem /* 32px */ --space-12: 3rem /* 48px */ --space-16: 4rem
  /* 64px */;
```

### Common Patterns

- Card padding: `px-4 py-2` or `p-4`
- Section spacing: `py-8` or `py-12`
- Grid gaps: `gap-2` or `gap-4`
- Button spacing: `px-6 py-3` or `px-8 py-4`

---

## 🌓 Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05) --shadow-md: 0 4px 6px -1px
  rgb(0 0 0 / 0.1) --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

**Usage:** `shadow-lg` for elevated cards, toasts, modals

---

## 🔔 Toast/Alert Styles

### Success Toast

```jsx
<div className="border-green-500/20 bg-green-950/80 border rounded-lg p-4 backdrop-blur-sm shadow-lg">
  {/* Content */}
</div>
```

### Error Toast

```jsx
<div className="border-red-500/20 bg-red-950/80 border rounded-lg p-4 backdrop-blur-sm shadow-lg">
  {/* Content */}
</div>
```

### Info Toast

```jsx
<div className="border-blue-500/20 bg-blue-950/80 border rounded-lg p-4 backdrop-blur-sm shadow-lg">
  {/* Content */}
</div>
```

### Info Banner

```jsx
<div className="border border-[#1E2938] bg-[#6A14ED]/20 rounded-lg p-4">
  {/* Content */}
</div>
```

---

## ✨ Animations

### Fade In Animation

```css
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

### Common Transitions

```css
transition-opacity      /* Opacity changes */
transition-colors       /* Color changes */
transition-all          /* All properties */
/* Default duration: 300ms */
```

---

## 🛠️ Special Utilities

### Disable User Selection

```css
* {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
```

### Hide Scrollbar

#### Webkit Browsers

```css
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}
```

#### Firefox

```css
html {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
```

### Backdrop Blur

```jsx
<div className="backdrop-blur-sm">{/* Content */}</div>
```

---

## 📱 Grid Layouts

### Stats Grid (4 columns)

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
  {/* Grid items */}
</div>
```

### Content Container

```jsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
  {/* Content */}
</div>
```

### Responsive Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid items */}
</div>
```

---

## 🎯 Icon Sizes

```css
--icon-sm: w-4 h-4 /* 16px */ --icon-md: w-5 h-5 /* 20px */ --icon-lg: w-6 h-6
  /* 24px */ --icon-xl: w-8 h-8 /* 32px */;
```

---

## ⚙️ Tailwind Config

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "casino-bg": "#100E11",
        "casino-border": "#1E2938",
        "casino-card": "#131216",
      },
      fontFamily: {
        aeonik: ["Aeonik", "Inter", "sans-serif"],
      },
      fontWeight: {
        normal: "400",
        medium: "500",
      },
    },
  },
  plugins: [],
};
```

---

## 📋 Base CSS (index.css)

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  font-family: "Aeonik", "Inter", sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.87);
  background-color: #100e11;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  /* Disable text selection */
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
  background-color: #100e11;
  color: rgba(255, 255, 255, 0.87);
  font-family: "Aeonik", "Inter", sans-serif;
  font-weight: 400;
  overflow-x: hidden;
}

/* Hide scrollbar for webkit browsers */
::-webkit-scrollbar {
  width: 0px;
  background: transparent;
}

/* Hide scrollbar for Firefox */
html {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* Never allow bold fonts, maximum medium weight */
* {
  max-font-weight: 500;
}

strong,
b {
  font-weight: 500 !important;
}

/* Animations */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```
