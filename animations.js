import {
    InflateDeflate,
    LineAnimation,
    DottedLineAnimation,
    Blink,
    MapViewAdjustment,
    Rotation,
    Pop,
} from "./drawing.js";

let exportedAnimation;

/**@returns {Promise<Set<import("./types").Animation>>} */
exportedAnimation = async function () {
    const newGeojsonSource = () => {
        return {
            type: "geojson",
            lineMetrics: true,
            data: {
                type: "Feature",
                geometry: {
                    type: "LineString",
                    coordinates: [],
                },
            },
        };
    };

    map.addSource("lineSource", newGeojsonSource());
    map.addSource("lineSource2", newGeojsonSource());

    map.addLayer({
        id: "lineLayer",
        type: "line",
        source: "lineSource",
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": "rgb(255, 130, 130)",
            "line-width": 12,
            "line-opacity": 1,
        },
    });

    map.addLayer({
        id: "lineLayer2",
        type: "line",
        source: "lineSource2",
        layout: {
            "line-cap": "round",
            "line-join": "round",
        },
        paint: {
            "line-color": "#f00",
            "line-width": 5,
        },
    });

    const headPointId = "linehead";
    map.addSource(headPointId, {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [],
            },
        },
    });

    map.addLayer({
        id: `${headPointId}-layer`,
        source: headPointId,
        type: "circle",
        paint: {
            "circle-radius": 12,
            "circle-color": "#f00",
            "circle-stroke-color": "#000",
            "circle-stroke-width": 2,
        },
    });

    map.addSource("dottedline", {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features: [],
        },
    });

    map.addLayer({
        id: "dottedlinelayer",
        source: "dottedline",
        type: "circle",
        paint: {
            "circle-radius": 6,
            "circle-color": "rgb(69, 69, 69)",
            "circle-stroke-width": 0,
        },
    });

    const coords = [
        [-75.7056434711706, 45.411482053152355],
        [-75.68813401072144, 45.41880244351859],
        [-75.68967896311442, 45.41383191149768],
        [-75.69382029383326, 45.40878562087508],
        [-75.70703821985823, 45.40776124414705],
        [-75.70765250439985, 45.40758875870438],
        [-75.70795308168667, 45.40749700530583],
        [-75.70799108622552, 45.406286123958324],
        [-75.70807234586376, 45.406894657797636],
        [-75.70813054254967, 45.406888045445214],
        [-75.70811560096264, 45.40722126716253],
        [-75.70833229333094, 45.40708815171527],
        [-75.70881985115987, 45.406897986246264],
        [-75.70744935530473, 45.40573463450403],
        [-75.70671801856207, 45.405601515553485],
        [-75.69970260313997, 45.40564905807153],
    ];
    map.addSource("blinkSource", {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: coords[coords.length - 1],
            },
        },
    });

    const dotCoords = [
        coords[coords.length - 1],
        [-75.69717977810433, 45.405345566981225],
        [-75.69695283793504, 45.404768512278196],
        [-75.69743665964845, 45.40390272379557],
        [-75.69643248938515, 45.403322225120405],
        [-75.6859055325543, 45.40203899680742],
        [-75.67711447526445, 45.40676833459105],
        [-75.66427480803529, 45.40271438730551],
        [-75.65832465493204, 45.39650317263326],
        [-75.63309536561937, 45.399037876337786],
        [-75.61496997451589, 45.3915894325265],
        [-75.61381961158257, 45.390698003623186],
        [-75.61342293470932, 45.39022442629971],
        [-75.61262958096206, 45.390335856615195],
        [-75.61306592552323, 45.39080943300499],
        [-75.61370060852029, 45.39106014831074],
        [-75.61409728539428, 45.39041942920775],
        [-75.61381961158257, 45.39025228389903],
    ];

    map.addImage("balls", (await map.loadImage("./assets/lines.png")).data);
    map.addSource("image", {
        type: "geojson",
        data: {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: dotCoords[dotCoords.length - 1],
            },
        },
    });
    map.addLayer({
        id: "imageLayer",
        source: "image",
        type: "symbol",
        layout: {
            "icon-image": "balls",
            "icon-pitch-alignment": "viewport",
            "icon-size": 0,
        },
    });

    return new Set([
        new MapViewAdjustment({
            startAtTimeSec: 0,
            newZoom: 14,
            newPitch: 45,
            seconds: 3,
        }),
        new Rotation({
            startAtTimeSec: 0,
            type: "mapviewadjustment",
            direction: "counterclockwise",
            newBearing: 15,
            seconds: 3,
        }),
        new InflateDeflate({ startAtTimeSec: 3, layerId: "lineLayer", totalSeconds: 5 }),
        new InflateDeflate({ startAtTimeSec: 3, layerId: "lineLayer2", totalSeconds: 5 }),
        new LineAnimation({
            startAtTimeSec: 3,
            seconds: 3,
            sourceId: "lineSource",
            headPointId: "linehead",
            coords,
        }),
        new LineAnimation({
            startAtTimeSec: 3.25,
            seconds: 3,
            sourceId: "lineSource2",
            maxTrailingPoints: 20,
            coords,
        }),
        new Blink({
            startAtTimeSec: 5.95,
            secondsPerRing: 0.6,
            rings: 2,
            sourceId: "blinkSource",
        }),
        new MapViewAdjustment({
            startAtTimeSec: 6.5,
            newPanCoords: [-75.62770169704265, 45.3920495674009],
            newZoom: 13.7,
            newPitch: 55,
            seconds: 3,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 6.5,
            sourceId: "dottedline",
            dotSpacing: 0.001,
            coords: dotCoords,
            seconds: 5,
        }),
        new Pop({
            startAtTimeSec: 11,
            layerId: "imageLayer",
            finalScale: 0.04,
        }),
        new Rotation({
            startAtTimeSec: 11,
            type: "idle",
            direction: "counterclockwise",
            idleDegreesPerFrame: 0.1,
            idleSeconds: 5,
            postIdleSeconds: 3,
        }),
    ]);
};

export default exportedAnimation;
