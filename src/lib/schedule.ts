import { CategoryRow, ElementRow, ScheduleResult, ScheduleRow } from "@/types/schedule";

export const COMMON_REVIT_CATEGORIES = [
  // Architecture / General
  "Areas","Assemblies","Casework","Ceilings","Columns","Curtain Panels",
  "Curtain Systems","Curtain Wall Mullions","Detail Items","Doors","Entourage",
  "Floors","Food Service Equipment","Furniture","Furniture Systems","Generic Models",
  "Grids","Hardscape","Levels","Mass","Mass Floors","Parking","Parts","Planting",
  "Project Information","Railings","Ramps","Roads","Roofs","Rooms","Shaft Openings",
  "Signage","Site","Stairs","Temporary Structures","Topography",
  "Vertical Circulation","Walls","Windows",
  // Mechanical / HVAC
  "Air Terminals","Duct Accessories","Duct Fittings","Duct Insulations",
  "Duct Linings","Duct Placeholders","Duct Systems","Ducts","Flex Ducts",
  "HVAC Zones","Mechanical Equipment","MEP Fabrication Containment",
  "MEP Fabrication Ductwork","MEP Fabrication Hangers","MEP Fabrication Pipework",
  "Spaces",
  // Plumbing / Fire Protection
  "Flex Pipes","Pipe Accessories","Pipe Fittings","Pipe Insulations",
  "Pipe Placeholders","Pipe Segments","Pipe Systems","Pipes","Plumbing Fixtures",
  "Sprinklers",
  // Electrical / Low Voltage
  "Cable Tray Fittings","Cable Trays","Communication Devices","Conduit Fittings",
  "Conduits","Data Devices","Electrical Circuits","Electrical Equipment",
  "Electrical Fixtures","Fire Alarm Devices","Lighting Devices","Lighting Fixtures",
  "Nurse Call Devices","Security Devices","Telephone Devices","Wires",
  // Structural
  "Structural Area Reinforcement","Structural Beam Systems","Structural Columns",
  "Structural Connections","Structural Fabric Areas","Structural Fabric Reinforcement",
  "Structural Foundations","Structural Framing","Structural Internal Loads",
  "Structural Path Reinforcement","Structural Rebar","Structural Rebar Couplers",
  "Structural Stiffeners","Structural Tendons","Structural Trusses",
  // Analytical
  "Analytical Beams","Analytical Braces","Analytical Columns","Analytical Floors",
  "Analytical Foundation Slabs","Analytical Isolated Foundations","Analytical Links",
  "Analytical Nodes","Analytical Spaces","Analytical Walls",
  // Specialised
  "Medical Equipment","Specialty Equipment",
];

