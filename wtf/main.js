import {
    Group, Point, Line, Label, DraggablePoint,
    InARectangle,
    Angle,
    OnALine
} from "./signal-canvas.js";

function makeEyes(canvas, threeDGlasses = false) {
    const eyes = [
        new Point(() => {
            const dim = canvas.dimensions.getValue();
            return { x: dim.width * 0.4, y: dim.height - 30 };
        }).setOptions({ zIndex: 1, colour: threeDGlasses ? "red" : "black" }),
        new Point(() => {
            const dim = canvas.dimensions.getValue();
            return { x: dim.width * 0.6, y: dim.height - 30 };
        }).setOptions({ zIndex: 1, colour: threeDGlasses ? "blue" : "black" }),
        new Label("Left eye", () => {
            const dim = canvas.dimensions.getValue();
            return { x: dim.width * 0.4 - 10, y: dim.height - 24 };
        }).setOptions({ align: "right", colour: threeDGlasses ? "red" : "black" }),
        new Label("Right eye", () => {
            const dim = canvas.dimensions.getValue();
            return { x: dim.width * 0.6 + 10, y: dim.height - 24 };
        }).setOptions({ align: "left", colour: threeDGlasses ? "blue" : "black" })
    ];
    for (const el of eyes) canvas.add(el);
    return eyes;
}

{
    const diagram = document.getElementById("sc1");
    const eyes = makeEyes(diagram);
    const thumb = new DraggablePoint(
        { x: 0.5, y: 0.5 },
        () => {
            const { width, height } = diagram.dimensions.getValue();
            return InARectangle(
                { x: width * 0.2, y: height * 0.4 },
                { x: width * 0.8, y: height * 0.8 }
            );
        }
    ).setOptions({ zIndex: 1 });
    diagram.add(thumb);
    diagram.add(new Label("Thumb (click to drag)", thumb.point.add({ x: 12, y: 6 })));
    const screen = new Line(() => {
        const { width, height } = diagram.dimensions.getValue();
        return {
            a: { x: width * 0.1, y: height * 0.2 },
            b: { x: width * 0.9, y: height * 0.2 },
        }
    }).setOptions({
        dashes: [5, 5],
        extendPastA: true,
        extendPastB: true
    });
    diagram.add(screen);
    diagram.add(new Label(
        "Background",
        () => {
            const { height } = diagram.dimensions.getValue();
            return { x: 20, y: height * 0.2 - 10 };
        }
    ));
    const leftRay = new Line(eyes[0], thumb.point).setOptions({ colour: '#c84' });
    diagram.add(leftRay);
    const rightRay = new Line(eyes[1], thumb.point).setOptions({ colour: '#c84' });
    diagram.add(rightRay);
    const leftEclipse = Point.lineIntersection(leftRay, screen).setOptions({ zIndex: 1 });
    diagram.add(leftEclipse);
    diagram.add(new Line(thumb.point, leftEclipse)).setOptions({ dashes: [3, 3], colour: '#c84' });
    const rightEclipse = Point.lineIntersection(rightRay, screen).setOptions({ zIndex: 1 });
    diagram.add(rightEclipse);
    diagram.add(new Line(thumb.point, rightEclipse)).setOptions({ dashes: [3, 3], colour: '#c84' });
}

{
    const diagram = document.getElementById("sc2");
    const eyes = makeEyes(diagram);
    const thumb = new DraggablePoint(
        { x: 0.5, y: 0.5 },
        () => {
            const { width, height } = diagram.dimensions.getValue();
            return InARectangle(
                { x: width * 0.2, y: height * 0.1 },
                { x: width * 0.8, y: height * 0.8 }
            );
        }
    ).setOptions({ zIndex: 1 });
    diagram.add(thumb);
    diagram.add(new Label("Object (click to drag)", thumb.point.add({ x: 12, y: 6 })));
    diagram.add(new Line(eyes[0], thumb.point).setOptions({ colour: '#c84' }));
    diagram.add(new Line(eyes[1], thumb.point).setOptions({ colour: '#c84' }));
    diagram.add(new Angle(eyes[1], thumb.point, eyes[0]))
        .setOptions({
            unit: "degrees",
            showValue: true,
            line: { colour: '#06b' },
            label: { font: "bold 16px sans-serif", colour: '#06b' }
        });
}

