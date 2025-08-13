import mapboxgl from "maplibre-gl";

declare global {
    var map: mapboxgl.Map;
    var maplibregl: typeof mapboxgl;
    var realFrameCounter: number;
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
    headPointSourceId?: string;
    maxTrailingPoints?: NonZeroNumber;
    easing?: boolean;
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
    secondsPerRing?: NonZeroNumber;
    rings?: NonZeroNumber;
    radius?: NonZeroNumber;
    delay?: NonZeroNumber;
    ringLayerBefore?: string;
};

type MapViewAdjustmentOpts = {
    startAtTimeSec: NonZeroNumber;
    newPanCoords?: [number, number];
    newZoom?: number;
    newPitch?: number;
    seconds?: number;
};

type IdleRotation = {
    type: "idle";
    idleDegreesPerFrame: NonZeroNumber;
    idleSeconds: NonZeroNumber;
    postIdleSeconds: NonZeroNumber;
    easeConstantSplit?: [NonZeroNumber, NonZeroNumber];
};

type MapViewAdjustmentRotation = {
    type: "mapviewadjustment";
    newBearing: number;
    seconds?: number;
};

type RotationOpts = {
    startAtTimeSec: NonZeroNumber;
    type: string;
    direction: "clockwise" | "counterclockwise";
} & (IdleRotation | MapViewAdjustmentRotation);

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

type KeysOfUnion<T> = T extends any ? keyof T : never;
type LinearAdjustOpts = {
    startAtTimeSec: NonZeroNumber;
    layerId: string;
    paintProperty: KeysOfUnion<mapboxgl.AnyPaint>;
    newValue: number;
    seconds?: number;
    easing?: boolean;
};

type ScriptOpts = {
    startAtTimeSec: NonZeroNumber;
    frames?: NonZeroNumber;
    execute: () => void;
};

type AddImageOpts = {
    imgName: string;
    coords: [number, number] | [number, number][];
    layoutOverrides?: mapboxgl.SymbolLayout;
    paintOverrides?: mapboxgl.SymbolPaint;
    beforeLayer?: string;
};

type AddLineOpts = {
    lineName: string;
    coords?: [number, number][];
    paintOverrides?: mapboxgl.LinePaint;
    casingPaintOverrides?: mapboxgl.LinePaint;
    casing?: boolean;
    beforeLayer?: string;
};
