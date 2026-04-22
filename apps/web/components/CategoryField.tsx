'use client';

import { useId } from 'react';

type Props = {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: string[];
  placeholder?: string;
};

export function CategoryField({ id, label, value, onChange, suggestions, placeholder }: Props) {
  const rid = useId().replace(/:/g, '');
  const listId = `${rid}-catlist`;

  return (
    <div>
      <label htmlFor={id} className="input-label">
        {label}
      </label>
      <input
        id={id}
        type="text"
        list={listId}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="input"
        placeholder={placeholder ?? 'Pick from list or type a new one'}
        autoComplete="off"
      />
      <datalist id={listId}>
        {suggestions.map(s => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  );
}
