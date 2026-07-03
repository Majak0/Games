export interface MapZoomController {
    zoomIn(): void;
    zoomOut(): void;
    reset(): void;
    destroy(): void;
}

export function setupMapZoom(
    viewport: HTMLElement,
    transformLayer: HTMLElement
): MapZoomController {
    let scale = 1;
    let translateX = 0;
    let translateY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    let dragOriginX = 0;
    let dragOriginY = 0;

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    function applyTransform(): void {
        transformLayer.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        viewport.classList.toggle('arcade-world-map-viewport--zoomed', scale > 1.01);
    }

    function zoomAt(factor: number): void {
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));

        if (scale <= 1) {
            scale = 1;
            translateX = 0;
            translateY = 0;
        }

        applyTransform();
    }

    const onWheel = (event: WheelEvent): void => {
        event.preventDefault();
        zoomAt(event.deltaY < 0 ? 1.12 : 1 / 1.12);
    };

    const onMouseDown = (event: MouseEvent): void => {
        if (scale <= 1 || event.button !== 0) {
            return;
        }

        isDragging = true;
        dragStartX = event.clientX;
        dragStartY = event.clientY;
        dragOriginX = translateX;
        dragOriginY = translateY;
        viewport.classList.add('arcade-world-map-viewport--dragging');
    };

    const onMouseMove = (event: MouseEvent): void => {
        if (!isDragging) {
            return;
        }

        translateX = dragOriginX + (event.clientX - dragStartX);
        translateY = dragOriginY + (event.clientY - dragStartY);
        applyTransform();
    };

    const onMouseUp = (): void => {
        isDragging = false;
        viewport.classList.remove('arcade-world-map-viewport--dragging');
    };

    viewport.addEventListener('wheel', onWheel, { passive: false });
    viewport.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    return {
        zoomIn: () => zoomAt(1.25),
        zoomOut: () => zoomAt(1 / 1.25),
        reset: () => {
            scale = 1;
            translateX = 0;
            translateY = 0;
            applyTransform();
        },
        destroy: () => {
            viewport.removeEventListener('wheel', onWheel);
            viewport.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        },
    };
}
