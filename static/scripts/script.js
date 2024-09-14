// -----------------------------------------------------------------------------
// Start JQuery code
// -----------------------------------------------------------------------------

var imageHeight = 100;
var imageWidth = 100;
let leftMargin = 0;

const canvas = new fabric.Canvas(`canvas`, { backgroundColor: "#CFCECF" });
canvas.selection = false; // disable group selection

// master settings
const masterOnOffButtonTxt = [`Hide All B.Box`, `Show All B.Box`];

// define utlities for canvas displaying

const canvasUtils = {
    // Constants
    maxZoom: function () { return 5.0; },
    minZoom: function () {
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();

        return Math.min(width / imageWidth, height / imageHeight);
    },
    allZoom: function () { return this.minZoom();  },
    toFitZoom: function () {
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();

        return Math.max(width / imageWidth, height / imageHeight);
    },

    // zoom canvas to input value
    updateZoomButtons: function (zoom, runFlag) {
        if (runFlag) {
            const minZoom = canvasUtils.minZoom();
            const maxZoom = canvasUtils.maxZoom();
            
            // enable all zoom buttons
            $(`#zoom-in`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-out`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-one`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-all`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-to-fit`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
            
            if (zoom === minZoom) {
                // disable zoom out and reset button
                $(`#zoom-out`).prop(`disabled`, true).addClass(`btn-secondary`).removeClass(`btn-primary`);
                $(`#zoom-all`).prop(`disabled`, true).addClass(`btn-secondary`).removeClass(`btn-primary`);
            } else if (zoom === maxZoom) {
                // disable zoom in button
                $(`#zoom-in`).prop(`disabled`, true).addClass(`btn-secondary`).removeClass(`btn-primary`);
            } else if (zoom === 1.0) {
                // enable all zoom buttons
                $(`#zoom-one`).prop(`disabled`, true).addClass(`btn-secondary`).removeClass(`btn-primary`);
            } else if (zoom === this.toFitZoom()) {
                $(`#zoom-to-fit`).prop(`disabled`, true).addClass(`btn-secondary`).removeClass(`btn-primary`);
            }
            // Update the zoom-range input by the current value.
            document.getElementById(`zoom-range`).min = minZoom;
            document.getElementById(`zoom-range`).max = maxZoom;
            document.getElementById(`zoom-range`).step = (maxZoom - minZoom) / 1000;
            document.getElementById(`zoom-range`).value = zoom;
            // Update the zoom-text to show the current zoom level, by F0.2 format
            document.getElementById(`zoom-text`).innerHTML = parseFloat(zoom * 100).toFixed(2) + `%`;
        }
    },

    calculatePosition: (x, y) => {
        // Calculate the maximum allowed values
        const offsetWidth = canvas.width - imageWidth * canvas.getZoom();
        const offsetHeight = canvas.height - imageHeight * canvas.getZoom();

        const minX = offsetWidth > 0 ? offsetWidth /2 : offsetWidth;
        const maxX = offsetWidth > 0 ? offsetWidth / 2 : 0;
        const minY = offsetHeight > 0 ? offsetHeight / 2 : offsetHeight;
        const maxY = offsetHeight > 0 ? offsetHeight / 2 : 0;

        // Adjust left and top values to stay within the limits
        x = Math.max(Math.min(x, maxX), minX);
        y = Math.max(Math.min(y, maxY), minY);
        
        var xy = [x, y];

        return xy;
    },
    
    validateImagePosition: function (x, y) {
        const vpt = canvas.viewportTransform;
        if (!x) {
            x = vpt[4];
            y = vpt[5];
        }
        const xy = canvasUtils.calculatePosition(x, y);

        vpt[4] = xy[0];
        vpt[5] = xy[1];
        canvas.renderAll();
     },

    zoom: function (zoom, runFlag) {
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();
        // Validate the zoom factor
        zoom = Math.min(zoom, this.maxZoom());
        zoom = Math.max(zoom, this.minZoom());
        canvas.zoomToPoint({ x: width / 2, y: height / 2 }, zoom);
        this.validateImagePosition();
        this.updateZoomButtons(zoom, runFlag);
        canvas.calcOffset();
        canvas.renderAll();
    },

    // adding image and bounding box from inference model to canves

    onImageLoad: function (image) {
        // image is finished loading
        const imageSrc = $(image).attr(`src`);
        let runFlag = false;

        if (imageSrc.slice(-15) === `gcmethumb-3.png`) {
            runFlag = false;
            this.addItemsToCanvas(image);
        } else {
            runFlag = true;
            this.addItemsToCanvas(image);
            this.updateZoomButtons(canvas.getZoom());
            const buttons = $(`div#zoom-btn-container button`);
            buttons.prop(`disabled`, false);
            $(`#zoom-range`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
        }

        return runFlag;
    },

    addItemsToCanvas: function (image) {
        // runFlag is True if model is run.
        // runFlag is False when the fresh start.
        const hexColor = [
            `#FF3838`,
            `#2C99A8`,
            `#FF701F`,
            `#6473FF`,
            `#CFD231`,
            `#48F90A`,
            `#92CC17`,
            `#3DDB86`,
            `#1A9334`,
            `#00D4BB`,
            `#FF9D97`,
            `#00C2FF`,
            `#344593`,
            `#FFB21D`,
            `#0018EC`,
            `#8438FF`,
            `#520085`,
            `#CB38FF`,
            `#FF95C8`,
            `#FF37C7`
        ];

        // get image to be added in canvas
        const canvasImg = new fabric.Image(image);
        let boxes = []

        canvasImg.set(`selectable`, false);
        // save image width and hight
        imageWidth = canvasImg.width;
        imageHeight = canvasImg.height;

        canvas.add(canvasImg);
        
        if (runFlag) {
            // for each item in jsonData => create bbox and add it to canvas
            jsonData.forEach((item) => {
                const box = new fabric.Rect({
                    left: item.Left,
                    top: item.Top,
                    fill: `rgba(0,0,0,0)`,
                    stroke: hexColor[item.CategoryID % hexColor.length],
                    strokeWidth: 3,
                    width: item.Width,
                    height: item.Height,
                    selectable: false,
                    opacity: 1.0,
                });
                //console.log(`Add box to canvas`, item.index, hexColor[item.CategoryID % hexColor.length]);
                //canvas.add(box);
                boxes.push(box);
            });
            var group = new fabric.Group(boxes, {selectable: false,});
            canvas.add(group);
        }
        // reset zoom
        canvasUtils.zoom(canvasUtils.minZoom(), runFlag);
    },

    // Create overlay display when row is selected
    displayOverlay: function (selectd_rows, runFlag = false) {
        // Check if it arlready has mask layer.
        // If yes then remove it first.
        const objects = canvas.getObjects();
        const fixLayersCount = runFlag ? 2 : 1;
        if (objects.length > fixLayersCount) {
            // remove last object
            const rect = objects[objects.length - 1];
            canvas.remove(rect);
        }

        if (selectd_rows.length > 0) {
            // Create new rectangle to cover all image
            const rect = new fabric.Rect({
                left: 0,
                top: 0,
                fill: `black`,
                width: imageWidth,
                height: imageHeight,
                opacity: 0.1,
                selectable: false,
            });

            var clipPaths = [];

            // create clipPaths from selected_rows
            selectd_rows.forEach((idx) => {
                item = jsonData[idx];
                const box = new fabric.Rect({
                    left: item.Left - imageWidth / 2,
                    top: item.Top - imageHeight / 2,
                    width: item.Width,
                    height: item.Height,
                    selectable: false,
                });
                clipPaths.push(box);
            });

            // Create empty group to add clipPaths
            var group = new fabric.Group(clipPaths);
            group.inverted = true;
            rect.clipPath = group;

            canvas.add(rect);
        }
        // save current select for next operation
        canvas.renderAll();
    },

    // draw box on button On/Off status
    setBBoxOpacity(index, flag, runFlag) {
        if (!runFlag) { return };
        const group = canvas.item(1);
        const opc = flag ? 1 : 0;
        group.item(index).set(`opacity`, opc);
        canvas.renderAll();
    },
};

function updateTreeView(index, toggleButtons, treeNodes) {
    const $btn = toggleButtons[index];
    const status = $btn.data(`status`) === `on` ? true : false;
    const node = treeNodes[index];
    //console.log(`find for `, text, `: found `, node);
    //console.log(node.nodeId, ` to `, status);
    if (status === true) {
        $(`#tree`).treeview(`checkNode`, [node.nodeId, { silent: true }]);
    } else {
        $(`#tree`).treeview(`uncheckNode`, [node.nodeId, { silent: true }]);
    }

    const parent = $(`#tree`).treeview(`getParent`, node.nodeId);
    // check the treeview for parent nodes
    //console.log(parent_nodes);
    let siblings = $(`#tree`).treeview(`getSiblings`, node.nodeId);
    let checked_count = 0;
    siblings.push(node);

    for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].state[`checked`]) {
            checked_count++;
        }
    }

    if (checked_count === siblings.length) {
        $(`#tree`).treeview(`checkNode`, [parent.nodeId, { silent: true }]);
    } else {
        $(`#tree`).treeview(`uncheckNode`, [parent.nodeId, { silent: true }]);
    }
}

