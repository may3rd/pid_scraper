// -----------------------------------------------------------------------------
// Start JQuery code
// -----------------------------------------------------------------------------


var previous_selected_rows = 0;
var canvas = new fabric.Canvas("canvas");

canvas.selection = false; // disable group selection

var image_height = 100;
var image_width = 100;

// define utlities for canvas displaying

var canvasUtils = {
    // Constants
    maxZoom: function () { return 5.0; },
    minZoom: function () {
        const container = $("#canvas-container");
        const width = container.width();
        const height = container.height();

        return Math.max(width / image_width, height / image_height);;
    },

    // Functions

    // zoom canvas to input value
    updateZoomButtons: function (zoom) {
        if (zoom === canvasUtils.minZoom()) {
            // disable zoom out and reset button
            $('#zoom-in').removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
            $("#zoom-out").addClass('disabled').addClass('btn-secondary').addClass('btn-primary');
            $("#zoom-reset").addClass('disabled').addClass('btn-secondary').addClass('disabtn-primarybled');
        } else if (zoom === canvasUtils.maxZoom()) {
            // disable zoom in button
            $('#zoom-in').addClass('disabled').addClass('btn-secondary').addClass('btn-primary');
            $("#zoom-out").removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
            $("#zoom-reset").removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
        } else {
            // enable all zoom buttons
            $('#zoom-in').removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
            $("#zoom-out").removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
            $("#zoom-reset").removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
        }

        const minZoom = canvasUtils.minZoom();
        const maxZoom = canvasUtils.maxZoom();
        document.getElementById('zoom-range').min = minZoom;
        document.getElementById('zoom-range').max = maxZoom;
        document.getElementById('zoom-range').step = (maxZoom - minZoom) / 100;
    },

    zoom: function (zoom) {
        //var zoom = canvas.getZoom();
        const container = $("#canvas-container");
        const width = container.width();
        const height = container.height();

        //zoom *= 0.999 ** factor;
        zoom = Math.min(zoom, this.maxZoom());
        zoom = Math.max(zoom, this.minZoom());
        canvas.zoomToPoint({ x: width / 2, y: height / 2 }, zoom);
        $("#zoom-range").val(zoom);

        // update zoom buttons
        this.updateZoomButtons(zoom);

        canvas.renderAll();
    },

    // reset canvas zoom to fit container width

    resetZoom: function () {
        var vpt = canvas.viewportTransform;
        const container = $("#canvas-container");
        const width = container.width();
        const height = container.height();

        zoom = this.minZoom();

        originalX = Math.floor((width - image_width * zoom) / 2);
        originalY = Math.floor((height - image_height * zoom) / 2);

        vpt[4] = 0;
        vpt[5] = 0;

        $("#zoom-range").val(zoom);

        canvas.setZoom(zoom);
        canvas.calcOffset();
        canvas.renderAll();

        this.updateZoomButtons(zoom);
    },

    // adding image and bounding box from inference model to canves

    addItemsToCanvas: function (image) {
        var buttons = $("div#zoom-btn-container button");

        const hex = [
            "#FF3838",
            "#2C99A8",
            "#FF701F",
            "#6473FF",
            "#CFD231",
            "#48F90A",
            "#92CC17",
            "#3DDB86",
            "#1A9334",
            "#00D4BB",
            "#FF9D97",
            "#00C2FF",
            "#344593",
            "#FFB21D",
            "#0018EC",
            "#8438FF",
            "#520085",
            "#CB38FF",
            "#FF95C8",
            "#FF37C7"
        ];

        // enable zoom buttons
        buttons
            .prop("disabled", false)
            .removeClass("btn-secondary")
            .addClass("btn-primary");

        // get image to be added in canvas
        const canvasImg = new fabric.Image(image);
        canvasImg.set("selectable", false);

        // save image width and hight
        image_width = canvasImg.width;
        image_height = canvasImg.height;

        canvas.add(canvasImg);

        // for each item in jsonData, add bbox to canvas
        jsonData.forEach((item) => {

            var box = new fabric.Rect({
                left: item.Left,
                top: item.Top,
                fill: "rgba(0,0,0,0)",
                stroke: hex[item.CategoryID % hex.length],
                strokeWidth: 3,
                width: item.Width,
                height: item.Height,
                selectable: false,
                opacity: 1.0,
            });
            //console.log("Add box to canvas", item.index, hex[item.CategoryID % hex.length]);
            canvas.add(box);
        });

        // reset zoom
        canvasUtils.resetZoom();
    },

    // Event handlers

    onImageLoad: function (image) {
        // image is finished loading

        var imageSrc = $(image).attr("src");

        if (imageSrc.slice(-15) !== "gcmethumb-3.png") {
            this.addItemsToCanvas(image);
        } else {
            canvasImg = new fabric.Image(image);
            canvasImg.set("selectable", false);

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
            let objects = canvas.getObjects();
            var rect = objects[objects.length - 1];
            canvas.remove(rect);

            objects.forEach((index, rect) => {
                if (index > 0) {
                    rect.opacity = 0.0;
                }
            });
        }

        if (selectd_rows.length > 0) {
            // Create new rectangle to cover all image
            var rect = new fabric.Rect({
                left: 0,
                top: 0,
                fill: 'black',
                width: image_width,
                height: image_height,
                opacity: 0.3,
                selectable: false,
            });

            var clipPaths = [];

            // create clipPaths from selected_rows
            selectd_rows.forEach((idx) => {
                //
                item = jsonData[idx];
                var box = new fabric.Rect({
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
            var $row = $(this.node());
            var $btn = $row.find('.toggle-btn');
            var itemNo = this.data()[1];

            if ($btn.data('status') === 'on') {
                onRows.push(Number(itemNo));
            }
        });

        //console.log("onRows = ", onRows);

        // Further processing with onRows
        const objects = canvas.getObjects();

        let last_index = objects.length;

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

function updateTreeView(tree, table) {
    var parent_nodes = [];

    table.rows().every(function () {
        var $row = $(this.node());
        var $btn = $row.find('.toggle-btn');
        var status = $btn.data('status') === 'on' ? true : false;
        var text = $row.find('.item-object').text() + ", " + $row.find('.item-text').text();

        //console.log(text, status);
        var nodes = $('#tree').treeview('search', [text, {
            ignoreCase: true,     // case insensitive
            exactMatch: true,    // like or equals
            revealResults: false,  // reveal matching nodes
        }]);

        var node = nodes[0];
        //console.log("find for ", text, ": found ", node);

        if (node) {
            //console.log(node.nodeId, ' to ', status);
            if (status === true) {
                $('#tree').treeview('checkNode', [node.nodeId, { silent: true }]);
            } else {
                $('#tree').treeview('uncheckNode', [node.nodeId, { silent: true }]);
            }
        }

        var parent = $('#tree').treeview('getParent', node.nodeId);

        if (!parent_nodes.includes(parent)) {
            parent_nodes.push(parent);
        }
    });

    // check the treeview for parent nodes
    //console.log(parent_nodes);
    for (var i = 0; i < parent_nodes.length; i++) {
        var childern = parent_nodes[i].nodes;
        var count = 0;

        for (var j = 0; j < childern.length; j++) {
            if (childern[j].state['checked'] == true) {
                count++;
            }
        }

        if (count == childern.length) {
            $('#tree').treeview('checkNode', [parent_nodes[i].nodeId, { silent: true }]);
        } else {
            $('#tree').treeview('uncheckNode', [parent_nodes[i].nodeId, { silent: true }]);
        }
    }

    // update display
    canvasUtils.displayBBX(table);
}

function updateOnOffMaster(table) {
    // check btn status again for master button
    var btnStatus = [];
    var off_status_count = 0;

    table.rows().every(function () {
        var $row = $(this.node());
        var $btn = $row.find('.toggle-btn');
        btnStatus.push($btn.data('status'))
    });

    for (var i = 0; i < btnStatus.length; i++) {
        if (btnStatus[i] === 'off') {
            off_status_count++;   // break loop if any is on
        }
    }

    if (off_status_count === 0) {
        // change master toggle button to Show all
        $('#master-toggle').data('status', 'on');
        $('#master-toggle').text('Hide all');
    } else {
        $('#master-toggle').data('status', 'off');
        $('#master-toggle').text('Show all');
    }
}

function toggleOnOffButton($btn, table, status) {
    if (status || status === 'on') {
        //console.log('match - on');
        $btn.data('status', 'on');
        $btn.text('On');
        $btn.removeClass('btn-secondary')
        $btn.addClass('btn-primary')
    } else {
        //console.log('match - off');
        $btn.data('status', 'off');
        $btn.text('Off');
        $btn.removeClass('btn-primary')
        $btn.addClass('btn-secondary')
    }

    updateOnOffMaster(table);
}

function updateOnOffButton(data, table, status) {
    var tree_index = Number(data.tags[0]);

    // toggle btn
    table.rows().every(function () {
        var $row = $(this.node());
        var $btn = $row.find('.toggle-btn');
        //var text = $row.find('.item-object').text() + ", " + $row.find('.item-text').text();
        var index = Number($row.find('.item-index').text())

        //console.log("Check if : ", tree_index, index);
        if (index === tree_index) {
            toggleOnOffButton($btn, table, status);
        }
    });

    // update display
    canvasUtils.displayBBX(table);
}

function updateDeselectAllButton(table) {
    var count = table.rows({ selected: true }).count();

    if (count > 0) {
        $('#deselect-all').removeClass('disabled').removeClass('btn-secondary').addClass('btn-primary');
    } else {
        $('#deselect-all').addClass('disabled').addClass('btn-secondary').removeClass('btn-primary');
    }
}

// run this when all page is ready.

$(document).ready(function () {
    const zoomInButton = $("#zoom-in");
    const zoomOutButton = $("#zoom-out");
    const zoomResetButton = $("#zoom-reset");
    const zoomRange = $("#zoom-range");
    const submitButton = $("#submit");

    // set action for zoom buttons
    zoomRange.max = canvasUtils.maxZoom();

    zoomInButton.on("click", function () {
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** (-50);
        canvasUtils.zoom(zoom);
    });

    zoomOutButton.on("click", function () {
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** (50);
        canvasUtils.zoom(zoom);
    });

    zoomResetButton.on("click", function () {
        canvasUtils.resetZoom();
    });

    zoomRange.on("input", function (event) {
        var zoom = parseFloat($(this).val());
        const container = $("#canvas-container");
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

    canvas.on("mouse:wheel", function (opt) {
        var delta = opt.e.deltaY;
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        zoom = Math.min(zoom, canvasUtils.maxZoom());
        zoom = Math.max(zoom, canvasUtils.minZoom());
        canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
        zoomRange.val(zoom);
        //
        var vpt = this.viewportTransform;

        // Calculate the maximum allowed values
        var maxLeft = 0;
        var maxTop = 0;
        var maxRight = -(image_width * canvas.getZoom() - canvas.width);
        var maxBottom = - (image_height * canvas.getZoom() - canvas.height);

        // Adjust left and top values to stay within the limits
        vpt[4] = Math.max(Math.min(vpt[4], maxLeft), maxRight);
        vpt[5] = Math.max(Math.min(vpt[5], maxTop), maxBottom);

        opt.e.preventDefault();
        opt.e.stopPropagation();
        canvasUtils.updateZoomButtons(zoom);
    });

    canvas.on("mouse:down", function (opt) {
        var evt = opt.e;
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

    canvas.on("mouse:move", function (opt) {
        if (this.isDragging) {
            var evt = opt.e;
            var vpt = this.viewportTransform;

            // Calculate the maximum allowed values
            var maxLeft = 0;
            var maxTop = 0;
            var maxRight = -(image_width * canvas.getZoom() - canvas.width);
            var maxBottom = - (image_height * canvas.getZoom() - canvas.height);

            // Adjust left and top values to stay within the limits
            vpt[4] = Math.max(Math.min(vpt[4] + evt.clientX - this.lastPosX, maxLeft), maxRight);
            vpt[5] = Math.max(Math.min(vpt[5] + evt.clientY - this.lastPosY, maxTop), maxBottom);

            this.requestRenderAll();
            this.lastPosX = evt.clientX;
            this.lastPosY = evt.clientY;
        }
    });

    canvas.on("mouse:up", function (opt) {
        // on mouse up we want to recalculate new interaction
        // for all objects, so we call setViewportTransform
        this.setViewportTransform(this.viewportTransform);
        this.isDragging = false;
        this.selection = true;
    });

    // Set up DataTable

    let table = new DataTable('#output-table', {
        dom: "lBfrtip",

        order: 1,

        // set column width
        columnDefs: [
            {
                width: '80px',
                searchable: false,
                orderable: false,
                targets: [0],
            },
            { width: '80px', targets: 1 },
        ],

        select: {
            style: "multi"
        },
    });

    // Create tree view --------------------------------------------------------

    function getTree() {
        // get data from category_id and json_data
        // category_id = { id: 0, desc: "name", count: 0 }
        // jsonData contain all data in table

        var data = [];
        var child_nodes = [];

        for (var j = 0; j < jsonData.length; j++) {

            //console.log(j, jsonData[j].Id, jsonData[j].Text);

            var categoryId = jsonData[j].CategoryID;

            if (!child_nodes[categoryId]) {
                //console.log('create new child_node');
                child_nodes[categoryId] = { nodes: [] };
            }

            child_nodes[categoryId].nodes.push({
                tags: [jsonData[j].Index.toString()],
                text: jsonData[j].Object + ", " + jsonData[j].Text,
                state: { checked: false, },
            });

            //console.log(child_nodes)
        }

        //console.log(child_nodes)

        for (var i = 0; i < categoryData.length; i++) {

            var category_name = categoryData[i].desc;
            var id = categoryData[i].id
            var child_node = child_nodes[id].nodes;
            var child_count = child_node.length;

            data.push({
                text: "Class : " + id + " - " + category_name + " (" + child_count + ")",
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

    $('#tree').treeview({

        data: getTree(),
        checkedIcon: "fas fa-check-square",
        uncheckedIcon: "far fa-square",
        expandIcon: "fa fa-angle-right",
        collapseIcon: "fa fa-angle-down",
        showCheckbox: true,
        showTags: false,

    });

    $('#tree').on('nodeChecked', function (event, data) {
        // Logic for select node and child node

        //console.log(data.state['checked']);
        var children = data.nodes;
        if (children) {
            //console.log(data.nodes);

            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                $('#tree').treeview('checkNode', [node.nodeId, { silent: true }]);

                updateOnOffButton(node, table, true);
            }
        } else {
            updateOnOffButton(data, table, true);
        }

        // check the parent if all children is checked then parent should be checked.
        var parent = $('#tree').treeview('getParent', data.nodeId);
        //console.log(data.nodeId, parent);

        if (parent.nodeId != null) {
            // unchecked parent
            var my_children = parent.nodes;
            for (var i = 0; i < my_children.length; i++) {
                //console.log(i, my_children[i].state['checked'])
                if (!my_children[i].state['checked']) {
                    return;
                }
            }
            $('#tree').treeview('checkNode', [parent.nodeId, { silent: true }]);
        }

        updateOnOffMaster(table);
    }).on('nodeUnchecked', function (event, data) {

        // uncheck all children
        var children = data.nodes;
        if (children) {
            //console.log(data.nodes);

            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                $('#tree').treeview('uncheckNode', [node.nodeId, { silent: true }]);

                updateOnOffButton(node, table, false);
            }
        } else {
            updateOnOffButton(data, table, false);
        }

        // uncheck parent
        var parent = $('#tree').treeview('getParent', data.nodeId);
        if (parent.nodeId != null) {
            // unchecked parent
            $('#tree').treeview('uncheckNode', [parent.nodeId, { silent: true }]);
        }

        updateOnOffMaster(table);

    }).on('nodeExpanded', function () {
        console.log('node Expaned');
        adjustGridContainerHeight();
    });

    // toggle-on/off btn

    table.on('click', '.toggle-btn', function (event) {
        event.stopPropagation(); // Prevent row selection

        var $btn = $(this);
        var currentStatus = $btn.data('status');

        // Toggle the status and update botton text
        if (currentStatus == 'off') {
            $btn.data('status', 'on');
            $btn.text('On');
            $btn.removeClass('btn-secondary')
            $btn.addClass('btn-primary')
        } else {
            $btn.data('status', 'off');
            $btn.text('Off');
            $btn.removeClass('btn-primary')
            $btn.addClass('btn-secondary')
        }

        updateTreeView($('#tree'), table);
    });

    // Master toggle button functionality
    $('#master-toggle').on('click', function () {
        var $masterBtn = $(this);
        var masterStatus = $masterBtn.data('status');

        // Toggle the master button status and update text
        if (masterStatus === 'off') {
            $masterBtn.data('status', 'on');
            $masterBtn.text('Hide all');

            // Toggle all rows to on
            table.rows().every(function () {
                var $row = $(this.node());
                var $btn = $row.find('.toggle-btn');

                $btn.data('status', 'on');
                $btn.text('On');
                $btn.removeClass('btn-secondary').addClass('btn-primary')
            });

        } else {
            $masterBtn.data('status', 'off');
            $masterBtn.text('Show all');

            // Toggle all rows to off
            table.rows().every(function () {
                var $row = $(this.node());
                var $btn = $row.find('.toggle-btn');

                $btn.data('status', 'off');
                $btn.text('Off');
                $btn.removeClass('btn-primary').addClass('btn-secondary')
            });
        }

        updateTreeView($('#tree'), table);
    });

    $('#deselect-all').on('click', function () {
        table.rows().deselect();
    });

    // display overlay when row is selected

    table
        .on('select', function (e, dt, type, indexes) {
            //let rowData = table.rows(indexes).data().toArray();
            let selected_rows = table.rows('.selected')[0];

            canvasUtils.displayOverlay(selected_rows);
            canvas.renderAll();

            // update Deselect All button
            updateDeselectAllButton(table);

            //console.log('<b>' + type + ' selection</b> - ' + JSON.stringify(rowData));
        })
        .on('deselect', function (e, dt, type, indexes) {
            //let rowData = table.rows(indexes).data().toArray();
            let selected_rows = table.rows('.selected')[0];

            canvasUtils.displayOverlay(selected_rows);
            canvas.renderAll();

            // update Deselect All button
            updateDeselectAllButton(table);

            //console.log('<b>' + type + ' <i>de</i>selection</b> - ' + JSON.stringify(rowData));
        });

    //updateCategoryCheckboxes(chkCategories, table);

    // Get reference to select model_type
    const modelSelect = $("select#selected_model");
    const weightContainer = $("div#weight-path-container");
    const configContainer = $("div#config-path-container");
    const textOCRContainer = $("div#textOCR-container");

    // hide and unhide form depends on selected model_type

    modelSelect.on("change", function () {
        var selectedValue = $(this).val();

        // Enable all dependent select
        if (selectedValue == "yolov8") {
            weightContainer.slideDown();
            configContainer.slideDown();
            //textOCRContainer.slideUp();
        } else if (selectedValue == "easyocr") {
            weightContainer.slideUp();
            configContainer.slideUp();
            //textOCRContainer.slideDown();
        }
    });

    // handler for file change
    const fileInput = $("#file-input");

    fileInput.on("change", function () {
        var selectedFile = $(this).val();

        if (selectedFile) {
            submitButton
                .prop("disabled", false)
                .removeClass("btn-secondary")
                .addClass("btn-primary");
        } else {
            submitButton
                .prop("disabled", true)
                .removeClass("btn-primary")
                .addClass("btn-secondary");
        }
    });

    // submitButton event
    // Note: 11 Sep 2024
    //       for some reason the post method stop working, so I have to change
    //       the post sequence by adding new onsubmit function.
    //h
    submitButton.on("click", function (event) {
        //event.preventDefault();

        //alert("Continue detecting symbols.");

        $("#main-container").waitMe({
            effect: 'win8_linear',
            text: 'Please wait...',
        });

        // sumbit form to FastAPI
        $("#main-form").submit();
    });

    $("#main-form").onsubmit = async (event) => {
        // Stop other thread
        event.preventDefault();

        let res = await fetch("/submit", {
            method: "POST",
            body: new FormData($("#main-form")),
        });

        if (res.ok) {
            let result = await res.text();
            document.innerHTML = result;
        } else {
            document.innerHTML = 'Response error:', res.status;
        }
    };

    $("#output-image")
        .one("load", function () {
            //console.log("Image has finished loading. (one)");
        })
        .each(function () {
            if (this.complete) {
                // image is finished loading
                //console.log("Image has finished loading. (this.complete)");
                canvasUtils.onImageLoad(this);
                canvasUtils.resetZoom();
            }
        })
        .on("load", function () {
            // image is finished loading
            //console.log("Image has finished loading. (on.load)");
            canvasUtils.onImageLoad(this);
            canvasUtils.resetZoom();
        });

    // Auto adjust grid container height when window change size
    savedHeight = 0;
    savedWidth = 0;

    function adjustGridContainerHeight() {
        var windowHeight = $(window).height();
        var gridContainer = $("#grid-container");
        var canvasContainer = $("div#canvas-container");

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
        $("div#zoom-menu-container").width(canvasWidth);
        $("div#table-container").width(canvasWidth);

        // set the canvas to new size
        canvas.setWidth(100);

        canvas.setHeight(canvasHeight);
        canvas.setWidth(canvasWidth);
        canvas.calcOffset();
        canvasUtils.resetZoom();
    }

    // Attach the resize event listener

    $(window).on("resize", adjustGridContainerHeight);

    // Call the function initially

    adjustGridContainerHeight();

    // for some reason resetZoom() need to be called twice.

    canvasUtils.resetZoom();
    canvas.renderAll();

    updateTreeView($('#tree'), table);

    //console.log("jQuery finished.");
});
