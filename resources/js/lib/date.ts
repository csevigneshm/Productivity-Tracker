// Always split YYYY-MM-DD directly to avoid UTC timezone shift in IST
const dateToStr = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const todayStr = (): string => dateToStr(new Date());

export const toDateStr = (value: unknown): string => {
    if (value == null || value === '') {
        return todayStr();
    }

    if (value instanceof Date) {
        return dateToStr(value);
    }

    if (typeof value === 'string') {
        return value.split('T')[0];
    }

    if (typeof value === 'number') {
        return dateToStr(new Date(value));
    }

    if (typeof value === 'object') {
        const record = value as Record<string, unknown>;

        if (typeof record.date === 'string') {
            return record.date.split('T')[0];
        }

        if (
            typeof record.year === 'number' &&
            typeof record.month === 'number' &&
            typeof record.day === 'number'
        ) {
            return `${record.year}-${String(record.month).padStart(2, '0')}-${String(record.day).padStart(2, '0')}`;
        }
    }

    return String(value).split('T')[0];
};

const parseDate = (value: unknown): Date => {
    const datePart = toDateStr(value);
    const [y, m, d] = datePart.split('-').map(Number);

    return new Date(y, m - 1, d);
};

export { dateToStr };

export const fmt = (value: unknown) =>
    parseDate(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });

export const fmtDisplay = (value: unknown) =>
    parseDate(value).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
    });

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
