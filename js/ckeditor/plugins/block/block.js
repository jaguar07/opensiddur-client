/**
 * Common block functions  
 * Copyright 2015 Efraim Feinstein, efraim@opensiddur.org
 * Licensed under the GNU Lesser General Public License, version 3 or later
 *
 */

var BlockObject = function(editor) {
    this.editor = editor;
    var injector = angular.element('*[data-ng-app]').injector();
    this.TextService = injector.get("TextService");
    var getRandomId = function(blockType, elementType) {
        return blockType + "_" + elementType + "_" + Math.floor(Math.random()*100000000).toString();
    };
    var isBlockBoundary = function(node, blockType, id, boundary) {
        // returns true if the given node is a node/widget representing the given id's boundary
        if (node.hasClass("cke_widget_block")) {
            node = node.getChildren().getItem(0);
        }
        var r = RegExp("^"+boundary+"_");
        return node.hasClass(blockType) && node.getId().replace(r, "") == id;
    };
    var isAnyBlockBoundary = function(node, blockType, boundaryTypes) {
        // returns the node if the given node is a node/widget representing the given type's boundary
        if (node.hasClass("cke_widget_block")) {
            node = node.getChildren().getItem(0);
        }
        boundaryTypes = boundaryTypes || ["start", "end"];
        return node.hasClass(blockType) && node.hasClass("layer") && 
            boundaryTypes.some(function(b) {return node.hasClass(b);}) ? node : false; 
    };
    var removeInternalBlocks = function(startNode, endNode, blockType) {
        var rng = new CKEDITOR.dom.range(editor.document);
        rng.setStart(startNode,0);
        rng.setEnd(endNode,0);
        var iter = rng.createIterator();
        var internalBlocks = [];
        while (nxt = iter.getNextParagraph("p")) {
            if (nxt.type == 1 && isAnyBlockBoundary(nxt, blockType) && !isBlockBoundary(nxt, blockType, thisId, "end")) {
                internalBlocks.push(nxt);
            } 
        } 
        for (var i = 0; i < internalBlocks.length; i++) {
            internalBlocks[i].remove();
        }
    };
    var getAllPrecedingUnterminatedBlockStarts = function(node, blockType) {
        var starts = [];
        var prev = node;
        while (prev) {
            prev = prev.getPrevious();
            if (prev && prev.type == 1) {
                var p = isAnyBlockBoundary(prev, blockType, ["start"]);
                if (p) starts.push(p);
            }
        };
        var unterminatedStarts = [];
        for (var i = 0; i < starts.length; i++) {
            var start = starts[i];
            var prev = node;
            var terminated = false;
            while (!terminated && prev != start && (prev = prev.getPrevious())) {
                terminated = isBlockBoundary(prev, blockType, start.getId().replace(/^start_/, ""), "end");
            }
            if (!terminated) { 
                unterminatedStarts.push(start);
            }
        }
        return unterminatedStarts;
    };
    var getAllFollowingUnstartedBlockEnds = function(node, blockType) {
        var ends = [];
        var fol = node;
        while (fol) {
            fol = fol.getNext();
            if (fol && fol.type == 1) { 
                var f = isAnyBlockBoundary(fol, blockType, ["end"]);
                if (f) ends.push(f);
            }
        };
        var unstartedEnds = [];
        for (var i = 0; i < ends.length; i++) {
            end = ends[i];
            var fol = node;
            var started = false;
            while (!started && fol != end && (fol = fol.getNext())) {
                started = isBlockBoundary(fol, blockType, end.getId().replace(/^end_/, ""), "start");
            }
            if (!started) { 
                unstartedEnds.push(end);
            }
        }
        return unstartedEnds;
    };
    var blockIdRename = function(unterminatedStarts, unstartedEnds, blockType) {
        // if a block consists of both an unterminated start and unstarted end, then
        // the block is completely enclosing the new block. 
        // in such a case, the unstartedEnd should be renamed
        var startIds = unterminatedStarts.map(function(s) {
            return s.getId().replace(/^start_/, "");
        });
        return unstartedEnds.map(function(e) {
            var eid = e.getId().replace(/^end_/, "");
            if (startIds.indexOf(eid) != -1) {
                var elayer = blockType.split("-")[1];
                var ename = e.getName();
                e.setAttribute("id", "end_" + getRandomId(elayer, ename));
            }
            else return e; 
        });
        
    };
    var removeEmptyBlocks = function(segmentNode, blockType, elementType) {
        // remove blocks of the given type that contain no segments
        var body = segmentNode.getParent();
        var starts = body.find("."+blockType+".layer"+".start");
        for (var s = 0; s < starts.count(); s++) {
            var start = starts.getItem(s);
            var id = start.getId();
            var end = body.findOne("."+blockType+".layer"+".end[id="+id.replace(/^start_/, "end_").replace(/[.]/g,"\\.")+"]"); // . has to be replaced by \. in selectors
            var rng = new CKEDITOR.dom.range(editor.document);
            rng.setStart(start,0);
            rng.setEnd(end,0);
            var iter = rng.createIterator(); 
            var nsegs = 0; 
            var maybe = null;
            while (maybe = iter.getNextParagraph(elementType)) { 
                if (maybe.hasClass("tei-seg") || (maybe.getName() == elementType && maybe.getAttribute("class") == null)) nsegs++; 
            }; 
            if (nsegs == 0) {
                start.remove();
                end.remove();
            }
        }
    };
    var getAscendantSegment = function(node, originalNode) {
        var originalNode = originalNode || node;
        if (!node || node.type == 9) {  // document node, nowhere to go
            return originalNode;
        }
        else if (node.type == 3) {  // text node, go up 1 level
            return getAscendantSegment(node.getParent(), originalNode);
        }
        else { // element node
            if (node.hasClass("tei-seg") || (node.getName() == elementType && node.getAttribute("class") == null)) { // it's a segment, return it
                return node;
            }
            else {
                return getAscendantSegment(node.getParent(), originalNode);
            }
        }   
    };

    this.insert = function(
        layerType,          // eg, "p"
        elementType,        // eg, "p"
        classType,          // eg, "tei-p"
        beginTemplate,
        endTemplate
        ) {
        // beginTemplate and endTemplate should be function(id) and return a string
        /* block insertion algorithm:
        0. make sure a layer exists of the proper type
        1. get selection
        2. if the beginning of the selection is in a segment, find the place before the segment, call that the start position; else, the start of the selection is the insertion point.
        3. if the ending of the selection is in a segment, find a place after the segment, call that the ending position; else the end of the selection is the insertion point
        4. if the same type of block begins or ends inside the selection, remove the beginning/ending
        5. if the same type of block begins before the start position and does not end, place an end for that block before starting this one
        6. if the same type of block ends after the start position and does not begin after it, place a begin for that block after this one
        7. if any blocks have been terminated, delete them if they are empty (contain no segments).
        8. if any blocks have been split in both directions (unterminated and unstarted) rename the ids for the unstarted portion of the block.
        */
        var editor = this.editor;
        this.TextService.addLayer(layerType);
        var thisId = getRandomId(layerType, elementType);
        var selection = editor.getSelection();
        var ranges = selection.getRanges();
        var startElement = getAscendantSegment(ranges[0].startContainer);
        var endElement = getAscendantSegment(ranges[ranges.length - 1].endContainer);
        var begInsert = new CKEDITOR.dom.element.createFromHtml(beginTemplate(thisId));
        var endInsert = new CKEDITOR.dom.element.createFromHtml(endTemplate(thisId));
        removeInternalBlocks(startElement, endElement, classType);
        var unterminatedStarts = getAllPrecedingUnterminatedBlockStarts(startElement, classType);
        var unstartedEnds = getAllFollowingUnstartedBlockEnds(endElement, classType);
        blockIdRename(unterminatedStarts, unstartedEnds, classType);
        for (var i = 0; i < unterminatedStarts.length; i++) {
            // insert end tags
            var endTag = new CKEDITOR.dom.element.createFromHtml(endTemplate(unterminatedStarts[i].getId().replace(/^start_/, "")));
            endTag.insertBefore(startElement);
            editor.widgets.initOn( endTag, classType );
        }
        for (var i = 0; i < unstartedEnds.length; i++) {
            // insert start tags
            var startTag = new CKEDITOR.dom.element.createFromHtml(beginTemplate(unstartedEnds[i].getId().replace(/^end_/, "")));
            startTag.insertAfter(endElement);
            editor.widgets.initOn( startTag, classType );
        }
                
        begInsert.insertBefore(startElement);
        endInsert.insertAfter(endElement);
        editor.widgets.initOn( begInsert, classType )
        editor.widgets.initOn( endInsert, classType )
        removeEmptyBlocks(startElement, classType, elementType); 
    };
    this.doubleclick = function(evt) {
        // doubleclick event handler: use with this.on('doubleclick')
        // select: select the content of the block
        var idtokens = this.element.getId().match(/^(start|end)_(.+)/);
        var bound = idtokens[1];
        var thisId = idtokens[2];
        var otherBound = bound == "start" ? "end" : "start";
        var otherBoundId = otherBound + "_" + thisId;
        var otherBoundElement = this.wrapper.getParent().findOne("*[id="+otherBoundId.replace(/[.]/g, "\\.")+"]");
        var otherWrapper = otherBoundElement.getParent().hasClass("cke_widget_block") ? otherBoundElement.getParent() : otherBoundElement;
        var rng = new CKEDITOR.dom.range(editor.document);
        rng.setStart((bound == "start") ? this.wrapper : otherWrapper,0);
        rng.setEnd((bound == "end") ? this.wrapper : otherWrapper, 1);
        editor.getSelection().selectRanges([rng]);
    };  
    this.destroy = function(evt) {
        // destroy event handler. use in parallel with init()
        var idtokens = this.element.getId().match(/^(start|end)_(.+)/);
        var bound = idtokens[1];
        var thisId = idtokens[2];
        var otherBound = bound == "start" ? "end" : "start";
        var otherBoundId = otherBound + "_" + thisId;
        var body = editor.document;   
        if (body) {
            var otherBoundElement = body.findOne("*[id="+otherBoundId.replace(/[.]/g, "\\.")+"]");
            if (otherBoundElement) {
                var otherBoundWrapper = otherBoundElement.getParent();
                otherBoundWrapper.remove();
            }
        }
    };
};