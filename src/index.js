/**
 * CoCreateScrollbar - Modern Overlay Scrollbar JavaScript Engine
 * Version 2.1.0
 */
import Observer from '@cocreate/observer';
import './index.css';

const selector = '[scrollbar]';
const optionAttributes = [
    'scrollbar-type',
    'scrollbar-pos',
    'scrollbar-visible'
];

const CoCreateScrollbar = (function () {
    'use strict';

    var instances = new WeakMap();

    /**
     * Core ScrollInstance Class
     */
    function ScrollInstance(el, config) {
        this.element = el;
        this.options = Object.assign({
            visible: 'auto',
            fadeDelay: 1000,
            hScroll: { behavior: 'scroll', pos: 'bottom' },
            vScroll: { behavior: 'scroll', pos: 'right' }
        }, config || {});

        this.minThumbSize = 24;
        this.scrollTimer = null;
        this.isDragging = false;
        this.dragAxis = null;
        this.startPos = { x: 0, y: 0 };
        this.startScroll = { x: 0, y: 0 };

        this.viewport = null;
        this.trackV = null;
        this.thumbV = null;
        this.trackH = null;
        this.thumbH = null;
        this.resizeObserver = null;
        this.createdTrackV = false;
        this.createdTrackH = false;
        this.createdThumbV = false;
        this.createdThumbH = false;
        this.viewportClassAdded = false;
        this.initialized = false;

        this.init();
    }

    ScrollInstance.prototype.parseAttributes = function () {
        var types = (this.element.getAttribute('scrollbar-type') || 'scrollx scrolly').toLowerCase();
        this.options.hScroll.behavior = types.indexOf('scrollx') > -1 ? 'scroll' : 'disabled';
        this.options.vScroll.behavior = types.indexOf('scrolly') > -1 ? 'scroll' : 'disabled';

        var pos = (this.element.getAttribute('scrollbar-pos') || 'right bottom').toLowerCase();
        this.options.vScroll.pos = pos.indexOf('left') > -1 ? 'left' : 'right';
        this.options.hScroll.pos = pos.indexOf('top') > -1 ? 'top' : 'bottom';

        var visible = (this.element.getAttribute('scrollbar-visible') || 'auto').toLowerCase();
        this.options.visible = ['auto', 'show'].indexOf(visible) > -1 ? visible : 'auto';
    };

    ScrollInstance.prototype.applyOptions = function () {
        this.element.classList.toggle('visible-show', this.options.visible === 'show');
        this.element.classList.toggle('disable-y', this.options.vScroll.behavior !== 'scroll');
        this.element.classList.toggle('disable-x', this.options.hScroll.behavior !== 'scroll');
        if (this.trackV) {
            this.trackV.classList.toggle('pos-left', this.options.vScroll.pos === 'left');
        }
        if (this.trackH) {
            this.trackH.classList.toggle('pos-top', this.options.hScroll.pos === 'top');
        }
    };

    ScrollInstance.prototype.refresh = function () {
        this.parseAttributes();
        this.applyOptions();
        this.update();
    };

    ScrollInstance.prototype.init = function () {
        this.parseAttributes();

        // The first non-track child is the existing native scroll container.
        for (var i = 0; i < this.element.children.length; i++) {
            var child = this.element.children[i];
            if (!child.classList.contains('scrollbar-track')) {
                this.viewport = child;
                break;
            }
        }
        if (!this.viewport) return;

        this.viewportClassAdded = !this.viewport.classList.contains('scrollbar-viewport');
        this.viewport.classList.add('scrollbar-viewport');

        // Vertical Track & Thumb Setup
        this.trackV = this.element.querySelector(':scope > .scrollbar-track-y');
        if (!this.trackV) {
            this.trackV = document.createElement('div');
            this.trackV.className = 'scrollbar-track scrollbar-track-y';
            this.thumbV = document.createElement('div');
            this.thumbV.className = 'scrollbar-thumb';
            this.trackV.appendChild(this.thumbV);
            this.element.appendChild(this.trackV);
            this.createdTrackV = true;
            this.createdThumbV = true;
        } else {
            this.thumbV = this.trackV.querySelector('.scrollbar-thumb');
            if (!this.thumbV) {
                this.thumbV = document.createElement('div');
                this.thumbV.className = 'scrollbar-thumb';
                this.trackV.appendChild(this.thumbV);
                this.createdThumbV = true;
            }
        }

        // Horizontal Track & Thumb Setup
        this.trackH = this.element.querySelector(':scope > .scrollbar-track-x');
        if (!this.trackH) {
            this.trackH = document.createElement('div');
            this.trackH.className = 'scrollbar-track scrollbar-track-x';
            this.thumbH = document.createElement('div');
            this.thumbH.className = 'scrollbar-thumb';
            this.trackH.appendChild(this.thumbH);
            this.element.appendChild(this.trackH);
            this.createdTrackH = true;
            this.createdThumbH = true;
        } else {
            this.thumbH = this.trackH.querySelector('.scrollbar-thumb');
            if (!this.thumbH) {
                this.thumbH = document.createElement('div');
                this.thumbH.className = 'scrollbar-thumb';
                this.trackH.appendChild(this.thumbH);
                this.createdThumbH = true;
            }
        }

        // Setup Observers & Listeners
        this.applyOptions();
        this.setupObservers();
        this.bindEvents();
        this.update();
        this.initialized = true;
    };

    ScrollInstance.prototype.setupObservers = function () {
        var self = this;
        if (typeof ResizeObserver !== 'undefined') {
            this.resizeObserver = new ResizeObserver(function () { self.update(); });
            this.resizeObserver.observe(this.element);
            this.resizeObserver.observe(this.viewport);
        }
    };

    ScrollInstance.prototype.update = function () {
        if (!this.viewport) return;

        var scrollTop = this.viewport.scrollTop;
        var scrollLeft = this.viewport.scrollLeft;
        var scrollHeight = this.viewport.scrollHeight;
        var scrollWidth = this.viewport.scrollWidth;
        var clientHeight = this.viewport.clientHeight;
        var clientWidth = this.viewport.clientWidth;

        // Vertical Axis Calculation
        var maxScrollY = scrollHeight - clientHeight;
        if (maxScrollY > 0 && this.options.vScroll.behavior === 'scroll') {
            this.trackV.style.display = 'block';
            var trackH = this.trackV.clientHeight;
            var thumbH = Math.max((clientHeight / scrollHeight) * trackH, this.minThumbSize);
            this.thumbV.style.height = thumbH + 'px';

            var ratioY = scrollTop / maxScrollY;
            var thumbY = ratioY * (trackH - thumbH);
            this.thumbV.style.transform = 'translate3d(0, ' + thumbY + 'px, 0)';
        } else {
            this.trackV.style.display = 'none';
        }

        // Horizontal Axis Calculation
        var maxScrollX = scrollWidth - clientWidth;
        if (maxScrollX > 0 && this.options.hScroll.behavior === 'scroll') {
            this.trackH.style.display = 'block';
            var trackW = this.trackH.clientWidth;
            var thumbW = Math.max((clientWidth / scrollWidth) * trackW, this.minThumbSize);
            this.thumbH.style.width = thumbW + 'px';

            var ratioX = scrollLeft / maxScrollX;
            var thumbX = ratioX * (trackW - thumbW);
            this.thumbH.style.transform = 'translate3d(' + thumbX + 'px, 0, 0)';
        } else {
            this.trackH.style.display = 'none';
        }

        // Dispatch Update Event
        this.element.dispatchEvent(new CustomEvent('cocreate-scroll-update', {
            detail: {
                scrollTop: scrollTop,
                scrollLeft: scrollLeft,
                maxScrollY: maxScrollY,
                maxScrollX: maxScrollX,
                clientHeight: clientHeight,
                clientWidth: clientWidth,
                thumbVHeight: this.thumbV ? this.thumbV.clientHeight : 0,
                thumbHWidth: this.thumbH ? this.thumbH.clientWidth : 0
            }
        }));
    };

    ScrollInstance.prototype.handleScroll = function () {
        var self = this;
        this.update();

        if (this.options.visible === 'auto') {
            this.element.classList.add('scrolling');
            clearTimeout(this.scrollTimer);
            this.scrollTimer = setTimeout(function () {
                if (!self.isDragging) {
                    self.element.classList.remove('scrolling');
                }
            }, this.options.fadeDelay);
        }
    };

    ScrollInstance.prototype.bindEvents = function () {
        var self = this;
        this._onScroll = this.handleScroll.bind(this);
        this.viewport.addEventListener('scroll', this._onScroll, { passive: true });

        // Thumb Dragging
        this._onThumbVMousedown = function (e) { self.startDrag(e, 'v'); };
        this.thumbV.addEventListener('mousedown', this._onThumbVMousedown);
        this.thumbV.addEventListener('touchstart', this._onThumbVMousedown, { passive: false });

        this._onThumbHMousedown = function (e) { self.startDrag(e, 'h'); };
        this.thumbH.addEventListener('mousedown', this._onThumbHMousedown);
        this.thumbH.addEventListener('touchstart', this._onThumbHMousedown, { passive: false });

        // Track Click Jump Logic
        this._onTrackVMousedown = function (e) {
            if (e.target === self.thumbV) return;
            var rect = self.trackV.getBoundingClientRect();
            var clickY = e.clientY - rect.top - (self.thumbV.clientHeight / 2);
            var maxTrackY = self.trackV.clientHeight - self.thumbV.clientHeight;
            var ratio = Math.max(0, Math.min(1, clickY / maxTrackY));
            self.viewport.scrollTo({
                top: ratio * (self.viewport.scrollHeight - self.viewport.clientHeight),
                behavior: 'smooth'
            });
        };
        this.trackV.addEventListener('mousedown', this._onTrackVMousedown);

        this._onTrackHMousedown = function (e) {
            if (e.target === self.thumbH) return;
            var rect = self.trackH.getBoundingClientRect();
            var clickX = e.clientX - rect.left - (self.thumbH.clientWidth / 2);
            var maxTrackX = self.trackH.clientWidth - self.thumbH.clientWidth;
            var ratio = Math.max(0, Math.min(1, clickX / maxTrackX));
            self.viewport.scrollTo({
                left: ratio * (self.viewport.scrollWidth - self.viewport.clientWidth),
                behavior: 'smooth'
            });
        };
        this.trackH.addEventListener('mousedown', this._onTrackHMousedown);
    };

    ScrollInstance.prototype.startDrag = function (e, axis) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();

        var touch = e.touches ? e.touches[0] : e;
        this.isDragging = true;
        this.dragAxis = axis;
        this.startPos = { x: touch.clientX, y: touch.clientY };
        this.startScroll = { x: this.viewport.scrollLeft, y: this.viewport.scrollTop };

        var thumb = axis === 'v' ? this.thumbV : this.thumbH;
        var track = axis === 'v' ? this.trackV : this.trackH;

        thumb.classList.add('is-dragging');
        track.classList.add('is-dragging');
        this.element.classList.add('is-dragging');
        document.body.classList.add('scrollbar-dragging');

        this._onMove = this.onDragMove.bind(this);
        this._onEnd = this.onDragEnd.bind(this);

        document.addEventListener('mousemove', this._onMove);
        document.addEventListener('mouseup', this._onEnd, { once: true });
        document.addEventListener('touchmove', this._onMove, { passive: false });
        document.addEventListener('touchend', this._onEnd, { once: true });
    };

    ScrollInstance.prototype.onDragMove = function (e) {
        if (!this.isDragging) return;
        if (e.cancelable) e.preventDefault();

        var touch = e.touches ? e.touches[0] : e;

        if (this.dragAxis === 'v') {
            var deltaY = touch.clientY - this.startPos.y;
            var trackH = this.trackV.clientHeight;
            var thumbH = this.thumbV.clientHeight;
            var maxThumbY = trackH - thumbH;
            var maxScrollY = this.viewport.scrollHeight - this.viewport.clientHeight;

            if (maxThumbY > 0) {
                this.viewport.scrollTop = this.startScroll.y + (deltaY / maxThumbY) * maxScrollY;
            }
        } else {
            var deltaX = touch.clientX - this.startPos.x;
            var trackW = this.trackH.clientWidth;
            var thumbW = this.thumbH.clientWidth;
            var maxThumbX = trackW - thumbW;
            var maxScrollX = this.viewport.scrollWidth - this.viewport.clientWidth;

            if (maxThumbX > 0) {
                this.viewport.scrollLeft = this.startScroll.x + (deltaX / maxThumbX) * maxScrollX;
            }
        }
    };

    ScrollInstance.prototype.onDragEnd = function () {
        var self = this;
        this.isDragging = false;
        this.thumbV.classList.remove('is-dragging');
        this.trackV.classList.remove('is-dragging');
        this.thumbH.classList.remove('is-dragging');
        this.trackH.classList.remove('is-dragging');
        this.element.classList.remove('is-dragging');
        document.body.classList.remove('scrollbar-dragging');

        document.removeEventListener('mousemove', this._onMove);
        document.removeEventListener('mouseup', this._onEnd);
        document.removeEventListener('touchmove', this._onMove);
        document.removeEventListener('touchend', this._onEnd);

        if (this.options.visible === 'auto') {
            this.scrollTimer = setTimeout(function () {
                self.element.classList.remove('scrolling');
            }, this.options.fadeDelay);
        }
    };

    ScrollInstance.prototype.destroy = function () {
        clearTimeout(this.scrollTimer);
        if (this.resizeObserver) this.resizeObserver.disconnect();
        if (this.viewport && this._onScroll) {
            this.viewport.removeEventListener('scroll', this._onScroll);
        }
        if (this.thumbV && this._onThumbVMousedown) {
            this.thumbV.removeEventListener('mousedown', this._onThumbVMousedown);
            this.thumbV.removeEventListener('touchstart', this._onThumbVMousedown);
        }
        if (this.thumbH && this._onThumbHMousedown) {
            this.thumbH.removeEventListener('mousedown', this._onThumbHMousedown);
            this.thumbH.removeEventListener('touchstart', this._onThumbHMousedown);
        }
        if (this.trackV && this._onTrackVMousedown) {
            this.trackV.removeEventListener('mousedown', this._onTrackVMousedown);
        }
        if (this.trackH && this._onTrackHMousedown) {
            this.trackH.removeEventListener('mousedown', this._onTrackHMousedown);
        }
        document.removeEventListener('mousemove', this._onMove);
        document.removeEventListener('mouseup', this._onEnd);
        document.removeEventListener('touchmove', this._onMove);
        document.removeEventListener('touchend', this._onEnd);
        document.body.classList.remove('scrollbar-dragging');

        if (this.createdTrackV) this.trackV.remove();
        else if (this.createdThumbV) this.thumbV.remove();
        if (this.createdTrackH) this.trackH.remove();
        else if (this.createdThumbH) this.thumbH.remove();
        if (this.viewportClassAdded && this.viewport) {
            this.viewport.classList.remove('scrollbar-viewport');
        }
        this.element.classList.remove(
            'visible-show',
            'disable-y',
            'disable-x',
            'scrolling',
            'is-dragging'
        );
        instances.delete(this.element);
    };

    /* Static Manager Interface */
    var CoCreateScrollbar = {
        init: function (target, config) {
            if (!target) return null;
            var elements = typeof target === 'string' ? document.querySelectorAll(target) : (target.length !== undefined ? target : [target]);
            var created = [];
            for (var i = 0; i < elements.length; i++) {
                var el = elements[i];
                var inst = instances.get(el);
                if (!inst) {
                    inst = new ScrollInstance(el, config);
                    if (!inst.initialized) continue;
                    instances.set(el, inst);
                } else {
                    if (config) {
                        inst.refresh();
                    }
                }
                created.push(inst);
            }
            return created.length === 1 ? created[0] : created;
        },

        get: function (el) {
            return instances.get(el);
        },

        destroy: function (el) {
            var inst = instances.get(el);
            if (inst) inst.destroy();
        },

        initAll: function () {
            if (typeof document === 'undefined') return;
            var targets = document.querySelectorAll(selector);
            for (var i = 0; i < targets.length; i++) {
                this.init(targets[i]);
            }
        }
    };

    return CoCreateScrollbar;
}());

Observer.init({
    name: 'CoCreateOverlayScrollAdded',
    types: ['addedNodes'],
    selector: selector,
    callback: function (mutation) {
        CoCreateScrollbar.init(mutation.target);
    }
});

Observer.init({
    name: 'CoCreateOverlayScrollRemoved',
    types: ['removedNodes'],
    selector: selector,
    callback: function (mutation) {
        CoCreateScrollbar.destroy(mutation.target);
    }
});

Observer.init({
    name: 'CoCreateOverlayScrollAttributes',
    types: ['attributes'],
    attributeFilter: ['scrollbar'].concat(optionAttributes),
    callback: function (mutation) {
        var element = mutation.target;
        if (mutation.attributeName === 'scrollbar') {
            if (element.hasAttribute('scrollbar')) CoCreateScrollbar.init(element);
            else CoCreateScrollbar.destroy(element);
            return;
        }

        var instance = CoCreateScrollbar.get(element);
        if (instance) instance.refresh();
    }
});

CoCreateScrollbar.initAll();

export default CoCreateScrollbar;
