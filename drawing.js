import { findLayer, hex } from "./utils.js";

export const FPS = document.cookie.startsWith("render") ? 60 : 60;
export const ANIM_CONTINUE = false;
export const ANIM_END = true;

/**
 * @implements {import("./types").Animation}
 */
export class LineAnimation {
    /**
     * @param {import("./types").DrawLineOpts} opts
     */
    constructor(opts) {
        const {
            startAtTimeSec,
            sourceId,
            coords,
            seconds = 5,
            headPointSourceId,
            maxTrailingPoints,
        } = opts;
        this.totalFrameCount = Math.ceil(seconds * FPS) || 1;

        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.coords = coords;
        this.seconds = seconds;
        this.headPointSourceId = headPointSourceId;

        this.src = map.getSource(sourceId);
        this.headSrc = headPointSourceId ? map.getSource(headPointSourceId) : undefined;
        this.maxTrail = maxTrailingPoints;

        this.src._data.geometry.coordinates.push(coords[0]);
        if (headPointSourceId) this.headSrc._data.geometry.coordinates = coords[0];

        /**@type {[number, number, number][]} */
        this.segments = new Array(coords.length - 1).fill(0);
        for (let i = 0; i < coords.length - 1; i++) {
            const dLng = coords[i + 1][0] - coords[i][0];
            const dLat = coords[i + 1][1] - coords[i][1];
            const hypotenuse = Math.sqrt(dLng * dLng + dLat * dLat);
            this.segments[i] = [hypotenuse, dLng, dLat];
        }

        this.totalDist = this.segments.map((v) => v[0]).reduce((tot, val) => tot + val);

        this.segIdx = 0;
        this.segCoveredDistance = 0;
        [this.lastLng, this.lastLat] = coords[0];
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + this.totalFrameCount + (this.maxTrail || 0);
    }

    maxTrailExceeded() {
        return this.maxTrail && this.src._data.geometry.coordinates.length > this.maxTrail;
    }

    shiftTrail() {
        while (this.coords.includes(this.src._data.geometry.coordinates[0])) {
            this.src._data.geometry.coordinates.shift();
        }
        this.src._data.geometry.coordinates.shift();
    }

    /**
     * there is ONE overall function with frame idx as input that dictates what PERCENTAGE of the TOTAL DISTANCE is to be added on the next frame
     * https://www.desmos.com/calculator/po38nnntoy
     *
     * `2(sin^2(pi/b * x)) / b`
     *
     * where b is the total number of frames
     * summing up all values from 1 to b will yield 1 (for 100%), meaning that when x = b 100% of the distance will have been drawn
     *
     * @param {number} x
     */
    percentage(x) {
        return (
            (2 / this.totalFrameCount) * Math.pow(Math.sin((Math.PI / this.totalFrameCount) * x), 2)
        );
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx >= this.totalFrameCount - 1) {
            if (!this.maxTrail) return ANIM_END;

            this.shiftTrail();
            this.src.setData(this.src._data);
            return this.src._data.geometry.coordinates.length ? ANIM_CONTINUE : ANIM_END;
        }

        const x = this.frameIdx + 1; // percentage function input

        let additionalDistance =
            this.seconds !== 0 ? this.percentage(x) * this.totalDist : this.totalDist;
        let [segLen, segDLng, segDLat] = this.segments[this.segIdx];
        let newSegCovered = this.segCoveredDistance + additionalDistance;

        while (newSegCovered >= segLen) {
            this.segIdx++;
            if (this.segIdx >= this.segments.length) break;

            additionalDistance -= segLen - this.segCoveredDistance;
            newSegCovered -= segLen;
            this.segCoveredDistance = 0;
            [segLen, segDLng, segDLat] = this.segments[this.segIdx];
            [this.lastLng, this.lastLat] = this.coords[this.segIdx];
            this.src._data.geometry.coordinates.push(this.coords[this.segIdx]);
        }

