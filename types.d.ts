import mapboxgl from "maplibre-gl";

declare global {
    var map: mapboxgl.Map;
    var maplibregl: typeof mapboxgl;
    var realFrameCounter: number;
    var render: boolean;
}

type NonZeroNumber = number;

interface Animation {
    get frameIdx(): number;
    get endFrameIdx(): number;
    step(): boolean;
}

type DrawLineOpts = {
    startAtTimeSec: NonZeroNumber;
    sourceId: string;
    coords: [number, number][];
    seconds?: number;
    animate?: boolean;
    headPointId?: string;
    maxTrailingPoints?: NonZeroNumber;
};

type DrawDottedLineOpts = {
    startAtTimeSec: NonZeroNumber;
    sourceId: string;
    coords: [number, number][];
    dotSpacing: NonZeroNumber;
    seconds?: number;
};

type InflateDeflateOpts = {
    startAtTimeSec: NonZeroNumber;
    layerId: string;
    secondsPerPeriod?: NonZeroNumber;
    totalSeconds?: NonZeroNumber;
};

type BlinkOpts = {
    startAtTimeSec: NonZeroNumber;
    sourceId: string;
    seconds?: NonZeroNumber;
    rings?: NonZeroNumber;
    radius?: NonZeroNumber;
    delay?: NonZeroNumber;
};

type MapViewAdjustmentOpts = {
    startAtTimeSec: NonZeroNumber;
    newPanCoords?: [number, number];
    newZoom?: number;
    newPitch?: number;
    seconds?: number;
};

type IdleRotationOpts = {
    startAtTimeSec: NonZeroNumber;
    direction: "clockwise" | "counterclockwise";
    idleDegreesPerFrame: NonZeroNumber;
    idleSeconds: NonZeroNumber;
    postIdleSeconds: NonZeroNumber;
    easeConstantSplit?: [NonZeroNumber, NonZeroNumber];
};

type PopOpts = {
    startAtTimeSec: NonZeroNumber;
    layerId: string;
    finalScale?: number;
    /**
     * when it pops, it goes up, then comes back down a bit,
     * so this is the factor between the highest size and the final size
     */
    maxVsEnd?: NonZeroNumber;
    seconds?: NonZeroNumber;
};

type LinearAdjustOpts = {
    startAtTimeSec: NonZeroNumber;
    layerId: string;
    paintProperty: string;
    newValue: number;
    seconds?: number;
};
