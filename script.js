import "https://unpkg.com/maplibre-gl@5.6.1/dist/maplibre-gl.js";
import "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";

import animationInitializer from "./animations.js";
import { initRouteEditor } from "./route-editor.js";
import { FPS } from "./drawing.js";
import { sleep } from "./utils.js";

const render = document.cookie.startsWith("render");

document.addEventListener("keyup", (e) => {
    if (!(e.key === "Enter" && e.ctrlKey)) return;
    if (!render) document.cookie = "render";
    location.reload();
});

let stopAnim = false;
document.addEventListener("keyup", (e) => {
    if (e.key !== " ") return;
    stopAnim = !stopAnim;
});

if (render) {
    document.cookie = "";
    document.title = "0 / 0";
    document.querySelector("link[rel~='icon']").href =
        "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔴</text></svg>";
    document.getElementById("rendererStatus").style.opacity = 1;
    document.addEventListener("keyup", (e) => {
        if (!e.ctrlKey || !e.key === "Enter") return;
        location.reload();
    });
}

/**
 * @param {Blob[]} frames
 */
async function captureFrameTo(frames) {
    map.triggerRepaint();
    await new Promise((resolve) => {
        map.once("idle", () => {
            map.getCanvas().toBlob((blob) => {
                frames.push(blob);
                resolve();
            }, "image/jpeg");
        });
    });
}

async function init() {
    const map = new maplibregl.Map({
        style: "/positron.json",
        attributionControl: false,
        center: [-75.6975406016469, 45.411484269277736],
        zoom: 6,
        container: "map",
    });

    window.realFrameCounter = 0;
    window.map = map;

    if (!render) initRouteEditor(map);

    map.on("load", async () => {
        const ANIM_MAX_SECONDS = Infinity;
        let animations = await animationInitializer();

        const frames = [];

        let highestFrame = Math.max(...[...animations].map((a) => a.endFrameIdx));
        console.log("highest frame: ", highestFrame);

        while (animations.size && realFrameCounter <= ANIM_MAX_SECONDS * FPS) {
            if (stopAnim) break;

            animations.forEach((animation) => {
                const thisOnefinished = animation.step();
                if (thisOnefinished) animations.delete(animation);
            });

            document.title = `${realFrameCounter} / ~${highestFrame}`;
            if (!render) await sleep("requestAnimationFrame");
            else await captureFrameTo(frames);
            realFrameCounter++;
        }

        if (!stopAnim) document.title = "Finished";

        if (!render) return;
        const zip = new JSZip();
        frames.forEach((blob, index) => {
            zip.file(`frame_${String(index).padStart(4, "0")}.jpeg`, blob);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);

        const a = document.createElement("a");
        a.href = url;
        a.download = "frames.zip";
        a.click();

        // clean up
        URL.revokeObjectURL(url);
    });

    map.on("zoom", (_) => {
        if (render) return;
        document.getElementById("zoom").innerText = `zoom: ${
            Math.round(map.getZoom() * 100) / 100
        }`;
    });

    map.on("click", (e) => {
        console.log(`clicked at: (${e.lngLat.lng}, ${e.lngLat.lat})`);
        navigator.clipboard.writeText(`${e.lngLat.lng}, ${e.lngLat.lat}`);
    });

    document.addEventListener("auxclick", (_) => {
        const ctr = map.getCenter();
        console.log(`copied center: (${ctr.lng}, ${ctr.lat})`);
        navigator.clipboard.writeText(`${ctr.lng}, ${ctr.lat}`);
    });
}

init();