        if (this.segIdx >= this.segments.length) {
            if (this.headPointSourceId) {
                this.headSrc._data.geometry.coordinates = this.coords[this.coords.length - 1];
                this.headSrc.setData(this.headSrc._data);
            }

            if (this.maxTrailExceeded()) {
                this.src._data.geometry.coordinates.shift();
            }

            this.src._data.geometry.coordinates.push(this.coords[this.coords.length - 1]);
            this.src.setData(this.src._data);
            return this.maxTrail ? ANIM_CONTINUE : ANIM_END;
        }

        this.segCoveredDistance = newSegCovered;

        const k = Math.abs(segDLat / segDLng);
        let newLngComponent = Math.sqrt(Math.pow(additionalDistance, 2) / (k * k + 1));
        let newLatComponent = k * newLngComponent;
        if (segDLng < 0) newLngComponent *= -1;
        if (segDLat < 0) newLatComponent *= -1;

        const newLng = this.lastLng + newLngComponent;
        const newLat = this.lastLat + newLatComponent;

        this.lastLng = newLng;
        this.lastLat = newLat;

        if (this.maxTrailExceeded()) {
            this.shiftTrail();
        }

        this.src._data.geometry.coordinates.push([newLng, newLat]);
        this.src.setData(this.src._data);

        if (this.headPointSourceId) {
            this.headSrc._data.geometry.coordinates = [newLng, newLat];
            this.headSrc.setData(this.headSrc._data);
        }

        return ANIM_CONTINUE;
    }
}

/**
 * @implements {import("./types").Animation}
 */
export class DottedLineAnimation {
    /**
     * @param {import("./types").DrawDottedLineOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, sourceId, coords, dotSpacing = 0.0005, seconds = 5 } = opts;
        this.totalFrameCount = Math.ceil(seconds * FPS) || 1;

        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.coords = coords;
        this.seconds = seconds;

        this.src = map.getSource(sourceId);

        /**@type {[number, number, number][]} */
        this.segments = new Array(coords.length - 1).fill(0);
        for (let i = 0; i < coords.length - 1; i++) {
            const dLng = coords[i + 1][0] - coords[i][0];
            const dLat = coords[i + 1][1] - coords[i][1];
            const hypotenuse = Math.sqrt(dLng * dLng + dLat * dLat);
            this.segments[i] = [hypotenuse, dLng, dLat];
        }

        const totalDist = this.segments.map((v) => v[0]).reduce((tot, val) => tot + val);
        this.numDots = Math.floor(totalDist / dotSpacing);
        this.spacing = dotSpacing;
        this.dotsDrawn = 0;

        this.segIdx = 0;
        this.segCoveredDistance = 0;
        [this.lastLng, this.lastLat] = coords[0];
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + this.totalFrameCount;
    }

    /**
     * percentage of the total number of dots that should be visible on this frame
     * @param {number} x
     */
    percentage(x) {
        return Math.pow(Math.sin((Math.PI / (2 * this.totalFrameCount)) * x), 2);
    }

    /**
     * @param {number} lng
     * @param {number} lat
     * @return {GeoJSON.Feature<GeoJSON.Point>}
     */
    pointObj(lng, lat) {
        return {
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [lng, lat],
            },
        };
    }

    drawNewDot() {
        let additionalDistance = this.spacing;
        let [segLen, segDLng, segDLat] = this.segments[this.segIdx];
        let newSegCovered = this.segCoveredDistance + additionalDistance;

        while (newSegCovered >= segLen) {
            this.segIdx++;
            if (this.segIdx >= this.segments.length) break;

            additionalDistance -= segLen - this.segCoveredDistance;
            newSegCovered -= segLen;
            this.segCoveredDistance = 0;
            [segLen, segDLng, segDLat] = this.segments[this.segIdx];
            [this.lastLng, this.lastLat] = this.coords[this.segIdx];
        }

        if (this.segIdx >= this.segments.length) {
            this.src._data.features.push(this.pointObj(...this.coords[this.coords.length - 1]));
            this.src.setData(this.src._data);
            return ANIM_END;
        }

        this.segCoveredDistance = newSegCovered;

        const k = Math.abs(segDLat / segDLng);
        let newLngComponent = Math.sqrt(Math.pow(additionalDistance, 2) / (k * k + 1));
        let newLatComponent = k * newLngComponent;
        if (segDLng < 0) newLngComponent *= -1;
        if (segDLat < 0) newLatComponent *= -1;

        const newLng = this.lastLng + newLngComponent;
        const newLat = this.lastLat + newLatComponent;

        this.lastLng = newLng;
        this.lastLat = newLat;

        this.src._data.features.push(this.pointObj(newLng, newLat));
        this.src.setData(this.src._data);
        this.dotsDrawn++;

        return ANIM_CONTINUE;
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx >= this.totalFrameCount) {
            return ANIM_END;
        }

        const x = this.frameIdx + 1;
        let difference;
        if (this.seconds !== 0) {
            const newNumDots = Math.floor(this.percentage(x) * this.numDots);
            difference = newNumDots - this.dotsDrawn;
        } else difference = this.numDots;

        if (!difference) return ANIM_CONTINUE;
        for (let i = 0; i < difference; i++) {
            const animFinished = this.drawNewDot();
            if (animFinished) return ANIM_END;
        }

        return ANIM_CONTINUE;
    }
}

