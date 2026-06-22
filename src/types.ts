export interface Publication {
  id: string;
  title: string;
  authors: string[];
  source: string;          // short venue, e.g. "IEEE VIS", "CHI"
  transaction?: string;    // full venue name
  year: number;
  abstract?: string;
  teaser?: string;         // relative path under /
  paper?: string;          // pdf path
  doi?: string;
  DOI?: string;
  video?: string;
  embedVideo?: string;
  demo?: string;
  system?: string;
  titleKey?: string[];     // awards / honors
}

export interface Slide {
  title: string;
  titleZh?: string;        // Chinese caption; system & paper names stay untranslated
  subtitle?: string;       // paper title — not translated
  imgSrc: string;          // relative path under /
  link?: string;           // e.g. "/publications/<id>"
}
