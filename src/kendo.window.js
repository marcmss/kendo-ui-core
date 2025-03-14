import "./kendo.draganddrop.js";
import "./kendo.popup.js";
import "./kendo.icons.js";
import "./kendo.html.button.js";

    var __meta__ = {
        id: "window",
        name: "Window",
        category: "web",
        description: "The Window widget displays content in a modal or non-modal HTML window.",
        depends: [ "draganddrop", "popup", "icons" ],
        features: [ {
            id: "window-fx",
            name: "Animation",
            description: "Support for animation",
            depends: [ "fx" ]
        } ]
    };

    (function($, undefined) {
        var kendo = window.kendo,
            Widget = kendo.ui.Widget,
            TabKeyTrap = kendo.ui.Popup.TabKeyTrap,
            Draggable = kendo.ui.Draggable,
            isPlainObject = $.isPlainObject,
            activeElement = kendo._activeElement,
            outerWidth = kendo._outerWidth,
            outerHeight = kendo._outerHeight,
            extend = $.extend,
            each = $.each,
            template = kendo.template,
            BODY = "body",
            templates,
            NS = ".kendoWindow",
            MODAL_NS = ".kendoWindowModal",
            // classNames
            KWINDOW = ".k-window",
            KWINDOWTITLE = ".k-window-title",
            KWINDOWTITLEBAR = KWINDOWTITLE + "bar",
            KWINDOWCONTENT = ".k-window-content",
            KDIALOGCONTENT = ".k-dialog-content",
            KWINDOWRESIZEHANDLES = ".k-resize-handle",
            KOVERLAY = ".k-overlay",
            KWINDOWMINIMIZED = "k-window-minimized",
            KCONTENTFRAME = "k-content-frame",
            LOADINGICONCLASS = "k-i-loading",
            KHOVERSTATE = "k-hover",
            KFOCUSEDSTATE = "k-focus",
            MAXIMIZEDSTATE = "k-window-maximized",
            INLINE_FLEX = "k-display-inline-flex",
            // constants
            VISIBLE = ":visible",
            HIDDEN = "hidden",
            CURSOR = "cursor",
            // events
            OPEN = "open",
            ACTIVATE = "activate",
            DEACTIVATE = "deactivate",
            CLOSE = "close",
            REFRESH = "refresh",
            MINIMIZE = "minimize",
            MAXIMIZE = "maximize",
            RESIZESTART = "resizeStart",
            RESIZE = "resize",
            RESIZEEND = "resizeEnd",
            DRAGSTART = "dragstart",
            DRAGEND = "dragend",
            RESTORE = "restore",
            KENDOKEYDOWN = "kendoKeydown",
            ERROR = "error",
            OVERFLOW = "overflow",
            DATADOCOVERFLOWRULE = "original-overflow-rule",
            ZINDEX = "zIndex",
            MINIMIZE_MAXIMIZEICONSELECTORS = ".k-window-titlebar-actions .k-i-window-minimize,.k-window-titlebar-actions .k-i-window,.k-window-titlebar-actions .k-svg-i-window-minimize,.k-window-titlebar-actions .k-svg-i-window",
            KPINICONCLASSSELECTOR = ".k-i-pin,.k-svg-i-pin",
            KUNPINICONCLASSSELECTOR = ".k-i-unpin,.k-svg-i-unpin",
            PIN_UNPINICONCLASSSELECTOR = KPINICONCLASSSELECTOR + "," + KUNPINICONCLASSSELECTOR,
            TITLEBAR_BUTTONSSELECTOR = ".k-window-titlebar .k-window-titlebar-action",
            REFRESHICONSELECTOR = ".k-window-titlebar .k-i-arrow-rotate-cw,.k-window-titlebar .k-svg-i-arrow-rotate-cw",
            WINDOWEVENTSHANDLED = "WindowEventsHandled",
            zero = /^0[a-z]*$/i,
            isLocalUrl = kendo.isLocalUrl,
            SIZE = {
                small: "k-window-sm",
                medium: "k-window-md",
                large: "k-window-lg"
            };

        function defined(x) {
            return (typeof x != "undefined");
        }

        function toInt(element, property) {
            return parseInt(element.css(property), 10) || 0;
        }

        function constrain(value, low, high) {
            var normalizedValue;

            if (value && isNaN(value) && value.toString().indexOf("px") < 0) {
                normalizedValue = value;
            } else {
                normalizedValue = Math.max(
                    Math.min(parseInt(value, 10), high === Infinity ? high : parseInt(high, 10)),
                    low === -Infinity ? low : parseInt(low, 10)
                );
            }

            return normalizedValue;
        }

        function executableScript() {
            return !this.type || this.type.toLowerCase().indexOf("script") >= 0;
        }


        function getPosition(elem) {
            var result = { top: elem.offsetTop, left: elem.offsetLeft },
                parent = elem.offsetParent;

            while (parent) {
                result.top += parent.offsetTop;
                result.left += parent.offsetLeft;

                var parentOverflowX = $(parent).css("overflowX");
                var parentOverflowY = $(parent).css("overflowY");

                if (parentOverflowY === "auto" || parentOverflowY === "scroll") {
                    result.top -= parent.scrollTop;
                }

                if (parentOverflowX === "auto" || parentOverflowX === "scroll") {
                    result.left -= parent.scrollLeft;
                }

                parent = parent.offsetParent;
            }

            return result;
        }

        var Window = Widget.extend({
            init: function(element, options) {
                var that = this,
                    wrapper,
                    offset = {},
                    visibility, display, position,
                    isVisible = false,
                    content,
                    windowContent,
                    windowFrame,
                    globalWindow,
                    suppressActions = options && options.actions && !options.actions.length,
                    id;

                Widget.fn.init.call(that, element, options);
                options = that.options;
                position = options.position;
                element = that.element;
                content = options.content;
                globalWindow = $(window);

                if (suppressActions) {
                    options.actions = [];
                }

                that.appendTo = $(options.appendTo);

                that.containment = options.draggable.containment ? $(options.draggable.containment).first() : null;

                if (content && !isPlainObject(content)) {
                    content = options.content = { url: content };
                }

                // remove script blocks to prevent double-execution
                element.find("script").filter(executableScript).remove();

                if (!element.parent().is(that.appendTo) && !that.containment && (position.top === undefined || position.left === undefined)) {
                    if (element.is(VISIBLE)) {
                        offset = element.offset();
                        isVisible = true;
                    } else {
                        visibility = element.css("visibility");
                        display = element.css("display");

                        element.css({ visibility: HIDDEN, display: "" });

                        if (document.body.contains(element[0])) {
                            offset = element.offset();
                        } else {
                            offset = { top: 0, left: 0 };
                        }

                        element.css({ visibility: visibility, display: display });
                    }

                    if (position.top === undefined) {
                        position.top = offset.top;
                    }
                    if (position.left === undefined) {
                        position.left = offset.left;
                    }
                }

                if (!defined(options.visible) || options.visible === null) {
                    options.visible = element.is(VISIBLE);
                }

                wrapper = that.wrapper = element.closest(KWINDOW);

                if (options.themeColor && options.themeColor !== "none") {
                    wrapper.addClass(kendo.getValidCssClass("k-window-", "themeColor", options.themeColor));
                }

                if (!element.is(".k-window-content") || !wrapper[0]) {
                    element.addClass("k-window-content");
                    element.attr("tabindex", 0);
                    that._createWindow(element, options);
                    wrapper = that.wrapper = element.closest(KWINDOW);

                    that.title(that.options.title);
                    that._dimensions();
                }

                that.minTop = that.minLeft = -Infinity;
                that.maxTop = that.maxLeft = Infinity;
                that._position();

                if (content) {
                    that.refresh(content);
                }

                if (options.visible) {
                    that.toFront(null, !options.modal);
                }

                windowContent = wrapper.children(KWINDOWCONTENT);

                if (options.visible && options.modal) {
                    that._overlay(wrapper.is(VISIBLE)).css({ opacity: 0.5 });
                }

                wrapper
                    .on("mouseenter" + NS, TITLEBAR_BUTTONSSELECTOR, that._buttonEnter.bind(that))
                    .on("mouseleave" + NS, TITLEBAR_BUTTONSSELECTOR, that._buttonLeave.bind(that))
                    .on("click" + NS, "> " + TITLEBAR_BUTTONSSELECTOR, that._windowActionHandler.bind(that))
                    .on("keydown" + NS, that, that._keydown.bind(that))
                    .on("focus" + NS, that._focus.bind(that))
                    .on("blur" + NS, that._blur.bind(that));

                windowContent
                    .on("keydown" + NS, that, that._keydownContent.bind(that));

                windowFrame = windowContent.find("." + KCONTENTFRAME)[0];

                if (windowFrame && !globalWindow.data(WINDOWEVENTSHANDLED)) {

                    globalWindow.on("blur" + NS, function() {
                        var element = $(document.activeElement).parent(KWINDOWCONTENT);
                        if (element.length) {
                            var windowInstance = kendo.widgetInstance(element);
                            windowInstance._focus();
                        }
                    });

                    globalWindow.on("focus" + NS, function() {
                        $(KWINDOWCONTENT).not(KDIALOGCONTENT).each(function(i, element) {
                            kendo.widgetInstance($(element))._blur();
                        });
                    });

                    globalWindow.data(WINDOWEVENTSHANDLED, true);
                }

                this._resizable();

                this._draggable();

                if (options.pinned && this.wrapper.is(":visible")) {
                    that.pin();
                }

                id = element.attr("id");
                if (id) {
                    id = id + "_wnd_title";
                    wrapper.attr({
                            "role": "dialog",
                            "aria-labelledby": id
                        }).children(KWINDOWTITLEBAR)
                        .children(KWINDOWTITLE)
                        .attr("id", id);
                }

                wrapper.add(wrapper.children(".k-resize-handle," + KWINDOWTITLEBAR))
                    .on(kendo.support.mousedown + NS, that.toFront.bind(that));

                that.touchScroller = kendo.touchScroller(element);

                that._resizeHandler = that._onDocumentResize.bind(that);

                that._marker = kendo.guid().substring(0, 8);

                $(window).on("resize" + NS + that._marker, that._resizeHandler);

                if (options.visible) {
                    that.trigger(OPEN);
                    that.trigger(ACTIVATE);
                }

                kendo.notify(that);

                if (this.options.modal) {
                    this._tabKeyTrap = new TabKeyTrap(wrapper);
                    this._tabKeyTrap.trap();
                    this._tabKeyTrap.shouldTrap = function() {
                        return wrapper.data("isFront");
                    };
                }
            },

            _buttonEnter: function(e) {
                $(e.currentTarget).addClass(KHOVERSTATE);
            },

            _buttonLeave: function(e) {
                $(e.currentTarget).removeClass(KHOVERSTATE);
            },

            _focus: function() {
                this.wrapper.addClass(KFOCUSEDSTATE);
            },

            _blur: function() {
                this.wrapper.removeClass(KFOCUSEDSTATE);
            },

            _dimensions: function() {
                var wrapper = this.wrapper;
                var options = this.options;
                var width = options.width;
                var height = options.height;
                var maxHeight = options.maxHeight;
                var sizeClass = options.size;
                var dimensions = ["minWidth","minHeight","maxWidth","maxHeight"];
                var contentBoxSizing = wrapper.css("box-sizing") == "content-box";

                var lrBorderWidth = contentBoxSizing ? toInt(wrapper, "border-left-width") + toInt(wrapper, "border-right-width") : 0;
                var tbBorderWidth = contentBoxSizing ? toInt(wrapper, "border-top-width") + toInt(wrapper, "border-bottom-width") : 0;
                var paddingTop = contentBoxSizing ? toInt(wrapper, "padding-top") : 0;

                if (this.containment && !this._isPinned) {
                    this._updateBoundaries();
                    options.maxHeight = Math.min(this.containment.height - (tbBorderWidth + paddingTop), maxHeight);
                    options.maxWidth = Math.min(this.containment.width - lrBorderWidth, options.maxWidth);
                }

                for (var i = 0; i < dimensions.length; i++) {
                    var value = options[dimensions[i]] || "";
                    if (value != Infinity) {
                        wrapper.css(dimensions[i], value);
                    }
                }

                if (maxHeight != Infinity) {
                    this.element.css("maxHeight", maxHeight);
                }

                if (width) {
                    wrapper.outerWidth(constrain(width, options.minWidth, options.maxWidth));
                }
                else {
                    wrapper.outerWidth("");
                }

                if (height) {
                    wrapper.outerHeight(constrain(height, options.minHeight, options.maxHeight));
                }
                else {
                    wrapper.outerHeight("");
                }

                if (!options.visible) {
                    wrapper.removeClass(INLINE_FLEX).hide();
                }

                if (sizeClass && SIZE[sizeClass]) {
                    wrapper.addClass(SIZE[sizeClass]);
                }
            },

            _position: function() {
                var wrapper = this.wrapper,
                    position = this.options.position,
                    containmentTop, containmentLeft;

                this._updateBoundaries();

                if (this.containment) {
                    position.top = position.top || 0;
                    position.left = position.left || 0;

                    containmentTop = position.top.toString().indexOf("%") > 0 ?
                        parseInt(this.containment.height * (parseFloat(position.top) / 100), 10) :
                        position.top;

                    containmentLeft = position.left.toString().indexOf("%") > 0 ?
                        parseInt(this.containment.width * (parseFloat(position.left) / 100), 10) :
                        position.left;

                    position.top = constrain(containmentTop, this.minTop, this.maxTop);
                    position.left = constrain(containmentLeft, this.minLeft, this.maxLeft);
                }

                if (position.top && position.top.toString().indexOf("px") > 0) {
                    position.top = Number(position.top.replace("px", ""));
                }

                if (position.left && position.left.toString().indexOf("px") > 0) {
                    position.left = Number(position.left.replace("px", ""));
                }

                if (position.top === 0) {
                    position.top = position.top.toString();
                }

                if (position.left === 0) {
                    position.left = position.left.toString();
                }

                wrapper.css({
                    top: position.top || "",
                    left: position.left || ""
                });
            },

            _updateBoundaries: function() {
                var containment = this.containment;

                if (!containment) {
                    return null;
                }

                containment.width = containment.innerWidth();
                containment.height = containment.innerHeight();

                if (parseInt(containment.width, 10) > containment[0].clientWidth) {
                    containment.width -= kendo.support.scrollbar();
                }

                if (parseInt(containment.height, 10) > containment[0].clientHeight) {
                    containment.height -= kendo.support.scrollbar();
                }

                containment.position = getPosition(containment[0]);

                if (this._isPinned) {
                    this.minTop = this.minLeft = -Infinity;
                    this.maxTop = this.maxLeft = Infinity;
                } else {
                    this.minTop = containment.scrollTop();
                    this.minLeft = containment.scrollLeft();
                    this.maxLeft = this.minLeft + containment.width - outerWidth(this.wrapper, true);
                    this.maxTop = this.minTop + containment.height - outerHeight(this.wrapper, true);
                }
            },

            _animationOptions: function(id) {
                var animation = this.options.animation;
                var basicAnimation = {
                    open: { effects: {} },
                    close: { hide: true, effects: {} }
                };

                return animation && animation[id] || basicAnimation[id];
            },

            _resize: function() {
                kendo.resize(this.element.children());
            },

            _resizable: function() {
                var resizable = this.options.resizable;
                var wrapper = this.wrapper;

                if (this.resizing) {
                    wrapper
                        .off("dblclick" + NS)
                        .children(KWINDOWRESIZEHANDLES).remove();

                    this.resizing.destroy();
                    this.resizing = null;
                }

                if (resizable) {
                    wrapper.on("dblclick" + NS, KWINDOWTITLEBAR, (function(e) {
                        if (!$(e.target).closest(".k-window-titlebar-action").length) {
                            this.toggleMaximization();
                        }
                    }).bind(this));

                    each("n e s w se sw ne nw".split(" "), function(index, handler) {
                        wrapper.append(templates.resizeHandle(handler));
                    });

                    this.resizing = new WindowResizing(this);
                }

                wrapper = null;
            },

            _draggable: function() {
                var draggable = this.options.draggable;

                if (this.dragging) {
                    this.dragging.destroy();
                    this.dragging = null;
                }
                if (draggable) {
                    this.dragging = new WindowDragging(this, draggable.dragHandle || KWINDOWTITLEBAR);
                }
            },

            _actions: function() {
                var options = this.options;
                var actions = options.actions;
                var pinned = options.pinned;
                var titlebar = this.wrapper.children(KWINDOWTITLEBAR);
                var container = titlebar.find(".k-window-titlebar-actions");
                var windowSpecificCommands = [ "minimize", "maximize" ];
                var icons = {
                    "maximize": "window",
                    "refresh": "arrow-rotate-cw",
                    "custom": "gear"
                };
                var icon;

                actions = $.map(actions, function(action) {
                    action = pinned && action.toLowerCase() === "pin" ? "unpin" : action;
                    icon = icons[action.toLowerCase()] || "";
                    return { name: (windowSpecificCommands.indexOf(action.toLowerCase()) > - 1) ? "window-" + action : action, icon: action.toLowerCase() == "close" ? "x" : icon };
                });

                container.html(kendo.render(templates.action, actions));
            },

            setOptions: function(options) {
                var that = this;
                var sizeClass = that.options.size;
                var doc = this.containment && !that._isPinned ? this.containment : $(document);
                // make a deep extend over options.position telerik/kendo-ui-core#844
                var cachedOptions = JSON.parse(JSON.stringify(options));

                that.wrapper.removeClass(kendo.getValidCssClass("k-window-", "themeColor", that.options.themeColor));

                extend(options.position, that.options.position);
                extend(options.position, cachedOptions.position);

                that._containerScrollTop = doc.scrollTop();
                that._containerScrollLeft = doc.scrollLeft();

                Widget.fn.setOptions.call(that, options);
                var scrollable = that.options.scrollable !== false;

                that.restore();

                if (typeof options.title !== "undefined") {
                    that.title(options.title);
                }

                that.wrapper.removeClass(SIZE[sizeClass]);
                that._dimensions();

                that._position();
                that._resizable();
                that._draggable();
                that._actions();

                if (that.options.themeColor && that.options.themeColor !== "none") {
                    that.wrapper.addClass(kendo.getValidCssClass("k-window-", "themeColor", that.options.themeColor));
                }

                if (typeof options.modal !== "undefined") {
                    var visible = that.options.visible !== false;
                    that._enableDocumentScrolling();
                    that._overlay(options.modal && visible);
                }

                that.element.css(OVERFLOW, scrollable ? "" : "hidden");
            },

            events: [
                OPEN,
                ACTIVATE,
                DEACTIVATE,
                CLOSE,
                MINIMIZE,
                MAXIMIZE,
                REFRESH,
                RESTORE,
                RESIZESTART,
                RESIZE,
                RESIZEEND,
                DRAGSTART,
                DRAGEND,
                KENDOKEYDOWN,
                ERROR
            ],

            options: {
                name: "Window",
                animation: {
                    open: {
                        effects: { zoom: { direction: "in" }, fade: { direction: "in" } },
                        duration: 350
                    },
                    close: {
                        effects: { zoom: { direction: "out", properties: { scale: 0.7 } }, fade: { direction: "out" } },
                        duration: 350,
                        hide: true
                    }
                },
                title: "",
                themeColor: "",
                actions: ["Close"],
                autoFocus: true,
                modal: false,
                size: "auto",
                resizable: true,
                draggable: true,
                minWidth: 90,
                minHeight: 50,
                maxWidth: Infinity,
                maxHeight: Infinity,
                pinned: false,
                scrollable: true,
                position: {},
                content: null,
                visible: null,
                height: null,
                width: null,
                appendTo: "body",
                isMaximized: false,
                isMinimized: false
            },

            _closable: function() {
                return $.inArray("close", $.map(this.options.actions, function(x) { return x.toLowerCase(); })) > -1;
            },

            _keydownContent: function(e) {
                var that = this,
                    keys = kendo.keys,
                    keyCode = e.keyCode;

                if (keyCode == keys.ESC && that._closable()) {
                    e.stopPropagation();
                    that._close(false);
                }
            },

            _keydown: function(e) {
                var that = this,
                    options = that.options,
                    keys = kendo.keys,
                    keyCode = e.keyCode,
                    wrapper = that.wrapper,
                    offset, handled,
                    distance = 10,
                    isMaximized = options.isMaximized,
                    isMinimized = options.isMinimized,
                    newWidth, newHeight, w, h;

                if (keyCode == keys.ESC && that._closable()) {
                    e.stopPropagation();
                    that._close(false);
                }

                if (e.target != e.currentTarget || that._closing) {
                    return;
                }

                 // Refresh
                if (e.altKey && keyCode == 82) {// Alt + R
                    that.refresh();
                }

                // Pin/Unpin
                if (e.altKey && keyCode == 80) {// Alt + P
                    if (that.options.pinned) {
                        that.unpin();
                    } else {
                        that.pin();
                    }
                }

                // Maximize/Restore/Miminimize
                if (e.altKey && keyCode == keys.UP) {
                    if (isMinimized) {
                        that.restore();
                        that.wrapper.trigger("focus");
                    } else if (!isMaximized) {
                        that.maximize();
                        that.wrapper.trigger("focus");
                    }
                } else if (e.altKey && keyCode == keys.DOWN) {
                    if (!isMinimized && !isMaximized) {
                        that.minimize();
                        that.wrapper.trigger("focus");
                    } else if (isMaximized) {
                        that.restore();
                        that.wrapper.trigger("focus");
                    }
                }

                offset = kendo.getOffset(wrapper);

                if (that.containment && !that._isPinned) {
                    offset = that.options.position;
                }

                if (options.draggable && !e.ctrlKey && !e.altKey && !isMaximized) {
                    that._updateBoundaries();
                    if (keyCode == keys.UP) {
                        offset.top = constrain(offset.top - distance, that.minTop, that.maxTop);
                        handled = wrapper.css("top", offset.top);
                    } else if (keyCode == keys.DOWN) {
                        offset.top = constrain(offset.top + distance, that.minTop, that.maxTop);
                        handled = wrapper.css("top", offset.top);
                    } else if (keyCode == keys.LEFT) {
                        offset.left = constrain(offset.left - distance, that.minLeft, that.maxLeft);
                        handled = wrapper.css("left", offset.left);
                    } else if (keyCode == keys.RIGHT) {
                        offset.left = constrain(offset.left + distance, that.minLeft, that.maxLeft);
                        handled = wrapper.css("left", offset.left);
                    }
                }

                if (options.resizable && e.ctrlKey && !isMaximized && !isMinimized) {
                    if (keyCode == keys.UP) {
                        handled = true;
                        newHeight = wrapper.outerHeight() - distance;
                    } else if (keyCode == keys.DOWN) {
                        handled = true;
                        if (that.containment && !that._isPinned) {
                            newHeight = Math.min(wrapper.outerHeight() + distance,
                                that.containment.height - offset.top - toInt(wrapper, "padding-top") -
                                toInt(wrapper, "borderBottomWidth") - toInt(wrapper, "borderTopWidth"));
                        } else {
                            newHeight = wrapper.outerHeight() + distance;
                        }
                    } if (keyCode == keys.LEFT) {
                        handled = true;
                        newWidth = wrapper.outerWidth() - distance;
                    } else if (keyCode == keys.RIGHT) {
                        handled = true;
                        if (that.containment && !that._isPinned) {
                            newWidth = Math.min(wrapper.outerWidth() + distance,
                                                that.containment.width - offset.left -
                                                toInt(wrapper, "borderLeftWidth") - toInt(wrapper, "borderRightWidth"));
                        } else {
                            newWidth = wrapper.outerWidth() + distance;
                        }
                    }

                    if (handled) {
                        w = constrain(newWidth, options.minWidth, options.maxWidth);
                        h = constrain(newHeight, options.minHeight, options.maxHeight);

                        if (!isNaN(w)) {
                            wrapper.outerWidth(w);
                            that.options.width = w + "px";
                        }
                        if (!isNaN(h)) {
                            wrapper.outerHeight(h);
                            that.options.height = h + "px";
                        }

                        that.resize();
                    }
                }

                if (handled) {
                    e.preventDefault();
                }
            },

            _overlay: function(visible) {
                var overlay = this.containment ? this.containment.children(KOVERLAY) : this.appendTo.children(KOVERLAY),
                    wrapper = this.wrapper,
                    display = visible ? "inline-flex" : "none",
                    zIndex = parseInt(wrapper.css(ZINDEX), 10) - 1;

                if (!overlay.length) {
                    overlay = $("<div class='k-overlay' />");
                }

                overlay
                    .insertBefore(wrapper[0])
                    .css({
                        zIndex: zIndex,
                        display: display
                    });

                if (this.options.modal.preventScroll && !this.containment) {
                    this._stopDocumentScrolling();
                }

                return overlay;
            },

            _actionForIcon: function(icon) {
                var iconClass = /\bk(-svg)?-i(-\w+)+\b/.exec(icon[0].className)[0];
                return {
                    "x": "_close",
                    "window": "maximize",
                    "window-minimize": "minimize",
                    "window-restore": "restore",
                    "arrow-rotate-cw": "refresh",
                    "pin": "pin",
                    "unpin": "unpin"
                }[iconClass.replace(/(k-i-|k-svg-i-)/, "")];
            },

            _windowActionHandler: function(e) {
                if (this._closing) {
                    return;
                }
                var icon = $(e.target).closest(".k-window-titlebar-action").find(".k-icon,.k-svg-icon");
                var action = this._actionForIcon(icon);

                if (action) {
                    e.preventDefault();
                    this[action]();
                    return false;
                }
            },

            _modals: function() {
                var that = this,
                    windowElements = $(KWINDOW + VISIBLE),
                    windowInstance,
                    modals = [];

                for (var i = 0; i < windowElements.length; i += 1) {
                    windowInstance = that._object($(windowElements[i]));

                    if (windowInstance &&
                        windowInstance.options &&
                        windowInstance.options.modal &&
                        windowInstance.options.visible &&
                        windowInstance.options.appendTo === that.options.appendTo &&
                        (!windowInstance.containment || (that.containment && windowInstance.containment[0] === that.containment[0]))) {
                            modals.push(windowInstance.wrapper[0]);
                    }
                }

                modals.sort(function(a, b) {
                    return a.style.zIndex - b.style.zIndex;
                });

                that = null;

                return $(modals);
            },

            _object: function(element) {
                var content = element.children(KWINDOWCONTENT);
                var widget = kendo.widgetInstance(content);

                if (widget) {
                    return widget;
                }

                return undefined;
            },

            center: function() {
                var that = this,
                    position = that.options.position,
                    wrapper = that.wrapper,
                    documentWindow = $(window),
                    scrollTop = 0,
                    scrollLeft = 0,
                    newTop, newLeft;

                if (that.options.isMaximized) {
                    return that;
                }

                if (that.options.pinned && !that._isPinned) {
                    that.pin();
                }

                if (!that.options.pinned) {
                    scrollTop = documentWindow.scrollTop();
                    scrollLeft = documentWindow.scrollLeft();
                }

                if (this.containment && !that.options.pinned) {
                    newTop = this.minTop + (this.maxTop - this.minTop) / 2;
                    newLeft = this.minLeft + (this.maxLeft - this.minLeft) / 2;
                } else {
                    that._scrollIsAppended = true;
                    newLeft = scrollLeft + Math.max(0, (documentWindow.width() - wrapper.outerWidth()) / 2);
                    newTop = scrollTop + Math.max(0, (documentWindow.height() - wrapper.outerHeight() - toInt(wrapper, "paddingTop")) / 2);
                }

                wrapper.css({
                    left: newLeft,
                    top: newTop
                });

                position.top = newTop;
                position.left = newLeft;

                return that;
            },

            title: function(title) {
                var that = this,
                    value,
                    encoded = true,
                    wrapper = that.wrapper,
                    titleBar = wrapper.children(KWINDOWTITLEBAR),
                    titleElement = titleBar.children(KWINDOWTITLE);

                if (!arguments.length) {
                    return titleElement.html();
                }

                if ($.isPlainObject(title)) {
                    value = typeof title.text !== "undefined" ? title.text : "";
                    encoded = title.encoded !== false;
                } else {
                    value = title;
                }

                if (value === false) {
                    wrapper.addClass("k-window-titleless");
                    wrapper.css("padding-top", 0);
                    titleBar.remove();
                } else {
                    if (!titleBar.length) {
                        wrapper.prepend(templates.titlebar({
                            title: encoded ? kendo.htmlEncode(value) : value
                        }));
                        that._actions();
                        titleBar = wrapper.children(KWINDOWTITLEBAR);
                    } else {
                        titleElement.html(encoded ? kendo.htmlEncode(value) : value);
                    }
                }

                that.options.title = value;

                return that;
            },

            content: function(html, data) {
                var content = this.wrapper.children(KWINDOWCONTENT),
                    scrollContainer = content.children(".km-scroll-container");

                content = scrollContainer[0] ? scrollContainer : content;

                if (!defined(html)) {
                    return content.html();
                }

                this.angular("cleanup", function() {
                    return { elements: content.children() };
                });

                kendo.destroy(this.element.children());

                content.empty().html(html);

                this.angular("compile", function() {
                    var a = [];
                    for (var i = content.length; --i >= 0;) {
                        a.push({ dataItem: data });
                    }
                    return {
                        elements: content.children(),
                        data: a
                    };
                });

                return this;
            },

            open: function() {
                var that = this,
                    wrapper = that.wrapper,
                    options = that.options,
                    showOptions = this._animationOptions("open"),
                    contentElement = wrapper.children(KWINDOWCONTENT),
                    overlay, otherModalsVisible,
                    containmentContext = this.containment && !that._isPinned,
                    doc = containmentContext ? this.containment : $(document);

                if (!that.trigger(OPEN)) {
                    if (that._closing) {
                        wrapper.kendoStop(true, true);
                    }

                    that._closing = false;

                    that.toFront();

                    if (options.autoFocus) {
                        that.wrapper.trigger("focus");
                    }

                    options.visible = true;

                    if (options.modal) {
                        otherModalsVisible = !!that._modals().length;
                        overlay = that._overlay(otherModalsVisible);

                        overlay.kendoStop(true, true);

                        if (showOptions.duration && kendo.effects.Fade && !otherModalsVisible) {
                            var overlayFx = kendo.fx(overlay).fadeIn();
                            overlayFx.duration(showOptions.duration || 0);
                            overlayFx.endValue(0.5);
                            overlayFx.play();
                        } else {
                            overlay.css("opacity", 0.5);
                        }

                        overlay.show();

                        $(window).on("focus" + MODAL_NS, function() {
                            if (wrapper.data("isFront") && !$(document.activeElement).closest(wrapper).length) {
                               that.wrapper.trigger("focus");
                            }
                        });
                    }

                    if (!wrapper.is(VISIBLE)) {
                        contentElement.css(OVERFLOW, HIDDEN);

                        that.wrapper.find(TITLEBAR_BUTTONSSELECTOR).addClass("k-button-flat");

                        wrapper.css({ display: "inline-flex" });
                        wrapper.kendoStop().kendoAnimate({
                            effects: showOptions.effects,
                            duration: showOptions.duration,
                            complete: this._activate.bind(this)
                        });
                    }
                }

                if (options.isMaximized) {
                    that._containerScrollTop = doc.scrollTop();
                    that._containerScrollLeft = doc.scrollLeft();
                    that._stopDocumentScrolling();
                }

                if (this.options.pinned && !this._isPinned) {
                    this.pin();
                }

                return that;
            },

            _activate: function() {
                var scrollable = this.options.scrollable !== false;

                if (this.options.autoFocus) {
                    this.wrapper.trigger("focus");
                }

                this.element.css(OVERFLOW, scrollable ? "" : "hidden");
                kendo.resize(this.element.children());

                this.trigger(ACTIVATE);
            },

            _removeOverlay: function(suppressAnimation) {
                var modals = this._modals();
                var options = this.options;
                var hideOverlay = options.modal && !modals.length;
                var hideOptions = this._animationOptions("close");

                if (hideOverlay) {
                    if (!suppressAnimation && hideOptions.duration && kendo.effects.Fade) {
                        var overlayFx = kendo.fx(options.modal ? this._overlay(true) : $(undefined)).fadeOut();
                        overlayFx.duration(hideOptions.duration || 0);
                        overlayFx.startValue(0.5);
                        overlayFx.play();
                    } else {
                        this._overlay(false).remove();
                    }
                    if (options.modal.preventScroll) {
                        this._enableDocumentScrolling();
                    }
                } else if (modals.length) {
                    this._object(modals.last())._overlay(true);

                    if (options.modal.preventScroll) {
                        this._stopDocumentScrolling();
                    }
                }
            },

            _close: function(systemTriggered) {
                var that = this,
                    wrapper = that.wrapper,
                    options = that.options,
                    showOptions = this._animationOptions("open"),
                    hideOptions = this._animationOptions("close"),
                    containmentContext = this.containment && !that._isPinned,
                    doc = containmentContext ? this.containment : $(document),
                    defaultPrevented;

                if (that._closing) {
                    return;
                }

                defaultPrevented = that.trigger(CLOSE, { userTriggered: !systemTriggered });
                that._closing = !defaultPrevented;

                if (wrapper.is(VISIBLE) && !defaultPrevented) {
                    options.visible = false;

                    $(KWINDOW).each(function(i, element) {
                        var contentElement = $(element).children(KWINDOWCONTENT);

                        // Remove overlay set by toFront
                        if (element != wrapper && contentElement.find("> ." + KCONTENTFRAME).length > 0) {
                            contentElement.children(KOVERLAY).remove();
                        }
                    });

                    this._removeOverlay();

                    // Prevent close animation from stopping
                    that.wrapper.find(TITLEBAR_BUTTONSSELECTOR).removeClass("k-button-flat");

                    wrapper.kendoStop().kendoAnimate({
                        effects: hideOptions.effects || showOptions.effects,
                        reverse: hideOptions.reverse === true,
                        duration: hideOptions.duration,
                        complete: this._deactivate.bind(this)
                    });
                    $(window).off(MODAL_NS);
                }

                if (that.options.isMaximized) {
                    that._enableDocumentScrolling();
                    if (that._containerScrollTop && that._containerScrollTop > 0) {
                        doc.scrollTop(that._containerScrollTop);
                    }
                    if (that._containerScrollLeft && that._containerScrollLeft > 0) {
                        doc.scrollLeft(that._containerScrollLeft);
                    }
                }

                if (that.options.iframe) {
                    that.wrapper.trigger("blur");
                }
            },

            _deactivate: function() {
                var that = this;

                that.wrapper
                    .removeClass(INLINE_FLEX)
                    .hide()
                    .css("opacity", "");

                that.trigger(DEACTIVATE);

                if (that.options.modal) {
                    var lastModal = that._object(that._modals().last());
                    if (lastModal) {
                        lastModal.toFront();
                    }
                }
            },

            close: function() {
                this._close(true);
                return this;
            },

            _actionable: function(element) {
                return $(element).is(`${TITLEBAR_BUTTONSSELECTOR}, :input, a, .k-input, .k-icon, .k-svg-icon, [role='gridcell'], .k-input-value-text`);
            },

            _shouldFocus: function(target) {
                var active = activeElement(),
                    element = this.wrapper;

                return this.options.autoFocus &&
                    !$(active).is(element) &&
                    !this._actionable(target) &&
                    (!element.find(active).length || !element.find(target).length);
            },

            toFront: function(e, avoidFocus) {
                var that = this,
                    wrapper = that.wrapper,
                    currentWindow = wrapper[0],
                    containmentContext = that.containment && !that._isPinned,
                    openAnimation = this._animationOptions("open"),
                    zIndex = +wrapper.css(ZINDEX),
                    originalZIndex = zIndex,
                    target = (e && e.target) || null;

                $(KWINDOW).each(function(i, element) {
                    var windowObject = $(element),
                        zIndexNew = windowObject.css(ZINDEX),
                        contentElement = windowObject.children(KWINDOWCONTENT);

                    if (!isNaN(zIndexNew)) {
                        zIndex = Math.max(+zIndexNew, zIndex);
                    }

                    wrapper.data("isFront", element == currentWindow);
                    // Add overlay to windows with iframes and lower z-index to prevent
                    // trapping of events when resizing / dragging

                    if (element != currentWindow &&
                        contentElement.find("." + KCONTENTFRAME).length &&
                        !contentElement.find(KOVERLAY).length) {
                        contentElement.append(templates.overlay);
                    }
                });

                if (!wrapper[0].style.zIndex || originalZIndex < zIndex) {
                    wrapper.css(ZINDEX, zIndex + 2);
                }
                that.element.find("> .k-overlay").remove();

                if (that._shouldFocus(target)) {
                    if (!avoidFocus) {
                        setTimeout(function() {
                            that.wrapper.focus();
                        }, openAnimation ? openAnimation.duration : 0);
                    }

                    var scrollTop = containmentContext ? that.containment.scrollTop() : $(window).scrollTop(),
                        windowTop = parseInt(wrapper.position().top, 10);

                    if (!that.options.pinned && windowTop > 0 && windowTop < scrollTop) {
                        if (scrollTop > 0) {
                            $(window).scrollTop(windowTop);
                        } else {
                            wrapper.css("top", scrollTop);
                        }
                    }
                }

                wrapper = null;

                return that;
            },

            toggleMaximization: function() {
                if (this._closing) {
                    return this;
                }

                return this[this.options.isMaximized ? "restore" : "maximize"]();
            },

            restore: function() {
                var that = this;
                var options = that.options;
                var minHeight = options.minHeight;
                var restoreOptions = that.restoreOptions;
                var shouldRestrictTop;
                var container = that.containment && !that._isPinned ? that.containment : $(document);

                if (!options.isMaximized && !options.isMinimized) {
                    return that;
                }

                if (minHeight && minHeight != Infinity) {
                    that.wrapper.css("min-height", minHeight);
                }

                if (restoreOptions && !options.isMaximized) {
                    restoreOptions.height = constrain(restoreOptions.height, that.options.minHeight, that.options.maxHeight);

                    shouldRestrictTop = options.position.top + parseInt(restoreOptions.height, 10) > that.maxTop;

                    if (shouldRestrictTop) {
                        options.position.top = constrain(options.position.top, that.minTop, that.maxTop - parseInt(restoreOptions.height, 10));

                        extend(restoreOptions, {
                            left: options.position.left,
                            top: options.position.top
                        });
                    }
                }

                that.wrapper
                    .css({
                        position: options.pinned ? "fixed" : "absolute",
                        left: restoreOptions.left,
                        top: restoreOptions.top,
                        width: restoreOptions.width,
                        height: restoreOptions.height
                    })
                    .removeClass(MAXIMIZEDSTATE)
                    .removeClass(KWINDOWMINIMIZED)
                    .find(".k-window-content,.k-resize-handle").show().end()
                    .find(".k-window-titlebar .k-i-window-restore,.k-window-titlebar .k-svg-i-window-restore").parent().remove().end().end()
                    .find(MINIMIZE_MAXIMIZEICONSELECTORS).parent().show().end().end()
                    .find(PIN_UNPINICONCLASSSELECTOR).parent().show();

                if (options.isMaximized) {
                    that.wrapper.find(".k-i-window,.k-svg-i-window").parent().trigger("focus");
                } else if (options.isMinimized) {
                    that.wrapper.find(".k-i-window-minimize,.k-svg-i-window-minimize").parent().trigger("focus");
                }

                that.options.width = restoreOptions.width;
                that.options.height = restoreOptions.height;

                if (!that.options.modal.preventScroll) {
                    that._enableDocumentScrolling();
                }

                if (that._containerScrollTop && that._containerScrollTop > 0) {
                    container.scrollTop(that._containerScrollTop);
                }
                if (that._containerScrollLeft && that._containerScrollLeft > 0) {
                    container.scrollLeft(that._containerScrollLeft);
                }

                options.isMaximized = options.isMinimized = false;

                that.wrapper.removeAttr("aria-labelled-by");

                that.resize();

                that.trigger(RESTORE);

                return that;
            },

            _sizingAction: function(actionId, callback) {
                var that = this,
                    wrapper = that.wrapper,
                    style = wrapper[0].style,
                    options = that.options;

                if (options.isMaximized || options.isMinimized) {
                    return that;
                }

                that.restoreOptions = {
                    width: style.width,
                    height: style.height
                };

                wrapper
                    .children(KWINDOWRESIZEHANDLES).hide().end()
                    .children(KWINDOWTITLEBAR).find(MINIMIZE_MAXIMIZEICONSELECTORS).parent().hide()
                    .eq(0).before(templates.action({ name: "window-restore" }));

                callback.call(that);

                that.wrapper.children(KWINDOWTITLEBAR).find(PIN_UNPINICONCLASSSELECTOR).parent().toggle(actionId !== "maximize");

                that.trigger(actionId);

                wrapper.find(".k-i-window-restore,.k-svg-i-window-restore").parent().trigger("focus");

                return that;
            },

            maximize: function() {
                this._sizingAction("maximize", function() {
                    var that = this,
                        wrapper = that.wrapper,
                        containmentContext = this.containment && !that._isPinned,
                        position = wrapper.position(),
                        doc = $(document);

                    extend(that.restoreOptions, {
                        left: position.left + (containmentContext ? this.containment.scrollLeft() : 0),
                        top: position.top + (containmentContext ? this.containment.scrollTop() : 0)
                    });

                    this._containerScrollTop = containmentContext ? this.containment.scrollTop() : doc.scrollTop();
                    this._containerScrollLeft = containmentContext ? this.containment.scrollLeft() : doc.scrollLeft();

                    that._stopDocumentScrolling();

                    wrapper
                        .css({
                            top: containmentContext ? this.containment.scrollTop() : 0,
                            left: containmentContext ? this.containment.scrollLeft() : 0,
                            position: containmentContext ? "absolute" : "fixed"
                        })
                        .addClass(MAXIMIZEDSTATE);

                    that.options.isMaximized = true;

                    that._onDocumentResize();
                });

                return this;
            },

            _stopDocumentScrolling: function() {
                var that = this;
                var containment = that.containment;

                if (containment && !that._isPinned) {
                    that._storeOverflowRule(containment);
                    containment.css(OVERFLOW, HIDDEN);
                    that.wrapper.css({
                        maxWidth: containment.innerWidth(),
                        maxHeight: containment.innerHeight()
                    });
                    return;
                }

                var $body = $("body");
                that._storeOverflowRule($body);
                $body.css(OVERFLOW, HIDDEN);

                var $html = $("html");
                that._storeOverflowRule($html);
                $html.css(OVERFLOW, HIDDEN);
            },

            _enableDocumentScrolling: function() {
                var that = this;
                var containment = that.containment;

                if (containment && !that._isPinned) {
                    that._restoreOverflowRule(containment);
                    that.wrapper.css({
                        maxWidth: containment.width,
                        maxHeight: containment.height
                    });
                    return;
                }

                that._restoreOverflowRule($(document.body));
                that._restoreOverflowRule($("html"));
            },

            _storeOverflowRule: function($element) {
                if (this._isOverflowStored($element)) {
                    return;
                }

                var overflowRule = $element.get(0).style.overflow;

                if (typeof overflowRule === "string") {
                    $element.data(DATADOCOVERFLOWRULE, overflowRule);
                }
            },

            _isOverflowStored: function($element) {
                return typeof $element.data(DATADOCOVERFLOWRULE) === "string";
            },

            _restoreOverflowRule: function($element) {
                var overflowRule = $element.data(DATADOCOVERFLOWRULE);

                if (overflowRule !== null && overflowRule !== undefined) {
                    $element.css(OVERFLOW, overflowRule);
                    $element.removeData(DATADOCOVERFLOWRULE);
                } else {
                    $element.css(OVERFLOW, "");
                }
            },

            isMaximized: function() {
                return this.options.isMaximized;
            },

            minimize: function() {
                this._sizingAction("minimize", function() {
                    var that = this;

                    that.wrapper.css({
                        height: "",
                        minHeight: ""
                    });

                    that.element.hide();

                    that.options.isMinimized = true;
                });

                this.wrapper.attr("aria-labelled-by", this.element.attr("aria-labelled-by"));
                this.wrapper.addClass(KWINDOWMINIMIZED);

                this._updateBoundaries();

                return this;
            },

            isMinimized: function() {
                return this.options.isMinimized;
            },

            pin: function() {
                var that = this,
                    win = $(window),
                    wrapper = that.wrapper,
                    options = that.options,
                    position = options.position,
                    top = this.containment ? getPosition(wrapper[0]).top + toInt(this.containment, "borderTopWidth") : toInt(wrapper, "top"),
                    left = this.containment ? getPosition(wrapper[0]).left + toInt(this.containment, "borderLeftWidth") : toInt(wrapper, "left");

                if (!that.options.isMaximized) {
                    position.top = top;
                    position.left = left;

                    if (that._scrollIsAppended && (!this.containment || this.containment.css("position") !== "fixed")) {

                        position.top -= win.scrollTop();
                        position.left -= win.scrollLeft();
                        that._scrollIsAppended = false;
                    }

                    wrapper.css(extend(position, { position: "fixed" }));
                    var pinIcon = wrapper.children(KWINDOWTITLEBAR).find(KPINICONCLASSSELECTOR).eq(0);
                    if (pinIcon.length > 0) {
                        kendo.ui.icon(pinIcon, { icon: "unpin" });
                    }

                    that._isPinned = true;
                    that.options.pinned = true;

                    if (this.containment) {
                        options.maxWidth = options.maxHeight = Infinity;
                        wrapper.css({
                            maxWidth: "",
                            maxHeight: ""
                        });
                    }
                }
            },

            unpin: function() {
                var that = this,
                    win = $(window),
                    wrapper = that.wrapper,
                    options = that.options,
                    position = that.options.position,
                    containment = that.containment,
                    top = parseInt(wrapper.css("top"), 10) + win.scrollTop(),
                    left = parseInt(wrapper.css("left"), 10) + win.scrollLeft();

                if (!that.options.isMaximized) {
                    that._isPinned = false;
                    that._scrollIsAppended = true;
                    that.options.pinned = false;

                    if (containment) {
                        that._updateBoundaries();

                        options.maxWidth = Math.min(containment.width, options.maxWidth);
                        options.maxHeight = Math.min(containment.height - toInt(wrapper, "padding-top"), options.maxHeight);

                        wrapper.css({
                            maxWidth: options.maxWidth,
                            maxHeight: options.maxHeight
                        });

                        if (top < containment.position.top) {
                            top = that.minTop;
                        } else if (top > containment.position.top + containment.height) {
                            top = that.maxTop;
                        } else {
                            top = top + containment.scrollTop() - (containment.position.top + toInt(containment, "border-top-width"));
                        }

                        if (left < containment.position.left) {
                            left = that.minLeft;
                        } else if (left > containment.position.left + containment.width) {
                            left = that.maxLeft;
                        } else {
                            left = left + containment.scrollLeft() - (containment.position.left + toInt(containment, "border-left-width"));
                        }

                    }

                    position.top = constrain(top, that.minTop, that.maxTop);
                    position.left = constrain(left, that.minLeft, that.maxLeft);

                    wrapper.css(extend(position, { position: "" }));
                    var pinIcon = wrapper.children(KWINDOWTITLEBAR).find(KUNPINICONCLASSSELECTOR).eq(0);
                    if (pinIcon.length > 0) {
                        kendo.ui.icon(pinIcon, { icon: "pin" });
                    }
                }
            },

            _onDocumentResize: function() {
                var that = this,
                    wrapper = that.wrapper,
                    wnd = $(window),
                    zoomLevel = kendo.support.zoomLevel(),
                    contentBoxSizing = wrapper.css("box-sizing") == "content-box",
                    w, h;

                if (!that.options.isMaximized) {
                    return;
                }

                var lrBorderWidth = contentBoxSizing ? toInt(wrapper, "border-left-width") + toInt(wrapper, "border-right-width") : 0;
                var tbBorderWidth = contentBoxSizing ? toInt(wrapper, "border-top-width") + toInt(wrapper, "border-bottom-width") : 0;
                var paddingTop = contentBoxSizing ? toInt(wrapper, "padding-top") : 0;

                if (that.containment && !that._isPinned) {
                    w = that.containment.innerWidth() - lrBorderWidth;
                    h = that.containment.innerHeight() - (tbBorderWidth + paddingTop);
                } else {
                    w = wnd.width() / zoomLevel - lrBorderWidth;
                    h = wnd.height() / zoomLevel - (tbBorderWidth + paddingTop);
                }

                wrapper.css({
                    width: w,
                    height: h
                });
                that.options.width = w;
                that.options.height = h;

                that.resize();
            },

            refresh: function(options) {
                var that = this,
                    initOptions = that.options,
                    element = $(that.element),
                    iframe,
                    showIframe,
                    url;

                if (!isPlainObject(options)) {
                    options = { url: options };
                }

                options = extend(initOptions.content, options);

                showIframe = defined(initOptions.iframe) ? initOptions.iframe : options.iframe;

                url = options.url;

                if (url) {
                    if (!defined(showIframe)) {
                        showIframe = !isLocalUrl(url);
                    }

                    if (!showIframe) {
                        // perform AJAX request
                        that._ajaxRequest(options);
                    } else {
                        iframe = element.find("." + KCONTENTFRAME)[0];

                        if (iframe) {
                            // refresh existing iframe
                            iframe.src = url || iframe.src;
                        } else {
                            // render new iframe
                            element.html(templates.contentFrame(extend({}, initOptions, { content: options })));
                        }

                        element.find("." + KCONTENTFRAME)
                            .off("load" + NS)
                            .on("load" + NS, this._triggerRefresh.bind(this));
                    }
                } else {
                    if (options.template) {
                        // refresh template
                        that.content(template(options.template)({}));
                    }

                    that.trigger(REFRESH);
                }

                element.toggleClass("k-window-iframecontent", !!showIframe);

                return that;
            },

            _triggerRefresh: function() {
                this.trigger(REFRESH);
            },

            _ajaxComplete: function() {
                clearTimeout(this._loadingIconTimeout);
                this.wrapper.find(REFRESHICONSELECTOR).removeClass(LOADINGICONCLASS);
            },

            _ajaxError: function(xhr, status) {
                this.trigger(ERROR, { status: status, xhr: xhr });
            },

            _ajaxSuccess: function(contentTemplate) {
                return function(data) {
                    var html = data;
                    if (contentTemplate) {
                        html = template(contentTemplate)(data || {});
                    }

                    this.content(html, data);
                    this.element.prop("scrollTop", 0);

                    this.trigger(REFRESH);
                };
            },

            _showLoading: function() {
                this.wrapper.find(REFRESHICONSELECTOR).addClass(LOADINGICONCLASS);
            },

            _ajaxRequest: function(options) {
                this._loadingIconTimeout = setTimeout(this._showLoading.bind(this), 100);

                $.ajax(extend({
                    type: "GET",
                    dataType: "html",
                    cache: false,
                    error: this._ajaxError.bind(this),
                    complete: this._ajaxComplete.bind(this),
                    success: this._ajaxSuccess(options.template).bind(this)
                }, options));
            },

            _destroy: function() {
                if (this.resizing) {
                    this.resizing.destroy();
                }

                if (this.dragging) {
                    this.dragging.destroy();
                }

                this.wrapper.off(NS)
                    .children(KWINDOWCONTENT).off(NS).end()
                    .find(".k-resize-handle,.k-window-titlebar").off(NS);

                $(window).off("resize" + NS + this._marker);
                $(window).off(MODAL_NS);
                $(window).off(NS);

                clearTimeout(this._loadingIconTimeout);

                Widget.fn.destroy.call(this);

                this.unbind(undefined);

                kendo.destroy(this.wrapper);
            },

            destroy: function() {
                this._destroy();

                if (this.options.modal) {
                    this._removeOverlay(true);
                }

                this.wrapper.empty().remove();

                this.wrapper = this.appendTo = this.element = $();
            },

            _createWindow: function() {
                var contentHtml = this.element,
                    options = this.options,
                    iframeSrcAttributes,
                    wrapper,
                    isRtl = kendo.support.isRtl(contentHtml);

                if (options.scrollable === false) {
                    contentHtml.css("overflow", "hidden");
                }

                wrapper = $(templates.wrapper(options));

                // Collect the src attributes of all iframes and then set them to empty string.
                // This seems to fix this IE9 "feature": http://msdn.microsoft.com/en-us/library/gg622929%28v=VS.85%29.aspx?ppud=4
                iframeSrcAttributes = contentHtml.find("iframe:not(.k-content-frame)").map(function() {
                    var src = this.getAttribute("src");
                    this.src = "";
                    return src;
                });

                // Make sure the wrapper is appended to the body only once. IE9+ will throw exceptions if you move iframes in DOM
                wrapper
                    .toggleClass("k-rtl", isRtl)
                    .attr("tabindex", 0)
                    .append(contentHtml)
                    .find("iframe:not(.k-content-frame)").each(function(index) {
                    // Restore the src attribute of the iframes when they are part of the live DOM tree
                    this.src = iframeSrcAttributes[index];
                });

                if (this.containment) {
                    this.containment.prepend(wrapper);
                } else if (this.appendTo) {
                    wrapper.appendTo(this.appendTo);
                }

                wrapper.find(".k-window-title")
                    .css(isRtl ? "left" : "right", outerWidth(wrapper.find(".k-window-titlebar-actions")) + 10);

                contentHtml.css("visibility", "").show();

                contentHtml.find("[data-role=editor]").each(function() {
                    var editor = $(this).data("kendoEditor");

                    if (editor) {
                        editor.refresh();
                    }
                });

                wrapper = contentHtml = null;
            }
        });

        templates = {
            wrapper: template(() => "<div class='k-window'></div>"),
            action: template(({ name, icon }) => {
                let iconName = (icon || "").toLowerCase() || name.toLowerCase();
                if (iconName == "restore") { iconName = "window-restore"; }

                return kendo.html.renderButton(`<button role='button' class='k-window-titlebar-action' aria-label='${name}'></button>`, { icon: iconName, fillMode: "flat" });
            }),
            titlebar: template(({ title }) =>
                "<div class='k-window-titlebar k-hstack'>" +
                    `<span class='k-window-title'>${title}</span>` +
                    "<div class='k-window-titlebar-actions'></div>" +
                "</div>"
            ),
            overlay: "<div class='k-overlay'></div>",
            contentFrame: template(({ title, content }) =>
                `<iframe frameborder='0' title='${title}' class='${KCONTENTFRAME}' ` +
                `src='${content.url}'>` +
                "This page requires frames in order to show content" +
                "</iframe>"
            ),
            resizeHandle: template((data) => `<div aria-hidden='true' class='k-resize-handle k-resize-${data}'></div>`)
        };


        function WindowResizing(wnd) {
            var that = this;
            that.owner = wnd;
            that._preventDragging = false;
            that._draggable = new Draggable(wnd.wrapper, {
                filter: ">" + KWINDOWRESIZEHANDLES,
                group: wnd.wrapper.id + "-resizing",
                dragstart: that.dragstart.bind(that),
                drag: that.drag.bind(that),
                dragend: that.dragend.bind(that)
            });

            that._draggable.userEvents.bind("press", that.addOverlay.bind(that));
            that._draggable.userEvents.bind("release", that.removeOverlay.bind(that));
        }

        WindowResizing.prototype = {
            addOverlay: function() {
                this.owner.wrapper.append(templates.overlay);
            },
            removeOverlay: function() {
                this.owner.wrapper.find(KOVERLAY).remove();
            },
            dragstart: function(e) {
                var that = this;
                var wnd = that.owner;
                var wrapper = wnd.wrapper;

                that._preventDragging = wnd.trigger(RESIZESTART);
                if (that._preventDragging) {
                    return;
                }

                that.elementPadding = parseInt(wrapper.css("padding-top"), 10);
                that.initialPosition = kendo.getOffset(wrapper, "position");

                that.resizeDirection = e.currentTarget.prop("className").replace("k-resize-handle k-resize-", "");

                that.initialSize = {
                    width: wrapper.outerWidth(),
                    height: wrapper.outerHeight()
                };

                wnd._updateBoundaries();

                that.containerOffset = wnd.containment ? wnd.containment.position : kendo.getOffset(wnd.appendTo);

                var offsetParent = wrapper.offsetParent();

                if (offsetParent.is("html")) {
                    that.containerOffset.top = that.containerOffset.left = 0;
                } else {
                    var marginTop = offsetParent.css("margin-top");
                    var marginLeft = offsetParent.css("margin-left");
                    var hasMargin = !zero.test(marginTop) || !zero.test(marginLeft);
                    if (hasMargin) {
                        var wrapperPosition = getPosition(wrapper[0]);
                        var relativeElMarginLeft = wrapperPosition.left - that.containerOffset.left - that.initialPosition.left;
                        var relativeElMarginTop = wrapperPosition.top - that.containerOffset.top - that.initialPosition.top;

                        that._relativeElMarginLeft = relativeElMarginLeft > 1 ? relativeElMarginLeft : 0;
                        that._relativeElMarginTop = relativeElMarginTop > 1 ? relativeElMarginTop : 0;

                        that.initialPosition.left += that._relativeElMarginLeft;
                        that.initialPosition.top += that._relativeElMarginTop;
                    }
                }

                wrapper
                    .children(KWINDOWRESIZEHANDLES).not(e.currentTarget).hide();

                $(BODY).css(CURSOR, e.currentTarget.css(CURSOR));
            },
            drag: function(e) {
                if (this._preventDragging) {
                    return;
                }
                var that = this,
                    wnd = that.owner,
                    wrapper = wnd.wrapper,
                    options = wnd.options,
                    position = options.position,
                    direction = that.resizeDirection,
                    containerOffset = that.containerOffset,
                    initialPosition = that.initialPosition,
                    initialSize = that.initialSize,
                    containmentContext = wnd.containment && !wnd._isPinned,
                    rtl = kendo.support.isRtl(wnd.containment),
                    leftRtlOffset = containmentContext && rtl && wnd.containment.innerWidth() > wnd.containment.width ? kendo.support.scrollbar() : 0,
                    scrollOffset = containmentContext ? { top: wnd.containment.scrollTop(), left: wnd.containment.scrollLeft() } : { top: 0, left: 0 },
                    newWidth, newHeight,
                    windowBottom, windowRight,
                    x = Math.max(e.x.location, 0),
                    y = Math.max(e.y.location, 0);

                    if (direction.indexOf("e") >= 0) {

                        if (wnd.containment && x - initialSize.width >= wnd.maxLeft - scrollOffset.left + containerOffset.left + leftRtlOffset) {
                            newWidth = wnd.maxLeft + leftRtlOffset - initialPosition.left + initialSize.width - scrollOffset.left;
                        } else {
                            newWidth = x - initialPosition.left - containerOffset.left;
                        }

                        wrapper.outerWidth(constrain(newWidth, options.minWidth, options.maxWidth));
                    } else if (direction.indexOf("w") >= 0) {
                        windowRight = initialPosition.left + initialSize.width + containerOffset.left;
                        newWidth = constrain(windowRight - x, options.minWidth, options.maxWidth);
                        position.left = windowRight - newWidth - containerOffset.left - leftRtlOffset - (that._relativeElMarginLeft || 0) + scrollOffset.left;

                        if (wnd.containment && position.left <= wnd.minLeft) {
                            position.left = wnd.minLeft;
                            newWidth = constrain(windowRight - leftRtlOffset - position.left - containerOffset.left + scrollOffset.left, options.minWidth, options.maxWidth);
                        }

                        wrapper.css({
                            left: position.left,
                            width: newWidth
                        });
                    }

                    var newWindowTop = y;
                    if (wnd.options.pinned) {
                        newWindowTop -= $(window).scrollTop();
                    }
                    if (direction.indexOf("s") >= 0) {
                        newHeight = newWindowTop - initialPosition.top - that.elementPadding - containerOffset.top;

                        if (newWindowTop - initialSize.height - that.elementPadding >= wnd.maxTop + containerOffset.top - scrollOffset.top) {
                            newHeight = wnd.maxTop - initialPosition.top + initialSize.height - scrollOffset.top;
                        }

                        wrapper.outerHeight(constrain(newHeight, options.minHeight, options.maxHeight));
                    } else if (direction.indexOf("n") >= 0) {
                        windowBottom = initialPosition.top + initialSize.height + containerOffset.top;
                        newHeight = constrain(windowBottom - newWindowTop, options.minHeight, options.maxHeight);
                        position.top = windowBottom - newHeight - containerOffset.top - (that._relativeElMarginTop || 0) + scrollOffset.top;

                        if (position.top <= wnd.minTop && wnd.containment) {
                            position.top = wnd.minTop;
                            newHeight = constrain(windowBottom - position.top - containerOffset.top + scrollOffset.top, options.minHeight, options.maxHeight);
                        }

                        wrapper.css({
                            top: position.top,
                            height: newHeight
                        });
                    }

                    if (newWidth) {
                        wnd.options.width = newWidth + "px";
                    }
                    if (newHeight) {
                        wnd.options.height = newHeight + "px";
                    }

                    wnd.resize();
            },
            dragend: function(e) {
                if (this._preventDragging) {
                    return;
                }

                var that = this,
                    wnd = that.owner,
                    wrapper = wnd.wrapper;

                wrapper
                    .children(KWINDOWRESIZEHANDLES).not(e.currentTarget).show();

                $(BODY).css(CURSOR, "");

                if (wnd.touchScroller) {
                    wnd.touchScroller.reset();
                }

                if (e.keyCode == 27) {
                    wrapper.css(that.initialPosition)
                        .css(that.initialSize);
                }

                wnd.trigger(RESIZEEND);

                return false;
            },
            destroy: function() {
                if (this._draggable) {
                    this._draggable.destroy();
                }

                this._draggable = this.owner = null;
            }
        };

        function WindowDragging(wnd, dragHandle) {
            var that = this;
            that.owner = wnd;
            that._preventDragging = false;
            that._draggable = new Draggable(wnd.wrapper, {
                filter: dragHandle,
                group: wnd.wrapper.id + "-moving",
                dragstart: that.dragstart.bind(that),
                drag: that.drag.bind(that),
                dragend: that.dragend.bind(that),
                dragcancel: that.dragcancel.bind(that)
            });

            that._draggable.userEvents.stopPropagation = false;
        }

        WindowDragging.prototype = {
            dragstart: function(e) {
                var wnd = this.owner,
                    draggable = wnd.options.draggable,
                    element = wnd.element,
                    actions = element.find(".k-window-titlebar-actions"),
                    containerOffset = kendo.getOffset(wnd.appendTo);

                this._preventDragging = wnd.trigger(DRAGSTART) || !draggable;
                if (this._preventDragging || wnd.isMaximized()) {
                    return;
                }

                wnd.initialWindowPosition = kendo.getOffset(wnd.wrapper, "position");

                wnd.initialPointerPosition = {
                    left: wnd.options.position.left,
                    top: wnd.options.position.top
                };

                wnd.startPosition = {
                    left: e.x.client - wnd.initialWindowPosition.left,
                    top: e.y.client - wnd.initialWindowPosition.top
                };

                wnd._updateBoundaries();
                if (!wnd.containment) {
                    if (actions.length > 0) {
                        wnd.minLeft = outerWidth(actions) + parseInt(actions.css("right"), 10) - outerWidth(element);
                    } else {
                        wnd.minLeft = 20 - outerWidth(element); // at least 20px remain visible
                    }

                    wnd.minLeft -= containerOffset.left;
                    wnd.minTop = -containerOffset.top;
                }

                $(templates.overlay).appendTo(wnd.wrapper).css({ opacity: 0 });

                wnd.wrapper.children(KWINDOWRESIZEHANDLES).hide();

                $(BODY).css(CURSOR, e.currentTarget.css(CURSOR));
            },

            drag: function(e) {
                var wnd = this.owner;
                var position = wnd.options.position;
                var axis = wnd.options.draggable.axis;
                var left;
                var top;

                if (this._preventDragging || wnd.isMaximized()) {
                    return;
                }

                if (!axis || axis.toLowerCase() === "x") {
                    left = e.x.client - wnd.startPosition.left;

                    if (wnd.containment && !wnd._isPinned) {
                        left += wnd.containment.scrollLeft();
                    }

                    position.left = constrain(left, wnd.minLeft, wnd.maxLeft);
                }

                if (!axis || axis.toLowerCase() === "y") {
                    top = e.y.client - wnd.startPosition.top;

                    if (wnd.containment && !wnd._isPinned) {
                        top += wnd.containment.scrollTop();
                    }

                    position.top = constrain(top, wnd.minTop, wnd.maxTop);
                }

                if (kendo.support.transforms) {
                    $(wnd.wrapper).css(
                        "transform", "translate(" +
                        (position.left - wnd.initialPointerPosition.left) + "px, " +
                        (position.top - wnd.initialPointerPosition.top) + "px)"
                    );
                } else {
                    $(wnd.wrapper).css(position);
                }

            },

            _finishDrag: function() {
                var wnd = this.owner;

                wnd.wrapper
                    .children(KWINDOWRESIZEHANDLES).toggle(!wnd.options.isMinimized).end()
                    .find(KOVERLAY).remove();

                $(BODY).css(CURSOR, "");
            },

            dragcancel: function(e) {
                if (this._preventDragging) {
                    return;
                }
                this._finishDrag();

                e.currentTarget.closest(KWINDOW).css(this.owner.initialWindowPosition);
            },

            dragend: function() {
                var wnd = this.owner;

                if (this._preventDragging || wnd.isMaximized()) {
                    return;
                }

                $(wnd.wrapper)
                    .css(wnd.options.position)
                    .css("transform", "");

                this._finishDrag();

                wnd.trigger(DRAGEND);

                return false;
            },
            destroy: function() {
                if (this._draggable) {
                    this._draggable.destroy();
                }

                this._draggable = this.owner = null;
            }
        };

        kendo.ui.plugin(Window);

    })(window.kendo.jQuery);