/**
 * @implements {import("./types").Animation}
 */
export class InflateDeflate {
    /**
     * @param {import("./types").InflateDeflateOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, layerId, totalSeconds, secondsPerPeriod = 3 } = opts;
        this.startOnFrame = Math.round(startAtTimeSec * FPS);

        this.periodFrameCount = secondsPerPeriod * FPS;
        this.totalFrameCount = totalSeconds ? totalSeconds * FPS : null;

        this.layerId = layerId;
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.totalFrameCount ? this.startOnFrame + this.totalFrameCount : Infinity;
    }

    /**
     * @param {number} x
     */
    width(x) {
        return (1 / 3) * Math.pow(Math.sin((Math.PI / this.periodFrameCount) * x), 2) + 1;
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.totalFrameCount !== null && realFrameCounter >= this.totalFrameCount)
            return ANIM_END;

        const width = map.getPaintProperty(this.layerId, "line-width");
        map.setPaintProperty(this.layerId, "line-width", width * this.width(this.frameIdx + 1));

        return ANIM_CONTINUE;
    }
}

/**
 * @implements {import("./types").Animation}
 */
export class Blink {
    /**
     * @param {import("./types").BlinkOpts} opts
     */
    constructor(opts) {
        const {
            startAtTimeSec,
            sourceId,
            secondsPerRing = 1,
            rings = 1,
            radius = 50,
            delay = 0.2 * FPS,
            ringLayerBefore,
        } = opts;

        this.frameCountPerRing = secondsPerRing * FPS;

        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.sourceId = sourceId;
        this.radius = radius;
        this.delay = delay;
        this.ringLayerBefore = ringLayerBefore;

        this.maxStroke = Math.sqrt(radius);

        this.ringCount = rings;
        /**@type {{[key: string]: () => void}} */
        this.rings = {};
        for (let ctr = 0; ctr < rings; ctr++) {
            const [layerId, stepFunction] = this.blinkOneRing(ctr * delay);
            this.rings[layerId] = stepFunction;
        }
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + (this.ringCount - 1) * this.delay + this.frameCountPerRing + 1;
    }

    /**
     * @param {number} x
     */
    radii(x) {
        return (this.radius / this.frameCountPerRing) * x;
    }

    /**
     * @param {number} x
     */
    strokeWidth(x) {
        return this.maxStroke - (this.maxStroke / this.frameCountPerRing) * x;
    }

