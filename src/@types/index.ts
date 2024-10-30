export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<T>;

export type collection = any[]|Record<string, any>;

export type strORnum = string|number;