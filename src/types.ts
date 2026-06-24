/**
 * A publication's venues. A paper carries its archival journal/outlet (generic,
 * e.g. Venue.TVCG) and/or its conference presentation (year-specific, e.g.
 * Venue.IEEEVIS2024). IEEE VIS / PacificVis-journal papers are archived in TVCG,
 * so they carry Venue.TVCG alongside the conference. Enum values are the display
 * labels and are what the JSON stores.
 */
export const Venue = {
  // journals / archival outlets
  TVCG: 'IEEE TVCG',
  CGA: 'IEEE CG&A',
  CGF: 'Computer Graphics Forum',
  TITS: 'IEEE TITS',
  TIST: 'ACM TIST',
  TiiS: 'ACM TiiS',
  TBD: 'IEEE TBD',
  TMM: 'IEEE TMM',
  IMWUT: 'ACM IMWUT',
  CVM: 'Computational Visual Media',
  ComputerScienceReview: 'Computer Science Review',
  VisualInformatics: 'Visual Informatics',
  JournalOfVisualization: 'Journal of Visualization',
  InformationVisualization: 'Information Visualization',
  JVLC: 'Journal of Visual Languages & Computing',
  JCADCG: 'Journal of Computer-Aided Design & Computer Graphics',
  JournalIntegrationTechnology: 'Journal of Integration Technology',
  InternetResearch: 'Internet Research',
  CommunicationResearch: 'Communication Research',
  PLOSOne: 'PLOS ONE',
  BMCSportsScienceMedicineRehabilitation: 'BMC Sports Science, Medicine and Rehabilitation',
  ClinicalNeurophysiology: 'Clinical Neurophysiology',
  JournalOfNeurosurgery: 'Journal of Neurosurgery',
  // conferences & tracks (year-specific)
  ACL2026Main: 'ACL 2026 Main',
  AAAI2024: 'AAAI 2024',
  AAAI2025: 'AAAI 2025',
  ACMMM2020Demo: 'ACM MM 2020 Demo',
  CCS2024: 'CCS 2024',
  ChinaVis2020: 'ChinaVis 2020',
  ChinaVis2024: 'ChinaVis 2024',
  CHI2018: 'CHI 2018',
  CHI2021: 'CHI 2021',
  CHI2023: 'CHI 2023',
  CHI2024: 'CHI 2024',
  CHI2025: 'CHI 2025',
  CHI2026: 'CHI 2026',
  Edutainment2016: 'Edutainment 2016',
  EuroVis2016: 'EuroVis 2016',
  EuroVis2018: 'EuroVis 2018',
  EuroVis2023: 'EuroVis 2023',
  ImmersiveAnalytics2017: 'Immersive Analytics 2017',
  IEEESciVis2015: 'IEEE SciVis 2015',
  IEEEVIS2016: 'IEEE VIS 2016',
  IEEEVIS2017: 'IEEE VIS 2017',
  IEEEVIS2018: 'IEEE VIS 2018',
  IEEEVIS2019: 'IEEE VIS 2019',
  IEEEVIS2020: 'IEEE VIS 2020',
  IEEEVIS2020ShortPaper: 'IEEE VIS 2020 Short Paper',
  IEEEVIS2021: 'IEEE VIS 2021',
  IEEEVIS2022: 'IEEE VIS 2022',
  IEEEVIS2023: 'IEEE VIS 2023',
  IEEEVIS2024: 'IEEE VIS 2024',
  IEEEVIS2025: 'IEEE VIS 2025',
  IEEEVISAP2021: 'IEEE VISAP 2021',
  IEEEVISAP2023: 'IEEE VISAP 2023',
  IEEEVR2024: 'IEEE VR 2024',
  ICML2026: 'ICML 2026',
  KDD2021: 'KDD 2021',
  KDD2025: 'KDD 2025',
  PacificVis2016: 'PacificVis 2016',
  PacificVis2019ConferenceTrack: 'PacificVis 2019 Conference Track',
  PacificVis2021ConferenceTrack: 'PacificVis 2021 Conference Track',
  PacificVis2021TVCGJournalTrack: 'PacificVis 2021 TVCG Journal Track',
  PacificVis2024ConferenceTrack: 'PacificVis 2024 Conference Track',
  PacificVis2024TVCGJournalTrack: 'PacificVis 2024 TVCG Journal Track',

  PacificVis2025ConferenceTrack: 'PacificVis 2025 Conference Track',
  PacificVis2026ConferenceTrack: 'PacificVis 2026 Conference Track',
  PacificVis2026TVCGJournalTrack: 'PacificVis 2026 TVCG Journal Track',
  SIGGRAPH2024ArtGallery: 'SIGGRAPH 2024 Art Gallery',
  SIGSPATIAL2016: 'SIGSPATIAL 2016',
  SIGSPATIAL2017ShortPaper: 'SIGSPATIAL 2017 Short Paper',
  SIGSPATIAL2023: 'SIGSPATIAL 2023',
  UIST2023: 'UIST 2023',
  UIST2024: 'UIST 2024',
  UIST2025: 'UIST 2025',
  VDSIEEEVIS2023: 'VDS @ IEEE VIS 2023',
} as const;

export type Venue = (typeof Venue)[keyof typeof Venue];

export interface Publication {
  id: string;
  title: string;
  authors: string[];
  venue: Venue[];          // archival outlet and/or conference (see Venue)
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
}
