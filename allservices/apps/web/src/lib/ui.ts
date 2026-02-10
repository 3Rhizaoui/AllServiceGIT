// apps/web/src/lib/ui.ts
export const ui = {
  blue: '#2563eb',
  bg: '#f8fafc',
  border: '#e5e7eb',
  text: '#0b1f3a',
};

export function cardStyle(): React.CSSProperties {
  return {
    background: '#fff',
    border: `1px solid ${ui.border}`,
    borderRadius: 16,
    padding: 16,
  };
}

export function buttonBlue(disabled?: boolean): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${ui.blue}`,
    background: ui.blue,
    color: '#fff',
    fontWeight: 900,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.7 : 1,
  };
}

export function buttonGhost(): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    background: '#fff',
    color: '#111',
    fontWeight: 900,
    cursor: 'pointer',
  };
}

export function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    border: `1px solid ${ui.border}`,
    outline: 'none',
  };
}