{
    const diagram = document.getElementById("sc3");
    const eyes = makeEyes(diagram);
    const screen = new Line(() => {
        const { width, height } = diagram.dimensions.getValue();
        return {
            a: { x: width * 0.1, y: height * 0.65 },
            b: { x: width * 0.9, y: height * 0.65 },
        }
    }).setOptions({
        dashes: [5, 5],
        extendPastA: true,
        extendPastB: true
    });
    diagram.add(screen);
    const handle = new DraggablePoint(
        0.5,
        () => {    
            const { width, height } = diagram.dimensions.getValue();
            return OnALine(
                { x: width * 0.51, y: height * 0.65 },
                { x: width * 0.59, y: height * 0.65 }
            );
        }
    ).setOptions({ zIndex: 1 });
    diagram.add(handle);
    const lHandle = new Point(() => {
        const { x, y } = handle.point.getParams();
        const { width } = diagram.dimensions.getValue();
        return { x: width - x, y };
    });
    diagram.add(lHandle);
    for (let i = 3; i < 50; i+=2) {
        diagram.add(new Point(() => {
            const { x, y } = handle.point.getParams();
            const { width } = diagram.dimensions.getValue();
            return { x: width * 0.5 + (x - width * 0.5) * i, y };
        }));
        diagram.add(new Point(() => {
            const { x, y } = handle.point.getParams();
            const { width } = diagram.dimensions.getValue();
            return { x: width * 0.5 - (x - width * 0.5) * i, y };
        }));
    }
    const leftRay = new Line(eyes[0], lHandle).setOptions({ colour: '#c84', zIndex: -1 });
    diagram.add(leftRay);
    const rightRay = new Line(eyes[1], handle.point).setOptions({ colour: '#c84', zIndex: -1 });
    diagram.add(rightRay);
    const image = Point.lineIntersection(leftRay, rightRay);
    diagram.add(image);
    diagram.add(new Line(lHandle, image)).setOptions({ colour: '#c84', dashes: [2, 2], zIndex: -1 });
    diagram.add(new Line(handle.point, image)).setOptions({ colour: '#c84', dashes: [2, 2], zIndex: -1 });
    diagram.add(new Label("Where you see the object", image.add({ x: 12, y: 6 })));
}

{
    const diagram = document.getElementById("sc4");
    const eyes = makeEyes(diagram);
    const screen = new Line(() => {
        const { width, height } = diagram.dimensions.getValue();
        return {
            a: { x: width * 0.1, y: height * 0.1 },
            b: { x: width * 0.9, y: height * 0.1 },
        }
    }).setOptions({
        dashes: [5, 5],
        extendPastA: true,
        extendPastB: true
    });
    diagram.add(screen);
    const handle = new DraggablePoint(
        0.1,
        () => {    
            const { width, height } = diagram.dimensions.getValue();
            return OnALine(
                { x: width * 0.51, y: height * 0.1 },
                { x: width * 0.9, y: height * 0.1 }
            );
        }
    ).setOptions({ zIndex: 1 });
    diagram.add(handle);
    const lHandle = new Point(() => {
        const { x, y } = handle.point.getParams();
        const { width } = diagram.dimensions.getValue();
        return { x: width - x, y };
    });
    diagram.add(lHandle);
    for (let i = 3; i < 50; i+=2) {
        diagram.add(new Point(() => {
            const { x, y } = handle.point.getParams();
            const { width } = diagram.dimensions.getValue();
            return { x: width * 0.5 + (x - width * 0.5) * i, y };
        }));
        diagram.add(new Point(() => {
            const { x, y } = handle.point.getParams();
            const { width } = diagram.dimensions.getValue();
            return { x: width * 0.5 - (x - width * 0.5) * i, y };
        }));
    }
    const leftRay = new Line(eyes[1], lHandle).setOptions({ colour: '#c84', zIndex: -1 });
    diagram.add(leftRay);
    const rightRay = new Line(eyes[0], handle.point).setOptions({ colour: '#c84', zIndex: -1 });
    diagram.add(rightRay);
    const image = Point.lineIntersection(leftRay, rightRay);
    diagram.add(image);
    diagram.add(new Label("Where you see the object", image.add({ x: 12, y: 6 })));
}

