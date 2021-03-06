'use strict';

/**
 * @ngdoc module
 * @name chayka-forms
 * @description
 *
 * This is a module that enables form validation stuff.
 */
angular.module('chayka-forms', ['ngSanitize', 'chayka-modals', 'chayka-nls', 'chayka-ajax'])
    /**
     * @ngdoc directive
     * @name chayka-forms#formValidator
     * @description
     *
     * This directive creates wrapper for the fields that should be validated.
     * Then you can access it and perform field set validation.
     */
    .directive('formValidator', ['$window', 'modals', 'ajax', 'utils', function($window, modals, ajax, utils){
        return {
            restrict: 'AE',
            //transclude: true,
            scope: {
                validator: '=?formValidator',
                scrollMargin: '@',
                scrollDuration: '@'
            },
            link: function($scope, $element){
                $scope.element = $element;
            },
            controller: function($scope){
                var ctrl = {

                    scrollMargin: $scope.scrollMargin || 50,
                    scrollDuration: $scope.scrollMargin || 500,
                    fields: $scope.fields || {},
                    messageBox: null,

                    /**
                     * Sets message box for validator.
                     * The box that will show common errors.
                     * This function is called by 'form-message' directive.
                     *
                     * If not set, Chayka.Modals.alert() will be utilized.
                     *
                     * @param {$scope} msgBox
                     */
                    setMessageBox: function(msgBox){
                        ctrl.messageBox = msgBox;
                    },

                    /**
                     * Show message using message box or Chayka.Modals.alert()
                     *
                     * @param {string} message
                     * @param {string} state
                     * @returns {boolean}
                     */
                    showMessage: function(message, state){
                        if (ctrl.messageBox) {
                            ctrl.messageBox.message = message;
                            ctrl.messageBox.state = state || '';
                            return true;
                        }
                        modals.alert(message, '', state);
                        return false;
                    },

                    /**
                     * Hide message shown by message box
                     *
                     * @returns {boolean}
                     */
                    clearMessage: function(){
                        if (ctrl.messageBox) {
                            ctrl.messageBox.message = '';
                            ctrl.messageBox.state = '';
                            return true;
                        }
                        return false;
                    },

                    /**
                     * Add field to the set of validated fields
                     *
                     * @param {$scope} field
                     */
                    addField: function(field){
                        ctrl.fields[field['name']] = field;
                    },

                    /**
                     * Set field state and message (hint)
                     *
                     * @param {string|$scope} field
                     * @param {string} state
                     * @param {string} [message]
                     */
                    setFieldState: function(field, state, message){
                        if (angular.isString(field)) {
                            field = ctrl.fields[field];
                            if (!field) {
                                return;
                            }
                        }
                        field['valid'] = state === 'valid' || state === 'clean' || state === 'progress';
                        field['state'] = state;
                        field['message'] = message || field['hint'];

                        //utils.patchScope(field);
                    },

                    /**
                     * Set field state to error
                     *
                     * @param {string|scope} field
                     * @param message
                     */
                    setFieldError: function(field, message){
                        ctrl.setFieldState(field, 'invalid', message);
                    },

                    /**
                     * Clear field error state.
                     *
                     * @param {string|scope} field
                     */
                    clearFieldError: function(field){
                        ctrl.setFieldState(field, 'clear');
                    },

                    /**
                     * Check required field
                     *
                     * @param {$scope} field
                     * @returns {boolean}
                     */
                    checkRequired: function(field){
                        var c = field['checks'].required;
                        return !c.active || !!field['value'];
                    },

                    /**
                     * Check field length.
                     *
                     * @param {$scope} field
                     * - length
                     * @returns {boolean}
                     */
                    checkLength: function(field){
                        var c = field['checks'].length;
                        return !c.active || !(c.max && field['value'].length > c.max || field['value'].length < c.min);
                    },

                    /**
                     * Check field value range.
                     *
                     * @param {$scope} field
                     * - min
                     * - minE
                     * - max
                     * - maxE
                     * @returns {boolean}
                     */
                    checkRange: function(field){
                        var c = field['checks'].range;
                        var lower = c.min && (c.minE && field['value'] < c.min || !c.minE && field['value'] <= c.min);
                        var greater = c.max && (c.maxE && field['value'] > c.max || !c.minE && field['value'] >= c.max);
                        return !c.active || !(lower || greater);
                    },

                    /**
                     * Check field value lt (<).
                     *
                     * @param {$scope} field
                     * - max
                     * @returns {boolean}
                     */
                    checkLt: function(field){
                        var c = field['checks'].lt;
                        return !c.active || field['value'] < c.max;
                    },

                    /**
                     * Check field value le (<=).
                     *
                     * @param {$scope} field
                     * - max
                     * @returns {boolean}
                     */
                    checkLe: function(field){
                        var c = field['checks'].le;
                        return !c.active || field['value'] <= c.max;
                    },

                    /**
                     * Check field value gt (>).
                     *
                     * @param {$scope} field
                     * - min
                     * @returns {boolean}
                     */
                    checkGt: function(field){
                        var c = field['checks'].gt;
                        return !c.active || field['value'] > c.min;
                    },

                    /**
                     * Check field value ge (>=).
                     *
                     * @param {$scope} field
                     * - min
                     * @returns {boolean}
                     */
                    checkGe: function(field){
                        var c = field['checks'].ge;
                        return !c.active || field['value'] >= c.min;
                    },

                    /**
                     * Check field value against regexp.
                     *
                     * @param {$scope} field
                     * - regexp
                     * @returns {*|boolean}
                     */
                    checkRegexp: function(field){
                        var c = field['checks'].regexp;
                        var valid = c.regexp.test(field['value']);
                        if (c.forbid) {
                            valid = !valid;
                        }
                        return !c.active || valid;
                    },

                    /**
                     * Compare two password field values.
                     *
                     * @param {$scope} field
                     * - repeat
                     * @returns {boolean}
                     */
                    checkPasswords: function(field){
                        var c = field['checks'].passwords;
                        var repeatField = ctrl.fields[c.repeat] || field;
                        return !c.active || field['value'] === repeatField.value;
                    },

                    /**
                     * Check value using api call.
                     * Stores checked values to cache.
                     *
                     * @param {$scope} field
                     * - url
                     * - delay
                     * @returns {string} state
                     */
                    checkApi: function(field){
                        var c = field['checks'].api;
                        var url = utils.template(c.url, {
                            name: encodeURIComponent(field['name']),
                            value: encodeURIComponent(field['value'])
                        });
                        var value = field['value'] + '';
                        if (c.active) {
                            if (value in c.dictionary) {
                                if ('valid' === c.dictionary[value]) {
                                    ctrl.setFieldState(field, 'valid', null);
                                } else {
                                    ctrl.setFieldState(field, 'invalid', c.message);
                                }
                                return c.dictionary[value];
                            }

                            c.dictionary[value] = 'progress';
                            ajax.get(url, {
                                spinner: $scope.spinner,
                                spinnerFieldId: field['name'],
                                spinnerMessage: ' ',
                                showMessage: false,
                                formValidator: ctrl,
                                errorMessage: c.message,
                                validateOnSend: false,
                                scope: field,
                                success: function(data){
                                    //console.dir({'data': data});
                                    c.dictionary[value] = 'valid';
                                    ctrl.setFieldState(field, 'valid', null);
                                },
                                error: function(data){
                                    c.dictionary[value] = 'invalid';
                                    c.message = c.message || 'mass_errors' === data.code && data.message[field['name']] || data.message;
                                }
                            });
                        }
                        return !c.active || c.dictionary[value];

                    },

                    /**
                     * Perform custom check by calling provided scope callback.
                     *
                     * @param {$scope} field
                     * @returns {*}
                     */
                    checkCustom: function(field){
                        var c = field['checks'].custom;
                        var callback = c.callback;
                        return !c.active || $scope.$parent[callback].call($scope, field['value']);
                    },

                    /**
                     * Perform all the set up checks for the given field.
                     * If silent, does not visualize validation state.
                     *
                     * @param {$scope} field
                     * @param {boolean} [silent]
                     * @returns {boolean}
                     */
                    validateField: function(field, silent){
                        var valid = true,
                            message = '',
                            state,
                            checks = field['checks'];

                        if (!field['active']) {
                            return true;
                        }

                        if (checks.required && !ctrl.checkRequired(field)) {
                            valid = false;
                            message = checks.required.message;
                        }

                        if (field['value']) {
                            angular.forEach(checks, function(c, check){
                                if (!valid) {
                                    return;
                                }
                                switch (check) {
                                    case 'length':
                                        valid = ctrl.checkLength(field);
                                        break;
                                    case 'range':
                                        valid = ctrl.checkRange(field);
                                        break;
                                    case 'lt':
                                        valid = ctrl.checkLt(field);
                                        break;
                                    case 'le':
                                        valid = ctrl.checkLe(field);
                                        break;
                                    case 'gt':
                                        valid = ctrl.checkGt(field);
                                        break;
                                    case 'ge':
                                        valid = ctrl.checkGe(field);
                                        break;
                                    case 'regexp':
                                        valid = ctrl.checkRegexp(field);
                                        break;
                                    case 'passwords':
                                        valid = ctrl.checkPasswords(field);
                                        break;
                                    default :
                                }
                                if (!valid) {
                                    message = c.message;
                                }
                            });
                        }

                        if (valid && checks.custom) {
                            valid = ctrl.checkCustom(field);
                            message = valid ? '' : checks.custom.message;
                        }

                        state = valid ? 'valid' : 'invalid';

                        if (valid && checks.api) {
                            state = ctrl.checkApi(field);
                            message = state === 'invalid' ? checks.api.message : '';
                        }


                        if (!silent) {
                            ctrl.setFieldState(field, state, message);
                        }

                        return field.valid;
                    },

                    /**
                     * Validate field by field id
                     * @param fieldId
                     * @param [silent]
                     * @return {boolean}
                     */
                    validateFieldById: function(fieldId, silent){
                        var field = ctrl.fields[fieldId];
                        return ctrl.validateField(field, silent);
                    },

                    /**
                     * Validate all registered fields and scroll to
                     * top invalid field in case it is invisible.
                     *
                     * @returns {boolean}
                     */
                    validateFields: function(){
                        var valid = true;

                        var scrollTo = 0;

                        angular.forEach(ctrl.fields, function(field){
                            if (!ctrl.validateField(field)) {
                                var scrollPos = field.element.offset().top;
                                if (!scrollTo || scrollPos && scrollTo > scrollPos) {
                                    scrollTo = scrollPos;
                                }
                                valid = false;
                            }
                        });


                        if (!valid && scrollTo) {
                            ctrl.scrollTo(scrollTo);
                        }

                        //$scope.valid = valid;

                        return valid;
                    },

                    /**
                     * Scroll to set position in case if position is out of the vieport.
                     * If duration is 0, scroll is not animated.
                     * Default duration value is taken from markup (see scroll-duration directive).
                     *
                     * @param {int} scrollTo
                     * @param {int|string} [duration]
                     */
                    scrollTo: function(scrollTo, duration){

                        if (angular.isUndefined(duration)) {
                            duration = parseInt(ctrl.scrollDuration) || ctrl.scrollDuration;
                        }

                        scrollTo -= parseInt(ctrl.scrollMargin);
                        if ($window.jQuery) {
                            var $ = $window.jQuery;
                            if (scrollTo < $window.pageYOffset || scrollTo > $window.pageYOffset + $($window).height()) {
                                if (duration) {
                                    $window.jQuery('html, body').animate({scrollTop: scrollTo}, duration);
                                } else {
                                    $window.jQuery('html, body').scrollTop(scrollTo);
                                }
                            }
                        }
                    },

                    /**
                     * Scroll to top of the form-validator DOM-element if one is not visible.
                     *
                     * @param {int|string} [duration]
                     */
                    scrollUp: function(duration){
                        ctrl.scrollTo($scope.element.offset().top, duration);
                    },

                    /**
                     * Show set of errors organized by fields.
                     * This function is handy to show errors from backend api call.
                     *
                     * Errors for non-existing fields will be shown in message box
                     * or via Chayka.Modals.alert();
                     *
                     * @param {object} errors
                     */
                    showErrors: function(errors){
                        var scrollTo = 0;
                        angular.forEach(errors, function(message, key){
                            var field = ctrl.fields[key];
                            if (field) {
                                ctrl.setFieldState(field, 'invalid', message);
                                var scrollPos = field.element.offset().top;
                                if (!scrollTo || scrollPos && scrollTo > scrollPos) {
                                    scrollTo = scrollPos;
                                }
                            } else {
                                ctrl.showMessage(message, 'error');
                            }
                        });

                        if (scrollTo) {
                            ctrl.scrollTo(scrollTo);
                        }
                    },

                    /**
                     * Get form fields values
                     *
                     * @return {{}}
                     */
                    getFieldValues: function(){
                        var values = {};
                        angular.forEach(ctrl.fields, function(field){
                            values[field] = ctrl.fields[field].value || '';
                        });

                        return values;
                    }
                };

                $scope.validator = ctrl;

                return ctrl;
            }
        };
    }])
    .directive('formField', ['nls', 'delayedCall', 'utils', function(nls, delayedCall, utils){
        return {
            require: ['^^formValidator', 'formField'],
            restrict: 'AE',
            transclude: true,
            controllerAs: 'f',
            template:
                '<label>{{f.label|nls}}</label>' +
                '<div class="input {{f.state}}" data-ng-transclude></div>' +
                '<div class="message" data-ng-class="{error: !f.valid}" data-ng-bind-html="f.message"></div>',
            scope: {
                name: '@formField',
                label: '@',
                hint: '@',
                message: '@hint'
                //value: '='
            },

            link: function($scope, $element, $attrs, controllers){
                var formCtrl = controllers[0], field = controllers[1];
                var $input = $element.find('[ng-model],[data-ng-model]'),
                    inputType = $input.attr('type'),
                    $oldLabel = $element.find('.input > label:first-child'),
                    $newLabel = $element.find('> label');
                field.model = $input.attr('data-ng-model') || $input.attr('ng-model');
                field.element = $element;
                if (!$scope.label && inputType !== 'checkbox') {
                    $scope.label = $oldLabel.text().replace(/\s*:\s*$/, '');
                    angular.forEach($oldLabel.attributes, function(i, attr){
                        var name = attr.name;
                        var value = attr.value;
                        $newLabel.attr(name, value);
                    });
                    $newLabel.addClass($oldLabel.attr('class'));
                    $newLabel.text($scope.label);
                    $oldLabel.remove();
                    //scope.$digest();
                }

                field.label = $scope.label;
                field.name = $scope.name;
                field.message = $scope.message;

                $input.focus(function(){
                    //formCtrl.clearFieldError(scope);
                    //formCtrl.setFieldState(field, 'clean');
                });

                $input.blur(function(){
                    //formCtrl.setFieldError(scope, 'error');
                    if (field.value) {
                        //console.log('validating value: '+scope.value);
                        formCtrl.validateField(field, false);
                    }
                    utils.patchScope($scope);
                    //scope.$apply(); // ok
                });

                /**
                 * setup data-check-if="condition"
                 */
                function setupIf() {
                    if ($attrs['checkIf']) {
                        $scope.$parent.$watch($attrs['checkIf'], function(value){
                            field.active = !!value;
                        });
                    }
                }

                /**
                 * Setup required field check.
                 *
                 * Html format:
                 *      data-required = "This field is required|scopeCondition"
                 * or
                 *      data-check-required-message = "This field is required"
                 *      data-check-required-if = "scopeCondition"
                 */
                function setupRequired() {
                    var short = $attrs['checkRequired'];
                    var shorts = short ? short.split('|') : [];
                    var message = nls._(shorts[0] || $attrs['checkRequiredMessage'] || 'message_required');

                    field.checks.required = {
                        message: message,
                        active: true
                    };
                    var condition = shorts[1] || $attrs['checkRequiredIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.required.active = value;
                        });
                    }
                }

                /**
                 * Setup field value length check.
                 *
                 * Html format:
                 *      data-check-length = "The length of this value should be between {min} and {max} symbols|0|16|scopeCondition"
                 * or
                 *      data-check-length-message = "The length of this value should be between {min} and {max} symbols"
                 *      data-check-length-min = "0"
                 *      data-check-length-max = "16"
                 *      data-check-length-if = "scopeCondition"
                 *
                 */
                function setupLength() {
                    var short = $attrs['checkLength'];
                    var shorts = short ? short.split('|') : [];
                    var min = parseInt(shorts[1] || $attrs['checkLengthMin'] || 0);
                    var max = parseInt(shorts[2] || $attrs['checkLengthMax'] || 0);
                    var messageTemplate = nls._(shorts[0] || $attrs['checkLengthMessage'] || 'message_length');
                    var message = utils.template(messageTemplate, {min: min, max: max, label: field.label});
                    field.checks.length = {
                        message: message,
                        min: min,
                        max: max,
                        active: true
                    };
                    var condition = shorts[3] || $attrs['checkLengthIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.length.active = value;
                        });
                    }
                }

                /**
                 * Setup field value range check.
                 *
                 * Html format:
                 *      data-check-range = "The value should be between {min} and {max}|=0|16|int|scopeCondition"
                 * or
                 *      data-check-range-message = "The value should be between {min} and {max}"
                 *      data-check-range-min = "=0" ('=' means 'inclusive')
                 *      data-check-range-max = "16"
                 *      data-check-range-format = "int"
                 *      data-check-range-if = "scopeCondition"
                 *
                 */
                function setupRange() {
                    var short = $attrs['checkRange'];
                    var shorts = short ? short.split('|') : [];
                    var minStr = shorts[1] || $attrs['checkRangeMin'] || 0;
                    var minE = !!minStr.match(/^=/);
                    var min = minE ? minStr.substr(1) : minStr;
                    var maxStr = shorts[2] || $attrs['checkRangeMax'] || 0;
                    var maxE = !!maxStr.match(/^=/);
                    var max = maxE ? maxStr.substr(1) : maxStr;
                    var format = shorts[3] || $attrs['checkRangeFormat'] || 'int';
                    switch (format) {
                        case 'int':
                            min = parseInt(min);
                            max = parseInt(max);
                            break;
                        case 'float':
                            min = parseFloat(min);
                            max = parseFloat(max);
                            break;
                        default:
                    }
                    var messageTemplate = shorts[0] || $attrs['checkRangeMessage'] ||
                        nls._('message_range');
                    var message = utils.template(messageTemplate, {min: min, max: max, label: field.label});
                    field.checks.range = {
                        message: message,
                        min: min,
                        minE: minE,
                        max: max,
                        maxE: maxE,
                        active: true
                    };
                    var condition = shorts[4] || $attrs['checkRangeIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.range.active = value;
                        });
                    }
                }

                /**
                 * Setup field value 'lower than (<)'.
                 *
                 * Html format:
                 *      data-check-lt = "The value should be lower than {max}|0|int|scopeCondition"
                 * or
                 *      data-check-lt-message = "The value should be lower than {max}"
                 *      data-check-lt-max = "0"
                 *      data-check-lt-format = "int"
                 *      data-check-lt-if = "scopeCondition"
                 */
                function setupLt() {
                    var short = $attrs['checkLt'];
                    var shorts = short ? short.split('|') : [];
                    var max = shorts[1] || $attrs['checkLtMax'] || 0;
                    var messageTemplate = shorts[0] || $attrs['checkLtMessage'] ||
                        nls._('message_lt');
                    var message = utils.template(messageTemplate, {max: max, label: field.label});
                    var format = shorts[2] || $attrs['checkLtFormat'] || 'int';
                    switch (format) {
                        case 'int':
                            max = parseInt(max);
                            break;
                        case 'float':
                            max = parseFloat(max);
                            break;
                        default:
                    }
                    field.checks.lt = {
                        message: message,
                        max: max,
                        active: true
                    };
                    var condition = shorts[3] || $attrs['checkLtIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.lt.active = value;
                        });
                    }
                }

                /**
                 * Setup field value 'lower or equal (<=)'.
                 *
                 * Html format:
                 *      data-check-le = "The value should be lower than {max} or equal|0|int|scopeCondition"
                 * or
                 *      data-check-le-message = "The value should be lower than {max} or equal"
                 *      data-check-le-max = "0"
                 *      data-check-le-format = "int"
                 *      data-check-le-if = "scopeCondition"
                 */
                function setupLe() {
                    var short = $attrs['checkLe'];
                    var shorts = short ? short.split('|') : [];
                    var max = shorts[1] || $attrs['checkLeMax'] || 0;
                    var messageTemplate = shorts[0] || $attrs['checkLeMessage'] ||
                        nls._('message_le');
                    var message = utils.template(messageTemplate, {max: max, label: field.label});
                    var format = shorts[2] || $attrs['checkLeFormat'] || 'int';
                    switch (format) {
                        case 'int':
                            max = parseInt(max);
                            break;
                        case 'float':
                            max = parseFloat(max);
                            break;
                        default:
                    }
                    field.checks.le = {
                        message: message,
                        max: max,
                        active: true
                    };
                    var condition = shorts[3] || $attrs['checkLeIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.le.active = value;
                        });
                    }
                }

                /**
                 * Setup field value 'greater than (>)'.
                 *
                 * Html format:
                 *      data-check-gt = "The value should be greater than {min}|0|int|scopeCondition"
                 * or
                 *      data-check-gt-message = "The value should be greater than {min}"
                 *      data-check-gt-max = "0"
                 *      data-check-gt-format = "int"
                 *      data-check-gt-if = "scopeCondition"
                 */
                function setupGt() {
                    var short = $attrs['checkGt'];
                    var shorts = short ? short.split('|') : [];
                    var min = shorts[1] || $attrs['checkGtMin'] || 0;
                    var messageTemplate = shorts[0] || $attrs['checkGtMessage'] ||
                        nls._('message_gt');
                    var message = utils.template(messageTemplate, {min: min, label: field.label});
                    var format = shorts[2] || $attrs['checkGtFormat'] || 'int';
                    switch (format) {
                        case 'int':
                            min = parseInt(min);
                            break;
                        case 'float':
                            min = parseFloat(min);
                            break;
                        default:
                    }
                    field.checks.gt = {
                        message: message,
                        min: min,
                        active: true
                    };
                    var condition = shorts[3] || $attrs['checkGtIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.gt.active = value;
                        });
                    }
                }

                /**
                 * Setup field value 'greater or equal (<=)'.
                 *
                 * Html format:
                 *      data-check-ge = "The value should be greater than {min} or equal|0|int|scopeCondition"
                 * or
                 *      data-check-ge-message = "The value should be greater than {min} or equal"
                 *      data-check-ge-min = "0"
                 *      data-check-ge-format = "int"
                 *      data-check-ge-if = "scopeCondition"
                 */
                function setupGe() {
                    var short = $attrs['checkGe'];
                    var shorts = short ? short.split('|') : [];
                    var min = shorts[1] || $attrs['checkGeMin'] || 0;
                    var messageTemplate = shorts[0] || $attrs['checkGeMessage'] ||
                        nls._('message_ge');
                    var message = utils.template(messageTemplate, {min: min, label: field.label});
                    var format = shorts[2] || $attrs['checkGeFormat'] || 'int';
                    switch (format) {
                        case 'int':
                            min = parseInt(min);
                            break;
                        case 'float':
                            min = parseFloat(min);
                            break;
                        default:
                    }
                    field.checks.ge = {
                        message: message,
                        min: min,
                        active: true
                    };
                    var condition = shorts[3] || $attrs['checkGeIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.ge.active = value;
                        });
                    }
                }

                /**
                 * Setup field regexp check.
                 * Heads up: If you need '/' char in a message or '|' char in a pattern,
                 * You'd better use extended format instead of short one.
                 *
                 * Html format:
                 *      data-check-regexp = "Invalid phone format|/\d{7}/i|forbid|scopeCondition"
                 * or
                 *      data-check-regexp-message = "Invalid phone format"
                 *      data-check-regexp-pattern = "\d{7}"
                 *      data-check-regexp-modifiers = "i"
                 *      data-check-regexp-forbid = "forbid"
                 *      data-check-regexp-if = "scopeCondition"
                 */
                function setupRegExp() {
                    var short = $attrs['checkRegexp'];
                    var shorts = short ? short.split('|') : [];
                    var patternAndModifiers = short && /\/(.*)\/(\w*)$/.exec(shorts[1]) || [];
                    var message = shorts[0] || $attrs['checkRegexpMessage'] || nls._('message_regexp');
                    var pattern = patternAndModifiers[1] || $attrs['checkRegexpPattern'] || '.*';
                    var modifiers = patternAndModifiers[2] || $attrs['checkRegexpModifiers'] || '';
                    var forbid = shorts[2] || $attrs['checkRegexpForbid'] || false;

                    var regexp = new RegExp(pattern, modifiers);

                    field.checks.regexp = {
                        message: message,
                        regexp: regexp,
                        forbid: forbid,
                        active: true
                    };
                    var condition = shorts[4] || $attrs['checkRegexpIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.regexp.active = value;
                        });
                    }

                    //console.dir({'regexp':scope.checks.regexp});

                }

                /**
                 * Setup email field check.
                 *
                 * Html format:
                 *      data-check-email = "Valid email format: user@domain.com|scopeCondition"
                 * or
                 *      data-check-email-message = "Valid email format: user@domain.com"
                 *      data-check-email-if = "scopeCondition"
                 */
                function setupEmail() {
                    var short = $attrs['checkEmail'];
                    var shorts = short ? short.split('|') : [];
                    var message = nls._(shorts[0] || $attrs['checkEmailMessage'] || 'message_email');
                    field.checks.regexp = {
                        message: message,
                        regexp: /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i,
                        forbid: false,
                        active: true
                    };
                    var condition = shorts[1] || $attrs['checkEmailIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.regexp.active = value;
                        });
                    }
                }

                /**
                 * Setup password compare check.
                 *
                 * Html format:
                 *      data-check-passwords = "pass1_id|Passwords do not match|scopeCondition"
                 * or
                 *      data-check-passwords-message = "Invalid phone format"
                 *      data-check-passwords-repeat = "pass1_id"
                 *      data-check-passwords-if = "scopeCondition"
                 */
                function setupPasswords() {
                    var short = $attrs['checkPasswords']; // 'pass1id|Введенные пароли отличаются'
                    var shorts = short ? short.split('|') : [];

                    var repeat = shorts[0] || $attrs['checkPasswordsRepeat'];

                    var message = shorts[1] || $attrs['checkPasswordsMessage'] || nls._('message_passwords');

                    field.checks.passwords = {
                        message: message,
                        repeat: repeat,
                        active: true
                    };
                    var condition = shorts[2] || $attrs['checkPasswordsIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.passwords.active = value;
                        });
                    }
                }

                /**
                 * Setup backend api check.
                 *
                 * Html format:
                 *      data-check-api = "/api/check-existing/{name}/{value}|Email exists|500|scopeCondition"
                 * or
                 *      data-check-api-message = "Invalid phone format"
                 *      data-check-api-url = "/api/check-existing/{name}/{value}"
                 *      data-check-api-delay = "500"
                 *      data-check-api-if = "scopeCondition"
                 */
                function setupApiCall() {
                    var short = $attrs['checkApi']; // '/api/check-existing/{name}/{value}|Email exists|500'
                    var shorts = short ? short.split('|') : [];

                    var url = shorts[0] || $attrs['checkApiUrl'];

                    var message = shorts[1] || $attrs['checkApiMessage'];

                    var delay = shorts[2] || $attrs['checkApiDelay'] || 0;

                    field.checks.api = {
                        message: message,
                        url: url,
                        delay: delay,
                        dictionary: {},
                        active: true
                    };
                    var condition = shorts[3] || $attrs['checkApiIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.api.active = value;
                        });
                    }

                    $input.on('keyup change', function(){
                        formCtrl.setFieldState(field, 'clean');
                        //utils.patchScope($scope);
                        //scope.$apply(); // ok
                        if (field.value) {
                            delayedCall('check-api-' + field.name, delay, function(){
                                formCtrl.validateField(field, true);
                                //utils.patchScope($scope);
                                //scope.$apply();
                            });
                        }
                    });


                }

                /**
                 * Setup custom check.
                 *
                 * Html format:
                 *      data-check-custom = "validateProjectTitle|Project Title should be sweet|scopeCondition"
                 * or
                 *      data-check-custom-message = "Project Title should be sweet"
                 *      data-check-custom-callback = "validateProjectTitle"
                 *      data-check-custom-if = "scopeCondition"
                 *
                 * callback.call($scope, value) will be called
                 */
                function setupCustom() {
                    var short = $attrs['checkCustom'];
                    var shorts = short ? short.split('|') : [];

                    var callback = shorts[0] || $attrs['checkCustomCallback'];

                    var message = shorts[1] || $attrs['checkCustomMessage'] || nls._('message_custom');

                    field.checks.custom = {
                        message: message,
                        callback: callback,
                        active: true
                    };
                    var condition = shorts[2] || $attrs['checkCustomeIf'];
                    if (condition) {
                        $scope.$parent.$watch(condition, function(value){
                            field.checks.custom.active = value;
                        });
                    }
                }

                angular.forEach($attrs, function(attr, key){
                    var m = key.match(/^check([A-Z][a-z]*)/),
                        check = m && m[1];
                    if (check && !field.checks[check]) {
                        switch (check) {
                            case 'If':
                                setupIf();
                                break;
                            case 'Required':
                                setupRequired();
                                break;
                            case 'Length':
                                setupLength();
                                break;
                            case 'Le':
                                setupLe();
                                break;
                            case 'Lt':
                                setupLt();
                                break;
                            case 'Ge':
                                setupGe();
                                break;
                            case 'Gt':
                                setupGt();
                                break;
                            case 'Range':
                                setupRange();
                                break;
                            case 'Regexp':
                                setupRegExp();
                                break;
                            case 'Email':
                                setupEmail();
                                break;
                            case 'Passwords':
                                setupPasswords();
                                break;
                            case 'Api':
                                setupApiCall();
                                break;
                            case 'Custom':
                                setupCustom();
                                break;
                            default:
                        }
                    }
                });
                //console.dir({'checks': scope.checks});

                $scope.$parent.$watch(field.model, function(value){
                    //console.log('we are watching: '+value);
                    field.value = value;
                    //formCtrl.validateField(scope);
                });

                $scope.$watch('state', function(value){
                    $element.removeClass('clean progress valid invalid');
                    $element.addClass(value);
                });

                formCtrl.addField(field);
            },

            controller: function($scope){

                return {

                    name: '',

                    label: '',

                    message: '',

                    value: null,

                    valid: true,

                    state: 'clean', // clean|progress|valid|invalid

                    active: true,

                    checks: {}
                };
            }
        };
    }])
    .directive('formMessage', function(){
        return {
            require: ['^^formValidator', 'formMessage'],
            restrict: 'AE',
            replace: true,
            controllerAs: 'mb',
            bindToController: true,
            template: '<div class="form-message {{mb.state}}" data-ng-show="!!mb.message" data-ng-bind-html="mb.message"></div>',
            scope: {
                message: '@'
            },

            controller: function(){
                return {
                    message: '',
                    state: ''
                };
            },
            link: function($scope, $element, attrs, controllers){
                var formCtrl = controllers[0], messageBox = controllers[1];
                formCtrl.setMessageBox(messageBox);
            }
        };
    })
    .directive('autoHeight', [function(){
        return {
            restrict: 'A',
            link: function($scope, $element){
                var resizeTextarea = function(){
                    var height = $element.css('box-sizing') === 'border-box' ?
                    parseInt($element.css('borderTopWidth')) +
                    $element.prop('scrollHeight') +
                    parseInt($element.css('borderBottomWidth')) :
                        $element.prop('scrollHeight');
                    $element.css('height', height + 'px');
                };

                $element.on('change input cut paste drop keydown', resizeTextarea);
            }
        };
    }])
    .factory('delayedCall', ['$timeout', function($timeout){
        var timeouts = {};

        /**
         * This function created named timeout that is canceled and rescheduled
         * if function was called once again before timeout happened.
         * Handy for field checks while user types in.
         *
         * @param {string} callId
         * @param {int} timeout
         * @param {function} callback
         */
        return function(callId, delay, callback){
            var handle = timeouts[callId];
            if (handle) {
                $timeout.cancel(handle);
            }
            timeouts[callId] = $timeout(function(){
                timeouts[callId] = null;
                callback();
            }, delay);
        };
    }])
    .config(['nlsProvider', function(nlsProvider){

        // Adding a translation table for the English language
        nlsProvider.setTranslations('en-US', {
            'message_required': 'Required Field',
            'message_length': 'The length of this value should be between {min} and {max} symbols',
            'message_range': 'The value should be between {min} and {max}',
            'message_lt': 'The value should be lower than {max}',
            'message_le': 'The value should be lower than {max} or equal',
            'message_gt': 'The value should be greater than {min}',
            'message_ge': 'The value should be greater than {min} or equal',
            'message_regexp': 'Invalid format',
            'message_email': 'Valid email format: user@domain.com',
            'message_passwords': 'Passwords do not match',
            'message_custom': 'Invalid value'


        });

        nlsProvider.setTranslations('ru-RU', {
            'message_required': 'Обязательное поле',
            'message_length': 'Длина значения должна быть от {min} до {max} символов',
            'message_range': 'Значение должно быть в диапазоне от {min} до {max}',
            'message_lt': 'Значение должно быть меньше {max}',
            'message_le': 'Значение должно быть меньше или равно {max}',
            'message_gt': 'Значение должно быть больше {min}',
            'message_ge': 'Значение должно быть больше или равно {min}',
            'message_regexp': 'Некорректный формат',
            'message_email': 'Формат email: user@domain.com',
            'message_passwords': 'Введенные пароли отличаются',
            'message_custom': 'Некорректное значение'
        });
    }])
;

