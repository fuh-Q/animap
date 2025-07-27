const newGeojsonSource = () => {
    return {
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [],
                },
            },
        ],
    };
};

let editorEnabled = false;

/**
 * @param {[number, number][]} coords
 * @returns {number}
 */
function getRouteLength(coords) {
    let sum = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        const [lng1, lat1] = coords[i];
        const [lng2, lat2] = coords[i + 1];
        sum += Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
    }
    return sum;
}

/**
 * @param {mapboxgl.Map} map
 */
export function initRouteEditor(map) {
    document.addEventListener("keyup", (e) => {
        if (e.key !== "c") return;

        editorEnabled = !editorEnabled;
        const elem = document.getElementById("editorStatus");
        elem.style.opacity = Number(editorEnabled);

        if (!editorEnabled) {
            const src = map.getSource("editor-points");
            const coords = src._data.features[0].geometry.coordinates;
            const dist = getRouteLength(coords);
            navigator.clipboard.writeText(JSON.stringify(coords));
            console.log(`copied ${coords.length} coordinates to the clipboard \n distance ${dist}`);
            src.setData(newGeojsonSource());
        }
    });

    document.addEventListener("keyup", (e) => {
        if (!(e.ctrlKey && e.key === "z") || e.key !== "x" || !editorEnabled) return;

        const src = map.getSource("editor-points");
        if (src._data.features.length > 1) {
            src._data.features.pop();
            src._data.features[0].geometry.coordinates.pop();
            src.setData(src._data);
        }
    });

    map.on("load", () => {
        map.addSource("editor-points", { type: "geojson", data: newGeojsonSource() });

        map.addLayer({
            id: "editor-points-line",
            source: "editor-points",
            type: "line",
            layout: {
                "line-cap": "round",
                "line-join": "round",
            },
            paint: {
                "line-color": "#000",
                "line-width": 4,
            },
        });

        map.addLayer({
            id: "editor-points-layer",
            source: "editor-points",
            type: "circle",
            paint: {
                "circle-radius": 4,
                "circle-color": "#fff",
                "circle-stroke-color": "#000",
                "circle-stroke-width": 2,
            },
        });
    });

    map.on("click", (e) => {
        if (!editorEnabled) return;

        const lngLat = e.lngLat;
        const src = map.getSource("editor-points");

        src._data.features.push({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lngLat.lng, lngLat.lat],
            },
        });

        src._data.features[0].geometry.coordinates.push([lngLat.lng, lngLat.lat]);
        src.setData(src._data);
    });
}
