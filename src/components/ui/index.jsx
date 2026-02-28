import { useState } from 'react';

export function Input({ label, value, onChange, type = 'number', unit = 'mm', min, max, placeholder, step = 1 }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <div className="flex">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
        />
        {unit && (
          <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-lg text-slate-600 text-sm">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

export function TextInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
      />
    </div>
  );
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) {
  const baseStyles = 'px-4 py-2.5 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
    secondary: 'bg-white text-blue-600 border-2 border-blue-600 hover:bg-blue-50 active:bg-blue-100',
    danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-4 ${className}`}>
      {children}
    </div>
  );
}

export function Badge({ children, variant = 'default' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${variants[variant]}`}>
      {children}
    </span>
  );
}

export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-slate-300'}`}></div>
        <div className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}></div>
      </div>
      {label && <span className="text-sm text-slate-700">{label}</span>}
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base bg-white"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
