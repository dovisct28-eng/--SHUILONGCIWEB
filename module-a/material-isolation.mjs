// The GLB material palette is shared. A mural owns its transfer material once,
// before any opacity or texture updates can reach another mural.
export function muralMaterial(material, groupName) {
  return groupName?.startsWith('mural-') ? material.clone() : material;
}
