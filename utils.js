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
 * if the special string is supplied this function will refer to requestAnimationFrame instead of setTimeout
 * @param {number | "requestAnimationFrame"} x
 * @returns {Promise<void>}
 */
export function sleep(x) {
    const callback = isNaN(x) ? (res) => requestAnimationFrame(res) : (res) => setTimeout(res, ms);
    return new Promise(callback);
}