const BUILT_IN_CATEGORY_MAP: Record<string, string> = {
  OST_AirTerminals:"Air Terminals",OST_AnalyticalBeams:"Analytical Beams",
  OST_AnalyticalBrace:"Analytical Braces",OST_AnalyticalColumn:"Analytical Columns",
  OST_AnalyticalFloors:"Analytical Floors",OST_AnalyticalFoundationSlab:"Analytical Foundation Slabs",
  OST_AnalyticalIsolatedFoundation:"Analytical Isolated Foundations",OST_AnalyticalLinks:"Analytical Links",
  OST_AnalyticalNodes:"Analytical Nodes",OST_AnalyticalSpaces:"Analytical Spaces",
  OST_AnalyticalWalls:"Analytical Walls",OST_Areas:"Areas",OST_Assemblies:"Assemblies",
  OST_CableTrayFitting:"Cable Tray Fittings",OST_CableTray:"Cable Trays",OST_Casework:"Casework",
  OST_Ceilings:"Ceilings",OST_Columns:"Columns",OST_CommunicationDevices:"Communication Devices",
  OST_ConduitFitting:"Conduit Fittings",OST_Conduit:"Conduits",OST_CurtainWallPanels:"Curtain Panels",
  OST_Curtain_Systems:"Curtain Systems",OST_CurtainWallMullions:"Curtain Wall Mullions",
  OST_DataDevices:"Data Devices",OST_DetailComponents:"Detail Items",OST_Doors:"Doors",
  OST_DuctAccessory:"Duct Accessories",OST_DuctFitting:"Duct Fittings",OST_DuctInsulations:"Duct Insulations",
  OST_DuctLinings:"Duct Linings",OST_PlaceHolderDucts:"Duct Placeholders",OST_DuctSystem:"Duct Systems",
  OST_DuctCurves:"Ducts",OST_ElectricalCircuit:"Electrical Circuits",
  OST_ElectricalEquipment:"Electrical Equipment",OST_ElectricalFixtures:"Electrical Fixtures",
  OST_Entourage:"Entourage",OST_FireAlarmDevices:"Fire Alarm Devices",OST_FlexDuctCurves:"Flex Ducts",
  OST_FlexPipeCurves:"Flex Pipes",OST_Floors:"Floors",OST_FoodServiceEquipment:"Food Service Equipment",
  OST_Furniture:"Furniture",OST_FurnitureSystems:"Furniture Systems",OST_GenericModel:"Generic Models",
  OST_Grids:"Grids",OST_Hardscape:"Hardscape",OST_HVAC_Zones:"HVAC Zones",OST_Levels:"Levels",
  OST_LightingDevices:"Lighting Devices",OST_LightingFixtures:"Lighting Fixtures",OST_Mass:"Mass",
  OST_MassFloor:"Mass Floors",OST_MechanicalEquipment:"Mechanical Equipment",
  OST_MedicalEquipment:"Medical Equipment",OST_FabricationContainment:"MEP Fabrication Containment",
  OST_FabricationDuctwork:"MEP Fabrication Ductwork",OST_FabricationHangers:"MEP Fabrication Hangers",
  OST_FabricationPipework:"MEP Fabrication Pipework",OST_NurseCallDevices:"Nurse Call Devices",
  OST_Parking:"Parking",OST_Parts:"Parts",OST_PipeAccessory:"Pipe Accessories",
  OST_PipeFitting:"Pipe Fittings",OST_PipeInsulations:"Pipe Insulations",
  OST_PlaceHolderPipes:"Pipe Placeholders",OST_PipeSegments:"Pipe Segments",
  OST_PipingSystem:"Pipe Systems",OST_PipeCurves:"Pipes",OST_Planting:"Planting",
  OST_PlumbingFixtures:"Plumbing Fixtures",OST_ProjectInformation:"Project Information",
  OST_Railings:"Railings",OST_Ramps:"Ramps",OST_Roads:"Roads",OST_Roofs:"Roofs",
  OST_Rooms:"Rooms",OST_SecurityDevices:"Security Devices",OST_ShaftOpening:"Shaft Openings",
  OST_Signage:"Signage",OST_Site:"Site",OST_MEPSpaces:"Spaces",
  OST_SpecialityEquipment:"Specialty Equipment",OST_Sprinklers:"Sprinklers",OST_Stairs:"Stairs",
  OST_AreaRein:"Structural Area Reinforcement",OST_StructuralFramingSystem:"Structural Beam Systems",
  OST_StructuralColumns:"Structural Columns",OST_StructConnections:"Structural Connections",
  OST_FabricAreas:"Structural Fabric Areas",OST_FabricReinforcement:"Structural Fabric Reinforcement",
  OST_StructuralFoundation:"Structural Foundations",OST_StructuralFraming:"Structural Framing",
  OST_StructuralInternalLoads:"Structural Internal Loads",OST_PathRein:"Structural Path Reinforcement",
  OST_Rebar:"Structural Rebar",OST_Coupler:"Structural Rebar Couplers",
  OST_StructuralStiffener:"Structural Stiffeners",OST_StructuralTendons:"Structural Tendons",
  OST_StructuralTruss:"Structural Trusses",OST_TelephoneDevices:"Telephone Devices",
  OST_TemporaryStructure:"Temporary Structures",OST_Topography:"Topography",
  OST_VerticalCirculation:"Vertical Circulation",OST_Walls:"Walls",OST_Windows:"Windows",OST_Wire:"Wires",
};

