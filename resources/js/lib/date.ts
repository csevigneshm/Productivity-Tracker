// Always split YYYY-MM-DD directly to avoid UTC timezone shift in IST
const parseDate = (str: string): Date => {
    const datePart = str.split('T')[0];
    const [y, m, d] = datePart.split('-').map(Number);
    return new Date(y, m - 1, d);
};

const dateToStr = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export { dateToStr };

export const fmt = (str: string) =>
    parseDate(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDisplay = (str: string) =>
    parseDate(str).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', weekday: 'short' });

export const todayStr = (): string => dateToStr(new Date());

export const weekStart = (): string => {
    const d = new Date();
    d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1));
    return dateToStr(d);
};

export const weekEnd = (): string => {
    const d = new Date();
    d.setDate(d.getDate() + (d.getDay() === 0 ? 0 : 7 - d.getDay()));
    return dateToStr(d);
};

export const monthStart = (): string => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
};

export const monthEnd = (): string => {
    const d = new Date();
    return dateToStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
};
