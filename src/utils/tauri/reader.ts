import { invoke } from "@tauri-apps/api/tauri";

/**
 * Check if the current process has admin/elevated privileges
 */
export async function isAdmin(): Promise<boolean> {
  return invoke<boolean>("is_admin");
}

/**
 * Find a process by name
 */
export async function findProcess(processName: string): Promise<boolean> {
  return invoke<boolean>("find_process", { processName });
}

/**
 * Read data from process memory following a field path
 */
export async function readData(
  processName: string,
  fields: string[]
): Promise<any> {
  return invoke<any>("read_data", { processName, fields });
}

/**
 * Read a class instance at a specific address
 */
export async function readClass(
  processName: string,
  address: number
): Promise<any> {
  return invoke<any>("read_class", { processName, address });
}

/**
 * Read a generic instance at a specific address
 */
export async function readGenericInstance(
  processName: string,
  address: number
): Promise<any> {
  return invoke<any>("read_generic_instance", { processName, address });
}