const CATEGORY_KEYWORDS: [string, string[]][] = [
  ["Air Terminals",["air terminal","diffuser","grille","register"]],
  ["Cable Tray Fittings",["cable tray fitting"]],["Cable Trays",["cable tray"]],
  ["Casework",["casework","cabinet","countertop"]],["Ceilings",["ceiling","ceilings"]],
  ["Columns",["column","columns"]],["Communication Devices",["communication device","communications"]],
  ["Conduit Fittings",["conduit fitting"]],["Conduits",["conduit"]],
  ["Curtain Panels",["curtain panel","glazing","glass panel"]],["Curtain Systems",["curtain system"]],
  ["Curtain Wall Mullions",["mullion","curtain wall mullion"]],["Data Devices",["data device","data outlet"]],
  ["Detail Items",["detail item","detail component"]],["Doors",["door","doors"]],
  ["Duct Accessories",["duct accessory"]],["Duct Fittings",["duct fitting"]],
  ["Duct Insulations",["duct insulation"]],["Duct Linings",["duct lining"]],
  ["Duct Placeholders",["duct placeholder"]],["Duct Systems",["duct system"]],
  ["Ducts",["duct","ducts"]],["Electrical Circuits",["electrical circuit","circuit"]],
  ["Electrical Equipment",["electrical equipment","panelboard","switchboard"]],
  ["Electrical Fixtures",["electrical fixture"]],["Entourage",["entourage"]],
  ["Fire Alarm Devices",["fire alarm"]],["Flex Ducts",["flex duct"]],["Flex Pipes",["flex pipe"]],
  ["Floors",["floor","floors"]],["Food Service Equipment",["food service equipment"]],
  ["Furniture",["furniture","chair","table","desk","sofa"]],["Furniture Systems",["furniture system"]],
  ["Generic Models",["generic model"]],["Grids",["grid","grids"]],["Hardscape",["hardscape"]],
  ["HVAC Zones",["hvac zone","zone"]],["Levels",["level","levels"]],
  ["Lighting Devices",["lighting device","switch"]],
  ["Lighting Fixtures",["lighting fixture","light fixture","lamp","luminaire"]],
  ["Mass Floors",["mass floor"]],["Mass",["mass"]],
  ["Mechanical Equipment",["mechanical equipment","ahu","fcu","fan coil","pump","chiller"]],
  ["Medical Equipment",["medical equipment"]],
  ["MEP Fabrication Containment",["fabrication containment"]],
  ["MEP Fabrication Ductwork",["fabrication ductwork"]],
  ["MEP Fabrication Hangers",["fabrication hanger"]],
  ["MEP Fabrication Pipework",["fabrication pipework"]],
  ["Nurse Call Devices",["nurse call"]],["Parking",["parking"]],["Parts",["part","parts"]],
  ["Pipe Accessories",["pipe accessory"]],["Pipe Fittings",["pipe fitting"]],
  ["Pipe Insulations",["pipe insulation"]],["Pipe Placeholders",["pipe placeholder"]],
  ["Pipe Segments",["pipe segment"]],["Pipe Systems",["pipe system","piping system"]],
  ["Pipes",["pipe","pipes"]],["Planting",["planting","tree","plant"]],
  ["Plumbing Fixtures",["plumbing fixture","toilet","sink","basin","lavatory","urinal"]],
  ["Project Information",["project information"]],["Railings",["railing","railings"]],
  ["Ramps",["ramp","ramps"]],["Roads",["road","roads"]],["Roofs",["roof","roofs"]],
  ["Rooms",["room","rooms"]],["Security Devices",["security device","cctv","camera"]],
  ["Shaft Openings",["shaft opening","shaft"]],["Signage",["signage","sign"]],
  ["Site",["site"]],["Spaces",["space","spaces"]],
  ["Specialty Equipment",["specialty equipment","speciality equipment"]],
  ["Sprinklers",["sprinkler","sprinklers"]],["Stairs",["stair","stairs"]],
  ["Structural Area Reinforcement",["area reinforcement"]],
  ["Structural Beam Systems",["beam system"]],["Structural Columns",["structural column"]],
  ["Structural Connections",["structural connection"]],
  ["Structural Fabric Areas",["fabric area"]],
  ["Structural Fabric Reinforcement",["fabric reinforcement"]],
  ["Structural Foundations",["foundation","footing","pile cap"]],
  ["Structural Framing",["structural framing","beam","brace","joist"]],
  ["Structural Internal Loads",["internal load"]],
  ["Structural Path Reinforcement",["path reinforcement"]],
  ["Structural Rebar Couplers",["rebar coupler"]],["Structural Rebar",["rebar","reinforcement bar"]],
  ["Structural Stiffeners",["stiffener"]],["Structural Tendons",["tendon"]],
  ["Structural Trusses",["truss"]],["Telephone Devices",["telephone device","phone"]],
  ["Temporary Structures",["temporary structure"]],
  ["Topography",["topography","toposurface","terrain"]],
  ["Vertical Circulation",["vertical circulation"]],
  ["Walls",["wall","walls","basic wall","curtain wall"]],
  ["Windows",["window","windows"]],["Wires",["wire","wires"]],
];

