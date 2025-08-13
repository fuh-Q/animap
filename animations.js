/**
 * animation code goes here
 * to run an animation, you `export default` a function in the form `() => Promise<Set<Animation>>`
 * where the Animation is any of the exported classes from `./drawing.js
 */

import {
    InflateDeflate,
    LineAnimation,
    DottedLineAnimation,
    Blink,
    MapViewAdjustment,
    Rotation,
    Pop,
    LinearAdjustNumericPaintProp,
    Script,
} from "./drawing.js";
import { addImage, addLine, newLineLayer, newFeature, newFeatureCollection } from "./utils.js";
