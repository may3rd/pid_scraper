// -----------------------------------------------------------------------------
// Start JQuery code
// -----------------------------------------------------------------------------

var image_height = 100;
var image_width = 100;
var previous_selected_rows = 0;

const canvas = new fabric.Canvas(`canvas`);
canvas.selection = false; // disable group selection

// define utlities for canvas displaying

const canvasUtils = {
    // Constants
    maxZoom: function () { return 5.0; },
    minZoom: function () {
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();

        return Math.max(width / image_width, height / image_height);;
    },

    // zoom canvas to input value
    updateZoomButtons: function (zoom) {
        const minZoom = canvasUtils.minZoom();
        const maxZoom = canvasUtils.maxZoom();

        if (zoom === minZoom) {
            // disable zoom out and reset button
            $(`#zoom-in`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-out`).addClass(`disabled`).addClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-reset`).addClass(`disabled`).addClass(`btn-secondary`).addClass(`disabtn-primarybled`);
        } else if (zoom === maxZoom) {
            // disable zoom in button
            $(`#zoom-in`).addClass(`disabled`).addClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-out`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-reset`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
        } else {
            // enable all zoom buttons
            $(`#zoom-in`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-out`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
            $(`#zoom-reset`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
        }

        document.getElementById(`zoom-range`).min = minZoom;
        document.getElementById(`zoom-range`).max = maxZoom;
        document.getElementById(`zoom-range`).step = (maxZoom - minZoom) / 100;
    },

    zoom: function (zoom) {
        //var zoom = canvas.getZoom();
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();
        //zoom *= 0.999 ** factor;
        zoom = Math.min(zoom, this.maxZoom());
        zoom = Math.max(zoom, this.minZoom());
        canvas.zoomToPoint({ x: width / 2, y: height / 2 }, zoom);
        $(`#zoom-range`).val(zoom);
        // update zoom buttons
        this.updateZoomButtons(zoom);
        canvas.renderAll();
    },

    // reset canvas zoom to fit container width

    resetZoom: function () {
        var vpt = canvas.viewportTransform;
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();

        zoom = this.minZoom();
        originalX = Math.floor((width - image_width * zoom) / 2);
        originalY = Math.floor((height - image_height * zoom) / 2);
        vpt[4] = 0;
        vpt[5] = 0;
        $(`#zoom-range`).val(zoom);
        canvas.setZoom(zoom);
        canvas.calcOffset();
        canvas.renderAll();
        this.updateZoomButtons(zoom);
    },

    // adding image and bounding box from inference model to canves

    addItemsToCanvas: function (image) {
        const buttons = $(`div#zoom-btn-container button`);

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

        // enable zoom buttons
        buttons
            .prop(`disabled`, false)
            .removeClass(`btn-secondary`)
            .addClass(`btn-primary`);

        // get image to be added in canvas
        const canvasImg = new fabric.Image(image);
        canvasImg.set(`selectable`, false);

        // save image width and hight
        image_width = canvasImg.width;
        image_height = canvasImg.height;

        canvas.add(canvasImg);
        // for each item in jsonData, add bbox to canvas
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
            canvas.add(box);
        });

        // reset zoom
        canvasUtils.resetZoom();
    },

    // Event handlers

    onImageLoad: function (image) {
        // image is finished loading
        const imageSrc = $(image).attr(`src`);

        if (imageSrc.slice(-15) !== `gcmethumb-3.png`) {
            this.addItemsToCanvas(image);
        } else {
            canvasImg = new fabric.Image(image);
            canvasImg.set(`selectable`, false);

            image_width = canvasImg.width;
            image_height = canvasImg.height;

            canvas.add(canvasImg);
            canvasUtils.resetZoom();
        }
    },

    // Create overlay display when row is selected

    displayOverlay: function (selectd_rows) {
        // TODO
        if (previous_selected_rows > 0) {
            // remove last object
            const objects = canvas.getObjects();
            const rect = objects[objects.length - 1];

            canvas.remove(rect);
            objects.forEach((index, rect) => {
                if (index > 0) {
                    rect.opacity = 0.0;
                }
            });
        }

        if (selectd_rows.length > 0) {
            // Create new rectangle to cover all image
            const rect = new fabric.Rect({
                left: 0,
                top: 0,
                fill: `black`,
                width: image_width,
                height: image_height,
                opacity: 0.3,
                selectable: false,
            });

            var clipPaths = [];

            // create clipPaths from selected_rows
            selectd_rows.forEach((idx) => {
                item = jsonData[idx];
                const box = new fabric.Rect({
                    left: item.Left - image_width / 2,
                    top: item.Top - image_height / 2,
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
        previous_selected_rows = selectd_rows.length;
        canvas.renderAll();
    },

    // draw box on button On/Off status
    displayBBX(table) {
        var onRows = [];

        table.rows().every(function () {
            const $row = $(this.node());
            const $btn = $row.find(`.toggle-btn`);
            const itemNo = this.data()[1];

            if ($btn.data(`status`) === `on`) {
                onRows.push(Number(itemNo));
            }
        });

        //console.log(`onRows = `, onRows);

        // Further processing with onRows
        const objects = canvas.getObjects();

        const last_index = objects.length;

        if (previous_selected_rows > 0) {
            last_index = last_index - 1;
        }

        for (let i = 1; i < last_index; i++) {
            objects[i].opacity = 0.0;
        }
        try {
            onRows.forEach((value) => {
                objects[value].opacity = 1.0;
            });
        } catch (err) { }

        canvas.renderAll();
    },
};

function updateTreeView(index, toggleButtons, treeNodes, table) {
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

    // update display
    canvasUtils.displayBBX(table);
}

function updateOnOffMaster(table) {
    // check btn status again for master button
    var btnStatus = [];
    var off_status_count = 0;

    table.rows().every(function () {
        const $row = $(this.node());
        const $btn = $row.find(`.toggle-btn`);
        btnStatus.push($btn.data(`status`))
    });

    for (var i = 0; i < btnStatus.length; i++) {
        if (btnStatus[i] === `off`) {
            off_status_count++;   // break loop if any is on
        }
    }

    if (off_status_count === 0) {
        // change master toggle button to Show all
        $(`#master-toggle`).data(`status`, `on`);
        $(`#master-toggle`).text(`Hide all`);
    } else {
        $(`#master-toggle`).data(`status`, `off`);
        $(`#master-toggle`).text(`Show all`);
    }
}

function updateOnOffButton(data, toggleButtons, table, status) {
    const tree_index = Number(data.tags[0]);
    const $btn = toggleButtons[tree_index - 1];
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
    canvasUtils.displayBBX(table);
}

function updateDeselectAllButton(table) {
    const count = table.rows({ selected: true }).count();

    if (count > 0) {
        $(`#deselect-all`).removeClass(`disabled`).removeClass(`btn-secondary`).addClass(`btn-primary`);
    } else {
        $(`#deselect-all`).addClass(`disabled`).addClass(`btn-secondary`).removeClass(`btn-primary`);
    }
}

// run this when all page is ready.

$(document).ready(function () {
    const zoomInButton = $(`#zoom-in`);
    const zoomOutButton = $(`#zoom-out`);
    const zoomResetButton = $(`#zoom-reset`);
    const zoomRange = $(`#zoom-range`);
    const submitButton = $(`#submit`);

    // set action for zoom buttons
    zoomRange.max = canvasUtils.maxZoom();

    zoomInButton.on(`click`, function () {
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** (-50);
        canvasUtils.zoom(zoom);
    });

    zoomOutButton.on(`click`, function () {
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** (50);
        canvasUtils.zoom(zoom);
    });

    zoomResetButton.on(`click`, function () {
        canvasUtils.resetZoom();
    });

    zoomRange.on(`input`, function (event) {
        var zoom = parseFloat($(this).val());
        const container = $(`#canvas-container`);
        const width = container.width();
        const height = container.height();

        zoom = Math.min(zoom, canvasUtils.maxZoom());
        zoom = Math.max(zoom, canvasUtils.minZoom());
        canvas.zoomToPoint({ x: width / 2, y: height / 2 }, zoom);
        $(this).val(zoom);
        canvasUtils.updateZoomButtons(zoom);
        canvas.renderAll();
    });

    // Event handler for canvas

    canvas.on(`mouse:wheel`, function (opt) {
        const delta = opt.e.deltaY;
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(zoom, canvasUtils.maxZoom());
        zoom = Math.max(zoom, canvasUtils.minZoom());
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        zoomRange.val(zoom);
        //
        const vpt = this.viewportTransform;

        // Calculate the maximum allowed values
        const maxLeft = 0;
        const maxTop = 0;
        const maxRight = -(image_width * canvas.getZoom() - canvas.width);
        const maxBottom = - (image_height * canvas.getZoom() - canvas.height);

        // Adjust left and top values to stay within the limits
        vpt[4] = Math.max(Math.min(vpt[4], maxLeft), maxRight);
        vpt[5] = Math.max(Math.min(vpt[5], maxTop), maxBottom);

        opt.e.preventDefault();
        opt.e.stopPropagation();
        canvasUtils.updateZoomButtons(zoom);
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

            // Calculate the maximum allowed values
            const maxLeft = 0;
            const maxTop = 0;
            const maxRight = -(image_width * canvas.getZoom() - canvas.width);
            const maxBottom = - (image_height * canvas.getZoom() - canvas.height);

            // Adjust left and top values to stay within the limits
            vpt[4] = Math.max(Math.min(vpt[4] + evt.clientX - this.lastPosX, maxLeft), maxRight);
            vpt[5] = Math.max(Math.min(vpt[5] + evt.clientY - this.lastPosY, maxTop), maxBottom);

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

    let table = new DataTable(`#output-table`, {
        dom: `lBfrtip`,
        order: 1,
        // set column width
        columnDefs: [
            {
                width: `60px`,
                searchable: false,
                orderable: false,
                targets: [0],
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
                    updateOnOffButton(node, toggleButtons, table, true);
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
            updateOnOffButton(data, toggleButtons, table, true);
        }
        updateOnOffMaster(table);
    }).on(`nodeUnchecked`, function (event, data) {
        const children = data.nodes;
        if (children) {
            //console.log(data.nodes);
            for (var i = 0; i < children.length; i++) {
                const node = children[i];
                $(`#tree`).treeview(`uncheckNode`, [node.nodeId, { silent: true }]);
                updateOnOffButton(node, toggleButtons, table, false);
            }
        } else {
            // uncheck parent
            const parent = $(`#tree`).treeview(`getParent`, data.nodeId);
            $(`#tree`).treeview(`uncheckNode`, [parent.nodeId, { silent: true }]);
            updateOnOffButton(data, toggleButtons, table, false);
        }
        updateOnOffMaster(table);
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
        const currentStatus = $btn.data(`status`);
        const index = Number($btn.data(`index`)) - 1;
        // Toggle the status and update botton text
        if (currentStatus == `off`) {
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
        updateTreeView(index, toggleButtons, treeNodes, table)
        updateOnOffMaster(table);
    });

    // Master toggle button functionality
    $(`#master-toggle`).on(`click`, function () {
        const $masterBtn = $(this);
        const masterStatus = $masterBtn.data(`status`);

        // Toggle the master button status and update text
        if (masterStatus === `off`) {
            $masterBtn.data(`status`, `on`);
            $masterBtn.text(`Hide all`);
            // Toggle all rows to on
            table.rows().every(function () {
                const $row = $(this.node());
                const $btn = $row.find(`.toggle-btn`);

                $btn.data(`status`, `on`);
                $btn.text(`On`);
                $btn.removeClass(`btn-secondary`).addClass(`btn-primary`)
            });
        } else {
            $masterBtn.data(`status`, `off`);
            $masterBtn.text(`Show all`);

            // Toggle all rows to off
            table.rows().every(function () {
                const $row = $(this.node());
                const $btn = $row.find(`.toggle-btn`);

                $btn.data(`status`, `off`);
                $btn.text(`Off`);
                $btn.removeClass(`btn-primary`).addClass(`btn-secondary`)
            });
        }

        for (let i = 0; i < toggleButtons.length; i++) {
            updateTreeView(i, toggleButtons, treeNodes, table)
        }
    });

    $(`#deselect-all`).on(`click`, function () {
        table.rows().deselect();
    });

    // display overlay when row is selected
    table
        .on(`select`, function (e, dt, type, indexes) {
            //let rowData = table.rows(indexes).data().toArray();
            let selected_rows = table.rows(`.selected`)[0];

            canvasUtils.displayOverlay(selected_rows);
            canvas.renderAll();

            // update Deselect All button
            updateDeselectAllButton(table);
            //console.log(`<b>` + type + ` selection</b> - ` + JSON.stringify(rowData));
        })
        .on(`deselect`, function (e, dt, type, indexes) {
            //let rowData = table.rows(indexes).data().toArray();
            let selected_rows = table.rows(`.selected`)[0];

            canvasUtils.displayOverlay(selected_rows);
            canvas.renderAll();

            // update Deselect All button
            updateDeselectAllButton(table);
            //console.log(`<b>` + type + ` <i>de</i>selection</b> - ` + JSON.stringify(rowData));
        });

    //updateCategoryCheckboxes(chkCategories, table);

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
            submitButton
                .prop(`disabled`, false)
                .removeClass(`btn-secondary`)
                .addClass(`btn-primary`);
        } else {
            submitButton
                .prop(`disabled`, true)
                .removeClass(`btn-primary`)
                .addClass(`btn-secondary`);
        }
    });

    // submitButton event
    // Note: 11 Sep 2024
    //       for some reason the post method stop working, so I have to change
    //       the post sequence by adding new onsubmit function.
    //h
    submitButton.on(`click`, function (event) {
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

    $(`#output-image`)
        .one(`load`, function () {
            //console.log(`Image has finished loading. (one)`);
        })
        .each(function () {
            if (this.complete) {
                // image is finished loading
                //console.log(`Image has finished loading. (this.complete)`);
                canvasUtils.onImageLoad(this);
                canvasUtils.resetZoom();
            }
        })
        .on(`load`, function () {
            // image is finished loading
            //console.log(`Image has finished loading. (on.load)`);
            canvasUtils.onImageLoad(this);
            canvasUtils.resetZoom();
        });

    // Auto adjust grid container height when window change size
    var savedHeight = 0;
    var savedWidth = 0;

    function adjustGridContainerHeight() {
        const windowHeight = $(window).height();
        const gridContainer = $(`#grid-container`);
        const canvasContainer = $(`div#canvas-container`);
        // Calculate the available height for the grid container
        const containerHeight = Math.max(500, windowHeight - gridContainer.offset().top);
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
        $(`div#zoom-menu-container`).width(canvasWidth);
        $(`div#table-container`).width(canvasWidth);
        // set the canvas to new size
        canvas.setWidth(100);
        canvas.setHeight(canvasHeight);
        canvas.setWidth(canvasWidth);
        canvas.calcOffset();
        canvasUtils.resetZoom();
    }

    // Attach the resize event listener
    $(window).on(`resize`, adjustGridContainerHeight);

    // Call the function initially
    adjustGridContainerHeight();

    // for some reason resetZoom() need to be called twice.
    canvasUtils.resetZoom();
    canvas.renderAll();

    for (let i = 0; i < toggleButtons.length; i++) {
        updateTreeView(i, toggleButtons, treeNodes, table)
    }
    
    //console.log(`jQuery finished.`);
});