const VARIANT_MAP: Record<string, string> = {
  "speciality equipment":"Specialty Equipment","specialty equipments":"Specialty Equipment",
  "curtain wall panels":"Curtain Panels","curtain panels":"Curtain Panels",
  "mullions":"Curtain Wall Mullions","duct curves":"Ducts","pipe curves":"Pipes",
  "mep spaces":"Spaces","structural foundation":"Structural Foundations",
  "structural foundations":"Structural Foundations","structural frame":"Structural Framing",
  "structural framing":"Structural Framing","toposurface":"Topography","toposolid":"Topography",
};

function flattenProperties(obj: Record<string, any>, prefix = "", result: Record<string, any> = {}): Record<string, any> {
  for (const [key, value] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      flattenProperties(value, fullKey, result);
    } else {
      result[fullKey] = value;
    }
  }
  return result;
}

function findFlatProperty(flat: Record<string, any>, names: string[]): string | null {
  const entries = Object.entries(flat);
  for (const name of names) {
    const exact = entries.find(([key]) => key.split(".").pop()?.toLowerCase() === name.toLowerCase());
    if (exact && exact[1] != null && exact[1] !== "") return String(exact[1]);
  }
  for (const name of names) {
    const partial = entries.find(([key]) => key.toLowerCase().includes(name.toLowerCase()));
    if (partial && partial[1] != null && partial[1] !== "") return String(partial[1]);
  }
  return null;
}

function guessCategoryFromText(element: any, flat: Record<string, any>): string {
  // Only use element name and type/family fields — never all property values.
  // Using all values causes false positives: a Sprinkler with a "Level" property
  // would match "Levels" before matching "Sprinklers".
  const typeFields = findFlatProperty(flat, ["Type Name","Family Name","Family and Type","Type","Family"]);
  const text = [element.name || "", typeFields || ""].join(" ").toLowerCase();
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some(kw => text.includes(kw))) return category;
  }
  return "Unknown";
}

function normalizeCategory(raw: string | null): string {
  if (!raw) return "Unknown";
  let text = String(raw).trim().replace(/\|/g, "/").replace(/\n/g, " ");
  if (BUILT_IN_CATEGORY_MAP[text]) return BUILT_IN_CATEGORY_MAP[text];
  const lower = text.toLowerCase();
  for (const cat of COMMON_REVIT_CATEGORIES) {
    if (lower === cat.toLowerCase()) return cat;
    const cl = cat.toLowerCase();
    if (lower.endsWith(`.${cl}`) || lower.endsWith(`:${cl}`) ||
        lower.includes(`category ${cl}`) || lower.includes(`category: ${cl}`)) return cat;
  }
  if (VARIANT_MAP[lower]) return VARIANT_MAP[lower];
  return text;
}

function isSupportedCategory(cat: string): boolean {
  if (!cat || cat === "Unknown") return false;
  return COMMON_REVIT_CATEGORIES.some(s => s.toLowerCase() === cat.toLowerCase());
}

function cleanText(v: any): string {
  return String(v).replace(/\|/g, "/").replace(/\n/g, " ").replace(/\r/g, " ").trim();
}

