/**
 *
 *
 */
(function (core) {
    'use strict';

    core.components = core.components || {};

    (function (components) {

        components.const = components.const || {};
        components.const.dialog = {
            alert: {
                type: {
                    error: 'danger',
                    warn: 'warning'
                }
            }
        };

        /**
         * the basic dialog component as 'superclass' for all dialog components
         */
        components.Dialog = Backbone.View.extend({

            initialize: function (options) {
                this.$alert = this.$('.alert');
                this.$messageHead = this.$('.messages .panel-heading');
                this.$messageBody = this.$('.messages .panel-body');
                this.setUpWidgets(this.el);
                this.$el.on('shown.bs.modal', _.bind(this.onShown, this));
            },

            setUpWidgets: function (root) {
                window.widgets.setUp(root);
            },

            /**
             * returns the widget instance (view) for a DOM element
             */
            widgetOf: function (element) {
                return core.widgetOf(element);
            },

            show: function (initView, callback) {
                this.initView = initView;
                this.callback = callback;
                this.$el.modal('show');
            },

            onShown: function () {
                this.resetOnShown();
                if (_.isFunction(this.initView)) {
                    this.initView();
                }
            },

            resetOnShown: function () {
                this.reset();
            },

            hide: function () {
                this.$el.modal('hide');
                if (_.isFunction(this.callback)) {
                    this.callback();
                }
                this.reset();
            },

            /**
             * Resets all form values to an initial or undefined value.
             */
            reset: function () {
                this.alert();
                // reset all known View instances using their 'reset' method
                this.$('.widget').each(function () {
                    if (this.view) {
                        if (_.isFunction(this.view.reset)) {
                            this.view.reset.apply(this.view);
                        }
                    }
                });
            },

            /**
             * Displays a message text in a dialogs predefined alert or message panel box.
             * @param type the message error level (success, info, warning, danger)
             * @param message the message text to display; optional - if not present the alert will hide
             * @param result an optional result object from an Ajax call; a hint from this result is added to the text
             */
            alert: function (type, message, result) {
                if (message) {
                    type = components.const.dialog.alert.type[type] || type;
                    if (this.$messageBody.length === 1) {
                        this.$messageHead.html(result ? core.resultMessage(result, message) : message);
                        this.$messageHead.removeClass('hidden');
                        this.$messageBody.html('');
                        this.$messageBody.addClass('hidden');
                        this.$messageBody.parent().removeClass().addClass('panel').addClass('panel-' + type);
                    } else {
                        this.$alert.html(result ? core.resultMessage(result, message) : message);
                        this.$alert.removeClass().addClass('alert').addClass('alert-' + type);
                    }
                } else {
                    if (this.$messageBody.length === 1) {
                        this.$messageBody.parent().removeClass().addClass('hidden');
                        this.$messageHead.html('');
                        this.$messageBody.html('');
                    } else {
                        this.$alert.html('');
                        this.$alert.removeClass().addClass('alert').addClass('hidden');
                    }
                }
            },

            /**
             * Displays a message list with title in a dialogs predefined message panel box.
             * @param type the message error level (success, info, warning, danger)
             * @param title the message text to display in the heading; optional - if not present the box will hide
             * @param messages the message list with items like {level:(error,warn,info),text:'...'}
             */
            messages: function (type, title, messages) {
                if (this.$messageBody.length === 1) {
                    type = components.const.dialog.alert.type[type] || type;
                    this.$messageBody.parent().removeClass();
                    if (title) {
                        this.$messageHead.html(title);
                        this.$messageHead.removeClass('hidden');
                        this.$messageBody.parent().addClass('panel').addClass('panel-' + type);
                    } else {
                        this.$messageHead.addClass('hidden');
                    }
                    this.$messageBody.html('');
                    if (_.isArray(messages) && messages.length > 0) {
                        this.$messageBody.html('<ul></ul>');
                        var $list = this.$messageBody.find('ul');
                        for (var i = 0; i < messages.length; i++) {
                            var level = messages[i].level;
                            level = components.const.dialog.alert.type[level] || level;
                            $list.append('<li class="bg-' + level + ' text-' + level + '">'
                                + (messages[i].label ? '<span class="label">' + messages[i].label + ':</span>' : '')
                                + messages[i].text
                                + (messages[i].hint ? '<span class="hint">(' + messages[i].hint + ')</span>' : '')
                                + '</li>')
                        }
                        this.$messageBody.removeClass('hidden');
                    } else {
                        this.$messageBody.html('');
                        this.$messageBody.addClass('hidden');
                    }
                } else {
                    this.alert(type, title);
                }
            },

            /**
             * Submit the form of the dialog.
             * @param onSuccess optional; 'true' or a callback function called after a successful request
             */
            submitForm: function (onSuccess, onError, onComplete) {
                core.submitForm(this.el,
                    _.bind(function (result) {
                        if (_.isFunction(onSuccess)) {
                            onSuccess(result);
                        } else {
                            if (onSuccess) { // use 'true' to show the success messages
                                if (_.isObject(result) && _.isObject(result.response)) {
                                    var response = result.response;
                                    var messages = result.messages;
                                    core.messages(response.level, response.text, messages);
                                }
                            }
                        }
                        this.hide();
                    }, this),
                    _.bind(function (result) {
                        if (_.isFunction(onError)) {
                            onError(result);
                        } else {
                            if (onError === undefined || onError) {
                                this.errorMessage("Error", result);
                            }
                        }
                    }, this),
                    onComplete
                );
            },

            submitFormPut: function (onSuccess, onError, onComplete) {
                var form = core.getWidget(this.el, 'form.widget-form', core.components.FormWidget);
                core.submitFormPut(this.el,
                    form ? form.getValues.apply(form) : undefined,
                    _.bind(function (result) {
                        if (_.isFunction(onSuccess)) {
                            onSuccess(result);
                        } else {
                            if (onSuccess) { // use 'true' to show the success messages
                                if (_.isObject(result) && _.isObject(result.response)) {
                                    var response = result.response;
                                    var messages = result.messages;
                                    core.messages(response.level, response.text, messages);
                                }
                            }
                        }
                        this.hide();
                    }, this),
                    _.bind(function (result) {
                        if (_.isFunction(onError)) {
                            onError(result);
                        } else {
                            if (onError === undefined || onError) {
                                this.errorMessage("Error", result);
                            }
                        }
                    }, this),
                    onComplete
                );
            },

            submitPUT: function (label, url, data, onSuccess) {
                core.ajaxPut(url, JSON.stringify(data), {
                    dataType: 'json'
                }, onSuccess, undefined, _.bind(function (result) {
                    if (result.status >= 200 && result.status < 299) {
                        if (result.status === 200 && _.isFunction(onSuccess)) {
                            onSuccess(result);
                            this.hide();
                        } else {
                            var detail = result.responseJSON;
                            if (result.status !== 200 && _.isObject(detail) && detail.response) {
                                this.messages(detail.response.level, detail.response.text, detail.messages);
                            } else {
                                this.hide();
                            }
                        }
                    } else {
                        this.errorMessage(label, result);
                    }
                }, this));
            },

            errorMessage: function (message, result) {
                var detail = result.responseJSON;
                if (_.isObject(detail) && detail.response) {
                    this.messages(detail.response.level, detail.response.text, detail.messages);
                } else {
                    var level = result.status >= 300 && result.status < 399 ? 'info' : 'danger';
                    this.alert(level, message, result);
                }
            }
        });

        /**
         * the dialog to select a repository path in a tree view
         */
        components.SelectPathDialog = components.Dialog.extend({

            initialize: function (options) {
                components.Dialog.prototype.initialize.apply(this, [options]);
                this.busy = false;
                this.tree = core.getView(this.$('.path-select-tree'), components.Tree);
                this.tree.onNodeSelected = _.bind(this.onNodeSelected, this);
                this.$title = this.$('.modal-title');
                this.$label = this.$('.path-input-label');
                this.input = core.getView(this.$('input.path-input'), components.PathWidget);
                this.input.$el.on('change', _.bind(this.inputChanged, this));
                this.$('button.select').click(_.bind(function () {
                    if (_.isFunction(this.callback)) {
                        this.callback(this.getValue());
                    }
                    this.hide();
                }, this));
            },

            /**
             * initialization after shown...
             */
            onShown: function () {
                core.components.Dialog.prototype.onShown.apply(this);
                this.inputChanged(); // simulate a change after shown to initialize the tree
            },

            /**
             * defines the dialog title (default: 'default' data attribute of the title element)
             */
            setTitle: function (title) {
                this.$title.text(title ? title : this.$title.data('default'));
            },

            /**
             * defines the input field label (default: 'default' data attribute of the label element)
             */
            setLabel: function (label) {
                this.$label.text(label ? label : this.$label.data('default'));
            },

            /**
             * defines the root path for the tree (default: '/')
             */
            setRootPath: function (rootPath) {
                this.input.setRootPath(rootPath);
                this.tree.setRootPath(rootPath);
            },

            /**
             * defines the node filter for the tree; should be set according to the current value type
             */
            setFilter: function (filter) {
                this.tree.setFilter(filter);
            },

            /**
             * returns the current path value selected in this dialog
             */
            getValue: function () {
                var path = this.input.getValue();
                if (path && !_.isEmpty(path = path.trim())) {
                    var rootPath = this.tree.getRootPath();
                    if (rootPath !== '/') {
                        if (path.indexOf('/') === 0) {
                            path = rootPath + path;
                        } else {
                            path = rootPath + '/' + path;
                        }
                    }
                }
                return path;
            },

            /**
             * defines the (initial) value - the current / old value
             */
            setValue: function (value) {
                if (value && !_.isEmpty(value = value.trim())) {
                    var rootPath = this.tree.getRootPath();
                    if (rootPath !== '/') {
                        if (value === rootPath) {
                            value = '/';
                        } else {
                            if (value.indexOf(rootPath + '/') === 0) {
                                value = value.substring(rootPath.length);
                            }
                        }
                    }
                }
                this.input.setValue(value);
                this.inputChanged(); // select value in the tree
            },

            /**
             * the callback on each change in the input field;
             * selects the node in the tree view if the nodes exists
             */
            inputChanged: function () {
                if (!this.busy) {
                    this.busy = true;
                    var path = this.getValue();
                    if (path.indexOf('/') === 0) {
                        core.getJson('/bin/cpm/nodes/node.tree.json' + core.encodePath(path), _.bind(function (data) {
                            this.tree.selectNode.apply(this.tree, [data.path]);
                        }, this));
                    }
                    this.busy = false;
                }
            },

            /**
             * callback from the tree if a node is selected;
             * sets the select path in the input field
             */
            onNodeSelected: function (path) {
                if (!this.busy) {
                    this.busy = true;
                    this.setValue(path);
                    this.busy = false;
                }
            },

            /**
             * extended to reset the selection in the tree
             */
            reset: function () {
                components.Dialog.prototype.reset.apply(this);
                this.tree.reset.apply(this.tree);
            }
        });

    })(core.components);

})(window.core);
