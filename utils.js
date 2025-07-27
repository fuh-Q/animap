/**
 * @param {mapboxgl.Map} map
 * @param {string} layerId
 * @returns {mapboxgl.AnyLayer}
 */
export function findLayer(map, layerId) {
    return map.getStyle().layers.find((l) => l.id === layerId);
}

/**
 * @param {mapboxgl.Map} map
 * @param {string} sourceId
 * @returns {mapboxgl.AnySourceData}
 */
export function findSource(map, sourceId) {
    return map.getStyle().sources[sourceId];
}

/**
 * @param {number} len
 * @returns {string}
 */
export function hex(len) {
    return Array.from(window.crypto.getRandomValues(new Uint8Array(len)), (b) =>
        b.toString(16).padStart(2, "0")
    ).join("");
}

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
