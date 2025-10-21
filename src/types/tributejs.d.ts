// Type declarations for tributejs
// Project: https://github.com/zurb/tribute
declare module 'tributejs' {
  interface TributeItem<T = any> {
    key: string;
    value: string;
    original: T;
  }

  interface TributeOptions<T = any> {
    trigger?: string;
    values?: T[] | ((text: string, cb: (data: T[]) => void) => void);
    lookup?: string | ((item: T, mentionText: string) => boolean);
    fillAttr?: string;
    selectTemplate?: (item: TributeItem<T>) => string;
    menuItemTemplate?: (item: TributeItem<T>) => string;
    noMatchTemplate?: () => string;
    menuContainer?: HTMLElement;
    replaceTextSuffix?: string;
    requireLeadingSpace?: boolean;
    allowSpaces?: boolean;
    searchOpts?: {
      pre?: string;
      post?: string;
      skip?: boolean;
    };
    menuShowMinLength?: number;
    menuItemLimit?: number;
    autocompleteMode?: boolean;
    autocompleteSeparator?: string;
  }

  class Tribute<T = any> {
    constructor(options: TributeOptions<T>);
    attach(element: HTMLElement): void;
    detach(element: HTMLElement): void;
    isActive: boolean;
    hideMenu(): void;
    showMenuForCollection(element: HTMLElement, collectionIndex?: number): void;
    append(index: number, values: T[], replace?: boolean): void;
  }

  export default Tribute;
}
