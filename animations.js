import {
    InflateDeflate,
    LineAnimation,
    DottedLineAnimation,
    Blink,
    MapViewAdjustment,
    Rotation,
    Pop,
    SetSourceCoords,
    LinearAdjustNumericPaintProp,
    Script,
} from "./drawing.js";
import { hex } from "./utils.js";

/**@type {() => Promise<Set<import("./types").Animation>>} */
let exportedAnimation;

/**
 * @param {GeoJSON.Geometry} geometry
 * @param {boolean} stripped (inner data only)
 * @returns {mapboxgl.GeoJSONSourceRaw}
 */
const newFeature = (geometry, stripped) => {
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
};

/**
 * @param {GeoJSON.Feature[]} features
 * @returns {mapboxgl.GeoJSONSourceRaw}
 */
const newFeatureCollection = (features) => {
    return {
        type: "geojson",
        data: {
            type: "FeatureCollection",
            features,
        },
    };
};

/**
 * @param {string} id
 * @param {string} source
 * @param {mapboxgl.LinePaint} paint
 * @returns {mapboxgl.LineLayer}
 */
const newLineLayer = (id, source, paint) => {
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
};

/**
 * @param {import("./types").AddImageOpts} opts
 * @returns {Promise<[string, string]>} sourceId, layerId
 */