    /**
     * @param {number} delayFrames
     * @returns {[() => void, string]}
     */
    blinkOneRing(delayFrames) {
        const layerId = `${this.sourceId}-${hex(8)}`;

        const paint = {
            "circle-radius": 0,
            "circle-opacity": 0,
            "circle-stroke-color": "#000",
            "circle-stroke-opacity": 1,
            "circle-stroke-width": 0,
        };

        const layer = {
            id: layerId,
            source: this.sourceId,
            type: "circle",
            paint,
        };

        map.addLayer(layer, this.ringLayerBefore);

        function renderStep() {
            if (
                this.frameIdx - delayFrames < 0 ||
                this.frameIdx - delayFrames >= this.frameCountPerRing
            )
                return;

            let x = this.frameIdx + 1 - delayFrames;
            let r = this.radii(x);
            let w = this.strokeWidth(x);
            map.setPaintProperty(layerId, "circle-radius", r);
            map.setPaintProperty(layerId, "circle-stroke-width", w);
        }

        return [layerId, renderStep.bind(this)];
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx > (this.ringCount - 1) * this.delay + this.frameCountPerRing + 1)
            return ANIM_END;

        Object.values(this.rings).forEach((ringStep) => ringStep());

        if (this.frameIdx > (this.ringCount - 1) * this.delay + this.frameCountPerRing + 1) {
            Object.keys(this.rings).forEach((k) => map.removeLayer(k));
            return ANIM_END;
        }

        return ANIM_CONTINUE;
    }
}

/**
 * @implements {import("./types").Animation}
 */
export class MapViewAdjustment {
    /**@type {number} */
    dLng;
    /**@type {number} */
    dLat;
    /**@type {number} */
    currentLng;
    /**@type {number} */
    currentLat;

    /**@type {number} */
    dZoom;
    /**@type {number} */
    currentZoom;

    /**@type {number} */
    dPitch;
    /**@type {number} */
    currentPitch;

    /**
     * @param {import("./types").MapViewAdjustmentOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, newPanCoords, newZoom, newPitch, seconds = 2 } = opts;
        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.totalFrameCount = Math.ceil(seconds * FPS) || 1;
        this.seconds = seconds;
        this.newPanCoords = newPanCoords;
        this.newZoom = newZoom;
        this.newPitch = newPitch;
    }

    frameZeroSetup() {
        if (this.newPanCoords) {
            const currentCoords = map.getCenter();
            this.dLng = this.newPanCoords[0] - currentCoords.lng;
            this.dLat = this.newPanCoords[1] - currentCoords.lat;
            this.currentLng = currentCoords.lng;
            this.currentLat = currentCoords.lat;
        }
        if (this.newZoom) {
            const zoom = map.getZoom();
            this.dZoom = this.newZoom - zoom;
            this.currentZoom = zoom;
        }
        if (this.newPitch !== undefined) {
            const pitch = map.getPitch();
            this.dPitch = this.newPitch - pitch;
            this.currentPitch = pitch;
        }
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + this.totalFrameCount;
    }

    /**
     * @param {number} x
     */
    percentage(x) {
        return (
            (2 / this.totalFrameCount) * Math.pow(Math.sin((Math.PI / this.totalFrameCount) * x), 2)
        );
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx === 0) this.frameZeroSetup();
        if (this.frameIdx >= this.totalFrameCount) return ANIM_END;

        if (this.seconds === 0) {
            if (this.newPanCoords) map.setCenter(this.newPanCoords);
            if (this.newZoom) map.setZoom(this.newZoom);
            if (this.newPitch !== undefined) map.setPitch(this.newPitch);
            return ANIM_END;
        }

        const additionalPercent = this.percentage(this.frameIdx + 1);
        if (this.newPanCoords) {
            this.currentLng += additionalPercent * this.dLng;
            this.currentLat += additionalPercent * this.dLat;
            map.setCenter([this.currentLng, this.currentLat]);
        }
        if (this.newZoom) {
            this.currentZoom += additionalPercent * this.dZoom;
            map.setZoom(this.currentZoom);
        }
        if (this.newPitch !== undefined) {
            this.currentPitch += additionalPercent * this.dPitch;
            map.setPitch(this.currentPitch);
        }

        return ANIM_CONTINUE;
    }
}

/**
 * @implements {import("./types").Animation}
 */
