/**
 * Public machine surfaces: one place that turns the canonical registries into
 * records a machine can read.
 *
 * The JSON endpoints under /api and the agent tools import from here, so a
 * catalog change reaches every machine consumer at once and no consumer keeps
 * a catalog of its own.
 */

export {
  MACHINE_SURFACE_HEADERS,
  machineSchemaId,
  machineSurfaceEnvelope,
  absoluteLocalizedUrl,
} from "./envelope";
export type { MachineSurfaceEnvelope } from "./envelope";

export { machineGraphFacet } from "./graph";
export type { MachineGraphFacet } from "./graph";

export {
  buildMachineCourseCatalog,
  getMachineCourse,
  listMachineCourses,
  listMachineCourseSlugs,
} from "./courses";
export type {
  MachineCourse,
  MachineCourseCatalogEntry,
  MachineCourseCatalogPayload,
  MachineCourseSource,
} from "./courses";

export {
  buildMachineWorkshopCatalog,
  getMachineWorkshop,
  listMachineWorkshops,
  listMachineWorkshopSlugs,
} from "./workshops";
export type {
  MachineWorkshop,
  MachineWorkshopCase,
  MachineWorkshopCatalogEntry,
  MachineWorkshopCatalogPayload,
  MachineWorkshopMaterial,
  MachineWorkshopMetric,
  MachineWorkshopRealWorldCase,
  MachineWorkshopStep,
} from "./workshops";
