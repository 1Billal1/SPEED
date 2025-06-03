declare module 'bibtex-parse-js' {
  interface BibTeXEntryTag {
    title?: string;
    author?: string;
    year?: string; 
    journal?: string;
    booktitle?: string;
    doi?: string;
    volume?: string;
    number?: string;
    pages?: string;
    month?: string;
    editor?: string;
    publisher?: string;
    address?: string;
    note?: string;
    url?: string;
    abstract?: string;
    keywords?: string;
    [key: string]: string | undefined;
  }

  interface BibTeXEntry {
    citationKey: string;     
    entryType: string;       
    entryTags: BibTeXEntryTag;
  }

  const parse: (bibtexString: string) => BibTeXEntry[];
  export default parse;
}