{
    const diagram = document.getElementById("sc5");
    const eyes = makeEyes(diagram, true);
    diagram.add(new Label("Red and blue dots on a screen", () => {
        const { height } = diagram.dimensions.getValue();
        return { x: 16, y: height * 0.1 - 8 };
    }));
    const thumb = new DraggablePoint(
        { x: 0.5, y: 0.5 },
        () => {
            const { width, height } = diagram.dimensions.getValue();
            return InARectangle(
                { x: width * 0.2, y: height * 0.2 },
                { x: width * 0.8, y: height * 0.8 }
            );
        }
    ).setOptions({ zIndex: 1 });
    diagram.add(thumb);
    diagram.add(new Label("Where you see the object", thumb.point.add({ x: 12, y: 6 })));
    diagram.add(new Label("(click to drag)", thumb.point.add({ x: 12, y: 24 })));
    const screen = new Line(() => {
        const { width, height } = diagram.dimensions.getValue();
        return {
            a: { x: width * 0.1, y: height * 0.1 },
            b: { x: width * 0.9, y: height * 0.1 },
        }
    }).setOptions({
        dashes: [5, 5],
        extendPastA: true,
        extendPastB: true
    });
    diagram.add(screen);
    const lObject = Point.lineIntersection(() => ({ a: eyes[0].getParams(), b: thumb.point.getParams() }), screen)
        .setOptions({ colour: "red" });
    const rObject = Point.lineIntersection(() => ({ a: eyes[1].getParams(), b: thumb.point.getParams() }), screen)
        .setOptions({ colour: "blue" });
    diagram.add(lObject);
    diagram.add(rObject);
    diagram.add(new Line(eyes[0], lObject).setOptions({ colour: "red" }));
    diagram.add(new Line(eyes[1], rObject).setOptions({ colour: "blue" }));
}

{
    const diagram = document.getElementById("sc6");
    const eyes = makeEyes(diagram);
    const screen = new Line(() => {
        const { width, height } = diagram.dimensions.getValue();
        return {
            a: { x: width * 0.1, y: height * 0.65 },
            b: { x: width * 0.9, y: height * 0.65 },
        }
    }).setOptions({
        dashes: [5, 5],
        extendPastA: true,
        extendPastB: true
    });
    diagram.add(screen);
    const limits = [0.33, 0.42, 0.5, 0.61, 0.7];
    const handles = [0,0,0,0].map((x, i) =>
        diagram.add(new DraggablePoint(
            0.5,
            () => {
                const { width, height } = diagram.dimensions.getValue();
                return OnALine(
                    { x: width * limits[i], y: height * 0.65 },
                    { x: width * limits[i + 1], y: height * 0.65 }
                );
            }
        )).setOptions({ zIndex: 5 }));
    const colours = ["red", "#080", "blue"];
    const images = [];
    for (let i = 0; i < 3; ++i) {
        const lRay = new Line(eyes[0], handles[i].point);
        const rRay = new Line(eyes[1], handles[i + 1].point);
        diagram.add(lRay).setOptions({ colour: colours[i] });
        diagram.add(rRay).setOptions({ colour: colours[i] });
        images[i] = Point.lineIntersection(lRay, rRay);
        diagram.add(images[i]).setOptions({ colour: colours[i] });
        diagram.add(new Line(handles[i].point, images[i])).setOptions({ colour: colours[i], dashes: [2, 2 ]});
        diagram.add(new Line(handles[i + 1].point, images[i])).setOptions({ colour: colours[i], dashes: [2, 2 ]});
        if (i) diagram.add(new Line(
            images[i - 1], images[i]
        )).setOptions({ dashes: [5, 5], zIndex: -3 })
    }
}