export function buildCategorySummary(
  properties: any[],
  projectId: string,
  modelUrn: string
): ScheduleResult {
  const categoryMap: Record<string, {
    category: string; count: number;
    families: Set<string>; types: Set<string>;
    levels: Set<string>; examples: Set<string>;
    elements: ElementRow[];
  }> = {};
  let unknownCount = 0;

  for (const element of properties) {
    const flat = flattenProperties(element.properties || {});
    const rawCategory =
      findFlatProperty(flat, [
        "Category","Revit Category","Element Category","Category Name",
        "BuiltInCategory","Built In Category","LcRevitData.Category",
        "LcRevitData.Element Category","Item.Category","类别",
      ]) || guessCategoryFromText(element, flat);

    const category = normalizeCategory(rawCategory);

    if (!isSupportedCategory(category)) { unknownCount++; continue; }

    // APS element names follow "FamilyName : TypeName [ObjectID]" or "FamilyName [ObjectID]"
    // Parse both parts from the name as fallbacks when APS doesn't expose explicit properties.
    const strippedName = element.name
      ? cleanText(element.name).replace(/\s*\[\d+\]$/, "").trim()
      : null;

    // Skip phantom/metadata nodes that have no meaningful name
    if (!strippedName) { unknownCount++; continue; }

    const nameFamily = strippedName.includes(" : ")
      ? strippedName.split(" : ")[0].trim()
      : strippedName;
    const nameType = strippedName.includes(" : ")
      ? strippedName.split(" : ").slice(1).join(" : ").trim()
      : null;

    const typeFromProps = findFlatProperty(flat, ["Type","Type Name","LcRevitData.Type","Item.Type","类型"]);

    const family =
      findFlatProperty(flat, [
        "Family","Family Name","LcRevitData.Family","Item.Family","族",
        "Object Name","Assembly Description",
      ]) || nameFamily;
    const type = typeFromProps || nameType || nameFamily;
    const level = findFlatProperty(flat, ["Level","Base Level","Reference Level","Schedule Level","LcRevitData.Level","Item.Level","标高"]) || "Unknown Level";

    if (!categoryMap[category]) {
      categoryMap[category] = { category, count: 0, families: new Set(), types: new Set(), levels: new Set(), examples: new Set(), elements: [] };
    }
    categoryMap[category].count++;
    if (family) categoryMap[category].families.add(cleanText(family));
    if (type) categoryMap[category].types.add(cleanText(type));
    if (level !== "Unknown Level") categoryMap[category].levels.add(cleanText(level));
    if (element.name) categoryMap[category].examples.add(cleanText(element.name));
    if (categoryMap[category].elements.length < 200) {
      categoryMap[category].elements.push({
        id: element.externalId || String(element.objectid || ""),
        name: cleanText(element.name || "—"),
        family: family !== "Unknown Family" ? cleanText(family) : "—",
        type: type !== "Unknown Type" ? cleanText(type) : "—",
        level: level !== "Unknown Level" ? cleanText(level) : "—",
      });
    }
  }

  const rows: CategoryRow[] = Object.values(categoryMap)
    .sort((a, b) => b.count - a.count)
    .map(item => ({
      category: item.category,
      count: item.count,
      families: Array.from(item.families).slice(0, 5).join(", ") || "-",
      types: Array.from(item.types).slice(0, 5).join(", ") || "-",
      levels: Array.from(item.levels).slice(0, 5).join(", ") || "-",
      examples: Array.from(item.examples).slice(0, 3).join(", ") || "-",
      elements: item.elements,
    }));

  // Build Category > Family > Type breakdown with instance counts
  const ftMap: Record<string, ScheduleRow> = {};
  for (const item of Object.values(categoryMap)) {
    for (const el of item.elements) {
      const family = el.family && el.family !== "—" ? el.family : item.category + " (Unknown)";
      const type = el.type && el.type !== "—" ? el.type : "Standard";
      const key = `${item.category}||${family}||${type}`;
      if (!ftMap[key]) ftMap[key] = { category: item.category, family, type, instances: 0 };
      ftMap[key].instances++;
    }
  }
  const scheduleRows: ScheduleRow[] = Object.values(ftMap).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.family !== b.family) return a.family.localeCompare(b.family);
    return a.type.localeCompare(b.type);
  });

  return {
    projectId,
    modelUrn,
    totalElementsScanned: properties.length,
    totalCategorizedElements: rows.reduce((s, r) => s + r.count, 0),
    totalCategoriesFound: rows.length,
    uncategorizedElements: unknownCount,
    categories: rows,
    scheduleRows,
  };
}
