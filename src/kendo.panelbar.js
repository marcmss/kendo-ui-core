import "./kendo.data.js";
import "./kendo.icons.js";

var __meta__ = {
    id: "panelbar",
    name: "PanelBar",
    category: "web",
    description: "The PanelBar widget displays hierarchical data as a multi-level expandable panel bar.",
    depends: ["core", "data", "data.odata", "icons"]
};

(function($, undefined) {
    var kendo = window.kendo,
        ui = kendo.ui,
        keys = kendo.keys,
        extend = $.extend,
        encode = kendo.htmlEncode,
        each = $.each,
        isArray = Array.isArray,
        template = kendo.template,
        Widget = ui.Widget,
        HierarchicalDataSource = kendo.data.HierarchicalDataSource,
        excludedNodesRegExp = /^(ul|a|div)$/i,
        NS = ".kendoPanelBar",
        IMG = "img",
        HREF = "href",
        LAST = "k-last",
        LINK = "k-link",
        LINKSELECTOR = "." + LINK,
        ERROR = "error",
        ITEM = ".k-panelbar-item",
        GROUP = ".k-group",
        VISIBLEGROUP = GROUP + ":visible",
        IMAGE = "k-image",
        FIRST = "k-first",
        CHANGE = "change",
        EXPAND = "expand",
        SELECT = "select",
        CLICK = "click",
        CONTENT = "k-content",
        ACTIVATE = "activate",
        COLLAPSE = "collapse",
        DATABOUND = "dataBound",
        MOUSEENTER = "mouseenter",
        MOUSELEAVE = "mouseleave",
        CONTENTLOAD = "contentLoad",
        UNDEFINED = "undefined",
        ACTIVECLASS = "k-active",
        EXPANDEDCLASS = "k-expanded",
        GROUPS = "> .k-panel",
        CONTENTS = "> .k-content",
        STRING = "string",
        FOCUSEDCLASS = "k-focus",
        DISABLEDCLASS = "k-disabled",
        SELECTEDCLASS = "k-selected",
        SELECTEDSELECTOR = "." + SELECTEDCLASS,
        HIGHLIGHTCLASS = "k-highlight",
        ACTIVEITEMSELECTOR = ITEM + ":not(.k-disabled)",
        clickableItems = "> " + ACTIVEITEMSELECTOR + " > " + LINKSELECTOR + ", .k-panel > " + ACTIVEITEMSELECTOR + " > " + LINKSELECTOR,
        disabledItems = ITEM + ".k-disabled > .k-link",
        selectableItems = "> li > " + SELECTEDSELECTOR + ", .k-panel > li > " + SELECTEDSELECTOR,
        ARIA_DISABLED = "aria-disabled",
        ARIA_EXPANDED = "aria-expanded",
        ARIA_HIDDEN = "aria-hidden",
        ARIA_SELECTED = "aria-selected",
        VISIBLE = ":visible",
        EMPTY = ":empty",
        SINGLE = "single",
        bindings = {
            text: "dataTextField",
            url: "dataUrlField",
            spriteCssClass: "dataSpriteCssClassField",
            imageUrl: "dataImageUrlField"
        },
        itemIcon,
        rendering = {
        aria: function(item) {
            var attr = "";

            if (item.items || item.content || item.contentUrl || item.expanded) {
                attr += ARIA_EXPANDED + "='" + (item.expanded ? "true" : "false") + "' ";
            }

            if (item.enabled === false) {
                attr += ARIA_DISABLED + "='true'";
            }

            return attr;
        },

    wrapperCssClass: function(group, item) {
        var result = "k-panelbar-item",
            index = item.index;

        if (group.firstLevel) {
            result += " k-panelbar-header";
        }

        if (item.enabled === false) {
            result += " " + DISABLEDCLASS;
        } else if (item.expanded === true) {
            result += " " + ACTIVECLASS;
            result += " " + EXPANDEDCLASS;
        }

        if (index === 0) {
            result += " k-first";
        }

        if (index == group.length - 1) {
            result += " k-last";
        }

        if (item.cssClass) {
            result += " " + item.cssClass;
        }

        if (item.level) {
            result += " k-level-" + item.level();
        }

        return result;
    },

    textClass: function(item) {
        var result = LINK;

        if (item.selected) {
            result += " " + SELECTEDCLASS;
        }

        return result;
    },
    textAttributes: function(url) {
        return url ? " href='" + url + "'" : "";
    },
    arrowIconOptions: function(item) {
        return {
            icon: item.expanded ? "chevron-up" : "chevron-down",
            iconClass: `k-panelbar-toggle k-panelbar-${item.expanded ? "collapse" : "expand"}`
        };
    },
    text: function(item) {
         return item.encoded === false ? item.text : kendo.htmlEncode(item.text);
    },
    groupAttributes: function(group) {
        return group.expanded !== true ? " style='display:none'" : "";
    },
    ariaHidden: function(group) {
        return group.expanded !== true;
    },
    groupCssClass: function() {
        return "k-panelbar-group k-group k-panel";
    },
    contentAttributes: function(content) {
        return content.item.expanded !== true ? " style='display:none'" : "";
    },
    content: function(item) {
        return item.content ? item.content : item.contentUrl ? "" : "&nbsp;";
    },
    contentUrl: function(item) {
        return item.contentUrl ? 'href="' + item.contentUrl + '"' : "";
    }
};

    function updateFirstLast(items) {
        items = $(items);

        items.filter(".k-first:not(:first-child)").removeClass(FIRST);
        items.filter(".k-last:not(:last-child)").removeClass(LAST);
        items.filter(":first-child").addClass(FIRST);
        items.filter(":last-child").addClass(LAST);
    }

    function updateLevel(item) {
        item = $(item);

        item.addClass("k-level-" + item.parentsUntil(".k-panelbar", "ul").length);
    }

     function updateItemHtml(item) {
        var wrapper = item,
            group = item.children("ul"),
            toggleButton = wrapper.children(".k-link").children(".k-panelbar-toggle");

        if (item.hasClass("k-panelbar")) {
            return;
        }

        if (!toggleButton.length && group.length) {
            toggleButton = $("<span class='k-panelbar-toggle' />").appendTo(wrapper);
        } else if (!group.length || !group.children().length) {
            toggleButton.remove();
            group.remove();
        }
     }

    itemIcon = function(item) {
        return item.children("span").children(".k-panelbar-toggle");
    };

    var PanelBar = kendo.ui.DataBoundWidget.extend({
        init: function(element, options) {
            var that = this,
                content,
                hasDataSource;

           if (isArray(options)) {
                options = { dataSource: options };
           }

            hasDataSource = options && !!options.dataSource;

            Widget.fn.init.call(that, element, options);

            element = that.wrapper = that.element.addClass("k-panelbar");
            options = that.options;

            if (element[0].id) {
                that._itemId = element[0].id + "_pb_active";
            }

            that._tabindex();

            that._accessors();

            that._dataSource();

            that._templates();

            that._initData(hasDataSource);

            that._updateClasses();

            that._animations(options);

            element
                .on(CLICK + NS, clickableItems, that._click.bind(that))
                .on(MOUSEENTER + NS + " " + MOUSELEAVE + NS, clickableItems, that._toggleHover)
                .on(CLICK + NS, disabledItems, false)
                .on(CLICK + NS, ".k-request-retry", that._retryRequest.bind(that))
                .on("keydown" + NS, that._keydown.bind(that))
                .on("focus" + NS, function() {
                    var item = that.select();
                    that._current(item[0] ? item : that._first());
                })
                .on("blur" + NS, function() {
                    that._current(null);
                })
                .attr("role", "tree");

            content = element.find("li." + ACTIVECLASS + " > ." + CONTENT);

            if (content[0]) {
                that.expand(content.parent(), false);
            }

            if (!options.dataSource) {
                that._angularCompile();
            }

            kendo.notify(that);
        },

        events: [
            EXPAND,
            COLLAPSE,
            SELECT,
            ACTIVATE,
            CHANGE,
            ERROR,
            DATABOUND,
            CONTENTLOAD
        ],
        options: {
            name: "PanelBar",
            dataSource: {},
            animation: {
                expand: {
                    effects: "expand:vertical",
                    duration: 200
                },
                collapse: { // if collapse animation effects are defined, they will be used instead of expand.reverse
                    duration: 200
                }
            },
            messages: {
                loading: "Loading...",
                requestFailed: "Request failed.",
                retry: "Retry"
            },
            autoBind: true,
            loadOnDemand: true,
            expandMode: "multiple",
            template: null,
            dataTextField: null
        },

        _angularCompile: function() {
            var that = this;
            that.angular("compile", function() {
                return {
                    elements: that.element.children("li"),
                    data: [{ dataItem: that.options.$angular }]
                };
            });
        },

        _angularCompileElements: function(html, items) {
            var that = this;
            that.angular("compile", function() {
                return {
                    elements: html,
                    data: $.map(items, function(item) {
                        return [{ dataItem: item }];
                    })
                };
            });
        },

        _angularCleanup: function() {
            var that = this;

            that.angular("cleanup", function() {
                return { elements: that.element.children("li") };
            });
        },

        destroy: function() {
            Widget.fn.destroy.call(this);

            this.element.off(NS);

            this._angularCleanup();

            kendo.destroy(this.element);
        },

        _initData: function(hasDataSource) {
            var that = this;

            if (hasDataSource) {
                that.element.empty();
                 if (that.options.autoBind) {
                    that._progress(true);

                    that.dataSource.fetch();
                 }
            }
        },

        _templates: function() {
            var that = this,
                options = that.options,
                fieldAccessor = that._fieldAccessor.bind(that);

              if (options.template && typeof options.template == STRING) {
                    options.template = template(options.template);
              } else if (!options.template) {
                  options.template = template((data) => {
                      var text = fieldAccessor("text")(data.item);
                      if (typeof data.item.encoded != 'undefined' && data.item.encoded === false) {
                          return `<span class='k-panelbar-item-text'>${text}</span>`;
                      } else {
                          return `<span class='k-panelbar-item-text'>${encode(text)}</span>`;
                      }
                  });
                }

            that.templates = {
                content: template(
                   ({ data, item, contentAttributes, content }) => `<div class='k-panelbar-content k-content'${contentAttributes({ data, item, contentAttributes, content })}>${content(item)}</div>`
                ),
                group: template( ({ data, items, group, renderItems, panelBar, ariaHidden, groupCssClass, groupAttributes }) =>
                    `<ul role='group' aria-hidden='${ariaHidden(group)}' class='${groupCssClass(group)}' ${groupAttributes(group)}>` +
                        renderItems({ data, items, group, renderItems, panelBar, ariaHidden, groupCssClass, groupAttributes }) +
                    "</ul>"
                ),
                itemWrapper: template(({ panelBar, item, arrow, textClass, arrowIconOptions, textAttributes, contentUrl }) => {
                     var url = fieldAccessor("url")(item);
                     var imageUrl = fieldAccessor("imageUrl")(item);
                     var spriteCssClass = fieldAccessor("spriteCssClass")(item);
                     var contentUrl = contentUrl(item);
                     var tag = url || contentUrl ? 'a' : 'span';

                    return `<${tag} class='${textClass(item)}' ${contentUrl}${textAttributes(url)}>` +
                        (imageUrl ? `<img class='k-panelbar-item-icon k-image' alt='' src='${imageUrl}' />` : '') +
                        (spriteCssClass ? `<span class='k-sprite ${spriteCssClass}'></span>` : '') +
                        panelBar.options.template({ panelBar, item, arrow, textClass, textAttributes, contentUrl }) +
                        arrow({ panelBar, item, arrow, textClass, arrowIconOptions, textAttributes, contentUrl }) +
                    `</${tag}>`;
                }),

                item: template(({ data, group, item, panelBar, itemWrapper, renderContent, arrow, arrowIconOptions, subGroup, aria, wrapperCssClass, contentUrl, textClass, textAttributes }) =>
                    `<li aria-selected='false' role='treeitem' ${aria(item)}class='${wrapperCssClass(group, item)}' ` +
                    kendo.attr("uid") + `='${item.uid}'>` +
                        itemWrapper({ data, group, item, panelBar, itemWrapper, renderContent, arrow, arrowIconOptions, subGroup, aria, wrapperCssClass, contentUrl, textClass, textAttributes }) +
                        ((item.items && item.items.length > 0) ?
                        subGroup({ items: item.items, panelBar: panelBar, group: { expanded: item.expanded } })
                        : ((item.content || item.contentUrl) ?
                        renderContent({ data, group, item, panelBar, itemWrapper, renderContent, arrow, arrowIconOptions, subGroup, aria, wrapperCssClass, contentUrl, textClass, textAttributes })
                        : "")
                        ) +
                    "</li>"
                ),
                loading: template(({ messages }) => `<li class='k-panelbar-item'><span class='k-icon k-i-loading'></span> ${encode(messages.loading)}</li>`),
                retry: template(({ messages }) =>
                    "<li class='k-panelbar-item'>" +
                        `${encode(messages.requestFailed)} ` +
                        `<button class='k-button k-button-md k-rounded-md k-button-solid k-button-solid-base k-request-retry'><span class='k-button-text'>${encode(messages.retry)}</span></button>` +
                    "</li>"
                ),
                arrow: template(({ item, arrowIconOptions }) => kendo.ui.icon(arrowIconOptions(item))),
                empty: template(() => "")
            };
        },

        setOptions: function(options) {
            var animation = this.options.animation;

            this._animations(options);

            options.animation = extend(true, animation, options.animation);

            if ("dataSource" in options) {
                this.setDataSource(options.dataSource);
            }

            Widget.fn.setOptions.call(this, options);
        },

        expand: function(element, useAnimation) {
            var that = this,
                animBackup = {};

            element = this.element.find(element);

            if (that._animating && element.find("ul").is(":visible")) {
                that.one("complete", function() {
                    setTimeout(function() {
                        that.expand(element);
                    });
                });
                return;
            }
            that._animating = true;

            useAnimation = useAnimation !== false;

            element.each(function(index, item) {
                item = $(item);
                var wrapper = element.children(".k-group,.k-content");

                if (!wrapper.length) {
                    wrapper = that._addGroupElement(element);
                }

                 var groups = wrapper.add(item.find(CONTENTS));

                if (!item.hasClass(DISABLEDCLASS) && groups.length > 0) {

                    if (that.options.expandMode == SINGLE && that._collapseAllExpanded(item)) {
                        return that;
                    }

                    element.find("." + HIGHLIGHTCLASS).removeClass(HIGHLIGHTCLASS);
                    item.addClass(HIGHLIGHTCLASS);

                    if (!useAnimation) {
                        animBackup = that.options.animation;
                        that.options.animation = { expand: { effects: {} }, collapse: { hide: true, effects: {} } };
                    }

                    if (!that._triggerEvent(EXPAND, item)) {
                        that._toggleItem(item, false, false);
                    }

                    if (!useAnimation) {
                        that.options.animation = animBackup;
                    }
                }
            });

            return that;
        },

        collapse: function(element, useAnimation) {
            var that = this,
                animBackup = {};

            that._animating = true;

            useAnimation = useAnimation !== false;
            element = that.element.find(element);

            element.each(function(index, item) {
                item = $(item);
                var groups = item.find(GROUPS).add(item.find(CONTENTS));

                if (!item.hasClass(DISABLEDCLASS) && groups.is(VISIBLE)) {
                    item.removeClass(HIGHLIGHTCLASS);

                    if (!useAnimation) {
                        animBackup = that.options.animation;
                        that.options.animation = { expand: { effects: {} }, collapse: { hide: true, effects: {} } };
                    }

                    if (!that._triggerEvent(COLLAPSE, item)) {
                        that._toggleItem(item, true);
                    }

                    if (!useAnimation) {
                        that.options.animation = animBackup;
                    }
                }

            });
            return that;
        },

         updateArrow: function(items) {
                var that = this;

                items = $(items);
                items.children(LINKSELECTOR).children(".k-panelbar-collapse, .k-panelbar-expand").remove();

                items
                    .filter(function() {
                        var dataItem = that.dataItem(this);

                        if (!dataItem) {
                            return $(this).find(".k-panel").length > 0 ||
                                $(this).find(".k-content").length > 0;
                        }

                        return dataItem.hasChildren || dataItem.content || dataItem.contentUrl;
                    })
                    .children(".k-link:not(:has([class*=-i-chevron]))")
                    .each(function() {
                        var item = $(this),
                            parent = item.parent();
                        let icon = kendo.ui.icon({
                            icon: parent.hasClass(ACTIVECLASS) ? "chevron-up" : "chevron-down",
                            iconClass: `k-panelbar-toggle k-panelbar-${parent.hasClass(ACTIVECLASS) ? "collapse" : "expand" }`
                        });

                        item.append(icon);
                    });
         },

        _accessors: function() {
            var that = this,
                options = that.options,
                i, field, textField,
                element = that.element;

            for (i in bindings) {
                field = options[bindings[i]];
                textField = element.attr(kendo.attr(i + "-field"));

                if (!field && textField) {
                    field = textField;
                }

                if (!field) {
                    field = i;
                }

                if (!isArray(field)) {
                    field = [field];
                }

                options[bindings[i]] = field;
            }
        },

        _progress: function(item, showProgress) {
            var element = this.element;
            var loadingText = this.templates.loading({ messages: this.options.messages });

            if (arguments.length == 1) {
                showProgress = item;

                if (showProgress) {
                    element.html(loadingText);
                } else {
                    element.empty();
                }
            }
            else {
                itemIcon(item)
                    .empty()
                    .removeClass("k-i-arrow-rotate-cw k-svg-i-arrow-rotate-cw")
                    .toggleClass("k-i-loading", showProgress);
            }
        },

        _refreshRoot: function(items) {
            var that = this;
            var parent = that.element;
            var groupData = {
                firstLevel: true,
                expanded: true,
                length: parent.children().length
            };

            this.element.empty();

            var rootItemsHtml = $.map(items, function(value, idx) {
                    if (typeof value === "string") {
                        return $(value);
                    } else {
                        value.items = [];
                        return $(that.renderItem({
                            group: groupData,
                            item: extend(value, { index: idx })
                        }));
                    }
            });

            this.element.append(rootItemsHtml);
            var elements = this.element.children(".k-panelbar-item");
            for (var i = 0; i < items.length; i++) {
                this.trigger("itemChange", {
                    item: elements.eq(i).find(".k-link").first(),
                    data: items[i],
                    ns: ui
                });
            }
            this._angularCompileElements(rootItemsHtml, items);
        },

        _refreshChildren: function(item, parentNode) {
            var i, children, child;

            parentNode.children(".k-group").empty();
            var items = item.children.data();
            if (!items.length) {
                updateItemHtml(parentNode);
                children = parentNode.children(".k-group").children("li");
                this._angularCompileElements(children, items);
            } else {
                this.append(item.children, parentNode);

                if (this.options.loadOnDemand) {
                    this._toggleGroup(parentNode.children(".k-group"), false);
                }
                children = parentNode.children(".k-group").children("li");

                for (i = 0; i < children.length; i++) {
                    child = children.eq(i);
                    this.trigger("itemChange", {
                        item: child.find(".k-link").first(),
                        data: this.dataItem(child),
                        ns: ui
                    });
                }
            }
        },

        findByUid: function(uid) {
            var items = this.element.find(".k-panelbar-item");
            var uidAttr = kendo.attr("uid");
            var result;

            for (var i = 0; i < items.length; i++) {
                if (items[i].getAttribute(uidAttr) == uid) {
                    result = items[i];
                    break;
                }
            }

            return $(result);
        },

        refresh: function(e) {
            var options = this.options;
            var node = e.node;
            var action = e.action;
            var items = e.items;
            var parentNode = this.wrapper;
            var loadOnDemand = options.loadOnDemand;

            if (e.field) {
                if (!items[0] || !items[0].level) {
                    return;
                }

                return this._updateItems(items, e.field);
            }

            if (node) {
                parentNode = this.findByUid(node.uid);
                this._progress(parentNode, false);
            }
            if (action == "add") {
                this._appendItems(e.index, items, parentNode);
            } else if (action == "remove") {
                this.remove(this.findByUid(items[0].uid));
            } else if (action == "itemchange") {
                this._updateItems(items);
            } else if (action == "itemloaded") {
                this._refreshChildren(node, parentNode);
            } else {
                this._refreshRoot(items);
            }

            if (action != "remove") {
                for (var k = 0; k < items.length; k++) {

                    if (!loadOnDemand || items[k].expanded) {
                        var tempItem = items[k];
                        if (this._hasChildItems(tempItem)) {
                                tempItem.load();
                        }
                    }
                }
            }

            this.trigger(DATABOUND, { node: node ? parentNode : undefined });
        },

        _error: function(e) {
            var node = e.node && this.findByUid(e.node.uid);
            var retryHtml = this.templates.retry({ messages: this.options.messages });

            if (node) {
                this._progress(node, false);
                this._expanded(node, false);
                kendo.ui.icon(itemIcon(node), { icon: "arrow-rotate-cw" });
                e.node.loaded(false);
            } else {
                this._progress(false);
                this.element.html(retryHtml);
            }
        },

        _retryRequest: function(e) {
            e.preventDefault();

            this.dataSource.fetch();
        },

         items: function() {
            return this.element.find(".k-panelbar-item > span:first-child");
        },

        setDataSource: function(dataSource) {
            var options = this.options;

            options.dataSource = dataSource;

            this._dataSource();

            if (this.options.autoBind) {
                this._progress(true);
                this.dataSource.fetch();
            }
        },

        _bindDataSource: function() {
            this._refreshHandler = this.refresh.bind(this);
            this._errorHandler = this._error.bind(this);

            this.dataSource.bind(CHANGE, this._refreshHandler);
            this.dataSource.bind(ERROR, this._errorHandler);
        },

        _unbindDataSource: function() {
            var dataSource = this.dataSource;

            if (dataSource) {
                dataSource.unbind(CHANGE, this._refreshHandler);
                dataSource.unbind(ERROR, this._errorHandler);
            }
        },

        // generates accessor function for a given field name, honoring the data*Field arrays
        _fieldAccessor: function(fieldName) {
            var fieldBindings = this.options[bindings[fieldName]] || [],
                count = fieldBindings.length;

            if (count === 0) {
                return (function(item) { return item[fieldName]; });
            } else {
                return (function(item) {
                    var levels = $.map(fieldBindings, kendo.getter);
                    if (item.level) {
                        return levels[Math.min(item.level(), count - 1)](item);
                    } else {
                        return levels[count - 1](item);
                    }
                });
            }
        },

        _dataSource: function() {
            var that = this,
                options = that.options,
                dataSource = options.dataSource;

            if (!dataSource) {
                return;
            }

            dataSource = isArray(dataSource) ? { data: dataSource } : dataSource;

            that._unbindDataSource();

            if (!dataSource.fields) {
                dataSource.fields = [
                    { field: "text" },
                    { field: "url" },
                    { field: "spriteCssClass" },
                    { field: "imageUrl" }
                ];
            }

            that.dataSource = HierarchicalDataSource.create(dataSource);

            that._bindDataSource();
        },

        _appendItems: function(index, items, parentNode) {
            var that = this, children, wrapper;

              if (parentNode.hasClass("k-panelbar")) {
                  children = parentNode.children("li");
                  wrapper = parentNode;
              } else {
                  wrapper = parentNode.children(".k-group");
                  if (!wrapper.length) {
                      wrapper = that._addGroupElement(parentNode);
                  }

                  children = wrapper.children("li");
              }

             var groupData = {
                firstLevel: parentNode.hasClass("k-panelbar"),
                expanded: true,
                length: children.length
             };

             var itemsHtml = $.map(items, function(value, idx) {
                    if (typeof value === "string") {
                        return $(value);
                    } else {
                        return $(that.renderItem({
                            group: groupData,
                            item: extend(value, { index: idx })
                        }));
                    }
            });

              if (typeof index == UNDEFINED) {
                   index = children.length;
              }

              for (var i = 0; i < itemsHtml.length; i++) {
                  if (children.length === 0 || index === 0) {
                      wrapper.append(itemsHtml[i]);
                  } else {
                       itemsHtml[i].insertAfter(children[index - 1]);
                  }
               }

            that._angularCompileElements(itemsHtml, items);
              if (that.dataItem(parentNode)) {
                  that.dataItem(parentNode).hasChildren = true;
                  that.updateArrow(parentNode);
              }
        },

        _updateItems: function(items, field) {
            var that = this;
            var i, node, nodeWrapper, item;
            var context = { panelBar: that.options, item: item, group: {} };
            var render = field != "expanded";

            if (field == "selected") {
                if (items[0][field]) {
                    var currentNode = that.findByUid(items[0].uid);

                    if (!currentNode.hasClass(DISABLEDCLASS)) {
                        that.select(currentNode, true);
                    }
                } else {
                    that.clearSelection();
                }
            } else {
                var elements = $.map(items, function(item) {
                    return that.findByUid(item.uid);
                });

                if (render) {
                    that.angular("cleanup", function() { return { elements: elements }; });
                }

                for (i = 0; i < items.length; i++) {
                    context.item = item = items[i];
                    context.panelBar = that;
                    nodeWrapper = elements[i];
                    node = nodeWrapper.parent();
                    if (render) {
                        context.group = {
                            firstLevel: node.hasClass("k-panelbar"),
                            expanded: nodeWrapper.parent().hasClass(ACTIVECLASS),
                            length: nodeWrapper.children().length
                        };

                        nodeWrapper.children(".k-link").remove();
                        nodeWrapper.prepend(that.templates.itemWrapper(extend(context,
                            {
                                arrow: item.hasChildren || item.content || item.contentUrl ? that.templates.arrow : that.templates.empty
                            },
                            rendering)));
                    }

                    if (field == "expanded") {
                        that._toggleItem(nodeWrapper, !item[field], item[field] ? "true" : true);
                    } else if (field == "enabled") {
                        that.enable(nodeWrapper, item[field]);
                         if (!item[field]) {
                            if (item.selected) {
                                item.set("selected", false);
                            }
                         }
                    }

                    if (nodeWrapper.length) {
                        this.trigger("itemChange", { item: nodeWrapper.find(".k-link").first(), data: item, ns: ui });
                    }
                }

                if (render) {
                    that.angular("compile", function() {
                        return {
                            elements: elements,
                            data: $.map(items, function(item) {
                                return [{ dataItem: item }];
                            })
                        };
                    });
                }
            }
        },

        _toggleDisabled: function(element, enable) {
            element = this.element.find(element);
            element
                .toggleClass(DISABLEDCLASS, !enable)
                .attr(ARIA_DISABLED, !enable);
        },

       dataItem: function(item) {
            var uid = $(item).closest(ITEM).attr(kendo.attr("uid")),
                dataSource = this.dataSource;

            return dataSource && dataSource.getByUid(uid);
       },

       select: function(element, skipChange) {
           var that = this;

            if (element === undefined) {
                return that.element.find(selectableItems).parent();
            }

            element = that.element.find(element);

            if (!element.length) {
                this._updateSelected(element);
            } else {
                element
                    .each(function() {
                        var item = $(this),
                            link = item.children(LINKSELECTOR);

                        if (item.hasClass(DISABLEDCLASS)) {
                            return that;
                        }

                        that._updateSelected(link, skipChange);
                    });
            }

            return that;
        },

        clearSelection: function() {
            this.select($());
        },

        enable: function(element, state) {
            this._toggleDisabled(element, state !== false);

            return this;
        },

        disable: function(element) {
            this._toggleDisabled(element, false);

            return this;
        },

        append: function(item, referenceItem) {
            referenceItem = this.element.find(referenceItem);

            var inserted = this._insert(item, referenceItem, referenceItem.length ? referenceItem.find(GROUPS) : null);

            each(inserted.items, function() {
                inserted.group.append(this);
                updateFirstLast(this);
                updateLevel(this);
            });

            this.updateArrow(referenceItem);
            updateFirstLast(inserted.group.find(".k-first, .k-last"));
            inserted.group.height("auto");

            return this;
        },

        insertBefore: function(item, referenceItem) {
            referenceItem = this.element.find(referenceItem);

            var inserted = this._insert(item, referenceItem, referenceItem.parent());

            each(inserted.items, function() {
                referenceItem.before(this);
                updateFirstLast(this);
                updateLevel(this);
            });

            updateFirstLast(referenceItem);
            inserted.group.height("auto");

            return this;
        },

        insertAfter: function(item, referenceItem) {
            referenceItem = this.element.find(referenceItem);

            var inserted = this._insert(item, referenceItem, referenceItem.parent());

            each(inserted.items, function() {
                referenceItem.after(this);
                updateFirstLast(this);
                updateLevel(this);
            });

            updateFirstLast(referenceItem);
            inserted.group.height("auto");

            return this;
        },

        remove: function(element) {
            element = this.element.find(element);

            var that = this,
                parent = element.parentsUntil(that.element, ITEM),
                group = element.parent("ul");

            element.remove();

            if (group && !group.hasClass("k-panelbar") && !group.children(ITEM).length) {
                group.remove();
            }

            if (parent.length) {
                parent = parent.eq(0);

                that.updateArrow(parent);
                updateFirstLast(parent);
            }

            return that;
        },

        reload: function(element) {
            var that = this;
            element = that.element.find(element);

            element.each(function() {
                var item = $(this);

                that._ajaxRequest(item, item.children("." + CONTENT), !item.is(VISIBLE));
            });
        },

        _first: function() {
            return this.element.children(ACTIVEITEMSELECTOR).first();
        },

        _last: function() {
            var item = this.element.children(ACTIVEITEMSELECTOR).last(),
                group = item.children(VISIBLEGROUP);

            if (group[0]) {
                return group.children(ACTIVEITEMSELECTOR).last();
            }
            return item;
        },

        _current: function(candidate) {
            var that = this,
                focused = that._focused,
                id = that._itemId;

            if (candidate === undefined) {
                return focused;
            }

            that.element.removeAttr("aria-activedescendant");

            if (focused && focused.length) {
                if (focused[0].id === id) {
                    focused.removeAttr("id");
                }

                focused
                    .children(LINKSELECTOR)
                    .removeClass(FOCUSEDCLASS);
            }

            if ($(candidate).length) {
                id = candidate[0].id || id;

                candidate.attr("id", id)
                         .children(LINKSELECTOR)
                         .addClass(FOCUSEDCLASS);

                that.element.attr("aria-activedescendant", id);
            }

            that._focused = candidate;
        },

        _keydown: function(e) {
            var that = this,
                key = e.keyCode,
                current = that._current();

            if (e.target != e.currentTarget) {
                return;
            }

            if (key == keys.DOWN || key == keys.RIGHT) {
                that._current(that._nextItem(current));
                e.preventDefault();
            } else if (key == keys.UP || key == keys.LEFT) {
                that._current(that._prevItem(current));
                e.preventDefault();
            } else if (key == keys.ENTER || key == keys.SPACEBAR) {
                that._click(e);
                e.preventDefault();
            } else if (key == keys.HOME) {
                that._current(that._first());
                e.preventDefault();
            } else if (key == keys.END) {
                that._current(that._last());
                e.preventDefault();
            }
        },

        _nextItem: function(item) {
            if (!item) {
                return this._first();
            }

            var group = item.children(VISIBLEGROUP),
                next = item.nextAll(":visible").first();

            if (group[0]) {
                next = group.children("." + FIRST);
            }

            if (!next[0]) {
                next = item.parent(VISIBLEGROUP).parent(ITEM).next();
            }

            if (!next[0]) {
                next = this._first();
            }

            return next;
        },

        _prevItem: function(item) {
            if (!item) {
                return this._last();
            }

            var prev = item.prevAll(":visible").first(),
                result;

            if (!prev[0]) {
                prev = item.parent(VISIBLEGROUP).parent(ITEM);
                if (!prev[0]) {
                    prev = this._last();
                }
            } else {
                result = prev;
                while (result[0]) {
                    result = result.children(VISIBLEGROUP).children("." + LAST);
                    if (result[0]) {
                        prev = result;
                    }
                }
            }

            return prev;
        },

        _insert: function(item, referenceItem, parent) {
            var that = this,
                items,
                plain = $.isPlainObject(item),
                isReferenceItem = referenceItem && referenceItem[0],
                groupData;

            if (!isReferenceItem) {
                parent = that.element;
            }

            groupData = {
                firstLevel: parent.hasClass("k-panelbar"),
                expanded: $(referenceItem).hasClass(ACTIVECLASS),
                length: parent.children().length
            };

            if (isReferenceItem && !parent.length) {
                parent = $(that.renderGroup({ group: groupData, options: that.options })).appendTo(referenceItem);
            }

            if (plain || Array.isArray(item) || item instanceof HierarchicalDataSource) { // is JSON or HierarchicalDataSource
                if (item instanceof HierarchicalDataSource) {
                   item = item.data();
                }

                items = $.map(plain ? [item] : item, function(value, idx) {
                    if (typeof value === "string") {
                        return $(value);
                    } else {
                        return $(that.renderItem({
                            group: groupData,
                            item: extend(value, { index: idx })
                        }));
                    }
                });
                if (isReferenceItem) {
                    var dataItem = that.dataItem(referenceItem);

                    if (dataItem) {
                        dataItem.hasChildren = true;
                        referenceItem
                            .attr(ARIA_EXPANDED, dataItem.expanded)
                            .not("." + ACTIVECLASS)
                            .children("ul")
                            .attr(ARIA_HIDDEN, !dataItem.expanded);
                    } else {
                        referenceItem.attr(ARIA_EXPANDED, false);
                    }
                }
            } else {
                if (typeof item == "string" && item.charAt(0) != "<") {
                    items = that.element.find(item);
                } else {
                    items = $(item);
                }
                that._updateItemsClasses(items);
            }

            if (!item.length) {
                item = [item];
            }

            that._angularCompileElements(items, item);
            return { items: items, group: parent };
        },

        _toggleHover: function(e) {
            var target = $(e.currentTarget);

            if (!target.parents("li." + DISABLEDCLASS).length) {
                target.toggleClass("k-hover", e.type == MOUSEENTER);
            }
        },

        _updateClasses: function() {
            var that = this,
                panels, items, expanded, panelsParent, dataItem;

            panels = that.element
                         .find("li > ul")
                         .not(function() { return $(this).parentsUntil(".k-panelbar", "div").length; })
                         .addClass("k-panelbar-group k-group k-panel")
                         .attr("role", "group");

            panelsParent = panels.parent();
            dataItem = that.dataItem(panelsParent);
            expanded = (dataItem && dataItem.expanded) || false;

            panels.parent()
                  .not("[" + ARIA_EXPANDED + "]")
                  .attr(ARIA_EXPANDED, expanded)
                  .not("." + ACTIVECLASS)
                  .children("ul")
                  .attr(ARIA_HIDDEN, !expanded)
                  .hide();

            items = that.element.add(panels).children();

            that._updateItemsClasses(items);
            that.updateArrow(items);
            updateFirstLast(items);
        },

        _updateItemsClasses: function(items) {
            var length = items.length,
                idx = 0;

            for (; idx < length; idx++) {
                this._updateItemClasses(items[idx], idx);
            }
        },

        _updateItemClasses: function(item, index) {
            var selected = this._selected,
                contentUrls = this.options.contentUrls,
                url = contentUrls && contentUrls[index],
                root = this.element[0],
                wrapElement, link;

            item = $(item)
                .addClass("k-panelbar-item")
                .attr({
                    role: "treeitem",
                    "aria-selected": false
                });

            if (kendo.support.browser.msie) { // IE10 doesn't apply list-style: none on invisible items otherwise.
                item.css("list-style-position", "inside")
                    .css("list-style-position", "");
            }

            item
                .children(IMG)
                .addClass(IMAGE);

            link = item
                    .children("a")
                    .addClass(LINK);

            if (link[0]) {
                link.attr("href", url); //url can be undefined

                link.children(IMG)
                    .addClass(IMAGE);
            }

            item
                .filter("li[disabled]")
                .addClass("k-disabled")
                .attr(ARIA_DISABLED, true)
                .prop("disabled", false);

            item
                .children("div")
                .addClass(CONTENT + " k-panelbar-content")
                .attr(ARIA_HIDDEN, true)
                .hide()
                .parent()
                .attr(ARIA_EXPANDED, false);

            link = item.children(SELECTEDSELECTOR);
            if (link[0]) {
                if (selected) {
                    selected.attr(ARIA_SELECTED, false)
                            .children(SELECTEDSELECTOR)
                            .removeClass(SELECTEDCLASS);
                }

                link.addClass(SELECTEDCLASS);
                this._selected = item.attr(ARIA_SELECTED, true);
            }

            if (!item.children(LINKSELECTOR)[0]) {
                wrapElement = "<span class='" + LINK + "'><span class='k-panelbar-item-text'></span></span>";
                if (contentUrls && contentUrls[index] && item[0].parentNode == root) {
                    wrapElement = '<a class="k-link" href="' + contentUrls[index] + '"></a>';
                }

                item
                    .contents() // exclude groups, real links, templates and empty text nodes
                    .filter(function() { return (!this.nodeName.match(excludedNodesRegExp) && !(this.nodeType == 3 && !kendo.trim(this.nodeValue.trim))); })
                    .wrapAll(wrapElement);
            }


            if (item.parent(".k-panelbar")[0]) {
                item.addClass("k-panelbar-header");
            } else {
                item.addClass("k-panelbar-item");
            }

            if (!/k\-level\-\d+/i.test(item.attr("class"))) {
                item.addClass("k-level-" + item.parentsUntil(this.element, "ul").length);
            }
        },

        _click: function(e) {
            var that = this,
                target = e.type == CLICK ? $(e.target) : that._current().children(LINKSELECTOR),
                element = that.element,
                prevent, contents, href, isAnchor;

            if (target.parents("li." + DISABLEDCLASS).length) {
                return;
            }

            if (target.closest(".k-panelbar")[0] != element[0]) {
                return;
            }

            if (target.is(":kendoFocusable") && !target.hasClass(LINK)) {
                return;
            }

            var link = target.closest(LINKSELECTOR),
                item = link.closest(ITEM);

            that._updateSelected(link);

            var wrapper = item.children(".k-group,.k-content");
            var dataItem = this.dataItem(item);

            if (!wrapper.length && ((that.options.loadOnDemand && dataItem && dataItem.hasChildren) ||
             this._hasChildItems(item) || item.content || item.contentUrl)) {
                wrapper = that._addGroupElement(item);
            }

            contents = item.find(GROUPS).add(item.find(CONTENTS));
            href = link.attr(HREF);
            isAnchor = href && (href.charAt(href.length - 1) == "#" || href.indexOf("#" + that.element[0].id + "-") != -1);
            prevent = !!(isAnchor || contents.length);

            if (contents.data("animating") && prevent) {
                e.preventDefault();
                return;
            }

            if (that._triggerEvent(SELECT, item)) {
                prevent = true;
            }

            if (prevent === false) {
                return;
            }

            if (that.options.expandMode == SINGLE) {
                if (that._collapseAllExpanded(item) && prevent) {
                    e.preventDefault();
                    return;
                }
            }

            if (contents.length) {
                var visibility = contents.is(VISIBLE);

                if (!that._triggerEvent(!visibility ? EXPAND : COLLAPSE, item)) {
                    prevent = that._toggleItem(item, visibility);
                }
            }

            if (prevent) {
                e.preventDefault();
            }
        },
        _hasChildItems: function(item) {
            return (item.items && item.items.length > 0) || item.hasChildren;
        },

        _toggleItem: function(element, isVisible, expanded) {
            var that = this,
                childGroup = element.find(GROUPS),
                link = element.find(LINKSELECTOR),
                url = link.attr(HREF),
                prevent, content,
                dataItem = that.dataItem(element),
                notVisible = !isVisible;

            var loaded = dataItem && dataItem.loaded();

            if (dataItem && !expanded && dataItem.expanded !== notVisible) {
                dataItem.set("expanded", notVisible);
                prevent = dataItem.hasChildren || !!dataItem.content || !!dataItem.contentUrl;
                return prevent;
            }

            if (dataItem && (!expanded || expanded === "true") && !loaded && !dataItem.content && !dataItem.contentUrl) {
                 if (that.options.loadOnDemand) {
                     this._progress(element, true);
                 }

                 element.children(".k-group,.k-content").remove();
                 prevent = dataItem.hasChildren;

                 dataItem.load();
             } else {
                   if (childGroup.length) {
                        this._toggleGroup(childGroup, isVisible);
                        prevent = true;
                   } else {
                        content = element.children("." + CONTENT);

                        if (content.length) {
                            prevent = true;

                            if (!content.is(EMPTY) || url === undefined) {
                                that._toggleGroup(content, isVisible);
                            } else {
                                that._ajaxRequest(element, content, isVisible);
                            }
                        }
                    }
             }

            return prevent;
        },

        _toggleGroup: function(element, visibility) {
            var that = this,
                animationSettings = that.options.animation,
                animation = animationSettings.expand,
                hasCollapseAnimation = animationSettings.collapse && "effects" in animationSettings.collapse,
                collapse = extend({}, animationSettings.expand, animationSettings.collapse);

            if (!hasCollapseAnimation) {
                collapse = extend(collapse, { reverse: true });
            }

            if (element.is(VISIBLE) != visibility) {
                that._animating = false;
                return;
            }

            element.attr(ARIA_HIDDEN, !!visibility);

            element.parent()
                .attr(ARIA_EXPANDED, !visibility)
                .toggleClass(ACTIVECLASS, !visibility)
                .toggleClass(EXPANDEDCLASS, !visibility)
                .find("> .k-link > .k-panelbar-collapse,> .k-link > .k-panelbar-expand")
                .each(function(ind, el) {
                    let iconEl = $(el);
                    iconEl.removeClass("k-panelbar-expand k-panelbar-collapse");
                    kendo.ui.icon(iconEl, {
                        icon: visibility ? "chevron-down" : "chevron-up",
                        iconClass: visibility ? "k-panelbar-expand" : "k-panelbar-collapse"
                    });
                });
            if (visibility) {
                animation = extend(collapse, { hide: true });

                animation.complete = function() {
                    that._animationCallback();
                };
            } else {
                animation = extend( { complete: function(element) {
                        that._triggerEvent(ACTIVATE, element.closest(ITEM));
                        that._animationCallback();
                    } }, animation );
            }

            element
                .toggle(0)
                .kendoStop(true, true)
                .kendoAnimate( animation );
        },

        _animationCallback: function() {
            var that = this;
            that.trigger("complete");
            that._animating = false;
        },

        _addGroupElement: function(element) {
            var group = $('<ul role="group" aria-hidden="true" class="k-panelbar-group k-group k-panel" style="display:none"></ul>');

            element.append(group);
            return group;
        },

        _collapseAllExpanded: function(item) {
            var that = this, children, stopExpand = false;

            var groups = item.find(GROUPS).add(item.find(CONTENTS));

            if (groups.is(VISIBLE)) {
                stopExpand = true;
            }

            if (!(groups.is(VISIBLE) || groups.length === 0)) {
                children = item.siblings();
                children.find(GROUPS).add(children.find(CONTENTS))
                        .filter(function() { return $(this).is(VISIBLE); })
                        .each(function(index, content) {
                            content = $(content);

                            stopExpand = that._triggerEvent(COLLAPSE, content.closest(ITEM));
                            if (!stopExpand) {
                                that._toggleGroup(content, true);
                            }
                        });

                 that.one("complete", function() {
                    setTimeout(function() {
                        children.each(function(index, child) {
                            var dataItem = that.dataItem(child);

                            if (dataItem) {
                                dataItem.set("expanded", false);
                            }
                        });
                    });
                });
            }

            return stopExpand;
        },

        _ajaxRequest: function(element, contentElement, isVisible) {

            var that = this,
                statusIcon = element.find(".k-panelbar-collapse, .k-panelbar-expand"),
                link = element.find(LINKSELECTOR),
                loadingIconTimeout = setTimeout(function() {
                    statusIcon
                        .empty()
                        .removeClass("k-i-chevron-up k-i-chevron-down k-svg-i-chevron-up k-svg-i-chevron-down")
                        .addClass("k-i-loading");
                }, 100),
                data = {},
                url = link.attr(HREF);

            $.ajax({
                type: "GET",
                cache: false,
                url: url,
                dataType: "html",
                data: data,

                error: function(xhr, status) {
                    statusIcon.removeClass("k-i-loading");
                    kendo.ui.icon(statusIcon, { icon: statusIcon.hasClass("k-panelbar-expand") ? "chevron-down" : "chevron-up" });
                    if (that.trigger(ERROR, { xhr: xhr, status: status })) {
                        this.complete();
                    }
                },

                complete: function() {
                    clearTimeout(loadingIconTimeout);
                    kendo.ui.icon(statusIcon, { icon: statusIcon.hasClass("k-panelbar-expand") ? "chevron-down" : "chevron-up" });
                    statusIcon.removeClass("k-i-loading");
                },

                success: function(data) {
                    function getElements() {
                        return { elements: contentElement.get() };
                    }
                    try {
                        that.angular("cleanup", getElements);
                        contentElement.html(data);
                        that.angular("compile", getElements);
                    } catch (e) {
                        var console = window.console;

                        if (console && console.error) {
                            console.error(e.name + ": " + e.message + " in " + url);
                        }
                        this.error(this.xhr, "error");
                    }

                    that._toggleGroup(contentElement, isVisible);

                    that.trigger(CONTENTLOAD, { item: element[0], contentElement: contentElement[0] });
                }
            });
        },

        _triggerEvent: function(eventName, element) {
            var that = this;

            return that.trigger(eventName, { item: element[0] });
        },

        _updateSelected: function(link, skipChange) {
            var that = this,
                element = that.element,
                item = link.parent(ITEM),
                selected = that._selected,
                dataItem = that.dataItem(item);

            if (selected) {
                selected.attr(ARIA_SELECTED, false);
            }

            that._selected = item.attr(ARIA_SELECTED, true);

            element.find(selectableItems).removeClass(SELECTEDCLASS);
            element.find("> ." + HIGHLIGHTCLASS + ", .k-panel > ." + HIGHLIGHTCLASS).removeClass(HIGHLIGHTCLASS);

            link.addClass(SELECTEDCLASS);
            link.parentsUntil(element, ITEM).filter(":has(.k-link)").addClass(HIGHLIGHTCLASS);
            that._current(item[0] ? item : null);
            if (dataItem) {
                 dataItem.set("selected", true);
            }

            if (!skipChange) {
                that.trigger(CHANGE);
            }
        },

        _animations: function(options) {
            if (options && ("animation" in options) && !options.animation) {
                options.animation = { expand: { effects: {} }, collapse: { hide: true, effects: {} } };
            }
        },

        renderItem: function(options) {
            var that = this;
                options = extend({ panelBar: that, group: {} }, options);

            var empty = that.templates.empty,
                item = options.item;

            return that.templates.item(extend(options, {
                itemWrapper: that.templates.itemWrapper,
                renderContent: that.renderContent,
                arrow: that._hasChildItems(item) || item.content || item.contentUrl ? that.templates.arrow : empty,
                subGroup: !options.loadOnDemand || item.expanded ? that.renderGroup : empty
            }, rendering));
        },

        renderGroup: function(options) {
            var that = this;
            var templates = that.templates || options.panelBar.templates;

            return templates.group(extend({
                renderItems: function(options) {
                    var html = "",
                        i = 0,
                        items = options.items,
                        len = items ? items.length : 0,
                        group = extend({ length: len }, options.group);

                    for (; i < len; i++) {
                        html += options.panelBar.renderItem(extend(options, {
                            group: group,
                            item: extend({ index: i }, items[i])
                        }));
                    }

                    return html;
                }
            }, options, rendering));
        },

        renderContent: function(options) {
            return options.panelBar.templates.content(extend(options, rendering));
        }
    });

kendo.ui.plugin(PanelBar);

})(window.kendo.jQuery);

