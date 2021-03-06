'use strict';

angular.module('chayka-wp-admin', ['chayka-spinners', 'chayka-nls', 'chayka-utils', 'chayka-buttons', 'chayka-forms', 'ui.sortable'])
    .controller('metabox', ['$scope', function($scope){
        $scope.meta = {};
        $scope.validator = null;
    }])
    .controller('sidebar-widget-form', ['$scope', function($scope){
        $scope.options = {};
        $scope.validator = null;
    }])
    .directive('consolePageOptions', ['$timeout', 'ajax', function($timeout, ajax){
        return {
            transclude: true,
            controllerAs: 'ctrl',
            scope: {
                namespace: '@',
                options: '=consolePageOptions'
            },
            bindToController: true,
            template:
            '<div class="chayka-options_form">' +
            '   <form data-form-validator="ctrl.validator" novalidate="novalidate">' +
            '       <div class="options_form-fields" data-ng-transclude></div>' +
            '       <div class="options_form-buttons">' +
            '           <button type="button" class="button button-primary button-large" data-ng-click="ctrl.saveOptions();">Save</button>' +
            '       </div>' +
            '   </form>' +
            '</div>',
            controller: function(){
                var ctrl = {
                    /**
                     * Namespace for options to save
                     *
                     * @var {string}
                     */
                    namespace: '',

                    /**
                     * Hashmap of options to edit
                     *
                     * @var {{}}
                     */
                    options: {},

                    /**
                     * Form validator
                     *
                     * @var {{}|null}
                     */
                    validator: null,

                    /**
                     * Getter and Setter Response processor
                     *
                     * @param data
                     */
                    processResponse: function(data){
                        angular.forEach(data.payload, function(value, option){
                            ctrl.options[option] = value;
                        });
                    },

                    /**
                     * Save options on button click
                     */
                    saveOptions: function(){
                        if(!ctrl.validator || ctrl.validator.validateFields()){
                            ajax.post('/api/options/set', {
                                namespace: ctrl.namespace,
                                options: ctrl.options
                            },{
                                spinnerMessage: 'Saving options',
                                success: ctrl.processResponse
                            });
                        }
                    },

                    /**
                     * Load options on form start
                     */
                    loadOptions: function(){
                        ajax.post('/api/options/get', {
                            namespace: ctrl.namespace,
                            options: ctrl.options
                        },{
                            spinnerMessage: 'Loading options',
                            success: ctrl.processResponse
                        });
                    }
                };

                // $timeout(ctrl.loadOptions, 100);

                return ctrl;
            },

            compile: function(element, attributes){

                return {
                    pre: function(scope, element, attributes, controller, transcludeFn){

                    },
                    post: function(scope, element, attributes, controller, transcludeFn){
                        $timeout(controller.loadOptions, 0);
                    }
                };
            }
        };
    }])
    /**
     * @deprecated
     */
    .controller('optionsForm', ['$scope', '$timeout', 'ajax', function($scope, $timeout, ajax){

        $scope.namespace = '';
        $scope.options = {
            site: {}
        };
        $scope.validator = null;

        var processResponse = function(data){
            angular.forEach(data.payload, function(value, option){
                $scope.options[option] = value;
            });
            //$scope.options = data.payload;
        };

        $scope.saveOptions = function(){
            if(!$scope.validator || $scope.validator.validateFields()){
                ajax.post('/api/options/set', {
                    namespace: $scope.namespace,
                    options: $scope.options
                },{
                    spinnerMessage: 'Saving options',
                    success: processResponse
                });
            }
        };

        $scope.loadOptions = function(){
            ajax.post('/api/options/get', {
                namespace: $scope.namespace,
                options: $scope.options
            },{
                spinnerMessage: 'Loading options',
                success: processResponse
            });
        };

        $timeout($scope.loadOptions, 0);

    }])
    .factory('mediaResolver', ['ajax', function(ajax){

        var queue = {};

        var multiQueue = [];

        var cache = {};

        var bulkDelay = 100;

        var bulkTimeout = null;

        var resolver = {

            /**
             * Resolve media object by API and pass it to callback.
             * This function pushes request to the queue to perform bulk api call
             * @param {int} id
             * @param {function} callback
             * @param {int} delay
             */
            resolveById: function(id, callback, delay){
                if(cache[id]){
                    callback(cache[id]);
                    return;
                }
                if(!queue[id]){
                    queue[id] = [];
                }
                queue[id].push(callback);
                if(bulkTimeout){
                    clearTimeout(bulkTimeout);
                }
                bulkTimeout = setTimeout(resolver.bulkResolveById, delay || bulkDelay);
            },

            /**
             * Resolve media objects by API and pass it to callback.
             * This function pushes request to the queue to perform bulk api call
             * @param {array|string} ids
             * @param {function} callback
             * @param {int} delay
             */
            resolveByIds: function(ids, callback, delay){
                var idsArr;
                var unresolvedIds = [];
                var resolvedItems = [];
                if(angular.isString(ids)){
                    idsArr = [];
                    ids.split(' ').forEach( function(id){
                        idsArr.push(parseInt(id));
                    });
                }
                if(angular.isArray(ids)){
                    idsArr = ids;
                }

                for(var i=0; i < idsArr.length; i++){
                    var id = parseInt(idsArr[i]);
                    idsArr[i] = id;
                    if(cache[id]){
                        resolvedItems.push(cache[id]);
                    }else{
                        unresolvedIds.push(id);
                    }
                }

                if(!unresolvedIds.length) {
                    callback(resolvedItems);
                    return;
                }

                multiQueue.push({ids: idsArr, callback: callback});
                if(bulkTimeout){
                    clearTimeout(bulkTimeout);
                }
                bulkTimeout = setTimeout(resolver.bulkResolveById, delay || bulkDelay);
            },

            /**
             * Resolves all the enqueued media objects and fires all the needed callbacks
             */
            bulkResolveById: function(){
                var requestQueue = queue;
                queue = {};
                var requestMultiQueue = multiQueue;
                multiQueue = [];
                var ids = [];
                var requestedIds = {};
                for(var id in requestQueue){
                    if(requestQueue.hasOwnProperty(id)){
                        ids.push(id);
                        requestedIds[id]=true;
                    }
                }
                requestMultiQueue.forEach(function(itemSet){
                    for(var i=0; i < itemSet.ids.length; i++){
                        id = itemSet.ids[i];
                        if(!cache[id] && !requestedIds[id]){
                            ids.push(id);
                            requestedIds[id]=true;
                        }
                    }
                });

                ajax.post(
                    '/api/post-models/',
                    {
                        'post_type': 'attachment',
                        'post__in': ids,
                        'post_status': 'any',
                        'posts_per_page': -1
                    },
                    {
                        spinnerMessage: 'Retrieving media data',
                        errorMessage: 'Failed to retrieve media data',
                        success: function(data){
                            var items = data.payload.items;
                            items.forEach(function(item){
                                cache[item.id] = item;
                                var callbacks = requestQueue[item.id];
                                if(callbacks && callbacks.length) {
                                    for (var i = 0; i < callbacks.length; i++) {
                                        callbacks[i](item);
                                    }
                                }
                            });
                            requestMultiQueue.forEach(function(itemSet){
                                var items = [], item, id;
                                for(var i=0; i<itemSet.ids.length; i++){
                                    id = itemSet.ids[i];
                                    item = cache[id];
                                    if(item){
                                        items.push(item);
                                    }
                                }
                                itemSet.callback(items);
                            });
                        }
                    }
                );
            }
        };

        return resolver;
    }])
    .directive('mediaPicker', ['buttons', 'mediaResolver', 'nls', 'modals', function(buttons, mediaResolver, nls, modals){
        return {
            restrict: 'AE',
            scope: {
                /**
                 * Picker popup title
                 */
                title: '@?',

                /**
                 * Picker button text (both popup and inline input)
                 */
                pickerButtonText: '@?',

                /**
                 * Media type: all, images, audio, video
                 */
                type: '@?',

                /**
                 * Value (model) mode: id|url|object
                 */
                mode: '@',

                /**
                 * Scope model that is being adjusted
                 */
                model: '=',

                /**
                 * Image size: thumbnail, medium, large, full.
                 * 'medium' by default, but downgraded to 'thumbnail' for non-image attachments
                 */
                size: '@',

                /**
                 * Is media picker able to select multiple items
                 */
                multiple: '@?',

                /**
                 * In case of multiple mode defines width of media item,
                 * If not defined uses item-height or 100px
                 */
                itemWidth: '@?',

                /**
                 * In case of multiple mode defines height of media item,
                 * If not defined uses item-width or 100px
                 */
                itemHeight: '@?',

                /**
                 * Item background mode:
                 * - contain
                 * - cover
                 */
                itemMode: '@?',

                /**
                 * On model change callback
                 */
                onChange: '&?'
            },
            transclude: true,
            template:
                '<div class="chayka-media_picker" data-ng-class="{\'image-set\': hasImages(), multiple: multiple}">' +
                '<img data-ng-src="{{mediaSrc}}" data-ng-show="!!mediaSrc" data-ng-click="pickMedia();"/>' +
                '<div class="media_items sortable-row" data-ng-show="mediaItems && mediaItems.length" data-ng-model="mediaItems" data-as-sortable="dragControl" >' +
                '<div class="media_item" data-ng-class="{contain: itemMode === \'contain\', cover: itemMode === \'cover\'}" data-ng-repeat="item in mediaItems" data-as-sortable-item style="background-image: {{\'url(\'+item.url+\')\'}}; width: {{itemWidth || itemHeight || \'100px\'}}; height: {{itemHeight || itemWidth || \'100px\'}};">' +
                '<div class="sortable-handle" data-as-sortable-item-handle>' +
                '<button class="btn_remove" data-ng-click="removeMediaItem($event, item)" data-no-drag ><span>&times;</span></button>' +
                '</div>' +
                '</div>' +
                '</div>' +
                '<div class="no_image" data-ng-click="pickMedia();" data-ng-show="!hasImages()">' +
                '   <div data-spinner="spinner"></div>' +
                '</div>' +
                '<div class="note" data-ng-transclude></div>' +
                '<div class="buttons">' +
                '   <button class="{{buttonClass}} btn_clear" data-ng-click="clearMedia($event);" data-ng-show="!!hasImages()" >{{ "Clear" | nls}}</button>' +
                '   <button class="{{buttonClass}} btn_pick" data-ng-click="pickMedia($event);">{{ pickerButtonText || "Browse" | nls}}</button>' +
                '</div>' +
                '</div>',
            controller: function($scope, $element){
                $scope.buttonClass = buttons.getButtonClass();
                $scope.mediaSrc = null;
                $scope.mediaItems = [];
                $scope.mode = $scope.mode || 'id';
                $scope.size = $scope.size || 'medium';
                $scope.spinner = null;
                $scope.prevModel = '';

                var frame = null;
                var wp = window.wp;

                $scope.prevModel = $scope.model?JSON.stringify($scope.model):'';


                /**
                 * Watch madel, request items by ids and render them
                 */
                $scope.$watch('model', function(model){
                    if($scope.multiple){
                        switch ($scope.mode){
                            case 'id':
                                $scope.mediaSrc = '';
                                $scope.mediaItems = [];
                                if(model){
                                    if($scope.spinner){
                                        $scope.spinner.show(nls._('Retrieving media data...'));
                                    }
                                    mediaResolver.resolveByIds(model, function(items){
                                        if($scope.spinner){
                                            $scope.spinner.hide();
                                        }
                                        items.forEach(function(item){
                                            $scope.mediaItems.push({
                                                id: item.id,
                                                url:(item.image[$scope.size] || item.image.thumbnail).url
                                            });
                                        });
                                    });
                                }
                                break;
                            case 'url':
                                model.split(' ').forEach(function(url){
                                    $scope.mediaItems.push({
                                        id: 0,
                                        url: url
                                    });
                                });

                                break;
                        }

                    }else{
                        switch ($scope.mode){
                            case 'id':
                                $scope.mediaSrc = '';
                                $scope.mediaItems = [];
                                model = parseInt(model);
                                if(model){
                                    if($scope.spinner){
                                        $scope.spinner.show(nls._('Retrieving media data...'));
                                    }
                                    mediaResolver.resolveById(model, function(item){
                                        if($scope.spinner){
                                            $scope.spinner.hide();
                                        }
                                        //media = item;
                                        $scope.mediaSrc = (item.image[$scope.size] || item.image.thumbnail).url;
                                    });
                                }
                                break;
                            case 'url':
                                $scope.mediaSrc = model;
                                break;
                        }

                    }

                    var newModel = model?JSON.stringify(model):'';
                    if($scope.onChange && newModel !== $scope.prevModel){
                        $scope.onChange();
                    }

                    $scope.prevModel = newModel;
                });

                /**
                 * ng-sortable options
                 *
                 * @type {{orderChanged: Function, scrollableContainer: *}}
                 */
                $scope.dragControl = {
                    //accept: function (sourceItemHandleScope, destSortableScope) {return true;},//override to determine drag is allowed or not. default is true.
                    //itemMoved: function (event) {},
                    orderChanged: function(event){
                        $scope.updateMultiModel($scope.mediaItems);
                    },
                    //containerPositioning: 'absolute'
                    scrollableContainer: $element.attr('id')//optional param.
                };

                /**
                 * Check if images are stt
                 * @return {boolean}
                 */
                $scope.hasImages = function(){
                    return !!$scope.mediaItems && !!$scope.mediaItems.length || !!$scope.mediaSrc;
                };

                /**
                 * Remover media item in multiple mode
                 * @param $event
                 * @param {{id: int, url: string}} item
                 */
                $scope.removeMediaItem = function($event, item){
                    $event.preventDefault();
                    modals.confirm(nls._('Delete this item?'), function(){
                        var value = '';
                        switch ($scope.mode){
                            case 'id':
                                value = item.id;
                                break;
                            case 'url':
                                value = item.url;
                                break;
                        }
                        var re = new RegExp('\\b'+value+'\\b\\s?');
                        $scope.model = $scope.model.replace(re, '').trim();
                    });
                };

                /**
                 * Update model in multiple mode
                 *
                 * @param items
                 */
                $scope.updateMultiModel = function(items){
                    var values = [];
                    items.forEach(function(item){
                        switch ($scope.mode){
                            case 'id':
                                values.push(item.id);
                                break;
                            case 'url':
                                values.push(item.url);
                                break;
                        }
                    });
                    $scope.model = values.join(' ');
                };

                /**
                 * Pick media
                 * @param $event
                 */
                $scope.pickMedia = function($event){
                    if($event && $event.preventDefault) {
                        $event.preventDefault();
                    }
                    if(frame){
                        frame.$el.remove();
                    }
                    if(true || !frame){
                        frame = wp.media({
                            title: nls._($scope.title || 'Select or Upload Media'),
                            button: {
                                text: nls._($scope.pickerButtonText || 'Use this media')
                            },
                            multiple: $scope.multiple  // Set to true to allow multiple files to be selected
                        });

                        frame.on('open', function(){
                            if($scope.mode === 'id'){
                                var selection = frame.state().get('selection');
                                if ($scope.model) {
                                    if($scope.multiple){
                                        $scope.model.split(' ').forEach(function(id){
                                            selection.add(wp.media.attachment(id));
                                        });
                                    }else{
                                        selection.add(wp.media.attachment($scope.model));
                                    }
                                }
                            }
                        });

                        // When an image is selected in the media frame...
                        frame.on( 'select', function(){
                            // Get media attachment details from the frame state
                            if($scope.multiple){
                                var attachments = frame.state().get('selection').toJSON();
                                $scope.updateMultiModel(attachments);

                            }else{
                                var attachment = frame.state().get('selection').first().toJSON();

                                switch ($scope.mode){
                                    case 'id':
                                        $scope.model = attachment.id;
                                        break;
                                    case 'url':
                                        $scope.model = attachment.url;
                                        break;
                                }
                            }
                            $scope.$apply();

                        });

                        // Finally, open the modal on click
                        frame.open();
                        frame.$el.show();

                    }
                };

                /**
                 * Reset state to no media selected
                 *
                 * @param $event
                 */
                $scope.clearMedia = function($event){
                    $event.preventDefault();
                    if($scope.multiple && $scope.mediaItems.length > 3){
                        modals.confirm(nls._('Remove media items?'), function(){
                            $scope.model = '';
                        });
                    }else{
                        $scope.model = '';
                    }
                };
            }
        };
    }])
    .directive('colorPicker', ['utils', function(utils){
        return {
            restrict: 'AE',
            scope:{
                defaultColor: '@?',
                palettes: '=?'
            },
            link: function($scope, element, attrs){
                var $ = angular.element,
                    $element = $(element);

                var onPickerColorChange = function(event, change){
                    setTimeout(function(){
                        $scope.$parent.$apply(attrs.ngModel+'="'+(change && change.color.toString() || '')+'";');
                    }, 0);
                };
                if($.fn.wpColorPicker){
                    $element.attr('type', 'hidden');
                    var $input = $('<input type="text">')
                        .insertAfter(element)
                        .val($element.val())
                        .wpColorPicker({
                            defaultColor: $scope.defaultColor,
                            hide: true,
                            palettes: $scope.palettes,
                            change: onPickerColorChange,
                            clear: onPickerColorChange
                        });
                    $scope.$parent.$watch(attrs.ngModel, function(value){
                        if(value!==$input.val()){
                            $input.wpColorPicker('color', value);
                        }
                    });
                    var $inputDiv = $element.parent(),
                        $pickerContainer = $inputDiv.find('.wp-picker-container'),
                        $pickerColorButton = $pickerContainer.find('.wp-color-result'),
                        $pickerInputWrap = $pickerContainer.find('.wp-picker-input-wrap'),
                        $pickerHolder = $pickerContainer.find('.wp-picker-holder');
                    $pickerContainer.off('keyup', '*');
                    $input.off('keyup').on( 'keyup', function(event){
                        if ( event.keyCode === 13 || event.keyCode === 32 ) {
                            event.preventDefault();
                            event.stopPropagation();
                            //$pickerColorButton.trigger( 'click' );//.next().focus();
                            $input.wpColorPicker('close');
                        }
                    });

                    //$pickerColorButton.appendTo($inputDiv);

                }
            }
        };
    }])
    .directive('jobControl', [function(){
        return {
            restrict: 'AE',
            scope:{
                jobControl: '=',
                jobId: '=?',
                perIteration: '=?',
                buttons: '@?'
            },
            controllerAs: 'jc',
            template:
                '<div class="chayka-job_control {{jc.state}}">' +
                '   <div class="progressbar">' +
                '       <div class="progress_label">{{ jc.total ? jc.processed + " / " + jc.total + " (" + Math.floor(jc.processed / jc.total * 100) + "%)" : "0%" }}</div>' +
                '   </div>' +
                '   <div class="box_controls">' +
                '       <button class="dashicons-before dashicons-controls-play button button-small button_start" data-ng-click="jc.start()" title="{{ \'btn_start\' | nls }}" data-ng-show="!jc.state && jc.buttons.indexOf(\'start\') >= 0"></button>' +
                '       <button class="dashicons-before dashicons-controls-pause button button-small button_pause" data-ng-click="jc.pause()" title="{{ \'btn_pause\' | nls }}" data-ng-show="jc.state===\'running\' && jc.buttons.indexOf(\'pause\') >= 0"></button>' +
                '       <button class="dashicons-before dashicons-controls-repeat button button-small button_resume" data-ng-click="jc.resume()" title="{{ \'btn_resume\' | nls }}" data-ng-show="jc.state===\'paused\' && jc.buttons.indexOf(\'resume\') >= 0"></button>' +
                '       <button class="dashicons-before dashicons-no button button-small button_stop" data-ng-click="jc.stop()" title="{{ \'btn_stop\' | nls }}" data-ng-show="jc.state && jc.buttons.indexOf(\'stop\') >= 0"></button>' +
                '       <span class="field_items_per_iteration">' +
                '           <label>{{ "label_per_iteration" | nls }}</label>' +
                '           <input type="number" data-ng-model="jc.perIteration"/>' +
                '       </span>' +
                '   </div>' +
                '   <div data-spinner="spinner"></div>' +
                '   <div class="box_output">' +
                '       <div data-ng-repeat="message in jc.log track by $index" class="message">{{message}}</div>' +
                '   </div>' +
                '</div>',

            controller: function($scope){
                var ctrl = {
                    jobId: $scope.jobId,
                    state: '',
                    perIteration: $scope.perIteration || 10,
                    total: 100,
                    processed: 0,
                    log: [],
                    buttons: $scope.buttons ?
                        $scope.buttons.split(' ') :
                        ['start', 'pause', 'resume', 'stop'],

                    setJobId: function(val){
                        ctrl.jobId = val;
                        return ctrl;
                    },

                    getJobId: function(){
                        return ctrl.jobId;
                    },

                    setPerIteration: function(val){
                        ctrl.perIteration = val;
                        return ctrl;
                    },

                    getPerIteration: function(){
                        return ctrl.perIteration;
                    },

                    setTotal: function(val){
                        ctrl.total = val;
                        return ctrl;
                    },

                    getTotal: function(){
                        return ctrl.total;
                    },

                    setProcessed: function(val){
                        ctrl.processed = val;
                        return ctrl;
                    },

                    getProcessed: function(){
                        return ctrl.processed;
                    },

                    isFinished: function(){
                        return ctrl.getTotal() === ctrl.getProcessed();
                    },

                    setProgress: function(processed, total){
                        ctrl.setProcessed(processed);
                        ctrl.setTotal(total || ctrl.getTotal() || 100);
                        if (ctrl.isFinished()) {
                            ctrl.setState('finished');
                        }
                        return ctrl;
                    },

                    setState: function(val){
                        ctrl.state = val;
                        return ctrl;
                    },

                    getState: function(){
                        return ctrl.state;
                    },

                    addLogMessage: function(message){
                        ctrl.log.push(message);
                    },

                    clearLog: function(){
                        ctrl.log = [];
                    },

                    start: function(){
                        $scope.$emit('JobControl.start', ctrl.jobId);
                    },

                    started: function(){
                        ctrl.setState('running');
                    },

                    pause: function(){
                        $scope.$emit('JobControl.pause', ctrl.jobId);
                    },

                    paused: function(){
                        ctrl.setState('paused');
                    },

                    resume: function(){
                        $scope.$emit('JobControl.resume', ctrl.jobId);
                    },

                    resumed: function(){
                        ctrl.setState('running');
                    },

                    stop: function(){
                        $scope.$emit('JobControl.stop', ctrl.jobId);
                    },

                    stopped: function(){
                        ctrl.setState('');
                    }
                };

                $scope.jobControl = ctrl;

                return ctrl;
            }
        };
    }])
    .config(['nlsProvider', 'buttonsProvider', function(nlsProvider, buttonsProvider){

        // Adding a translation table for the English language
        nlsProvider.setTranslations('en-US', {
            'btn_start': 'Start',
            'btn_stop': 'Stop',
            'btn_pause': 'Pause',
            'btn_resume': 'Resume',
            'label_per_iteration': 'Per iteration'
        });

        nlsProvider.setTranslations('ru-RU', {
            'btn_start': 'Старт',
            'btn_stop': 'Стоп',
            'btn_pause': 'Пауза',
            'btn_resume': 'Возобновить',
            'label_per_iteration': 'За итерацию'
        });

        buttonsProvider.setButtonClass('button');
    }])
;
