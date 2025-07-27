import { findLayer, hex, sleep } from "/utils.js";

export const FPS = 60;

/**
 * @param {mapboxgl.Map} map
 * @param {CCapture} capturer
 * @param {import("./types").DrawLineOpts} opts
 */
export async function drawLine(map, capturer, opts) {
    const { sourceId, coords, seconds = 5, animate = true, headPointId } = opts;

    const totalFrameCount = Math.floor(seconds * FPS);
    /**@type {mapboxgl.GeoJSONSource} */
    const src = map.getSource(sourceId);
    const headSrc = headPointId ? map.getSource(headPointId) : undefined;
    src._data._mapanim__segments = coords;

    if (seconds === 0) {
        if (headPointId) {
            headSrc._data.geometry.coordinates = coords[coords.length - 1];
            headSrc.setData(headSrc._data);
        }

        src._data.geometry.coordinates.push(...coords);
        src.setData(src._data);
        return;
    }

    src._data.geometry.coordinates.push(coords[0]);
    if (headPointId) headSrc._data.geometry.coordinates = coords[0];

    /**@type {[number, number, number][]} */
    let segments = new Array(coords.length - 1).fill(0);
    for (let i = 0; i < coords.length - 1; i++) {
        const dLng = coords[i + 1][0] - coords[i][0];
        const dLat = coords[i + 1][1] - coords[i][1];
        const hypotenuse = Math.sqrt(dLng * dLng + dLat * dLat);
        segments[i] = [hypotenuse, dLng, dLat];
    }

    const totalDist = segments.map((v) => v[0]).reduce((tot, val) => tot + val);

    /**
     * there is ONE overall function with frame idx as input that dictates what PERCENTAGE of the TOTAL DISTANCE is to be added on the next frame
     * https://www.desmos.com/calculator/po38nnntoy
     *
     * `2(sin(pi/b * x)^2) / b`
     *
     * where b is the total number of frames
     * summing up all values from 1 to b will yield 1 (for 100%), meaning that when x = b 100% of the distance will have been drawn
     *
     * @param {number} x
     */
    const percentage = (x) =>
        (2 / totalFrameCount) * Math.pow(Math.sin((Math.PI / totalFrameCount) * x), 2);

    let segIdx = 0;
    let segCoveredDistance = 0;
    let [lastLng, lastLat] = coords[0];
    let frameIdx = 0;
    const mapCanvas = document.querySelector(".maplibre-canvas-container");
    function render() {
        if (frameIdx >= totalFrameCount) return;

        const x = frameIdx + 1; // percentage function input

        let additionalDistance = percentage(x) * totalDist;
        let [segLen, segDLng, segDLat] = segments[segIdx];
        let newSegCovered = segCoveredDistance + additionalDistance;

        while (newSegCovered >= segLen) {
            segIdx++;
            if (segIdx >= segments.length) break;

            additionalDistance -= Math.abs(segLen - segCoveredDistance);
            newSegCovered -= segLen;
            segCoveredDistance = 0;
            [segLen, segDLng, segDLat] = segments[segIdx];
            [lastLng, lastLat] = coords[segIdx];
            src._data.geometry.coordinates.push(coords[segIdx]);
        }

        if (segIdx >= segments.length) {
            if (headPointId) {
                headSrc._data.geometry.coordinates = coords[coords.length - 1];
                headSrc.setData(headSrc._data);
            }

            src._data.geometry.coordinates.push(coords[coords.length - 1]);
            src.setData(src._data);
            return;
        }

        segCoveredDistance = newSegCovered;

        const k = Math.abs(segDLat / segDLng);
        let newLngComponent = Math.sqrt(Math.pow(additionalDistance, 2) / (k * k + 1));
        let newLatComponent = k * newLngComponent;
        if (segDLng < 0) newLngComponent *= -1;
        if (segDLat < 0) newLatComponent *= -1;

        const newLng = lastLng + newLngComponent;
        const newLat = lastLat + newLatComponent;

        lastLng = newLng;
        lastLat = newLat;

        src._data.geometry.coordinates.push([newLng, newLat]);
        if (headPointId) headSrc._data.geometry.coordinates = [newLng, newLat];

        if (headPointId) headSrc.setData(headSrc._data);
        src.setData(src._data);

        frameIdx++;
        if (!animate) render();
        else {
            requestAnimationFrame(render);
        }
    }

    render();
    if (!animate) {
        if (headPointId) headSrc.setData(headSrc._data);
        src.setData(src._data);
        requestAnimationFrame(render);
    }
}

