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
    const callback = isNaN(x) ? (res) => requestAnimationFrame(res) : (res) => setTimeout(res, x);
    return new Promise(callback);
}

/**
 * @param {GeoJSON.Geometry} geometry
 * @param {boolean} stripped (inner data only)
 * @returns {mapboxgl.GeoJSONSourceRaw}
 */
export function newFeature(geometry, stripped) {
    const innerData = {
        type: "Feature",
        geometry,
    };

    if (stripped) return innerData;
    return {
        type: "geojson",
        lineMetrics: true,
        data: innerData,
    };
}

/**
 * @param {GeoJSON.Feature[]} features
 * @returns {mapboxgl.GeoJSONSourceRaw}
 */
export function newFeatureCollection(features) {
    return {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features,
        },
    };
}

/**
 * @param {string} id
 * @param {string} source
 * @param {mapboxgl.LinePaint} paint
 * @returns {mapboxgl.LineLayer}
 */
export function newLineLayer(id, source, paint) {
    return {
        id,
        source,
        type: "line",
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint,
    };
}

/**
 * @param {import("./types").AddImageOpts} opts
 * @returns {Promise<[string, string]>} sourceId, layerId
 */
export async function addImage(opts) {
    const { imgName, coords, layoutOverrides = {}, paintOverrides = {}, beforeLayer } = opts;
    const imgId = `${imgName}-${hex(6)}`;
    const layout = {
        "icon-image": imgId,
        "icon-pitch-alignment": "viewport",
        "icon-allow-overlap": true,
        "icon-offset": [0, 0],
    };

    const paint = {
        "icon-opacity": 1,
    };

    Object.assign(layout, layoutOverrides);
    Object.assign(paint, paintOverrides);

    map.addImage(imgId, (await map.loadImage(`./assets/${imgName}.png`)).data);
    const sourceId = `${imgName}source-${hex(6)}`;
    const layerId = `${imgName}layer-${hex(6)}`;

    if (Array.isArray(coords[0])) {
        const features = coords.map((c) => newFeature({ type: "Point", coordinates: c }, true));
        map.addSource(sourceId, newFeatureCollection(features));
    } else map.addSource(sourceId, newFeature({ type: "Point", coordinates: coords }));

    map.addLayer(
        {
            id: layerId,
            source: sourceId,
            type: "symbol",
            layout,
            paint,
        },
        beforeLayer
    );

    return [sourceId, layerId];
}

/**
 * @param {import("./types").AddLineOpts} opts
 * @returns {[string, string, string, string]} src, layer, caseSrc, caseLayer
 */
export function addLine(opts) {
    const {
        lineName,
        coords = [],
        paintOverrides = {},
        casingPaintOverrides = {},
        casing = true,
        beforeLayer,
    } = opts;

    const defaultPaint = {
        "line-width": 12,
        "line-opacity": 1,
    };

    const defaultCasingPaint = {
        "line-width": 17,
        "line-opacity": 1,
    };

    const paint = Object.assign(defaultPaint, paintOverrides);
    const casingPaint = Object.assign(defaultCasingPaint, casingPaintOverrides);

    let caseSrc, caseLayer;
    if (casing === true) {
        [caseSrc, caseLayer] = addLine({
            lineName: `case${lineName}`,
            coords: coords.map((r) => [...r]),
            paintOverrides: casingPaint,
            casing: false,
            beforeLayer,
        });
    }

    const [src, layer] = [`${lineName}source-${hex(6)}`, `${lineName}layer-${hex(6)}`];
    map.addSource(src, newFeature({ type: "LineString", coordinates: coords }));
    map.addLayer(newLineLayer(layer, src, paint), beforeLayer);

    return [src, layer, caseSrc, caseLayer];
}
