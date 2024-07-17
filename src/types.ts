export enum Agency {
  Vesteda = "Vesteda",
  // TODO Goncalo
  Koops = "Koops",
  Vanderlinden = "Vanderlinden",
  VB_T = "VB&T",
  Funda = "Funda",

  // Not implemented yet (optional)
  Pararius = "Pararius",
}

export type AgencyProperty = Map<Agency, Set<string>>;