/**
 * @param {mapboxgl.Map} map
 * @param {string} sourceId
 * @param {mapboxgl.LineLayer} layerStyle
 * @param {[number, number]} stopCoord
 * @param {number} seconds
 */
export async function rescindLine(map, sourceId, layerStyle, stopCoord, seconds = 3) {
    const totalFrameCount = Math.floor(seconds * FPS);
    /**@type {mapboxgl.GeoJSONSource} */
    const oldSrc = map.getSource(sourceId);

    const spoofId = `${sourceId}-rescind-${hex(8)}`;
    map.addSource(spoofId, newGeojsonSource());
    map.addLayer({
        ...layerStyle,
        id: hex,
        type: "line",
        source: spoofId,
    });

    /**@type {mapboxgl.GeoJSONSource} */
    const src = map.getSource(spoofId);

    const coords = [];
    for (let i = oldSrc._data._mapanim__segments.length - 1; i >= 0; i--) {
        const [thisLng, thisLat] = oldSrc._data._mapanim__segments[i];
        coords.push([thisLng, thisLat]);
        if (thisLng === stopCoord[0] && thisLat === stopCoord[1]) break;
    }

    await drawLine(map, spoofId, coords, seconds, false);
    await sleep(100);

    for (let i = oldSrc._data.geometry.coordinates.length - 1; i >= 0; i--) {
        const [thisLng, thisLat] = oldSrc._data.geometry.coordinates[i];
        if (thisLng === stopCoord[0] && thisLat === stopCoord[1]) break;
        oldSrc._data.geometry.coordinates.pop();
    }

    oldSrc.setData(oldSrc._data);

    const percentage = (x) =>
        (2 / totalFrameCount) * Math.pow(Math.cos((Math.PI / totalFrameCount) * x), 2);

    for (let frameIdx = 0; frameIdx < totalFrameCount; frameIdx++) {
        const x = frameIdx + 1; // percentage function input

        const timeToWaitSeconds = percentage(x) * seconds;
        src._data.geometry.coordinates.shift();
        src.setData(src._data);
        await sleep(timeToWaitSeconds * 1000);
    }

    map.removeLayer(hex);
    map.removeSource(spoofId);
}

/**
 * @param {mapboxgl.Map} map
 * @param {string} layerId
 * @param {number} seconds
 */
export async function inflateDeflate(map, layerId, seconds = 3) {
    const totalFrameCount = seconds * FPS;
    const layer = findLayer(map, layerId);
    const width = (x) => (1 / 3) * Math.pow(Math.sin((Math.PI / totalFrameCount) * x), 2) + 1;

    let t = 0;
    function render() {
        map.setPaintProperty(layerId, "line-width", layer.paint["line-width"] * width(t));
        t++;

        requestAnimationFrame(render);
    }

    render();
}

/**
 * @param {mapboxgl.Map} map
 * @param {CCapture} capturer
 * @param {import("./types").PulseOpts} opts
 */
export async function pulse(map, capturer, opts) {
    const { sourceId, seconds = 1, rings = 1, radius = 50, delay = 350 } = opts;

    const totalFrameCount = seconds * FPS;
    const maxStroke = Math.sqrt(radius);

    const radii = (x) => (radius / totalFrameCount) * x;
    const strokeWidth = (x) => maxStroke - (maxStroke / totalFrameCount) * x;
    const mapCanvas = document.querySelector(".maplibre-canvas-container");
    async function pulseInner() {
        const layerId = `${sourceId}-${hex(8)}`;

        const paint = {
            "circle-radius": 0,
            "circle-opacity": 0,
            "circle-stroke-color": "#000",
            "circle-stroke-opacity": 1,
            "circle-stroke-width": maxStroke,
        };

        map.addLayer({
            id: layerId,
            source: sourceId,
            type: "circle",
            paint,
        });

        let frameIdx = 0;
        function render() {
            if (frameIdx >= totalFrameCount) return;

            let x = frameIdx + 1;
            let r = radii(x);
            let w = strokeWidth(x);
            map.setPaintProperty(layerId, "circle-radius", r);
            map.setPaintProperty(layerId, "circle-stroke-width", w);

            frameIdx++;
            requestAnimationFrame(render);
        }

        render();

        await sleep(1000);
        map.removeLayer(layerId);
    }

    for (let ctr = 0; ctr < rings; ctr++) {
        pulseInner();
        await sleep(delay);
    }
}
