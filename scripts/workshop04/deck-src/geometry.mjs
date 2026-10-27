/**
 * Stage geometry of the Workshop 04 deck that CSS layout decides: where a kit file lands inside the
 * Claude window and how far away its source sits, per edition. Measured from the built slides at
 * 1920 × 1080 (final frames, reduced motion) and written here, so the generator stays a pure function.
 * Remeasure after any layout change of the slides projekt, schritt-1, schritt-2, schritt-3, nachreichung.
 */
export const GEO = {
  de: {
    pj: {"files":[[1158,214,154,-1050,-101],[1322,214,154,-1214,-61],[1486,214,154,-1378,-21],[1158,266,154,-1050,-33],[1322,266,154,-1214,7],[1486,266,154,-1378,47],[1158,318,154,-1050,35],[1322,318,154,-1214,75],[1486,318,154,-1378,115],[1158,370,154,-1050,103],[1322,370,154,-1214,143],[1486,370,154,-1378,183],[1158,422,154,-1050,171]],"instr":[755,214,216,-661,456]},
    s1: {"compose":[897,684,229,-842,-562],"hop":[-465,628]},
    s2: {"hop":[-355,606]},
    s3: {"hop":[-323,606]},
    late: {"photo":[510,57,240,-270,207,1.933,150]},
  },
  en: {
    pj: {"files":[[1158,214,154,-1050,-101],[1322,214,154,-1214,-61],[1486,214,154,-1378,-21],[1158,266,154,-1050,-33],[1322,266,154,-1214,7],[1486,266,154,-1378,47],[1158,318,154,-1050,35],[1322,318,154,-1214,75],[1486,318,154,-1378,115],[1158,370,154,-1050,103],[1322,370,154,-1214,143],[1486,370,154,-1378,183],[1158,422,154,-1050,171]],"instr":[755,214,232,-669,456]},
    s1: {"compose":[897,684,244,-849,-562],"hop":[-450,628]},
    s2: {"hop":[-342,606]},
    s3: {"hop":[-343,606]},
    late: {"photo":[510,57,240,-270,207,1.933,150]},
  },
};

export const geo = (c, key, fallback) => GEO[c.lang]?.[key] ?? fallback;