function updateOnOffMaster(buttons) {
    let isOneOff = false
    for (let i = 0; i < buttons.length; i++) {
        const $btn = buttons[i];
        if ($btn.data(`status`) === 'off') {
            isOneOff = true;
            break;
        }
    }
    toggleMasterOnOffBBoxButton(!isOneOff ? 0 : 1);
}

function toggleMasterOnOffBBoxButton(index) {
    const status = [`on`, `off`];
    $(`#master-toggle`).data(`status`, status[index]);
    $(`#master-toggle`).text(masterOnOffButtonTxt[index]);
}

function toggleOnOffButton(index, toggleButtons, status, runFlag) {
    const $btn = toggleButtons[index];
    if (status || status === `on`) {
        //console.log(`match - on`);
        $btn.data(`status`, `on`);
        $btn.text(`On`);
        $btn.removeClass(`btn-secondary`)
        $btn.addClass(`btn-primary`)
    } else {
        //console.log(`match - off`);
        $btn.data(`status`, `off`);
        $btn.text(`Off`);
        $btn.removeClass(`btn-primary`)
        $btn.addClass(`btn-secondary`)
    }
    // update display
    canvasUtils.setBBoxOpacity(index, status, runFlag);
}

function updateDeselectAllButton(table) {
    const count = table.rows({ selected: true }).count();
    const all = table.rows().count();

    if (count === all) {
        $(`#deselect-all`).prop(`disabled`, false).addClass(`btn-primary`).removeClass(`btn-secondary`);
        $(`#select-all`).prop(`disabled`, true).removeClass(`btn-primary`).addClass(`btn-secondary`);
     } else if (count > 0) {
        $(`#deselect-all`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
        $(`#select-all`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
    } else {
        $(`#deselect-all`).prop(`disabled`, true).addClass(`btn-secondary`).removeClass(`btn-primary`);
        $(`#select-all`).prop(`disabled`, false).removeClass(`btn-secondary`).addClass(`btn-primary`);
    }
}

// run this when all page is ready.

$(document).ready(function () {
    let runFlag = false;

    // set action for zoom buttons

    $(`#zoom-in`).on(`click`, function () {
        var zoom = canvas.getZoom();
        //zoom *= 0.999 ** (-50);
        zoom += 0.1;
        canvasUtils.zoom(zoom, runFlag);
        this.blur();
    });

    $(`#zoom-out`).on(`click`, function () {
        var zoom = canvas.getZoom();
        //zoom *= 0.999 ** (50);
        zoom -= 0.1;
        canvasUtils.zoom(zoom, runFlag);
        this.blur();
    });

    $(`#zoom-one`).on(`click`, function () {
        canvasUtils.zoom(1.0, runFlag);
        this.blur();
    });

    $(`#zoom-all`).on(`click`, function () {
        canvasUtils.zoom(canvasUtils.allZoom(), runFlag);
        this.blur();
    });

    $(`#zoom-to-fit`).on(`click`, function () {
        canvasUtils.zoom(canvasUtils.toFitZoom(), runFlag);
        this.blur();
    });
    
    $(`#zoom-range`).on(`input`, function (event) {
        var zoom = parseFloat($(this).val());
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();

        canvas.zoomToPoint({ x: width / 2, y: height / 2 }, zoom);
        canvasUtils.validateImagePosition();
        canvasUtils.updateZoomButtons(zoom, runFlag);
        canvas.renderAll();
    });
    
    $(`#zoom-range`).on(`mouse:up`, function () {
        this.blur();
    });

    // Event handler for canvas

    canvas.on(`mouse:wheel`, function (opt) {
        if (runFlag) {
            const delta = opt.e.deltaY;
            var zoom = canvas.getZoom();
            //zoom *= 0.999 ** delta;
            zoom -= 0.1 / 4 * delta;
            zoom = Math.min(zoom, canvasUtils.maxZoom());
            zoom = Math.max(zoom, canvasUtils.minZoom());
            console.log(opt.e.offsetX, opt.e.offsetY);
            canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
            canvasUtils.validateImagePosition();
            canvasUtils.updateZoomButtons(zoom, runFlag);
            opt.e.preventDefault();
            opt.e.stopPropagation();
        }
    });

    canvas.on(`mouse:down`, function (opt) {
        const evt = opt.e;
        if (evt.altKey === true) {
            this.selection = true;
            this.isDragging = false;
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
        } else {
            this.isDragging = true;
            this.selection = false;
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
        }
    });

    canvas.on(`mouse:move`, function (opt) {
        if (this.isDragging) {
            const evt = opt.e;
            const vpt = this.viewportTransform;
            canvasUtils.validateImagePosition(vpt[4] + evt.clientX - this.lastPosX, vpt[5] + evt.clientY - this.lastPosY);
            this.requestRenderAll();
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
        }
    });

    canvas.on(`mouse:up`, function (opt) {
        // on mouse up we want to recalculate new interaction
        // for all objects, so we call setViewportTransform
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
    });

    // Set up DataTable

    const table = new DataTable(`#output-table`, {
        dom: `lBfrtip`,
        order: 1,
        // set column width
        columnDefs: [
            {
                width: `60px`,
                searchable: false,
                orderable: false,
                targets: [0, 5],
            },
            { width: `60px`, targets: 1 },
        ],
        select: {
            style: `multi`
        },
    });

    // Create tree view --------------------------------------------------------

    function getTree() {
        // get data from category_id and json_data
        // category_id = { id: 0, desc: `name`, count: 0 }
        // jsonData contain all data in table
        var data = [];
        var child_nodes = [];

        for (var j = 0; j < jsonData.length; j++) {
            //console.log(j, jsonData[j].Id, jsonData[j].Text);
            const categoryId = jsonData[j].CategoryID;

            if (!child_nodes[categoryId]) {
                //console.log(`create new child_node`);
                child_nodes[categoryId] = { nodes: [] };
            }

            child_nodes[categoryId].nodes.push({
                tags: [jsonData[j].Index.toString()],
                text: jsonData[j].Object + `, ` + jsonData[j].Text,
                state: { checked: false, },
            });
            //console.log(child_nodes)
        }
        //console.log(child_nodes)
        for (var i = 0; i < categoryData.length; i++) {
            const category_name = categoryData[i].desc;
            const id = categoryData[i].id
            const child_node = child_nodes[id].nodes;
            const child_count = child_node.length;

            data.push({
                text: `Class : ` + id + ` - ` + category_name + ` (` + child_count + `)`,
                state: {
                    checked: false,
                    expanded: false,
                },
                nodes: child_node,
                tags: [child_count.toString()],
            })
        }
        return data;
    }

    $(`#tree`).treeview({
        data: getTree(),
        checkedIcon: `fas fa-check-square`,
        uncheckedIcon: `far fa-square`,
        expandIcon: `fa fa-angle-right`,
        collapseIcon: `fa fa-angle-down`,
        showCheckbox: true,
        showTags: false,
    });

    // Get all node from treeview to save the node list
    var treeNodes = [];
    const allNode = $(`#tree`).treeview(`getEnabled`);

    for (let i = 0; i < allNode.length; i++) {
        const node = allNode[i];
        const children = node.nodes;

        if (!children) {
            treeNodes.push(node);
        }
    }

    $(`#tree`).on(`nodeChecked`, function (event, data) {
        // If there is children then select all children.
        const children = data.nodes;
        if (children) {
            //console.log(data.nodes);
            for (var i = 0; i < children.length; i++) {
                const node = children[i];
                if (!node.state[`checked`]) {
                    $(`#tree`).treeview(`checkNode`, [node.nodeId, { silent: true }]);
                    toggleOnOffButton(Number(node.tags[0]) - 1, toggleButtons, true, runFlag);
                }
            }
        } else {
            // check the parent if all children is checked then parent should be checked.
            const parent = $(`#tree`).treeview(`getParent`, data.nodeId);
            //console.log(data.nodeId, parent);
            //
            let siblings = $(`#tree`).treeview(`getSiblings`, data.nodeId);
            let checked_count = 0;
            siblings.push(data);

            for (let i = 0; i < siblings.length; i++) {
                if (siblings[i].state[`checked`]) {
                    checked_count++;
                }
            }
            if (checked_count === siblings.length) {
                $(`#tree`).treeview(`checkNode`, [parent.nodeId, { silent: true }]);
            }
            toggleOnOffButton(Number(data.tags[0]) - 1, toggleButtons, true, runFlag);
        }
        updateOnOffMaster(toggleButtons);
    });
    
    $(`#tree`).on(`nodeUnchecked`, function (event, data) {
        const children = data.nodes;
        if (children) {
            //console.log(data.nodes);
            for (var i = 0; i < children.length; i++) {
                const node = children[i];
                $(`#tree`).treeview(`uncheckNode`, [node.nodeId, { silent: true }]);
                toggleOnOffButton(Number(node.tags[0]) - 1, toggleButtons, false, runFlag);
            }
        } else {
            // uncheck parent
            const parent = $(`#tree`).treeview(`getParent`, data.nodeId);
            $(`#tree`).treeview(`uncheckNode`, [parent.nodeId, { silent: true }]);
            toggleOnOffButton(Number(data.tags[0]) - 1, toggleButtons, false, runFlag);
        }
        updateOnOffMaster(toggleButtons);
    });

    // toggle-on/off btn
    let toggleButtons = [];

    table.rows().every(function () {
        const $row = $(this.node());
        const $btn = $row.find(`.toggle-btn`);
        toggleButtons.push($btn);
    });

    table.on(`click`, `.toggle-btn`, function (event) {
        event.stopPropagation(); // Prevent row selection

        const $btn = $(this);
        const currentStatus = $btn.data(`status`) === `on`;
        const index = Number($btn.data(`index`)) - 1;
        // Toggle the status and update botton text
        if (!currentStatus) {
            $btn.data(`status`, `on`);
            $btn.text(`On`);
            $btn.removeClass(`btn-secondary`)
            $btn.addClass(`btn-primary`)
        } else {
            $btn.data(`status`, `off`);
            $btn.text(`Off`);
            $btn.removeClass(`btn-primary`)
            $btn.addClass(`btn-secondary`)
        }
        //
        updateTreeView(index, toggleButtons, treeNodes);
        canvasUtils.setBBoxOpacity(index, !currentStatus, runFlag);
        updateOnOffMaster(toggleButtons);
        this.blur();
    });

    table.on(`click`, `.zoom-to-btn`, function (event) {
        event.stopPropagation(); // Prevent row selection

        if (!runFlag) {
            this.blur();
            return;
        };

        const $btn = $(this);
        const index = Number($btn.data(`index`)) - 1;
        // Set zoom to actual size
        canvasUtils.allZoom();
        canvasUtils.zoom(1.0, runFlag);
        //
        const item = jsonData[index];
        const left = item.Left;
        const top = item.Top;
        const width = item.Width;
        const height = item.Height;

        const x = $(`#canvas-container`).width() / 2 - (left + width / 2); //ctnWidth / 2 - boxX;
        const y = $(`#canvas-container`).height() / 2 - (top + height / 2); //ctnHeight / 2 - boxY;

        canvasUtils.validateImagePosition(x, y);
        canvasUtils.updateZoomButtons(1, runFlag);
        this.blur();
        // Animate red box
        // Create a red rectangle
        const rect = new fabric.Rect({
            left: left + width / 2,
            top: top + height / 2,
            originX: `center`,
            originY: `center`,
            fill: `rgba(0,0,0,0)`,
            stroke: `red`,
            strokeWidth: 3,
            width: width,
            height: height,
            opacity: 1.0,
        });

        console.log(rect);
        //console.log(canvas.getObjects().length);
        canvas.add(rect);
        //console.log(canvas.getObjects().length);
        canvas.renderAll();
        
        const duration = 500;
        const scaleX = 1.25;
        const scaleY = 1.25;
        rect.animate('scaleX', scaleX, {
            onChange: canvas.renderAll.bind(canvas),
            duration: duration,
            easing: fabric.util.ease.easeInOutQuad,
            onComplete: function() {
                rect.animate('scaleX', 1, {
                    onChange: canvas.renderAll.bind(canvas),
                    duration: duration,
                    easing: fabric.util.ease.easeInOutQuad,
                });
            }
        });

        rect.animate('scaleY', scaleY, {
            onChange: canvas.renderAll.bind(canvas),
            duration: duration,
            easing: fabric.util.ease.easeInOutQuad,
            onComplete: function() {
                rect.animate('scaleY', 1, {
                    onChange: canvas.renderAll.bind(canvas),
                    duration: duration,
                    easing: fabric.util.ease.easeInOutQuad,
                    onComplete: blink,
                });
            }
        });

        // Add blinking effect
        function blink() {
            const objs = canvas.getObjects();
            const rect = objs[objs.length - 1];
            rect.animate('opacity', 0, {
                onChange: canvas.renderAll.bind(canvas),
                duration: 200,
                onComplete: function() {
                    rect.animate('opacity', 1, {
                        onChange: canvas.renderAll.bind(canvas),
                        duration: 200,
                        onComplete: removeRect,
                    });
                }
            });
        }

        function removeRect() {
            const objs = canvas.getObjects();
            const rect = objs[objs.length - 1];
            canvas.remove(rect);
        };
    });

    // Master toggle button functionality
    $(`#master-toggle`).on(`click`, function () {
        const $masterBtn = $(this);
        const masterStatus = $masterBtn.data(`status`) === `on`;

        // Toggle the master button status and update text
        if (!masterStatus) {
            toggleMasterOnOffBBoxButton(0);
            // Toggle all rows to on
            table.rows().every(function () {
                const $row = $(this.node());
                const $btn = $row.find(`.toggle-btn`);

                $btn.data(`status`, `on`);
                $btn.text(`On`);
                $btn.removeClass(`btn-secondary`).addClass(`btn-primary`);
            });
        } else {
            toggleMasterOnOffBBoxButton(1);
            // Toggle all rows to off
            table.rows().every(function () {
                const $row = $(this.node());
                const $btn = $row.find(`.toggle-btn`);

                $btn.data(`status`, `off`);
                $btn.text(`Off`);
                $btn.removeClass(`btn-primary`).addClass(`btn-secondary`);
            });
        }

        for (let i = 0; i < toggleButtons.length; i++) {
            updateTreeView(i, toggleButtons, treeNodes)
            canvasUtils.setBBoxOpacity(i, !masterStatus, runFlag);
        }
        this.blur();
    });

    $(`#deselect-all`).on(`click`, function () {
        table.rows().deselect();
        this.blur();
    });

    $(`#select-all`).on(`click`, function () {
        table.rows().select();
        this.blur();
    });

    // display overlay when row is selected
    table
        .on(`select`, function (e, dt, type, indexes) {
            //let rowData = table.rows(indexes).data().toArray();
            const selected_rows = table.rows(`.selected`)[0];

            canvasUtils.displayOverlay(selected_rows, runFlag);
            // update Deselect All button
            updateDeselectAllButton(table);
            //console.log(`<b>` + type + ` selection</b> - ` + JSON.stringify(rowData));
        })
        .on(`deselect`, function (e, dt, type, indexes) {
            //let rowData = table.rows(indexes).data().toArray();
            const selected_rows = table.rows(`.selected`)[0];

            canvasUtils.displayOverlay(selected_rows, runFlag);
            // update Deselect All button
            updateDeselectAllButton(table);
            //console.log(`<b>` + type + ` <i>de</i>selection</b> - ` + JSON.stringify(rowData));
        });
    
    // Correct the height of the table on last page by adding empty rows
    
    table.on('draw', function () {
        var info = table.page.info(),
            rowsOnPage = info.end - info.start,
            missingRowsOnPage = info.length - rowsOnPage;
        
        if (missingRowsOnPage > 0) {
            for (var i = 0; i < missingRowsOnPage; i++) {
                $(table.body()).append(buildEmptyRow(6));
            }
        }
    });

    function buildEmptyRow(columnsCount) {
        return `<tr class="">` + Array(columnsCount + 1).join(`<td class""><div class=""><button class="btn btn-sm small tiny-font btn-outline-light"">&nbsp;</button></div></td>`) + `</tr>`;
    }    

    // Get reference to select model_type
    const modelSelect = $(`select#selected_model`);
    const weightContainer = $(`div#weight-path-container`);
    const configContainer = $(`div#config-path-container`);
    const textOCRContainer = $(`div#textOCR-container`);

    // hide and unhide form depends on selected model_type

    modelSelect.on(`change`, function () {
        const selectedValue = $(this).val();
        // Enable all dependent select
        if (selectedValue == `yolov8`) {
            weightContainer.slideDown();
            configContainer.slideDown();
            //textOCRContainer.slideUp();
        } else if (selectedValue == `easyocr`) {
            weightContainer.slideUp();
            configContainer.slideUp();
            //textOCRContainer.slideDown();
        }
    });

    // handler for file change

    const fileInput = $(`#file-input`);

    fileInput.on(`change`, function () {
        const selectedFile = $(this).val();

        if (selectedFile) {
            $(`#submit`)
                .prop(`disabled`, false)
                .removeClass(`btn-secondary`)
                .addClass(`btn-primary`);
        } else {
            $(`#submit`)
                .prop(`disabled`, true)
                .removeClass(`btn-primary`)
                .addClass(`btn-secondary`);
        }
    });
    //
    // submitButton event
    // Note: 11 Sep 2024
    //       for some reason the post method stop working, so I have to change
    //       the post sequence by adding new onsubmit function.
    //
    $(`#submit`).on(`click`, function (event) {
        //event.preventDefault();
        //alert(`Continue detecting symbols.`);
        $(`#main-container`).waitMe({
            effect: `win8_linear`,
            text: `Please wait...`,
        });
        // sumbit form to FastAPI
        $(`#main-form`).submit();
    });

    $(`#main-form`).onsubmit = async (event) => {
        let res = await fetch(`/submit`, {
            method: `POST`,
            body: new FormData($(`#main-form`)),
        });

        // Stop other thread
        event.preventDefault();

        if (res.ok) {
            let result = await res.text();
            document.innerHTML = result;
        } else {
            document.innerHTML = `Response error:`, res.status;
        }
    };
    //
    // Event handling when image is loaded
    //
    $(`#output-image`)
        .one(`load`, function () {
            //console.log(`Image has finished loading. (one)`);
        })
        .each(function () {
            if (this.complete) {
                // image is finished loading
                //console.log(`Image has finished loading. (this.complete)`);
                runFlag =  canvasUtils.onImageLoad(this);
            }
        })
        .on(`load`, function () {
            // image is finished loading
            //console.log(`Image has finished loading. (on.load)`);
            runFlag = canvasUtils.onImageLoad(this);
        });
    //
    // Auto adjust grid container height when window change size
    //
    var savedHeight = 0;
    var savedWidth = 0;

    function adjustGridContainerHeight() {
        const windowHeight = $(window).height();
        const gridContainer = $(`#grid-container`);
        const canvasContainer = $(`div#canvas-container`);
        // Calculate the available height for the grid container
        const containerHeight = Math.max(500, windowHeight - gridContainer.offset().top);
        // determine current zoom stage
        // 0 = zoom all
        // 1 = zoom to fit
        // -1 not above
        let zoomStage = canvas.getZoom() === canvasUtils.allZoom() ? 0 : -1;
        zoomStage = canvas.getZoom() === canvasUtils.toFitZoom() ? 1 : zoomStage;

        // Set the hegiht of the grid container
        gridContainer.height(containerHeight);
        // Save the height difference for the future adjustments
        if (!savedHeight) {
            savedHeight = containerHeight - canvasContainer.height();
        }
        if (!savedWidth) {
            savedWidth = gridContainer.width() - canvasContainer.width();
        }
        // Adjust the canvas container hegiht based on teh save height difference
        const canvasHeight = containerHeight - savedHeight;
        const canvasWidth = gridContainer.width() - savedWidth;

        canvasContainer.height(canvasHeight);
        canvasContainer.width(canvasWidth);
        // set the canvas to new size
        canvas.setHeight(canvasHeight);
        canvas.setWidth(canvasWidth);
        canvas.calcOffset();

        // reset zoom
        switch (zoomStage) {
            case 0:
                canvasUtils.zoom(canvasUtils.allZoom(), runFlag);
                break;
            case 1:
                canvasUtils.zoom(canvasUtils.toFitZoom(), runFlag);
                break;
            default:
                canvasUtils.validateImagePosition();
                break;
        }
    }

    // Attach the resize event listener
    $(window).on(`resize`, adjustGridContainerHeight);

    // Call the function initially
    adjustGridContainerHeight();

    canvasUtils.zoom(canvasUtils.minZoom(), runFlag);
    updateDeselectAllButton(table);

    for (let i = 0; i < toggleButtons.length; i++) {
        updateTreeView(i, toggleButtons, treeNodes)
    }
    
    //console.log(`jQuery finished.`);
});
