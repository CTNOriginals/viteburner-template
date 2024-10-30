

export const ScriptImportLine: RegExp = 
/^import\s*(?:{\s*(?<import>(?:\n\s*.*\s*?)*?|(?:.*(?=})))\s*}|(?:.*) as (?:.+))\s*from\s*["'](?<path>[.@]?\/.+)["'];?/

/** Get the x and y axis out of a transform: translate(x, y) style in an HTML element */
export const StyleTranslateXY = 
/translate\((?<x>\d+(?:\.\d{1,2})?)px,\s*(?<y>\d+(?:\.\d{1,2})?)px\)/;