export class Rotation {
    /**@type {number} */
    ogBearing;
    /**@type {number} */
    postIdleRotateDegrees;

    /**
     * @param {import("./types").RotationOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, type, direction } = opts;
        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.direction = direction === "counterclockwise" ? 1 : -1;
        this.type = type;

        switch (type) {
            case "idle":
                this.initIdle(opts);
                break;
            case "mapviewadjustment":
                this.initMapViewAdjustment(opts);
                break;
        }
    }

    /**
     * @param {import("./types").IdleRotation} opts
     */
    initIdle(opts) {
        const {
            idleDegreesPerFrame,
            idleSeconds,
            postIdleSeconds,
            easeConstantSplit: [preIdle, idle] = [0.4, 0.6],
        } = opts;

        this.preIdleFrameCount = Math.round(FPS * idleSeconds * preIdle);
        this.idleFrameCount = Math.round(FPS * idleSeconds * idle);
        this.postIdleFrameCount = Math.round(FPS * postIdleSeconds);

        let sum = this.preIdleFrameCount + this.idleFrameCount + this.postIdleFrameCount;
        this.totalFrameCount = sum;

        this.postIdleStart = this.totalFrameCount - this.postIdleFrameCount;
        this.idleDegreesPerFrame = idleDegreesPerFrame;
    }

    /**
     * @param {import("./types").MapViewAdjustmentRotation} opts
     */
    initMapViewAdjustment(opts) {
        const { newBearing, seconds = 3 } = opts;
        this.newBearing = newBearing;
        this.seconds = seconds;
        this.totalFrameCount = Math.round(FPS * seconds);
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + this.totalFrameCount;
    }

    PRE_IDLE = 1;
    IDLE = 2;
    POST_IDLE = 3;

    get currentPhase() {
        if (this.frameIdx >= this.postIdleStart) return this.POST_IDLE;
        else if (this.frameIdx >= this.preIdleFrameCount) return this.IDLE;
        else return this.PRE_IDLE;
    }

    /**
     * @see https://www.desmos.com/calculator/lky9hvirck
     * @param {number} x
     */
    percentageIdle(x) {
        switch (this.currentPhase) {
            case this.PRE_IDLE:
                return Math.pow(Math.sin((Math.PI / (2 * this.preIdleFrameCount)) * x), 2);
            case this.IDLE:
                return 1;
            case this.POST_IDLE:
                let realX = x - this.postIdleStart;
                return (
                    (2 * Math.pow(Math.sin((Math.PI / this.postIdleFrameCount) * realX), 2)) /
                    this.postIdleFrameCount
                );
        }
    }

    /**
     * @param {number} x
     */
    percentageMapView(x) {
        return (
            (2 / this.totalFrameCount) * Math.pow(Math.sin((Math.PI / this.totalFrameCount) * x), 2)
        );
    }

    get percentage() {
        return this.type === "idle" ? this.percentageIdle : this.percentageMapView;
    }

    frameZeroSetupMapView() {
        const bearing = map.getBearing();
        this.dBearing = this.direction * (this.newBearing - bearing);
        this.currentBearing = bearing;

        if (this.seconds === 0) {
            map.setBearing(this.newBearing);
            return ANIM_END;
        }
    }

    frameZeroSetupIdle() {
        this.ogBearing = map.getBearing();
    }

    get frameZeroSetup() {
        return this.type === "idle" ? this.frameZeroSetupIdle : this.frameZeroSetupMapView;
    }

    postIdleSetup() {
        this.postIdleRotateDegrees = -this.direction * Math.abs(map.getBearing() - this.ogBearing);
    }

    stepIdle() {
        if (this.frameIdx === this.postIdleStart) this.postIdleSetup();

        const additionalPercent = this.percentage(this.frameIdx + 1);
        const toTurn =
            this.currentPhase !== this.POST_IDLE
                ? this.direction * this.idleDegreesPerFrame * additionalPercent
                : this.direction * this.postIdleRotateDegrees * additionalPercent;

        map.setBearing(map.getBearing() + toTurn);
        return ANIM_CONTINUE;
    }

