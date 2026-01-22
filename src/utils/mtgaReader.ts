/**
 * Centralized facade for mtga-reader functionality.
 * Handles platform detection (Tauri/Electron/Web) and provides graceful fallbacks.
 * In web mode, all functions return null/undefined to prevent errors.
 */

import isTauri from "./tauri/isTauri";
import * as TauriReader from "./tauri/reader";

// Type definitions from mtga-reader
export interface ClassInfo {
  namespace: string;
  name: string;
}

export interface FieldInfo {
  name: string;
  type: string;
  offset: number;
}

export interface ClassDetails {
  namespace: string;
  name: string;
  fields: FieldInfo[];
  staticInstances: Record<string, number>;
}

export interface InstanceData {
  type: string;
  fields: Record<string, any>;
}

export interface DictionaryData {
  entries: Array<{ key: any; value: any }>;
}

/**
 * Check if running with admin/elevated privileges
 */
export async function isAdmin(): Promise<boolean> {
  if (isTauri()) {
    try {
      return await TauriReader.isAdmin();
    } catch (error) {
      console.error("Failed to check admin via Tauri:", error);
      return false;
    }
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.isAdmin();
    } catch (error) {
      console.error("Failed to check admin via mtga-reader:", error);
      return false;
    }
  }

  // Web environment - not supported
  return false;
}

/**
 * Find a process by name and return its PID
 */
export async function findProcess(processName: string): Promise<number | null> {
  if (isTauri()) {
    try {
      const found = await TauriReader.findProcess(processName);
      return found ? 1 : null; // Tauri returns boolean, convert to PID-like value
    } catch (error) {
      console.error("Failed to find process via Tauri:", error);
      return null;
    }
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.findPidByName(processName);
    } catch (error) {
      console.error("Failed to find process via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Initialize the reader for a specific process
 */
export async function init(processName: string): Promise<boolean> {
  if (isTauri()) {
    // Tauri doesn't have explicit init, just use findProcess
    try {
      return await TauriReader.findProcess(processName);
    } catch (error) {
      console.error("Failed to init via Tauri:", error);
      return false;
    }
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.init(processName);
    } catch (error) {
      console.error("Failed to init via mtga-reader:", error);
      return false;
    }
  }

  // Web environment - not supported
  return false;
}

/**
 * Close the reader and free resources
 */
export async function close(): Promise<void> {
  if (isTauri()) {
    // Tauri manages its own lifecycle
    return;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      reader.close();
    } catch (error) {
      console.error("Failed to close via mtga-reader:", error);
    }
  }
}

/**
 * Check if the reader is initialized
 */
export async function isInitialized(): Promise<boolean> {
  if (isTauri()) {
    // Tauri is always "initialized" if available
    return true;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.isInitialized();
    } catch (error) {
      console.error("Failed to check initialization via mtga-reader:", error);
      return false;
    }
  }

  // Web environment - not supported
  return false;
}

/**
 * Get all loaded assemblies
 */
export async function getAssemblies(): Promise<string[]> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getAssemblies not implemented in Tauri mode");
    return [];
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getAssemblies();
    } catch (error) {
      console.error("Failed to get assemblies via mtga-reader:", error);
      return [];
    }
  }

  // Web environment - not supported
  return [];
}

/**
 * Get classes in an assembly
 */
export async function getAssemblyClasses(
  assemblyName: string
): Promise<ClassInfo[]> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getAssemblyClasses not implemented in Tauri mode");
    return [];
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getAssemblyClasses(assemblyName);
    } catch (error) {
      console.error("Failed to get assembly classes via mtga-reader:", error);
      return [];
    }
  }

  // Web environment - not supported
  return [];
}

/**
 * Get detailed class information
 */
export async function getClassDetails(
  assemblyName: string,
  className: string
): Promise<ClassDetails | null> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getClassDetails not implemented in Tauri mode");
    return null;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getClassDetails(assemblyName, className);
    } catch (error) {
      console.error("Failed to get class details via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Read data from process memory following a field path
 */
export async function readData(
  processName: string,
  fields: string[]
): Promise<any> {
  if (isTauri()) {
    try {
      return await TauriReader.readData(processName, fields);
    } catch (error) {
      console.error("Failed to read data via Tauri:", error);
      return null;
    }
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.readData(processName, fields);
    } catch (error) {
      console.error("Failed to read data via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Read a class instance at a specific address
 */
export async function readClass(
  processName: string,
  address: number
): Promise<InstanceData | null> {
  if (isTauri()) {
    try {
      return await TauriReader.readClass(processName, address);
    } catch (error) {
      console.error("Failed to read class via Tauri:", error);
      return null;
    }
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.readClass(processName, address);
    } catch (error) {
      console.error("Failed to read class via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Read a generic instance at a specific address
 */
export async function readGenericInstance(
  processName: string,
  address: number
): Promise<InstanceData | null> {
  if (isTauri()) {
    try {
      return await TauriReader.readGenericInstance(processName, address);
    } catch (error) {
      console.error("Failed to read generic instance via Tauri:", error);
      return null;
    }
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.readGenericInstance(processName, address);
    } catch (error) {
      console.error("Failed to read generic instance via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Get an instance at a specific address
 */
export async function getInstance(
  address: number
): Promise<InstanceData | null> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getInstance not implemented in Tauri mode");
    return null;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getInstance(address);
    } catch (error) {
      console.error("Failed to get instance via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Get a field from an instance
 */
export async function getInstanceField(
  address: number,
  fieldName: string
): Promise<any> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getInstanceField not implemented in Tauri mode");
    return null;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getInstanceField(address, fieldName);
    } catch (error) {
      console.error("Failed to get instance field via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Get a static field from a class
 */
export async function getStaticField(
  classAddress: number,
  fieldName: string
): Promise<any> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getStaticField not implemented in Tauri mode");
    return null;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getStaticField(classAddress, fieldName);
    } catch (error) {
      console.error("Failed to get static field via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Parse a dictionary structure
 */
export async function getDictionary(
  address: number
): Promise<DictionaryData | null> {
  if (isTauri()) {
    // Not implemented in Tauri yet
    console.warn("getDictionary not implemented in Tauri mode");
    return null;
  }

  // Node.js/Electron environment
  // eslint-disable-next-line camelcase
  if (typeof __non_webpack_require__ !== "undefined") {
    try {
      // eslint-disable-next-line no-undef, camelcase
      const reader = __non_webpack_require__("mtga-reader");
      return reader.getDictionary(address);
    } catch (error) {
      console.error("Failed to get dictionary via mtga-reader:", error);
      return null;
    }
  }

  // Web environment - not supported
  return null;
}

/**
 * Check if memory reading features are available in the current environment
 */
export function isMemoryReadingAvailable(): boolean {
  // eslint-disable-next-line camelcase
  return isTauri() || typeof __non_webpack_require__ !== "undefined";
}