async function addImage(opts) {
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
function addLine(opts) {
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

/**@returns {Promise<Set<import("./types").Animation>>} */
exportedAnimation = async function justATest() {
    map.addSource("lineSource", newFeature({ type: "LineString", coordinates: [] }));
    map.addSource("lineSource2", newLineSource({ type: "LineString", coordinates: [] }));

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
            "line-blur": 10,
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

    const headPointSourceId = "linehead";
    map.addSource(headPointSourceId, {
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
        id: `${headPointSourceId}-layer`,
        source: headPointSourceId,
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
            headPointSourceId: "linehead",
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

exportedAnimation = async function WestboroToTunneys() {
    const WESTBORO_STA = [-75.7519596699675, 45.39629690601967];
    const WESTBORO_CARD_CENTRE = [-75.75192690085203, 45.39818635657434];
    const TUNNEYS_STA = [-75.73570191599588, 45.4037602753138];
    const TUNNEYS_ROUTE = [
        WESTBORO_STA,
        [-75.73735440093928, 45.40247753291061],
        [-75.73755967857237, 45.40294595345671],
        TUNNEYS_STA,
    ];

    const LINE_1_EAST = [
        [-75.73517497389238, 45.40375017125842],
        [-75.7328805737475, 45.40471987464019],
        [-75.73051119157776, 45.40562333626414],
        [-75.72784580561387, 45.40676820742118],
        [-75.72434863582801, 45.40821881797808],
        [-75.72315576134955, 45.408742704026764],
        [-75.72268597005724, 45.40901515869788],
        [-75.72134547350286, 45.409828550188195],
        [-75.72090522540437, 45.41011082657465],
        [-75.72055798836205, 45.41037849486682],
        [-75.71977500287528, 45.41109067753888],
    ];

    const [d60Src, d60Layer] = await addImage({
        imgName: "d60lfr-card",
        coords: WESTBORO_STA,
        layoutOverrides: { "icon-size": 0 },
    });

    const [westboroSrc, westboroLayer] = await addImage({
        imgName: "westboro-card",
        coords: WESTBORO_STA,
        layoutOverrides: { "icon-size": 0 },
        beforeLayer: d60Layer,
    });

    map.addSource("blink-1", newFeature({ type: "Point", coordinates: WESTBORO_STA }));

    map.addSource("caseLineToTunneys", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("caseLineToTunneysLayer", "caseLineToTunneys", {
            "line-color": "#363638",
            "line-width": 17,
            "line-opacity": 1,
        }),
        westboroLayer
    );
    map.addSource("lineToTunneys", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("lineToTunneysLayer", "lineToTunneys", {
            "line-color": "#6E6E70",
            "line-width": 12,
            "line-opacity": 1,
        }),
        westboroLayer
    );

    const [tpSrc, tpLayer] = await addImage({
        imgName: "tp-card",
        coords: TUNNEYS_STA,
        layoutOverrides: { "icon-size": 0 },
        beforeLayer: d60Layer,
    });

    const [tpTransferSrc, tpTransferLayer] = await addImage({
        imgName: "tp-transfers",
        coords: [-75.73239022035902, 45.40329784723133],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [line1Src, line1Layer] = await addImage({
        imgName: "line1-card",
        coords: TUNNEYS_STA,
        layoutOverrides: { "icon-size": 0.2 },
        paintOverrides: { "icon-opacity": 0 },
    });

    map.addSource("spoofLine", newFeature({ type: "LineString", coordinates: [] }));

    map.addSource("caseLine1East", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("caseLine1EastLayer", "caseLine1East", {
            "line-color": "#6B140D",
            "line-width": 17,
            "line-opacity": 1,
        }),
        tpLayer
    );
    map.addSource("line1East", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("line1EastLayer", "line1East", {
            "line-color": "#DA291C",
            "line-width": 12,
            "line-opacity": 1,
        }),
        tpLayer
    );

    const [bayviewSrc, bayviewLayer] = await addImage({
        imgName: "bayview-card",
        coords: [-75.72209320331412, 45.409366452283194],
        layoutOverrides: { "icon-size": 0 },
    });

    const [arrowSrc, arrowLayer] = await addImage({
        imgName: "myArrow",
        coords: LINE_1_EAST[LINE_1_EAST.length - 1],
        layoutOverrides: { "icon-size": 1 },
        paintOverrides: { "icon-opacity": 0 },
    });

    return new Set([
        new MapViewAdjustment({
            startAtTimeSec: 0.5,
            newPanCoords: WESTBORO_CARD_CENTRE,
            newZoom: 14.4,
            seconds: 3,
        }),
        new Pop({
            startAtTimeSec: 0.5,
            layerId: westboroLayer,
            finalScale: 0.2,
            seconds: 0.5,
        }),
        new Blink({
            startAtTimeSec: 3.57,
            sourceId: "blink-1",
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: westboroLayer,
        }),
        new Pop({
            startAtTimeSec: 3.57,
            layerId: d60Layer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new LineAnimation({
            startAtTimeSec: 3.87,
            sourceId: "lineToTunneys",
            coords: TUNNEYS_ROUTE,
            seconds: 3,
        }),
        new LineAnimation({
            startAtTimeSec: 3.78,
            sourceId: "caseLineToTunneys",
            coords: TUNNEYS_ROUTE,
            seconds: 3,
            headPointSourceId: d60Src,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 3.78,
            newPanCoords: [-75.73576416076953, 45.40334666481709],
            newZoom: 15.8,
            newPitch: 45,
            seconds: 3,
        }),
        new SetSourceCoords({
            startAtTimeSec: 4.77,
            sourceId: "blink-1",
            newCoords: TUNNEYS_STA,
        }),
        new Pop({
            startAtTimeSec: 5.36,
            layerId: tpLayer,
            finalScale: 0.2,
            seconds: 0.5,
        }),
        new Blink({
            startAtTimeSec: 6.87,
            sourceId: "blink-1",
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: tpLayer,
        }),
        new Rotation({
            // end at 15.81
            startAtTimeSec: 6.87,
            type: "idle",
            direction: "counterclockwise",
            idleDegreesPerFrame: 0.07,
            idleSeconds: 8.94,
            postIdleSeconds: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.27,
            layerId: tpTransferLayer,
            paintProperty: "icon-opacity",
            newValue: 1,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 14.73,
            layerId: tpTransferLayer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        // spoof
        new LineAnimation({
            startAtTimeSec: 15.77,
            sourceId: "spoofLine",
            coords: [TUNNEYS_STA, LINE_1_EAST[0]],
            seconds: 1,
            headPointSourceId: line1Src,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.81,
            layerId: "caseLineToTunneysLayer",
            seconds: 0.5,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.81,
            layerId: "lineToTunneysLayer",
            seconds: 0.5,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.81,
            layerId: d60Layer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.81,
            layerId: line1Layer,
            paintProperty: "icon-opacity",
            newValue: 1,
            seconds: 0.4,
        }),
        new LineAnimation({
            startAtTimeSec: 16.77,
            sourceId: "line1East",
            coords: LINE_1_EAST,
            seconds: 5,
        }),
        new LineAnimation({
            startAtTimeSec: 16.68,
            sourceId: "caseLine1East",
            coords: LINE_1_EAST,
            seconds: 5,
            headPointSourceId: line1Src,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 16.77,
            newPanCoords: [-75.70872127702195, 45.417839677684924],
            newPitch: 0,
            newZoom: 14,
            seconds: 5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 16.77,
            layerId: westboroLayer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 16.77,
            layerId: tpLayer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 16.77,
            layerId: line1Layer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 5,
        }),
        new Pop({
            startAtTimeSec: 20,
            layerId: bayviewLayer,
            finalScale: 0.2,
            seconds: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 21.77,
            layerId: arrowLayer,
            paintProperty: "icon-opacity",
            newValue: 1,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 21.77,
            layerId: "caseLine1EastLayer",
            seconds: 0.5,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 21.77,
            layerId: "line1EastLayer",
            seconds: 0.5,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
    ]);
};

exportedAnimation = async function Line1Progress() {
    const EXISTING = [
        [-75.73516564044779, 45.4037482730605],
        [-75.73276869931826, 45.40475495823085],
        [-75.73100873494164, 45.4054444814349],
        [-75.72997608535964, 45.40585853706267],
    ];
    const ROUTE = [
        [-75.72997608535964, 45.40585853706267],
        [-75.72914302700592, 45.4062151306492],
    ];
    const DOTTED_LINE_ROUTE = ROUTE.map((r) => [...r]);
    DOTTED_LINE_ROUTE.push(
        ...[
            [-75.72325205864853, 45.40870314910916],
            [-75.7225344403807, 45.40910165218594],
            [-75.72074679644467, 45.41022504543352],
            [-75.71926394316301, 45.41154034023543],
            [-75.71877511626771, 45.41189501586737],
            [-75.71831074771674, 45.41209300991332],
        ]
    );

    map.addSource("caseLine1East", newFeature({ type: "LineString", coordinates: EXISTING }));
    map.addLayer(
        newLineLayer("caseLine1EastLayer", "caseLine1East", {
            "line-color": "#6B140D",
            "line-width": 17,
        })
    );
    map.addSource("line1East", newFeature({ type: "LineString", coordinates: EXISTING }));
    map.addLayer(
        newLineLayer("line1EastLayer", "line1East", {
            "line-color": "#DA291C",
            "line-width": 12,
        })
    );

    const [tpSrc, tpLayer] = await addImage({
        imgName: "tp-card",
        coords: [-75.73516518638024, 45.40375353118054],
        layoutOverrides: { "icon-size": 0.2 },
    });

    const [bayviewSrc, bayviewLayer] = await addImage({
        imgName: "bayview-card",
        coords: [-75.72209320331412, 45.409366452283194],
        layoutOverrides: { "icon-size": 0.2 },
        beforeLayer: tpLayer,
    });

    const [line1Src, line1Layer] = await addImage({
        imgName: "line1-card",
        coords: [-75.73516518638024, 45.40375353118054],
        layoutOverrides: { "icon-size": 0.2 },
        beforeLayer: bayviewLayer,
    });

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer(
        {
            id: "dottedLineLayer",
            source: "dottedLine",
            type: "circle",
            paint: {
                "circle-radius": 7,
                "circle-color": "#DA291C",
                "circle-stroke-width": 0,
                "circle-opacity": 0.5,
            },
        },
        "line1EastLayer"
    );

    return new Set([
        new MapViewAdjustment({
            startAtTimeSec: 0,
            newZoom: 15.83,
            newPanCoords: [-75.72842335827329, 45.40652641386015],
            seconds: 0,
        }),
        new Rotation({
            startAtTimeSec: 0,
            type: "mapviewadjustment",
            direction: "clockwise",
            newBearing: 30,
            seconds: 0,
        }),
        new LineAnimation({
            startAtTimeSec: 0,
            sourceId: "line1East",
            coords: ROUTE,
            seconds: 15,
        }),
        new LineAnimation({
            startAtTimeSec: 0,
            sourceId: "caseLine1East",
            coords: ROUTE,
            seconds: 15,
            headPointSourceId: line1Src,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0,
            seconds: 0,
            sourceId: "dottedLine",
            coords: DOTTED_LINE_ROUTE,
            dotSpacing: 0.0005,
        }),
    ]);
};

exportedAnimation = async function Line2Explained() {
    const LINE_2 = [
        [-75.72210215797827, 45.409372235647396],
        [-75.72041867213107, 45.408205947744506],
        [-75.71976467662806, 45.40777035504655],
        [-75.71942705863844, 45.407532129793935],
        [-75.71886607391663, 45.407108205274255],
        [-75.71861144227064, 45.40689326719209],
        [-75.71720651410159, 45.40597580258688],
        [-75.71584352592551, 45.40508549102208],
        [-75.71475395918262, 45.40433086258429],
        [-75.71409431378683, 45.40382519557761],
        [-75.71322220882877, 45.4030814623118],
        [-75.71252295681037, 45.40226039238834],
        [-75.71194710725628, 45.401401617654244],
        [-75.70929879286304, 45.39702803651244],
        [-75.70865775843848, 45.396045876163015],
        [-75.7081370420191, 45.39535057933236],
        [-75.70745342885022, 45.394655562512895],
        [-75.70642488729084, 45.39385866441947],
        [-75.70571533523022, 45.39341997011803],
        [-75.70417640637993, 45.392714937587186],
        [-75.70203132896184, 45.39191468061776],
        [-75.6992672478578, 45.390876666633744],
        [-75.69841210730878, 45.39046920861264],
        [-75.69778744988169, 45.390022643982036],
        [-75.69705973480171, 45.38937593362144],
        [-75.69644568697699, 45.388530909193236],
        [-75.69593270013192, 45.38743657687104],
        [-75.69582688190954, 45.386717510781494],
        [-75.69601180312823, 45.3841096264816],
        [-75.69579717833308, 45.383360308883454],
        [-75.69532609155884, 45.38250309911709],
        [-75.69444444306076, 45.3812208418116],
        [-75.69390205128737, 45.38068419823256],
        [-75.69325153314502, 45.3802405323307],
        [-75.6925579070697, 45.379913241109705],
        [-75.68402691334214, 45.37652347205761],
        [-75.68030157376998, 45.37510203901664],
        [-75.67751719939017, 45.3739788829094],
        [-75.67435594104457, 45.37259438263621],
        [-75.66948017767399, 45.37065905727175],
        [-75.66823986186039, 45.37018497954526],
        [-75.66712586818419, 45.36960988721964],
        [-75.66656369992513, 45.36928121971752],
        [-75.66444672664778, 45.367616380991336],
        [-75.6638458769386, 45.367100676571965],
        [-75.66311365804154, 45.36639765284065],
        [-75.66214123566202, 45.364873358999915],
        [-75.65164114457697, 45.346906918040304],
        [-75.63074212608163, 45.31183342138377],
        [-75.62993145372884, 45.31001929366329],
        [-75.62945201950656, 45.308466981724166],
        [-75.62782111905791, 45.296983493956986],
        [-75.62785950133126, 45.29641102250409],
        [-75.62801248325404, 45.29599183667344],
        [-75.62834459282249, 45.295494870573066],
        [-75.6288812766268, 45.29500539475663],
        [-75.62936803080343, 45.29469691474429],
        [-75.63625859951294, 45.29195779189689],
        [-75.63700419815024, 45.29160093068194],
        [-75.63779192617336, 45.291177112374925],
        [-75.63864291820677, 45.29060501833422],
        [-75.64002931824011, 45.28964985561413],
        [-75.64073544374341, 45.2892188041408],
        [-75.64173230272668, 45.288746374241356],
        [-75.65164980983812, 45.28469126041222],
        [-75.65237426044543, 45.284464641083275],
        [-75.6539923315077, 45.284078931955264],
        [-75.65462143553053, 45.28388069500875],
        [-75.6553025291885, 45.2835768696624],
        [-75.65598908816446, 45.28312710146531],
        [-75.65651227243261, 45.28267730233327],
        [-75.65761502866552, 45.28150359017167],
        [-75.65800775692787, 45.281197074168745],
        [-75.65841394562837, 45.28095159758436],
        [-75.65920907858096, 45.28055950178165],
        [-75.666653433715, 45.27747083177417],
    ];

    const STATIONS = [
        [-75.72210053523456, 45.40937321040494],
        [-75.71441722547118, 45.404073726798],
        [-75.70946807436523, 45.39730866974611],
        [-75.6959059776403, 45.385593463237086],
        [-75.68517020246489, 45.37697950772284],
        [-75.66589365634955, 45.36875487106127],
        [-75.65916093267916, 45.35977565024254],
        [-75.65539146225306, 45.35332899221848],
        [-75.63214934060849, 45.31419555115468],
        [-75.63312647304512, 45.29320258895231],
        [-75.6666490103562, 45.27747177189795],
    ];

    map.addSource("line2Source", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("line2Layer", "line2Source", {
            "line-width": 12,
            "line-color": "#65A233",
            "line-opacity": 1,
        })
    );

    map.setCenter([-75.72245407957166, 45.409287008717]);
    map.setZoom(15.47);

    const [bayviewSrc, bayviewLayer] = await addImage({
        imgName: "bayview-card-upside",
        coords: [-75.72209320331412, 45.409366452283194],
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 1:44.31
        new MapViewAdjustment({
            startAtTimeSec: 1,
            seconds: 1.15,
            newPanCoords: [-75.72245407957166, 45.409287008717],
            newZoom: 16.35,
        }),
        new Rotation({
            startAtTimeSec: 1,
            type: "mapviewadjustment",
            direction: "clockwise",
            newBearing: 30,
            seconds: 1.15,
        }),
        new Pop({
            startAtTimeSec: 1,
            layerId: bayviewLayer,
            finalScale: 0.2,
            seconds: 0.5,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 2.74,
            seconds: 3,
            newPanCoords: [-75.66672695487205, 45.333786105885025],
            newZoom: 12.24,
            newPitch: 45,
        }),
        new LineAnimation({
            startAtTimeSec: 2.74,
            seconds: 3.9,
            sourceId: "line2Source",
            coords: LINE_2,
        }),
        ...(await Promise.all(
            STATIONS.map(async (c, idx) => {
                const [src, layer] = await addImage({
                    imgName: "dot",
                    coords: c,
                    layoutOverrides: { "icon-size": 0 },
                    beforeLayer: bayviewLayer,
                });
                return new Pop({
                    startAtTimeSec: 2.74 + 0.32 * idx,
                    layerId: layer,
                    finalScale: 0.75,
                    maxVsEnd: 0.5,
                    seconds: 0.3,
                });
            })
        )),
    ]);
};

exportedAnimation = async function PlanOnLine2() {
    const BAYVIEW = [-75.72209320331412, 45.409366452283194];
    const CORSO = [-75.714416721956, 45.40406848224387];
    const ROUTE = [
        BAYVIEW,
        [-75.71944289470933, 45.407552330289235],
        [-75.7188896989529, 45.40713119793682],
        [-75.71853645347032, 45.406831724131706],
        [-75.71590512301107, 45.405109600238035],
        CORSO,
    ];

    const BRONSON = [-75.70367533648266, 45.40789371770745];
    const ROUTE_PT_2 = [
        [-75.71368615666162, 45.404060785752534],
        [-75.71314000719764, 45.40427866666778],
        [-75.71192947111572, 45.40463434786142],
        [-75.70893743510888, 45.40549692698292],
        [-75.70842805937052, 45.40580221573404],
        [-75.70721554918485, 45.406459207478406],
        [-75.70603947290681, 45.40686382891559],
        BRONSON,
    ];

    map.setCenter([-75.72215418779535, 45.40916947454954]);
    map.setZoom(16.5);

    map.addSource("caseLine2Source", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("caseLine2Layer", "caseLine2Source", {
            "line-width": 17,
            "line-color": "#203311",
            "line-opacity": 1,
        })
    );

    map.addSource("line2Source", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("line2Layer", "line2Source", {
            "line-width": 12,
            "line-color": "#65A233",
            "line-opacity": 1,
        })
    );

    map.addSource("case14Source", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("case14Layer", "case14Source", {
            "line-width": 17,
            "line-color": "#002249",
            "line-opacity": 1,
        })
    );

    map.addSource("14Source", newFeature({ type: "LineString", coordinates: [] }));
    map.addLayer(
        newLineLayer("14Layer", "14Source", {
            "line-width": 12,
            "line-color": "#0056B8",
            "line-opacity": 1,
        })
    );

    const [bayviewSrc, bayviewLayer] = await addImage({
        imgName: "bayview-card-upside",
        coords: BAYVIEW,
        layoutOverrides: { "icon-size": 0 },
    });

    const [corsoSrc, corsoLayer] = await addImage({
        imgName: "corso-card",
        coords: CORSO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [bronsonSrc, bronsonLayer] = await addImage({
        imgName: "bronson-card",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [l2Src, l2Layer] = await addImage({
        imgName: "line2-card",
        coords: BAYVIEW,
        layoutOverrides: { "icon-size": 0 },
    });

    const [fourteenSrc, fourteenLayer] = await addImage({
        imgName: "14-card",
        coords: [-75.71368615666162, 45.404060785752534],
        layoutOverrides: { "icon-size": 0 },
    });

    const [tenSrc, tenLayer] = await addImage({
        imgName: "10-card",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 2:47.23
        new Pop({
            startAtTimeSec: 0,
            layerId: bayviewLayer,
            finalScale: 0.2,
            seconds: 0.5,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 0.5,
            newPanCoords: [-75.71109065034318, 45.40701049126332],
            newZoom: 15.2,
            seconds: 2.25,
        }),
        new Pop({
            startAtTimeSec: 5.35,
            layerId: l2Layer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new LineAnimation({
            startAtTimeSec: 5.35,
            sourceId: "caseLine2Source",
            coords: ROUTE,
            seconds: 1.87,
            headPointSourceId: l2Src,
        }),
        new LineAnimation({
            startAtTimeSec: 5.44,
            sourceId: "line2Source",
            coords: ROUTE,
            seconds: 1.87,
        }),
        new Pop({
            startAtTimeSec: 6.77,
            layerId: corsoLayer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new Pop({
            startAtTimeSec: 8.8,
            layerId: fourteenLayer,
            seconds: 0.3,
            finalScale: 0.2,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.8,
            layerId: l2Layer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.8,
            layerId: "caseLine2Layer",
            paintProperty: "line-opacity",
            newValue: 0,
            seconds: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.89,
            layerId: "line2Layer",
            paintProperty: "line-opacity",
            newValue: 0.5,
            seconds: 0.5,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 8.8,
            seconds: 3,
            newPanCoords: [-75.70334572043896, 45.408466762965276],
            newZoom: 16.13,
        }),
        new LineAnimation({
            startAtTimeSec: 8.8,
            seconds: 2.18,
            sourceId: "case14Source",
            coords: ROUTE_PT_2,
            headPointSourceId: fourteenSrc,
        }),
        new LineAnimation({
            startAtTimeSec: 8.89,
            seconds: 2.18,
            sourceId: "14Source",
            coords: ROUTE_PT_2,
        }),
        new Pop({
            startAtTimeSec: 10.2,
            seconds: 0.3,
            finalScale: 0.2,
            layerId: bronsonLayer,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.32,
            layerId: fourteenLayer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.32,
            layerId: "case14Layer",
            paintProperty: "line-opacity",
            newValue: 0,
            seconds: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.32,
            layerId: "14Layer",
            paintProperty: "line-opacity",
            newValue: 0.5,
            seconds: 0.5,
        }),
        new Pop({
            startAtTimeSec: 11.32,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: tenLayer,
        }),
    ]);
};

exportedAnimation = async function runToBronson() {
    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#6E6E70",
            "circle-stroke-width": 0,
        },
    });

    const CORSO = [-75.714416721956, 45.40406848224387];
    const [corsoSrc, corsoLayer] = await addImage({
        imgName: "corso-card-upside",
        coords: CORSO,
        layoutOverrides: { "icon-size": 0.2 },
    });

    const BRONSON = [-75.70344090759916, 45.407389030579424];
    const [bronsonSrc, bronsonLayer] = await addImage({
        imgName: "bronson-card-upside",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [tenSrc, tenLayer] = await addImage({
        imgName: "10-card-downside",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [walkSrc, walkLayer] = await addImage({
        imgName: "walking",
        coords: [-75.7097733362697, 45.406192547431914],
        layoutOverrides: { "icon-size": 0 },
    });

    map.addSource("blinker", newFeature({ type: "Point", coordinates: BRONSON }));

    map.setCenter([-75.70790972909833, 45.40543167377885]);
    map.setZoom(14.54);

    const ROUTE = [
        CORSO,
        [-75.71398851603252, 45.403982200993795],
        [-75.7131858921095, 45.40425054565003],
        [-75.71195010606958, 45.40464411550707],
        [-75.70965689486079, 45.405297077630564],
        [-75.70873961037749, 45.405565416040986],
        [-75.70828096813531, 45.40589636499192],
        [-75.70727450321593, 45.4064598682038],
        [-75.70600049698889, 45.406916033353326],
        [-75.70387290658988, 45.40779257565387],
        [-75.70369454571828, 45.407846241067176],
        [-75.7035034447843, 45.40750635925545],
        BRONSON,
    ];

    return new Set([
        // start: 4:01.22
        new MapViewAdjustment({
            startAtTimeSec: 0,
            newPanCoords: [-75.70807641478302, 45.40570883203509],
            newZoom: 15.75,
            seconds: 1.15,
        }),
        new Pop({
            startAtTimeSec: 2.125,
            layerId: walkLayer,
            finalScale: 0.16,
            seconds: 0.3,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 1.15,
            sourceId: "dottedLine",
            dotSpacing: 0.0004,
            coords: ROUTE,
            seconds: 1.95,
        }),
        new Blink({
            startAtTimeSec: 3.1,
            sourceId: "blinker",
            ringLayerBefore: bronsonLayer,
            rings: 2,
            secondsPerRing: 0.4,
        }),
        new Pop({
            startAtTimeSec: 3.1,
            layerId: tenLayer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new Pop({
            startAtTimeSec: 3.1,
            layerId: bronsonLayer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
    ]);
};

exportedAnimation = async function Route10Options() {
    const BRONSON = [-75.7034101022574, 45.407441578141004];
    const CARLETON = [-75.69642445405968, 45.387037254742836];
    const HURDMAN = [-75.66483777324876, 45.41216683687833];
    const TO_CARLETON = [
        BRONSON,
        [-75.69707472319533, 45.39651771810412],
        [-75.69644327135153, 45.39531418241134],
        [-75.69628863008411, 45.394870768062816],
        [-75.69607247618379, 45.3931167459605],
        [-75.69577906661299, 45.392372668581146],
        [-75.69420688039304, 45.390137346517406],
        [-75.69419399362062, 45.38989299421087],
        [-75.69584350047758, 45.389096579361194],
        [-75.69608834915141, 45.389051328180585],
        [-75.69615026642487, 45.38893075885599],
        [-75.69700429909274, 45.38858802689472],
        [-75.69674412449358, 45.38808272466824],
        [-75.69657659645374, 45.38774785906722],
        [-75.69648638904734, 45.38735868844378],
        CARLETON,
    ];

    const TO_HURDMAN = [
        ...TO_CARLETON.map((r) => [...r]),
        [-75.6961777912483, 45.38335699423601],
        [-75.69585718977368, 45.38268145738911],
        [-75.69562208202542, 45.38233617988405],
        [-75.69537628756122, 45.38228363747001],
        [-75.69433967612639, 45.38259889122125],
        [-75.69385877391396, 45.382869107323415],
        [-75.69368778646073, 45.38316183997583],
        [-75.6936770997448, 45.38339452382411],
        [-75.69401907465128, 45.384002499680975],
        [-75.69188173148606, 45.38467802074197],
        [-75.69016117023827, 45.385038295341104],
        [-75.68802470811434, 45.38206309155146],
        [-75.68728608443382, 45.38101048659229],
        [-75.68636058718846, 45.37997646944723],
        [-75.68581556468101, 45.3795035662267],
        [-75.68534251959889, 45.37895985052825],
        [-75.68512878528244, 45.37850945850096],
        [-75.68490711111733, 45.3772538111258],
        [-75.68095302626153, 45.37756158623412],
        [-75.68100564703987, 45.37818577989202],
        [-75.68070641899703, 45.3787562791201],
        [-75.67995721354559, 45.3801655304413],
        [-75.67922711630841, 45.38150309112768],
        [-75.67904544213926, 45.38202852032421],
        [-75.67908818900293, 45.38248639035646],
        [-75.67928054988751, 45.38293675070477],
        [-75.67935535689845, 45.38308687002362],
        [-75.67926986317207, 45.38319945925119],
        [-75.67907750228699, 45.38323698894385],
        [-75.67901338199198, 45.38301181041405],
        [-75.67895994841285, 45.38283166694413],
        [-75.67877827424371, 45.38271907698413],
        [-75.67858591335911, 45.38267404093756],
        [-75.67841045398418, 45.3830069139035],
        [-75.67792404142898, 45.38345492451322],
        [-75.67690986315536, 45.384243647267],
        [-75.67574443938555, 45.38530356172805],
        [-75.67410727279632, 45.38681142658393],
        [-75.67175299882952, 45.38900438139086],
        [-75.67072041515777, 45.39036863797679],
        [-75.66930555561515, 45.3927354544241],
        [-75.66896751164009, 45.39354272750927],
        [-75.66903496215812, 45.393803239905964],
        [-75.66920936761811, 45.394052560609765],
        [-75.66953297398726, 45.39437194744721],
        [-75.6699059413138, 45.39468297057189],
        [-75.67005234484937, 45.39495568811037],
        [-75.67006399178844, 45.3952483851819],
        [-75.66988249243398, 45.395644834256075],
        [-75.66963516921868, 45.39611622809173],
        [-75.66929498247488, 45.39664801030608],
        [-75.66887444624258, 45.39754286232866],
        [-75.66824350841051, 45.398335986213795],
        [-75.66795745690729, 45.398765554421686],
        [-75.66766067462773, 45.3994380854505],
        [-75.66727027307338, 45.40023397197447],
        [-75.66678400267688, 45.40095727348148],
        [-75.66613484602813, 45.40197334787757],
        [-75.66524014569332, 45.40331112580307],
        [-75.6646412819828, 45.40452019678588],
        [-75.6644809812455, 45.40524799374987],
        [-75.6641841997979, 45.4081879560967],
        [-75.66413862690314, 45.41189121531988],
        [-75.66428189749452, 45.41212484411517],
        [-75.66437365584142, 45.412179641686805],
        [-75.66452971278642, 45.4121867554677],
        HURDMAN,
    ];

    map.setCenter([-75.6706562795452, 45.396983145373866]);
    map.setZoom(13.48);

    map.addSource("blinker", newFeature({ type: "Point", coordinates: HURDMAN }));

    const [tenCarSrc, tenCarLayer, caseTenCarSrc, caseTenCarLayer] = addLine({
        lineName: "10ToCarleton",
        coords: [],
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
        casing: true,
    });

    const [tenHurSrc, tenHurLayer, caseTenHurSrc, caseTenHurLayer] = addLine({
        lineName: "10ToHurdman",
        coords: [],
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
        casing: true,
    });

    const [bronsonSrc, bronsonLayer] = await addImage({
        imgName: "bronson-card-upside",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [carletonSrc, carletonLayer] = await addImage({
        imgName: "carleton-card",
        coords: CARLETON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [hurdmanSrc, hurdmanLayer] = await addImage({
        imgName: "hurdman-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [route10Src, route10Layer] = await addImage({
        imgName: "10-card-downside",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [alsoRoute10Src, alsoRoute10Layer] = await addImage({
        imgName: "10-card-downside",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [transferSrc, transferLayer] = await addImage({
        imgName: "hur-transfers",
        coords: [-75.64266566970768, 45.406390660312695], //[-75.65361389046085, 45.409384318137285],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [carTransferSrc, carTransferLayer] = await addImage({
        imgName: "car-transfers",
        coords: [-75.7096351511597, 45.38285384697968],
        layoutOverrides: { "icon-size": 0.25 },
        paintOverrides: { "icon-opacity": 0 },
    });

    return new Set([
        // start: 4:45.52
        new Pop({
            startAtTimeSec: 1,
            layerId: bronsonLayer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new Pop({
            startAtTimeSec: 1,
            layerId: route10Layer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 1,
            newPanCoords: [-75.68647790538563, 45.395019304089715],
            newZoom: 13.01,
            seconds: 1.15,
        }),
        new LineAnimation({
            startAtTimeSec: 1,
            sourceId: caseTenHurSrc,
            coords: TO_HURDMAN,
            seconds: 1.68,
            headPointSourceId: route10Src,
        }),
        new LineAnimation({
            startAtTimeSec: 1.09,
            sourceId: tenHurSrc,
            coords: TO_HURDMAN,
            seconds: 1.68,
        }),
        new Blink({
            startAtTimeSec: 2.68,
            sourceId: "blinker",
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: hurdmanLayer,
        }),
        new Pop({
            startAtTimeSec: 2,
            layerId: hurdmanLayer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 2.68,
            layerId: transferLayer,
            paintProperty: "icon-opacity",
            seconds: 0.5,
            newValue: 1,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 4,
            seconds: 1.5,
            newPanCoords: [-75.70356166489591, 45.392085683326655],
            newZoom: 13.61,
        }),
        new SetSourceCoords({
            startAtTimeSec: 4.47,
            sourceId: "blinker",
            newCoords: CARLETON,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.48,
            layerId: transferLayer,
            paintProperty: "icon-opacity",
            seconds: 0.5,
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.48,
            layerId: hurdmanLayer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.48,
            layerId: route10Layer,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.48,
            layerId: tenHurLayer,
            paintProperty: "line-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.48,
            layerId: caseTenHurLayer,
            paintProperty: "line-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new Pop({
            startAtTimeSec: 4.48,
            layerId: alsoRoute10Layer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new LineAnimation({
            startAtTimeSec: 4.48,
            seconds: 1,
            sourceId: caseTenCarSrc,
            coords: TO_CARLETON,
            headPointSourceId: alsoRoute10Src,
        }),
        new LineAnimation({
            startAtTimeSec: 4.57,
            seconds: 1,
            sourceId: tenCarSrc,
            coords: TO_CARLETON,
        }),
        new Pop({
            startAtTimeSec: 5.48,
            layerId: carletonLayer,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new Blink({
            startAtTimeSec: 5.48,
            sourceId: "blinker",
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: carletonLayer,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 5.48,
            layerId: carTransferLayer,
            paintProperty: "icon-opacity",
            newValue: 1,
            seconds: 0.5,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 8.66,
            newPanCoords: [-75.69737570664478, 45.383845206524626],
            seconds: 1.15,
        }),
    ]);
};

exportedAnimation = async function WhereThe10() {
    const BRONSON = [-75.7034519076571, 45.40740330450723];
    const ROUTE = [
        [-75.70716610269996, 45.41700032675149],
        [-75.70860361096521, 45.41637745475063],
        BRONSON,
    ];

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#002249",
            "circle-stroke-width": 0,
        },
    });

    const [busSrc, busLayer] = await addImage({
        imgName: "bus",
        coords: ROUTE[0],
        layoutOverrides: { "icon-size": 0 },
    });

    const [etaSrc, etaLayer] = await addImage({
        imgName: "eta-3min",
        coords: [-75.7039484167949, 45.41621366026641],
        layoutOverrides: { "icon-size": 0.25 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [bronsonSrc, bronsonLayer] = await addImage({
        imgName: "bronson-card",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0 },
    });

    map.setBearing(-30);
    map.setCenter([-75.70698558589368, 45.41103670248279]);
    map.setZoom(14.65);

    return new Set([
        // start: 5:16.25
        new Pop({
            startAtTimeSec: 0.2,
            finalScale: 0.15,
            seconds: 0.3,
            layerId: busLayer,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0.5,
            sourceId: "dottedLine",
            coords: ROUTE,
            dotSpacing: 0.0005,
            seconds: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 1,
            paintProperty: "icon-opacity",
            newValue: 1,
            layerId: etaLayer,
            seconds: 0.5,
        }),
        new Pop({
            startAtTimeSec: 1.13,
            finalScale: 0.2,
            seconds: 0.3,
            layerId: bronsonLayer,
        }),
    ]);
};

exportedAnimation = async function WhatImConsidering() {
    const BRONSON = [-75.7034101022574, 45.407441578141004];
    const CARLETON = [-75.69642445405968, 45.387037254742836];
    const TO_CARLETON = [
        BRONSON,
        [-75.69707472319533, 45.39651771810412],
        [-75.69644327135153, 45.39531418241134],
        [-75.69628863008411, 45.394870768062816],
        [-75.69607247618379, 45.3931167459605],
        [-75.69577906661299, 45.392372668581146],
        [-75.69420688039304, 45.390137346517406],
        [-75.69419399362062, 45.38989299421087],
        [-75.69584350047758, 45.389096579361194],
        [-75.69608834915141, 45.389051328180585],
        [-75.69615026642487, 45.38893075885599],
        [-75.69700429909274, 45.38858802689472],
        [-75.69674412449358, 45.38808272466824],
        [-75.69657659645374, 45.38774785906722],
        [-75.69648638904734, 45.38735868844378],
        CARLETON,
    ];

    const GREENBORO = [-75.65913969062379, 45.35961178521967];
    const TO_GREENBORO = [
        CARLETON,
        [-75.69602233218502, 45.38454507945815],
        [-75.69601635382973, 45.38414227504401],
        [-75.69593448952081, 45.38377699623044],
        [-75.69581410083076, 45.38338465709785],
        [-75.69548076407209, 45.38276330029771],
        [-75.69442056625932, 45.38121173655978],
        [-75.69417123956624, 45.38090559808222],
        [-75.69362267613921, 45.380478840556066],
        [-75.69305925706917, 45.38016427466965],
        [-75.67830360784824, 45.37431367407882],
        [-75.66921073635245, 45.370588109354514],
        [-75.66770559578687, 45.36993265311028],
        [-75.6667353951386, 45.36939111184989],
        [-75.66584442583789, 45.368749730682424],
        [-75.66490745123863, 45.36799809164552],
        [-75.66370995004331, 45.366987750060474],
        [-75.66282714952675, 45.36600691778406],
        [-75.66240185608864, 45.36533073501681],
        GREENBORO,
    ];

    map.setCenter([-75.69754736803833, 45.388920786424876]);
    map.setZoom(13);

    map.addSource("blinker", newFeature({ type: "Point", coordinates: CARLETON }));

    const [tenSrc, tenLayer, tenCaseSrc, tenCaseLayer] = addLine({
        lineName: "10ToCarleton",
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
    });

    const [twoSrc, twoLayer, twoCaseSrc, twoCaseLayer] = addLine({
        lineName: "2ToGreenboro",
        paintOverrides: { "line-color": "#65A233" },
        casingPaintOverrides: { "line-color": "#203311" },
    });

    const [carlSrc, carlLayer] = await addImage({
        imgName: "carleton-card-downside",
        coords: CARLETON,
        layoutOverrides: { "icon-size": 0 },
    });

    const [gbroS, gbroL] = await addImage({
        imgName: "greenboro-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [carlTransferSrc, carlTransferLayer] = await addImage({
        imgName: "car-transfers",
        coords: [-75.7071604051438, 45.389013820659514],
        layoutOverrides: { "icon-size": 0.25 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [gbroTransfer, gbroTransferLayer] = await addImage({
        imgName: "gb-transfers",
        coords: [-75.65429515765044, 45.361115636414155],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [inveroS, inveroL] = await addImage({
        imgName: "invero",
        coords: [-75.70819037340561, 45.389013820659514],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [xe40S, xe40L] = await addImage({
        imgName: "xe40",
        coords: [-75.68480401873016, 45.389013820659514],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [the10, the10Layer] = await addImage({
        imgName: "10-card",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0.2 },
    });

    const [l2, l2Layer] = await addImage({
        imgName: "also-line2-card",
        coords: TO_GREENBORO[0],
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 6:26.45
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 1.15,
            newZoom: 14,
        }),
        new Pop({
            startAtTimeSec: 0,
            finalScale: 0.2,
            seconds: 0.3,
            layerId: carlLayer,
        }),
        new LineAnimation({
            startAtTimeSec: 0,
            seconds: 1.7,
            sourceId: tenCaseSrc,
            coords: TO_CARLETON,
            headPointSourceId: the10,
        }),
        new LineAnimation({
            startAtTimeSec: 0.09,
            seconds: 1.7,
            sourceId: tenSrc,
            coords: TO_CARLETON,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 1.15,
            layerId: carlTransferLayer,
            paintProperty: "icon-opacity",
            newValue: 1,
            seconds: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 1.7,
            seconds: 0.5,
            layerId: tenCaseLayer,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 1.7,
            seconds: 0.5,
            layerId: tenLayer,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
        new Blink({
            startAtTimeSec: 1.7,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker",
            ringLayerBefore: carlLayer,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 3.62,
            seconds: 0.4,
            layerId: inveroL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new SetSourceCoords({
            startAtTimeSec: 5,
            sourceId: "blinker",
            newCoords: GREENBORO,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 5.86,
            seconds: 0.4,
            layerId: xe40L,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.4,
            seconds: 0.5,
            layerId: xe40L,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.4,
            seconds: 0.5,
            layerId: inveroL,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.4,
            seconds: 0.5,
            layerId: the10Layer,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new Pop({
            startAtTimeSec: 8.93,
            seconds: 0.25,
            finalScale: 0.3,
            layerId: l2Layer,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 8.93,
            seconds: 1.15,
            newZoom: 14.5,
        }),
        new Pop({
            startAtTimeSec: 13.62,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: gbroL,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 11,
            seconds: 3.09,
            newPanCoords: [-75.65724956501555, 45.360179048785625],
            newZoom: 15.46,
            newPitch: 45,
        }),
        new LineAnimation({
            startAtTimeSec: 11,
            sourceId: twoCaseSrc,
            seconds: 3.09,
            coords: TO_GREENBORO,
            headPointSourceId: l2,
        }),
        new LineAnimation({
            startAtTimeSec: 11.09,
            sourceId: twoSrc,
            seconds: 3.09,
            coords: TO_GREENBORO,
        }),
        new Rotation({
            startAtTimeSec: 14.09,
            type: "idle",
            direction: "clockwise",
            idleDegreesPerFrame: 0.05,
            idleSeconds: 8,
            postIdleSeconds: 0.01,
        }),
        new Blink({
            startAtTimeSec: 14.09,
            sourceId: "blinker",
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: gbroL,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 14.69,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            newValue: 1,
            layerId: gbroTransferLayer,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 14.69,
            seconds: 0.5,
            layerId: twoCaseLayer,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 14.69,
            seconds: 0.5,
            layerId: twoLayer,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
    ]);
};

exportedAnimation = async function The98() {
    const GREENBORO = [-75.65913969062379, 45.35961178521967];
    const TO_GREENBORO = [
        [-75.69602233218502, 45.38454507945815],
        [-75.69601635382973, 45.38414227504401],
        [-75.69593448952081, 45.38377699623044],
        [-75.69581410083076, 45.38338465709785],
        [-75.69548076407209, 45.38276330029771],
        [-75.69442056625932, 45.38121173655978],
        [-75.69417123956624, 45.38090559808222],
        [-75.69362267613921, 45.380478840556066],
        [-75.69305925706917, 45.38016427466965],
        [-75.67830360784824, 45.37431367407882],
        [-75.66921073635245, 45.370588109354514],
        [-75.66770559578687, 45.36993265311028],
        [-75.6667353951386, 45.36939111184989],
        [-75.66584442583789, 45.368749730682424],
        [-75.66490745123863, 45.36799809164552],
        [-75.66370995004331, 45.366987750060474],
        [-75.66282714952675, 45.36600691778406],
        [-75.66240185608864, 45.36533073501681],
        GREENBORO,
    ];

    const GREENBORO_A = [-75.65846718221718, 45.35988632624296];
    const TO_HURDMAN = [
        GREENBORO,
        [-75.65887244242377, 45.36072137513034],
        [-75.659022376438, 45.36095305656872],
        [-75.65914192424518, 45.36105854569229],
        [-75.66070738603003, 45.361767429316814],
        [-75.66105859746864, 45.36196381640451],
        [-75.66149763553675, 45.36231288409772],
        [-75.66178708559906, 45.362670106519914],
        [-75.66309137579259, 45.3647503730254],
        [-75.66428909514305, 45.36615223803139],
        [-75.66502383564885, 45.366909135836295],
        [-75.6667254959939, 45.36849931588432],
        [-75.6684799497483, 45.36980300225662],
        [-75.66916713533472, 45.37017928075841],
        [-75.67358131226179, 45.371976880494856],
        [-75.67883619380882, 45.37410501672369],
        [-75.67928547212986, 45.37436743066718],
        [-75.67964547686624, 45.374649588061516],
        [-75.6799079765594, 45.37494746038689],
        [-75.68017033395611, 45.37545760308993],
        [-75.68026968609134, 45.375907351694025],
        [-75.6801737727429, 45.37686560266016],
        [-75.67986966614137, 45.37817675058844],
        [-75.67929789093826, 45.379806456209394],
        [-75.67886430253635, 45.380432962247255],
        [-75.678468989678, 45.380955689831296],
        [-75.67840336475436, 45.3812499832444],
        [-75.67840336475436, 45.381505272675355],
        [-75.67862183422005, 45.382293629497724],
        [-75.67859340374913, 45.38260992819005],
        [-75.67843823033566, 45.382965207696884],
        [-75.67815718349998, 45.38329417170581],
        [-75.67721572140563, 45.38399618652781],
        [-75.67608564561534, 45.38498565145164],
        [-75.67496224010075, 45.38601603464329],
        [-75.67355984685179, 45.38730691073587],
        [-75.6724085348108, 45.38842287315504],
        [-75.67178373978882, 45.38903319647261],
        [-75.67125398927608, 45.38966581863329],
        [-75.67080263730371, 45.39020770670348],
        [-75.66986854182159, 45.3916878166832],
        [-75.66906860257586, 45.39321275500663],
        [-75.66896259308815, 45.39364983039613],
        [-75.66927371113138, 45.39412335019324],
        [-75.6699440769193, 45.394692363044015],
        [-75.67009551904994, 45.395068116046275],
        [-75.66997941341653, 45.39546868017496],
        [-75.66937045783928, 45.39654665758147],
        [-75.66867231453422, 45.397851800149],
        [-75.66797213560706, 45.39878683657719],
        [-75.66773487626897, 45.399279533076395],
        [-75.6673147971634, 45.40017832531299],
        [-75.66671142101156, 45.40107824533135],
        [-75.66593578731661, 45.402284937175295],
        [-75.66489145097586, 45.403931164730324],
        [-75.66472894743848, 45.40427622355594],
        [-75.66448664002912, 45.405367842073076],
        [-75.6641897710596, 45.40789930780264],
        [-75.66411822464288, 45.40959624597696],
        [-75.66414851306966, 45.41199761823242],
        [-75.66428421335874, 45.41214658116559],
        [-75.6644709919866, 45.412206824992666],
        [-75.66468805904042, 45.41220328124007],
    ];

    map.setCenter([-75.6591870809882, 45.36184524076464]);
    map.setZoom(14.3);

    const zoomExpr = ["interpolate", ["linear"], ["zoom"], 11, 0.1, 14.3, 0.3];

    map.addSource("blinker", newFeature({ type: "Point", coordinates: GREENBORO }));

    const [l2, l2L, caseL2, caseL2L] = addLine({
        lineName: "line2",
        paintOverrides: { "line-color": "#65A233" },
        casingPaintOverrides: { "line-color": "#203311" },
    });

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#0056B8",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const [gbro, gbroL] = await addImage({
        imgName: "greenboro-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [gbroTransfer, gbroTransferL] = await addImage({
        imgName: "gb-transfers",
        coords: [GREENBORO[0], 45.35381121637866],
        layoutOverrides: {
            "icon-size": zoomExpr,
        },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [theline2S, theline2L] = await addImage({
        imgName: "also-line2-card",
        coords: TO_GREENBORO[0],
        layoutOverrides: {
            "icon-size": 0.3,
        },
    });

    const [the98, the98L] = await addImage({
        imgName: "98-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [d40i, d40iL] = await addImage({
        imgName: "d40i-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 7:16.52
        new LineAnimation({
            startAtTimeSec: 0,
            coords: TO_GREENBORO,
            sourceId: caseL2,
            seconds: 2.15,
            headPointSourceId: theline2S,
        }),
        new LineAnimation({
            startAtTimeSec: 0.09,
            coords: TO_GREENBORO,
            sourceId: l2,
            seconds: 2.15,
        }),
        new Blink({
            startAtTimeSec: 2.15,
            ringLayerBefore: gbroL,
            rings: 2,
            secondsPerRing: 0.4,
            sourceId: "blinker",
        }),
        new Pop({
            startAtTimeSec: 2.15,
            finalScale: 0.3,
            seconds: 0.2,
            layerId: gbroL,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 2.15,
            seconds: 0.5,
            paintProperty: "line-opacity",
            newValue: 0,
            layerId: caseL2L,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 2.15,
            seconds: 0.5,
            paintProperty: "line-opacity",
            newValue: 0.5,
            layerId: l2L,
        }),
        new Script({
            startAtTimeSec: 2.5,
            frames: 1,
            execute: () => map.setLayoutProperty(gbroL, "icon-size", zoomExpr),
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 5.32,
            seconds: 0.5,
            layerId: gbroTransferL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.33,
            seconds: 0.5,
            layerId: theline2L,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new Pop({
            startAtTimeSec: 7.63,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: the98L,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.33,
            seconds: 0.5,
            layerId: gbroTransferL,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 7.63,
            // newPanCoords: [-75.65956510266318, 45.368940111412],
            newPanCoords: [-75.66575106088828, 45.386794894196555],
            newZoom: 12.61,
            seconds: 1,
        }),
        new Script({
            startAtTimeSec: 8,
            frames: 1,
            execute: () => map.setLayoutProperty(the98L, "icon-size", zoomExpr),
        }),
        new DottedLineAnimation({
            startAtTimeSec: 8,
            seconds: 2,
            coords: TO_HURDMAN,
            sourceId: "dottedLine",
            dotSpacing: 0.0025,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 10.22,
            newPanCoords: [-75.6591870809882, 45.3626044950565],
            newZoom: 14.3,
            seconds: 2,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 10.22,
            seconds: 0.5,
            layerId: the98L,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 10.22,
            seconds: 0.5,
            layerId: "dottedLineLayer",
            paintProperty: "circle-opacity",
            newValue: 0.5,
        }),
        new Pop({
            startAtTimeSec: 11.1,
            layerId: d40iL,
            seconds: 0.3,
            finalScale: 0.3,
        }),
    ]);
};

exportedAnimation = async function TheresADoubleDecker() {
    map.setCenter([-75.65791313198667, 45.358764243005965]);
    map.setZoom(11.5);

    const GREENBORO = [-75.65852536768337, 45.35983385046205];
    const SOUTH_KEYS = [-75.65508897336608, 45.35354476807569];
    const ROUTE = [
        SOUTH_KEYS,
        [-75.65577077797006, 45.35458383067785],
        [-75.65663806207283, 45.35596869632923],
        [-75.65791052289822, 45.3581456212373],
        [-75.65799321179105, 45.35834979700232],
        [-75.65845429115349, 45.35970544021626],
        [-75.65887321885342, 45.360816183685955],
        [-75.6590562616064, 45.36102473053273],
        [-75.65922588392614, 45.3611571875218],
        [-75.65943897295934, 45.36125379005716],
        [-75.66083255966151, 45.361858015317864],
        [-75.66114702522928, 45.362068195274134],
        [-75.66147991271805, 45.36232381522183],
        [-75.66173593104511, 45.36264807135345],
        [-75.66269838726362, 45.364186550890025],
        [-75.6629592990591, 45.36457779413141],
        [-75.66376232648497, 45.365580271012135],
        [-75.6648514516259, 45.366772813030764],
        [-75.66491573400927, 45.36682196929084],
        [-75.66736865295393, 45.36887441745347],
        [-75.66894710706345, 45.369942994982324],
        [-75.67246293207336, 45.371488520025565],
        [-75.67832218336673, 45.373953997347854],
    ];

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#0056B8",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const [sk, skL] = await addImage({
        imgName: "sk-card",
        coords: SOUTH_KEYS,
        layoutOverrides: { "icon-size": 0 },
    });
    const [gb, gbL] = await addImage({
        imgName: "greenboro-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [eta, etaL] = await addImage({
        imgName: "eta-11-mins",
        //-75.65531769163947, 45.355017497559174
        coords: [-75.65571757475978, 45.35506198077118],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [the98, the98L] = await addImage({
        imgName: "98-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 8:10.27
        new MapViewAdjustment({
            startAtTimeSec: 0,
            newZoom: 14,
            seconds: 1.15,
        }),
        new Rotation({
            startAtTimeSec: 0,
            direction: "clockwise",
            newBearing: 23.01,
            seconds: 1.15,
            type: "mapviewadjustment",
        }),
        new Pop({
            startAtTimeSec: 1.5666,
            layerId: the98L,
            finalScale: 0.3,
            seconds: 0.3,
        }),
        new Pop({
            startAtTimeSec: 4.1333,
            layerId: skL,
            finalScale: 0.3,
            seconds: 0.3,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 4.1333,
            sourceId: "dottedLine",
            dotSpacing: 0.001,
            seconds: 1,
            coords: ROUTE,
        }),
        new Pop({
            startAtTimeSec: 6.3666,
            layerId: gbL,
            finalScale: 0.3,
            seconds: 0.3,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 6.3666,
            seconds: 1,
            newPanCoords: [-75.65898782409874, 45.36031094491784],
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 6.3666,
            seconds: 0.5,
            layerId: etaL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 6.3666,
            seconds: 0.5,
            layerId: skL,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
    ]);
};

exportedAnimation = async function BatteryBus() {
    const GREENBORO = [-75.65852536768337, 45.35983385046205];
    const BLAIR = [-75.6087562950158, 45.43125273888009];
    const MIDPOINT = [-75.65654899328766, 45.41430819597372];
    const HURDMAN = [-75.6647196345966, 45.412172356662325];
    const TO_MIDPOINT = [
        BLAIR,
        [-75.60893108964336, 45.4311538747269],
        [-75.60918154164662, 45.4311245816109],
        [-75.61001899053313, 45.43083164961712],
        [-75.6099120266568, 45.430716307227584],
        [-75.60986245803106, 45.430600964601695],
        [-75.6097685385299, 45.43054970113681],
        [-75.60966418352851, 45.43053139274528],
        [-75.60952330427652, 45.43055336281492],
        [-75.60743781858818, 45.432113657348],
        [-75.6074012943376, 45.4322399815874],
        [-75.60845788872716, 45.432690352661496],
        [-75.60828703139796, 45.43287612496704],
        [-75.60801309951884, 45.43306469328121],
        [-75.60751219551192, 45.43327706072577],
        [-75.60629097379467, 45.43226632783052],
        [-75.60592736224072, 45.432028846920815],
        [-75.60390397582697, 45.43025229212128],
        [-75.60161276513955, 45.428209172584985],
        [-75.59988319653277, 45.42662208371351],
        [-75.59947998371993, 45.4262253998414],
        [-75.59902157246503, 45.425476402678385],
        [-75.59717859069946, 45.42213764785325],
        [-75.59601142913975, 45.419993235629136],
        [-75.59589622547931, 45.419588924313246],
        [-75.59589622547931, 45.41942467201375],
        [-75.59596822776726, 45.41931601253813],
        [-75.59610143199968, 45.41919471799241],
        [-75.60197795178351, 45.41676893465049],
        [-75.60243876642656, 45.416731028422674],
        [-75.60264346838534, 45.4168051809402],
        [-75.60295667833824, 45.417002292785924],
        [-75.60332749012137, 45.417078104851015],
        [-75.60373790316277, 45.417073050716226],
        [-75.60412112645446, 45.41696820384155],
        [-75.60443433640674, 45.4168898645535],
        [-75.60492755207947, 45.41692271652647],
        [-75.6094344020051, 45.418024510078226],
        [-75.61102659310326, 45.41840201207722],
        [-75.61254314324667, 45.418456391629746],
        [-75.61356638016804, 45.41863863082901],
        [-75.61448166597974, 45.41897764836082],
        [-75.61560130156734, 45.419531054736524],
        [-75.6165757032408, 45.419813081983335],
        [-75.62341174922692, 45.421701845540554],
        [-75.62361015462534, 45.42133049115114],
        [-75.62356882016726, 45.42120283751561],
        [-75.62268426276383, 45.4195259061419],
        [-75.6227173303306, 45.41938084053376],
        [-75.62346135057633, 45.4191777480562],
        [-75.62419821198753, 45.41886514269683],
        [-75.62430832058116, 45.418759148631324],
        [-75.62432405038025, 45.41866640366038],
        [-75.62301105269803, 45.4162348139273],
        [-75.62286004662653, 45.41608906524627],
        [-75.62268387287624, 45.41601619076505],
        [-75.62235354709529, 45.41595656611912],
        [-75.62179985816735, 45.416042690587204],
        [-75.61675020918321, 45.41742708764349],
        [-75.61452155313572, 45.41341656029388],
        [-75.6142803516497, 45.412886562575636],
        [-75.61406446722714, 45.412538127448045],
        [-75.62214993396482, 45.40925085131704],
        [-75.622957405381, 45.408879931441476],
        [-75.62461222334443, 45.407921127270924],
        [-75.6270977008992, 45.40681433554835],
        [-75.62934798699638, 45.40612367885049],
        [-75.63009564571502, 45.40613067770309],
        [-75.63092305469672, 45.40627065456613],
        [-75.63143535115704, 45.406496993937736],
        [-75.63206628843402, 45.40689615767215],
        [-75.63276151115502, 45.40755488919703],
        [-75.63354235636832, 45.40840006190149],
        [-75.63454920344267, 45.408854967162284],
        [-75.637280649961, 45.40981375548131],
        [-75.63923453141147, 45.41036662602079],
        [-75.63882150981713, 45.411129224807354],
        [-75.63861861070156, 45.411222049605186],
        [-75.63839063416734, 45.41112442352076],
        [-75.63829716378835, 45.41111962223374],
        [-75.63816493739833, 45.41116923551502],
        [-75.63777745151489, 45.41158823341172],
        [-75.6369732392292, 45.41273010458113],
        [-75.63814668224241, 45.41310553941699],
        [-75.6405733791174, 45.414200990326606],
        [-75.64119464508748, 45.414434260200636],
        [-75.64289951449311, 45.41494136529917],
        [-75.64301412178631, 45.41486826938106],
        [-75.64317356940386, 45.41457880182904],
        [-75.64322030405073, 45.41442248873406],
        [-75.64339349715306, 45.41415038712918],
        [-75.64385259632829, 45.41429898178541],
        [-75.64413850240169, 45.41442441852794],
        [-75.64437767382869, 45.41461739758836],
        [-75.6447084939997, 45.41486979661033],
        [-75.64511203502502, 45.415056274492514],
        [-75.64548134400272, 45.4151128264393],
        [-75.64621328473872, 45.41508232994161],
        [-75.65598753851049, 45.41430286992852],
        MIDPOINT,
    ];

    const TO_HURDMAN = [
        [-75.65879160402707, 45.414119121052636],
        [-75.65919752065672, 45.41403390398088],
        [-75.65948962888498, 45.41391406725597],
        [-75.65967930955286, 45.41371700186636],
        [-75.65974694275202, 45.41348155020182],
        [-75.65971200325521, 45.41277095574807],
        [-75.65964751182841, 45.41257122326485],
        [-75.65957163956126, 45.41243007855138],
        [-75.65971959048166, 45.41237681630358],
        [-75.66077800861521, 45.412408773655415],
        [-75.66096010205598, 45.41239013186711],
        [-75.66108149768381, 45.412318227770044],
        [-75.66135704563125, 45.41214004190243],
        [-75.66164915385951, 45.412060148101574],
        [-75.66203610242236, 45.41199623297942],
        [-75.66317512011142, 45.411928324295616],
        [-75.66413921175266, 45.411911369977474],
        [-75.66421887763302, 45.412100452288],
        [-75.66442752636769, 45.412193661644864],
        HURDMAN,
    ];

    const ROUTE_42 = TO_MIDPOINT.concat(TO_HURDMAN);

    const TRANSITWAY = [
        GREENBORO,
        [-75.65887244242377, 45.36072137513034],
        [-75.659022376438, 45.36095305656872],
        [-75.65914192424518, 45.36105854569229],
        [-75.66070738603003, 45.361767429316814],
        [-75.66105859746864, 45.36196381640451],
        [-75.66149763553675, 45.36231288409772],
        [-75.66178708559906, 45.362670106519914],
        [-75.66309137579259, 45.3647503730254],
        [-75.66428909514305, 45.36615223803139],
        [-75.66502383564885, 45.366909135836295],
        [-75.6667254959939, 45.36849931588432],
        [-75.6684799497483, 45.36980300225662],
        [-75.66916713533472, 45.37017928075841],
        [-75.67358131226179, 45.371976880494856],
        [-75.67883619380882, 45.37410501672369],
        [-75.67928547212986, 45.37436743066718],
        [-75.67964547686624, 45.374649588061516],
        [-75.6799079765594, 45.37494746038689],
        [-75.68017033395611, 45.37545760308993],
        [-75.68026968609134, 45.375907351694025],
        [-75.6801737727429, 45.37686560266016],
        [-75.67986966614137, 45.37817675058844],
        [-75.67929789093826, 45.379806456209394],
        [-75.67886430253635, 45.380432962247255],
        [-75.678468989678, 45.380955689831296],
        [-75.67840336475436, 45.3812499832444],
        [-75.67840336475436, 45.381505272675355],
        [-75.67862183422005, 45.382293629497724],
        [-75.67859340374913, 45.38260992819005],
        [-75.67843823033566, 45.382965207696884],
        [-75.67815718349998, 45.38329417170581],
        [-75.67721572140563, 45.38399618652781],
        [-75.67608564561534, 45.38498565145164],
        [-75.67496224010075, 45.38601603464329],
        [-75.67355984685179, 45.38730691073587],
        [-75.6724085348108, 45.38842287315504],
        [-75.67178373978882, 45.38903319647261],
        [-75.67125398927608, 45.38966581863329],
        [-75.67080263730371, 45.39020770670348],
        [-75.66986854182159, 45.3916878166832],
        [-75.66906860257586, 45.39321275500663],
        [-75.66896259308815, 45.39364983039613],
        [-75.66927371113138, 45.39412335019324],
        [-75.6699440769193, 45.394692363044015],
        [-75.67009551904994, 45.395068116046275],
        [-75.66997941341653, 45.39546868017496],
        [-75.66937045783928, 45.39654665758147],
        [-75.66867231453422, 45.397851800149],
        [-75.66797213560706, 45.39878683657719],
        [-75.66773487626897, 45.399279533076395],
        [-75.6673147971634, 45.40017832531299],
        [-75.66671142101156, 45.40107824533135],
        [-75.66593578731661, 45.402284937175295],
        [-75.66489145097586, 45.403931164730324],
        [-75.66472894743848, 45.40427622355594],
        [-75.66448664002912, 45.405367842073076],
        [-75.6641897710596, 45.40789930780264],
        [-75.66411822464288, 45.40959624597696],
        [-75.66414851306966, 45.41199761823242],
        [-75.66428421335874, 45.41214658116559],
        [-75.6644709919866, 45.412206824992666],
        [-75.66468805904042, 45.41220328124007],
    ];

    const WALK = [
        HURDMAN,
        [-75.66382581439463, 45.41231869326435],
        [-75.6635880819415, 45.41216162182704],
        [-75.66312660129735, 45.41217634729273],
        [-75.6627979711418, 45.41200945845537],
        [-75.66158700180199, 45.41215671333856],
        [-75.66117446607471, 45.412313784789575],
        [-75.66088778870531, 45.41244140502204],
        [-75.66047592422365, 45.412431588095586],
        [-75.65965784490116, 45.412416862696006],
        [-75.65942011244805, 45.41244140502596],
        [-75.65881878918454, 45.41237759494595],
        [-75.65778395380097, 45.41222052367243],
        [-75.65756020560994, 45.412284333929875],
        [-75.65599380227836, 45.412024183969976],
        [-75.6557980226114, 45.41215180485682],
        [-75.65579103048069, 45.41241195423251],
        [-75.65614063702904, 45.41424278292817],
        MIDPOINT,
    ];

    const zoomExpr = ["interpolate", ["linear"], ["zoom"], 12.2, 0.2, 15, 0.3];

    map.setCenter([-75.63484366458454, 45.39187863900247]);
    map.setZoom(11.5);

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#6E6E70",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    map.addSource("dottedLineWalking", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineWalkingLayer",
        source: "dottedLineWalking",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#6E6E70",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const [line98, line98L, caseLine98, caseLine98L] = addLine({
        lineName: "98-line",
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
        casing: true,
    });

    const [ghost, ghostL] = addLine({
        lineName: "ghost",
        paintOverrides: { "line-opacity": 0 },
        casing: false,
    });

    const [line42, line42L, caseLine42, caseLine42L] = addLine({
        lineName: "42-line",
        paintOverrides: { "line-color": "#6E6E70" },
        casingPaintOverrides: { "line-color": "#363638" },
        casing: true,
    });

    map.addSource("blinker", newFeature({ type: "Point", coordinates: GREENBORO }));

    const [gb, gbL] = await addImage({
        imgName: "greenboro-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0.2 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [hd, hdL] = await addImage({
        imgName: "hurdman-card-downside",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [bl, blL] = await addImage({
        imgName: "blair-card",
        coords: BLAIR,
        layoutOverrides: { "icon-size": 0 },
    });

    const [term, termL] = await addImage({
        imgName: "terminal-card",
        coords: MIDPOINT,
        layoutOverrides: { "icon-size": 0 },
    });

    const [eta11, eta11L] = await addImage({
        imgName: "eta-11-mins",
        coords: [GREENBORO[0], 45.349092769031046],
        layoutOverrides: { "icon-size": 0.2 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [eta28, eta28L] = await addImage({
        imgName: "eta-535pm",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [the98, the98L] = await addImage({
        imgName: "98-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0.2 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [walkSrc, walkLayer] = await addImage({
        imgName: "walking",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [xe40down, xe40downL] = await addImage({
        imgName: "xe40-card-downside",
        coords: BLAIR,
        layoutOverrides: { "icon-size": 0 },
    });

    const [xe40up, xe40upL] = await addImage({
        imgName: "xe40-card-upside",
        coords: MIDPOINT,
        layoutOverrides: { "icon-size": 0 },
    });

    const hideDuringZoom = [
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.7333,
            seconds: 0.5,
            layerId: the98L,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 4.7333,
            seconds: 0.5,
            layerId: xe40downL,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
    ];

    const putBackAfterZoom = [
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 9,
            seconds: 0,
            layerId: the98L,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 9,
            seconds: 0,
            layerId: xe40downL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
    ];

    return new Set([
        // start: 8:23.02
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 1.15,
            newZoom: 12.2,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 0,
            seconds: 0.5,
            layerId: the98L,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 0,
            seconds: 0.5,
            layerId: gbL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 0,
            seconds: 0.5,
            layerId: eta11L,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        // "battery bus" 8:24.13
        new DottedLineAnimation({
            startAtTimeSec: 1.18333,
            seconds: 1.37,
            sourceId: "dottedLine",
            dotSpacing: 0.003,
            coords: ROUTE_42,
        }),
        new Pop({
            startAtTimeSec: 1.18333,
            layerId: blL,
            seconds: 0.3,
            finalScale: 0.2,
        }),
        new Pop({
            startAtTimeSec: 1.18333,
            layerId: hdL,
            seconds: 0.3,
            finalScale: 0.2,
        }),
        new Script({
            startAtTimeSec: 1.5,
            frames: 1,
            execute: () => map.setLayoutProperty(hdL, "icon-size", zoomExpr),
        }),
        // "42" 8:25.34
        new Pop({
            startAtTimeSec: 2.5333,
            layerId: xe40downL,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        // "and it's scheduled" 8:27.16
        new MapViewAdjustment({
            startAtTimeSec: 4.2333,
            newPanCoords: [-75.66479746456105, 45.41277258163058],
            newZoom: 15,
            seconds: 2.8,
        }),

        // fuck you mapbox
        ...hideDuringZoom,

        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 6.9666,
            seconds: 0.5,
            layerId: "dottedLineLayer",
            paintProperty: "circle-opacity",
            newValue: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 6.9666,
            layerId: eta28L,
            paintProperty: "icon-opacity",
            newValue: 1,
            seconds: 0.5,
        }),
        // "what i could do" 8:32.28

        // fuck you mapbox
        ...putBackAfterZoom,

        new MapViewAdjustment({
            startAtTimeSec: 9.43333,
            newPanCoords: [-75.65873669606253, 45.36107161793478],
            seconds: 2.6,
        }),
        new Script({
            startAtTimeSec: 9.43333,
            frames: 1,
            execute: () => {
                map.setLayoutProperty(gbL, "icon-size", zoomExpr);
                map.setLayoutProperty(the98L, "icon-size", zoomExpr);
            },
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 9.43333,
            seconds: 0.5,
            layerId: eta28L,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        // "get to hurdman" 8:35.35
        new Blink({
            startAtTimeSec: 12.0333,
            rings: 2,
            ringLayerBefore: gbL,
            secondsPerRing: 0.4,
            sourceId: "blinker",
        }),
        new LineAnimation({
            startAtTimeSec: 12.55,
            seconds: 2.7333,
            coords: TRANSITWAY,
            sourceId: caseLine98,
            headPointSourceId: the98,
        }),
        new LineAnimation({
            startAtTimeSec: 12.64,
            seconds: 2.7333,
            coords: TRANSITWAY,
            sourceId: line98,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 12.55,
            newPanCoords: [-75.66642565261304, 45.414735987441134],
            newZoom: 13.83,
            seconds: 2.7333,
        }),
        // "and then" 8:37.12
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.28,
            seconds: 0.5,
            layerId: line98L,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.28,
            seconds: 0.5,
            layerId: caseLine98L,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.28,
            seconds: 0.5,
            layerId: the98L,
            paintProperty: "icon-opacity",
            newValue: 0,
        }),
        new Pop({
            startAtTimeSec: 15.28333,
            seconds: 0.3,
            finalScale: 0.1,
            layerId: walkLayer,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 15.28333,
            seconds: 2.5,
            dotSpacing: 0.0004,
            sourceId: "dottedLineWalking",
            coords: WALK,
        }),
        new LineAnimation({
            startAtTimeSec: 15.28333,
            seconds: 2.5,
            sourceId: ghost,
            coords: WALK,
            headPointSourceId: walkSrc,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 15.28333,
            newZoom: 15.69,
            newPanCoords: [-75.66062472601294, 45.413303016228895],
            seconds: 1,
        }),
        new Script({
            startAtTimeSec: 16,
            frames: 1,
            execute: () => {
                const src = map.getSource("blinker");
                src._data.geometry.coordinates = MIDPOINT;
                src.setData(src._data);
            },
        }),
        // "one stop before hurdman" 8:39.42
        new Pop({
            startAtTimeSec: 16.6666,
            layerId: termL,
            finalScale: 0.3,
            seconds: 0.3,
        }),
        // "get on and" 8:42.03
        new LineAnimation({
            startAtTimeSec: 14.41666,
            seconds: 5,
            sourceId: caseLine42,
            coords: TO_MIDPOINT,
            headPointSourceId: xe40down,
        }),
        new LineAnimation({
            startAtTimeSec: 14.50666,
            seconds: 5,
            sourceId: line42,
            coords: TO_MIDPOINT,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 18.9,
            seconds: 0.4,
            paintProperty: "icon-opacity",
            newValue: 0,
            layerId: walkLayer,
        }),
        new Pop({
            startAtTimeSec: 19,
            seconds: 0.3,
            finalScale: 0,
            layerId: xe40downL,
        }),
        new Pop({
            startAtTimeSec: 19,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: xe40upL,
        }),
        new Blink({
            startAtTimeSec: 19,
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: termL,
            sourceId: "blinker",
        }),
        // "take the battery bus" 8:43.07
        new Script({
            startAtTimeSec: 20,
            frames: 1,
            execute: () => {
                const src = map.getSource("blinker");
                src._data.geometry.coordinates = HURDMAN;
                src.setData(src._data);
            },
        }),
        new LineAnimation({
            startAtTimeSec: 20.08333,
            sourceId: caseLine42,
            seconds: 1.88333,
            coords: [MIDPOINT, ...TO_HURDMAN],
            headPointSourceId: xe40up,
        }),
        new LineAnimation({
            startAtTimeSec: 20.17333,
            sourceId: line42,
            seconds: 1.88333,
            coords: [MIDPOINT, ...TO_HURDMAN],
        }),
        new Blink({
            startAtTimeSec: 21.9666,
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: hdL,
            sourceId: "blinker",
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 21.9666,
            seconds: 0.5,
            layerId: caseLine42L,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 21.9666,
            seconds: 0.5,
            layerId: line42L,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
    ]);
};

exportedAnimation = async function Boarded98() {
    const BLAIR = [-75.6087562950158, 45.43125273888009];
    const GREENBORO = [-75.65852536768337, 45.35983385046205];
    const HURDMAN = [-75.6647196345966, 45.412172356662325];
    const TRANSITWAY = [
        GREENBORO,
        [-75.65887244242377, 45.36072137513034],
        [-75.659022376438, 45.36095305656872],
        [-75.65914192424518, 45.36105854569229],
        [-75.66070738603003, 45.361767429316814],
        [-75.66105859746864, 45.36196381640451],
        [-75.66149763553675, 45.36231288409772],
        [-75.66178708559906, 45.362670106519914],
        [-75.66309137579259, 45.3647503730254],
        [-75.66428909514305, 45.36615223803139],
        [-75.66502383564885, 45.366909135836295],
        [-75.6667254959939, 45.36849931588432],
        [-75.6684799497483, 45.36980300225662],
        [-75.66916713533472, 45.37017928075841],
        [-75.67358131226179, 45.371976880494856],
        [-75.67883619380882, 45.37410501672369],
        [-75.67928547212986, 45.37436743066718],
        [-75.67964547686624, 45.374649588061516],
        [-75.6799079765594, 45.37494746038689],
        [-75.68017033395611, 45.37545760308993],
        [-75.68026968609134, 45.375907351694025],
        [-75.6801737727429, 45.37686560266016],
        [-75.67986966614137, 45.37817675058844],
        [-75.67929789093826, 45.379806456209394],
        [-75.67886430253635, 45.380432962247255],
        [-75.678468989678, 45.380955689831296],
        [-75.67840336475436, 45.3812499832444],
        [-75.67840336475436, 45.381505272675355],
        [-75.67862183422005, 45.382293629497724],
        [-75.67859340374913, 45.38260992819005],
        [-75.67843823033566, 45.382965207696884],
        [-75.67815718349998, 45.38329417170581],
        [-75.67721572140563, 45.38399618652781],
        [-75.67608564561534, 45.38498565145164],
        [-75.67496224010075, 45.38601603464329],
        [-75.67355984685179, 45.38730691073587],
        [-75.6724085348108, 45.38842287315504],
        [-75.67178373978882, 45.38903319647261],
        [-75.67125398927608, 45.38966581863329],
        [-75.67080263730371, 45.39020770670348],
        [-75.66986854182159, 45.3916878166832],
        [-75.66906860257586, 45.39321275500663],
        [-75.66896259308815, 45.39364983039613],
        [-75.66927371113138, 45.39412335019324],
        [-75.6699440769193, 45.394692363044015],
        [-75.67009551904994, 45.395068116046275],
        [-75.66997941341653, 45.39546868017496],
        [-75.66937045783928, 45.39654665758147],
        [-75.66867231453422, 45.397851800149],
        [-75.66797213560706, 45.39878683657719],
        [-75.66773487626897, 45.399279533076395],
        [-75.6673147971634, 45.40017832531299],
        [-75.66671142101156, 45.40107824533135],
        [-75.66593578731661, 45.402284937175295],
        [-75.66489145097586, 45.403931164730324],
        [-75.66472894743848, 45.40427622355594],
        [-75.66448664002912, 45.405367842073076],
        [-75.6641897710596, 45.40789930780264],
        [-75.66411822464288, 45.40959624597696],
        [-75.66414851306966, 45.41199761823242],
        [-75.66428421335874, 45.41214658116559],
        [-75.6644709919866, 45.412206824992666],
        HURDMAN,
    ];

    const ROUTE_42 = [
        BLAIR,
        [-75.60893108964336, 45.4311538747269],
        [-75.60918154164662, 45.4311245816109],
        [-75.61001899053313, 45.43083164961712],
        [-75.6099120266568, 45.430716307227584],
        [-75.60986245803106, 45.430600964601695],
        [-75.6097685385299, 45.43054970113681],
        [-75.60966418352851, 45.43053139274528],
        [-75.60952330427652, 45.43055336281492],
        [-75.60743781858818, 45.432113657348],
        [-75.6074012943376, 45.4322399815874],
        [-75.60845788872716, 45.432690352661496],
        [-75.60828703139796, 45.43287612496704],
        [-75.60801309951884, 45.43306469328121],
        [-75.60751219551192, 45.43327706072577],
        [-75.60629097379467, 45.43226632783052],
        [-75.60592736224072, 45.432028846920815],
        [-75.60390397582697, 45.43025229212128],
        [-75.60161276513955, 45.428209172584985],
        [-75.59988319653277, 45.42662208371351],
        [-75.59947998371993, 45.4262253998414],
        [-75.59902157246503, 45.425476402678385],
        [-75.59717859069946, 45.42213764785325],
        [-75.59601142913975, 45.419993235629136],
        [-75.59589632547931, 45.419588924313246],
        [-75.59589622547931, 45.41942467201375],
        [-75.59596822776726, 45.41931601253813],
        [-75.59610143199968, 45.41919471799241],
        [-75.59798523912113, 45.41832539198967],
        [-75.60197795178351, 45.41676893465049],
        [-75.60243876642656, 45.416731028422674],
        [-75.60264346838534, 45.4168051809402],
        [-75.60295667833824, 45.417002292785924],
        [-75.60332749012137, 45.417078104851015],
        [-75.60373790316277, 45.417073050716226],
        [-75.60412112645446, 45.41696820384155],
        [-75.60443433640674, 45.4168898645535],
        [-75.60492755207947, 45.41692271652647],
        [-75.6094344020051, 45.418024510078226],
        [-75.61102659310326, 45.41840201207722],
        [-75.61254314324667, 45.418456391629746],
        [-75.61356638016804, 45.41863863082901],
        [-75.61448166597974, 45.41897764836082],
        [-75.61560130156734, 45.419531054736524],
        [-75.6165757032408, 45.419813081983335],
        [-75.62341174922692, 45.421701845540554],
        [-75.62361015462534, 45.42133049115114],
        [-75.62356882016726, 45.42120283751561],
        [-75.62268426276383, 45.4195259061419],
        [-75.6227173303306, 45.41938084053376],
        [-75.62346135057633, 45.4191777480562],
        [-75.62419821198753, 45.41886514269683],
        [-75.62430832058116, 45.418759148631324],
        [-75.62432405038025, 45.41866640366038],
        [-75.62301105269803, 45.4162348139273],
        [-75.62286004662653, 45.41608906524627],
        [-75.62268387287624, 45.41601619076505],
        [-75.62235354709529, 45.41595656611912],
        [-75.62179985816735, 45.416042690587204],
        [-75.61675020918321, 45.41742708764349],
        [-75.61452155313572, 45.41341656029388],
        [-75.6142803516497, 45.412886562575636],
        [-75.61406446722714, 45.412538127448045],
        [-75.62214993396482, 45.40925085131704],
        [-75.622957405381, 45.408879931441476],
        [-75.62461222334443, 45.407921127270924],
        [-75.6270977008992, 45.40681433554835],
        [-75.62934798699638, 45.40612367885049],
        [-75.63009564571502, 45.40613067770309],
        [-75.63092305469672, 45.40627065456613],
        [-75.63143535115704, 45.406496993937736],
        [-75.63206628843402, 45.40689615767215],
        [-75.63276151115502, 45.40755488919703],
        [-75.63354235636832, 45.40840006190149],
        [-75.63454920344267, 45.408854967162284],
        [-75.637280649961, 45.40981375548131],
        [-75.63923453141147, 45.41036662602079],
        [-75.63882150981713, 45.411129224807354],
        [-75.63861861070156, 45.411222049605186],
        [-75.63839063416734, 45.41112442352076],
        [-75.63829716378835, 45.41111962223374],
        [-75.63816493739833, 45.41116923551502],
        [-75.63777745151489, 45.41158823341172],
        [-75.6369732392292, 45.41273010458113],
        [-75.63814668224241, 45.41310553941699],
        [-75.6405733791174, 45.414200990326606],
        [-75.64119464508748, 45.414434260200636],
        [-75.64289951449311, 45.41494136529917],
        [-75.64301412178631, 45.41486826938106],
        [-75.64317356940386, 45.41457880182904],
        [-75.64322030405073, 45.41442248873406],
        [-75.64339349715306, 45.41415038712918],
        [-75.64385259632829, 45.41429898178541],
        [-75.64413850240169, 45.41442441852794],
        [-75.64437767382869, 45.41461739758836],
        [-75.6447084939997, 45.41486979661033],
        [-75.64511203502502, 45.415056274492514],
        [-75.64548134400272, 45.4151128264393],
        [-75.64621328473872, 45.41508232994161],
        [-75.65598753851049, 45.41430286992852],
        [-75.65879160402707, 45.414119121052636],
        [-75.65919752065672, 45.41403390398088],
        [-75.65948962888498, 45.41391406725597],
        [-75.65967930955286, 45.41371700186636],
        [-75.65974694275202, 45.41348155020182],
        [-75.65971200325521, 45.41277095574807],
        [-75.65964751182841, 45.41257122326485],
        [-75.65957163956126, 45.41243007855138],
        [-75.65971959048166, 45.41237681630358],
        [-75.66077800861521, 45.412408773655415],
        [-75.66096010205598, 45.41239013186711],
        [-75.66108149768381, 45.412318227770044],
        [-75.66135704563125, 45.41214004190243],
        [-75.66164915385951, 45.412060148101574],
        [-75.66203610242236, 45.41199623297942],
        [-75.66317512011142, 45.411928324295616],
        [-75.66413921175266, 45.411911369977474],
        [-75.66421887763302, 45.412100452288],
        [-75.66442752636769, 45.412193661644864],
        HURDMAN,
    ];

    map.setCenter([-75.66630687283765, 45.385002214757094]);
    map.setZoom(13.51);

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#0056B8",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    map.addSource("dottedLine2", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer2",
        source: "dottedLine2",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#6E6E70",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const zoomExpr = ["interpolate", ["linear"], ["zoom"], 12.5, 0.2, 13.89, 0.3];

    const [line98, line98L, caseLine98, caseLine98L] = addLine({
        lineName: "98-line",
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
        casing: true,
    });

    const [line42, line42L, caseLine42, caseLine42L] = addLine({
        lineName: "42-line",
        paintOverrides: { "line-color": "#6E6E70", "line-opacity": 0 },
        casingPaintOverrides: { "line-color": "#363638", "line-opacity": 0 },
        casing: true,
        coords: ROUTE_42.slice(0, 23),
    });

    const [gb, gbL] = await addImage({
        imgName: "greenboro-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [hd, hdL] = await addImage({
        imgName: "hurdman-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [bl, blL] = await addImage({
        imgName: "blair-card",
        coords: BLAIR,
        layoutOverrides: { "icon-size": zoomExpr },
    });

    const [the98, the98L] = await addImage({
        imgName: "98-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0 },
    });

    const [xe40down, xe40downL] = await addImage({
        imgName: "xe40-card-downside",
        coords: ROUTE_42[22],
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 9:56.33
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 1.15,
            newZoom: 12.5,
        }),
        // "we're taking" 9:57.15
        new Pop({
            startAtTimeSec: 0.7,
            finalScale: 0.2,
            seconds: 0.3,
            layerId: the98L,
        }),
        new Pop({
            startAtTimeSec: 0.7,
            finalScale: 0.2,
            seconds: 0.3,
            layerId: gbL,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0.7,
            sourceId: "dottedLine",
            seconds: 2.3333,
            dotSpacing: 0.0025,
            coords: TRANSITWAY,
        }),
        // "hurdman" 9:58.51
        new Pop({
            startAtTimeSec: 1.85,
            seconds: 0.3,
            finalScale: 0.2,
            layerId: hdL,
        }),
        // "as for the" 9:59.35
        new MapViewAdjustment({
            startAtTimeSec: 3.0333,
            seconds: 3.016,
            newPanCoords: [-75.6059413554616, 45.42436195289787],
            newZoom: 13.89,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 3.0333,
            seconds: 3,
            coords: ROUTE_42,
            dotSpacing: 0.002,
            sourceId: "dottedLine2",
        }),
        // "it just left" 10:02.05
        new Script({
            startAtTimeSec: 5.5,
            frames: 1,
            execute: () => {
                const s1 = map.getSource(line98);
                s1._data.geometry.coordinates = TRANSITWAY.slice(0, 7);
                s1.setData(s1._data);

                const s2 = map.getSource(caseLine98);
                s2._data.geometry.coordinates = TRANSITWAY.slice(0, 7);
                s2.setData(s1._data);
            },
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 5.54,
            seconds: 0.4,
            layerId: line42L,
            paintProperty: "line-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 5.54,
            seconds: 0.4,
            layerId: caseLine42L,
            paintProperty: "line-opacity",
            newValue: 1,
        }),
        new Pop({
            startAtTimeSec: 5.54,
            layerId: xe40downL,
            finalScale: 0.2,
            seconds: 0.3,
        }),
        new LineAnimation({
            startAtTimeSec: 5.04,
            coords: ROUTE_42.slice(22, 27),
            seconds: 10.46,
            easing: false,
            sourceId: caseLine42,
            headPointSourceId: xe40down,
        }),
        new LineAnimation({
            startAtTimeSec: 5.04,
            coords: ROUTE_42.slice(22, 27),
            seconds: 10.46,
            easing: false,
            sourceId: line42,
        }),
        // "given that" 10:05.16
        new MapViewAdjustment({
            startAtTimeSec: 8.71666,
            seconds: 1.15,
            newZoom: 12.45,
            newPanCoords: [-75.6350222747837, 45.39523620082383],
        }),
        new LineAnimation({
            startAtTimeSec: 8.5,
            sourceId: line98,
            coords: TRANSITWAY.slice(7, 9),
            seconds: 7,
            easing: false,
        }),
        new LineAnimation({
            startAtTimeSec: 8.5,
            sourceId: caseLine98,
            coords: TRANSITWAY.slice(7, 9),
            seconds: 7,
            easing: false,
            headPointSourceId: the98,
        }),
    ]);
};

exportedAnimation = async function Transfer() {
    const WALKLEY = [-75.66714591895389, 45.36884539509549];
    const APPROACH_98 = [
        [-75.65910718103483, 45.36104260185141],
        [-75.66032430792013, 45.36159386366435],
        [-75.66113840333648, 45.36202856193569],
        [-75.66158590975198, 45.362406834773225],
        [-75.66206092412004, 45.36316567173671],
        [-75.66288989666799, 45.36448062390119],
        [-75.66351924454358, 45.36530187604288],
        [-75.66466054250516, 45.3665682971793],
        [-75.6659788586112, 45.36783326648697],
        WALKLEY,
    ];
    const APPROACH_44 = [
        [-75.6436064528449, 45.3752159858592],
        [-75.64367595063513, 45.37447302316485],
        [-75.64422224152922, 45.37391047050821],
        [-75.64505993162446, 45.37344393340115],
        [-75.64681303738661, 45.37280618725569],
        [-75.64756274518831, 45.37283345442961],
        [-75.64857963856073, 45.37308529247295],
        [-75.64987425276647, 45.37331875577274],
        [-75.65077072243257, 45.373154628302416],
        [-75.65326919135792, 45.37215310625126],
        [-75.65440108681075, 45.37409080025006],
        [-75.65602000607453, 45.373381255092596],
        [-75.65797999456947, 45.37256637918608],
        [-75.66665650713102, 45.36909734911097],
        [-75.66667321226605, 45.36899737244681],
        [-75.66649452670805, 45.368761277900234],
        [-75.6662354522789, 45.36838732234963],
        [-75.66567174861561, 45.36773742693316],
        [-75.66530133303196, 45.367397027852576],
        [-75.66493375319513, 45.36707617136557],
        [-75.66463591653799, 45.366934870830306],
        [-75.66428980756172, 45.366785475570396],
        [-75.6641852298381, 45.3666538450297],
        [-75.66421193964284, 45.366551551494325],
        [-75.66428428195968, 45.3664931745451],
        [-75.66447083746492, 45.366507091252515],
        [-75.66462037799766, 45.36655399525776],
        [-75.6647400972849, 45.36664339181846],
        [-75.66527118864813, 45.36718172989765],
        [-75.66586138401996, 45.36773681228294],
        WALKLEY,
    ];

    const CONTINUATION = [
        WALKLEY,
        [-75.66856790288196, 45.36986026146727],
        [-75.67886739477035, 45.37411097334993],
    ];

    map.addSource("blinker", newFeature({ type: "Point", coordinates: WALKLEY }));

    //-75.6667685512183, 45.36762116301617
    map.setCenter([-75.66688305018374, 45.36749312158602]);
    map.setZoom(14.7);

    const [line98, line98L, caseLine98, caseLine98L] = addLine({
        lineName: "line-98",
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
    });

    const [line44, line44L, caseLine44, caseLine44L] = addLine({
        lineName: "line-44",
        coords: APPROACH_44.slice(0, 18),
        paintOverrides: { "line-color": "#0056B8", "line-opacity": 0 },
        casingPaintOverrides: { "line-color": "#002249", "line-opacity": 0 },
    });

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 7,
            "circle-color": "#0056B8",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const [walkleyS, walkleyL] = await addImage({
        imgName: "walkley-card",
        coords: WALKLEY,
        layoutOverrides: { "icon-size": 0 },
    });

    const [the98, the98L] = await addImage({
        imgName: "98-card-downside",
        coords: APPROACH_98[0],
        layoutOverrides: { "icon-size": 0 },
    });

    const [the44, the44L] = await addImage({
        imgName: "44-card-downside",
        coords: APPROACH_44[17],
        layoutOverrides: { "icon-size": 0.25 },
        paintOverrides: { "icon-opacity": 0 },
    });

    return new Set([
        // start: 10:40.44
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 1.15,
            newZoom: 15.7,
        }),
        new Rotation({
            startAtTimeSec: 0,
            seconds: 1.15,
            direction: "clockwise",
            type: "mapviewadjustment",
            newBearing: 28,
        }),
        new Pop({
            startAtTimeSec: 1.15,
            finalScale: 0.3,
            seconds: 0.3,
            layerId: walkleyL,
        }),
        new Script({
            startAtTimeSec: 1.15,
            frames: 1,
            execute: () => map.setLayoutProperty(the98L, "icon-size", 0.25),
        }),
        new LineAnimation({
            startAtTimeSec: 1.15,
            seconds: 3,
            sourceId: caseLine98,
            coords: APPROACH_98,
            headPointSourceId: the98,
        }),
        new LineAnimation({
            startAtTimeSec: 1.24,
            seconds: 3,
            sourceId: line98,
            coords: APPROACH_98,
        }),
        new Blink({
            startAtTimeSec: 4.15,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker",
            ringLayerBefore: walkleyL,
        }),
        // *hissing stops 10:43.00
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.15,
            seconds: 0.5,
            layerId: caseLine98L,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.15,
            seconds: 0.5,
            layerId: line98L,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.15,
            seconds: 0.5,
            layerId: caseLine44L,
            paintProperty: "line-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.15,
            seconds: 0.5,
            layerId: line44L,
            paintProperty: "line-opacity",
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 8.15,
            seconds: 0.5,
            layerId: the44L,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new LineAnimation({
            startAtTimeSec: 7.65,
            seconds: 4.15,
            sourceId: caseLine44,
            coords: APPROACH_44.slice(18, APPROACH_44.length - 1).concat([
                [-75.66692761950242, 45.368655415457596],
            ]),
            headPointSourceId: the44,
        }),
        new LineAnimation({
            startAtTimeSec: 7.74,
            seconds: 4.15,
            sourceId: line44,
            coords: APPROACH_44.slice(18, APPROACH_44.length - 1).concat([
                [-75.66692761950242, 45.368655415457596],
            ]),
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.89,
            seconds: 0.5,
            layerId: caseLine44L,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.89,
            seconds: 0.5,
            layerId: line44L,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 11.89,
            seconds: 3,
            sourceId: "dottedLine",
            dotSpacing: 0.0005,
            coords: CONTINUATION,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 11.89,
            newZoom: 15,
            seconds: 1.15,
        }),
    ]);
};

exportedAnimation = async function TerminatesAtBillings() {
    const WALKLEY = [-75.66714591895389, 45.36884539509549];
    const TRUNK = [
        [-75.66766260662496, 45.36926894796116],
        [-75.66835985649172, 45.36971675652035],
        [-75.66978697760823, 45.3704397170909],
        [-75.6785649643529, 45.37399353436396],
        [-75.67924800636891, 45.37435206368028],
        [-75.67985098322166, 45.37488496021993],
        [-75.6801446393468, 45.37541582304678],
        [-75.68026607236425, 45.37594478572703],
        [-75.68014475857657, 45.377018987130896],
        [-75.6797926084878, 45.37835061665311],
        [-75.67933891400685, 45.37970956869998],
        [-75.67854146895002, 45.38083975949752],
        [-75.67838466778636, 45.38119450781738],
        [-75.67841761977373, 45.38161405452769],
        [-75.67862222107628, 45.38236387384791],
        [-75.67859231639237, 45.382676913560374],
    ];

    const BILLINGS = [-75.67676413760523, 45.384784452006926];
    const TO_BILLINGS = TRUNK.concat([
        [-75.67885423492723, 45.38274923123032],
        [-75.67898178030686, 45.38289919028068],
        [-75.67903390646464, 45.38333330508078],
        [-75.6771380592373, 45.38452283884786],
        BILLINGS,
    ]);
    const HURDMAN = [-75.66475118397643, 45.412178604538326];
    const TO_HURDMAN = TRUNK.concat([
        [-75.6783588291228, 45.38309119786604],
        [-75.6771218036832, 45.384069868977775],
        [-75.67548613940473, 45.38550207603393],
        [-75.67340133273554, 45.38744810506864],
        [-75.6720870397443, 45.388722610319576],
        [-75.67104521253682, 45.38988560923818],
        [-75.66987114775743, 45.391643340529725],
        [-75.6689558886897, 45.393557819198634],
        [-75.66931391340995, 45.39419023300235],
        [-75.66990486532109, 45.39468344026017],
        [-75.6700554818741, 45.3949690811869],
        [-75.6700693818155, 45.395295697824594],
        [-75.6695214485105, 45.396215048226736],
        [-75.66884644052067, 45.39759465374641],
        [-75.66822354426522, 45.39836596509062],
        [-75.66777853446929, 45.39919168204676],
        [-75.66730321977185, 45.40019501514567],
        [-75.6649030036743, 45.40391339682708],
        [-75.66459654825427, 45.40472701890161],
        [-75.66447646527318, 45.405497848637026],
        [-75.66419508564599, 45.407930944493586],
        [-75.6641433173345, 45.41030735186291],
        [-75.66416292208865, 45.411962079916776],
        [-75.66435312729193, 45.4121680864485],
        [-75.6645627433958, 45.41220080642637],
        HURDMAN,
    ]);

    map.addSource("blinker", newFeature({ type: "Point", coordinates: BILLINGS }));

    // -75.67386842974491, 45.388616426261535
    map.setCenter([-75.67386842974616, 45.388616426261535]), map.setZoom(12.5);

    map.addSource("dottedLine2", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer2",
        source: "dottedLine2",
        type: "circle",
        paint: {
            "circle-radius": 5,
            "circle-color": "#6E6E70",
            "circle-stroke-width": 0,
            "circle-opacity": 0.4,
        },
    });

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 8,
            "circle-color": "#0056B8",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const [wk, wkL] = await addImage({
        imgName: "walkley-card-downside",
        coords: WALKLEY,
        layoutOverrides: { "icon-size": 0 },
    });

    const [bill, billL] = await addImage({
        imgName: "billings-card",
        coords: BILLINGS,
        layoutOverrides: { "icon-size": 0 },
    });

    const [hurd, hurdL] = await addImage({
        imgName: "hurdman-card",
        coords: TO_HURDMAN[TO_HURDMAN.length - 1],
        layoutOverrides: { "icon-size": 0 },
        paintOverrides: { "icon-opacity": 0.6 },
    });

    const [the44, the44L] = await addImage({
        imgName: "44-card-upside",
        coords: WALKLEY,
        layoutOverrides: { "icon-size": 0 },
    });

    const [arrow, arrowL] = await addImage({
        imgName: "up-arrow",
        coords: [-75.67747331866232, (HURDMAN[1] + BILLINGS[1]) / 2],
        layoutOverrides: { "icon-size": 0.1 },
        paintOverrides: { "icon-opacity": 0 },
    });

    return new Set([
        // start: 11:24.53
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 1.15,
            newZoom: 13,
        }),
        // "we're" 11:25.21
        new Pop({
            startAtTimeSec: 0.4666,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: wkL,
        }),
        new Pop({
            startAtTimeSec: 0.4666,
            seconds: 0.3,
            finalScale: 0.2,
            layerId: the44L,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0.4666,
            seconds: 3.7,
            dotSpacing: 0.0015,
            sourceId: "dottedLine",
            coords: TO_BILLINGS,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0.4666,
            seconds: 3.7,
            dotSpacing: 0.001,
            sourceId: "dottedLine2",
            coords: TO_HURDMAN,
        }),
        // "north" 11:25.42
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 0.81666,
            seconds: 0.5,
            layerId: arrowL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        // line anim ends 11:29.03, blink billings etc
        new Blink({
            startAtTimeSec: 4.1666,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker",
            ringLayerBefore: billL,
        }),
        new Pop({
            startAtTimeSec: 4.1666,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: billL,
        }),
        new Pop({
            startAtTimeSec: 4.1666,
            seconds: 0.3,
            finalScale: 0.15,
            layerId: hurdL,
        }),
    ]);
};

exportedAnimation = async function InveroPlans() {
    const HURDMAN = [-75.66475118397643, 45.412178604538326];

    //-75.66479409933379, 45.41340079997153
    map.setCenter([HURDMAN[0], 45.41340079997153]);
    map.setZoom(13);

    map.addSource("blinker", newFeature({ type: "Point", coordinates: HURDMAN }));

    const [hurd, hurdL] = await addImage({
        imgName: "hurdman-card-downside",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });
    const [invero, inveroL] = await addImage({
        imgName: "d40i-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });
    const [currentTime, currentTimeL] = await addImage({
        imgName: "current-time",
        //-75.66458490542243, 45.42180532633495
        coords: [HURDMAN[0], 45.42180532633495],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    return new Set([
        // start: 12:37.53
        new MapViewAdjustment({
            startAtTimeSec: 0,
            newZoom: 14,
            seconds: 1.15,
        }),
        // "is" 12:39.25
        new Blink({
            startAtTimeSec: 1.5333,
            rings: 2,
            secondsPerRing: 0.4,
            sourceId: "blinker",
            ringLayerBefore: hurdL,
        }),
        new Pop({
            startAtTimeSec: 1.5333,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: hurdL,
        }),
        new Pop({
            startAtTimeSec: 1.5333,
            seconds: 0.3,
            finalScale: 0.25,
            layerId: inveroL,
        }),
        // "five thirty" 12:44.56
        new MapViewAdjustment({
            startAtTimeSec: 7.05,
            newPanCoords: [HURDMAN[0], 45.41514808048967],
            seconds: 1.15,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.05,
            seconds: 0.5,
            layerId: currentTimeL,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
    ]);
};

exportedAnimation = async function MoreInveroPlans() {
    const HURDMAN = [-75.66475118397643, 45.412178604538326];
    const LYCEE_SOUTH = [-75.66438047086106, 45.406520776023115];
    const LYCEE_NORTH = [-75.66435780765813, 45.406518324531845];
    const ROUTE_45 = [
        HURDMAN,
        [-75.66700983528983, 45.4119951513716],
        [-75.6671909341634, 45.411939213206864],
        [-75.6672343978933, 45.41182564161221],
        [-75.66716195834374, 45.4117391914385],
        [-75.6670194938961, 45.41169172854251],
        [-75.66607053579584, 45.411615448803644],
        [-75.66576146038406, 45.4118086906083],
        [-75.66439476754807, 45.41190192106663],
        [-75.664186369145, 45.41189105936786],
        [-75.6641525640222, 45.41183681620035],
        [-75.66413903916727, 45.408955781046956],
        [-75.66417722908753, 45.408181869061906],
        LYCEE_SOUTH,
        [-75.66453591792394, 45.40517896377136],
        [-75.66471396745818, 45.40436435283516],
        [-75.66502106580286, 45.403696478156746],
        [-75.66497968270039, 45.40363191062977],
        [-75.66432690004247, 45.40360217180083],
        [-75.66354521922067, 45.403708708236564], //19, 64
        [-75.6616214688157, 45.403748635884966],
        [-75.65888082507794, 45.40363327909856],
        [-75.65408521109568, 45.403967199572435],
        [-75.65357022137783, 45.403967199572435],
        [-75.6530571624631, 45.4039575883628],
        [-75.65201742992039, 45.40379294178692],
        [-75.6511851697523, 45.40377034319971],
        [-75.65061040445346, 45.403821997102085],
        [-75.65055062886174, 45.403670263633416],
        [-75.65039889081972, 45.40316017792193],
        [-75.64999885416375, 45.40281150908939],
        [-75.64980113489774, 45.40280182381366],
        [-75.64947926632358, 45.40301812791654],
        [-75.64899186534122, 45.40332805474077],
        [-75.6489826690966, 45.40352821491058],
        [-75.64906543530068, 45.403944674927175],
        [-75.64822397889789, 45.403967159094975],
        [-75.64720261955911, 45.40380683115461],
        [-75.64639418918723, 45.4034869993655],
        [-75.64578193177474, 45.403090222601264],
        [-75.64531095909827, 45.402584290034184],
        [-75.644990271994, 45.4019840271672],
        [-75.64483380564236, 45.40067509680114],
        [-75.64495083018976, 45.400384174535844],
        [-75.64512096072188, 45.4001969175265],
        [-75.64540604431511, 45.400071002981235],
        [-75.64583325658445, 45.39997774665542],
        [-75.64787331876543, 45.39989616295537],
        [-75.64852434766051, 45.399826358672755],
        [-75.64977048098986, 45.39969075749221],
        [-75.65281546565234, 45.39947527634868],
        [-75.65290282997954, 45.39981750857885],
        [-75.65315572671578, 45.400227538804074],
        [-75.65333505349253, 45.40066339444189],
        [-75.65367356337515, 45.40296453986571],
        [-75.65355861031152, 45.40359430452182],
        [-75.65354481594377, 45.40394296852324],
        [-75.65372667463922, 45.40399212385296],
        [-75.65883965068855, 45.40364668852874],
        [-75.66167209414192, 45.40379842205459],
        [-75.6644030149443, 45.4039468953269],
        [-75.66484236910274, 45.4040303185956],
        [-75.66468762801779, 45.40438314484223],
        LYCEE_NORTH,
        [-75.66431344384479, 45.40680951913885],
        [-75.66413016648956, 45.40876645177346],
        [-75.66413569296675, 45.41144666470856],
        [-75.6641605071708, 45.412012947734354],
        [-75.66428161970222, 45.41213619766765],
        [-75.6644983675379, 45.41218542273856],
        HURDMAN,
    ];

    const TO_LYCEE = [
        BILLINGS,
        [-75.67548613940473, 45.38550207603393],
        [-75.67340133273554, 45.38744810506864],
        [-75.6720870397443, 45.388722610319576],
        [-75.67104521253682, 45.38988560923818],
        [-75.66987114775743, 45.391643340529725],
        [-75.6689558886897, 45.393557819198634],
        [-75.66931391340995, 45.39419023300235],
        [-75.66990486532109, 45.39468344026017],
        [-75.6700554818741, 45.3949690811869],
        [-75.6700693818155, 45.395295697824594],
        [-75.6695214485105, 45.396215048226736],
        [-75.66884644052067, 45.39759465374641],
        [-75.66822354426522, 45.39836596509062],
        [-75.66777853446929, 45.39919168204676],
        [-75.66730321977185, 45.40019501514567],
        [-75.6649030036743, 45.40391339682708],
        [-75.66459654825427, 45.40472701890161],
        [-75.66447646527318, 45.405497848637026],
        LYCEE_NORTH,
    ];

    const HOSPITAL_LOOP = ROUTE_45.slice(23, 64);

    //-75.66479409933379, 45.41340079997153
    map.setCenter([HURDMAN[0], 45.41340079997153]);
    map.setZoom(14);

    map.addSource("blinker", newFeature({ type: "Point", coordinates: BILLINGS }));
    map.addSource("blinker2", newFeature({ type: "Point", coordinates: HURDMAN }));
    map.addSource("blinker3", newFeature({ type: "Point", coordinates: LYCEE_NORTH }));

    const [xtraLine2, xtraLine2L] = addLine({
        lineName: "extra2",
        paintOverrides: { "line-color": "#002249", "line-width": 10 },
        casing: false,
    });

    const [line45, line45L, caseLine45, caseLine45L] = addLine({
        lineName: "45-line",
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
    });

    const [also45, also45L] = addLine({
        lineName: "also45",
        paintOverrides: { "line-opacity": 0 },
        casing: false,
    });

    const [lineFreq, lineFreqL, caseLineFreq, caseLineFreqL] = addLine({
        lineName: "frequent-line",
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
    });

    const [bill, billL] = await addImage({
        imgName: "billings-card-downside",
        coords: BILLINGS,
        layoutOverrides: { "icon-size": 0 },
    });

    const [lyc, lycL] = await addImage({
        imgName: "lycee-card-downside",
        coords: LYCEE_NORTH,
        layoutOverrides: { "icon-size": 0 },
    });

    const [hurdDown, hurdDownL] = await addImage({
        imgName: "hurdman-card-downside",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0.3 },
    });
    const [invero, inveroL] = await addImage({
        imgName: "d40i-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0.25 },
    });

    const [hurdUp, hurdUpL] = await addImage({
        imgName: "hurdman-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [theFreq, theFreqL] = await addImage({
        imgName: "frequent-card",
        coords: BILLINGS,
        layoutOverrides: { "icon-size": 0 },
    });

    const [walkSrc, walkLayer] = await addImage({
        imgName: "walking",
        coords: LYCEE_NORTH,
        layoutOverrides: { "icon-size": 0.1 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [the45, the45L] = await addImage({
        imgName: "45-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });
    const [the45Up, the45UpL] = await addImage({
        imgName: "45-card-upside",
        coords: LYCEE_NORTH,
        layoutOverrides: { "icon-size": 0 },
    });

    const [toh, tohL] = await addImage({
        imgName: "toh",
        coords: [-75.64934903241132, 45.40550180760047],
        layoutOverrides: { "icon-size": 0.3 },
        paintOverrides: { "icon-opacity": 0 },
    });

    return new Set([
        // start: 12:57.07
        // "45" 12:59.26
        new Pop({
            startAtTimeSec: 2.31666,
            seconds: 0.3,
            layerId: the45L,
            finalScale: 0.2,
        }),
        new Pop({
            startAtTimeSec: 2.31666,
            seconds: 0.3,
            layerId: hurdUpL,
            finalScale: 0.25,
        }),
        new Pop({
            startAtTimeSec: 2.31666,
            seconds: 0.3,
            layerId: hurdDownL,
            finalScale: 0,
        }),
        new Pop({
            startAtTimeSec: 2.31666,
            seconds: 0.3,
            layerId: inveroL,
            finalScale: 0,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 2.31666,
            newPanCoords: [HURDMAN[0], 45.40945415712841],
            newZoom: 13.7,
            seconds: 1.15,
        }),
        // "so" 13:01.23
        new LineAnimation({
            startAtTimeSec: 4.2666,
            seconds: 3.716,
            sourceId: caseLine45,
            coords: ROUTE_45,
            headPointSourceId: the45,
        }),
        new LineAnimation({
            startAtTimeSec: 4.3566,
            seconds: 3.716,
            sourceId: line45,
            coords: ROUTE_45,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 4.2666,
            seconds: 1.15,
            newPanCoords: [-75.65788360733114, 45.40611292667441],
        }),
        // "back to hurdman" 13:04.21
        new Script({
            startAtTimeSec: 6.7,
            frames: 1,
            execute: () => map.setLayoutProperty(hurdUpL, "icon-size", 0),
        }),
        new Pop({
            startAtTimeSec: 6.7333,
            seconds: 0.3,
            finalScale: 0.2,
            layerId: hurdUpL,
        }),
        new Blink({
            startAtTimeSec: 6.7333,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker2",
            ringLayerBefore: hurdUpL,
        }),
        // *clip end 13:05.06
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.983,
            layerId: line45L,
            paintProperty: "line-opacity",
            newValue: 0.5,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.983,
            layerId: caseLine45L,
            paintProperty: "line-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.983,
            layerId: the45L,
            paintProperty: "icon-opacity",
            newValue: 0,
            seconds: 0.4,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 7.983,
            layerId: hurdUpL,
            paintProperty: "icon-opacity",
            newValue: 0.5,
            seconds: 0.4,
        }),
        // *another clip end 13:06.11
        new LineAnimation({
            startAtTimeSec: 7.98333,
            seconds: 1.05,
            sourceId: xtraLine2,
            coords: ROUTE_45,
            maxTrailingPoints: 10,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 9.0666,
            seconds: 1.15,
            newPanCoords: [-75.6666442644322, 45.39828191465614],
        }),
        // "could" 13:07.02
        new Pop({
            startAtTimeSec: 9.91666,
            seconds: 0.3,
            finalScale: 0.25,
            layerId: billL,
        }),
        new Blink({
            startAtTimeSec: 9.91666,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker",
            ringLayerBefore: billL,
        }),
        // "take" 13:09.27
        new Blink({
            startAtTimeSec: 12.333,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker",
            ringLayerBefore: billL,
        }),
        new Pop({
            startAtTimeSec: 12.333,
            seconds: 0.3,
            finalScale: 0.25,
            layerId: theFreqL,
        }),
        new LineAnimation({
            startAtTimeSec: 12.333,
            seconds: 2.75,
            sourceId: caseLineFreq,
            coords: TO_LYCEE,
            headPointSourceId: theFreq,
        }),
        new LineAnimation({
            startAtTimeSec: 12.433,
            seconds: 2.75,
            sourceId: lineFreq,
            coords: TO_LYCEE,
        }),
        // "north" 13:11.35
        new MapViewAdjustment({
            startAtTimeSec: 14.4666,
            seconds: 2,
            newPanCoords: [-75.6581281936734, 45.40222730327238],
            newZoom: 14.63,
        }),
        // "lycee claudel" 13:12.27
        new Pop({
            startAtTimeSec: 15.083,
            seconds: 0.3,
            finalScale: 0.25,
            layerId: lycL,
        }),
        new Blink({
            startAtTimeSec: 15.083,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker3",
            ringLayerBefore: lycL,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.083,
            seconds: 0.5,
            paintProperty: "line-opacity",
            layerId: lineFreqL,
            newValue: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 15.083,
            seconds: 0.5,
            paintProperty: "line-opacity",
            layerId: caseLineFreqL,
            newValue: 0,
        }),
        // "and just wait" 13:14.27
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 17.333,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            layerId: theFreqL,
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 17.333,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            layerId: walkLayer,
            newValue: 1,
        }),
        // "loop..." 13.17.48
        new Script({
            startAtTimeSec: 20,
            execute: () => {
                const src = map.getSource(the45);
                src._data.geometry.coordinates = HOSPITAL_LOOP[0];
                src.setData(src._data);
                map.setLayoutProperty(the45L, "icon-size", 0.25);
            },
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 20.68333,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            layerId: tohL,
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 20.68333,
            seconds: 0.5,
            paintProperty: "line-opacity",
            layerId: caseLine45L,
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 20.68333,
            seconds: 0.5,
            paintProperty: "line-opacity",
            layerId: line45L,
            newValue: 1,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 20.68333,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            layerId: the45L,
            newValue: 1,
        }),
        new LineAnimation({
            startAtTimeSec: 20.68333,
            sourceId: also45,
            seconds: 4.2,
            coords: HOSPITAL_LOOP,
            headPointSourceId: the45,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 22.58333,
            newPanCoords: [HURDMAN[0], 45.40830533569988],
            seconds: 2,
        }),
        // *end of dialogue 13:22.00
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 24.38333,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            layerId: walkLayer,
            newValue: 0,
        }),
        new Pop({
            startAtTimeSec: 24.58333,
            seconds: 0.3,
            finalScale: 0.3,
            layerId: the45UpL,
        }),
        new Pop({
            startAtTimeSec: 24.58333,
            seconds: 0.3,
            finalScale: 0,
            layerId: the45L,
        }),
        new Blink({
            startAtTimeSec: 24.58333,
            secondsPerRing: 0.4,
            rings: 2,
            ringLayerBefore: lycL,
            sourceId: "blinker3",
        }),
    ]);
};

exportedAnimation = async function PassedThe45() {
    const LYCEE_NORTH = [-75.66435780765813, 45.406518324531845];

    const THE_88 = [
        [-75.66730875691138, 45.400195383008565],
        [-75.66587840238648, 45.40235894823968],
        [-75.66532036217583, 45.40321016518121],
        [-75.66527894747296, 45.40326220493773],
        [-75.66501339220781, 45.403683826488475],
        [-75.66492440322237, 45.40386864304176],
        [-75.66481878149102, 45.40409255687325],
    ];

    const THE_88_2 = [
        [-75.66481878149102, 45.40409255687325],
        [-75.66475682393958, 45.40422767392525],
        [-75.66464934503215, 45.40457123699747],
        [-75.66452799279823, 45.40516548262988],
    ];

    const FROM_HURDMAN = [
        [-75.66467966048467, 45.41218344206544],
        [-75.66700627486425, 45.412003873888125],
        [-75.66718199430593, 45.41193673085729],
        [-75.66722870453715, 45.411857095996794],
        [-75.66719978867992, 45.41177433808173],
        [-75.66706633087618, 45.41170094888551],
        [-75.66609876179868, 45.41160882188731],
        [-75.66594750962096, 45.411665034989],
        [-75.66578291166331, 45.41179619867469],
        [-75.66568726690345, 45.41183211248833],
        [-75.66437938042664, 45.41190237857839],
        [-75.66417029653365, 45.41188051802655],
        [-75.66414540469081, 45.40927720141789],
        [-75.66415467648218, 45.408703009039044],
        [-75.66424711823454, 45.40738652815301],
        [-75.66445959544113, 45.40564843616215],
        [-75.66470102726629, 45.404475106656406],
    ];
    const ROUTE_45 = [
        FROM_HURDMAN[FROM_HURDMAN.length - 1],
        [-75.66477009412591, 45.40422856802667],
        [-75.66503948077876, 45.40366455079044],
    ];

    const ROUTE_45_2 = [
        ROUTE_45[ROUTE_45.length - 1],
        [-75.66492124880241, 45.40363405260101],
        [-75.66454745228545, 45.403611468267],
        [-75.66416068107164, 45.40362578623086],
        [-75.66382903371684, 45.403663167182856],
    ];

    map.setCenter([-75.66525285869585, 45.403401108787875]);
    map.setZoom(18);

    const [line45, line45L, caseLine45, caseLine45L] = addLine({
        lineName: "45-line",
        coords: FROM_HURDMAN,
        paintOverrides: { "line-color": "#002249", "line-width": 17 },
        casing: false,
    });

    const [line88, line88L, caseLine88, caseLine88L] = addLine({
        lineName: "88-line",
        coords: THE_88.slice(0, 3),
        paintOverrides: { "line-color": "#0056B8" },
        casingPaintOverrides: { "line-color": "#002249" },
    });

    // return new Set([]);
    const [lyc, lycL] = await addImage({
        imgName: "lycee-card-upside",
        coords: LYCEE_NORTH,
        layoutOverrides: { "icon-size": 0.3 },
    });

    const [the45, the45L] = await addImage({
        imgName: "45-card",
        coords: ROUTE_45[0],
        layoutOverrides: { "icon-size": 0.25 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [the88, the88L] = await addImage({
        imgName: "frequent-card",
        coords: THE_88[2],
        layoutOverrides: { "icon-size": 0.25 },
    });

    return new Set([
        // start: 13:57.00
        new LineAnimation({
            startAtTimeSec: 0,
            seconds: 13,
            sourceId: line88,
            easing: false,
            coords: THE_88.slice(2),
        }),
        new LineAnimation({
            startAtTimeSec: 0,
            seconds: 13,
            sourceId: caseLine88,
            easing: false,
            coords: THE_88.slice(2),
            headPointSourceId: the88,
        }),
        new LineAnimation({
            startAtTimeSec: 0,
            seconds: 13,
            sourceId: line45,
            easing: false,
            coords: ROUTE_45,
            headPointSourceId: the45,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 0,
            seconds: 6,
            layerId: the45L,
            paintProperty: "icon-opacity",
            newValue: 1,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 13,
            newZoom: 19,
            newPanCoords: THE_88[THE_88.length - 1],
            easing: false,
        }),
        // *passes by 14:07.57
        // zoom out at 14:12.23
        new MapViewAdjustment({
            startAtTimeSec: 13,
            seconds: 1.15,
            newPanCoords: [-75.66465452378316, 45.40386994305726],
            newZoom: 17.61,
        }),
        new LineAnimation({
            startAtTimeSec: 13,
            seconds: 20,
            sourceId: caseLine88,
            easing: false,
            coords: THE_88_2,
            headPointSourceId: the88,
        }),
        new LineAnimation({
            startAtTimeSec: 13,
            seconds: 20,
            sourceId: line88,
            easing: false,
            coords: THE_88_2,
        }),
        new LineAnimation({
            startAtTimeSec: 13,
            seconds: 20,
            sourceId: line45,
            coords: ROUTE_45_2,
            headPointSourceId: the45,
        }),
    ]);
};

exportedAnimation = async function PotentialNewPlan() {
    const HURDMAN = [-75.66475118397643, 45.412178604538326];
    const LYCEE_NORTH = [-75.66435780765813, 45.406518324531845];

    const APPROACH = [
        [-75.66989570187103, 45.39173072871415],
        [-75.6690118149853, 45.39332648578679],
        [-75.66897327190944, 45.39358168208295],
        [-75.66904209883128, 45.393788544901895],
        [-75.66927303018055, 45.39411127002842],
        [-75.66999181719173, 45.3947840186444],
        [-75.67005238488278, 45.394981210797624],
        [-75.67006870620385, 45.39526011403032],
        [-75.66986047637238, 45.39568492472162],
        [-75.66923952662047, 45.39673854699191],
        [-75.66886344567912, 45.39753015711983],
        [-75.66834017125612, 45.3982516462448],
        [-75.66796575280142, 45.39877359194392],
        [-75.6675648521571, 45.3996725708291],
        [-75.66719317247315, 45.400391403701974],
        [-75.66652565710625, 45.40137301500269],
        [-75.66566499768497, 45.40265846823266],
        [-75.66501802462204, 45.40366941315628],
        [-75.66477529991886, 45.404172043486824],
        [-75.66460480926968, 45.40471270170224],
        [-75.66444771951, 45.4056695756731],
        LYCEE_NORTH,
        [-75.66429905336484, 45.40698069534278],
        [-75.6641660710888, 45.40818697706109],
        [-75.66412477493726, 45.40937141615595],
        [-75.66412752801705, 45.41075577206985],
        [-75.66415574585244, 45.41198116651145],
        [-75.66421548162643, 45.412091115077885],
        [-75.66433896202841, 45.41216335135263],
        [-75.66451046258693, 45.41218743009054],
        HURDMAN,
    ];

    const THE_RUN = [
        HURDMAN,
        [-75.66463836216695, 45.41229345035538],
        [-75.66431309546473, 45.41232239451418],
        [-75.66375876770589, 45.41215837741842],
        [-75.66362591229242, 45.41197506363085],
        [-75.66309449063851, 45.41197506363085],
        [-75.66177884776702, 45.41206542314805],
        [-75.66119245145967, 45.41218120016106],
        [-75.66066144871373, 45.41237401428495],
        [-75.65981850402217, 45.412412606438494],
        [-75.65907512793899, 45.41234408080845],
    ];

    const ROUTE_9_1 = [
        [-75.65755021391789, 45.42058239863809],
        [-75.65713588532779, 45.4199783927626],
        [-75.65686704075839, 45.419511501459255],
        [-75.6567662634726, 45.41862702034655],
        [-75.6566329647535, 45.41726432798103],
        [-75.65664890046864, 45.41626318181977],
        [-75.65714515695116, 45.4150304638394],
        [-75.65847164409534, 45.41225912809739],
        [-75.65879965906038, 45.412303840066414],
        THE_RUN[THE_RUN.length - 1],
    ];
    const ROUTE_9_2 = [
        THE_RUN[THE_RUN.length - 1],
        [-75.65933785837224, 45.412430151188005],
        [-75.65945728129603, 45.412500572309824],
        [-75.65964676566895, 45.41237202575104],
        [-75.65991117958012, 45.41236221361308],
        [-75.66054378281392, 45.4123935119386],
        [-75.66088362204583, 45.41239787018981],
        [-75.66102533724913, 45.41234645150783],
        [-75.66307456871338, 45.411915433028526],
        [-75.6641488104075, 45.41190278534185],
        [-75.6641774719094, 45.412016801512266],
        [-75.66428893330522, 45.41212969965031],
        [-75.66450230226323, 45.41218223633078],
        [-75.66464879438331, 45.412181118529645],
        HURDMAN,
    ];

    const TO_HURDMAN = APPROACH.slice(APPROACH.length - 10);

    map.setCenter([-75.6645380454554, 45.408026488253824]);
    map.setZoom(13.44);

    map.addSource(
        "blinker",
        newFeature({ type: "Point", coordinates: THE_RUN[THE_RUN.length - 1] })
    );
    map.addSource("blinker2", newFeature({ type: "Point", coordinates: HURDMAN }));

    const [ghost, ghostL] = addLine({
        lineName: "ghost",
        paintOverrides: { "line-opacity": 0 },
        casing: false,
    });

    const [line9, line9L, caseLine9, caseLine9L] = addLine({
        lineName: "9-line",
        paintOverrides: { "line-color": "#6E6E70" },
        casingPaintOverrides: { "line-color": "#363638" },
    });

    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLineLayer",
        source: "dottedLine",
        type: "circle",
        paint: {
            "circle-radius": 8,
            "circle-color": "#0056B8",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    map.addSource("dottedLine2", newFeatureCollection([]));
    map.addLayer({
        id: "dottedLine2Layer",
        source: "dottedLine2",
        type: "circle",
        paint: {
            "circle-radius": 6,
            "circle-color": "#6E6E70",
            "circle-stroke-width": 0,
            "circle-opacity": 1,
        },
    });

    const [hurdDown, hurdDownL] = await addImage({
        imgName: "hurdman-card-downside",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [hurdUp, hurdUpL] = await addImage({
        imgName: "hurdman-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [lyc, lycL] = await addImage({
        imgName: "lycee-card-downside",
        coords: LYCEE_NORTH,
        layoutOverrides: { "icon-size": 0 },
    });

    const [indy, indyL] = await addImage({
        imgName: "indy-card",
        coords: THE_RUN[THE_RUN.length - 1],
        layoutOverrides: { "icon-size": 0 },
    });

    const [nova, novaL] = await addImage({
        imgName: "nova-card",
        coords: LYCEE_NORTH,
        layoutOverrides: { "icon-size": 0 },
    });

    const [the9, the9L] = await addImage({
        imgName: "9-card",
        coords: ROUTE_9_1[0],
        layoutOverrides: { "icon-size": 0.25 },
        paintOverrides: { "icon-opacity": 0 },
    });

    const [walkSrc, walkLayer] = await addImage({
        imgName: "walking",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0 },
    });

    const [the9Up, the9UpL] = await addImage({
        imgName: "9-card-upside",
        coords: THE_RUN[THE_RUN.length - 1],
        layoutOverrides: { "icon-size": 0 },
    });

    return new Set([
        // start: 14:46.1
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 1.15,
            newPanCoords: [LYCEE_NORTH[0], 45.408026488253824],
            newZoom: 14.44,
        }),
        // "10 hurdman" 14:46.58
        new DottedLineAnimation({
            startAtTimeSec: 0.95,
            seconds: 2.68333,
            sourceId: "dottedLine",
            dotSpacing: 0.001,
            coords: APPROACH,
        }),
        // "nova bus" 14:50.0
        new Pop({
            startAtTimeSec: 3.0333,
            finalScale: 0.3,
            seconds: 0.3,
            layerId: lycL,
        }),
        new Pop({
            startAtTimeSec: 3.0333,
            finalScale: 0.25,
            seconds: 0.3,
            layerId: novaL,
        }),
        // "get" 14:56.57
        new LineAnimation({
            startAtTimeSec: 9.98333,
            seconds: 1,
            coords: TO_HURDMAN,
            sourceId: ghost,
            headPointSourceId: nova,
        }),
        // "hurdman" 14:57.19
        new Pop({
            startAtTimeSec: 10.35,
            seconds: 0.3,
            finalScale: 0.25,
            layerId: hurdDownL,
        }),
        // "i can" 14:58.09
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11,
            seconds: 0.5,
            layerId: "dottedLineLayer",
            paintProperty: "circle-opacity",
            newValue: 0.5,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11,
            seconds: 0.5,
            layerId: lycL,
            paintProperty: "icon-opacity",
            newValue: 0.5,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 11.18333,
            seconds: 2,
            newPanCoords: [-75.6624192279869, 45.41178364714855],
            newZoom: 15.5,
        }),
        // "run out" 14:58.28
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 11.5,
            seconds: 0.4,
            paintProperty: "icon-opacity",
            newValue: 0,
            layerId: novaL,
        }),
        new Pop({
            startAtTimeSec: 11.5,
            seconds: 0.3,
            finalScale: 0.1,
            layerId: walkLayer,
        }),
        new Blink({
            startAtTimeSec: 11.5,
            ringLayerBefore: hurdUpL,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker2",
        }),
        new DottedLineAnimation({
            startAtTimeSec: 11.5,
            seconds: 2.88333,
            dotSpacing: 0.0003,
            sourceId: "dottedLine2",
            coords: THE_RUN,
        }),
        new LineAnimation({
            startAtTimeSec: 11.5,
            seconds: 2.88333,
            sourceId: ghost,
            coords: THE_RUN,
            headPointSourceId: walkSrc,
        }),
        // "industrial and riverside" 15:01.21
        new Pop({
            startAtTimeSec: 14.38333,
            seconds: 0.3,
            finalScale: 0.25,
            layerId: indyL,
        }),
        new Blink({
            startAtTimeSec: 14.38333,
            sourceId: "blinker",
            secondsPerRing: 0.4,
            rings: 2,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 14.38333,
            seconds: 0.5,
            layerId: "dottedLine2Layer",
            paintProperty: "circle-opacity",
            newValue: 0.5,
        }),
        // "catch" 15:04.05
        new Script({
            startAtTimeSec: 15,
            frames: 1,
            execute: () => map.setPaintProperty(the9L, "icon-opacity", 1),
        }),
        new LineAnimation({
            startAtTimeSec: 14.11666,
            seconds: 3,
            coords: ROUTE_9_1,
            sourceId: caseLine9,
            headPointSourceId: the9,
        }),
        new LineAnimation({
            startAtTimeSec: 14.20666,
            seconds: 3,
            coords: ROUTE_9_1,
            sourceId: line9,
        }),
        new Blink({
            startAtTimeSec: 17.11666,
            ringLayerBefore: walkLayer,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker",
        }),
        new Pop({
            startAtTimeSec: 17.11666,
            layerId: the9L,
            finalScale: 0,
            seconds: 0.3,
        }),
        new Pop({
            startAtTimeSec: 17.11666,
            layerId: the9UpL,
            finalScale: 0.3,
            seconds: 0.3,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 16.91666,
            seconds: 0.5,
            paintProperty: "icon-opacity",
            newValue: 0,
            layerId: walkLayer,
        }),
        new LineAnimation({
            startAtTimeSec: 17.11666,
            seconds: 2.1333,
            sourceId: caseLine9,
            coords: ROUTE_9_2,
            headPointSourceId: the9Up,
        }),
        new LineAnimation({
            startAtTimeSec: 17.20666,
            seconds: 2.1333,
            sourceId: line9,
            coords: ROUTE_9_2,
        }),
        new MapViewAdjustment({
            startAtTimeSec: 17.11666,
            seconds: 2.1333,
            newPanCoords: [HURDMAN[0], 45.41292334095098],
        }),
        new Blink({
            startAtTimeSec: 19.25,
            ringLayerBefore: hurdDownL,
            secondsPerRing: 0.4,
            rings: 2,
            sourceId: "blinker2",
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 19.25,
            seconds: 0.5,
            layerId: caseLine9L,
            paintProperty: "line-opacity",
            newValue: 0,
        }),
        new LinearAdjustNumericPaintProp({
            startAtTimeSec: 19.25,
            seconds: 0.5,
            layerId: line9L,
            paintProperty: "line-opacity",
            newValue: 0.5,
        }),
    ]);
};

exportedAnimation = async function CompleteRoute() {
    const WESTBORO = [-75.75195551876531, 45.396297965988964];
    const [_, wbL] = await addImage({
        imgName: "westboro-card",
        coords: WESTBORO,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const TUNNEYS_C = [-75.73555341026608, 45.403862161749544];
    const TUNNEYS = [-75.73516654954759, 45.40375459061113];
    await addImage({
        imgName: "tp-card-upside",
        coords: [-75.73539636779655, 45.403757279892005],
        layoutOverrides: { "icon-size": 0.1 },
    });

    const BAYVIEW = [-75.72210385090816, 45.40937730348287];
    await addImage({
        imgName: "bayview-card-upside",
        coords: BAYVIEW,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const CORSO = [-75.71406140881855, 45.403923839853775];
    await addImage({
        imgName: "corso-card",
        coords: CORSO,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const BRONSON = [-75.7034016163112, 45.40742377622189];
    await addImage({
        imgName: "bronson-card-upside",
        coords: BRONSON,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const CARLETON = [-75.69624007743339, 45.38571310420076];
    await addImage({
        imgName: "carleton-card",
        coords: CARLETON,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const GREENBORO = [-75.65874288957103, 45.359885398144286];
    await addImage({
        imgName: "greenboro-card",
        coords: GREENBORO,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const WALKLEY = [-75.66714371380976, 45.36884515895386];
    await addImage({
        imgName: "walkley-card-up",
        coords: WALKLEY,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const BILLINGS = [-75.67673571960817, 45.384660117117306];
    await addImage({
        imgName: "billings-card",
        coords: BILLINGS,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const LYCEE = [-75.66435460757678, 45.40651827219628];
    await addImage({
        imgName: "lycee-card-upside",
        coords: LYCEE,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const HURDMAN = [-75.66466221564603, 45.41216533699378];
    await addImage({
        imgName: "hurdman-card",
        coords: HURDMAN,
        layoutOverrides: { "icon-size": 0.1 },
    });
    const INDY = [-75.65871317847524, 45.412291960914445];
    await addImage({
        imgName: "indy-card",
        coords: INDY,
        layoutOverrides: { "icon-size": 0.1 },
    });

    const WB2TP = [
        WESTBORO,
        [-75.75178220320154, 45.39637766322491],
        [-75.7508784512641, 45.39675263816909],
        [-75.73761009760356, 45.40235530741296],
        [-75.73737126992667, 45.40247355432879],
        [-75.7373953510738, 45.40254456750972],
        [-75.73760726516883, 45.40290132285125],
        [-75.73751575681037, 45.403036584951025],
        [-75.73549627849057, 45.4038879041355],
        TUNNEYS_C,
    ];
    addLine({
        lineName: "WB2TP",
        coords: WB2TP,
        paintOverrides: { "line-color": "#6e6e70", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const TP2BY = [
        TUNNEYS,
        [-75.73410073902191, 45.40420539139913],
        [-75.73238296731847, 45.40492492498581],
        [-75.73051661793379, 45.405639516612354],
        [-75.72771895305878, 45.40682512062193],
        [-75.72316640971009, 45.408737477903884],
        BAYVIEW,
    ];
    addLine({
        lineName: "TP2BY",
        coords: TP2BY,
        paintOverrides: { "line-color": "#DA291C", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const BY2CR = [
        BAYVIEW,
        [-75.72167798324763, 45.40908296791821],
        [-75.71942084793822, 45.407546983737404],
        [-75.71852884583949, 45.406834782024646],
        [-75.71602281150675, 45.40521825634187],
        [-75.71439973844805, 45.404052189995326],
        CORSO,
    ];
    addLine({
        lineName: "BY2CR",
        coords: BY2CR,
        paintOverrides: { "line-color": "#65A233", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const CR2BR = [
        CORSO,
        [-75.71329317260759, 45.40420654764333],
        [-75.71144173185628, 45.40477907749536],
        [-75.70894543710851, 45.4054907426092],
        [-75.70834583217231, 45.405870210423785],
        [-75.70716637552698, 45.40650244883429],
        [-75.70567675645067, 45.407016183277904],
        [-75.70368963208928, 45.40787410149997],
        BRONSON,
    ];
    map.addSource("dottedLine", newFeatureCollection([]));
    map.addLayer(
        {
            id: "dottedLineLayer",
            source: "dottedLine",
            type: "circle",
            paint: {
                "circle-radius": 8,
                "circle-color": "#6e6e70",
                "circle-stroke-width": 0,
                "circle-opacity": 0.7,
            },
        },
        wbL
    );
    const BR2CL = [
        BRONSON,
        [-75.70244216522845, 45.40573686678579],
        [-75.70188170387944, 45.404628154841504],
        [-75.70159456912562, 45.40430500733237],
        [-75.69981499341458, 45.40118564347017],
        [-75.69700507191347, 45.396366788840226],
        [-75.69630075123499, 45.395052725268016],
        [-75.69608244625636, 45.393357965392624],
        [-75.69584598866075, 45.39249004848554],
        [-75.69487280991834, 45.3911134062146],
        [-75.6942685299128, 45.39016598146276],
        [-75.69419932739657, 45.389863023807095],
        [-75.69580137206356, 45.38908335609702],
        [-75.6960613529964, 45.38904881360827],
        [-75.69621593625382, 45.388876100845835],
        [-75.69696777300533, 45.38860469401067],
        [-75.69667914126521, 45.38800639707466],
        [-75.69653892534629, 45.387581402717984],
        [-75.69640679816922, 45.3868566006214],
        CARLETON,
    ];
    addLine({
        lineName: "BR2CL",
        coords: BR2CL,
        paintOverrides: { "line-color": "#0056B8", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const CL2GB = [
        CARLETON,
        [-75.69599046194297, 45.38481525151818],
        [-75.6960167958891, 45.38416356188864],
        [-75.69585715284843, 45.38346493093624],
        [-75.69549754097034, 45.38279450608738],
        [-75.69463792459575, 45.381466205207914],
        [-75.69394829060876, 45.380704748539245],
        [-75.69307423512544, 45.380149426379916],
        [-75.66800190592481, 45.37006414755788],
        [-75.66734923645605, 45.36975122110195],
        [-75.6660979312747, 45.36895016209809],
        [-75.6643106209052, 45.367525602203244],
        [-75.66337029097608, 45.36661006925027],
        [-75.66289080861988, 45.36610351557596],
        [-75.66240213322398, 45.36530760696675],
        GREENBORO,
    ];
    addLine({
        lineName: "CL2GB",
        coords: CL2GB,
        paintOverrides: { "line-color": "#65A233", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const GB2WK = [
        GREENBORO,
        [-75.65883731142492, 45.36066449290345],
        [-75.6591023334469, 45.36102259855588],
        [-75.65949307104363, 45.36123029879596],
        [-75.66098391782626, 45.36194513221983],
        [-75.6615173595883, 45.362346201320065],
        [-75.66195286666134, 45.36295655930704],
        [-75.66259996531346, 45.36403904433044],
        [-75.66338587024946, 45.36513061298771],
        [-75.66430665189662, 45.366186764237796],
        [-75.66549293013449, 45.367395112838466],
        [-75.66655955411733, 45.36836019250299],
        WALKLEY,
    ];
    addLine({
        lineName: "GB2WK",
        coords: GB2WK,
        paintOverrides: { "line-color": "#0056B8", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const WK2BB = [
        WALKLEY,
        [-75.66828140661777, 45.369678202145565],
        [-75.66917756494952, 45.370184293522556],
        [-75.67072328274934, 45.37082616172111],
        [-75.678636022046, 45.374011856921044],
        [-75.67931902963905, 45.37441772530573],
        [-75.67986673553239, 45.374909540834324],
        [-75.68020089055948, 45.375529323881636],
        [-75.68025964417865, 45.37616169681425],
        [-75.68015238169028, 45.37695656739169],
        [-75.67992493603944, 45.37797481407031],
        [-75.67934300442005, 45.37970625264458],
        [-75.67879334203488, 45.38052596539316],
        [-75.67838727317738, 45.38116955220241],
        [-75.67840882620027, 45.381643891875626],
        [-75.67861852277062, 45.382400771767294],
        [-75.67858260106559, 45.38265307510494],
        [-75.67882686865997, 45.382764088216874],
        [-75.67898492416217, 45.382965929679955],
        [-75.67897725017804, 45.38335619198406],
        [-75.6785533740586, 45.38366399670329],
        BILLINGS,
    ];
    addLine({
        lineName: "WK2BB",
        coords: WK2BB,
        paintOverrides: { "line-color": "#0056B8", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const BB2LY = [
        BILLINGS,
        [-75.67541686518905, 45.38562840420326],
        [-75.67391236481689, 45.386957159614155],
        [-75.67236056662126, 45.388455449642095],
        [-75.67165806168896, 45.389167469347655],
        [-75.67088341754594, 45.39012965112866],
        [-75.67007847224161, 45.391343197767895],
        [-75.66913360013643, 45.39307099484674],
        [-75.6689757425679, 45.39363588544472],
        [-75.6691260466556, 45.39394441057914],
        [-75.66966945374104, 45.39448432551205],
        [-75.67002290829498, 45.3948583649466],
        [-75.67007493663264, 45.39519529949678],
        [-75.66965292899789, 45.39607612407272],
        [-75.66895491321199, 45.39739990321911],
        [-75.66829173151632, 45.39827506971707],
        [-75.66789829132287, 45.398865775194196],
        [-75.66742425535479, 45.399961742255414],
        [-75.66620438933872, 45.40184571463749],
        [-75.66501734652198, 45.40372506412504],
        [-75.66468428708554, 45.404535945316326],
        [-75.66444442574986, 45.405639325518706],
        LYCEE,
    ];
    addLine({
        lineName: "BB2LY",
        coords: BB2LY,
        paintOverrides: { "line-color": "#0056B8", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const LY2HD = [
        LYCEE,
        [-75.664191236823, 45.407868085028184],
        [-75.66414515527048, 45.40861511248815],
        [-75.66411993462891, 45.41085519128475],
        [-75.66413594572505, 45.41198056278813],
        [-75.66428675807919, 45.41215701401131],
        [-75.66449621968238, 45.41219524503663],
        HURDMAN,
    ];
    addLine({
        lineName: "LY2HD",
        coords: LY2HD,
        paintOverrides: { "line-color": "#6e6e70", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });
    const HD2IN = [
        HURDMAN,
        [-75.66437076600083, 45.41234785487913],
        [-75.66397616243073, 45.41228659127026],
        [-75.66388404398896, 45.41198197400422],
        [-75.66304285716652, 45.411954745565],
        [-75.66220500363445, 45.41201703906694],
        [-75.66118845901644, 45.41219261149658],
        [-75.66078103438812, 45.41236818338095],
        [-75.66036599389103, 45.41243897834485],
        INDY,
    ];
    map.addSource("dottedLine2", newFeatureCollection([]));
    map.addLayer(
        {
            id: "dottedLine2Layer",
            source: "dottedLine",
            type: "circle",
            paint: {
                "circle-radius": 8,
                "circle-color": "#6e6e70",
                "circle-stroke-width": 0,
                "circle-opacity": 0.7,
            },
        },
        wbL
    );
    const IN2HD = [
        INDY,
        [-75.6604842377993, 45.41238937763478],
        [-75.66090376414955, 45.41240070483022],
        [-75.66106915434514, 45.41231291900658],
        [-75.66136362957194, 45.412131683326834],
        [-75.66164196916975, 45.41202973800159],
        [-75.66242842852574, 45.41195755799984],
        [-75.66414210895454, 45.411894306261985],
        [-75.6641784141196, 45.41202740183013],
        [-75.6643115330572, 45.412154833463376],
        [-75.66451322841783, 45.41219164699302],
        HURDMAN,
    ];
    addLine({
        lineName: "IN2HD",
        coords: IN2HD,
        paintOverrides: { "line-color": "#6e6e70", "line-opacity": 0.7 },
        casing: false,
        beforeLayer: wbL,
    });

    return new Set([
        new MapViewAdjustment({
            startAtTimeSec: 0,
            seconds: 0,
            newPanCoords: [-75.69469123249462, 45.385277323266024],
            newZoom: 12.94,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0,
            seconds: 0,
            coords: CR2BR,
            sourceId: "dottedLine",
            dotSpacing: 0.001,
        }),
        new DottedLineAnimation({
            startAtTimeSec: 0,
            seconds: 0,
            coords: HD2IN,
            sourceId: "dottedLine2",
            dotSpacing: 0.001,
        }),
    ]);
};

export default exportedAnimation;