    stepMapView() {
        this.currentBearing += this.percentage(this.frameIdx + 1) * this.dBearing;
        map.setBearing(this.currentBearing);
        return ANIM_CONTINUE;
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx === 0) this.frameZeroSetup();
        if (this.frameIdx >= this.totalFrameCount) return ANIM_END;

        const finished = this.type === "idle" ? this.stepIdle() : this.stepMapView();
        if (finished) return ANIM_END;

        return ANIM_CONTINUE;
    }
}

/**
 * @see https://www.desmos.com/calculator/ithlydbwk5
 * @implements {import("./types").Animation}
 */
export class Pop {
    /**
     * @param {import("./types").PopOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, layerId, finalScale = 1, maxVsEnd = 0.8, seconds = 0.275 } = opts;
        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.totalFrameCount = Math.round(FPS * seconds);

        this.innerTrigFunc = finalScale === 0 ? Math.cos : Math.sin;
        /**@type {mapboxgl.SymbolLayer} */
        this.layer = findLayer(map, layerId);

        this.zValue = maxVsEnd;
        this.aValue = Math.PI / 2 + Math.asin(Math.sqrt(1 - this.zValue));
        this.finalScale = finalScale;
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + this.totalFrameCount;
    }

    /**
     * @see https://www.desmos.com/calculator/ithlydbwk5
     * @param {number} x
     * @param {boolean} useCache
     */
    percentage(x) {
        let inner = this.innerTrigFunc((Math.PI / (2 * this.totalFrameCount)) * x);
        return Math.pow(Math.sin(this.aValue * inner), 2) / this.zValue;
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx >= this.totalFrameCount) return ANIM_END;

        map.setLayoutProperty(
            this.layer.id,
            "icon-size",
            this.finalScale * this.percentage(this.frameIdx + 1)
        );

        return ANIM_CONTINUE;
    }
}

/**
 * primarily used to fade things, although in practice can be used to manipulate any numerical paint property
 *
 * @implements {import("./types").Animation}
 */
export class LinearAdjustNumericPaintProp {
    /**@type {number} */
    oldValue;

    /**
     * @param {import("./types").LinearAdjustOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, layerId, paintProperty, newValue, seconds = 1 } = opts;
        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.totalFrameCount = Math.ceil(seconds * FPS) || 1;

        this.layerId = layerId;
        this.paintProperty = paintProperty;
        this.newValue = newValue;
    }

    frameZeroSetup() {
        this.oldValue = map.getPaintProperty(this.layerId, this.paintProperty);
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + this.totalFrameCount;
    }

    /**
     * @param {number} x
     */
    currentValue(x) {
        return ((this.newValue - this.oldValue) / this.totalFrameCount) * x + this.oldValue;
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;
        if (this.frameIdx === 0) this.frameZeroSetup();
        if (this.frameIdx >= this.totalFrameCount) return ANIM_END;

        map.setPaintProperty(
            this.layerId,
            this.paintProperty,
            this.currentValue(this.frameIdx + 1)
        );

        return ANIM_CONTINUE;
    }
}

/**
 * @implements {import("./types").Animation}
 */
export class SetSourceCoords {
    /**
     * @param {import("./types").SetSourceCoordsOpts} opts
     */
    constructor(opts) {
        const { startAtTimeSec, sourceId, newCoords } = opts;
        this.startOnFrame = Math.round(startAtTimeSec * FPS);
        this.sourceId = sourceId;
        this.newCoords = newCoords;
    }

    get frameIdx() {
        return realFrameCounter - this.startOnFrame;
    }

    get endFrameIdx() {
        return this.startOnFrame + 1;
    }

    step() {
        if (this.frameIdx < 0) return ANIM_CONTINUE;

        const src = map.getSource(this.sourceId);
        src._data.geometry.coordinates = this.newCoords;
        src.setData(src._data);
        return ANIM_END;
    }
}
