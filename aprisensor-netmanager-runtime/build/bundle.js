
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value') {
                node.value = node[key] = attributes[key];
            }
            else if (descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_options(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            option.selected = ~value.indexOf(option.__value);
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function select_multiple_value(select) {
        return [].map.call(select.querySelectorAll(':checked'), option => option.__value);
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }
    class HtmlTag {
        constructor(anchor = null) {
            this.a = anchor;
            this.e = this.n = null;
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                this.e = element(target.nodeName);
                this.t = target;
                this.h(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* node_modules/svelma/src/components/Icon.svelte generated by Svelte v3.31.1 */

    const file = "node_modules/svelma/src/components/Icon.svelte";

    function create_fragment(ctx) {
    	let span;
    	let i;
    	let i_class_value;
    	let span_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			span = element("span");
    			i = element("i");
    			attr_dev(i, "class", i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]));
    			add_location(i, file, 53, 2, 1189);
    			attr_dev(span, "class", span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""));
    			toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			add_location(span, file, 52, 0, 1046);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, i);

    			if (!mounted) {
    				dispose = listen_dev(span, "click", /*click_handler*/ ctx[12], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newPack, icon, customClass, newCustomSize*/ 325 && i_class_value !== (i_class_value = "" + (/*newPack*/ ctx[8] + " fa-" + /*icon*/ ctx[0] + " " + /*customClass*/ ctx[2] + " " + /*newCustomSize*/ ctx[6]))) {
    				attr_dev(i, "class", i_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight*/ 178 && span_class_value !== (span_class_value = "icon " + /*size*/ ctx[1] + " " + /*newType*/ ctx[7] + " " + (/*isLeft*/ ctx[4] && "is-left" || "") + " " + (/*isRight*/ ctx[5] && "is-right" || ""))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*size, newType, isLeft, isRight, isClickable*/ 186) {
    				toggle_class(span, "is-clickable", /*isClickable*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let newPack;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { type = "" } = $$props;
    	let { pack = "fas" } = $$props;
    	let { icon } = $$props;
    	let { size = "" } = $$props;
    	let { customClass = "" } = $$props;
    	let { customSize = "" } = $$props;
    	let { isClickable = false } = $$props;
    	let { isLeft = false } = $$props;
    	let { isRight = false } = $$props;
    	let newCustomSize = "";
    	let newType = "";

    	const writable_props = [
    		"type",
    		"pack",
    		"icon",
    		"size",
    		"customClass",
    		"customSize",
    		"isClickable",
    		"isLeft",
    		"isRight"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Icon> was created with unknown prop '${key}'`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		pack,
    		icon,
    		size,
    		customClass,
    		customSize,
    		isClickable,
    		isLeft,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(9, type = $$props.type);
    		if ("pack" in $$props) $$invalidate(10, pack = $$props.pack);
    		if ("icon" in $$props) $$invalidate(0, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("customClass" in $$props) $$invalidate(2, customClass = $$props.customClass);
    		if ("customSize" in $$props) $$invalidate(11, customSize = $$props.customSize);
    		if ("isClickable" in $$props) $$invalidate(3, isClickable = $$props.isClickable);
    		if ("isLeft" in $$props) $$invalidate(4, isLeft = $$props.isLeft);
    		if ("isRight" in $$props) $$invalidate(5, isRight = $$props.isRight);
    		if ("newCustomSize" in $$props) $$invalidate(6, newCustomSize = $$props.newCustomSize);
    		if ("newType" in $$props) $$invalidate(7, newType = $$props.newType);
    		if ("newPack" in $$props) $$invalidate(8, newPack = $$props.newPack);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*pack*/ 1024) {
    			 $$invalidate(8, newPack = pack || "fas");
    		}

    		if ($$self.$$.dirty & /*customSize, size*/ 2050) {
    			 {
    				if (customSize) $$invalidate(6, newCustomSize = customSize); else {
    					switch (size) {
    						case "is-small":
    							break;
    						case "is-medium":
    							$$invalidate(6, newCustomSize = "fa-lg");
    							break;
    						case "is-large":
    							$$invalidate(6, newCustomSize = "fa-3x");
    							break;
    						default:
    							$$invalidate(6, newCustomSize = "");
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*type*/ 512) {
    			 {
    				if (!type) $$invalidate(7, newType = "");
    				let splitType = [];

    				if (typeof type === "string") {
    					splitType = type.split("-");
    				} else {
    					for (let key in type) {
    						if (type[key]) {
    							splitType = key.split("-");
    							break;
    						}
    					}
    				}

    				if (splitType.length <= 1) $$invalidate(7, newType = ""); else $$invalidate(7, newType = `has-text-${splitType[1]}`);
    			}
    		}
    	};

    	return [
    		icon,
    		size,
    		customClass,
    		isClickable,
    		isLeft,
    		isRight,
    		newCustomSize,
    		newType,
    		newPack,
    		type,
    		pack,
    		customSize,
    		click_handler
    	];
    }

    class Icon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			type: 9,
    			pack: 10,
    			icon: 0,
    			size: 1,
    			customClass: 2,
    			customSize: 11,
    			isClickable: 3,
    			isLeft: 4,
    			isRight: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[0] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get type() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pack() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pack(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customClass() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customClass(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get customSize() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set customSize(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isClickable() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isClickable(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isLeft() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isLeft(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isRight() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isRight(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicInOut(t) {
        return t < 0.5 ? 4.0 * t * t * t : 0.5 * Math.pow(2.0 * t - 2.0, 3.0) + 1.0;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */

    function __rest(s, e) {
        var t = {};
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
        if (s != null && typeof Object.getOwnPropertySymbols === "function")
            for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
                if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                    t[p[i]] = s[p[i]];
            }
        return t;
    }

    function blur(node, { delay = 0, duration = 400, easing = cubicInOut, amount = 5, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const f = style.filter === 'none' ? '' : style.filter;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `opacity: ${target_opacity - (od * u)}; filter: ${f} blur(${u * amount}px);`
        };
    }
    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function slide(node, { delay = 0, duration = 400, easing = cubicOut }) {
        const style = getComputedStyle(node);
        const opacity = +style.opacity;
        const height = parseFloat(style.height);
        const padding_top = parseFloat(style.paddingTop);
        const padding_bottom = parseFloat(style.paddingBottom);
        const margin_top = parseFloat(style.marginTop);
        const margin_bottom = parseFloat(style.marginBottom);
        const border_top_width = parseFloat(style.borderTopWidth);
        const border_bottom_width = parseFloat(style.borderBottomWidth);
        return {
            delay,
            duration,
            easing,
            css: t => 'overflow: hidden;' +
                `opacity: ${Math.min(t * 20, 1) * opacity};` +
                `height: ${t * height}px;` +
                `padding-top: ${t * padding_top}px;` +
                `padding-bottom: ${t * padding_bottom}px;` +
                `margin-top: ${t * margin_top}px;` +
                `margin-bottom: ${t * margin_bottom}px;` +
                `border-top-width: ${t * border_top_width}px;` +
                `border-bottom-width: ${t * border_bottom_width}px;`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }
    function draw(node, { delay = 0, speed, duration, easing = cubicInOut }) {
        const len = node.getTotalLength();
        if (duration === undefined) {
            if (speed === undefined) {
                duration = 800;
            }
            else {
                duration = len / speed;
            }
        }
        else if (typeof duration === 'function') {
            duration = duration(len);
        }
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `stroke-dasharray: ${t * len} ${u * len}`
        };
    }
    function crossfade(_a) {
        var { fallback } = _a, defaults = __rest(_a, ["fallback"]);
        const to_receive = new Map();
        const to_send = new Map();
        function crossfade(from, node, params) {
            const { delay = 0, duration = d => Math.sqrt(d) * 30, easing = cubicOut } = assign(assign({}, defaults), params);
            const to = node.getBoundingClientRect();
            const dx = from.left - to.left;
            const dy = from.top - to.top;
            const dw = from.width / to.width;
            const dh = from.height / to.height;
            const d = Math.sqrt(dx * dx + dy * dy);
            const style = getComputedStyle(node);
            const transform = style.transform === 'none' ? '' : style.transform;
            const opacity = +style.opacity;
            return {
                delay,
                duration: is_function(duration) ? duration(d) : duration,
                easing,
                css: (t, u) => `
				opacity: ${t * opacity};
				transform-origin: top left;
				transform: ${transform} translate(${u * dx}px,${u * dy}px) scale(${t + (1 - t) * dw}, ${t + (1 - t) * dh});
			`
            };
        }
        function transition(items, counterparts, intro) {
            return (node, params) => {
                items.set(params.key, {
                    rect: node.getBoundingClientRect()
                });
                return () => {
                    if (counterparts.has(params.key)) {
                        const { rect } = counterparts.get(params.key);
                        counterparts.delete(params.key);
                        return crossfade(rect, node, params);
                    }
                    // if the node is disappearing altogether
                    // (i.e. wasn't claimed by the other list)
                    // then we need to supply an outro
                    items.delete(params.key);
                    return fallback && fallback(node, params, intro);
                };
            };
        }
        return [
            transition(to_send, to_receive, false),
            transition(to_receive, to_send, true)
        ];
    }

    var transitions = /*#__PURE__*/Object.freeze({
        __proto__: null,
        blur: blur,
        crossfade: crossfade,
        draw: draw,
        fade: fade,
        fly: fly,
        scale: scale,
        slide: slide
    });

    function chooseAnimation(animation) {
      return typeof animation === 'function' ? animation : transitions[animation]
    }

    function isEnterKey(e) {
      return e.keyCode && e.keyCode === 13
    }

    function isDeleteKey(e) {
      return e.keyCode && e.keyCode === 46
    }

    function isEscKey(e) {
      return e.keyCode && e.keyCode === 27
    }

    function omit(obj, ...keysToOmit) {
      return Object.keys(obj).reduce((acc, key) => {
        if (keysToOmit.indexOf(key) === -1) acc[key] = obj[key];
        return acc
      }, {})
    }

    function typeToIcon(type) {
      switch (type) {
        case 'is-info':
          return 'info-circle'
        case 'is-success':
          return 'check-circle'
        case 'is-warning':
          return 'exclamation-triangle'
        case 'is-danger':
          return 'exclamation-circle'
        default:
          return null
      }
    }

    function getEventsAction(component) {
      return node => {
        const events = Object.keys(component.$$.callbacks);
        const listeners = [];
        events.forEach(event =>
          listeners.push(listen(node, event, e => bubble(component, e)))
        );
        return {
          destroy: () => {
            listeners.forEach(listener => listener());
          }
        };
      };
    }

    /* node_modules/svelma/src/components/Button.svelte generated by Svelte v3.31.1 */

    const { Error: Error_1 } = globals;
    const file$1 = "node_modules/svelma/src/components/Button.svelte";

    // (85:22) 
    function create_if_block_3(ctx) {
    	let a;
    	let t0;
    	let span;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*iconLeft*/ ctx[7] && create_if_block_5(ctx);
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);
    	let if_block1 = /*iconRight*/ ctx[8] && create_if_block_4(ctx);
    	let a_levels = [{ href: /*href*/ ctx[1] }, /*props*/ ctx[11]];
    	let a_data = {};

    	for (let i = 0; i < a_levels.length; i += 1) {
    		a_data = assign(a_data, a_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			a = element("a");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$1, 96, 4, 2314);
    			set_attributes(a, a_data);
    			toggle_class(a, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(a, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(a, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[6]);
    			add_location(a, file$1, 85, 2, 2047);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);
    			if (if_block0) if_block0.m(a, null);
    			append_dev(a, t0);
    			append_dev(a, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(a, t1);
    			if (if_block1) if_block1.m(a, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", /*click_handler_1*/ ctx[17], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconLeft*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*iconLeft*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_5(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(a, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16384) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
    				}
    			}

    			if (/*iconRight*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*iconRight*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(a, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(a, a_data = get_spread_update(a_levels, [
    				(!current || dirty & /*href*/ 2) && { href: /*href*/ ctx[1] },
    				dirty & /*props*/ 2048 && /*props*/ ctx[11]
    			]));

    			toggle_class(a, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(a, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(a, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(85:22) ",
    		ctx
    	});

    	return block;
    }

    // (66:0) {#if tag === 'button'}
    function create_if_block(ctx) {
    	let button;
    	let t0;
    	let span;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*iconLeft*/ ctx[7] && create_if_block_2(ctx);
    	const default_slot_template = /*#slots*/ ctx[15].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[14], null);
    	let if_block1 = /*iconRight*/ ctx[8] && create_if_block_1(ctx);
    	let button_levels = [/*props*/ ctx[11], { type: /*nativeType*/ ctx[2] }];
    	let button_data = {};

    	for (let i = 0; i < button_levels.length; i += 1) {
    		button_data = assign(button_data, button_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			add_location(span, file$1, 77, 4, 1882);
    			set_attributes(button, button_data);
    			toggle_class(button, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(button, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(button, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(button, "is-rounded", /*rounded*/ ctx[6]);
    			add_location(button, file$1, 66, 2, 1599);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			if (if_block0) if_block0.m(button, null);
    			append_dev(button, t0);
    			append_dev(button, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			append_dev(button, t1);
    			if (if_block1) if_block1.m(button, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[16], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*iconLeft*/ ctx[7]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*iconLeft*/ 128) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(button, t0);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16384) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[14], dirty, null, null);
    				}
    			}

    			if (/*iconRight*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*iconRight*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(button, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			set_attributes(button, button_data = get_spread_update(button_levels, [
    				dirty & /*props*/ 2048 && /*props*/ ctx[11],
    				(!current || dirty & /*nativeType*/ 4) && { type: /*nativeType*/ ctx[2] }
    			]));

    			toggle_class(button, "is-inverted", /*inverted*/ ctx[4]);
    			toggle_class(button, "is-loading", /*loading*/ ctx[3]);
    			toggle_class(button, "is-outlined", /*outlined*/ ctx[5]);
    			toggle_class(button, "is-rounded", /*rounded*/ ctx[6]);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(66:0) {#if tag === 'button'}",
    		ctx
    	});

    	return block;
    }

    // (94:4) {#if iconLeft}
    function create_if_block_5(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconLeft*/ ctx[7],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconLeft*/ 128) icon_changes.icon = /*iconLeft*/ ctx[7];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(94:4) {#if iconLeft}",
    		ctx
    	});

    	return block;
    }

    // (100:4) {#if iconRight}
    function create_if_block_4(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconRight*/ ctx[8],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconRight*/ 256) icon_changes.icon = /*iconRight*/ ctx[8];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(100:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    // (75:4) {#if iconLeft}
    function create_if_block_2(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconLeft*/ ctx[7],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconLeft*/ 128) icon_changes.icon = /*iconLeft*/ ctx[7];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(75:4) {#if iconLeft}",
    		ctx
    	});

    	return block;
    }

    // (81:4) {#if iconRight}
    function create_if_block_1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				icon: /*iconRight*/ ctx[8],
    				size: /*iconSize*/ ctx[10]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*iconPack*/ 512) icon_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty & /*iconRight*/ 256) icon_changes.icon = /*iconRight*/ ctx[8];
    			if (dirty & /*iconSize*/ 1024) icon_changes.size = /*iconSize*/ ctx[10];
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(81:4) {#if iconRight}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_if_block_3];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*tag*/ ctx[0] === "button") return 0;
    		if (/*tag*/ ctx[0] === "a") return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error_1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let props;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Button", slots, ['default']);
    	let { tag = "button" } = $$props;
    	let { type = "" } = $$props;
    	let { size = "" } = $$props;
    	let { href = "" } = $$props;
    	let { nativeType = "button" } = $$props;
    	let { loading = false } = $$props;
    	let { inverted = false } = $$props;
    	let { outlined = false } = $$props;
    	let { rounded = false } = $$props;
    	let { iconLeft = null } = $$props;
    	let { iconRight = null } = $$props;
    	let { iconPack = null } = $$props;
    	let iconSize = "";

    	onMount(() => {
    		if (!["button", "a"].includes(tag)) throw new Error(`'${tag}' cannot be used as a tag for a Bulma button`);
    	});

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler_1(event) {
    		bubble($$self, event);
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("tag" in $$new_props) $$invalidate(0, tag = $$new_props.tag);
    		if ("type" in $$new_props) $$invalidate(12, type = $$new_props.type);
    		if ("size" in $$new_props) $$invalidate(13, size = $$new_props.size);
    		if ("href" in $$new_props) $$invalidate(1, href = $$new_props.href);
    		if ("nativeType" in $$new_props) $$invalidate(2, nativeType = $$new_props.nativeType);
    		if ("loading" in $$new_props) $$invalidate(3, loading = $$new_props.loading);
    		if ("inverted" in $$new_props) $$invalidate(4, inverted = $$new_props.inverted);
    		if ("outlined" in $$new_props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("rounded" in $$new_props) $$invalidate(6, rounded = $$new_props.rounded);
    		if ("iconLeft" in $$new_props) $$invalidate(7, iconLeft = $$new_props.iconLeft);
    		if ("iconRight" in $$new_props) $$invalidate(8, iconRight = $$new_props.iconRight);
    		if ("iconPack" in $$new_props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("$$scope" in $$new_props) $$invalidate(14, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		Icon,
    		omit,
    		tag,
    		type,
    		size,
    		href,
    		nativeType,
    		loading,
    		inverted,
    		outlined,
    		rounded,
    		iconLeft,
    		iconRight,
    		iconPack,
    		iconSize,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(18, $$props = assign(assign({}, $$props), $$new_props));
    		if ("tag" in $$props) $$invalidate(0, tag = $$new_props.tag);
    		if ("type" in $$props) $$invalidate(12, type = $$new_props.type);
    		if ("size" in $$props) $$invalidate(13, size = $$new_props.size);
    		if ("href" in $$props) $$invalidate(1, href = $$new_props.href);
    		if ("nativeType" in $$props) $$invalidate(2, nativeType = $$new_props.nativeType);
    		if ("loading" in $$props) $$invalidate(3, loading = $$new_props.loading);
    		if ("inverted" in $$props) $$invalidate(4, inverted = $$new_props.inverted);
    		if ("outlined" in $$props) $$invalidate(5, outlined = $$new_props.outlined);
    		if ("rounded" in $$props) $$invalidate(6, rounded = $$new_props.rounded);
    		if ("iconLeft" in $$props) $$invalidate(7, iconLeft = $$new_props.iconLeft);
    		if ("iconRight" in $$props) $$invalidate(8, iconRight = $$new_props.iconRight);
    		if ("iconPack" in $$props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("iconSize" in $$props) $$invalidate(10, iconSize = $$new_props.iconSize);
    		if ("props" in $$props) $$invalidate(11, props = $$new_props.props);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(11, props = {
    			...omit($$props, "loading", "inverted", "nativeType", "outlined", "rounded", "type"),
    			class: `button ${type} ${size} ${$$props.class || ""}`
    		});

    		if ($$self.$$.dirty & /*size*/ 8192) {
    			 {
    				if (!size || size === "is-medium") {
    					$$invalidate(10, iconSize = "is-small");
    				} else if (size === "is-large") {
    					$$invalidate(10, iconSize = "is-medium");
    				} else {
    					$$invalidate(10, iconSize = size);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		tag,
    		href,
    		nativeType,
    		loading,
    		inverted,
    		outlined,
    		rounded,
    		iconLeft,
    		iconRight,
    		iconPack,
    		iconSize,
    		props,
    		type,
    		size,
    		$$scope,
    		slots,
    		click_handler,
    		click_handler_1
    	];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			tag: 0,
    			type: 12,
    			size: 13,
    			href: 1,
    			nativeType: 2,
    			loading: 3,
    			inverted: 4,
    			outlined: 5,
    			rounded: 6,
    			iconLeft: 7,
    			iconRight: 8,
    			iconPack: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get tag() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tag(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nativeType() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nativeType(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get inverted() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set inverted(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get outlined() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set outlined(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconLeft() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconLeft(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconRight() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconRight(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error_1("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error_1("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Collapse.svelte generated by Svelte v3.31.1 */
    const file$2 = "node_modules/svelma/src/components/Collapse.svelte";
    const get_trigger_slot_changes = dirty => ({});
    const get_trigger_slot_context = ctx => ({});

    // (27:2) {#if open}
    function create_if_block$1(ctx) {
    	let div;
    	let div_transition;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "collapse-content");
    			add_location(div, file$2, 27, 4, 666);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[4], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!div_transition) div_transition = create_bidirectional_transition(div, /*_animation*/ ctx[1], {}, true);
    					div_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);

    			if (local) {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, /*_animation*/ ctx[1], {}, false);
    				div_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(27:2) {#if open}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let current;
    	let mounted;
    	let dispose;
    	const trigger_slot_template = /*#slots*/ ctx[5].trigger;
    	const trigger_slot = create_slot(trigger_slot_template, ctx, /*$$scope*/ ctx[4], get_trigger_slot_context);
    	let if_block = /*open*/ ctx[0] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (trigger_slot) trigger_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "collapse-trigger");
    			add_location(div0, file$2, 23, 2, 563);
    			attr_dev(div1, "class", "collapse");
    			add_location(div1, file$2, 22, 0, 538);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (trigger_slot) {
    				trigger_slot.m(div0, null);
    			}

    			append_dev(div1, t);
    			if (if_block) if_block.m(div1, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*toggle*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (trigger_slot) {
    				if (trigger_slot.p && dirty & /*$$scope*/ 16) {
    					update_slot(trigger_slot, trigger_slot_template, ctx, /*$$scope*/ ctx[4], dirty, get_trigger_slot_changes, get_trigger_slot_context);
    				}
    			}

    			if (/*open*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*open*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(trigger_slot, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(trigger_slot, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (trigger_slot) trigger_slot.d(detaching);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Collapse", slots, ['trigger','default']);
    	let { open = true } = $$props;
    	let { animation = "slide" } = $$props;
    	let _animation = transitions[animation];

    	function toggle() {
    		$$invalidate(0, open = !open);
    	}

    	const writable_props = ["open", "animation"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Collapse> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("animation" in $$props) $$invalidate(3, animation = $$props.animation);
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		transitions,
    		open,
    		animation,
    		_animation,
    		toggle
    	});

    	$$self.$inject_state = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("animation" in $$props) $$invalidate(3, animation = $$props.animation);
    		if ("_animation" in $$props) $$invalidate(1, _animation = $$props._animation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*animation*/ 8) {
    			 $$invalidate(1, _animation = typeof animation === "function"
    			? animation
    			: transitions[animation]);
    		}
    	};

    	return [open, _animation, toggle, animation, $$scope, slots];
    }

    class Collapse extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { open: 0, animation: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Collapse",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get open() {
    		throw new Error("<Collapse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Collapse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animation() {
    		throw new Error("<Collapse>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<Collapse>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Dialog/Dialog.svelte generated by Svelte v3.31.1 */
    const file$3 = "node_modules/svelma/src/components/Dialog/Dialog.svelte";

    // (214:0) {#if active}
    function create_if_block$2(ctx) {
    	let div4;
    	let div0;
    	let t0;
    	let div3;
    	let t1;
    	let section;
    	let div2;
    	let t2;
    	let div1;
    	let p;
    	let t3;
    	let t4;
    	let footer;
    	let t5;
    	let button;
    	let t6;
    	let button_class_value;
    	let div3_transition;
    	let div4_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*title*/ ctx[2] && create_if_block_4$1(ctx);
    	let if_block1 = /*icon*/ ctx[6] && create_if_block_3$1(ctx);
    	let if_block2 = /*hasInput*/ ctx[8] && create_if_block_2$1(ctx);
    	let if_block3 = /*showCancel*/ ctx[9] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div3 = element("div");
    			if (if_block0) if_block0.c();
    			t1 = space();
    			section = element("section");
    			div2 = element("div");
    			if (if_block1) if_block1.c();
    			t2 = space();
    			div1 = element("div");
    			p = element("p");
    			t3 = space();
    			if (if_block2) if_block2.c();
    			t4 = space();
    			footer = element("footer");
    			if (if_block3) if_block3.c();
    			t5 = space();
    			button = element("button");
    			t6 = text(/*confirmText*/ ctx[4]);
    			attr_dev(div0, "class", "modal-background");
    			add_location(div0, file$3, 215, 4, 4985);
    			add_location(p, file$3, 234, 12, 5760);
    			attr_dev(div1, "class", "media-content");
    			add_location(div1, file$3, 233, 10, 5720);
    			attr_dev(div2, "class", "media");
    			add_location(div2, file$3, 227, 8, 5523);
    			attr_dev(section, "class", "modal-card-body svelte-ftbi9k");
    			toggle_class(section, "is-titleless", !/*title*/ ctx[2]);
    			toggle_class(section, "is-flex", /*icon*/ ctx[6]);
    			add_location(section, file$3, 226, 6, 5432);
    			attr_dev(button, "class", button_class_value = "button " + /*type*/ ctx[11] + " svelte-ftbi9k");
    			add_location(button, file$3, 262, 8, 6565);
    			attr_dev(footer, "class", "modal-card-foot svelte-ftbi9k");
    			add_location(footer, file$3, 253, 6, 6319);
    			attr_dev(div3, "class", "modal-card svelte-ftbi9k");
    			add_location(div3, file$3, 216, 4, 5043);
    			attr_dev(div4, "class", div4_class_value = "modal dialog " + /*size*/ ctx[10] + " is-active" + " svelte-ftbi9k");
    			add_location(div4, file$3, 214, 2, 4919);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div0);
    			append_dev(div4, t0);
    			append_dev(div4, div3);
    			if (if_block0) if_block0.m(div3, null);
    			append_dev(div3, t1);
    			append_dev(div3, section);
    			append_dev(section, div2);
    			if (if_block1) if_block1.m(div2, null);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			p.innerHTML = /*message*/ ctx[3];
    			append_dev(div1, t3);
    			if (if_block2) if_block2.m(div1, null);
    			append_dev(div3, t4);
    			append_dev(div3, footer);
    			if (if_block3) if_block3.m(footer, null);
    			append_dev(footer, t5);
    			append_dev(footer, button);
    			append_dev(button, t6);
    			/*button_binding_1*/ ctx[34](button);
    			/*div4_binding*/ ctx[35](div4);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*close*/ ctx[21], false, false, false),
    					listen_dev(button, "click", /*confirm*/ ctx[22], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*title*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4$1(ctx);
    					if_block0.c();
    					if_block0.m(div3, t1);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*icon*/ ctx[6]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*icon*/ 64) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_3$1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div2, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*message*/ 8) p.innerHTML = /*message*/ ctx[3];
    			if (/*hasInput*/ ctx[8]) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block_2$1(ctx);
    					if_block2.c();
    					if_block2.m(div1, null);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}

    			if (dirty[0] & /*title*/ 4) {
    				toggle_class(section, "is-titleless", !/*title*/ ctx[2]);
    			}

    			if (dirty[0] & /*icon*/ 64) {
    				toggle_class(section, "is-flex", /*icon*/ ctx[6]);
    			}

    			if (/*showCancel*/ ctx[9]) {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block_1$1(ctx);
    					if_block3.c();
    					if_block3.m(footer, t5);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (!current || dirty[0] & /*confirmText*/ 16) set_data_dev(t6, /*confirmText*/ ctx[4]);

    			if (!current || dirty[0] & /*type*/ 2048 && button_class_value !== (button_class_value = "button " + /*type*/ ctx[11] + " svelte-ftbi9k")) {
    				attr_dev(button, "class", button_class_value);
    			}

    			if (!current || dirty[0] & /*size*/ 1024 && div4_class_value !== (div4_class_value = "modal dialog " + /*size*/ ctx[10] + " is-active" + " svelte-ftbi9k")) {
    				attr_dev(div4, "class", div4_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);

    			add_render_callback(() => {
    				if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*_animation*/ ctx[18], /*animProps*/ ctx[12], true);
    				div3_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			if (!div3_transition) div3_transition = create_bidirectional_transition(div3, /*_animation*/ ctx[18], /*animProps*/ ctx[12], false);
    			div3_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    			/*button_binding_1*/ ctx[34](null);
    			if (detaching && div3_transition) div3_transition.end();
    			/*div4_binding*/ ctx[35](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(214:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    // (218:6) {#if title}
    function create_if_block_4$1(ctx) {
    	let header;
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			header = element("header");
    			p = element("p");
    			t = text(/*title*/ ctx[2]);
    			attr_dev(p, "class", "modal-card-title");
    			add_location(p, file$3, 219, 10, 5171);
    			attr_dev(header, "class", "modal-card-head svelte-ftbi9k");
    			add_location(header, file$3, 218, 8, 5128);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, p);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(218:6) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (229:10) {#if icon}
    function create_if_block_3$1(ctx) {
    	let div;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[7],
    				icon: /*icon*/ ctx[6],
    				type: /*type*/ ctx[11],
    				size: "is-large"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon_1.$$.fragment);
    			attr_dev(div, "class", "media-left");
    			add_location(div, file$3, 229, 12, 5576);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iconPack*/ 128) icon_1_changes.pack = /*iconPack*/ ctx[7];
    			if (dirty[0] & /*icon*/ 64) icon_1_changes.icon = /*icon*/ ctx[6];
    			if (dirty[0] & /*type*/ 2048) icon_1_changes.type = /*type*/ ctx[11];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(229:10) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (237:12) {#if hasInput}
    function create_if_block_2$1(ctx) {
    	let div1;
    	let div0;
    	let input_1;
    	let t0;
    	let p;
    	let t1;
    	let mounted;
    	let dispose;
    	let input_1_levels = [{ class: "input" }, /*newInputProps*/ ctx[19]];
    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			input_1 = element("input");
    			t0 = space();
    			p = element("p");
    			t1 = text(/*validationMessage*/ ctx[17]);
    			set_attributes(input_1, input_1_data);
    			toggle_class(input_1, "svelte-ftbi9k", true);
    			add_location(input_1, file$3, 239, 18, 5901);
    			attr_dev(p, "class", "help is-danger");
    			add_location(p, file$3, 245, 18, 6151);
    			attr_dev(div0, "class", "control");
    			add_location(div0, file$3, 238, 16, 5861);
    			attr_dev(div1, "class", "field svelte-ftbi9k");
    			add_location(div1, file$3, 237, 14, 5825);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, input_1);
    			set_input_value(input_1, /*prompt*/ ctx[1]);
    			/*input_1_binding*/ ctx[31](input_1);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(p, t1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "input", /*input_1_input_handler*/ ctx[30]),
    					listen_dev(input_1, "keyup", /*keyup_handler*/ ctx[32], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
    				{ class: "input" },
    				dirty[0] & /*newInputProps*/ 524288 && /*newInputProps*/ ctx[19]
    			]));

    			if (dirty[0] & /*prompt*/ 2 && input_1.value !== /*prompt*/ ctx[1]) {
    				set_input_value(input_1, /*prompt*/ ctx[1]);
    			}

    			toggle_class(input_1, "svelte-ftbi9k", true);
    			if (dirty[0] & /*validationMessage*/ 131072) set_data_dev(t1, /*validationMessage*/ ctx[17]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			/*input_1_binding*/ ctx[31](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(237:12) {#if hasInput}",
    		ctx
    	});

    	return block;
    }

    // (255:8) {#if showCancel}
    function create_if_block_1$1(ctx) {
    	let button;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			t = text(/*cancelText*/ ctx[5]);
    			attr_dev(button, "class", "button svelte-ftbi9k");
    			add_location(button, file$3, 255, 10, 6387);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, t);
    			/*button_binding*/ ctx[33](button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*cancel*/ ctx[20], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*cancelText*/ 32) set_data_dev(t, /*cancelText*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			/*button_binding*/ ctx[33](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(255:8) {#if showCancel}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*active*/ ctx[0] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keydown*/ ctx[23], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let _animation;
    	let newInputProps;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Dialog", slots, []);
    	let { title = "" } = $$props;
    	let { message } = $$props;
    	let { confirmText = "OK" } = $$props;
    	let { cancelText = "Cancel" } = $$props;
    	let { focusOn = "confirm" } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let { hasInput = false } = $$props;
    	let { prompt = null } = $$props;
    	let { showCancel = false } = $$props;
    	let { size = "" } = $$props;
    	let { type = "is-primary" } = $$props;
    	let { active = true } = $$props;
    	let { animation = "scale" } = $$props;
    	let { animProps = { start: 1.2 } } = $$props;
    	let { inputProps = {} } = $$props;

    	// export let showClose = true
    	let resolve;

    	let { promise = new Promise(fulfil => resolve = fulfil) } = $$props;
    	let { subComponent = null } = $$props;
    	let { appendToBody = true } = $$props;
    	let modal;
    	let cancelButton;
    	let confirmButton;
    	let input;
    	let validationMessage = "";
    	const dispatch = createEventDispatcher();

    	onMount(async () => {
    		await tick();

    		if (hasInput) {
    			input.focus();
    		} else if (focusOn === "cancel" && showCancel) {
    			cancelButton.focus();
    		} else {
    			confirmButton.focus();
    		}
    	});

    	function cancel() {
    		resolve(hasInput ? null : false);
    		close();
    	}

    	function close() {
    		resolve(hasInput ? null : false);
    		$$invalidate(0, active = false);
    		dispatch("destroyed");
    	}

    	async function confirm() {
    		if (input && !input.checkValidity()) {
    			$$invalidate(17, validationMessage = input.validationMessage);
    			await tick();
    			input.select();
    			return;
    		}

    		$$invalidate(17, validationMessage = "");
    		resolve(hasInput ? prompt : true);
    		close();
    	}

    	function keydown(e) {
    		if (active && isEscKey(e)) {
    			close();
    		}
    	}

    	const writable_props = [
    		"title",
    		"message",
    		"confirmText",
    		"cancelText",
    		"focusOn",
    		"icon",
    		"iconPack",
    		"hasInput",
    		"prompt",
    		"showCancel",
    		"size",
    		"type",
    		"active",
    		"animation",
    		"animProps",
    		"inputProps",
    		"promise",
    		"subComponent",
    		"appendToBody"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Dialog> was created with unknown prop '${key}'`);
    	});

    	function input_1_input_handler() {
    		prompt = this.value;
    		$$invalidate(1, prompt);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(16, input);
    		});
    	}

    	const keyup_handler = e => isEnterKey(e) && confirm();

    	function button_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			cancelButton = $$value;
    			$$invalidate(14, cancelButton);
    		});
    	}

    	function button_binding_1($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			confirmButton = $$value;
    			$$invalidate(15, confirmButton);
    		});
    	}

    	function div4_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			modal = $$value;
    			$$invalidate(13, modal);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("message" in $$props) $$invalidate(3, message = $$props.message);
    		if ("confirmText" in $$props) $$invalidate(4, confirmText = $$props.confirmText);
    		if ("cancelText" in $$props) $$invalidate(5, cancelText = $$props.cancelText);
    		if ("focusOn" in $$props) $$invalidate(24, focusOn = $$props.focusOn);
    		if ("icon" in $$props) $$invalidate(6, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(7, iconPack = $$props.iconPack);
    		if ("hasInput" in $$props) $$invalidate(8, hasInput = $$props.hasInput);
    		if ("prompt" in $$props) $$invalidate(1, prompt = $$props.prompt);
    		if ("showCancel" in $$props) $$invalidate(9, showCancel = $$props.showCancel);
    		if ("size" in $$props) $$invalidate(10, size = $$props.size);
    		if ("type" in $$props) $$invalidate(11, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("animation" in $$props) $$invalidate(25, animation = $$props.animation);
    		if ("animProps" in $$props) $$invalidate(12, animProps = $$props.animProps);
    		if ("inputProps" in $$props) $$invalidate(26, inputProps = $$props.inputProps);
    		if ("promise" in $$props) $$invalidate(27, promise = $$props.promise);
    		if ("subComponent" in $$props) $$invalidate(28, subComponent = $$props.subComponent);
    		if ("appendToBody" in $$props) $$invalidate(29, appendToBody = $$props.appendToBody);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		tick,
    		Icon,
    		chooseAnimation,
    		isEnterKey,
    		isEscKey,
    		title,
    		message,
    		confirmText,
    		cancelText,
    		focusOn,
    		icon,
    		iconPack,
    		hasInput,
    		prompt,
    		showCancel,
    		size,
    		type,
    		active,
    		animation,
    		animProps,
    		inputProps,
    		resolve,
    		promise,
    		subComponent,
    		appendToBody,
    		modal,
    		cancelButton,
    		confirmButton,
    		input,
    		validationMessage,
    		dispatch,
    		cancel,
    		close,
    		confirm,
    		keydown,
    		_animation,
    		newInputProps
    	});

    	$$self.$inject_state = $$props => {
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("message" in $$props) $$invalidate(3, message = $$props.message);
    		if ("confirmText" in $$props) $$invalidate(4, confirmText = $$props.confirmText);
    		if ("cancelText" in $$props) $$invalidate(5, cancelText = $$props.cancelText);
    		if ("focusOn" in $$props) $$invalidate(24, focusOn = $$props.focusOn);
    		if ("icon" in $$props) $$invalidate(6, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(7, iconPack = $$props.iconPack);
    		if ("hasInput" in $$props) $$invalidate(8, hasInput = $$props.hasInput);
    		if ("prompt" in $$props) $$invalidate(1, prompt = $$props.prompt);
    		if ("showCancel" in $$props) $$invalidate(9, showCancel = $$props.showCancel);
    		if ("size" in $$props) $$invalidate(10, size = $$props.size);
    		if ("type" in $$props) $$invalidate(11, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("animation" in $$props) $$invalidate(25, animation = $$props.animation);
    		if ("animProps" in $$props) $$invalidate(12, animProps = $$props.animProps);
    		if ("inputProps" in $$props) $$invalidate(26, inputProps = $$props.inputProps);
    		if ("resolve" in $$props) resolve = $$props.resolve;
    		if ("promise" in $$props) $$invalidate(27, promise = $$props.promise);
    		if ("subComponent" in $$props) $$invalidate(28, subComponent = $$props.subComponent);
    		if ("appendToBody" in $$props) $$invalidate(29, appendToBody = $$props.appendToBody);
    		if ("modal" in $$props) $$invalidate(13, modal = $$props.modal);
    		if ("cancelButton" in $$props) $$invalidate(14, cancelButton = $$props.cancelButton);
    		if ("confirmButton" in $$props) $$invalidate(15, confirmButton = $$props.confirmButton);
    		if ("input" in $$props) $$invalidate(16, input = $$props.input);
    		if ("validationMessage" in $$props) $$invalidate(17, validationMessage = $$props.validationMessage);
    		if ("_animation" in $$props) $$invalidate(18, _animation = $$props._animation);
    		if ("newInputProps" in $$props) $$invalidate(19, newInputProps = $$props.newInputProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*animation*/ 33554432) {
    			 $$invalidate(18, _animation = chooseAnimation(animation));
    		}

    		if ($$self.$$.dirty[0] & /*modal, active, appendToBody*/ 536879105) {
    			 {
    				if (modal && active && appendToBody) {
    					modal.parentNode.removeChild(modal);
    					document.body.appendChild(modal);
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*inputProps*/ 67108864) {
    			 $$invalidate(19, newInputProps = { required: true, ...inputProps });
    		}
    	};

    	return [
    		active,
    		prompt,
    		title,
    		message,
    		confirmText,
    		cancelText,
    		icon,
    		iconPack,
    		hasInput,
    		showCancel,
    		size,
    		type,
    		animProps,
    		modal,
    		cancelButton,
    		confirmButton,
    		input,
    		validationMessage,
    		_animation,
    		newInputProps,
    		cancel,
    		close,
    		confirm,
    		keydown,
    		focusOn,
    		animation,
    		inputProps,
    		promise,
    		subComponent,
    		appendToBody,
    		input_1_input_handler,
    		input_1_binding,
    		keyup_handler,
    		button_binding,
    		button_binding_1,
    		div4_binding
    	];
    }

    class Dialog$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				title: 2,
    				message: 3,
    				confirmText: 4,
    				cancelText: 5,
    				focusOn: 24,
    				icon: 6,
    				iconPack: 7,
    				hasInput: 8,
    				prompt: 1,
    				showCancel: 9,
    				size: 10,
    				type: 11,
    				active: 0,
    				animation: 25,
    				animProps: 12,
    				inputProps: 26,
    				promise: 27,
    				subComponent: 28,
    				appendToBody: 29
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Dialog",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[3] === undefined && !("message" in props)) {
    			console.warn("<Dialog> was created without expected prop 'message'");
    		}
    	}

    	get title() {
    		return this.$$.ctx[2];
    	}

    	set title(title) {
    		this.$set({ title });
    		flush();
    	}

    	get message() {
    		return this.$$.ctx[3];
    	}

    	set message(message) {
    		this.$set({ message });
    		flush();
    	}

    	get confirmText() {
    		return this.$$.ctx[4];
    	}

    	set confirmText(confirmText) {
    		this.$set({ confirmText });
    		flush();
    	}

    	get cancelText() {
    		return this.$$.ctx[5];
    	}

    	set cancelText(cancelText) {
    		this.$set({ cancelText });
    		flush();
    	}

    	get focusOn() {
    		return this.$$.ctx[24];
    	}

    	set focusOn(focusOn) {
    		this.$set({ focusOn });
    		flush();
    	}

    	get icon() {
    		return this.$$.ctx[6];
    	}

    	set icon(icon) {
    		this.$set({ icon });
    		flush();
    	}

    	get iconPack() {
    		return this.$$.ctx[7];
    	}

    	set iconPack(iconPack) {
    		this.$set({ iconPack });
    		flush();
    	}

    	get hasInput() {
    		return this.$$.ctx[8];
    	}

    	set hasInput(hasInput) {
    		this.$set({ hasInput });
    		flush();
    	}

    	get prompt() {
    		return this.$$.ctx[1];
    	}

    	set prompt(prompt) {
    		this.$set({ prompt });
    		flush();
    	}

    	get showCancel() {
    		return this.$$.ctx[9];
    	}

    	set showCancel(showCancel) {
    		this.$set({ showCancel });
    		flush();
    	}

    	get size() {
    		return this.$$.ctx[10];
    	}

    	set size(size) {
    		this.$set({ size });
    		flush();
    	}

    	get type() {
    		return this.$$.ctx[11];
    	}

    	set type(type) {
    		this.$set({ type });
    		flush();
    	}

    	get active() {
    		return this.$$.ctx[0];
    	}

    	set active(active) {
    		this.$set({ active });
    		flush();
    	}

    	get animation() {
    		return this.$$.ctx[25];
    	}

    	set animation(animation) {
    		this.$set({ animation });
    		flush();
    	}

    	get animProps() {
    		return this.$$.ctx[12];
    	}

    	set animProps(animProps) {
    		this.$set({ animProps });
    		flush();
    	}

    	get inputProps() {
    		return this.$$.ctx[26];
    	}

    	set inputProps(inputProps) {
    		this.$set({ inputProps });
    		flush();
    	}

    	get promise() {
    		return this.$$.ctx[27];
    	}

    	set promise(promise) {
    		this.$set({ promise });
    		flush();
    	}

    	get subComponent() {
    		return this.$$.ctx[28];
    	}

    	set subComponent(subComponent) {
    		this.$set({ subComponent });
    		flush();
    	}

    	get appendToBody() {
    		return this.$$.ctx[29];
    	}

    	set appendToBody(appendToBody) {
    		this.$set({ appendToBody });
    		flush();
    	}
    }

    function createDialog(props) {
      if (typeof props === 'string') props = { message: props };

      const dialog = new Dialog$1({
        target: document.body,
        props,
        intro: true,
      });

      dialog.$on('destroy', () => {
      });

      return dialog.promise
    }

    function alert(props) {
      return createDialog(props);
    }

    function confirm(props) {
      if (typeof props === 'string') props = { message: props };

      return createDialog({ showCancel: true, ...props });
    }

    function prompt(props) {
      if (typeof props === 'string') props = { message: props };

      return createDialog({ hasInput: true, confirmText: 'Done', ...props });
    }

    Dialog$1.alert = alert;
    Dialog$1.confirm = confirm;
    Dialog$1.prompt = prompt;

    /* node_modules/svelma/src/components/Field.svelte generated by Svelte v3.31.1 */
    const file$4 = "node_modules/svelma/src/components/Field.svelte";
    const get_default_slot_changes = dirty => ({ statusType: dirty & /*type*/ 1 });
    const get_default_slot_context = ctx => ({ statusType: /*type*/ ctx[0] });

    // (107:2) {#if label}
    function create_if_block_1$2(ctx) {
    	let label_1;
    	let t;

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			t = text(/*label*/ ctx[1]);
    			attr_dev(label_1, "for", /*labelFor*/ ctx[2]);
    			attr_dev(label_1, "class", "label");
    			add_location(label_1, file$4, 107, 4, 2643);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, t);
    			/*label_1_binding*/ ctx[19](label_1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*label*/ 2) set_data_dev(t, /*label*/ ctx[1]);

    			if (dirty & /*labelFor*/ 4) {
    				attr_dev(label_1, "for", /*labelFor*/ ctx[2]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			/*label_1_binding*/ ctx[19](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(107:2) {#if label}",
    		ctx
    	});

    	return block;
    }

    // (111:2) {#if message}
    function create_if_block$3(ctx) {
    	let p;
    	let t;
    	let p_class_value;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*message*/ ctx[3]);
    			attr_dev(p, "class", p_class_value = "help " + /*type*/ ctx[0] + " svelte-zc3i6x");
    			add_location(p, file$4, 111, 4, 2772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    			/*p_binding*/ ctx[20](p);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 8) set_data_dev(t, /*message*/ ctx[3]);

    			if (dirty & /*type*/ 1 && p_class_value !== (p_class_value = "help " + /*type*/ ctx[0] + " svelte-zc3i6x")) {
    				attr_dev(p, "class", p_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			/*p_binding*/ ctx[20](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(111:2) {#if message}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let div_class_value;
    	let current;
    	let if_block0 = /*label*/ ctx[1] && create_if_block_1$2(ctx);
    	const default_slot_template = /*#slots*/ ctx[18].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[17], get_default_slot_context);
    	let if_block1 = /*message*/ ctx[3] && create_if_block$3(ctx);

    	let div_levels = [
    		/*props*/ ctx[11],
    		{
    			class: div_class_value = "field " + /*type*/ ctx[0] + " " + /*fieldType*/ ctx[9] + " " + /*newPosition*/ ctx[10] + " " + (/*$$props*/ ctx[12].class || "")
    		}
    	];

    	let div_data = {};

    	for (let i = 0; i < div_levels.length; i += 1) {
    		div_data = assign(div_data, div_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (default_slot) default_slot.c();
    			t1 = space();
    			if (if_block1) if_block1.c();
    			set_attributes(div, div_data);
    			toggle_class(div, "is-expanded", /*expanded*/ ctx[5]);
    			toggle_class(div, "is-grouped-multiline", /*groupMultiline*/ ctx[4]);
    			toggle_class(div, "svelte-zc3i6x", true);
    			add_location(div, file$4, 105, 0, 2451);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			append_dev(div, t1);
    			if (if_block1) if_block1.m(div, null);
    			/*div_binding*/ ctx[21](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*label*/ ctx[1]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$2(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, type*/ 131073) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[17], dirty, get_default_slot_changes, get_default_slot_context);
    				}
    			}

    			if (/*message*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$3(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			set_attributes(div, div_data = get_spread_update(div_levels, [
    				dirty & /*props*/ 2048 && /*props*/ ctx[11],
    				(!current || dirty & /*type, fieldType, newPosition, $$props*/ 5633 && div_class_value !== (div_class_value = "field " + /*type*/ ctx[0] + " " + /*fieldType*/ ctx[9] + " " + /*newPosition*/ ctx[10] + " " + (/*$$props*/ ctx[12].class || ""))) && { class: div_class_value }
    			]));

    			toggle_class(div, "is-expanded", /*expanded*/ ctx[5]);
    			toggle_class(div, "is-grouped-multiline", /*groupMultiline*/ ctx[4]);
    			toggle_class(div, "svelte-zc3i6x", true);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (default_slot) default_slot.d(detaching);
    			if (if_block1) if_block1.d();
    			/*div_binding*/ ctx[21](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let props;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Field", slots, ['default']);
    	let { type = "" } = $$props;
    	let { label = null } = $$props;
    	let { labelFor = "" } = $$props;
    	let { message = "" } = $$props;
    	let { grouped = false } = $$props;
    	let { groupMultiline = false } = $$props;
    	let { position = "" } = $$props;
    	let { addons = true } = $$props;
    	let { expanded = false } = $$props;
    	setContext("type", () => type);
    	let el;
    	let labelEl;
    	let messageEl;
    	let fieldType = "";
    	let hasIcons = false;
    	let iconType = "";
    	let mounted = false;
    	let newPosition = "";

    	onMount(() => {
    		$$invalidate(16, mounted = true);
    	});

    	function label_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			labelEl = $$value;
    			$$invalidate(7, labelEl);
    		});
    	}

    	function p_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			messageEl = $$value;
    			$$invalidate(8, messageEl);
    		});
    	}

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(6, el);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("type" in $$new_props) $$invalidate(0, type = $$new_props.type);
    		if ("label" in $$new_props) $$invalidate(1, label = $$new_props.label);
    		if ("labelFor" in $$new_props) $$invalidate(2, labelFor = $$new_props.labelFor);
    		if ("message" in $$new_props) $$invalidate(3, message = $$new_props.message);
    		if ("grouped" in $$new_props) $$invalidate(13, grouped = $$new_props.grouped);
    		if ("groupMultiline" in $$new_props) $$invalidate(4, groupMultiline = $$new_props.groupMultiline);
    		if ("position" in $$new_props) $$invalidate(14, position = $$new_props.position);
    		if ("addons" in $$new_props) $$invalidate(15, addons = $$new_props.addons);
    		if ("expanded" in $$new_props) $$invalidate(5, expanded = $$new_props.expanded);
    		if ("$$scope" in $$new_props) $$invalidate(17, $$scope = $$new_props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		setContext,
    		omit,
    		type,
    		label,
    		labelFor,
    		message,
    		grouped,
    		groupMultiline,
    		position,
    		addons,
    		expanded,
    		el,
    		labelEl,
    		messageEl,
    		fieldType,
    		hasIcons,
    		iconType,
    		mounted,
    		newPosition,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
    		if ("type" in $$props) $$invalidate(0, type = $$new_props.type);
    		if ("label" in $$props) $$invalidate(1, label = $$new_props.label);
    		if ("labelFor" in $$props) $$invalidate(2, labelFor = $$new_props.labelFor);
    		if ("message" in $$props) $$invalidate(3, message = $$new_props.message);
    		if ("grouped" in $$props) $$invalidate(13, grouped = $$new_props.grouped);
    		if ("groupMultiline" in $$props) $$invalidate(4, groupMultiline = $$new_props.groupMultiline);
    		if ("position" in $$props) $$invalidate(14, position = $$new_props.position);
    		if ("addons" in $$props) $$invalidate(15, addons = $$new_props.addons);
    		if ("expanded" in $$props) $$invalidate(5, expanded = $$new_props.expanded);
    		if ("el" in $$props) $$invalidate(6, el = $$new_props.el);
    		if ("labelEl" in $$props) $$invalidate(7, labelEl = $$new_props.labelEl);
    		if ("messageEl" in $$props) $$invalidate(8, messageEl = $$new_props.messageEl);
    		if ("fieldType" in $$props) $$invalidate(9, fieldType = $$new_props.fieldType);
    		if ("hasIcons" in $$props) hasIcons = $$new_props.hasIcons;
    		if ("iconType" in $$props) iconType = $$new_props.iconType;
    		if ("mounted" in $$props) $$invalidate(16, mounted = $$new_props.mounted);
    		if ("newPosition" in $$props) $$invalidate(10, newPosition = $$new_props.newPosition);
    		if ("props" in $$props) $$invalidate(11, props = $$new_props.props);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*type*/ 1) {
    			// Determine the icon type
    			 {
    				if (["is-danger", "is-success"].includes(type)) {
    					iconType = type;
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*grouped, mounted, el, labelEl, messageEl, addons*/ 106944) {
    			 {
    				if (grouped) $$invalidate(9, fieldType = "is-grouped"); else if (mounted) {
    					const childNodes = Array.prototype.filter.call(el.children, c => ![labelEl, messageEl].includes(c));

    					if (childNodes.length > 1 && addons) {
    						$$invalidate(9, fieldType = "has-addons");
    					}
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*position, grouped*/ 24576) {
    			// Update has-addons-* or is-grouped-* classes based on position prop
    			 {
    				if (position) {
    					const pos = position.split("-");

    					if (pos.length >= 1) {
    						const prefix = grouped ? "is-grouped-" : "has-addons-";
    						$$invalidate(10, newPosition = prefix + pos[1]);
    					}
    				}
    			}
    		}

    		 $$invalidate(11, props = {
    			...omit($$props, "addons", "class", "expanded", "grouped", "label", "labelFor", "position", "type")
    		});
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		type,
    		label,
    		labelFor,
    		message,
    		groupMultiline,
    		expanded,
    		el,
    		labelEl,
    		messageEl,
    		fieldType,
    		newPosition,
    		props,
    		$$props,
    		grouped,
    		position,
    		addons,
    		mounted,
    		$$scope,
    		slots,
    		label_1_binding,
    		p_binding,
    		div_binding
    	];
    }

    class Field extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			type: 0,
    			label: 1,
    			labelFor: 2,
    			message: 3,
    			grouped: 13,
    			groupMultiline: 4,
    			position: 14,
    			addons: 15,
    			expanded: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Field",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get type() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get labelFor() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set labelFor(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get message() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get grouped() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set grouped(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get groupMultiline() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set groupMultiline(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get addons() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set addons(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Field>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Field>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Input.svelte generated by Svelte v3.31.1 */
    const file$5 = "node_modules/svelma/src/components/Input.svelte";

    // (156:2) {:else}
    function create_else_block(ctx) {
    	let textarea;
    	let textarea_class_value;
    	let events_action;
    	let mounted;
    	let dispose;

    	let textarea_levels = [
    		/*props*/ ctx[17],
    		{ value: /*value*/ ctx[0] },
    		{
    			class: textarea_class_value = "textarea " + /*statusType*/ ctx[11] + "\n      " + /*size*/ ctx[2]
    		},
    		{ disabled: /*disabled*/ ctx[10] }
    	];

    	let textarea_data = {};

    	for (let i = 0; i < textarea_levels.length; i += 1) {
    		textarea_data = assign(textarea_data, textarea_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			textarea = element("textarea");
    			set_attributes(textarea, textarea_data);
    			toggle_class(textarea, "svelte-1v5s752", true);
    			add_location(textarea, file$5, 156, 4, 3907);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, textarea, anchor);
    			/*textarea_binding*/ ctx[31](textarea);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[25].call(null, textarea)),
    					listen_dev(textarea, "input", /*onInput*/ ctx[22], false, false, false),
    					listen_dev(textarea, "focus", /*onFocus*/ ctx[23], false, false, false),
    					listen_dev(textarea, "blur", /*onBlur*/ ctx[24], false, false, false),
    					listen_dev(textarea, "change", /*change_handler_1*/ ctx[29], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(textarea, textarea_data = get_spread_update(textarea_levels, [
    				dirty[0] & /*props*/ 131072 && /*props*/ ctx[17],
    				dirty[0] & /*value*/ 1 && { value: /*value*/ ctx[0] },
    				dirty[0] & /*statusType, size*/ 2052 && textarea_class_value !== (textarea_class_value = "textarea " + /*statusType*/ ctx[11] + "\n      " + /*size*/ ctx[2]) && { class: textarea_class_value },
    				dirty[0] & /*disabled*/ 1024 && { disabled: /*disabled*/ ctx[10] }
    			]));

    			toggle_class(textarea, "svelte-1v5s752", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(textarea);
    			/*textarea_binding*/ ctx[31](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(156:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (143:2) {#if type !== 'textarea'}
    function create_if_block_3$2(ctx) {
    	let input_1;
    	let input_1_class_value;
    	let events_action;
    	let mounted;
    	let dispose;

    	let input_1_levels = [
    		/*props*/ ctx[17],
    		{ type: /*newType*/ ctx[14] },
    		{ value: /*value*/ ctx[0] },
    		{
    			class: input_1_class_value = "input " + /*statusType*/ ctx[11] + " " + /*size*/ ctx[2] + " " + (/*$$props*/ ctx[26].class || "")
    		},
    		{ disabled: /*disabled*/ ctx[10] }
    	];

    	let input_1_data = {};

    	for (let i = 0; i < input_1_levels.length; i += 1) {
    		input_1_data = assign(input_1_data, input_1_levels[i]);
    	}

    	const block = {
    		c: function create() {
    			input_1 = element("input");
    			set_attributes(input_1, input_1_data);
    			toggle_class(input_1, "svelte-1v5s752", true);
    			add_location(input_1, file$5, 143, 4, 3622);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input_1, anchor);
    			input_1.value = input_1_data.value;
    			/*input_1_binding*/ ctx[30](input_1);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(events_action = /*events*/ ctx[25].call(null, input_1)),
    					listen_dev(input_1, "input", /*onInput*/ ctx[22], false, false, false),
    					listen_dev(input_1, "focus", /*onFocus*/ ctx[23], false, false, false),
    					listen_dev(input_1, "blur", /*onBlur*/ ctx[24], false, false, false),
    					listen_dev(input_1, "change", /*change_handler*/ ctx[28], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			set_attributes(input_1, input_1_data = get_spread_update(input_1_levels, [
    				dirty[0] & /*props*/ 131072 && /*props*/ ctx[17],
    				dirty[0] & /*newType*/ 16384 && { type: /*newType*/ ctx[14] },
    				dirty[0] & /*value*/ 1 && input_1.value !== /*value*/ ctx[0] && { value: /*value*/ ctx[0] },
    				dirty[0] & /*statusType, size, $$props*/ 67110916 && input_1_class_value !== (input_1_class_value = "input " + /*statusType*/ ctx[11] + " " + /*size*/ ctx[2] + " " + (/*$$props*/ ctx[26].class || "")) && { class: input_1_class_value },
    				dirty[0] & /*disabled*/ 1024 && { disabled: /*disabled*/ ctx[10] }
    			]));

    			if ("value" in input_1_data) {
    				input_1.value = input_1_data.value;
    			}

    			toggle_class(input_1, "svelte-1v5s752", true);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input_1);
    			/*input_1_binding*/ ctx[30](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$2.name,
    		type: "if",
    		source: "(143:2) {#if type !== 'textarea'}",
    		ctx
    	});

    	return block;
    }

    // (171:2) {#if icon}
    function create_if_block_2$2(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[9],
    				isLeft: true,
    				icon: /*icon*/ ctx[8]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*iconPack*/ 512) icon_1_changes.pack = /*iconPack*/ ctx[9];
    			if (dirty[0] & /*icon*/ 256) icon_1_changes.icon = /*icon*/ ctx[8];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(171:2) {#if icon}",
    		ctx
    	});

    	return block;
    }

    // (178:2) {#if !loading && (passwordReveal || statusType)}
    function create_if_block_1$3(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				pack: "fas",
    				isRight: true,
    				isClickable: /*passwordReveal*/ ctx[4],
    				icon: /*passwordReveal*/ ctx[4]
    				? /*passwordVisibleIcon*/ ctx[20]
    				: /*statusTypeIcon*/ ctx[15],
    				type: !/*passwordReveal*/ ctx[4]
    				? /*statusType*/ ctx[11]
    				: "is-primary"
    			},
    			$$inline: true
    		});

    	icon_1.$on("click", /*togglePasswordVisibility*/ ctx[21]);

    	const block = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty[0] & /*passwordReveal*/ 16) icon_1_changes.isClickable = /*passwordReveal*/ ctx[4];

    			if (dirty[0] & /*passwordReveal, passwordVisibleIcon, statusTypeIcon*/ 1081360) icon_1_changes.icon = /*passwordReveal*/ ctx[4]
    			? /*passwordVisibleIcon*/ ctx[20]
    			: /*statusTypeIcon*/ ctx[15];

    			if (dirty[0] & /*passwordReveal, statusType*/ 2064) icon_1_changes.type = !/*passwordReveal*/ ctx[4]
    			? /*statusType*/ ctx[11]
    			: "is-primary";

    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(178:2) {#if !loading && (passwordReveal || statusType)}",
    		ctx
    	});

    	return block;
    }

    // (190:2) {#if maxlength && hasCounter && type !== 'number'}
    function create_if_block$4(ctx) {
    	let small;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			small = element("small");
    			t0 = text(/*valueLength*/ ctx[16]);
    			t1 = text(" / ");
    			t2 = text(/*maxlength*/ ctx[5]);
    			attr_dev(small, "class", "help counter svelte-1v5s752");
    			toggle_class(small, "is-invisible", !/*isFocused*/ ctx[13]);
    			add_location(small, file$5, 190, 4, 4664);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, small, anchor);
    			append_dev(small, t0);
    			append_dev(small, t1);
    			append_dev(small, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*valueLength*/ 65536) set_data_dev(t0, /*valueLength*/ ctx[16]);
    			if (dirty[0] & /*maxlength*/ 32) set_data_dev(t2, /*maxlength*/ ctx[5]);

    			if (dirty[0] & /*isFocused*/ 8192) {
    				toggle_class(small, "is-invisible", !/*isFocused*/ ctx[13]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(small);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(190:2) {#if maxlength && hasCounter && type !== 'number'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2;
    	let current;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[1] !== "textarea") return create_if_block_3$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*icon*/ ctx[8] && create_if_block_2$2(ctx);
    	let if_block2 = !/*loading*/ ctx[7] && (/*passwordReveal*/ ctx[4] || /*statusType*/ ctx[11]) && create_if_block_1$3(ctx);
    	let if_block3 = /*maxlength*/ ctx[5] && /*hasCounter*/ ctx[6] && /*type*/ ctx[1] !== "number" && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			if (if_block2) if_block2.c();
    			t2 = space();
    			if (if_block3) if_block3.c();
    			attr_dev(div, "class", "control svelte-1v5s752");
    			toggle_class(div, "has-icons-left", /*hasIconLeft*/ ctx[18]);
    			toggle_class(div, "has-icons-right", /*hasIconRight*/ ctx[19]);
    			toggle_class(div, "is-loading", /*loading*/ ctx[7]);
    			toggle_class(div, "is-expanded", /*expanded*/ ctx[3]);
    			add_location(div, file$5, 140, 0, 3439);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block0.m(div, null);
    			append_dev(div, t0);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t1);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t2);
    			if (if_block3) if_block3.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			}

    			if (/*icon*/ ctx[8]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty[0] & /*icon*/ 256) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_2$2(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (!/*loading*/ ctx[7] && (/*passwordReveal*/ ctx[4] || /*statusType*/ ctx[11])) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);

    					if (dirty[0] & /*loading, passwordReveal, statusType*/ 2192) {
    						transition_in(if_block2, 1);
    					}
    				} else {
    					if_block2 = create_if_block_1$3(ctx);
    					if_block2.c();
    					transition_in(if_block2, 1);
    					if_block2.m(div, t2);
    				}
    			} else if (if_block2) {
    				group_outros();

    				transition_out(if_block2, 1, 1, () => {
    					if_block2 = null;
    				});

    				check_outros();
    			}

    			if (/*maxlength*/ ctx[5] && /*hasCounter*/ ctx[6] && /*type*/ ctx[1] !== "number") {
    				if (if_block3) {
    					if_block3.p(ctx, dirty);
    				} else {
    					if_block3 = create_if_block$4(ctx);
    					if_block3.c();
    					if_block3.m(div, null);
    				}
    			} else if (if_block3) {
    				if_block3.d(1);
    				if_block3 = null;
    			}

    			if (dirty[0] & /*hasIconLeft*/ 262144) {
    				toggle_class(div, "has-icons-left", /*hasIconLeft*/ ctx[18]);
    			}

    			if (dirty[0] & /*hasIconRight*/ 524288) {
    				toggle_class(div, "has-icons-right", /*hasIconRight*/ ctx[19]);
    			}

    			if (dirty[0] & /*loading*/ 128) {
    				toggle_class(div, "is-loading", /*loading*/ ctx[7]);
    			}

    			if (dirty[0] & /*expanded*/ 8) {
    				toggle_class(div, "is-expanded", /*expanded*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    			if (if_block3) if_block3.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let props;
    	let hasIconLeft;
    	let hasIconRight;
    	let passwordVisibleIcon;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Input", slots, []);
    	let { value = "" } = $$props;
    	let { type = "text" } = $$props;
    	let { size = "" } = $$props;
    	let { expanded = false } = $$props;
    	let { passwordReveal = false } = $$props;
    	let { maxlength = null } = $$props;
    	let { hasCounter = true } = $$props;
    	let { loading = false } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let { disabled = false } = $$props;
    	let input;
    	let isFocused;
    	let isPasswordVisible = false;
    	let newType = "text";
    	let statusType = "";
    	let statusTypeIcon = "";
    	let valueLength = null;
    	const dispatch = createEventDispatcher();
    	const getType = getContext("type");
    	if (getType) statusType = getType() || "";

    	onMount(() => {
    		$$invalidate(14, newType = type);
    	});

    	async function togglePasswordVisibility() {
    		$$invalidate(27, isPasswordVisible = !isPasswordVisible);
    		$$invalidate(14, newType = isPasswordVisible ? "text" : "password");
    		await tick();
    		input.focus();
    	}

    	const onInput = e => {
    		$$invalidate(0, value = e.target.value);
    		$$invalidate(26, $$props.value = value, $$props);
    		dispatch("input", e);
    	};

    	const onFocus = () => $$invalidate(13, isFocused = true);
    	const onBlur = () => $$invalidate(13, isFocused = false);
    	const events = getEventsAction(current_component);

    	function change_handler(event) {
    		bubble($$self, event);
    	}

    	function change_handler_1(event) {
    		bubble($$self, event);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(12, input);
    		});
    	}

    	function textarea_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(12, input);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(26, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("value" in $$new_props) $$invalidate(0, value = $$new_props.value);
    		if ("type" in $$new_props) $$invalidate(1, type = $$new_props.type);
    		if ("size" in $$new_props) $$invalidate(2, size = $$new_props.size);
    		if ("expanded" in $$new_props) $$invalidate(3, expanded = $$new_props.expanded);
    		if ("passwordReveal" in $$new_props) $$invalidate(4, passwordReveal = $$new_props.passwordReveal);
    		if ("maxlength" in $$new_props) $$invalidate(5, maxlength = $$new_props.maxlength);
    		if ("hasCounter" in $$new_props) $$invalidate(6, hasCounter = $$new_props.hasCounter);
    		if ("loading" in $$new_props) $$invalidate(7, loading = $$new_props.loading);
    		if ("icon" in $$new_props) $$invalidate(8, icon = $$new_props.icon);
    		if ("iconPack" in $$new_props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("disabled" in $$new_props) $$invalidate(10, disabled = $$new_props.disabled);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		getContext,
    		tick,
    		omit,
    		getEventsAction,
    		current_component,
    		Icon,
    		value,
    		type,
    		size,
    		expanded,
    		passwordReveal,
    		maxlength,
    		hasCounter,
    		loading,
    		icon,
    		iconPack,
    		disabled,
    		input,
    		isFocused,
    		isPasswordVisible,
    		newType,
    		statusType,
    		statusTypeIcon,
    		valueLength,
    		dispatch,
    		getType,
    		togglePasswordVisibility,
    		onInput,
    		onFocus,
    		onBlur,
    		events,
    		props,
    		hasIconLeft,
    		hasIconRight,
    		passwordVisibleIcon
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(26, $$props = assign(assign({}, $$props), $$new_props));
    		if ("value" in $$props) $$invalidate(0, value = $$new_props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$new_props.type);
    		if ("size" in $$props) $$invalidate(2, size = $$new_props.size);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$new_props.expanded);
    		if ("passwordReveal" in $$props) $$invalidate(4, passwordReveal = $$new_props.passwordReveal);
    		if ("maxlength" in $$props) $$invalidate(5, maxlength = $$new_props.maxlength);
    		if ("hasCounter" in $$props) $$invalidate(6, hasCounter = $$new_props.hasCounter);
    		if ("loading" in $$props) $$invalidate(7, loading = $$new_props.loading);
    		if ("icon" in $$props) $$invalidate(8, icon = $$new_props.icon);
    		if ("iconPack" in $$props) $$invalidate(9, iconPack = $$new_props.iconPack);
    		if ("disabled" in $$props) $$invalidate(10, disabled = $$new_props.disabled);
    		if ("input" in $$props) $$invalidate(12, input = $$new_props.input);
    		if ("isFocused" in $$props) $$invalidate(13, isFocused = $$new_props.isFocused);
    		if ("isPasswordVisible" in $$props) $$invalidate(27, isPasswordVisible = $$new_props.isPasswordVisible);
    		if ("newType" in $$props) $$invalidate(14, newType = $$new_props.newType);
    		if ("statusType" in $$props) $$invalidate(11, statusType = $$new_props.statusType);
    		if ("statusTypeIcon" in $$props) $$invalidate(15, statusTypeIcon = $$new_props.statusTypeIcon);
    		if ("valueLength" in $$props) $$invalidate(16, valueLength = $$new_props.valueLength);
    		if ("props" in $$props) $$invalidate(17, props = $$new_props.props);
    		if ("hasIconLeft" in $$props) $$invalidate(18, hasIconLeft = $$new_props.hasIconLeft);
    		if ("hasIconRight" in $$props) $$invalidate(19, hasIconRight = $$new_props.hasIconRight);
    		if ("passwordVisibleIcon" in $$props) $$invalidate(20, passwordVisibleIcon = $$new_props.passwordVisibleIcon);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(17, props = {
    			...omit($$props, "class", "value", "type", "size", "passwordReveal", "hasCounter", "loading", "disabled")
    		});

    		if ($$self.$$.dirty[0] & /*icon*/ 256) {
    			 $$invalidate(18, hasIconLeft = !!icon);
    		}

    		if ($$self.$$.dirty[0] & /*passwordReveal, loading, statusType*/ 2192) {
    			 $$invalidate(19, hasIconRight = passwordReveal || loading || statusType);
    		}

    		if ($$self.$$.dirty[0] & /*isPasswordVisible*/ 134217728) {
    			 $$invalidate(20, passwordVisibleIcon = isPasswordVisible ? "eye-slash" : "eye");
    		}

    		if ($$self.$$.dirty[0] & /*statusType*/ 2048) {
    			 {
    				switch (statusType) {
    					case "is-success":
    						$$invalidate(15, statusTypeIcon = "check");
    						break;
    					case "is-danger":
    						$$invalidate(15, statusTypeIcon = "exclamation-circle");
    						break;
    					case "is-info":
    						$$invalidate(15, statusTypeIcon = "info-circle");
    						break;
    					case "is-warning":
    						$$invalidate(15, statusTypeIcon = "exclamation-triangle");
    						break;
    				}
    			}
    		}

    		if ($$self.$$.dirty[0] & /*value*/ 1) {
    			 {
    				if (typeof value === "string") {
    					$$invalidate(16, valueLength = value.length);
    				} else if (typeof value === "number") {
    					$$invalidate(16, valueLength = value.toString().length);
    				} else {
    					$$invalidate(16, valueLength = 0);
    				}
    			}
    		}
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		value,
    		type,
    		size,
    		expanded,
    		passwordReveal,
    		maxlength,
    		hasCounter,
    		loading,
    		icon,
    		iconPack,
    		disabled,
    		statusType,
    		input,
    		isFocused,
    		newType,
    		statusTypeIcon,
    		valueLength,
    		props,
    		hasIconLeft,
    		hasIconRight,
    		passwordVisibleIcon,
    		togglePasswordVisibility,
    		onInput,
    		onFocus,
    		onBlur,
    		events,
    		$$props,
    		isPasswordVisible,
    		change_handler,
    		change_handler_1,
    		input_1_binding,
    		textarea_binding
    	];
    }

    class Input extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				value: 0,
    				type: 1,
    				size: 2,
    				expanded: 3,
    				passwordReveal: 4,
    				maxlength: 5,
    				hasCounter: 6,
    				loading: 7,
    				icon: 8,
    				iconPack: 9,
    				disabled: 10
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Input",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get value() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get passwordReveal() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set passwordReveal(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxlength() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxlength(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hasCounter() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hasCounter(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Input>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Input>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Message.svelte generated by Svelte v3.31.1 */
    const file$6 = "node_modules/svelma/src/components/Message.svelte";

    // (64:0) {#if active}
    function create_if_block$5(ctx) {
    	let article;
    	let t0;
    	let section;
    	let div1;
    	let t1;
    	let div0;
    	let article_class_value;
    	let article_transition;
    	let current;
    	let if_block0 = (/*title*/ ctx[2] || /*showClose*/ ctx[3]) && create_if_block_2$3(ctx);
    	let if_block1 = /*icon*/ ctx[5] && create_if_block_1$4(ctx);
    	const default_slot_template = /*#slots*/ ctx[13].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[12], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			section = element("section");
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "media-content");
    			add_location(div0, file$6, 82, 8, 1705);
    			attr_dev(div1, "class", "media svelte-2cbde2");
    			add_location(div1, file$6, 76, 6, 1545);
    			attr_dev(section, "class", "message-body");
    			add_location(section, file$6, 75, 4, 1508);
    			attr_dev(article, "class", article_class_value = "message " + /*type*/ ctx[1] + " " + /*size*/ ctx[4] + " svelte-2cbde2");
    			add_location(article, file$6, 64, 2, 1177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			if (if_block0) if_block0.m(article, null);
    			append_dev(article, t0);
    			append_dev(article, section);
    			append_dev(section, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2] || /*showClose*/ ctx[3]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$3(ctx);
    					if_block0.c();
    					if_block0.m(article, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*icon*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*icon*/ 32) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4096) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[12], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*type, size*/ 18 && article_class_value !== (article_class_value = "message " + /*type*/ ctx[1] + " " + /*size*/ ctx[4] + " svelte-2cbde2")) {
    				attr_dev(article, "class", article_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!article_transition) article_transition = create_bidirectional_transition(article, fade, {}, true);
    					article_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(default_slot, local);

    			if (local) {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, fade, {}, false);
    				article_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && article_transition) article_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(64:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    // (66:4) {#if title || showClose}
    function create_if_block_2$3(ctx) {
    	let div;
    	let t;
    	let if_block0 = /*title*/ ctx[2] && create_if_block_4$2(ctx);
    	let if_block1 = /*showClose*/ ctx[3] && create_if_block_3$3(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div, "class", "message-header svelte-2cbde2");
    			add_location(div, file$6, 66, 6, 1274);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    		},
    		p: function update(ctx, dirty) {
    			if (/*title*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_4$2(ctx);
    					if_block0.c();
    					if_block0.m(div, t);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*showClose*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_3$3(ctx);
    					if_block1.c();
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(66:4) {#if title || showClose}",
    		ctx
    	});

    	return block;
    }

    // (68:8) {#if title}
    function create_if_block_4$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*title*/ ctx[2]);
    			add_location(p, file$6, 68, 10, 1333);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*title*/ 4) set_data_dev(t, /*title*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$2.name,
    		type: "if",
    		source: "(68:8) {#if title}",
    		ctx
    	});

    	return block;
    }

    // (71:8) {#if showClose}
    function create_if_block_3$3(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "delete");
    			attr_dev(button, "aria-label", "ariaCloseLabel");
    			add_location(button, file$6, 71, 10, 1396);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*close*/ ctx[6])) /*close*/ ctx[6].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$3.name,
    		type: "if",
    		source: "(71:8) {#if showClose}",
    		ctx
    	});

    	return block;
    }

    // (78:8) {#if icon}
    function create_if_block_1$4(ctx) {
    	let div;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				icon: /*icon*/ ctx[5],
    				size: /*newIconSize*/ ctx[7]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon_1.$$.fragment);
    			attr_dev(div, "class", "media-left");
    			add_location(div, file$6, 78, 10, 1594);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*icon*/ 32) icon_1_changes.icon = /*icon*/ ctx[5];
    			if (dirty & /*newIconSize*/ 128) icon_1_changes.size = /*newIconSize*/ ctx[7];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(78:8) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[0] && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let newIconSize;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Message", slots, ['default']);
    	let { type = "" } = $$props;
    	let { active = true } = $$props;
    	let { title = "" } = $$props;
    	let { showClose = true } = $$props;
    	let { autoClose = false } = $$props;
    	let { duration = 5000 } = $$props;
    	let { size = "" } = $$props;
    	let { iconSize = "" } = $$props;
    	let { ariaCloseLabel = "delete" } = $$props;
    	let icon;
    	const dispatch = createEventDispatcher();

    	if (autoClose) {
    		setTimeout(
    			() => {
    				$$invalidate(6, close = true);
    			},
    			duration
    		);
    	}

    	function close() {
    		$$invalidate(0, active = false);
    		dispatch("close", active);
    	}

    	const writable_props = [
    		"type",
    		"active",
    		"title",
    		"showClose",
    		"autoClose",
    		"duration",
    		"size",
    		"iconSize",
    		"ariaCloseLabel"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Message> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("showClose" in $$props) $$invalidate(3, showClose = $$props.showClose);
    		if ("autoClose" in $$props) $$invalidate(8, autoClose = $$props.autoClose);
    		if ("duration" in $$props) $$invalidate(9, duration = $$props.duration);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("iconSize" in $$props) $$invalidate(10, iconSize = $$props.iconSize);
    		if ("ariaCloseLabel" in $$props) $$invalidate(11, ariaCloseLabel = $$props.ariaCloseLabel);
    		if ("$$scope" in $$props) $$invalidate(12, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fade,
    		Icon,
    		type,
    		active,
    		title,
    		showClose,
    		autoClose,
    		duration,
    		size,
    		iconSize,
    		ariaCloseLabel,
    		icon,
    		dispatch,
    		close,
    		newIconSize
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("title" in $$props) $$invalidate(2, title = $$props.title);
    		if ("showClose" in $$props) $$invalidate(3, showClose = $$props.showClose);
    		if ("autoClose" in $$props) $$invalidate(8, autoClose = $$props.autoClose);
    		if ("duration" in $$props) $$invalidate(9, duration = $$props.duration);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("iconSize" in $$props) $$invalidate(10, iconSize = $$props.iconSize);
    		if ("ariaCloseLabel" in $$props) $$invalidate(11, ariaCloseLabel = $$props.ariaCloseLabel);
    		if ("icon" in $$props) $$invalidate(5, icon = $$props.icon);
    		if ("newIconSize" in $$props) $$invalidate(7, newIconSize = $$props.newIconSize);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*iconSize, size*/ 1040) {
    			 $$invalidate(7, newIconSize = iconSize || size || "is-large");
    		}

    		if ($$self.$$.dirty & /*type*/ 2) {
    			 {
    				switch (type) {
    					case "is-info":
    						$$invalidate(5, icon = "info-circle");
    						break;
    					case "is-success":
    						$$invalidate(5, icon = "check-circle");
    						break;
    					case "is-warning":
    						$$invalidate(5, icon = "exclamation-triangle");
    						break;
    					case "is-danger":
    						$$invalidate(5, icon = "exclamation-circle");
    						break;
    					default:
    						$$invalidate(5, icon = null);
    				}
    			}
    		}
    	};

    	return [
    		active,
    		type,
    		title,
    		showClose,
    		size,
    		icon,
    		close,
    		newIconSize,
    		autoClose,
    		duration,
    		iconSize,
    		ariaCloseLabel,
    		$$scope,
    		slots
    	];
    }

    class Message extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {
    			type: 1,
    			active: 0,
    			title: 2,
    			showClose: 3,
    			autoClose: 8,
    			duration: 9,
    			size: 4,
    			iconSize: 10,
    			ariaCloseLabel: 11
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Message",
    			options,
    			id: create_fragment$6.name
    		});
    	}

    	get type() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showClose() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showClose(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoClose() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoClose(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconSize() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconSize(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaCloseLabel() {
    		throw new Error("<Message>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaCloseLabel(value) {
    		throw new Error("<Message>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Modal/Modal.svelte generated by Svelte v3.31.1 */
    const file$7 = "node_modules/svelma/src/components/Modal/Modal.svelte";

    // (40:0) {#if active}
    function create_if_block$6(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let t1;
    	let div1;
    	let div2_transition;
    	let t2;
    	let div3_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[12].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[11], null);
    	let if_block = /*showClose*/ ctx[3] && create_if_block_1$5(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "modal-background");
    			add_location(div0, file$7, 41, 4, 816);
    			attr_dev(div1, "class", "sub-component");
    			add_location(div1, file$7, 44, 6, 1000);
    			attr_dev(div2, "class", "modal-content");
    			add_location(div2, file$7, 42, 4, 874);
    			attr_dev(div3, "class", div3_class_value = "modal " + /*size*/ ctx[2] + " is-active");
    			add_location(div3, file$7, 40, 2, 757);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div3, t2);
    			if (if_block) if_block.m(div3, null);
    			/*div3_binding*/ ctx[13](div3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*close*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2048) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[11], dirty, null, null);
    				}
    			}

    			if (/*showClose*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$5(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*size*/ 4 && div3_class_value !== (div3_class_value = "modal " + /*size*/ ctx[2] + " is-active")) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*_animation*/ ctx[5], /*animProps*/ ctx[1], true);
    					div2_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);

    			if (local) {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*_animation*/ ctx[5], /*animProps*/ ctx[1], false);
    				div2_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div2_transition) div2_transition.end();
    			if (if_block) if_block.d();
    			/*div3_binding*/ ctx[13](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(40:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if showClose}
    function create_if_block_1$5(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "modal-close is-large");
    			attr_dev(button, "aria-label", "close");
    			add_location(button, file$7, 47, 6, 1071);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*close*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(47:4) {#if showClose}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*active*/ ctx[0] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keydown*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let _animation;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['default']);
    	let { active = true } = $$props;
    	let { animation = "scale" } = $$props;
    	let { animProps = { start: 1.2 } } = $$props;
    	let { size = "" } = $$props;
    	let { showClose = true } = $$props;
    	let { subComponent = null } = $$props;
    	let { onBody = true } = $$props;
    	let modal;

    	onMount(() => {
    		
    	});

    	function close() {
    		$$invalidate(0, active = false);
    	}

    	function keydown(e) {
    		if (active && isEscKey(e)) {
    			close();
    		}
    	}

    	const writable_props = [
    		"active",
    		"animation",
    		"animProps",
    		"size",
    		"showClose",
    		"subComponent",
    		"onBody"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			modal = $$value;
    			$$invalidate(4, modal);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("animation" in $$props) $$invalidate(8, animation = $$props.animation);
    		if ("animProps" in $$props) $$invalidate(1, animProps = $$props.animProps);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("showClose" in $$props) $$invalidate(3, showClose = $$props.showClose);
    		if ("subComponent" in $$props) $$invalidate(9, subComponent = $$props.subComponent);
    		if ("onBody" in $$props) $$invalidate(10, onBody = $$props.onBody);
    		if ("$$scope" in $$props) $$invalidate(11, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		chooseAnimation,
    		isEscKey,
    		active,
    		animation,
    		animProps,
    		size,
    		showClose,
    		subComponent,
    		onBody,
    		modal,
    		close,
    		keydown,
    		_animation
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("animation" in $$props) $$invalidate(8, animation = $$props.animation);
    		if ("animProps" in $$props) $$invalidate(1, animProps = $$props.animProps);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("showClose" in $$props) $$invalidate(3, showClose = $$props.showClose);
    		if ("subComponent" in $$props) $$invalidate(9, subComponent = $$props.subComponent);
    		if ("onBody" in $$props) $$invalidate(10, onBody = $$props.onBody);
    		if ("modal" in $$props) $$invalidate(4, modal = $$props.modal);
    		if ("_animation" in $$props) $$invalidate(5, _animation = $$props._animation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*animation*/ 256) {
    			 $$invalidate(5, _animation = chooseAnimation(animation));
    		}

    		if ($$self.$$.dirty & /*modal, active, onBody*/ 1041) {
    			 {
    				if (modal && active && onBody) {
    					modal.parentNode.removeChild(modal);
    					document.body.appendChild(modal);
    				}
    			}
    		}
    	};

    	return [
    		active,
    		animProps,
    		size,
    		showClose,
    		modal,
    		_animation,
    		close,
    		keydown,
    		animation,
    		subComponent,
    		onBody,
    		$$scope,
    		slots,
    		div3_binding
    	];
    }

    class Modal extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			active: 0,
    			animation: 8,
    			animProps: 1,
    			size: 2,
    			showClose: 3,
    			subComponent: 9,
    			onBody: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get active() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animation() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animProps() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animProps(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showClose() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showClose(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subComponent() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subComponent(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBody() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBody(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Modal.open = open;

    function open(props) {
      const modal = new Modal({
        target: document.body,
        props,
        intro: true
      });

      modal.close = () => modal.$destroy();

      return modal;
    }

    /* node_modules/svelma/src/components/Notices.svelte generated by Svelte v3.31.1 */

    const file$8 = "node_modules/svelma/src/components/Notices.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", div_class_value = "notices " + /*positionClass*/ ctx[1] + " svelte-1mcog5q");
    			add_location(div, file$8, 42, 0, 863);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[4](div);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*positionClass*/ 2 && div_class_value !== (div_class_value = "notices " + /*positionClass*/ ctx[1] + " svelte-1mcog5q")) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[4](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const notices = {};

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Notices", slots, []);
    	let { position = "top" } = $$props;
    	let container;
    	let positionClass;

    	function insert(el) {
    		container.insertAdjacentElement("afterbegin", el);
    	}

    	const writable_props = ["position"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notices> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			container = $$value;
    			$$invalidate(0, container);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("position" in $$props) $$invalidate(2, position = $$props.position);
    	};

    	$$self.$capture_state = () => ({
    		notices,
    		position,
    		container,
    		positionClass,
    		insert
    	});

    	$$self.$inject_state = $$props => {
    		if ("position" in $$props) $$invalidate(2, position = $$props.position);
    		if ("container" in $$props) $$invalidate(0, container = $$props.container);
    		if ("positionClass" in $$props) $$invalidate(1, positionClass = $$props.positionClass);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*position*/ 4) {
    			 $$invalidate(1, positionClass = position === "top" ? "is-top" : "is-bottom");
    		}
    	};

    	return [container, positionClass, position, insert, div_binding];
    }

    class Notices extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { position: 2, insert: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notices",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get position() {
    		throw new Error("<Notices>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Notices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get insert() {
    		return this.$$.ctx[3];
    	}

    	set insert(value) {
    		throw new Error("<Notices>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Notice.svelte generated by Svelte v3.31.1 */

    const { Object: Object_1 } = globals;
    const file$9 = "node_modules/svelma/src/components/Notice.svelte";

    // (99:0) {#if active}
    function create_if_block$7(ctx) {
    	let div;
    	let div_class_value;
    	let div_aria_hidden_value;
    	let div_intro;
    	let div_outro;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "notice " + /*position*/ ctx[1] + " svelte-1ik1n9x");
    			attr_dev(div, "aria-hidden", div_aria_hidden_value = !/*active*/ ctx[0]);
    			add_location(div, file$9, 99, 2, 1933);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[10](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "outroend", /*remove*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 256) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*position*/ 2 && div_class_value !== (div_class_value = "notice " + /*position*/ ctx[1] + " svelte-1ik1n9x")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*active*/ 1 && div_aria_hidden_value !== (div_aria_hidden_value = !/*active*/ ctx[0])) {
    				attr_dev(div, "aria-hidden", div_aria_hidden_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fly, { y: /*transitionY*/ ctx[4] });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			if (div_intro) div_intro.invalidate();

    			div_outro = create_out_transition(div, fade, {
    				duration: /*transitionOut*/ ctx[2] ? 400 : 0
    			});

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[10](null);
    			if (detaching && div_outro) div_outro.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(99:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[0] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const allowedProps = ["active", "position", "duration"];

    function filterProps(props) {
    	const newProps = {};

    	Object.keys(props).forEach(key => {
    		if (allowedProps.includes(key)) newProps[key] = props[key];
    	});

    	return newProps;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let transitionY;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Notice", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { active = true } = $$props;
    	let { position = "is-top" } = $$props;
    	let { duration = 2000 } = $$props;
    	let { transitionOut = true } = $$props;
    	let el;
    	let parent;
    	let timer;

    	function close() {
    		$$invalidate(0, active = false);
    	}

    	function remove() {
    		clearTimeout(timer);

    		// Just making sure
    		$$invalidate(0, active = false);

    		dispatch("destroyed");
    	}

    	async function setupContainers() {
    		await tick;

    		if (!notices.top) {
    			notices.top = new Notices({
    					target: document.body,
    					props: { position: "top" }
    				});
    		}

    		if (!notices.bottom) {
    			notices.bottom = new Notices({
    					target: document.body,
    					props: { position: "bottom" }
    				});
    		}
    	}

    	function chooseParent() {
    		parent = notices.top;
    		if (position && position.indexOf("is-bottom") === 0) parent = notices.bottom;
    		parent.insert(el);
    	}

    	onMount(async () => {
    		await setupContainers();
    		chooseParent();

    		timer = setTimeout(
    			() => {
    				close();
    			},
    			duration
    		);
    	});

    	const writable_props = ["active", "position", "duration", "transitionOut"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notice> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(3, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("duration" in $$props) $$invalidate(6, duration = $$props.duration);
    		if ("transitionOut" in $$props) $$invalidate(2, transitionOut = $$props.transitionOut);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		allowedProps,
    		filterProps,
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		tick,
    		fly,
    		fade,
    		Notices,
    		notices,
    		dispatch,
    		active,
    		position,
    		duration,
    		transitionOut,
    		el,
    		parent,
    		timer,
    		close,
    		remove,
    		setupContainers,
    		chooseParent,
    		transitionY
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("duration" in $$props) $$invalidate(6, duration = $$props.duration);
    		if ("transitionOut" in $$props) $$invalidate(2, transitionOut = $$props.transitionOut);
    		if ("el" in $$props) $$invalidate(3, el = $$props.el);
    		if ("parent" in $$props) parent = $$props.parent;
    		if ("timer" in $$props) timer = $$props.timer;
    		if ("transitionY" in $$props) $$invalidate(4, transitionY = $$props.transitionY);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*position*/ 2) {
    			 $$invalidate(4, transitionY = ~position.indexOf("is-top") ? -200 : 200);
    		}
    	};

    	return [
    		active,
    		position,
    		transitionOut,
    		el,
    		transitionY,
    		remove,
    		duration,
    		close,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Notice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {
    			active: 0,
    			position: 1,
    			duration: 6,
    			transitionOut: 2,
    			close: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notice",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get active() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get transitionOut() {
    		throw new Error("<Notice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionOut(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get close() {
    		return this.$$.ctx[7];
    	}

    	set close(value) {
    		throw new Error("<Notice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Notification/Notification.svelte generated by Svelte v3.31.1 */
    const file$a = "node_modules/svelma/src/components/Notification/Notification.svelte";

    // (92:0) {#if active}
    function create_if_block$8(ctx) {
    	let article;
    	let t0;
    	let div1;
    	let t1;
    	let div0;
    	let article_class_value;
    	let article_transition;
    	let current;
    	let if_block0 = /*showClose*/ ctx[2] && create_if_block_2$4(ctx);
    	let if_block1 = /*icon*/ ctx[3] && create_if_block_1$6(ctx);
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			article = element("article");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			div1 = element("div");
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div0 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "media-content");
    			add_location(div0, file$a, 102, 6, 2846);
    			attr_dev(div1, "class", "media svelte-87qcq1");
    			add_location(div1, file$a, 96, 4, 2677);
    			attr_dev(article, "class", article_class_value = "notification " + /*type*/ ctx[1] + " svelte-87qcq1");
    			add_location(article, file$a, 92, 2, 2506);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			if (if_block0) if_block0.m(article, null);
    			append_dev(article, t0);
    			append_dev(article, div1);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*showClose*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$4(ctx);
    					if_block0.c();
    					if_block0.m(article, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*icon*/ ctx[3]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*icon*/ 8) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$6(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*type*/ 2 && article_class_value !== (article_class_value = "notification " + /*type*/ ctx[1] + " svelte-87qcq1")) {
    				attr_dev(article, "class", article_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block1);
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!article_transition) article_transition = create_bidirectional_transition(article, fade, {}, true);
    					article_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block1);
    			transition_out(default_slot, local);

    			if (local) {
    				if (!article_transition) article_transition = create_bidirectional_transition(article, fade, {}, false);
    				article_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && article_transition) article_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(92:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    // (94:4) {#if showClose}
    function create_if_block_2$4(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "delete");
    			attr_dev(button, "aria-label", /*ariaCloseLabel*/ ctx[5]);
    			add_location(button, file$a, 94, 6, 2592);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*close*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*ariaCloseLabel*/ 32) {
    				attr_dev(button, "aria-label", /*ariaCloseLabel*/ ctx[5]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$4.name,
    		type: "if",
    		source: "(94:4) {#if showClose}",
    		ctx
    	});

    	return block;
    }

    // (98:6) {#if icon}
    function create_if_block_1$6(ctx) {
    	let div;
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				pack: /*iconPack*/ ctx[4],
    				icon: /*newIcon*/ ctx[6],
    				size: "is-large"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(icon_1.$$.fragment);
    			attr_dev(div, "class", "media-left");
    			add_location(div, file$a, 98, 8, 2722);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(icon_1, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*iconPack*/ 16) icon_1_changes.pack = /*iconPack*/ ctx[4];
    			if (dirty & /*newIcon*/ 64) icon_1_changes.icon = /*newIcon*/ ctx[6];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(icon_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(98:6) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*active*/ ctx[0] && create_if_block$8(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$8(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Notification", slots, ['default']);
    	let { type = "" } = $$props;
    	let { active = true } = $$props;
    	let { showClose = true } = $$props;
    	let { autoClose = false } = $$props;
    	let { duration = 2000 } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let { ariaCloseLabel = "" } = $$props;

    	/** Text for notification, when used programmatically
     * @svelte-prop {String} message
     * */
    	/** Where the notification will show on the screen when used programmatically
     * @svelte-prop {String} [position=is-top-right]
     * @values <code>is-top</code>, <code>is-bottom</code>, <code>is-top-left</code>, <code>is-top-right</code>, <code>is-bottom-left</code>, <code>is-bottom-right</code>
     * */
    	const dispatch = createEventDispatcher();

    	let newIcon = "";
    	let timer;

    	function close() {
    		$$invalidate(0, active = false);
    		if (timer) clearTimeout(timer);
    		dispatch("close", active);
    	}

    	const writable_props = [
    		"type",
    		"active",
    		"showClose",
    		"autoClose",
    		"duration",
    		"icon",
    		"iconPack",
    		"ariaCloseLabel"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Notification> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("showClose" in $$props) $$invalidate(2, showClose = $$props.showClose);
    		if ("autoClose" in $$props) $$invalidate(8, autoClose = $$props.autoClose);
    		if ("duration" in $$props) $$invalidate(9, duration = $$props.duration);
    		if ("icon" in $$props) $$invalidate(3, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(4, iconPack = $$props.iconPack);
    		if ("ariaCloseLabel" in $$props) $$invalidate(5, ariaCloseLabel = $$props.ariaCloseLabel);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		fly,
    		fade,
    		Icon,
    		Notice,
    		filterProps,
    		typeToIcon,
    		type,
    		active,
    		showClose,
    		autoClose,
    		duration,
    		icon,
    		iconPack,
    		ariaCloseLabel,
    		dispatch,
    		newIcon,
    		timer,
    		close
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("showClose" in $$props) $$invalidate(2, showClose = $$props.showClose);
    		if ("autoClose" in $$props) $$invalidate(8, autoClose = $$props.autoClose);
    		if ("duration" in $$props) $$invalidate(9, duration = $$props.duration);
    		if ("icon" in $$props) $$invalidate(3, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(4, iconPack = $$props.iconPack);
    		if ("ariaCloseLabel" in $$props) $$invalidate(5, ariaCloseLabel = $$props.ariaCloseLabel);
    		if ("newIcon" in $$props) $$invalidate(6, newIcon = $$props.newIcon);
    		if ("timer" in $$props) timer = $$props.timer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon, type*/ 10) {
    			 {
    				if (icon === true) {
    					$$invalidate(6, newIcon = typeToIcon(type));
    				} else {
    					$$invalidate(6, newIcon = icon);
    				}
    			}
    		}

    		if ($$self.$$.dirty & /*active, autoClose, duration*/ 769) {
    			 {
    				if (active && autoClose) {
    					timer = setTimeout(
    						() => {
    							if (active) close();
    						},
    						duration
    					);
    				}
    			}
    		}
    	};

    	return [
    		active,
    		type,
    		showClose,
    		icon,
    		iconPack,
    		ariaCloseLabel,
    		newIcon,
    		close,
    		autoClose,
    		duration,
    		$$scope,
    		slots
    	];
    }

    class Notification extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			type: 1,
    			active: 0,
    			showClose: 2,
    			autoClose: 8,
    			duration: 9,
    			icon: 3,
    			iconPack: 4,
    			ariaCloseLabel: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Notification",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get type() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showClose() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showClose(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoClose() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoClose(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ariaCloseLabel() {
    		throw new Error("<Notification>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ariaCloseLabel(value) {
    		throw new Error("<Notification>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Notification/NotificationNotice.svelte generated by Svelte v3.31.1 */

    // (34:2) <Notification {...notificationProps}>
    function create_default_slot_1(ctx) {
    	let html_tag;
    	let html_anchor;

    	const block = {
    		c: function create() {
    			html_anchor = empty();
    			html_tag = new HtmlTag(html_anchor);
    		},
    		m: function mount(target, anchor) {
    			html_tag.m(/*message*/ ctx[0], target, anchor);
    			insert_dev(target, html_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) html_tag.p(/*message*/ ctx[0]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(html_anchor);
    			if (detaching) html_tag.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(34:2) <Notification {...notificationProps}>",
    		ctx
    	});

    	return block;
    }

    // (33:0) <Notice {...props} transitionOut={true}>
    function create_default_slot(ctx) {
    	let notification;
    	let current;
    	const notification_spread_levels = [/*notificationProps*/ ctx[2]];

    	let notification_props = {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notification_spread_levels.length; i += 1) {
    		notification_props = assign(notification_props, notification_spread_levels[i]);
    	}

    	notification = new Notification({
    			props: notification_props,
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(notification.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(notification, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const notification_changes = (dirty & /*notificationProps*/ 4)
    			? get_spread_update(notification_spread_levels, [get_spread_object(/*notificationProps*/ ctx[2])])
    			: {};

    			if (dirty & /*$$scope, message*/ 129) {
    				notification_changes.$$scope = { dirty, ctx };
    			}

    			notification.$set(notification_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notification.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notification.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notification, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(33:0) <Notice {...props} transitionOut={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let notice;
    	let current;
    	const notice_spread_levels = [/*props*/ ctx[1], { transitionOut: true }];

    	let notice_props = {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notice_spread_levels.length; i += 1) {
    		notice_props = assign(notice_props, notice_spread_levels[i]);
    	}

    	notice = new Notice({ props: notice_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(notice.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(notice, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const notice_changes = (dirty & /*props*/ 2)
    			? get_spread_update(notice_spread_levels, [get_spread_object(/*props*/ ctx[1]), notice_spread_levels[1]])
    			: {};

    			if (dirty & /*$$scope, notificationProps, message*/ 133) {
    				notice_changes.$$scope = { dirty, ctx };
    			}

    			notice.$set(notice_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notice.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notice.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notice, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let props;
    	let notificationProps;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("NotificationNotice", slots, []);
    	let { message } = $$props;
    	let { duration = 2000 } = $$props;
    	let { position = "is-top-right" } = $$props;

    	function removeNonNoficationProps(props) {
    		const newProps = {};
    		const blacklist = ["duration", "message", "position"];

    		Object.keys(props).forEach(key => {
    			if (!blacklist.includes(key)) newProps[key] = props[key];
    		});

    		return newProps;
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("message" in $$new_props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$new_props) $$invalidate(3, duration = $$new_props.duration);
    		if ("position" in $$new_props) $$invalidate(4, position = $$new_props.position);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		fly,
    		fade,
    		Notice,
    		filterProps,
    		Notification,
    		message,
    		duration,
    		position,
    		removeNonNoficationProps,
    		props,
    		notificationProps
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(6, $$props = assign(assign({}, $$props), $$new_props));
    		if ("message" in $$props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$props) $$invalidate(3, duration = $$new_props.duration);
    		if ("position" in $$props) $$invalidate(4, position = $$new_props.position);
    		if ("props" in $$props) $$invalidate(1, props = $$new_props.props);
    		if ("notificationProps" in $$props) $$invalidate(2, notificationProps = $$new_props.notificationProps);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		 $$invalidate(1, props = {
    			...filterProps($$props),
    			duration,
    			position
    		});

    		 $$invalidate(2, notificationProps = { ...removeNonNoficationProps($$props) });
    	};

    	$$props = exclude_internal_props($$props);
    	return [message, props, notificationProps, duration, position];
    }

    class NotificationNotice extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, { message: 0, duration: 3, position: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NotificationNotice",
    			options,
    			id: create_fragment$b.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<NotificationNotice> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<NotificationNotice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<NotificationNotice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<NotificationNotice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<NotificationNotice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<NotificationNotice>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<NotificationNotice>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Notification.create = create;

    function create(props) {
      if (typeof props === 'string') props = { message: props };

      const notification = new NotificationNotice({
        target: document.body,
        props,
        intro: true,
      });

      notification.$on('destroyed', notification.$destroy);

      return notification
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    function is_date(obj) {
        return Object.prototype.toString.call(obj) === '[object Date]';
    }

    function get_interpolator(a, b) {
        if (a === b || a !== a)
            return () => a;
        const type = typeof a;
        if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
            throw new Error('Cannot interpolate values of different type');
        }
        if (Array.isArray(a)) {
            const arr = b.map((bi, i) => {
                return get_interpolator(a[i], bi);
            });
            return t => arr.map(fn => fn(t));
        }
        if (type === 'object') {
            if (!a || !b)
                throw new Error('Object cannot be null');
            if (is_date(a) && is_date(b)) {
                a = a.getTime();
                b = b.getTime();
                const delta = b - a;
                return t => new Date(a + t * delta);
            }
            const keys = Object.keys(b);
            const interpolators = {};
            keys.forEach(key => {
                interpolators[key] = get_interpolator(a[key], b[key]);
            });
            return t => {
                const result = {};
                keys.forEach(key => {
                    result[key] = interpolators[key](t);
                });
                return result;
            };
        }
        if (type === 'number') {
            const delta = b - a;
            return t => a + t * delta;
        }
        throw new Error(`Cannot interpolate ${type} values`);
    }
    function tweened(value, defaults = {}) {
        const store = writable(value);
        let task;
        let target_value = value;
        function set(new_value, opts) {
            if (value == null) {
                store.set(value = new_value);
                return Promise.resolve();
            }
            target_value = new_value;
            let previous_task = task;
            let started = false;
            let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults), opts);
            if (duration === 0) {
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                store.set(value = target_value);
                return Promise.resolve();
            }
            const start = now() + delay;
            let fn;
            task = loop(now => {
                if (now < start)
                    return true;
                if (!started) {
                    fn = interpolate(value, new_value);
                    if (typeof duration === 'function')
                        duration = duration(value, new_value);
                    started = true;
                }
                if (previous_task) {
                    previous_task.abort();
                    previous_task = null;
                }
                const elapsed = now - start;
                if (elapsed > duration) {
                    store.set(value = new_value);
                    return false;
                }
                // @ts-ignore
                store.set(value = fn(easing(elapsed / duration)));
                return true;
            });
            return task.promise;
        }
        return {
            set,
            update: (fn, opts) => set(fn(target_value, value), opts),
            subscribe: store.subscribe
        };
    }

    /* node_modules/svelma/src/components/Progress.svelte generated by Svelte v3.31.1 */
    const file$b = "node_modules/svelma/src/components/Progress.svelte";

    function create_fragment$c(ctx) {
    	let progress;
    	let t0;
    	let t1;
    	let progress_class_value;

    	const block = {
    		c: function create() {
    			progress = element("progress");
    			t0 = text(/*value*/ ctx[0]);
    			t1 = text("%");
    			attr_dev(progress, "class", progress_class_value = "progress " + /*type*/ ctx[1]);
    			attr_dev(progress, "max", /*max*/ ctx[2]);
    			add_location(progress, file$b, 45, 0, 955);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, progress, anchor);
    			append_dev(progress, t0);
    			append_dev(progress, t1);
    			/*progress_binding*/ ctx[6](progress);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*value*/ 1) set_data_dev(t0, /*value*/ ctx[0]);

    			if (dirty & /*type*/ 2 && progress_class_value !== (progress_class_value = "progress " + /*type*/ ctx[1])) {
    				attr_dev(progress, "class", progress_class_value);
    			}

    			if (dirty & /*max*/ 4) {
    				attr_dev(progress, "max", /*max*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(progress);
    			/*progress_binding*/ ctx[6](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Progress", slots, []);
    	let { value = null } = $$props;
    	let { type = "" } = $$props;
    	let { max = 100 } = $$props;
    	let { duration = 400 } = $$props;
    	let { easing = cubicOut } = $$props;
    	let el;
    	let newValue = tweened(value, { duration, easing });

    	newValue.subscribe(val => {
    		if (el && typeof (value !== undefined)) {
    			el.setAttribute("value", get_store_value(newValue));
    		}
    	});

    	const writable_props = ["value", "type", "max", "duration", "easing"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Progress> was created with unknown prop '${key}'`);
    	});

    	function progress_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(3, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("max" in $$props) $$invalidate(2, max = $$props.max);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("easing" in $$props) $$invalidate(5, easing = $$props.easing);
    	};

    	$$self.$capture_state = () => ({
    		get: get_store_value,
    		tweened,
    		cubicOut,
    		value,
    		type,
    		max,
    		duration,
    		easing,
    		el,
    		newValue
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(0, value = $$props.value);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("max" in $$props) $$invalidate(2, max = $$props.max);
    		if ("duration" in $$props) $$invalidate(4, duration = $$props.duration);
    		if ("easing" in $$props) $$invalidate(5, easing = $$props.easing);
    		if ("el" in $$props) $$invalidate(3, el = $$props.el);
    		if ("newValue" in $$props) $$invalidate(7, newValue = $$props.newValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 1) {
    			 newValue.set(value);
    		}
    	};

    	return [value, type, max, el, duration, easing, progress_binding];
    }

    class Progress extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {
    			value: 0,
    			type: 1,
    			max: 2,
    			duration: 4,
    			easing: 5
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progress",
    			options,
    			id: create_fragment$c.name
    		});
    	}

    	get value() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get max() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set max(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get easing() {
    		throw new Error("<Progress>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set easing(value) {
    		throw new Error("<Progress>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Select.svelte generated by Svelte v3.31.1 */
    const file$c = "node_modules/svelma/src/components/Select.svelte";

    // (134:8) {:else}
    function create_else_block$1(ctx) {
    	let select;
    	let if_block_anchor;
    	let select_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*placeholder*/ ctx[2] && /*selected*/ ctx[0] === "" && create_if_block_3$4(ctx);
    	const default_slot_template = /*#slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	const block = {
    		c: function create() {
    			select = element("select");
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (default_slot) default_slot.c();
    			select.multiple = true;
    			attr_dev(select, "size", /*nativeSize*/ ctx[5]);
    			select.disabled = select_disabled_value = /*disabled*/ ctx[12] ? "disabled" : "";
    			if (/*selected*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler_1*/ ctx[22].call(select));
    			add_location(select, file$c, 134, 12, 3615);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			if (if_block) if_block.m(select, null);
    			append_dev(select, if_block_anchor);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			select_options(select, /*selected*/ ctx[0]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler_1*/ ctx[22]),
    					listen_dev(select, "change", /*onChange*/ ctx[15], false, false, false),
    					listen_dev(select, "blur", /*onBlur*/ ctx[16], false, false, false),
    					listen_dev(select, "hover", /*onHover*/ ctx[17], false, false, false),
    					listen_dev(select, "focus", /*onFocus*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*placeholder*/ ctx[2] && /*selected*/ ctx[0] === "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_3$4(ctx);
    					if_block.c();
    					if_block.m(select, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*nativeSize*/ 32) {
    				attr_dev(select, "size", /*nativeSize*/ ctx[5]);
    			}

    			if (!current || dirty & /*disabled*/ 4096 && select_disabled_value !== (select_disabled_value = /*disabled*/ ctx[12] ? "disabled" : "")) {
    				prop_dev(select, "disabled", select_disabled_value);
    			}

    			if (dirty & /*selected*/ 1) {
    				select_options(select, /*selected*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(134:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (114:8) {#if !multiple}
    function create_if_block_1$7(ctx) {
    	let select;
    	let if_block_anchor;
    	let select_disabled_value;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*placeholder*/ ctx[2] && /*selected*/ ctx[0] === "" && create_if_block_2$5(ctx);
    	const default_slot_template = /*#slots*/ ctx[20].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[19], null);

    	const block = {
    		c: function create() {
    			select = element("select");
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			if (default_slot) default_slot.c();
    			attr_dev(select, "size", /*nativeSize*/ ctx[5]);
    			select.disabled = select_disabled_value = /*disabled*/ ctx[12] ? "disabled" : "";
    			if (/*selected*/ ctx[0] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[21].call(select));
    			add_location(select, file$c, 114, 12, 2996);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, select, anchor);
    			if (if_block) if_block.m(select, null);
    			append_dev(select, if_block_anchor);

    			if (default_slot) {
    				default_slot.m(select, null);
    			}

    			select_option(select, /*selected*/ ctx[0]);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(select, "change", /*select_change_handler*/ ctx[21]),
    					listen_dev(select, "change", /*onChange*/ ctx[15], false, false, false),
    					listen_dev(select, "blur", /*onBlur*/ ctx[16], false, false, false),
    					listen_dev(select, "hover", /*onHover*/ ctx[17], false, false, false),
    					listen_dev(select, "focus", /*onFocus*/ ctx[18], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*placeholder*/ ctx[2] && /*selected*/ ctx[0] === "") {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$5(ctx);
    					if_block.c();
    					if_block.m(select, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 524288) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[19], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*nativeSize*/ 32) {
    				attr_dev(select, "size", /*nativeSize*/ ctx[5]);
    			}

    			if (!current || dirty & /*disabled*/ 4096 && select_disabled_value !== (select_disabled_value = /*disabled*/ ctx[12] ? "disabled" : "")) {
    				prop_dev(select, "disabled", select_disabled_value);
    			}

    			if (dirty & /*selected*/ 1) {
    				select_option(select, /*selected*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(select);
    			if (if_block) if_block.d();
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$7.name,
    		type: "if",
    		source: "(114:8) {#if !multiple}",
    		ctx
    	});

    	return block;
    }

    // (145:16) {#if placeholder && selected === ''}
    function create_if_block_3$4(ctx) {
    	let option;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(/*placeholder*/ ctx[2]);
    			t1 = space();
    			option.__value = "";
    			option.value = option.__value;
    			option.disabled = true;
    			option.hidden = true;
    			add_location(option, file$c, 145, 20, 3989);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 4) set_data_dev(t0, /*placeholder*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$4.name,
    		type: "if",
    		source: "(145:16) {#if placeholder && selected === ''}",
    		ctx
    	});

    	return block;
    }

    // (124:16) {#if placeholder && selected === ''}
    function create_if_block_2$5(ctx) {
    	let option;
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(/*placeholder*/ ctx[2]);
    			t1 = space();
    			option.__value = "";
    			option.value = option.__value;
    			option.disabled = true;
    			option.hidden = true;
    			add_location(option, file$c, 124, 20, 3345);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*placeholder*/ 4) set_data_dev(t0, /*placeholder*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$5.name,
    		type: "if",
    		source: "(124:16) {#if placeholder && selected === ''}",
    		ctx
    	});

    	return block;
    }

    // (158:4) {#if icon}
    function create_if_block$9(ctx) {
    	let icon_1;
    	let current;

    	icon_1 = new Icon({
    			props: {
    				isLeft: true,
    				icon: /*icon*/ ctx[10],
    				pack: /*iconPack*/ ctx[11],
    				size: /*size*/ ctx[4]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_1_changes = {};
    			if (dirty & /*icon*/ 1024) icon_1_changes.icon = /*icon*/ ctx[10];
    			if (dirty & /*iconPack*/ 2048) icon_1_changes.pack = /*iconPack*/ ctx[11];
    			if (dirty & /*size*/ 16) icon_1_changes.size = /*size*/ ctx[4];
    			icon_1.$set(icon_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$9.name,
    		type: "if",
    		source: "(158:4) {#if icon}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div;
    	let span;
    	let current_block_type_index;
    	let if_block0;
    	let span_class_value;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_1$7, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*multiple*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	let if_block1 = /*icon*/ ctx[10] && create_if_block$9(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", span_class_value = "select " + /*size*/ ctx[4] + " " + /*type*/ ctx[1]);
    			toggle_class(span, "is-fullwidth", /*expanded*/ ctx[6]);
    			toggle_class(span, "is-loading", /*loading*/ ctx[9]);
    			toggle_class(span, "is-multiple", /*multiple*/ ctx[3]);
    			toggle_class(span, "is-rounded", /*rounded*/ ctx[7]);
    			toggle_class(span, "is-empty", /*selected*/ ctx[0] === "");
    			toggle_class(span, "is-focused", /*focused*/ ctx[13]);
    			toggle_class(span, "is-hovered", /*hovered*/ ctx[14]);
    			toggle_class(span, "is-required", /*required*/ ctx[8]);
    			add_location(span, file$c, 103, 4, 2621);
    			attr_dev(div, "class", "control");
    			toggle_class(div, "is-expanded", /*expanded*/ ctx[6]);
    			toggle_class(div, "has-icons-left", /*icon*/ ctx[10]);
    			add_location(div, file$c, 99, 0, 2526);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			if_blocks[current_block_type_index].m(span, null);
    			append_dev(div, t);
    			if (if_block1) if_block1.m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block0 = if_blocks[current_block_type_index];

    				if (!if_block0) {
    					if_block0 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block0.c();
    				} else {
    					if_block0.p(ctx, dirty);
    				}

    				transition_in(if_block0, 1);
    				if_block0.m(span, null);
    			}

    			if (!current || dirty & /*size, type*/ 18 && span_class_value !== (span_class_value = "select " + /*size*/ ctx[4] + " " + /*type*/ ctx[1])) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*size, type, expanded*/ 82) {
    				toggle_class(span, "is-fullwidth", /*expanded*/ ctx[6]);
    			}

    			if (dirty & /*size, type, loading*/ 530) {
    				toggle_class(span, "is-loading", /*loading*/ ctx[9]);
    			}

    			if (dirty & /*size, type, multiple*/ 26) {
    				toggle_class(span, "is-multiple", /*multiple*/ ctx[3]);
    			}

    			if (dirty & /*size, type, rounded*/ 146) {
    				toggle_class(span, "is-rounded", /*rounded*/ ctx[7]);
    			}

    			if (dirty & /*size, type, selected*/ 19) {
    				toggle_class(span, "is-empty", /*selected*/ ctx[0] === "");
    			}

    			if (dirty & /*size, type, focused*/ 8210) {
    				toggle_class(span, "is-focused", /*focused*/ ctx[13]);
    			}

    			if (dirty & /*size, type, hovered*/ 16402) {
    				toggle_class(span, "is-hovered", /*hovered*/ ctx[14]);
    			}

    			if (dirty & /*size, type, required*/ 274) {
    				toggle_class(span, "is-required", /*required*/ ctx[8]);
    			}

    			if (/*icon*/ ctx[10]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*icon*/ 1024) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block$9(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div, null);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*expanded*/ 64) {
    				toggle_class(div, "is-expanded", /*expanded*/ ctx[6]);
    			}

    			if (dirty & /*icon*/ 1024) {
    				toggle_class(div, "has-icons-left", /*icon*/ ctx[10]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Select", slots, ['default']);
    	let { selected = "" } = $$props;
    	let { type = "" } = $$props;
    	let { placeholder = "" } = $$props;
    	let { multiple = false } = $$props;
    	let { size = "" } = $$props;
    	let { nativeSize } = $$props;
    	let { expanded = false } = $$props;
    	let { rounded = false } = $$props;
    	let { required = false } = $$props;
    	let { loading = false } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "mdi" } = $$props;
    	let { disabled = false } = $$props;
    	const dispatch = createEventDispatcher();
    	let focused = false;
    	let hovered = false;

    	function onChange() {
    		dispatch("input", selected);
    	}

    	function onBlur() {
    		$$invalidate(13, focused = false);
    		dispatch("blur");
    	}

    	function onHover() {
    		$$invalidate(14, hovered = true);
    		dispatch("hover");
    	}

    	function onFocus() {
    		$$invalidate(13, focused = true);
    		dispatch("focus");
    	}

    	const writable_props = [
    		"selected",
    		"type",
    		"placeholder",
    		"multiple",
    		"size",
    		"nativeSize",
    		"expanded",
    		"rounded",
    		"required",
    		"loading",
    		"icon",
    		"iconPack",
    		"disabled"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Select> was created with unknown prop '${key}'`);
    	});

    	function select_change_handler() {
    		selected = select_value(this);
    		$$invalidate(0, selected);
    	}

    	function select_change_handler_1() {
    		selected = select_multiple_value(this);
    		$$invalidate(0, selected);
    	}

    	$$self.$$set = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("multiple" in $$props) $$invalidate(3, multiple = $$props.multiple);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("nativeSize" in $$props) $$invalidate(5, nativeSize = $$props.nativeSize);
    		if ("expanded" in $$props) $$invalidate(6, expanded = $$props.expanded);
    		if ("rounded" in $$props) $$invalidate(7, rounded = $$props.rounded);
    		if ("required" in $$props) $$invalidate(8, required = $$props.required);
    		if ("loading" in $$props) $$invalidate(9, loading = $$props.loading);
    		if ("icon" in $$props) $$invalidate(10, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(11, iconPack = $$props.iconPack);
    		if ("disabled" in $$props) $$invalidate(12, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(19, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		Icon,
    		selected,
    		type,
    		placeholder,
    		multiple,
    		size,
    		nativeSize,
    		expanded,
    		rounded,
    		required,
    		loading,
    		icon,
    		iconPack,
    		disabled,
    		dispatch,
    		focused,
    		hovered,
    		onChange,
    		onBlur,
    		onHover,
    		onFocus
    	});

    	$$self.$inject_state = $$props => {
    		if ("selected" in $$props) $$invalidate(0, selected = $$props.selected);
    		if ("type" in $$props) $$invalidate(1, type = $$props.type);
    		if ("placeholder" in $$props) $$invalidate(2, placeholder = $$props.placeholder);
    		if ("multiple" in $$props) $$invalidate(3, multiple = $$props.multiple);
    		if ("size" in $$props) $$invalidate(4, size = $$props.size);
    		if ("nativeSize" in $$props) $$invalidate(5, nativeSize = $$props.nativeSize);
    		if ("expanded" in $$props) $$invalidate(6, expanded = $$props.expanded);
    		if ("rounded" in $$props) $$invalidate(7, rounded = $$props.rounded);
    		if ("required" in $$props) $$invalidate(8, required = $$props.required);
    		if ("loading" in $$props) $$invalidate(9, loading = $$props.loading);
    		if ("icon" in $$props) $$invalidate(10, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(11, iconPack = $$props.iconPack);
    		if ("disabled" in $$props) $$invalidate(12, disabled = $$props.disabled);
    		if ("focused" in $$props) $$invalidate(13, focused = $$props.focused);
    		if ("hovered" in $$props) $$invalidate(14, hovered = $$props.hovered);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selected,
    		type,
    		placeholder,
    		multiple,
    		size,
    		nativeSize,
    		expanded,
    		rounded,
    		required,
    		loading,
    		icon,
    		iconPack,
    		disabled,
    		focused,
    		hovered,
    		onChange,
    		onBlur,
    		onHover,
    		onFocus,
    		$$scope,
    		slots,
    		select_change_handler,
    		select_change_handler_1
    	];
    }

    class Select extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {
    			selected: 0,
    			type: 1,
    			placeholder: 2,
    			multiple: 3,
    			size: 4,
    			nativeSize: 5,
    			expanded: 6,
    			rounded: 7,
    			required: 8,
    			loading: 9,
    			icon: 10,
    			iconPack: 11,
    			disabled: 12
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Select",
    			options,
    			id: create_fragment$d.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*nativeSize*/ ctx[5] === undefined && !("nativeSize" in props)) {
    			console.warn("<Select> was created without expected prop 'nativeSize'");
    		}
    	}

    	get selected() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placeholder() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placeholder(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multiple() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multiple(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get nativeSize() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nativeSize(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get required() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set required(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loading() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loading(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Select>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Select>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Snackbar/Snackbar.svelte generated by Svelte v3.31.1 */

    const { Error: Error_1$1 } = globals;
    const file$d = "node_modules/svelma/src/components/Snackbar/Snackbar.svelte";

    // (96:4) {#if actionText}
    function create_if_block$a(ctx) {
    	let div;
    	let button;
    	let t;
    	let button_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			t = text(/*actionText*/ ctx[2]);
    			attr_dev(button, "class", button_class_value = "button " + /*newType*/ ctx[4] + " svelte-b4y6vb");
    			add_location(button, file$d, 97, 8, 2637);
    			attr_dev(div, "class", "action svelte-b4y6vb");
    			add_location(div, file$d, 96, 6, 2590);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*action*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*actionText*/ 4) set_data_dev(t, /*actionText*/ ctx[2]);

    			if (dirty & /*newType*/ 16 && button_class_value !== (button_class_value = "button " + /*newType*/ ctx[4] + " svelte-b4y6vb")) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$a.name,
    		type: "if",
    		source: "(96:4) {#if actionText}",
    		ctx
    	});

    	return block;
    }

    // (90:0) <Notice {...props} bind:this={notice} transitionOut={true}>
    function create_default_slot$1(ctx) {
    	let div1;
    	let div0;
    	let t;
    	let div1_class_value;
    	let if_block = /*actionText*/ ctx[2] && create_if_block$a(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "text svelte-b4y6vb");
    			add_location(div0, file$d, 91, 4, 2431);
    			attr_dev(div1, "class", div1_class_value = "snackbar " + /*background*/ ctx[1] + " svelte-b4y6vb");
    			attr_dev(div1, "role", "alert");
    			toggle_class(div1, "has-background-dark", !/*background*/ ctx[1]);
    			add_location(div1, file$d, 90, 2, 2338);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			div0.innerHTML = /*message*/ ctx[0];
    			append_dev(div1, t);
    			if (if_block) if_block.m(div1, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) div0.innerHTML = /*message*/ ctx[0];
    			if (/*actionText*/ ctx[2]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$a(ctx);
    					if_block.c();
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*background*/ 2 && div1_class_value !== (div1_class_value = "snackbar " + /*background*/ ctx[1] + " svelte-b4y6vb")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*background, background*/ 2) {
    				toggle_class(div1, "has-background-dark", !/*background*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(90:0) <Notice {...props} bind:this={notice} transitionOut={true}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let notice_1;
    	let current;
    	const notice_1_spread_levels = [/*props*/ ctx[5], { transitionOut: true }];

    	let notice_1_props = {
    		$$slots: { default: [create_default_slot$1] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notice_1_spread_levels.length; i += 1) {
    		notice_1_props = assign(notice_1_props, notice_1_spread_levels[i]);
    	}

    	notice_1 = new Notice({ props: notice_1_props, $$inline: true });
    	/*notice_1_binding*/ ctx[11](notice_1);

    	const block = {
    		c: function create() {
    			create_component(notice_1.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error_1$1("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(notice_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const notice_1_changes = (dirty & /*props*/ 32)
    			? get_spread_update(notice_1_spread_levels, [get_spread_object(/*props*/ ctx[5]), notice_1_spread_levels[1]])
    			: {};

    			if (dirty & /*$$scope, background, newType, actionText, message*/ 8215) {
    				notice_1_changes.$$scope = { dirty, ctx };
    			}

    			notice_1.$set(notice_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notice_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notice_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			/*notice_1_binding*/ ctx[11](null);
    			destroy_component(notice_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let newType;
    	let props;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Snackbar", slots, []);
    	let { message } = $$props;
    	let { duration = 3500 } = $$props;
    	let { position = "is-bottom-right" } = $$props;
    	let { type = "is-primary" } = $$props;
    	let { background = "" } = $$props;
    	let { actionText = "OK" } = $$props;

    	let { onAction = () => {
    		
    	} } = $$props;

    	let notice;

    	function action() {
    		Promise.resolve(onAction()).then(() => notice.close());
    	}

    	onMount(() => {
    		if (typeof onAction !== "function") throw new Error(`onAction ${onAction} is not a function`);
    	});

    	function notice_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			notice = $$value;
    			$$invalidate(3, notice);
    		});
    	}

    	$$self.$$set = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("message" in $$new_props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$new_props) $$invalidate(7, duration = $$new_props.duration);
    		if ("position" in $$new_props) $$invalidate(8, position = $$new_props.position);
    		if ("type" in $$new_props) $$invalidate(9, type = $$new_props.type);
    		if ("background" in $$new_props) $$invalidate(1, background = $$new_props.background);
    		if ("actionText" in $$new_props) $$invalidate(2, actionText = $$new_props.actionText);
    		if ("onAction" in $$new_props) $$invalidate(10, onAction = $$new_props.onAction);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		fly,
    		fade,
    		Notice,
    		filterProps,
    		message,
    		duration,
    		position,
    		type,
    		background,
    		actionText,
    		onAction,
    		notice,
    		action,
    		newType,
    		props
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(12, $$props = assign(assign({}, $$props), $$new_props));
    		if ("message" in $$props) $$invalidate(0, message = $$new_props.message);
    		if ("duration" in $$props) $$invalidate(7, duration = $$new_props.duration);
    		if ("position" in $$props) $$invalidate(8, position = $$new_props.position);
    		if ("type" in $$props) $$invalidate(9, type = $$new_props.type);
    		if ("background" in $$props) $$invalidate(1, background = $$new_props.background);
    		if ("actionText" in $$props) $$invalidate(2, actionText = $$new_props.actionText);
    		if ("onAction" in $$props) $$invalidate(10, onAction = $$new_props.onAction);
    		if ("notice" in $$props) $$invalidate(3, notice = $$new_props.notice);
    		if ("newType" in $$props) $$invalidate(4, newType = $$new_props.newType);
    		if ("props" in $$props) $$invalidate(5, props = $$new_props.props);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*type*/ 512) {
    			// $: newBackground = background
    			 $$invalidate(4, newType = type && type.replace(/^is-(.*)/, "has-text-$1"));
    		}

    		 $$invalidate(5, props = {
    			...filterProps($$props),
    			position,
    			duration
    		});
    	};

    	$$props = exclude_internal_props($$props);

    	return [
    		message,
    		background,
    		actionText,
    		notice,
    		newType,
    		props,
    		action,
    		duration,
    		position,
    		type,
    		onAction,
    		notice_1_binding
    	];
    }

    class Snackbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {
    			message: 0,
    			duration: 7,
    			position: 8,
    			type: 9,
    			background: 1,
    			actionText: 2,
    			onAction: 10
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Snackbar",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Snackbar> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get actionText() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set actionText(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onAction() {
    		throw new Error_1$1("<Snackbar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onAction(value) {
    		throw new Error_1$1("<Snackbar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Snackbar.create = create$1;

    function create$1(props) {
      if (typeof props === 'string') props = { message: props };

      const snackbar = new Snackbar({
        target: document.body,
        props,
        intro: true,
      });

      snackbar.$on('destroyed', snackbar.$destroy);

      return snackbar;
    }

    /* node_modules/svelma/src/components/Switch.svelte generated by Svelte v3.31.1 */

    const file$e = "node_modules/svelma/src/components/Switch.svelte";

    function create_fragment$f(ctx) {
    	let label_1;
    	let input_1;
    	let t0;
    	let div;
    	let div_class_value;
    	let t1;
    	let span;
    	let label_1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			label_1 = element("label");
    			input_1 = element("input");
    			t0 = space();
    			div = element("div");
    			t1 = space();
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(input_1, "type", "checkbox");
    			attr_dev(input_1, "class", "svelte-1koso5a");
    			add_location(input_1, file$e, 112, 2, 2362);
    			attr_dev(div, "class", div_class_value = "check " + /*newBackground*/ ctx[4] + " svelte-1koso5a");
    			add_location(div, file$e, 114, 2, 2440);
    			attr_dev(span, "class", "control-label svelte-1koso5a");
    			add_location(span, file$e, 116, 2, 2485);
    			attr_dev(label_1, "ref", "label");
    			attr_dev(label_1, "class", label_1_class_value = "switch " + /*size*/ ctx[1] + " svelte-1koso5a");
    			add_location(label_1, file$e, 111, 0, 2300);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label_1, anchor);
    			append_dev(label_1, input_1);
    			input_1.checked = /*checked*/ ctx[0];
    			/*input_1_binding*/ ctx[12](input_1);
    			append_dev(label_1, t0);
    			append_dev(label_1, div);
    			append_dev(label_1, t1);
    			append_dev(label_1, span);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			/*label_1_binding*/ ctx[13](label_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input_1, "change", /*input_1_change_handler*/ ctx[11]),
    					listen_dev(input_1, "input", /*input_handler*/ ctx[9], false, false, false),
    					listen_dev(input_1, "click", /*click_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*checked*/ 1) {
    				input_1.checked = /*checked*/ ctx[0];
    			}

    			if (!current || dirty & /*newBackground*/ 16 && div_class_value !== (div_class_value = "check " + /*newBackground*/ ctx[4] + " svelte-1koso5a")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*size*/ 2 && label_1_class_value !== (label_1_class_value = "switch " + /*size*/ ctx[1] + " svelte-1koso5a")) {
    				attr_dev(label_1, "class", label_1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label_1);
    			/*input_1_binding*/ ctx[12](null);
    			if (default_slot) default_slot.d(detaching);
    			/*label_1_binding*/ ctx[13](null);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let newBackground;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Switch", slots, ['default']);
    	let { checked = false } = $$props;
    	let { type = "is-primary" } = $$props;
    	let { size = "" } = $$props;
    	let { disabled = false } = $$props;
    	let label;
    	let input;
    	const writable_props = ["checked", "type", "size", "disabled"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function input_handler(event) {
    		bubble($$self, event);
    	}

    	function click_handler(event) {
    		bubble($$self, event);
    	}

    	function input_1_change_handler() {
    		checked = this.checked;
    		$$invalidate(0, checked);
    	}

    	function input_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			input = $$value;
    			$$invalidate(3, input);
    		});
    	}

    	function label_1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			label = $$value;
    			$$invalidate(2, label);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("type" in $$props) $$invalidate(5, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		checked,
    		type,
    		size,
    		disabled,
    		label,
    		input,
    		newBackground
    	});

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("type" in $$props) $$invalidate(5, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("disabled" in $$props) $$invalidate(6, disabled = $$props.disabled);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("input" in $$props) $$invalidate(3, input = $$props.input);
    		if ("newBackground" in $$props) $$invalidate(4, newBackground = $$props.newBackground);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*type*/ 32) {
    			 $$invalidate(4, newBackground = type && type.replace(/^is-(.*)/, "has-background-$1") || "");
    		}

    		if ($$self.$$.dirty & /*input, disabled, label*/ 76) {
    			 {
    				if (input) {
    					if (disabled) {
    						label.setAttribute("disabled", "disabled");
    						input.setAttribute("disabled", "disabled");
    					} else {
    						label.removeAttribute("disabled");
    						input.removeAttribute("disabled");
    					}
    				}
    			}
    		}
    	};

    	return [
    		checked,
    		size,
    		label,
    		input,
    		newBackground,
    		type,
    		disabled,
    		$$scope,
    		slots,
    		input_handler,
    		click_handler,
    		input_1_change_handler,
    		input_1_binding,
    		label_1_binding
    	];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$f, create_fragment$f, safe_not_equal, {
    			checked: 0,
    			type: 5,
    			size: 1,
    			disabled: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get checked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Tabs/Tabs.svelte generated by Svelte v3.31.1 */
    const file$f = "node_modules/svelma/src/components/Tabs/Tabs.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	child_ctx[17] = i;
    	return child_ctx;
    }

    // (88:12) {#if tab.icon}
    function create_if_block$b(ctx) {
    	let icon;
    	let current;

    	icon = new Icon({
    			props: {
    				pack: /*tab*/ ctx[15].iconPack,
    				icon: /*tab*/ ctx[15].icon
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const icon_changes = {};
    			if (dirty & /*$tabs*/ 32) icon_changes.pack = /*tab*/ ctx[15].iconPack;
    			if (dirty & /*$tabs*/ 32) icon_changes.icon = /*tab*/ ctx[15].icon;
    			icon.$set(icon_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$b.name,
    		type: "if",
    		source: "(88:12) {#if tab.icon}",
    		ctx
    	});

    	return block;
    }

    // (85:6) {#each $tabs as tab, index}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0;
    	let span;
    	let t1_value = /*tab*/ ctx[15].label + "";
    	let t1;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*tab*/ ctx[15].icon && create_if_block$b(ctx);

    	function click_handler() {
    		return /*click_handler*/ ctx[11](/*index*/ ctx[17]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			if (if_block) if_block.c();
    			t0 = space();
    			span = element("span");
    			t1 = text(t1_value);
    			t2 = space();
    			add_location(span, file$f, 91, 12, 2337);
    			attr_dev(a, "href", "");
    			add_location(a, file$f, 86, 10, 2162);
    			toggle_class(li, "is-active", /*index*/ ctx[17] === /*activeTab*/ ctx[4]);
    			add_location(li, file$f, 85, 8, 2109);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			if (if_block) if_block.m(a, null);
    			append_dev(a, t0);
    			append_dev(a, span);
    			append_dev(span, t1);
    			append_dev(li, t2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(a, "click", prevent_default(click_handler), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (/*tab*/ ctx[15].icon) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$tabs*/ 32) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$b(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(a, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if ((!current || dirty & /*$tabs*/ 32) && t1_value !== (t1_value = /*tab*/ ctx[15].label + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*activeTab*/ 16) {
    				toggle_class(li, "is-active", /*index*/ ctx[17] === /*activeTab*/ ctx[4]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if (if_block) if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(85:6) {#each $tabs as tab, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let div;
    	let nav;
    	let ul;
    	let nav_class_value;
    	let t;
    	let section;
    	let current;
    	let each_value = /*$tabs*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			nav = element("nav");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			section = element("section");
    			if (default_slot) default_slot.c();
    			add_location(ul, file$f, 83, 4, 2062);
    			attr_dev(nav, "class", nav_class_value = "tabs " + /*size*/ ctx[0] + " " + /*position*/ ctx[1] + " " + /*style*/ ctx[2] + " svelte-b6hyie");
    			add_location(nav, file$f, 82, 2, 2013);
    			attr_dev(section, "class", "tab-content svelte-b6hyie");
    			add_location(section, file$f, 97, 2, 2426);
    			attr_dev(div, "class", "tabs-wrapper svelte-b6hyie");
    			toggle_class(div, "is-fullwidth", /*expanded*/ ctx[3]);
    			add_location(div, file$f, 81, 0, 1954);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, nav);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(div, t);
    			append_dev(div, section);

    			if (default_slot) {
    				default_slot.m(section, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeTab, changeTab, $tabs*/ 176) {
    				each_value = /*$tabs*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(ul, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*size, position, style*/ 7 && nav_class_value !== (nav_class_value = "tabs " + /*size*/ ctx[0] + " " + /*position*/ ctx[1] + " " + /*style*/ ctx[2] + " svelte-b6hyie")) {
    				attr_dev(nav, "class", nav_class_value);
    			}

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (dirty & /*expanded*/ 8) {
    				toggle_class(div, "is-fullwidth", /*expanded*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let $tabs;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tabs", slots, ['default']);
    	const dispatch = createEventDispatcher();
    	let { value = 0 } = $$props;
    	let { size = "" } = $$props;
    	let { position = "" } = $$props;
    	let { style = "" } = $$props;
    	let { expanded = false } = $$props;
    	let activeTab = 0;
    	const tabs = writable([]);
    	validate_store(tabs, "tabs");
    	component_subscribe($$self, tabs, value => $$invalidate(5, $tabs = value));
    	const tabConfig = { activeTab, tabs };
    	setContext("tabs", tabConfig);

    	// This only runs as tabs are added/removed
    	const unsubscribe = tabs.subscribe(ts => {
    		if (ts.length > 0 && ts.length > value - 1) {
    			ts.forEach(t => t.deactivate());
    			if (ts[value]) ts[value].activate();
    		}
    	});

    	function changeTab(tabNumber) {
    		const ts = get_store_value(tabs);

    		// NOTE: change this back to using changeTab instead of activate/deactivate once transitions/animations are working
    		if (ts[activeTab]) ts[activeTab].deactivate();

    		if (ts[tabNumber]) ts[tabNumber].activate();

    		// ts.forEach(t => t.changeTab({ from: activeTab, to: tabNumber }))
    		$$invalidate(4, activeTab = tabConfig.activeTab = tabNumber);

    		dispatch("activeTabChanged", tabNumber);
    	}

    	onMount(() => {
    		changeTab(activeTab);
    	});

    	onDestroy(() => {
    		unsubscribe();
    	});

    	const writable_props = ["value", "size", "position", "style", "expanded"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tabs> was created with unknown prop '${key}'`);
    	});

    	const click_handler = index => changeTab(index);

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		getContext,
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		get: get_store_value,
    		writable,
    		Icon,
    		dispatch,
    		value,
    		size,
    		position,
    		style,
    		expanded,
    		activeTab,
    		tabs,
    		tabConfig,
    		unsubscribe,
    		changeTab,
    		$tabs
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(8, value = $$props.value);
    		if ("size" in $$props) $$invalidate(0, size = $$props.size);
    		if ("position" in $$props) $$invalidate(1, position = $$props.position);
    		if ("style" in $$props) $$invalidate(2, style = $$props.style);
    		if ("expanded" in $$props) $$invalidate(3, expanded = $$props.expanded);
    		if ("activeTab" in $$props) $$invalidate(4, activeTab = $$props.activeTab);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*value*/ 256) {
    			 changeTab(value);
    		}
    	};

    	return [
    		size,
    		position,
    		style,
    		expanded,
    		activeTab,
    		$tabs,
    		tabs,
    		changeTab,
    		value,
    		$$scope,
    		slots,
    		click_handler
    	];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			value: 8,
    			size: 0,
    			position: 1,
    			style: 2,
    			expanded: 3
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment$g.name
    		});
    	}

    	get value() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<Tabs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<Tabs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Tabs/Tab.svelte generated by Svelte v3.31.1 */
    const file$g = "node_modules/svelma/src/components/Tabs/Tab.svelte";

    const get_default_slot_changes$1 = dirty => ({
    	label: dirty & /*label*/ 1,
    	iconPack: dirty & /*iconPack*/ 4,
    	icon: dirty & /*icon*/ 2
    });

    const get_default_slot_context$1 = ctx => ({
    	label: /*label*/ ctx[0],
    	iconPack: /*iconPack*/ ctx[2],
    	icon: /*icon*/ ctx[1]
    });

    function create_fragment$h(ctx) {
    	let div;
    	let div_class_value;
    	let div_aria_hidden_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[9].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[8], get_default_slot_context$1);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", div_class_value = "tab " + /*direction*/ ctx[5] + " svelte-12yh5oq");
    			attr_dev(div, "aria-hidden", div_aria_hidden_value = !/*active*/ ctx[3]);
    			toggle_class(div, "is-active", /*active*/ ctx[3]);
    			add_location(div, file$g, 99, 0, 2225);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[10](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "transitionend", /*transitionend*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope, label, iconPack, icon*/ 263) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[8], dirty, get_default_slot_changes$1, get_default_slot_context$1);
    				}
    			}

    			if (!current || dirty & /*direction*/ 32 && div_class_value !== (div_class_value = "tab " + /*direction*/ ctx[5] + " svelte-12yh5oq")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (!current || dirty & /*active*/ 8 && div_aria_hidden_value !== (div_aria_hidden_value = !/*active*/ ctx[3])) {
    				attr_dev(div, "aria-hidden", div_aria_hidden_value);
    			}

    			if (dirty & /*direction, active*/ 40) {
    				toggle_class(div, "is-active", /*active*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[10](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$h.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$h($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tab", slots, ['default']);
    	let { label } = $$props;
    	let { icon = "" } = $$props;
    	let { iconPack = "" } = $$props;
    	let active = false;
    	let el;
    	let index;
    	let starting = false;
    	let direction = "";
    	let isIn = false;
    	const tabConfig = getContext("tabs");

    	async function changeTab({ from, to }) {
    		if (from === to) return;

    		// console.log({ index, from, to }, to === index)
    		if (from === index) {
    			// Transition out
    			$$invalidate(5, direction = index < to ? "left" : "right");
    		} else if (to === index) {
    			// Transition in; start at direction when rendered, then remove it
    			// console.log('TRANSITION', { index, to, active })
    			$$invalidate(3, active = true);

    			$$invalidate(5, direction = index > from ? "right" : "left");
    		} else // direction = ''
    		$$invalidate(5, direction = ""); // await tick()
    	}

    	function updateIndex() {
    		if (!el) return;
    		index = Array.prototype.indexOf.call(el.parentNode.children, el);
    	}

    	async function transitionend(event) {
    		// console.log({ index, active, activeTab: tabConfig.activeTab })
    		// console.log(event.target)
    		$$invalidate(3, active = index === tabConfig.activeTab);

    		await tick();
    		$$invalidate(5, direction = "");
    	}

    	tabConfig.tabs.subscribe(tabs => {
    		updateIndex();
    	});

    	onMount(() => {
    		updateIndex();

    		tabConfig.tabs.update(tabs => [
    			...tabs,
    			{
    				index,
    				label,
    				icon,
    				iconPack,
    				activate: () => $$invalidate(3, active = true),
    				deactivate: () => $$invalidate(3, active = false),
    				changeTab
    			}
    		]);
    	});

    	beforeUpdate(async () => {
    		if (index === tabConfig.activeTab && direction) {
    			await tick();

    			setTimeout(() => {
    				$$invalidate(5, direction = "");
    			});
    		}
    	});

    	const writable_props = ["label", "icon", "iconPack"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			el = $$value;
    			$$invalidate(4, el);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(2, iconPack = $$props.iconPack);
    		if ("$$scope" in $$props) $$invalidate(8, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		beforeUpdate,
    		setContext,
    		getContext,
    		tick,
    		onMount,
    		Icon,
    		label,
    		icon,
    		iconPack,
    		active,
    		el,
    		index,
    		starting,
    		direction,
    		isIn,
    		tabConfig,
    		changeTab,
    		updateIndex,
    		transitionend
    	});

    	$$self.$inject_state = $$props => {
    		if ("label" in $$props) $$invalidate(0, label = $$props.label);
    		if ("icon" in $$props) $$invalidate(1, icon = $$props.icon);
    		if ("iconPack" in $$props) $$invalidate(2, iconPack = $$props.iconPack);
    		if ("active" in $$props) $$invalidate(3, active = $$props.active);
    		if ("el" in $$props) $$invalidate(4, el = $$props.el);
    		if ("index" in $$props) index = $$props.index;
    		if ("starting" in $$props) starting = $$props.starting;
    		if ("direction" in $$props) $$invalidate(5, direction = $$props.direction);
    		if ("isIn" in $$props) isIn = $$props.isIn;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		label,
    		icon,
    		iconPack,
    		active,
    		el,
    		direction,
    		transitionend,
    		changeTab,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$h, create_fragment$h, safe_not_equal, {
    			label: 0,
    			icon: 1,
    			iconPack: 2,
    			changeTab: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$h.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*label*/ ctx[0] === undefined && !("label" in props)) {
    			console.warn("<Tab> was created without expected prop 'label'");
    		}
    	}

    	get label() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iconPack() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iconPack(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get changeTab() {
    		return this.$$.ctx[7];
    	}

    	set changeTab(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Toast/Toast.svelte generated by Svelte v3.31.1 */
    const file$h = "node_modules/svelma/src/components/Toast/Toast.svelte";

    // (49:0) <Notice {...filterProps($$props)}>
    function create_default_slot$2(ctx) {
    	let div1;
    	let div0;
    	let div1_class_value;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			attr_dev(div0, "class", "text");
    			add_location(div0, file$h, 50, 4, 1497);
    			attr_dev(div1, "class", div1_class_value = "toast " + /*type*/ ctx[1] + " " + /*newBackground*/ ctx[2] + " svelte-z18xt5");
    			attr_dev(div1, "role", "alert");
    			add_location(div1, file$h, 49, 2, 1437);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			div0.innerHTML = /*message*/ ctx[0];
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*message*/ 1) div0.innerHTML = /*message*/ ctx[0];
    			if (dirty & /*type, newBackground*/ 6 && div1_class_value !== (div1_class_value = "toast " + /*type*/ ctx[1] + " " + /*newBackground*/ ctx[2] + " svelte-z18xt5")) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(49:0) <Notice {...filterProps($$props)}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$i(ctx) {
    	let notice;
    	let current;
    	const notice_spread_levels = [filterProps(/*$$props*/ ctx[3])];

    	let notice_props = {
    		$$slots: { default: [create_default_slot$2] },
    		$$scope: { ctx }
    	};

    	for (let i = 0; i < notice_spread_levels.length; i += 1) {
    		notice_props = assign(notice_props, notice_spread_levels[i]);
    	}

    	notice = new Notice({ props: notice_props, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(notice.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(notice, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const notice_changes = (dirty & /*filterProps, $$props*/ 8)
    			? get_spread_update(notice_spread_levels, [get_spread_object(filterProps(/*$$props*/ ctx[3]))])
    			: {};

    			if (dirty & /*$$scope, type, newBackground, message*/ 39) {
    				notice_changes.$$scope = { dirty, ctx };
    			}

    			notice.$set(notice_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(notice.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(notice.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(notice, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$i.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$i($$self, $$props, $$invalidate) {
    	let newBackground;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Toast", slots, []);
    	let { message } = $$props;
    	let { type = "is-dark" } = $$props;
    	let { background = "" } = $$props;

    	$$self.$$set = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("message" in $$new_props) $$invalidate(0, message = $$new_props.message);
    		if ("type" in $$new_props) $$invalidate(1, type = $$new_props.type);
    		if ("background" in $$new_props) $$invalidate(4, background = $$new_props.background);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onDestroy,
    		onMount,
    		fly,
    		fade,
    		Notice,
    		filterProps,
    		message,
    		type,
    		background,
    		newBackground
    	});

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(3, $$props = assign(assign({}, $$props), $$new_props));
    		if ("message" in $$props) $$invalidate(0, message = $$new_props.message);
    		if ("type" in $$props) $$invalidate(1, type = $$new_props.type);
    		if ("background" in $$props) $$invalidate(4, background = $$new_props.background);
    		if ("newBackground" in $$props) $$invalidate(2, newBackground = $$new_props.newBackground);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*background, type*/ 18) {
    			 $$invalidate(2, newBackground = background || type.replace(/^is-(.*)/, "has-background-$1"));
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [message, type, newBackground, $$props, background];
    }

    class Toast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$i, create_fragment$i, safe_not_equal, { message: 0, type: 1, background: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toast",
    			options,
    			id: create_fragment$i.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*message*/ ctx[0] === undefined && !("message" in props)) {
    			console.warn("<Toast> was created without expected prop 'message'");
    		}
    	}

    	get message() {
    		throw new Error("<Toast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set message(value) {
    		throw new Error("<Toast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Toast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Toast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get background() {
    		throw new Error("<Toast>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set background(value) {
    		throw new Error("<Toast>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    Toast.create = create$2;

    function create$2(props) {
      if (typeof props === 'string') props = { message: props };

      const toast = new Toast({
        target: document.body,
        props,
        intro: true,
      });

      toast.$on('destroyed', toast.$destroy);

      return toast;
    }

    /* node_modules/svelma/src/components/Tooltip.svelte generated by Svelte v3.31.1 */

    const file$i = "node_modules/svelma/src/components/Tooltip.svelte";

    function create_fragment$j(ctx) {
    	let span;
    	let span_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			attr_dev(span, "data-label", /*label*/ ctx[2]);
    			attr_dev(span, "class", span_class_value = "" + (/*type*/ ctx[0] + " " + /*position*/ ctx[3] + " " + /*size*/ ctx[9] + " svelte-1ycycz4"));
    			toggle_class(span, "tooltip", /*active*/ ctx[1]);
    			toggle_class(span, "is-square", /*square*/ ctx[6]);
    			toggle_class(span, "is-animated", /*animated*/ ctx[5]);
    			toggle_class(span, "is-always", /*always*/ ctx[4]);
    			toggle_class(span, "is-multiline", /*multilined*/ ctx[8]);
    			toggle_class(span, "is-dashed", /*dashed*/ ctx[7]);
    			add_location(span, file$i, 458, 0, 12235);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*label*/ 4) {
    				attr_dev(span, "data-label", /*label*/ ctx[2]);
    			}

    			if (!current || dirty & /*type, position, size*/ 521 && span_class_value !== (span_class_value = "" + (/*type*/ ctx[0] + " " + /*position*/ ctx[3] + " " + /*size*/ ctx[9] + " svelte-1ycycz4"))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (dirty & /*type, position, size, active*/ 523) {
    				toggle_class(span, "tooltip", /*active*/ ctx[1]);
    			}

    			if (dirty & /*type, position, size, square*/ 585) {
    				toggle_class(span, "is-square", /*square*/ ctx[6]);
    			}

    			if (dirty & /*type, position, size, animated*/ 553) {
    				toggle_class(span, "is-animated", /*animated*/ ctx[5]);
    			}

    			if (dirty & /*type, position, size, always*/ 537) {
    				toggle_class(span, "is-always", /*always*/ ctx[4]);
    			}

    			if (dirty & /*type, position, size, multilined*/ 777) {
    				toggle_class(span, "is-multiline", /*multilined*/ ctx[8]);
    			}

    			if (dirty & /*type, position, size, dashed*/ 649) {
    				toggle_class(span, "is-dashed", /*dashed*/ ctx[7]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$j.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$j($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tooltip", slots, ['default']);
    	let { type = "is-primary" } = $$props;
    	let { active = true } = $$props;
    	let { label = "" } = $$props;
    	let { position = "is-top" } = $$props;
    	let { always = false } = $$props;
    	let { animated = false } = $$props;
    	let { square = false } = $$props;
    	let { dashed = false } = $$props;
    	let { multilined = false } = $$props;
    	let { size = "is-medium" } = $$props;

    	const writable_props = [
    		"type",
    		"active",
    		"label",
    		"position",
    		"always",
    		"animated",
    		"square",
    		"dashed",
    		"multilined",
    		"size"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("position" in $$props) $$invalidate(3, position = $$props.position);
    		if ("always" in $$props) $$invalidate(4, always = $$props.always);
    		if ("animated" in $$props) $$invalidate(5, animated = $$props.animated);
    		if ("square" in $$props) $$invalidate(6, square = $$props.square);
    		if ("dashed" in $$props) $$invalidate(7, dashed = $$props.dashed);
    		if ("multilined" in $$props) $$invalidate(8, multilined = $$props.multilined);
    		if ("size" in $$props) $$invalidate(9, size = $$props.size);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		type,
    		active,
    		label,
    		position,
    		always,
    		animated,
    		square,
    		dashed,
    		multilined,
    		size
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("active" in $$props) $$invalidate(1, active = $$props.active);
    		if ("label" in $$props) $$invalidate(2, label = $$props.label);
    		if ("position" in $$props) $$invalidate(3, position = $$props.position);
    		if ("always" in $$props) $$invalidate(4, always = $$props.always);
    		if ("animated" in $$props) $$invalidate(5, animated = $$props.animated);
    		if ("square" in $$props) $$invalidate(6, square = $$props.square);
    		if ("dashed" in $$props) $$invalidate(7, dashed = $$props.dashed);
    		if ("multilined" in $$props) $$invalidate(8, multilined = $$props.multilined);
    		if ("size" in $$props) $$invalidate(9, size = $$props.size);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		active,
    		label,
    		position,
    		always,
    		animated,
    		square,
    		dashed,
    		multilined,
    		size,
    		$$scope,
    		slots
    	];
    }

    class Tooltip extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$j, create_fragment$j, safe_not_equal, {
    			type: 0,
    			active: 1,
    			label: 2,
    			position: 3,
    			always: 4,
    			animated: 5,
    			square: 6,
    			dashed: 7,
    			multilined: 8,
    			size: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$j.name
    		});
    	}

    	get type() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get active() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get label() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set label(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get position() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set position(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get always() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set always(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animated() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animated(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get square() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set square(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dashed() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dashed(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get multilined() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set multilined(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Tag/Tag.svelte generated by Svelte v3.31.1 */
    const file$j = "node_modules/svelma/src/components/Tag/Tag.svelte";

    // (74:0) {:else}
    function create_else_block$2(ctx) {
    	let span1;
    	let span0;
    	let t;
    	let span1_class_value;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);
    	let if_block = /*closable*/ ctx[3] && create_if_block_1$8(ctx);

    	const block = {
    		c: function create() {
    			span1 = element("span");
    			span0 = element("span");
    			if (default_slot) default_slot.c();
    			t = space();
    			if (if_block) if_block.c();
    			toggle_class(span0, "has-ellipsis", /*ellipsis*/ ctx[5]);
    			add_location(span0, file$j, 77, 8, 2241);
    			attr_dev(span1, "class", span1_class_value = "tag " + /*type*/ ctx[0] + " " + /*size*/ ctx[1]);
    			toggle_class(span1, "is-rounded", /*rounded*/ ctx[2]);
    			add_location(span1, file$j, 74, 4, 2157);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span1, anchor);
    			append_dev(span1, span0);

    			if (default_slot) {
    				default_slot.m(span0, null);
    			}

    			append_dev(span1, t);
    			if (if_block) if_block.m(span1, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (dirty & /*ellipsis*/ 32) {
    				toggle_class(span0, "has-ellipsis", /*ellipsis*/ ctx[5]);
    			}

    			if (/*closable*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$8(ctx);
    					if_block.c();
    					if_block.m(span1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*type, size*/ 3 && span1_class_value !== (span1_class_value = "tag " + /*type*/ ctx[0] + " " + /*size*/ ctx[1])) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*type, size, rounded*/ 7) {
    				toggle_class(span1, "is-rounded", /*rounded*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span1);
    			if (default_slot) default_slot.d(detaching);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(74:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (56:0) {#if attached && closable}
    function create_if_block$c(ctx) {
    	let div;
    	let span1;
    	let span0;
    	let span1_class_value;
    	let t;
    	let a;
    	let a_class_value;
    	let a_tabindex_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			span0 = element("span");
    			if (default_slot) default_slot.c();
    			t = space();
    			a = element("a");
    			toggle_class(span0, "has-ellipsis", /*ellipsis*/ ctx[5]);
    			add_location(span0, file$j, 60, 12, 1757);
    			attr_dev(span1, "class", span1_class_value = "tag " + /*type*/ ctx[0] + " " + /*size*/ ctx[1]);
    			toggle_class(span1, "is-rounded", /*rounded*/ ctx[2]);
    			add_location(span1, file$j, 57, 8, 1661);
    			attr_dev(a, "role", "button");
    			attr_dev(a, "class", a_class_value = "tag is-delete " + /*size*/ ctx[1]);
    			attr_dev(a, "disabled", /*disabled*/ ctx[7]);
    			attr_dev(a, "tabindex", a_tabindex_value = /*tabstop*/ ctx[6] ? 0 : false);
    			toggle_class(a, "is-rounded", /*rounded*/ ctx[2]);
    			add_location(a, file$j, 64, 8, 1862);
    			attr_dev(div, "class", "tags has-addons");
    			add_location(div, file$j, 56, 4, 1623);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, span0);

    			if (default_slot) {
    				default_slot.m(span0, null);
    			}

    			append_dev(div, t);
    			append_dev(div, a);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*close*/ ctx[8], false, false, false),
    					listen_dev(a, "keyup", prevent_default(/*keyup_handler*/ ctx[11]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 512) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[9], dirty, null, null);
    				}
    			}

    			if (dirty & /*ellipsis*/ 32) {
    				toggle_class(span0, "has-ellipsis", /*ellipsis*/ ctx[5]);
    			}

    			if (!current || dirty & /*type, size*/ 3 && span1_class_value !== (span1_class_value = "tag " + /*type*/ ctx[0] + " " + /*size*/ ctx[1])) {
    				attr_dev(span1, "class", span1_class_value);
    			}

    			if (dirty & /*type, size, rounded*/ 7) {
    				toggle_class(span1, "is-rounded", /*rounded*/ ctx[2]);
    			}

    			if (!current || dirty & /*size*/ 2 && a_class_value !== (a_class_value = "tag is-delete " + /*size*/ ctx[1])) {
    				attr_dev(a, "class", a_class_value);
    			}

    			if (!current || dirty & /*disabled*/ 128) {
    				attr_dev(a, "disabled", /*disabled*/ ctx[7]);
    			}

    			if (!current || dirty & /*tabstop*/ 64 && a_tabindex_value !== (a_tabindex_value = /*tabstop*/ ctx[6] ? 0 : false)) {
    				attr_dev(a, "tabindex", a_tabindex_value);
    			}

    			if (dirty & /*size, rounded*/ 6) {
    				toggle_class(a, "is-rounded", /*rounded*/ ctx[2]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$c.name,
    		type: "if",
    		source: "(56:0) {#if attached && closable}",
    		ctx
    	});

    	return block;
    }

    // (81:8) {#if closable}
    function create_if_block_1$8(ctx) {
    	let a;
    	let a_tabindex_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			a = element("a");
    			attr_dev(a, "role", "button");
    			attr_dev(a, "class", "delete is-small");
    			attr_dev(a, "disabled", /*disabled*/ ctx[7]);
    			attr_dev(a, "tabindex", a_tabindex_value = /*tabstop*/ ctx[6] ? 0 : false);
    			add_location(a, file$j, 81, 12, 2349);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, a, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(a, "click", /*close*/ ctx[8], false, false, false),
    					listen_dev(a, "keyup", prevent_default(/*keyup_handler_1*/ ctx[12]), false, true, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*disabled*/ 128) {
    				attr_dev(a, "disabled", /*disabled*/ ctx[7]);
    			}

    			if (dirty & /*tabstop*/ 64 && a_tabindex_value !== (a_tabindex_value = /*tabstop*/ ctx[6] ? 0 : false)) {
    				attr_dev(a, "tabindex", a_tabindex_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(a);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$8.name,
    		type: "if",
    		source: "(81:8) {#if closable}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$k(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$c, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*attached*/ ctx[4] && /*closable*/ ctx[3]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$k.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$k($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tag", slots, ['default']);
    	let { type = "" } = $$props;
    	let { size = "" } = $$props;
    	let { rounded = false } = $$props;
    	let { closable = false } = $$props;
    	let { attached = false } = $$props;
    	let { ellipsis = false } = $$props;
    	let { tabstop = true } = $$props;
    	let { disabled = false } = $$props;
    	const dispatch = createEventDispatcher();

    	function close() {
    		if (this.disabled) return;
    		dispatch("close");
    	}

    	const writable_props = [
    		"type",
    		"size",
    		"rounded",
    		"closable",
    		"attached",
    		"ellipsis",
    		"tabstop",
    		"disabled"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tag> was created with unknown prop '${key}'`);
    	});

    	const keyup_handler = e => isDeleteKey() && close();
    	const keyup_handler_1 = e => isDeleteKey() && close();

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("rounded" in $$props) $$invalidate(2, rounded = $$props.rounded);
    		if ("closable" in $$props) $$invalidate(3, closable = $$props.closable);
    		if ("attached" in $$props) $$invalidate(4, attached = $$props.attached);
    		if ("ellipsis" in $$props) $$invalidate(5, ellipsis = $$props.ellipsis);
    		if ("tabstop" in $$props) $$invalidate(6, tabstop = $$props.tabstop);
    		if ("disabled" in $$props) $$invalidate(7, disabled = $$props.disabled);
    		if ("$$scope" in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		isDeleteKey,
    		createEventDispatcher,
    		type,
    		size,
    		rounded,
    		closable,
    		attached,
    		ellipsis,
    		tabstop,
    		disabled,
    		dispatch,
    		close
    	});

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("size" in $$props) $$invalidate(1, size = $$props.size);
    		if ("rounded" in $$props) $$invalidate(2, rounded = $$props.rounded);
    		if ("closable" in $$props) $$invalidate(3, closable = $$props.closable);
    		if ("attached" in $$props) $$invalidate(4, attached = $$props.attached);
    		if ("ellipsis" in $$props) $$invalidate(5, ellipsis = $$props.ellipsis);
    		if ("tabstop" in $$props) $$invalidate(6, tabstop = $$props.tabstop);
    		if ("disabled" in $$props) $$invalidate(7, disabled = $$props.disabled);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		type,
    		size,
    		rounded,
    		closable,
    		attached,
    		ellipsis,
    		tabstop,
    		disabled,
    		close,
    		$$scope,
    		slots,
    		keyup_handler,
    		keyup_handler_1
    	];
    }

    class Tag extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$k, create_fragment$k, safe_not_equal, {
    			type: 0,
    			size: 1,
    			rounded: 2,
    			closable: 3,
    			attached: 4,
    			ellipsis: 5,
    			tabstop: 6,
    			disabled: 7
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tag",
    			options,
    			id: create_fragment$k.name
    		});
    	}

    	get type() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rounded() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rounded(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closable() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closable(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get attached() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attached(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get ellipsis() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set ellipsis(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get tabstop() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set tabstop(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Tag>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Tag>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelma/src/components/Tag/Taglist.svelte generated by Svelte v3.31.1 */

    const file$k = "node_modules/svelma/src/components/Tag/Taglist.svelte";

    function create_fragment$l(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "tags");
    			toggle_class(div, "has-addons", /*attached*/ ctx[0]);
    			add_location(div, file$k, 8, 0, 147);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 2) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[1], dirty, null, null);
    				}
    			}

    			if (dirty & /*attached*/ 1) {
    				toggle_class(div, "has-addons", /*attached*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$l.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$l($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Taglist", slots, ['default']);
    	let { attached = false } = $$props;
    	const writable_props = ["attached"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Taglist> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("attached" in $$props) $$invalidate(0, attached = $$props.attached);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ attached });

    	$$self.$inject_state = $$props => {
    		if ("attached" in $$props) $$invalidate(0, attached = $$props.attached);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [attached, $$scope, slots];
    }

    class Taglist extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$l, create_fragment$l, safe_not_equal, { attached: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Taglist",
    			options,
    			id: create_fragment$l.name
    		});
    	}

    	get attached() {
    		throw new Error("<Taglist>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set attached(value) {
    		throw new Error("<Taglist>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    // import './scss/main.scss'

    const Svelma = {
      Button,
      Collapse,
      Dialog: Dialog$1,
      Icon,
      Input,
      Field,
      Message,
      Modal,
      Notification,
      Progress,
      Select,
      Snackbar,
      Switch,
      Tabs,
      Tab,
      Tag,
      Taglist,
      Toast,
      Tooltip,
    };

    function chooseAnimation$1(animation) {
      return typeof animation === 'function' ? animation : transitions[animation]
    }

    function isEscKey$1(e) {
      return e.keyCode && e.keyCode === 27
    }

    /* src/components/Modal.svelte generated by Svelte v3.31.1 */
    const file$l = "src/components/Modal.svelte";

    // (40:0) {#if active}
    function create_if_block$d(ctx) {
    	let div3;
    	let div0;
    	let t0;
    	let div2;
    	let t1;
    	let div1;
    	let div2_transition;
    	let t2;
    	let div3_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[11].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[10], null);
    	let if_block = /*showClose*/ ctx[3] && create_if_block_1$9(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			t0 = space();
    			div2 = element("div");
    			if (default_slot) default_slot.c();
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "modal-background");
    			add_location(div0, file$l, 41, 4, 822);
    			attr_dev(div1, "class", "sub-component");
    			add_location(div1, file$l, 44, 6, 1006);
    			attr_dev(div2, "class", "modal-content");
    			add_location(div2, file$l, 42, 4, 880);
    			attr_dev(div3, "class", div3_class_value = "modal " + /*size*/ ctx[2] + " is-active");
    			add_location(div3, file$l, 40, 2, 763);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div3, t0);
    			append_dev(div3, div2);

    			if (default_slot) {
    				default_slot.m(div2, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div3, t2);
    			if (if_block) if_block.m(div3, null);
    			/*div3_binding*/ ctx[12](div3);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*close*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 1024) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[10], dirty, null, null);
    				}
    			}

    			if (/*showClose*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$9(ctx);
    					if_block.c();
    					if_block.m(div3, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (!current || dirty & /*size*/ 4 && div3_class_value !== (div3_class_value = "modal " + /*size*/ ctx[2] + " is-active")) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);

    			if (local) {
    				add_render_callback(() => {
    					if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*_animation*/ ctx[5], /*animProps*/ ctx[1], true);
    					div2_transition.run(1);
    				});
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);

    			if (local) {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, /*_animation*/ ctx[5], /*animProps*/ ctx[1], false);
    				div2_transition.run(0);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if (default_slot) default_slot.d(detaching);
    			if (detaching && div2_transition) div2_transition.end();
    			if (if_block) if_block.d();
    			/*div3_binding*/ ctx[12](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$d.name,
    		type: "if",
    		source: "(40:0) {#if active}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#if showClose}
    function create_if_block_1$9(ctx) {
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			attr_dev(button, "class", "modal-close is-large");
    			attr_dev(button, "aria-label", "close");
    			add_location(button, file$l, 47, 6, 1077);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*close*/ ctx[6], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$9.name,
    		type: "if",
    		source: "(47:4) {#if showClose}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$m(ctx) {
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*active*/ ctx[0] && create_if_block$d(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "keydown", /*keydown*/ ctx[7], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*active*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*active*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$d(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$m.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$m($$self, $$props, $$invalidate) {
    	let _animation;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Modal", slots, ['default']);
    	let { active = true } = $$props;
    	let { animation = "scale" } = $$props;
    	let { animProps = { start: 1.2 } } = $$props;
    	let { size = "" } = $$props;
    	let { showClose = true } = $$props;
    	let { onBody = true } = $$props;
    	let modal;

    	onMount(() => {
    		
    	});

    	function close() {
    		$$invalidate(0, active = false);
    	}

    	function keydown(e) {
    		if (active && isEscKey$1(e)) {
    			close();
    		}
    	}

    	const writable_props = ["active", "animation", "animProps", "size", "showClose", "onBody"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Modal> was created with unknown prop '${key}'`);
    	});

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			modal = $$value;
    			$$invalidate(4, modal);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("animation" in $$props) $$invalidate(8, animation = $$props.animation);
    		if ("animProps" in $$props) $$invalidate(1, animProps = $$props.animProps);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("showClose" in $$props) $$invalidate(3, showClose = $$props.showClose);
    		if ("onBody" in $$props) $$invalidate(9, onBody = $$props.onBody);
    		if ("$$scope" in $$props) $$invalidate(10, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onDestroy,
    		onMount,
    		chooseAnimation: chooseAnimation$1,
    		isEscKey: isEscKey$1,
    		active,
    		animation,
    		animProps,
    		size,
    		showClose,
    		onBody,
    		modal,
    		close,
    		keydown,
    		_animation
    	});

    	$$self.$inject_state = $$props => {
    		if ("active" in $$props) $$invalidate(0, active = $$props.active);
    		if ("animation" in $$props) $$invalidate(8, animation = $$props.animation);
    		if ("animProps" in $$props) $$invalidate(1, animProps = $$props.animProps);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("showClose" in $$props) $$invalidate(3, showClose = $$props.showClose);
    		if ("onBody" in $$props) $$invalidate(9, onBody = $$props.onBody);
    		if ("modal" in $$props) $$invalidate(4, modal = $$props.modal);
    		if ("_animation" in $$props) $$invalidate(5, _animation = $$props._animation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*animation*/ 256) {
    			 $$invalidate(5, _animation = chooseAnimation$1(animation));
    		}

    		if ($$self.$$.dirty & /*modal, active, onBody*/ 529) {
    			 {
    				if (modal && active && onBody) {
    					modal.parentNode.removeChild(modal);
    					document.body.appendChild(modal);
    				}
    			}
    		}
    	};

    	return [
    		active,
    		animProps,
    		size,
    		showClose,
    		modal,
    		_animation,
    		close,
    		keydown,
    		animation,
    		onBody,
    		$$scope,
    		slots,
    		div3_binding
    	];
    }

    class Modal$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$m, create_fragment$m, safe_not_equal, {
    			active: 0,
    			animation: 8,
    			animProps: 1,
    			size: 2,
    			showClose: 3,
    			onBody: 9
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Modal",
    			options,
    			id: create_fragment$m.name
    		});
    	}

    	get active() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set active(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animation() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animation(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get animProps() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set animProps(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showClose() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showClose(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onBody() {
    		throw new Error("<Modal>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBody(value) {
    		throw new Error("<Modal>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/LoginForm.svelte generated by Svelte v3.31.1 */

    const { Object: Object_1$1, console: console_1 } = globals;
    const file$m = "src/LoginForm.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (51:2) {:else}
    function create_else_block$3(ctx) {
    	let h1;
    	let t1;
    	let label0;
    	let t3;
    	let input0;
    	let t4;
    	let label1;
    	let t6;
    	let input1;
    	let t7;
    	let button0;
    	let t8;
    	let button1;
    	let t10;
    	let show_if = Object.keys(/*errors*/ ctx[5]).length > 0;
    	let if_block1_anchor;
    	let mounted;
    	let dispose;

    	function select_block_type_1(ctx, dirty) {
    		if (/*isLoading*/ ctx[3]) return create_if_block_2$6;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = show_if && create_if_block_1$a(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "👤";
    			t1 = space();
    			label0 = element("label");
    			label0.textContent = "Email";
    			t3 = space();
    			input0 = element("input");
    			t4 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t6 = space();
    			input1 = element("input");
    			t7 = space();
    			button0 = element("button");
    			if_block0.c();
    			t8 = space();
    			button1 = element("button");
    			button1.textContent = "Exit 🔒";
    			t10 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			attr_dev(h1, "class", "svelte-xtseyo");
    			add_location(h1, file$m, 51, 4, 1004);
    			attr_dev(label0, "class", "svelte-xtseyo");
    			add_location(label0, file$m, 53, 4, 1021);
    			attr_dev(input0, "name", "email");
    			attr_dev(input0, "placeholder", "name@example.com");
    			attr_dev(input0, "class", "svelte-xtseyo");
    			add_location(input0, file$m, 54, 4, 1046);
    			attr_dev(label1, "class", "svelte-xtseyo");
    			add_location(label1, file$m, 56, 4, 1124);
    			attr_dev(input1, "name", "password");
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "class", "svelte-xtseyo");
    			add_location(input1, file$m, 57, 4, 1152);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "class", "svelte-xtseyo");
    			add_location(button0, file$m, 59, 4, 1221);
    			attr_dev(button1, "class", "svelte-xtseyo");
    			add_location(button1, file$m, 62, 4, 1318);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, label0, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, input0, anchor);
    			set_input_value(input0, /*email*/ ctx[0]);
    			insert_dev(target, t4, anchor);
    			insert_dev(target, label1, anchor);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, input1, anchor);
    			set_input_value(input1, /*password*/ ctx[1]);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, button0, anchor);
    			if_block0.m(button0, null);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t10, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[8]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[9]),
    					listen_dev(button1, "click", /*click_handler*/ ctx[10], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*email*/ 1 && input0.value !== /*email*/ ctx[0]) {
    				set_input_value(input0, /*email*/ ctx[0]);
    			}

    			if (dirty & /*password*/ 2 && input1.value !== /*password*/ ctx[1]) {
    				set_input_value(input1, /*password*/ ctx[1]);
    			}

    			if (current_block_type !== (current_block_type = select_block_type_1(ctx))) {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(button0, null);
    				}
    			}

    			if (dirty & /*errors*/ 32) show_if = Object.keys(/*errors*/ ctx[5]).length > 0;

    			if (show_if) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$a(ctx);
    					if_block1.c();
    					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(label0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(input0);
    			if (detaching) detach_dev(t4);
    			if (detaching) detach_dev(label1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(input1);
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(button0);
    			if_block0.d();
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t10);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(51:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (45:2) {#if isSuccess}
    function create_if_block$e(ctx) {
    	let div;
    	let t0;
    	let br;
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("🔓\n      ");
    			br = element("br");
    			t1 = text("\n      You've been successfully logged in.");
    			add_location(br, file$m, 47, 6, 930);
    			attr_dev(div, "class", "success svelte-xtseyo");
    			add_location(div, file$m, 45, 4, 893);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, br);
    			append_dev(div, t1);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$e.name,
    		type: "if",
    		source: "(45:2) {#if isSuccess}",
    		ctx
    	});

    	return block;
    }

    // (61:34) {:else}
    function create_else_block_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Log in 🔒");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(61:34) {:else}",
    		ctx
    	});

    	return block;
    }

    // (61:6) {#if isLoading}
    function create_if_block_2$6(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Logging in...");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$6.name,
    		type: "if",
    		source: "(61:6) {#if isLoading}",
    		ctx
    	});

    	return block;
    }

    // (67:4) {#if Object.keys(errors).length > 0}
    function create_if_block_1$a(ctx) {
    	let ul;
    	let each_value = Object.keys(/*errors*/ ctx[5]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ul, "class", "errors svelte-xtseyo");
    			add_location(ul, file$m, 67, 6, 1430);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errors, Object*/ 32) {
    				each_value = Object.keys(/*errors*/ ctx[5]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$a.name,
    		type: "if",
    		source: "(67:4) {#if Object.keys(errors).length > 0}",
    		ctx
    	});

    	return block;
    }

    // (69:8) {#each Object.keys(errors) as field}
    function create_each_block$1(ctx) {
    	let li;
    	let t0_value = /*field*/ ctx[11] + "";
    	let t0;
    	let t1;
    	let t2_value = /*errors*/ ctx[5][/*field*/ ctx[11]] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t0 = text(t0_value);
    			t1 = text(": ");
    			t2 = text(t2_value);
    			add_location(li, file$m, 69, 10, 1505);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t0);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errors*/ 32 && t0_value !== (t0_value = /*field*/ ctx[11] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*errors*/ 32 && t2_value !== (t2_value = /*errors*/ ctx[5][/*field*/ ctx[11]] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(69:8) {#each Object.keys(errors) as field}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$n(ctx) {
    	let form;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*isSuccess*/ ctx[4]) return create_if_block$e;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			if_block.c();
    			attr_dev(form, "class", "svelte-xtseyo");
    			add_location(form, file$m, 43, 0, 824);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			if_block.m(form, null);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*handleSubmit*/ ctx[6]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(form, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$n.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$n($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LoginForm", slots, []);
    	let email = "";
    	let password = "";
    	let exit = false;
    	let isLoading = false;
    	let isSuccess = false;
    	let { submit } = $$props;
    	let errors = {};

    	const handleSubmit = () => {
    		$$invalidate(5, errors = {});
    		$$invalidate(7, submit = "exit");
    		console.dir(exit);
    		console.dir(submit);
    		console.dir(Object);

    		//    console.dir(Object.values())
    		if (email.length === 0) {
    			$$invalidate(5, errors.email = "Field should not be empty", errors);
    		}

    		if (password.length === 0) {
    			$$invalidate(5, errors.password = "Field should not be empty", errors);
    		}

    		if (Object.keys(errors).length === 0) {
    			$$invalidate(3, isLoading = true);

    			submit({ email, password }).then(() => {
    				$$invalidate(4, isSuccess = true);
    				$$invalidate(3, isLoading = false);
    			}).catch(err => {
    				$$invalidate(5, errors.server = err, errors);
    				$$invalidate(3, isLoading = false);
    			});
    		}
    	};

    	const writable_props = ["submit"];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<LoginForm> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	function input1_input_handler() {
    		password = this.value;
    		$$invalidate(1, password);
    	}

    	const click_handler = () => {
    		$$invalidate(2, exit = true);
    	};

    	$$self.$$set = $$props => {
    		if ("submit" in $$props) $$invalidate(7, submit = $$props.submit);
    	};

    	$$self.$capture_state = () => ({
    		email,
    		password,
    		exit,
    		isLoading,
    		isSuccess,
    		submit,
    		errors,
    		handleSubmit
    	});

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("password" in $$props) $$invalidate(1, password = $$props.password);
    		if ("exit" in $$props) $$invalidate(2, exit = $$props.exit);
    		if ("isLoading" in $$props) $$invalidate(3, isLoading = $$props.isLoading);
    		if ("isSuccess" in $$props) $$invalidate(4, isSuccess = $$props.isSuccess);
    		if ("submit" in $$props) $$invalidate(7, submit = $$props.submit);
    		if ("errors" in $$props) $$invalidate(5, errors = $$props.errors);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		email,
    		password,
    		exit,
    		isLoading,
    		isSuccess,
    		errors,
    		handleSubmit,
    		submit,
    		input0_input_handler,
    		input1_input_handler,
    		click_handler
    	];
    }

    class LoginForm extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$n, create_fragment$n, safe_not_equal, { submit: 7 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoginForm",
    			options,
    			id: create_fragment$n.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*submit*/ ctx[7] === undefined && !("submit" in props)) {
    			console_1.warn("<LoginForm> was created without expected prop 'submit'");
    		}
    	}

    	get submit() {
    		throw new Error("<LoginForm>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set submit(value) {
    		throw new Error("<LoginForm>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/openiod_login.svelte generated by Svelte v3.31.1 */

    const { console: console_1$1 } = globals;
    const file$n = "src/openiod_login.svelte";

    // (34:2) {#if error_boolean}
    function create_if_block$f(ctx) {
    	let h1;

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "OH NO! AN ERRROR!";
    			add_location(h1, file$n, 34, 4, 992);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$f.name,
    		type: "if",
    		source: "(34:2) {#if error_boolean}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$o(ctx) {
    	let form;
    	let label0;
    	let t1;
    	let input0;
    	let t2;
    	let t3;
    	let label1;
    	let t5;
    	let input1;
    	let t6;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block = /*error_boolean*/ ctx[0] && create_if_block$f(ctx);

    	const block = {
    		c: function create() {
    			form = element("form");
    			label0 = element("label");
    			label0.textContent = "Email";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			label1 = element("label");
    			label1.textContent = "Password";
    			t5 = space();
    			input1 = element("input");
    			t6 = space();
    			button = element("button");
    			button.textContent = "Create account";
    			attr_dev(label0, "for", "email");
    			add_location(label0, file$n, 31, 2, 888);
    			input0.required = true;
    			attr_dev(input0, "type", "email");
    			attr_dev(input0, "id", "email");
    			add_location(input0, file$n, 32, 2, 923);
    			attr_dev(label1, "for", "password");
    			add_location(label1, file$n, 37, 2, 1031);
    			input1.required = true;
    			attr_dev(input1, "type", "password");
    			attr_dev(input1, "id", "password");
    			add_location(input1, file$n, 38, 2, 1072);
    			attr_dev(button, "type", "submit");
    			add_location(button, file$n, 40, 2, 1124);
    			add_location(form, file$n, 25, 0, 720);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, form, anchor);
    			append_dev(form, label0);
    			append_dev(form, t1);
    			append_dev(form, input0);
    			append_dev(form, t2);
    			if (if_block) if_block.m(form, null);
    			append_dev(form, t3);
    			append_dev(form, label1);
    			append_dev(form, t5);
    			append_dev(form, input1);
    			append_dev(form, t6);
    			append_dev(form, button);

    			if (!mounted) {
    				dispose = [
    					listen_dev(form, "submit", prevent_default(handleSubmit), false, true, false),
    					listen_dev(form, "invalid", /*validateMessageEmail*/ ctx[1], false, false, false),
    					listen_dev(form, "changed", /*validateMessageEmail*/ ctx[1], false, false, false),
    					listen_dev(form, "input", /*validateMessageEmail*/ ctx[1], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*error_boolean*/ ctx[0]) {
    				if (if_block) ; else {
    					if_block = create_if_block$f(ctx);
    					if_block.c();
    					if_block.m(form, t3);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(form);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$o.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function handleSubmit(event) {
    	console.log(event);
    	console.log(event.target);
    	console.log(event.target.email.value);
    	console.log(event.target.password.value);
    }

    function instance$o($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Openiod_login", slots, []);
    	let error_boolean = false;

    	function validateMessageEmail(event) {
    		let textbox = event.target;
    		$$invalidate(0, error_boolean = false);

    		if (textbox.value === "") {
    			textbox.setCustomValidity("Required email address");
    		} else if (textbox.validity.typeMismatch) {
    			$$invalidate(0, error_boolean = true);
    			textbox.setCustomValidity("please enter a valid email address");
    		} else {
    			textbox.setCustomValidity("");
    		}

    		return true;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Openiod_login> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		error_boolean,
    		handleSubmit,
    		validateMessageEmail
    	});

    	$$self.$inject_state = $$props => {
    		if ("error_boolean" in $$props) $$invalidate(0, error_boolean = $$props.error_boolean);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [error_boolean, validateMessageEmail];
    }

    class Openiod_login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$o, create_fragment$o, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Openiod_login",
    			options,
    			id: create_fragment$o.name
    		});
    	}
    }

    //export const count = writable(0);

    //export const mainMap = writable(0);

    const unitCrypto = writable({
      algoritm:"aes-256-cbc"
    });

    const LoginStore = writable({
      active:false
      ,loginTime:''
      ,name:'anoniem'
      ,token:''
      ,userId:'anoniem'
      ,loginProcess:false
    });

    const unitStore = writable({
      unitUrl:''
      ,unitId:''
    });

    var bind$1 = function bind(fn, thisArg) {
      return function wrap() {
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; i++) {
          args[i] = arguments[i];
        }
        return fn.apply(thisArg, args);
      };
    };

    /*global toString:true*/

    // utils is a library of generic helper functions non-specific to axios

    var toString = Object.prototype.toString;

    /**
     * Determine if a value is an Array
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Array, otherwise false
     */
    function isArray(val) {
      return toString.call(val) === '[object Array]';
    }

    /**
     * Determine if a value is undefined
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if the value is undefined, otherwise false
     */
    function isUndefined(val) {
      return typeof val === 'undefined';
    }

    /**
     * Determine if a value is a Buffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Buffer, otherwise false
     */
    function isBuffer(val) {
      return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
        && typeof val.constructor.isBuffer === 'function' && val.constructor.isBuffer(val);
    }

    /**
     * Determine if a value is an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an ArrayBuffer, otherwise false
     */
    function isArrayBuffer(val) {
      return toString.call(val) === '[object ArrayBuffer]';
    }

    /**
     * Determine if a value is a FormData
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an FormData, otherwise false
     */
    function isFormData(val) {
      return (typeof FormData !== 'undefined') && (val instanceof FormData);
    }

    /**
     * Determine if a value is a view on an ArrayBuffer
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
     */
    function isArrayBufferView(val) {
      var result;
      if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
        result = ArrayBuffer.isView(val);
      } else {
        result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
      }
      return result;
    }

    /**
     * Determine if a value is a String
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a String, otherwise false
     */
    function isString(val) {
      return typeof val === 'string';
    }

    /**
     * Determine if a value is a Number
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Number, otherwise false
     */
    function isNumber(val) {
      return typeof val === 'number';
    }

    /**
     * Determine if a value is an Object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is an Object, otherwise false
     */
    function isObject(val) {
      return val !== null && typeof val === 'object';
    }

    /**
     * Determine if a value is a plain Object
     *
     * @param {Object} val The value to test
     * @return {boolean} True if value is a plain Object, otherwise false
     */
    function isPlainObject(val) {
      if (toString.call(val) !== '[object Object]') {
        return false;
      }

      var prototype = Object.getPrototypeOf(val);
      return prototype === null || prototype === Object.prototype;
    }

    /**
     * Determine if a value is a Date
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Date, otherwise false
     */
    function isDate(val) {
      return toString.call(val) === '[object Date]';
    }

    /**
     * Determine if a value is a File
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a File, otherwise false
     */
    function isFile(val) {
      return toString.call(val) === '[object File]';
    }

    /**
     * Determine if a value is a Blob
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Blob, otherwise false
     */
    function isBlob(val) {
      return toString.call(val) === '[object Blob]';
    }

    /**
     * Determine if a value is a Function
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Function, otherwise false
     */
    function isFunction(val) {
      return toString.call(val) === '[object Function]';
    }

    /**
     * Determine if a value is a Stream
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a Stream, otherwise false
     */
    function isStream(val) {
      return isObject(val) && isFunction(val.pipe);
    }

    /**
     * Determine if a value is a URLSearchParams object
     *
     * @param {Object} val The value to test
     * @returns {boolean} True if value is a URLSearchParams object, otherwise false
     */
    function isURLSearchParams(val) {
      return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
    }

    /**
     * Trim excess whitespace off the beginning and end of a string
     *
     * @param {String} str The String to trim
     * @returns {String} The String freed of excess whitespace
     */
    function trim(str) {
      return str.replace(/^\s*/, '').replace(/\s*$/, '');
    }

    /**
     * Determine if we're running in a standard browser environment
     *
     * This allows axios to run in a web worker, and react-native.
     * Both environments support XMLHttpRequest, but not fully standard globals.
     *
     * web workers:
     *  typeof window -> undefined
     *  typeof document -> undefined
     *
     * react-native:
     *  navigator.product -> 'ReactNative'
     * nativescript
     *  navigator.product -> 'NativeScript' or 'NS'
     */
    function isStandardBrowserEnv() {
      if (typeof navigator !== 'undefined' && (navigator.product === 'ReactNative' ||
                                               navigator.product === 'NativeScript' ||
                                               navigator.product === 'NS')) {
        return false;
      }
      return (
        typeof window !== 'undefined' &&
        typeof document !== 'undefined'
      );
    }

    /**
     * Iterate over an Array or an Object invoking a function for each item.
     *
     * If `obj` is an Array callback will be called passing
     * the value, index, and complete array for each item.
     *
     * If 'obj' is an Object callback will be called passing
     * the value, key, and complete object for each property.
     *
     * @param {Object|Array} obj The object to iterate
     * @param {Function} fn The callback to invoke for each item
     */
    function forEach(obj, fn) {
      // Don't bother if no value provided
      if (obj === null || typeof obj === 'undefined') {
        return;
      }

      // Force an array if not already something iterable
      if (typeof obj !== 'object') {
        /*eslint no-param-reassign:0*/
        obj = [obj];
      }

      if (isArray(obj)) {
        // Iterate over array values
        for (var i = 0, l = obj.length; i < l; i++) {
          fn.call(null, obj[i], i, obj);
        }
      } else {
        // Iterate over object keys
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fn.call(null, obj[key], key, obj);
          }
        }
      }
    }

    /**
     * Accepts varargs expecting each argument to be an object, then
     * immutably merges the properties of each object and returns result.
     *
     * When multiple objects contain the same key the later object in
     * the arguments list will take precedence.
     *
     * Example:
     *
     * ```js
     * var result = merge({foo: 123}, {foo: 456});
     * console.log(result.foo); // outputs 456
     * ```
     *
     * @param {Object} obj1 Object to merge
     * @returns {Object} Result of all merge properties
     */
    function merge(/* obj1, obj2, obj3, ... */) {
      var result = {};
      function assignValue(val, key) {
        if (isPlainObject(result[key]) && isPlainObject(val)) {
          result[key] = merge(result[key], val);
        } else if (isPlainObject(val)) {
          result[key] = merge({}, val);
        } else if (isArray(val)) {
          result[key] = val.slice();
        } else {
          result[key] = val;
        }
      }

      for (var i = 0, l = arguments.length; i < l; i++) {
        forEach(arguments[i], assignValue);
      }
      return result;
    }

    /**
     * Extends object a by mutably adding to it the properties of object b.
     *
     * @param {Object} a The object to be extended
     * @param {Object} b The object to copy properties from
     * @param {Object} thisArg The object to bind function to
     * @return {Object} The resulting value of object a
     */
    function extend(a, b, thisArg) {
      forEach(b, function assignValue(val, key) {
        if (thisArg && typeof val === 'function') {
          a[key] = bind$1(val, thisArg);
        } else {
          a[key] = val;
        }
      });
      return a;
    }

    /**
     * Remove byte order marker. This catches EF BB BF (the UTF-8 BOM)
     *
     * @param {string} content with BOM
     * @return {string} content value without BOM
     */
    function stripBOM(content) {
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }
      return content;
    }

    var utils = {
      isArray: isArray,
      isArrayBuffer: isArrayBuffer,
      isBuffer: isBuffer,
      isFormData: isFormData,
      isArrayBufferView: isArrayBufferView,
      isString: isString,
      isNumber: isNumber,
      isObject: isObject,
      isPlainObject: isPlainObject,
      isUndefined: isUndefined,
      isDate: isDate,
      isFile: isFile,
      isBlob: isBlob,
      isFunction: isFunction,
      isStream: isStream,
      isURLSearchParams: isURLSearchParams,
      isStandardBrowserEnv: isStandardBrowserEnv,
      forEach: forEach,
      merge: merge,
      extend: extend,
      trim: trim,
      stripBOM: stripBOM
    };

    function encode(val) {
      return encodeURIComponent(val).
        replace(/%3A/gi, ':').
        replace(/%24/g, '$').
        replace(/%2C/gi, ',').
        replace(/%20/g, '+').
        replace(/%5B/gi, '[').
        replace(/%5D/gi, ']');
    }

    /**
     * Build a URL by appending params to the end
     *
     * @param {string} url The base of the url (e.g., http://www.google.com)
     * @param {object} [params] The params to be appended
     * @returns {string} The formatted url
     */
    var buildURL = function buildURL(url, params, paramsSerializer) {
      /*eslint no-param-reassign:0*/
      if (!params) {
        return url;
      }

      var serializedParams;
      if (paramsSerializer) {
        serializedParams = paramsSerializer(params);
      } else if (utils.isURLSearchParams(params)) {
        serializedParams = params.toString();
      } else {
        var parts = [];

        utils.forEach(params, function serialize(val, key) {
          if (val === null || typeof val === 'undefined') {
            return;
          }

          if (utils.isArray(val)) {
            key = key + '[]';
          } else {
            val = [val];
          }

          utils.forEach(val, function parseValue(v) {
            if (utils.isDate(v)) {
              v = v.toISOString();
            } else if (utils.isObject(v)) {
              v = JSON.stringify(v);
            }
            parts.push(encode(key) + '=' + encode(v));
          });
        });

        serializedParams = parts.join('&');
      }

      if (serializedParams) {
        var hashmarkIndex = url.indexOf('#');
        if (hashmarkIndex !== -1) {
          url = url.slice(0, hashmarkIndex);
        }

        url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
      }

      return url;
    };

    function InterceptorManager() {
      this.handlers = [];
    }

    /**
     * Add a new interceptor to the stack
     *
     * @param {Function} fulfilled The function to handle `then` for a `Promise`
     * @param {Function} rejected The function to handle `reject` for a `Promise`
     *
     * @return {Number} An ID used to remove interceptor later
     */
    InterceptorManager.prototype.use = function use(fulfilled, rejected) {
      this.handlers.push({
        fulfilled: fulfilled,
        rejected: rejected
      });
      return this.handlers.length - 1;
    };

    /**
     * Remove an interceptor from the stack
     *
     * @param {Number} id The ID that was returned by `use`
     */
    InterceptorManager.prototype.eject = function eject(id) {
      if (this.handlers[id]) {
        this.handlers[id] = null;
      }
    };

    /**
     * Iterate over all the registered interceptors
     *
     * This method is particularly useful for skipping over any
     * interceptors that may have become `null` calling `eject`.
     *
     * @param {Function} fn The function to call for each interceptor
     */
    InterceptorManager.prototype.forEach = function forEach(fn) {
      utils.forEach(this.handlers, function forEachHandler(h) {
        if (h !== null) {
          fn(h);
        }
      });
    };

    var InterceptorManager_1 = InterceptorManager;

    /**
     * Transform the data for a request or a response
     *
     * @param {Object|String} data The data to be transformed
     * @param {Array} headers The headers for the request or response
     * @param {Array|Function} fns A single function or Array of functions
     * @returns {*} The resulting transformed data
     */
    var transformData = function transformData(data, headers, fns) {
      /*eslint no-param-reassign:0*/
      utils.forEach(fns, function transform(fn) {
        data = fn(data, headers);
      });

      return data;
    };

    var isCancel = function isCancel(value) {
      return !!(value && value.__CANCEL__);
    };

    var normalizeHeaderName = function normalizeHeaderName(headers, normalizedName) {
      utils.forEach(headers, function processHeader(value, name) {
        if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
          headers[normalizedName] = value;
          delete headers[name];
        }
      });
    };

    /**
     * Update an Error with the specified config, error code, and response.
     *
     * @param {Error} error The error to update.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The error.
     */
    var enhanceError = function enhanceError(error, config, code, request, response) {
      error.config = config;
      if (code) {
        error.code = code;
      }

      error.request = request;
      error.response = response;
      error.isAxiosError = true;

      error.toJSON = function toJSON() {
        return {
          // Standard
          message: this.message,
          name: this.name,
          // Microsoft
          description: this.description,
          number: this.number,
          // Mozilla
          fileName: this.fileName,
          lineNumber: this.lineNumber,
          columnNumber: this.columnNumber,
          stack: this.stack,
          // Axios
          config: this.config,
          code: this.code
        };
      };
      return error;
    };

    /**
     * Create an Error with the specified message, config, error code, request and response.
     *
     * @param {string} message The error message.
     * @param {Object} config The config.
     * @param {string} [code] The error code (for example, 'ECONNABORTED').
     * @param {Object} [request] The request.
     * @param {Object} [response] The response.
     * @returns {Error} The created error.
     */
    var createError = function createError(message, config, code, request, response) {
      var error = new Error(message);
      return enhanceError(error, config, code, request, response);
    };

    /**
     * Resolve or reject a Promise based on response status.
     *
     * @param {Function} resolve A function that resolves the promise.
     * @param {Function} reject A function that rejects the promise.
     * @param {object} response The response.
     */
    var settle = function settle(resolve, reject, response) {
      var validateStatus = response.config.validateStatus;
      if (!response.status || !validateStatus || validateStatus(response.status)) {
        resolve(response);
      } else {
        reject(createError(
          'Request failed with status code ' + response.status,
          response.config,
          null,
          response.request,
          response
        ));
      }
    };

    var cookies = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs support document.cookie
        (function standardBrowserEnv() {
          return {
            write: function write(name, value, expires, path, domain, secure) {
              var cookie = [];
              cookie.push(name + '=' + encodeURIComponent(value));

              if (utils.isNumber(expires)) {
                cookie.push('expires=' + new Date(expires).toGMTString());
              }

              if (utils.isString(path)) {
                cookie.push('path=' + path);
              }

              if (utils.isString(domain)) {
                cookie.push('domain=' + domain);
              }

              if (secure === true) {
                cookie.push('secure');
              }

              document.cookie = cookie.join('; ');
            },

            read: function read(name) {
              var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
              return (match ? decodeURIComponent(match[3]) : null);
            },

            remove: function remove(name) {
              this.write(name, '', Date.now() - 86400000);
            }
          };
        })() :

      // Non standard browser env (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return {
            write: function write() {},
            read: function read() { return null; },
            remove: function remove() {}
          };
        })()
    );

    /**
     * Determines whether the specified URL is absolute
     *
     * @param {string} url The URL to test
     * @returns {boolean} True if the specified URL is absolute, otherwise false
     */
    var isAbsoluteURL = function isAbsoluteURL(url) {
      // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
      // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
      // by any combination of letters, digits, plus, period, or hyphen.
      return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
    };

    /**
     * Creates a new URL by combining the specified URLs
     *
     * @param {string} baseURL The base URL
     * @param {string} relativeURL The relative URL
     * @returns {string} The combined URL
     */
    var combineURLs = function combineURLs(baseURL, relativeURL) {
      return relativeURL
        ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
        : baseURL;
    };

    /**
     * Creates a new URL by combining the baseURL with the requestedURL,
     * only when the requestedURL is not already an absolute URL.
     * If the requestURL is absolute, this function returns the requestedURL untouched.
     *
     * @param {string} baseURL The base URL
     * @param {string} requestedURL Absolute or relative URL to combine
     * @returns {string} The combined full path
     */
    var buildFullPath = function buildFullPath(baseURL, requestedURL) {
      if (baseURL && !isAbsoluteURL(requestedURL)) {
        return combineURLs(baseURL, requestedURL);
      }
      return requestedURL;
    };

    // Headers whose duplicates are ignored by node
    // c.f. https://nodejs.org/api/http.html#http_message_headers
    var ignoreDuplicateOf = [
      'age', 'authorization', 'content-length', 'content-type', 'etag',
      'expires', 'from', 'host', 'if-modified-since', 'if-unmodified-since',
      'last-modified', 'location', 'max-forwards', 'proxy-authorization',
      'referer', 'retry-after', 'user-agent'
    ];

    /**
     * Parse headers into an object
     *
     * ```
     * Date: Wed, 27 Aug 2014 08:58:49 GMT
     * Content-Type: application/json
     * Connection: keep-alive
     * Transfer-Encoding: chunked
     * ```
     *
     * @param {String} headers Headers needing to be parsed
     * @returns {Object} Headers parsed into an object
     */
    var parseHeaders = function parseHeaders(headers) {
      var parsed = {};
      var key;
      var val;
      var i;

      if (!headers) { return parsed; }

      utils.forEach(headers.split('\n'), function parser(line) {
        i = line.indexOf(':');
        key = utils.trim(line.substr(0, i)).toLowerCase();
        val = utils.trim(line.substr(i + 1));

        if (key) {
          if (parsed[key] && ignoreDuplicateOf.indexOf(key) >= 0) {
            return;
          }
          if (key === 'set-cookie') {
            parsed[key] = (parsed[key] ? parsed[key] : []).concat([val]);
          } else {
            parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
          }
        }
      });

      return parsed;
    };

    var isURLSameOrigin = (
      utils.isStandardBrowserEnv() ?

      // Standard browser envs have full support of the APIs needed to test
      // whether the request URL is of the same origin as current location.
        (function standardBrowserEnv() {
          var msie = /(msie|trident)/i.test(navigator.userAgent);
          var urlParsingNode = document.createElement('a');
          var originURL;

          /**
        * Parse a URL to discover it's components
        *
        * @param {String} url The URL to be parsed
        * @returns {Object}
        */
          function resolveURL(url) {
            var href = url;

            if (msie) {
            // IE needs attribute set twice to normalize properties
              urlParsingNode.setAttribute('href', href);
              href = urlParsingNode.href;
            }

            urlParsingNode.setAttribute('href', href);

            // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
            return {
              href: urlParsingNode.href,
              protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
              host: urlParsingNode.host,
              search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
              hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
              hostname: urlParsingNode.hostname,
              port: urlParsingNode.port,
              pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
                urlParsingNode.pathname :
                '/' + urlParsingNode.pathname
            };
          }

          originURL = resolveURL(window.location.href);

          /**
        * Determine if a URL shares the same origin as the current location
        *
        * @param {String} requestURL The URL to test
        * @returns {boolean} True if URL shares the same origin, otherwise false
        */
          return function isURLSameOrigin(requestURL) {
            var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
            return (parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host);
          };
        })() :

      // Non standard browser envs (web workers, react-native) lack needed support.
        (function nonStandardBrowserEnv() {
          return function isURLSameOrigin() {
            return true;
          };
        })()
    );

    var xhr = function xhrAdapter(config) {
      return new Promise(function dispatchXhrRequest(resolve, reject) {
        var requestData = config.data;
        var requestHeaders = config.headers;

        if (utils.isFormData(requestData)) {
          delete requestHeaders['Content-Type']; // Let the browser set it
        }

        var request = new XMLHttpRequest();

        // HTTP basic authentication
        if (config.auth) {
          var username = config.auth.username || '';
          var password = config.auth.password ? unescape(encodeURIComponent(config.auth.password)) : '';
          requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
        }

        var fullPath = buildFullPath(config.baseURL, config.url);
        request.open(config.method.toUpperCase(), buildURL(fullPath, config.params, config.paramsSerializer), true);

        // Set the request timeout in MS
        request.timeout = config.timeout;

        // Listen for ready state
        request.onreadystatechange = function handleLoad() {
          if (!request || request.readyState !== 4) {
            return;
          }

          // The request errored out and we didn't get a response, this will be
          // handled by onerror instead
          // With one exception: request that using file: protocol, most browsers
          // will return status as 0 even though it's a successful request
          if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
            return;
          }

          // Prepare the response
          var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
          var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
          var response = {
            data: responseData,
            status: request.status,
            statusText: request.statusText,
            headers: responseHeaders,
            config: config,
            request: request
          };

          settle(resolve, reject, response);

          // Clean up request
          request = null;
        };

        // Handle browser request cancellation (as opposed to a manual cancellation)
        request.onabort = function handleAbort() {
          if (!request) {
            return;
          }

          reject(createError('Request aborted', config, 'ECONNABORTED', request));

          // Clean up request
          request = null;
        };

        // Handle low level network errors
        request.onerror = function handleError() {
          // Real errors are hidden from us by the browser
          // onerror should only fire if it's a network error
          reject(createError('Network Error', config, null, request));

          // Clean up request
          request = null;
        };

        // Handle timeout
        request.ontimeout = function handleTimeout() {
          var timeoutErrorMessage = 'timeout of ' + config.timeout + 'ms exceeded';
          if (config.timeoutErrorMessage) {
            timeoutErrorMessage = config.timeoutErrorMessage;
          }
          reject(createError(timeoutErrorMessage, config, 'ECONNABORTED',
            request));

          // Clean up request
          request = null;
        };

        // Add xsrf header
        // This is only done if running in a standard browser environment.
        // Specifically not if we're in a web worker, or react-native.
        if (utils.isStandardBrowserEnv()) {
          // Add xsrf header
          var xsrfValue = (config.withCredentials || isURLSameOrigin(fullPath)) && config.xsrfCookieName ?
            cookies.read(config.xsrfCookieName) :
            undefined;

          if (xsrfValue) {
            requestHeaders[config.xsrfHeaderName] = xsrfValue;
          }
        }

        // Add headers to the request
        if ('setRequestHeader' in request) {
          utils.forEach(requestHeaders, function setRequestHeader(val, key) {
            if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
              // Remove Content-Type if data is undefined
              delete requestHeaders[key];
            } else {
              // Otherwise add header to the request
              request.setRequestHeader(key, val);
            }
          });
        }

        // Add withCredentials to request if needed
        if (!utils.isUndefined(config.withCredentials)) {
          request.withCredentials = !!config.withCredentials;
        }

        // Add responseType to request if needed
        if (config.responseType) {
          try {
            request.responseType = config.responseType;
          } catch (e) {
            // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
            // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
            if (config.responseType !== 'json') {
              throw e;
            }
          }
        }

        // Handle progress if needed
        if (typeof config.onDownloadProgress === 'function') {
          request.addEventListener('progress', config.onDownloadProgress);
        }

        // Not all browsers support upload events
        if (typeof config.onUploadProgress === 'function' && request.upload) {
          request.upload.addEventListener('progress', config.onUploadProgress);
        }

        if (config.cancelToken) {
          // Handle cancellation
          config.cancelToken.promise.then(function onCanceled(cancel) {
            if (!request) {
              return;
            }

            request.abort();
            reject(cancel);
            // Clean up request
            request = null;
          });
        }

        if (!requestData) {
          requestData = null;
        }

        // Send the request
        request.send(requestData);
      });
    };

    var DEFAULT_CONTENT_TYPE = {
      'Content-Type': 'application/x-www-form-urlencoded'
    };

    function setContentTypeIfUnset(headers, value) {
      if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
        headers['Content-Type'] = value;
      }
    }

    function getDefaultAdapter() {
      var adapter;
      if (typeof XMLHttpRequest !== 'undefined') {
        // For browsers use XHR adapter
        adapter = xhr;
      } else if (typeof process !== 'undefined' && Object.prototype.toString.call(process) === '[object process]') {
        // For node use HTTP adapter
        adapter = xhr;
      }
      return adapter;
    }

    var defaults = {
      adapter: getDefaultAdapter(),

      transformRequest: [function transformRequest(data, headers) {
        normalizeHeaderName(headers, 'Accept');
        normalizeHeaderName(headers, 'Content-Type');
        if (utils.isFormData(data) ||
          utils.isArrayBuffer(data) ||
          utils.isBuffer(data) ||
          utils.isStream(data) ||
          utils.isFile(data) ||
          utils.isBlob(data)
        ) {
          return data;
        }
        if (utils.isArrayBufferView(data)) {
          return data.buffer;
        }
        if (utils.isURLSearchParams(data)) {
          setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
          return data.toString();
        }
        if (utils.isObject(data)) {
          setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
          return JSON.stringify(data);
        }
        return data;
      }],

      transformResponse: [function transformResponse(data) {
        /*eslint no-param-reassign:0*/
        if (typeof data === 'string') {
          try {
            data = JSON.parse(data);
          } catch (e) { /* Ignore */ }
        }
        return data;
      }],

      /**
       * A timeout in milliseconds to abort a request. If set to 0 (default) a
       * timeout is not created.
       */
      timeout: 0,

      xsrfCookieName: 'XSRF-TOKEN',
      xsrfHeaderName: 'X-XSRF-TOKEN',

      maxContentLength: -1,
      maxBodyLength: -1,

      validateStatus: function validateStatus(status) {
        return status >= 200 && status < 300;
      }
    };

    defaults.headers = {
      common: {
        'Accept': 'application/json, text/plain, */*'
      }
    };

    utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
      defaults.headers[method] = {};
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
    });

    var defaults_1 = defaults;

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    function throwIfCancellationRequested(config) {
      if (config.cancelToken) {
        config.cancelToken.throwIfRequested();
      }
    }

    /**
     * Dispatch a request to the server using the configured adapter.
     *
     * @param {object} config The config that is to be used for the request
     * @returns {Promise} The Promise to be fulfilled
     */
    var dispatchRequest = function dispatchRequest(config) {
      throwIfCancellationRequested(config);

      // Ensure headers exist
      config.headers = config.headers || {};

      // Transform request data
      config.data = transformData(
        config.data,
        config.headers,
        config.transformRequest
      );

      // Flatten headers
      config.headers = utils.merge(
        config.headers.common || {},
        config.headers[config.method] || {},
        config.headers
      );

      utils.forEach(
        ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
        function cleanHeaderConfig(method) {
          delete config.headers[method];
        }
      );

      var adapter = config.adapter || defaults_1.adapter;

      return adapter(config).then(function onAdapterResolution(response) {
        throwIfCancellationRequested(config);

        // Transform response data
        response.data = transformData(
          response.data,
          response.headers,
          config.transformResponse
        );

        return response;
      }, function onAdapterRejection(reason) {
        if (!isCancel(reason)) {
          throwIfCancellationRequested(config);

          // Transform response data
          if (reason && reason.response) {
            reason.response.data = transformData(
              reason.response.data,
              reason.response.headers,
              config.transformResponse
            );
          }
        }

        return Promise.reject(reason);
      });
    };

    /**
     * Config-specific merge-function which creates a new config-object
     * by merging two configuration objects together.
     *
     * @param {Object} config1
     * @param {Object} config2
     * @returns {Object} New object resulting from merging config2 to config1
     */
    var mergeConfig = function mergeConfig(config1, config2) {
      // eslint-disable-next-line no-param-reassign
      config2 = config2 || {};
      var config = {};

      var valueFromConfig2Keys = ['url', 'method', 'data'];
      var mergeDeepPropertiesKeys = ['headers', 'auth', 'proxy', 'params'];
      var defaultToConfig2Keys = [
        'baseURL', 'transformRequest', 'transformResponse', 'paramsSerializer',
        'timeout', 'timeoutMessage', 'withCredentials', 'adapter', 'responseType', 'xsrfCookieName',
        'xsrfHeaderName', 'onUploadProgress', 'onDownloadProgress', 'decompress',
        'maxContentLength', 'maxBodyLength', 'maxRedirects', 'transport', 'httpAgent',
        'httpsAgent', 'cancelToken', 'socketPath', 'responseEncoding'
      ];
      var directMergeKeys = ['validateStatus'];

      function getMergedValue(target, source) {
        if (utils.isPlainObject(target) && utils.isPlainObject(source)) {
          return utils.merge(target, source);
        } else if (utils.isPlainObject(source)) {
          return utils.merge({}, source);
        } else if (utils.isArray(source)) {
          return source.slice();
        }
        return source;
      }

      function mergeDeepProperties(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      }

      utils.forEach(valueFromConfig2Keys, function valueFromConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        }
      });

      utils.forEach(mergeDeepPropertiesKeys, mergeDeepProperties);

      utils.forEach(defaultToConfig2Keys, function defaultToConfig2(prop) {
        if (!utils.isUndefined(config2[prop])) {
          config[prop] = getMergedValue(undefined, config2[prop]);
        } else if (!utils.isUndefined(config1[prop])) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      utils.forEach(directMergeKeys, function merge(prop) {
        if (prop in config2) {
          config[prop] = getMergedValue(config1[prop], config2[prop]);
        } else if (prop in config1) {
          config[prop] = getMergedValue(undefined, config1[prop]);
        }
      });

      var axiosKeys = valueFromConfig2Keys
        .concat(mergeDeepPropertiesKeys)
        .concat(defaultToConfig2Keys)
        .concat(directMergeKeys);

      var otherKeys = Object
        .keys(config1)
        .concat(Object.keys(config2))
        .filter(function filterAxiosKeys(key) {
          return axiosKeys.indexOf(key) === -1;
        });

      utils.forEach(otherKeys, mergeDeepProperties);

      return config;
    };

    /**
     * Create a new instance of Axios
     *
     * @param {Object} instanceConfig The default config for the instance
     */
    function Axios(instanceConfig) {
      this.defaults = instanceConfig;
      this.interceptors = {
        request: new InterceptorManager_1(),
        response: new InterceptorManager_1()
      };
    }

    /**
     * Dispatch a request
     *
     * @param {Object} config The config specific for this request (merged with this.defaults)
     */
    Axios.prototype.request = function request(config) {
      /*eslint no-param-reassign:0*/
      // Allow for axios('example/url'[, config]) a la fetch API
      if (typeof config === 'string') {
        config = arguments[1] || {};
        config.url = arguments[0];
      } else {
        config = config || {};
      }

      config = mergeConfig(this.defaults, config);

      // Set config.method
      if (config.method) {
        config.method = config.method.toLowerCase();
      } else if (this.defaults.method) {
        config.method = this.defaults.method.toLowerCase();
      } else {
        config.method = 'get';
      }

      // Hook up interceptors middleware
      var chain = [dispatchRequest, undefined];
      var promise = Promise.resolve(config);

      this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
        chain.unshift(interceptor.fulfilled, interceptor.rejected);
      });

      this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected);
      });

      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift());
      }

      return promise;
    };

    Axios.prototype.getUri = function getUri(config) {
      config = mergeConfig(this.defaults, config);
      return buildURL(config.url, config.params, config.paramsSerializer).replace(/^\?/, '');
    };

    // Provide aliases for supported request methods
    utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: (config || {}).data
        }));
      };
    });

    utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
      /*eslint func-names:0*/
      Axios.prototype[method] = function(url, data, config) {
        return this.request(mergeConfig(config || {}, {
          method: method,
          url: url,
          data: data
        }));
      };
    });

    var Axios_1 = Axios;

    /**
     * A `Cancel` is an object that is thrown when an operation is canceled.
     *
     * @class
     * @param {string=} message The message.
     */
    function Cancel(message) {
      this.message = message;
    }

    Cancel.prototype.toString = function toString() {
      return 'Cancel' + (this.message ? ': ' + this.message : '');
    };

    Cancel.prototype.__CANCEL__ = true;

    var Cancel_1 = Cancel;

    /**
     * A `CancelToken` is an object that can be used to request cancellation of an operation.
     *
     * @class
     * @param {Function} executor The executor function.
     */
    function CancelToken(executor) {
      if (typeof executor !== 'function') {
        throw new TypeError('executor must be a function.');
      }

      var resolvePromise;
      this.promise = new Promise(function promiseExecutor(resolve) {
        resolvePromise = resolve;
      });

      var token = this;
      executor(function cancel(message) {
        if (token.reason) {
          // Cancellation has already been requested
          return;
        }

        token.reason = new Cancel_1(message);
        resolvePromise(token.reason);
      });
    }

    /**
     * Throws a `Cancel` if cancellation has been requested.
     */
    CancelToken.prototype.throwIfRequested = function throwIfRequested() {
      if (this.reason) {
        throw this.reason;
      }
    };

    /**
     * Returns an object that contains a new `CancelToken` and a function that, when called,
     * cancels the `CancelToken`.
     */
    CancelToken.source = function source() {
      var cancel;
      var token = new CancelToken(function executor(c) {
        cancel = c;
      });
      return {
        token: token,
        cancel: cancel
      };
    };

    var CancelToken_1 = CancelToken;

    /**
     * Syntactic sugar for invoking a function and expanding an array for arguments.
     *
     * Common use case would be to use `Function.prototype.apply`.
     *
     *  ```js
     *  function f(x, y, z) {}
     *  var args = [1, 2, 3];
     *  f.apply(null, args);
     *  ```
     *
     * With `spread` this example can be re-written.
     *
     *  ```js
     *  spread(function(x, y, z) {})([1, 2, 3]);
     *  ```
     *
     * @param {Function} callback
     * @returns {Function}
     */
    var spread = function spread(callback) {
      return function wrap(arr) {
        return callback.apply(null, arr);
      };
    };

    /**
     * Determines whether the payload is an error thrown by Axios
     *
     * @param {*} payload The value to test
     * @returns {boolean} True if the payload is an error thrown by Axios, otherwise false
     */
    var isAxiosError = function isAxiosError(payload) {
      return (typeof payload === 'object') && (payload.isAxiosError === true);
    };

    /**
     * Create an instance of Axios
     *
     * @param {Object} defaultConfig The default config for the instance
     * @return {Axios} A new instance of Axios
     */
    function createInstance(defaultConfig) {
      var context = new Axios_1(defaultConfig);
      var instance = bind$1(Axios_1.prototype.request, context);

      // Copy axios.prototype to instance
      utils.extend(instance, Axios_1.prototype, context);

      // Copy context to instance
      utils.extend(instance, context);

      return instance;
    }

    // Create the default instance to be exported
    var axios = createInstance(defaults_1);

    // Expose Axios class to allow class inheritance
    axios.Axios = Axios_1;

    // Factory for creating new instances
    axios.create = function create(instanceConfig) {
      return createInstance(mergeConfig(axios.defaults, instanceConfig));
    };

    // Expose Cancel & CancelToken
    axios.Cancel = Cancel_1;
    axios.CancelToken = CancelToken_1;
    axios.isCancel = isCancel;

    // Expose all/spread
    axios.all = function all(promises) {
      return Promise.all(promises);
    };
    axios.spread = spread;

    // Expose isAxiosError
    axios.isAxiosError = isAxiosError;

    var axios_1 = axios;

    // Allow use of default import syntax in TypeScript
    var _default = axios;
    axios_1.default = _default;

    var axios$1 = axios_1;

    //const crypto = window.crypto.subtle;
    //let publicKeyToExport = {};
    //let privateKeyToStore = {};


    //let inKey='ScapelerApriSensor'
    //let cipher = null
    //let decipher = null
    //let iv=null
    /*
    //const crypto = require('crypto'),
    const createKey = function() {
      let resizedIV = new Buffer.allocUnsafe(16)
      const iv=crypto
      .createHash("sha256")
      .update(new Date().getTime().toString())
      .digest()
      iv.copy(resizedIV);
      const key=crypto.createHash("sha256")
      .update(inKey)
      .digest()
      cipher = crypto.createCipheriv("aes256", key, resizedIV)
      decipher = crypto.createDecipheriv("aes256", key, resizedIV)
    }
    */
    /*
    createKey()
    cipher()
    let txt = 'Scapeler'
    console.log(`text in: ${txt}`)
    let txt2=cipher.update(phrase, "binary", "hex")
    console.log(`text2: ${txt2}`)
    let txt3=decipher.update(txt2, "hex", "binary")
    // cipher.final("hex") <- close with
    console.log(`text3: ${txt3}`)
    */

    /*
    // function called to create a keypair
    const _generateKeypair = () => {
        crypto.generateKey({
            name : 'RSA-OAEP',
            modulusLength : 2048, //can be 1024, 2048, or 4096
            publicExponent : new Uint8Array([0x01, 0x00, 0x01]),
            hash : {name: 'SHA-256'}, //can be "SHA-1", "SHA-256", "SHA-384", or "SHA-512"
        }, true, ['encrypt', 'decrypt']
        ).then((key) => {
            publicKeyToExport = key.publicKey;
            privateKeyToStore = key.privateKey;
            console.log(key);
        }).catch((err) => {
            console.error(err);
        });
    };
    // function to export the generate publicKey
    const _exportPublicKey = (url,config,publicKey) => {
        crypto.exportKey('jwk', publicKey)
            .then((keydata) => {
              var _config=config
              _config.mode='cors'
              _config.data=JSON.stringify(keydata)
              apiRequest("post", url, config);
            })
            .catch((err) => {
                console.log(err);
        });
    };
    */

    const axiosAPI = axios$1.create({
    //  baseURL : "http://localhost:8080/nmcli/api/v1/"
    //  baseURL : "http://10.42.0.1:8080/nmcli/api/v1/"
      baseURL:""
    });

    // implement a method to execute all the request from here.
    const apiRequest = (method, url, config) => {
      const headers = {
          authorization: ""
          ,'Content-Type': 'application/json'
    //      ,'Content-Length': config.data.length
      };
      //console.log(config)
      var configData=config?config.data:null;
      var configTimeout=config?config.timeout:5000;
      if (config!=undefined) {
        //console.dir(config)
        if (config.type=='formData') {
          console.log('formData*********************');
          console.dir(config);
          var formData = new FormData();
          console.log('formData new *********************');
          formData.append('data', config.data);
          console.log('formData append *********************');
    //      headers= formData.getHeaders()
          console.log('formData getHeaders *********************');
          //headers['Content-Type']='multipart/form-data'
          console.log('formData 2 *********************');
          console.log(headers);
          console.dir(configData);
        }
      }

      var axiosConfig={
        method,
        url,
        data:configData,
        headers,
        timeout:configTimeout
      };

    //  if (request!=undefined) headers['Content-Length']=request.length
      //using the axios instance to perform the request that received from each http method
      return axiosAPI(
        axiosConfig
    /*    {
          method,
          url,
          data: config.data,
          headers,
          timeout
        }
      */
    ).then(result => {
          return Promise.resolve(result);
        })
        .catch(error => {
          return Promise.reject(error);
        });
    };

    // function to execute the http get request
    const get = (url, config) => apiRequest("get",url,config);

    // function to execute the http delete request
    const deleteRequest = (url, config) =>  apiRequest("delete", url, config);

    // function to execute the http post request
    const post = (url, config) => apiRequest("post", url, config);

    // function to execute the http put request
    const put = (url, config) => apiRequest("put", url, config);

    // function to execute the http path request
    const patch = (url, config) =>  apiRequest("patch", url, config);

    // function to generate key
    const generateKeypair = () =>  _generateKeypair();

    // function to export public key
    const exportPublicKey = (url,config) =>  _exportPublicKey(url,config,publicKeyToExport);

    // expose your method to other services or actions
    const API ={
        get,
        delete: deleteRequest,
        post,
        put,
        patch,
        generateKeypair,
        exportPublicKey
    };

    function createCommonjsModule(fn, basedir, module) {
    	return module = {
    		path: basedir,
    		exports: {},
    		require: function (path, base) {
    			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
    		}
    	}, fn(module, module.exports), module.exports;
    }

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
    }

    var lzString = createCommonjsModule(function (module) {
    // Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
    // This work is free. You can redistribute it and/or modify it
    // under the terms of the WTFPL, Version 2
    // For more information see LICENSE.txt or http://www.wtfpl.net/
    //
    // For more information, the home page:
    // http://pieroxy.net/blog/pages/lz-string/testing.html
    //
    // LZ-based compression algorithm, version 1.4.4
    var LZString = (function() {

    // private property
    var f = String.fromCharCode;
    var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
    var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
    var baseReverseDic = {};

    function getBaseValue(alphabet, character) {
      if (!baseReverseDic[alphabet]) {
        baseReverseDic[alphabet] = {};
        for (var i=0 ; i<alphabet.length ; i++) {
          baseReverseDic[alphabet][alphabet.charAt(i)] = i;
        }
      }
      return baseReverseDic[alphabet][character];
    }

    var LZString = {
      compressToBase64 : function (input) {
        if (input == null) return "";
        var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
        switch (res.length % 4) { // To produce valid Base64
        default: // When could this happen ?
        case 0 : return res;
        case 1 : return res+"===";
        case 2 : return res+"==";
        case 3 : return res+"=";
        }
      },

      decompressFromBase64 : function (input) {
        if (input == null) return "";
        if (input == "") return null;
        return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
      },

      compressToUTF16 : function (input) {
        if (input == null) return "";
        return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
      },

      decompressFromUTF16: function (compressed) {
        if (compressed == null) return "";
        if (compressed == "") return null;
        return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
      },

      //compress into uint8array (UCS-2 big endian format)
      compressToUint8Array: function (uncompressed) {
        var compressed = LZString.compress(uncompressed);
        var buf=new Uint8Array(compressed.length*2); // 2 bytes per character

        for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
          var current_value = compressed.charCodeAt(i);
          buf[i*2] = current_value >>> 8;
          buf[i*2+1] = current_value % 256;
        }
        return buf;
      },

      //decompress from uint8array (UCS-2 big endian format)
      decompressFromUint8Array:function (compressed) {
        if (compressed===null || compressed===undefined){
            return LZString.decompress(compressed);
        } else {
            var buf=new Array(compressed.length/2); // 2 bytes per character
            for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
              buf[i]=compressed[i*2]*256+compressed[i*2+1];
            }

            var result = [];
            buf.forEach(function (c) {
              result.push(f(c));
            });
            return LZString.decompress(result.join(''));

        }

      },


      //compress into a string that is already URI encoded
      compressToEncodedURIComponent: function (input) {
        if (input == null) return "";
        return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
      },

      //decompress from an output of compressToEncodedURIComponent
      decompressFromEncodedURIComponent:function (input) {
        if (input == null) return "";
        if (input == "") return null;
        input = input.replace(/ /g, "+");
        return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
      },

      compress: function (uncompressed) {
        return LZString._compress(uncompressed, 16, function(a){return f(a);});
      },
      _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
        if (uncompressed == null) return "";
        var i, value,
            context_dictionary= {},
            context_dictionaryToCreate= {},
            context_c="",
            context_wc="",
            context_w="",
            context_enlargeIn= 2, // Compensate for the first entry which should not count
            context_dictSize= 3,
            context_numBits= 2,
            context_data=[],
            context_data_val=0,
            context_data_position=0,
            ii;

        for (ii = 0; ii < uncompressed.length; ii += 1) {
          context_c = uncompressed.charAt(ii);
          if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
            context_dictionary[context_c] = context_dictSize++;
            context_dictionaryToCreate[context_c] = true;
          }

          context_wc = context_w + context_c;
          if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
            context_w = context_wc;
          } else {
            if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
              if (context_w.charCodeAt(0)<256) {
                for (i=0 ; i<context_numBits ; i++) {
                  context_data_val = (context_data_val << 1);
                  if (context_data_position == bitsPerChar-1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                }
                value = context_w.charCodeAt(0);
                for (i=0 ; i<8 ; i++) {
                  context_data_val = (context_data_val << 1) | (value&1);
                  if (context_data_position == bitsPerChar-1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              } else {
                value = 1;
                for (i=0 ; i<context_numBits ; i++) {
                  context_data_val = (context_data_val << 1) | value;
                  if (context_data_position ==bitsPerChar-1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = 0;
                }
                value = context_w.charCodeAt(0);
                for (i=0 ; i<16 ; i++) {
                  context_data_val = (context_data_val << 1) | (value&1);
                  if (context_data_position == bitsPerChar-1) {
                    context_data_position = 0;
                    context_data.push(getCharFromInt(context_data_val));
                    context_data_val = 0;
                  } else {
                    context_data_position++;
                  }
                  value = value >> 1;
                }
              }
              context_enlargeIn--;
              if (context_enlargeIn == 0) {
                context_enlargeIn = Math.pow(2, context_numBits);
                context_numBits++;
              }
              delete context_dictionaryToCreate[context_w];
            } else {
              value = context_dictionary[context_w];
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }


            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            // Add wc to the dictionary.
            context_dictionary[context_wc] = context_dictSize++;
            context_w = String(context_c);
          }
        }

        // Output the code for w.
        if (context_w !== "") {
          if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
            if (context_w.charCodeAt(0)<256) {
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
              }
              value = context_w.charCodeAt(0);
              for (i=0 ; i<8 ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            } else {
              value = 1;
              for (i=0 ; i<context_numBits ; i++) {
                context_data_val = (context_data_val << 1) | value;
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = 0;
              }
              value = context_w.charCodeAt(0);
              for (i=0 ; i<16 ; i++) {
                context_data_val = (context_data_val << 1) | (value&1);
                if (context_data_position == bitsPerChar-1) {
                  context_data_position = 0;
                  context_data.push(getCharFromInt(context_data_val));
                  context_data_val = 0;
                } else {
                  context_data_position++;
                }
                value = value >> 1;
              }
            }
            context_enlargeIn--;
            if (context_enlargeIn == 0) {
              context_enlargeIn = Math.pow(2, context_numBits);
              context_numBits++;
            }
            delete context_dictionaryToCreate[context_w];
          } else {
            value = context_dictionary[context_w];
            for (i=0 ; i<context_numBits ; i++) {
              context_data_val = (context_data_val << 1) | (value&1);
              if (context_data_position == bitsPerChar-1) {
                context_data_position = 0;
                context_data.push(getCharFromInt(context_data_val));
                context_data_val = 0;
              } else {
                context_data_position++;
              }
              value = value >> 1;
            }


          }
          context_enlargeIn--;
          if (context_enlargeIn == 0) {
            context_enlargeIn = Math.pow(2, context_numBits);
            context_numBits++;
          }
        }

        // Mark the end of the stream
        value = 2;
        for (i=0 ; i<context_numBits ; i++) {
          context_data_val = (context_data_val << 1) | (value&1);
          if (context_data_position == bitsPerChar-1) {
            context_data_position = 0;
            context_data.push(getCharFromInt(context_data_val));
            context_data_val = 0;
          } else {
            context_data_position++;
          }
          value = value >> 1;
        }

        // Flush the last char
        while (true) {
          context_data_val = (context_data_val << 1);
          if (context_data_position == bitsPerChar-1) {
            context_data.push(getCharFromInt(context_data_val));
            break;
          }
          else context_data_position++;
        }
        return context_data.join('');
      },

      decompress: function (compressed) {
        if (compressed == null) return "";
        if (compressed == "") return null;
        return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
      },

      _decompress: function (length, resetValue, getNextValue) {
        var dictionary = [],
            next,
            enlargeIn = 4,
            dictSize = 4,
            numBits = 3,
            entry = "",
            result = [],
            i,
            w,
            bits, resb, maxpower, power,
            c,
            data = {val:getNextValue(0), position:resetValue, index:1};

        for (i = 0; i < 3; i += 1) {
          dictionary[i] = i;
        }

        bits = 0;
        maxpower = Math.pow(2,2);
        power=1;
        while (power!=maxpower) {
          resb = data.val & data.position;
          data.position >>= 1;
          if (data.position == 0) {
            data.position = resetValue;
            data.val = getNextValue(data.index++);
          }
          bits |= (resb>0 ? 1 : 0) * power;
          power <<= 1;
        }

        switch (next = bits) {
          case 0:
              bits = 0;
              maxpower = Math.pow(2,8);
              power=1;
              while (power!=maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb>0 ? 1 : 0) * power;
                power <<= 1;
              }
            c = f(bits);
            break;
          case 1:
              bits = 0;
              maxpower = Math.pow(2,16);
              power=1;
              while (power!=maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb>0 ? 1 : 0) * power;
                power <<= 1;
              }
            c = f(bits);
            break;
          case 2:
            return "";
        }
        dictionary[3] = c;
        w = c;
        result.push(c);
        while (true) {
          if (data.index > length) {
            return "";
          }

          bits = 0;
          maxpower = Math.pow(2,numBits);
          power=1;
          while (power!=maxpower) {
            resb = data.val & data.position;
            data.position >>= 1;
            if (data.position == 0) {
              data.position = resetValue;
              data.val = getNextValue(data.index++);
            }
            bits |= (resb>0 ? 1 : 0) * power;
            power <<= 1;
          }

          switch (c = bits) {
            case 0:
              bits = 0;
              maxpower = Math.pow(2,8);
              power=1;
              while (power!=maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb>0 ? 1 : 0) * power;
                power <<= 1;
              }

              dictionary[dictSize++] = f(bits);
              c = dictSize-1;
              enlargeIn--;
              break;
            case 1:
              bits = 0;
              maxpower = Math.pow(2,16);
              power=1;
              while (power!=maxpower) {
                resb = data.val & data.position;
                data.position >>= 1;
                if (data.position == 0) {
                  data.position = resetValue;
                  data.val = getNextValue(data.index++);
                }
                bits |= (resb>0 ? 1 : 0) * power;
                power <<= 1;
              }
              dictionary[dictSize++] = f(bits);
              c = dictSize-1;
              enlargeIn--;
              break;
            case 2:
              return result.join('');
          }

          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }

          if (dictionary[c]) {
            entry = dictionary[c];
          } else {
            if (c === dictSize) {
              entry = w + w.charAt(0);
            } else {
              return null;
            }
          }
          result.push(entry);

          // Add w+entry[0] to the dictionary.
          dictionary[dictSize++] = w + entry.charAt(0);
          enlargeIn--;

          w = entry;

          if (enlargeIn == 0) {
            enlargeIn = Math.pow(2, numBits);
            numBits++;
          }

        }
      }
    };
      return LZString;
    })();

    if(  module != null ) {
      module.exports = LZString;
    } else if( typeof angular !== 'undefined' && angular != null ) {
      angular.module('LZString', [])
      .factory('LZString', function () {
        return LZString;
      });
    }
    });

    // nmcli.js
    //console.dir(window.crypto)
    //console.dir(lzString)

    /*
    function strToArrayBuffer(str) {
      var buf = new ArrayBuffer(str.length * 2);
      var bufView = new Uint16Array(buf);
      for (var i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
      }
      return buf;
    }
    function arrayBufferToString(buf) {
      return String.fromCharCode.apply(null, new Uint16Array(buf));
    }
    var algoKeyGen = {
      //name: unitCrypto.algoritm, //'AES-GCM',
      name: 'AES-GCM',
      length: 256
    };
    var iv = window.crypto.getRandomValues(new Uint8Array(12));
    var algoEncrypt = {
      name: 'AES-GCM',
    //  name: unitCrypto.algoritm, //'AES-GCM',
      //iv: unitCrypto.iv,
      iv: iv,
      tagLength: 128
    };
    var keyUsages = [
      'encrypt',
      'decrypt'
    ];
    //var plainText = 'This is some plaintext';
    //console.log('Plain Text1: ' + plainText);
    //console.log('Plain Text1 iv: ' + unitCrypto.iv);
    var secretKey;
    window.crypto.subtle.generateKey(algoKeyGen, false, keyUsages)
    .then(function (key) {
      secretKey = key;
    })
    .catch (function (err) {
      console.log('Error: ' + err.message);
    });
    */
    /*
      return window.crypto.subtle.encrypt(algoEncrypt, key, strToArrayBuffer(plainText));
    }).then(function (cipherText) {
      console.log('Cipher Tex2t: ' + arrayBufferToString(cipherText));
      return window.crypto.subtle.decrypt(algoEncrypt, secretKey, cipherText);
    }).then(function (plainText) {
      console.log('Plain Text3: ' + arrayBufferToString(plainText));
    }).catch (function (err) {
      console.log('Error: ' + err.message);
    });
    */
    const encrypt= function(data){
      var plainText = JSON.stringify(data);
      var plainText2=lzString.compress(plainText);
          return plainText2
    /*
        .then(function (cipherText) {
          console.log('Cipher Tex2t: ' + arrayBufferToString(cipherText));
          return window.crypto.subtle.decrypt(algoEncrypt, secretKey, cipherText);
        })
        .then(function (plainText) {
          console.log('Plain Text3: ' + arrayBufferToString(plainText));
        })
    */
    //    .catch (function (err) {
    //      console.log('Error: ' + err.message);
    //    });
    };
    /*
    const encrypt= async function(data){
    //	var encrypted = unitCrypto.cipher.update(data,'utf8','hex')
    //	encrypted += unitCrypto.cipher.final('hex')
      console.log('start encrypt')


    //  const cipher = await subtle.encrypt({
    //      name: 'AES-CBC', iv }, key, ec.encode('data'));
    //    const data = await subtle.encrypt({
    //      name: 'AES-CBC', iv }, key, cipher);
      //crypto.createCipheriv()
      let cipher = await crypto.subtle.encrypt({
        name: unitCrypto.algoritm, iv:unitCrypto.iv }, unitCrypto.key, data)
      let encrypted = await crypto.subtle.encrypt({
          name: unitCrypto.algoritm, iv:unitCrypto.iv }, unitCrypto.key, cipher)
    //  .then((result)=>{
        console.log('start encrypt then')
    //  })
    //  .catch((error)=>{
    //    console.log('start encrypt catch')
    //  })
        console.log('encrypt end')
        console.dir(encrypted)
    	return encrypted
    }
    */

    /*
    const decrypt=function(data){
    	console.log(data)
    //	try {
        let decrypted = webcrypto.subtle.encrypt({
          name: unitCrypto.algoritm, iv:unitCrypto.iv }, unitCrypto.key, data);
    //    }
    //    )()
    //		var decrypted = unitCrypto.decipher.update(data,'hex','utf8')
    //		decrypted += unitCrypto.decipher.final('utf8')
    	return decrypted
    }
    */

    console.log(window.location);
    console.log(window.location.hostname);
    console.log(window.location.port);

    const protocol='http://';

    let apiConfig = {
      urlAvahi : protocol+'IDXX.local'
      ,urlHotspot : protocol+'10.42.0.1'
      ,url : protocol+'localhost'
      ,port : '4000'
      ,apiPath:'/nmcli/api/v1'
    };
    if (window.location.port=='8080') apiConfig.port=3999;
    // stable version of API aprisensor-nmcli in case of corrupted apri-sensor
    console.log(apiConfig);

    const setApiConfigUrl=function(url) {
      apiConfig.url=url;
    };
    const getApiConfigUrl=function() {
      return apiConfig.url
    };
    const setApiConfigPort=function(port) {
      apiConfig.port=port;
    };
    const getApiConfigPort=function() {
      return apiConfig.port
    };
    const setApiConfigUrlAvahi=function(url) {
      apiConfig.urlAvahi=url;
    };
    const getApiConfigUrlAvahi=function() {
      return apiConfig.urlAvahi
    };

    // Method to get general nmcli info
    const getNmcliGeneral = async () => {
      return API.get(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/general",{timeout:2900});
    };
    /*
    // Method to get general nmcli info
    export const getNmcliGeneral = async () => {
        try {
          console.log(apiConfig.url)
          console.log(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/general")
          const response = await Api.get(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/general");
          return response;
        } catch (error) {
          return {'error': error}
        }
    };*/
    // Method to get ip Avahi
    const getIpAvahi = () => {
      return API.get(apiConfig.urlAvahi+":"+apiConfig.port+apiConfig.apiPath+"/ip/avahi",{timeout:10000})
    };

    // Method to get nmcli connection info
    const getNmcliConnectionShow = async () => {
        try {
          const response = await API.get(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/connection/show");
          return response;
        } catch (error) {
          return {'error': error}
        }
    };

    // Method to get nmcli activate hotspot
    const getNmcliDeviceHotspot = async () => {
        try {
          const response = await API.get(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/device/hotspot");
          return response;
        } catch (error) {
          return {'error': error}
        }
    };
    // Method to get nmcli wifi list
    const getNmcliDeviceWifiList = () => {
        return API.get(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/device/wifilist"
          ,{timeout:10000})
    };
    // Method to get nmcli wifi list
    const getNmcliDeviceWifiListCache = () => {
        return API.get(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/device/wifilistcache"
          ,{timeout:1000})
    };
    // Method to connect to nmcli wifi device accesspoint
    const postNmcliApConnect = (param) => {
      console.log('postNmcliApConnect');
      console.log(param);
      var data={};
      param.passwd='SCP'+param.passwd;
      if (param.method=='1') {
        //console.log('method 1')
        data=encrypt(param);
      } //else {
        if (param.method=='2') {
          //console.log('method 2')
          data=param;
        }
      //}
      console.log(data);
      return API.post(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/accesspoint/connect",{data: data,type:'formData'})
    };
    // Method to get nmcli connect device
    const postNmcliDeviceConnect = async (connection) => {
      return await API.post(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/device/connect",{data:connection})
    };

    // Method to delete nmcli connection
    const deleteNmcliConnection = async (connection) => {
        try {
    //      var path = "/connection/delete?name="+connection.NAME+"&uuid="+connection.UUID+"&type="+connection.TYPE
          var path = apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/connection/delete";
          console.log(path);
          const response = await API.delete(path,{data:connection});
          console.log(response);
          return response;
        } catch (error) {
          return {'error': error}
        }
    };
    /*
    // Method to get nmcli connect device
    export const postPublicKey = async () => {
      return await Api.exportPublicKey(apiConfig.url+":"+apiConfig.port+apiConfig.apiPath+"/key",{})
    };
    */

    function emailValidator () {
      return function email (value) {
        return (value && !!value.match(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/)) || 'Dit is geen correct e-mailadres'
      }
    }

    function sensorIdValidator () {
      return function sensorId (value) {
        if (value == undefined || value == null || value == '') return true
        return (value && !!value.match(/^([a-zA-Z0-9]){4}$/)) || 'Dit is geen correct sensorId'
      }
    }

    function ipAddressNumValidator () {
      return function ipAddressNum (value) {
        if (value == undefined || value == null || value == '') return true
        return (value && !!value.match(/^((\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.){3}(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/)) || 'Dit IP-adres is incorrect.'
      }
    }

    function requiredValidator () {
      return function required (value) {
        return (value !== undefined && value !== null && value !== '') || 'Dit is een verplicht veld'
      }
    }

    function buildValidator (validators) {
      return function validate (value, dirty) {
        if (!validators || validators.length === 0) {
          return { dirty, valid: true }
        }

        const failing = validators.find(v => v(value) !== true);

        return {
          dirty,
          valid: !failing,
          message: failing && failing(value)
        }
      }
    }

    function createFieldValidator (...validators) {
      const { subscribe, set } = writable({ dirty: false, valid: false, message: null });
      const validator = buildValidator(validators);

      function action (node, binding) {
        function validate (value, dirty) {
          const result = validator(value, dirty);
          set(result);
        }

        validate(binding, false);

        return {
          update (value) {
            validate(value, true);
          }
        }
      }

      return [ { subscribe }, action ]
    }

    /* src/nmcli-general.svelte generated by Svelte v3.31.1 */

    const { console: console_1$2 } = globals;
    const file$o = "src/nmcli-general.svelte";

    // (447:12) {#if $sensorIdValidity.dirty && !$sensorIdValidity.valid}
    function create_if_block_1$b(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$sensorIdValidity*/ ctx[9].message + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("INVALID: ");
    			t1 = text(t1_value);
    			t2 = text(". Voorbeeld: A1B2");
    			attr_dev(span, "class", "validation-hint svelte-89wulk");
    			add_location(span, file$o, 447, 14, 19749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$sensorIdValidity*/ 512 && t1_value !== (t1_value = /*$sensorIdValidity*/ ctx[9].message + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$b.name,
    		type: "if",
    		source: "(447:12) {#if $sensorIdValidity.dirty && !$sensorIdValidity.valid}",
    		ctx
    	});

    	return block;
    }

    // (452:12) {#if $ipAddressNumValidity.dirty && !$ipAddressNumValidity.valid}
    function create_if_block$g(ctx) {
    	let span;
    	let t0;
    	let t1_value = /*$ipAddressNumValidity*/ ctx[10].message + "";
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text("INVALID: ");
    			t1 = text(t1_value);
    			t2 = text(". Voorbeeld: 10.42.0.1");
    			attr_dev(span, "class", "validation-hint svelte-89wulk");
    			add_location(span, file$o, 452, 14, 19982);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*$ipAddressNumValidity*/ 1024 && t1_value !== (t1_value = /*$ipAddressNumValidity*/ ctx[10].message + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$g.name,
    		type: "if",
    		source: "(452:12) {#if $ipAddressNumValidity.dirty && !$ipAddressNumValidity.valid}",
    		ctx
    	});

    	return block;
    }

    // (497:4) <Button class="connectionstatusbutton" type="{connectionStatus}" rounded>
    function create_default_slot$3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Sensorkit");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(497:4) <Button class=\\\"connectionstatusbutton\\\" type=\\\"{connectionStatus}\\\" rounded>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$p(ctx) {
    	let div15;
    	let h10;
    	let t1;
    	let div0;
    	let span0;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let br2;
    	let t4;
    	let i0;
    	let b0;
    	let t6;
    	let i1;
    	let t8;
    	let br3;
    	let br4;
    	let t9;
    	let i2;
    	let b1;
    	let t11;
    	let i3;
    	let t13;
    	let br5;
    	let br6;
    	let t14;
    	let i4;
    	let b2;
    	let t16;
    	let i5;
    	let t18;
    	let h11;
    	let t20;
    	let div1;
    	let span1;
    	let t21;
    	let br7;
    	let t22;
    	let t23;
    	let ol;
    	let li0;
    	let b3;
    	let t25;
    	let br8;
    	let t26;
    	let i6;
    	let t28;
    	let li1;
    	let b4;
    	let t30;
    	let br9;
    	let t31;
    	let i7;
    	let t33;
    	let li2;
    	let b5;
    	let t35;
    	let br10;
    	let t36;
    	let t37;
    	let li3;
    	let b6;
    	let t39;
    	let br11;
    	let t40;
    	let t41;
    	let span2;
    	let b7;
    	let br12;
    	let t43;
    	let t44;
    	let h12;
    	let t46;
    	let div7;
    	let span3;
    	let t47;
    	let br13;
    	let t48;
    	let t49;
    	let div6;
    	let div5;
    	let table0;
    	let thead0;
    	let tr0;
    	let th0;
    	let t51;
    	let th1;
    	let t52;
    	let th2;
    	let t54;
    	let tbody0;
    	let tr1;
    	let td0;
    	let div2;
    	let input0;
    	let sensorIdValidate_action;
    	let t55;
    	let td1;
    	let div3;
    	let t57;
    	let td2;
    	let div4;
    	let input1;
    	let ipAddressNumValidate_action;
    	let t58;
    	let t59;
    	let t60;
    	let div8;
    	let span4;
    	let t61;
    	let b8;
    	let t63;
    	let t64;
    	let div13;
    	let div12;
    	let table1;
    	let thead1;
    	let tr2;
    	let th3;
    	let t66;
    	let th4;
    	let t68;
    	let th5;
    	let t70;
    	let tbody1;
    	let tr3;
    	let td3;
    	let div9;
    	let t71_value = /*unit*/ ctx[1].nmcliGeneral.CONNECTIVITY + "";
    	let t71;
    	let div9_class_value;
    	let t72;
    	let td4;
    	let div10;
    	let t73_value = /*unit*/ ctx[1].nmcliGeneral.STATE + "";
    	let t73;
    	let div10_class_value;
    	let t74;
    	let td5;
    	let div11;
    	let t75_value = /*unit*/ ctx[1].nmcliGeneral.WIFI + "";
    	let t75;
    	let div11_class_value;
    	let t76;
    	let span5;
    	let t77;
    	let t78;
    	let t79;
    	let div14;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$sensorIdValidity*/ ctx[9].dirty && !/*$sensorIdValidity*/ ctx[9].valid && create_if_block_1$b(ctx);
    	let if_block1 = /*$ipAddressNumValidity*/ ctx[10].dirty && !/*$ipAddressNumValidity*/ ctx[10].valid && create_if_block$g(ctx);

    	button = new Button({
    			props: {
    				class: "connectionstatusbutton",
    				type: /*connectionStatus*/ ctx[0],
    				rounded: true,
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			h10 = element("h1");
    			h10.textContent = "1. Verbindt met wifi van sensorkit";
    			t1 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t2 = text("Om de sensorkit te configureren dient u met uw pc, tablet of\n        smartphone verbinding te maken met het wifi-netwerk waar ook de\n        sensorkit toegang toe heeft. Een nieuwe sensorkit kent uw netwerk (nog)\n        niet en zal een eigen wifi-netwerk opstarten met als naam het ID van de\n        sensorkit (zie opmerking AccessPoint). Dit ID staat ook op het kastje van de sensorkit vermeld (combinatie\n        van vier cijfers en letters).");
    			br0 = element("br");
    			t3 = text("\n        Zet de sensorkit aan en wacht totdat dit netwerk in de lijst\n        van wifi-netwerken zichtbaar wordt (20-30 seconden) en maak verbinding.\n        ");
    			br1 = element("br");
    			br2 = element("br");
    			t4 = space();
    			i0 = element("i");
    			b0 = element("b");
    			b0.textContent = "Sensorkit zonder internet:";
    			t6 = space();
    			i1 = element("i");
    			i1.textContent = "Wanneer de sensorkit geschakeld is als AccessPoint (om het configureren\n          mogelijk te maken) heeft het zelf geen aansluiting met het internet.\n          Bij het verbinden met dit wifi-netwerk zal daarover\n          een bericht verschijnen wat genegeerd kan worden.";
    			t8 = space();
    			br3 = element("br");
    			br4 = element("br");
    			t9 = space();
    			i2 = element("i");
    			b1 = element("b");
    			b1.textContent = "Automatisch verbinden uitzetten:";
    			t11 = space();
    			i3 = element("i");
    			i3.textContent = "U heeft uw eigen wifi-netwerk normaal gesproken op \"automatisch verbinden\"\n          staan. Door dit \"automatisch verbinden\" tijdelijk uit te zetten heeft\n          u tijdens het configureren zelf meer controle over wat er gebeurt.";
    			t13 = space();
    			br5 = element("br");
    			br6 = element("br");
    			t14 = space();
    			i4 = element("i");
    			b2 = element("b");
    			b2.textContent = "Omschakelen netwerken duurt even:";
    			t16 = space();
    			i5 = element("i");
    			i5.textContent = "Tijdens het configureren is het omschakelen van wifi-netwerk soms\n          noodzakelijk. Dat omschakelen kan zo'n 10 to 30 seconden duren. Wacht\n          op die momenten daarom even en controleer vervolgens of uw apparaat\n          nog aan het juiste wifi-netwerk is verbonden.";
    			t18 = space();
    			h11 = element("h1");
    			h11.textContent = "2. Open het configuratieformulier";
    			t20 = space();
    			div1 = element("div");
    			span1 = element("span");
    			t21 = text("Het openen van het configuratieformulier (dit formulier) kan op een\n          aantal manieren wat afhankelijk is van het apparaat wat u gebruikt om de\n          sensorkit te configureren.");
    			br7 = element("br");
    			t22 = text("\n          Open uw webbrowser en geef het adres aan zoals hieronder aangegeven bij\n          manier A, B of C.");
    			t23 = space();
    			ol = element("ol");
    			li0 = element("li");
    			b3 = element("b");
    			b3.textContent = "http://<A1B2>.local";
    			t25 = space();
    			br8 = element("br");
    			t26 = space();
    			i6 = element("i");
    			i6.textContent = "(vervang <A1B2> door het ID van de sensorkit)";
    			t28 = space();
    			li1 = element("li");
    			b4 = element("b");
    			b4.textContent = "http://10.42.0.1";
    			t30 = space();
    			br9 = element("br");
    			t31 = space();
    			i7 = element("i");
    			i7.textContent = "(Dit is het IP-adres van de sensorkit als deze als accesspoint is geschakeld.)";
    			t33 = space();
    			li2 = element("li");
    			b5 = element("b");
    			b5.textContent = "http://nm.aprisensor.nl";
    			t35 = space();
    			br10 = element("br");
    			t36 = text("\n              Voor deze manier dient u de link te openen als u nog verbinding\n                heeft met het internet en pas daarna te verbinden met de wifi van\n                de sensorkit");
    			t37 = space();
    			li3 = element("li");
    			b6 = element("b");
    			b6.textContent = "http://<IP-adres van sensorkit>";
    			t39 = space();
    			br11 = element("br");
    			t40 = text("\n              Indien uw sensorkit is geconfigureerd en verbonden met uw wifi-newerk,\n              heeft het een eigen IP-adres van uw netwerk verkregen. Om het\n              configuratieformlier dan te kunnen openen, maakt u verbinding met\n              datzelfde wifi-netwerk en gebruikt u het IP-adres van de sensorkit\n              in de browser.");
    			t41 = space();
    			span2 = element("span");
    			b7 = element("b");
    			b7.textContent = "Manier A:";
    			br12 = element("br");
    			t43 = text("\n          Manier A. (met ID) heeft de voorkeur maar werkt niet op alle apparaten.\n          Probeer dit daarom eerst maar mocht het niet werken kies dan vervolgens manier B.\n          Manier B. werkt met een IP-adres in plaats van het ID van de sensorkit.\n          Kies in dat geval ook voor het vervolg van het configureren voor het IP-adres in plaats\n          van het ID.");
    			t44 = space();
    			h12 = element("h1");
    			h12.textContent = "3. Formulier koppelen aan sensorkit service";
    			t46 = space();
    			div7 = element("div");
    			span3 = element("span");
    			t47 = text("Dit configuratieformulier maakt gebruik van een service welke door\n          de sensorkit wordt aangeboden. Daarvoor moet nog wel aangegeven\n          worden waar deze service te vinden is en dat gebeurt met het ID of met\n          een IP-adres zoals al eerder aangegeven bij punt 2 (manier A of B).");
    			br13 = element("br");
    			t48 = text("\n          In geval manier A is toegepast (met ID) dan zal onderstaande in de\n          meeste gevallen al automatisch gevuld zijn. Is dat niet het geval,\n          vul dan het ID in (manier A) of het IP-adres (manier B).");
    			t49 = space();
    			div6 = element("div");
    			div5 = element("div");
    			table0 = element("table");
    			thead0 = element("thead");
    			tr0 = element("tr");
    			th0 = element("th");
    			th0.textContent = "ID:";
    			t51 = space();
    			th1 = element("th");
    			t52 = space();
    			th2 = element("th");
    			th2.textContent = "IP-adres:";
    			t54 = space();
    			tbody0 = element("tbody");
    			tr1 = element("tr");
    			td0 = element("td");
    			div2 = element("div");
    			input0 = element("input");
    			t55 = space();
    			td1 = element("td");
    			div3 = element("div");
    			div3.textContent = "of";
    			t57 = space();
    			td2 = element("td");
    			div4 = element("div");
    			input1 = element("input");
    			t58 = space();
    			if (if_block0) if_block0.c();
    			t59 = space();
    			if (if_block1) if_block1.c();
    			t60 = space();
    			div8 = element("div");
    			span4 = element("span");
    			t61 = text("Indien de koppeling gelukt is wordt dat hieronder aangegeven met\n          status ");
    			b8 = element("b");
    			b8.textContent = "'Connected'";
    			t63 = text(". Indien 'Not connected', controleer dan\n          of u (nog) op het juiste wifi-netwerk aangesloten bent en of het ID\n          of IP-adres juist zijn.");
    			t64 = space();
    			div13 = element("div");
    			div12 = element("div");
    			table1 = element("table");
    			thead1 = element("thead");
    			tr2 = element("tr");
    			th3 = element("th");
    			th3.textContent = "Connectivity";
    			t66 = space();
    			th4 = element("th");
    			th4.textContent = "Status";
    			t68 = space();
    			th5 = element("th");
    			th5.textContent = "Wifi";
    			t70 = space();
    			tbody1 = element("tbody");
    			tr3 = element("tr");
    			td3 = element("td");
    			div9 = element("div");
    			t71 = text(t71_value);
    			t72 = space();
    			td4 = element("td");
    			div10 = element("div");
    			t73 = text(t73_value);
    			t74 = space();
    			td5 = element("td");
    			div11 = element("div");
    			t75 = text(t75_value);
    			t76 = space();
    			span5 = element("span");
    			t77 = text("Service url: ");
    			t78 = text(/*serviceUrl*/ ctx[4]);
    			t79 = space();
    			div14 = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(h10, "class", "svelte-89wulk");
    			add_location(h10, file$o, 200, 4, 6664);
    			add_location(br0, file$o, 208, 37, 7236);
    			add_location(br1, file$o, 211, 8, 7399);
    			add_location(br2, file$o, 211, 13, 7404);
    			attr_dev(i0, "class", "fas fa-info");
    			add_location(i0, file$o, 212, 8, 7418);
    			add_location(b0, file$o, 212, 35, 7445);
    			add_location(i1, file$o, 213, 8, 7487);
    			add_location(br3, file$o, 217, 8, 7775);
    			add_location(br4, file$o, 217, 13, 7780);
    			attr_dev(i2, "class", "fas fa-info");
    			add_location(i2, file$o, 218, 8, 7794);
    			add_location(b1, file$o, 218, 35, 7821);
    			add_location(i3, file$o, 219, 8, 7869);
    			add_location(br5, file$o, 222, 8, 8116);
    			add_location(br6, file$o, 222, 13, 8121);
    			attr_dev(i4, "class", "fas fa-info");
    			add_location(i4, file$o, 223, 8, 8135);
    			add_location(b2, file$o, 223, 35, 8162);
    			add_location(i5, file$o, 224, 8, 8211);
    			add_location(span0, file$o, 203, 6, 6785);
    			attr_dev(div0, "class", "info-blok svelte-89wulk");
    			add_location(div0, file$o, 202, 4, 6755);
    			attr_dev(h11, "class", "svelte-89wulk");
    			add_location(h11, file$o, 230, 4, 8527);
    			add_location(br7, file$o, 234, 36, 8801);
    			add_location(span1, file$o, 232, 8, 8608);
    			add_location(b3, file$o, 238, 16, 8964);
    			add_location(br8, file$o, 238, 49, 8997);
    			add_location(i6, file$o, 239, 14, 9017);
    			attr_dev(li0, "class", "svelte-89wulk");
    			add_location(li0, file$o, 238, 12, 8960);
    			add_location(b4, file$o, 240, 16, 9098);
    			add_location(br9, file$o, 240, 40, 9122);
    			add_location(i7, file$o, 241, 14, 9142);
    			attr_dev(li1, "class", "svelte-89wulk");
    			add_location(li1, file$o, 240, 12, 9094);
    			add_location(b5, file$o, 242, 16, 9250);
    			add_location(br10, file$o, 242, 47, 9281);
    			attr_dev(li2, "class", "svelte-89wulk");
    			add_location(li2, file$o, 242, 12, 9246);
    			add_location(b6, file$o, 246, 16, 9497);
    			add_location(br11, file$o, 246, 61, 9542);
    			attr_dev(li3, "class", "svelte-89wulk");
    			add_location(li3, file$o, 246, 12, 9493);
    			attr_dev(ol, "type", "A");
    			attr_dev(ol, "class", "svelte-89wulk");
    			add_location(ol, file$o, 237, 10, 8934);
    			add_location(b7, file$o, 253, 14, 9934);
    			add_location(br12, file$o, 253, 30, 9950);
    			add_location(span2, file$o, 253, 8, 9928);
    			attr_dev(div1, "class", "info-blok svelte-89wulk");
    			add_location(div1, file$o, 231, 6, 8576);
    			attr_dev(h12, "class", "svelte-89wulk");
    			add_location(h12, file$o, 288, 4, 11474);
    			add_location(br13, file$o, 293, 77, 11870);
    			add_location(span3, file$o, 290, 8, 11565);
    			add_location(th0, file$o, 302, 18, 12332);
    			add_location(th1, file$o, 303, 18, 12363);
    			add_location(th2, file$o, 304, 18, 12391);
    			add_location(tr0, file$o, 301, 16, 12309);
    			add_location(thead0, file$o, 300, 14, 12285);
    			attr_dev(input0, "placeholder", "ID?");
    			attr_dev(input0, "size", "4");
    			attr_dev(input0, "maxlength", "4");
    			attr_dev(input0, "title", "ID van sensorkit: als combinatie van 4 cijfers of letters");
    			attr_dev(input0, "class", "svelte-89wulk");
    			toggle_class(input0, "field-danger", !/*$sensorIdValidity*/ ctx[9].valid);
    			toggle_class(input0, "field-success", /*$sensorIdValidity*/ ctx[9].valid);
    			add_location(input0, file$o, 311, 22, 12578);
    			attr_dev(div2, "class", "");
    			add_location(div2, file$o, 310, 20, 12541);
    			add_location(td0, file$o, 309, 18, 12516);
    			attr_dev(div3, "class", "");
    			add_location(div3, file$o, 373, 22, 15830);
    			add_location(td1, file$o, 373, 18, 15826);
    			attr_dev(input1, "placeholder", "10.42.0.1");
    			attr_dev(input1, "maxlength", "15");
    			attr_dev(input1, "size", "15");
    			attr_dev(input1, "title", "IP-adres: vier cijfers gescheiden door een punt");
    			attr_dev(input1, "class", "svelte-89wulk");
    			toggle_class(input1, "field-danger", !/*$ipAddressNumValidity*/ ctx[10].valid);
    			toggle_class(input1, "field-success", /*$ipAddressNumValidity*/ ctx[10].valid);
    			add_location(input1, file$o, 376, 22, 15938);
    			attr_dev(div4, "class", "");
    			add_location(div4, file$o, 375, 20, 15901);
    			add_location(td2, file$o, 374, 18, 15876);
    			add_location(tr1, file$o, 308, 16, 12493);
    			add_location(tbody0, file$o, 307, 14, 12469);
    			attr_dev(table0, "class", "table is-striped table is-narrow connectivity svelte-89wulk");
    			add_location(table0, file$o, 299, 12, 12209);
    			attr_dev(div5, "class", "column is-narrow");
    			add_location(div5, file$o, 298, 10, 12166);
    			attr_dev(div6, "class", "columns is-mobile is-centered");
    			add_location(div6, file$o, 297, 8, 12112);
    			attr_dev(div7, "class", "info-blok svelte-89wulk");
    			add_location(div7, file$o, 289, 6, 11533);
    			add_location(b8, file$o, 461, 17, 20303);
    			add_location(span4, file$o, 460, 8, 20215);
    			attr_dev(div8, "class", "info-blok svelte-89wulk");
    			add_location(div8, file$o, 459, 6, 20183);
    			add_location(th3, file$o, 471, 10, 20683);
    			add_location(th4, file$o, 472, 10, 20715);
    			add_location(th5, file$o, 473, 10, 20741);
    			add_location(tr2, file$o, 470, 8, 20668);
    			add_location(thead1, file$o, 469, 6, 20652);
    			attr_dev(div9, "class", div9_class_value = "general connectivity_" + /*unit*/ ctx[1].nmcliGeneral.CONNECTIVITY + " svelte-89wulk");
    			add_location(div9, file$o, 481, 14, 20911);
    			add_location(td3, file$o, 481, 10, 20907);
    			attr_dev(div10, "class", div10_class_value = "general state_" + /*unit*/ ctx[1].nmcliGeneral.STATE + " svelte-89wulk");
    			add_location(div10, file$o, 482, 14, 21036);
    			add_location(td4, file$o, 482, 10, 21032);
    			attr_dev(div11, "class", div11_class_value = "general wifi_" + /*unit*/ ctx[1].nmcliGeneral.WIFI + " svelte-89wulk");
    			add_location(div11, file$o, 483, 14, 21140);
    			add_location(td5, file$o, 483, 10, 21136);
    			add_location(tr3, file$o, 480, 8, 20892);
    			add_location(tbody1, file$o, 479, 6, 20876);
    			attr_dev(table1, "class", "table is-striped table is-narrow connectivity svelte-89wulk");
    			add_location(table1, file$o, 468, 4, 20584);
    			add_location(span5, file$o, 490, 4, 21611);
    			attr_dev(div12, "class", "column is-narrow");
    			add_location(div12, file$o, 467, 6, 20549);
    			attr_dev(div13, "class", "columns is-mobile is-centered");
    			add_location(div13, file$o, 466, 4, 20499);
    			attr_dev(div14, "id", "connectionstatusbutton");
    			attr_dev(div14, "class", "svelte-89wulk");
    			add_location(div14, file$o, 495, 2, 21681);
    			attr_dev(div15, "class", "container");
    			add_location(div15, file$o, 199, 2, 6636);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, h10);
    			append_dev(div15, t1);
    			append_dev(div15, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t2);
    			append_dev(span0, br0);
    			append_dev(span0, t3);
    			append_dev(span0, br1);
    			append_dev(span0, br2);
    			append_dev(span0, t4);
    			append_dev(span0, i0);
    			append_dev(span0, b0);
    			append_dev(span0, t6);
    			append_dev(span0, i1);
    			append_dev(span0, t8);
    			append_dev(span0, br3);
    			append_dev(span0, br4);
    			append_dev(span0, t9);
    			append_dev(span0, i2);
    			append_dev(span0, b1);
    			append_dev(span0, t11);
    			append_dev(span0, i3);
    			append_dev(span0, t13);
    			append_dev(span0, br5);
    			append_dev(span0, br6);
    			append_dev(span0, t14);
    			append_dev(span0, i4);
    			append_dev(span0, b2);
    			append_dev(span0, t16);
    			append_dev(span0, i5);
    			append_dev(div15, t18);
    			append_dev(div15, h11);
    			append_dev(div15, t20);
    			append_dev(div15, div1);
    			append_dev(div1, span1);
    			append_dev(span1, t21);
    			append_dev(span1, br7);
    			append_dev(span1, t22);
    			append_dev(div1, t23);
    			append_dev(div1, ol);
    			append_dev(ol, li0);
    			append_dev(li0, b3);
    			append_dev(li0, t25);
    			append_dev(li0, br8);
    			append_dev(li0, t26);
    			append_dev(li0, i6);
    			append_dev(ol, t28);
    			append_dev(ol, li1);
    			append_dev(li1, b4);
    			append_dev(li1, t30);
    			append_dev(li1, br9);
    			append_dev(li1, t31);
    			append_dev(li1, i7);
    			append_dev(ol, t33);
    			append_dev(ol, li2);
    			append_dev(li2, b5);
    			append_dev(li2, t35);
    			append_dev(li2, br10);
    			append_dev(li2, t36);
    			append_dev(ol, t37);
    			append_dev(ol, li3);
    			append_dev(li3, b6);
    			append_dev(li3, t39);
    			append_dev(li3, br11);
    			append_dev(li3, t40);
    			append_dev(div1, t41);
    			append_dev(div1, span2);
    			append_dev(span2, b7);
    			append_dev(span2, br12);
    			append_dev(span2, t43);
    			append_dev(div15, t44);
    			append_dev(div15, h12);
    			append_dev(div15, t46);
    			append_dev(div15, div7);
    			append_dev(div7, span3);
    			append_dev(span3, t47);
    			append_dev(span3, br13);
    			append_dev(span3, t48);
    			append_dev(div7, t49);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, table0);
    			append_dev(table0, thead0);
    			append_dev(thead0, tr0);
    			append_dev(tr0, th0);
    			append_dev(tr0, t51);
    			append_dev(tr0, th1);
    			append_dev(tr0, t52);
    			append_dev(tr0, th2);
    			append_dev(table0, t54);
    			append_dev(table0, tbody0);
    			append_dev(tbody0, tr1);
    			append_dev(tr1, td0);
    			append_dev(td0, div2);
    			append_dev(div2, input0);
    			/*input0_binding*/ ctx[16](input0);
    			set_input_value(input0, /*sensorId*/ ctx[2]);
    			append_dev(tr1, t55);
    			append_dev(tr1, td1);
    			append_dev(td1, div3);
    			append_dev(tr1, t57);
    			append_dev(tr1, td2);
    			append_dev(td2, div4);
    			append_dev(div4, input1);
    			/*input1_binding*/ ctx[21](input1);
    			set_input_value(input1, /*ipAddress*/ ctx[3]);
    			append_dev(div5, t58);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div5, t59);
    			if (if_block1) if_block1.m(div5, null);
    			append_dev(div15, t60);
    			append_dev(div15, div8);
    			append_dev(div8, span4);
    			append_dev(span4, t61);
    			append_dev(span4, b8);
    			append_dev(span4, t63);
    			append_dev(div15, t64);
    			append_dev(div15, div13);
    			append_dev(div13, div12);
    			append_dev(div12, table1);
    			append_dev(table1, thead1);
    			append_dev(thead1, tr2);
    			append_dev(tr2, th3);
    			append_dev(tr2, t66);
    			append_dev(tr2, th4);
    			append_dev(tr2, t68);
    			append_dev(tr2, th5);
    			append_dev(table1, t70);
    			append_dev(table1, tbody1);
    			append_dev(tbody1, tr3);
    			append_dev(tr3, td3);
    			append_dev(td3, div9);
    			append_dev(div9, t71);
    			append_dev(tr3, t72);
    			append_dev(tr3, td4);
    			append_dev(td4, div10);
    			append_dev(div10, t73);
    			append_dev(tr3, t74);
    			append_dev(tr3, td5);
    			append_dev(td5, div11);
    			append_dev(div11, t75);
    			append_dev(div12, t76);
    			append_dev(div12, span5);
    			append_dev(span5, t77);
    			append_dev(span5, t78);
    			append_dev(div15, t79);
    			append_dev(div15, div14);
    			mount_component(button, div14, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    					action_destroyer(sensorIdValidate_action = /*sensorIdValidate*/ ctx[12].call(null, input0, /*sensorId*/ ctx[2])),
    					listen_dev(input0, "keypress", /*keypress_handler*/ ctx[18], false, false, false),
    					listen_dev(input0, "change", /*change_handler*/ ctx[19], false, false, false),
    					listen_dev(input0, "blur", /*blur_handler*/ ctx[20], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[22]),
    					action_destroyer(ipAddressNumValidate_action = /*ipAddressNumValidate*/ ctx[14].call(null, input1, /*ipAddress*/ ctx[3])),
    					listen_dev(input1, "keypress", /*keypress_handler_1*/ ctx[23], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[24], false, false, false),
    					listen_dev(input1, "blur", /*blur_handler_1*/ ctx[25], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*sensorId*/ 4 && input0.value !== /*sensorId*/ ctx[2]) {
    				set_input_value(input0, /*sensorId*/ ctx[2]);
    			}

    			if (sensorIdValidate_action && is_function(sensorIdValidate_action.update) && dirty[0] & /*sensorId*/ 4) sensorIdValidate_action.update.call(null, /*sensorId*/ ctx[2]);

    			if (dirty[0] & /*$sensorIdValidity*/ 512) {
    				toggle_class(input0, "field-danger", !/*$sensorIdValidity*/ ctx[9].valid);
    			}

    			if (dirty[0] & /*$sensorIdValidity*/ 512) {
    				toggle_class(input0, "field-success", /*$sensorIdValidity*/ ctx[9].valid);
    			}

    			if (dirty[0] & /*ipAddress*/ 8 && input1.value !== /*ipAddress*/ ctx[3]) {
    				set_input_value(input1, /*ipAddress*/ ctx[3]);
    			}

    			if (ipAddressNumValidate_action && is_function(ipAddressNumValidate_action.update) && dirty[0] & /*ipAddress*/ 8) ipAddressNumValidate_action.update.call(null, /*ipAddress*/ ctx[3]);

    			if (dirty[0] & /*$ipAddressNumValidity*/ 1024) {
    				toggle_class(input1, "field-danger", !/*$ipAddressNumValidity*/ ctx[10].valid);
    			}

    			if (dirty[0] & /*$ipAddressNumValidity*/ 1024) {
    				toggle_class(input1, "field-success", /*$ipAddressNumValidity*/ ctx[10].valid);
    			}

    			if (/*$sensorIdValidity*/ ctx[9].dirty && !/*$sensorIdValidity*/ ctx[9].valid) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$b(ctx);
    					if_block0.c();
    					if_block0.m(div5, t59);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*$ipAddressNumValidity*/ ctx[10].dirty && !/*$ipAddressNumValidity*/ ctx[10].valid) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$g(ctx);
    					if_block1.c();
    					if_block1.m(div5, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if ((!current || dirty[0] & /*unit*/ 2) && t71_value !== (t71_value = /*unit*/ ctx[1].nmcliGeneral.CONNECTIVITY + "")) set_data_dev(t71, t71_value);

    			if (!current || dirty[0] & /*unit*/ 2 && div9_class_value !== (div9_class_value = "general connectivity_" + /*unit*/ ctx[1].nmcliGeneral.CONNECTIVITY + " svelte-89wulk")) {
    				attr_dev(div9, "class", div9_class_value);
    			}

    			if ((!current || dirty[0] & /*unit*/ 2) && t73_value !== (t73_value = /*unit*/ ctx[1].nmcliGeneral.STATE + "")) set_data_dev(t73, t73_value);

    			if (!current || dirty[0] & /*unit*/ 2 && div10_class_value !== (div10_class_value = "general state_" + /*unit*/ ctx[1].nmcliGeneral.STATE + " svelte-89wulk")) {
    				attr_dev(div10, "class", div10_class_value);
    			}

    			if ((!current || dirty[0] & /*unit*/ 2) && t75_value !== (t75_value = /*unit*/ ctx[1].nmcliGeneral.WIFI + "")) set_data_dev(t75, t75_value);

    			if (!current || dirty[0] & /*unit*/ 2 && div11_class_value !== (div11_class_value = "general wifi_" + /*unit*/ ctx[1].nmcliGeneral.WIFI + " svelte-89wulk")) {
    				attr_dev(div11, "class", div11_class_value);
    			}

    			if (!current || dirty[0] & /*serviceUrl*/ 16) set_data_dev(t78, /*serviceUrl*/ ctx[4]);
    			const button_changes = {};
    			if (dirty[0] & /*connectionStatus*/ 1) button_changes.type = /*connectionStatus*/ ctx[0];

    			if (dirty[1] & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
    			/*input0_binding*/ ctx[16](null);
    			/*input1_binding*/ ctx[21](null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			destroy_component(button);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$p.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const protocol$1 = "http://";

    function instance$p($$self, $$props, $$invalidate) {
    	let $sensorIdValidity;
    	let $ipAddressNumValidity;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nmcli_general", slots, []);
    	const [sensorIdValidity, sensorIdValidate] = createFieldValidator(sensorIdValidator());
    	validate_store(sensorIdValidity, "sensorIdValidity");
    	component_subscribe($$self, sensorIdValidity, value => $$invalidate(9, $sensorIdValidity = value));
    	const [ipAddressNumValidity, ipAddressNumValidate] = createFieldValidator(ipAddressNumValidator());
    	validate_store(ipAddressNumValidity, "ipAddressNumValidity");
    	component_subscribe($$self, ipAddressNumValidity, value => $$invalidate(10, $ipAddressNumValidity = value));

    	const updateCrypto = function (iv, ivDate) {
    		if (unitCrypto.sensorId != sensorId || iv != unitCrypto.iv) {
    			//console.log('set crypto iv')
    			let t = sensorId + "ScapelerApriSensor" + "                                ";

    			unitCrypto.key = t.substr(0, 32);

    			//    unitCrypto.simpleCrypto = new SimpleCrypto(unitCrypto.key)
    			unitCrypto.iv = iv; //crypto.randomBytes(16);

    			unitCrypto.ivDate = ivDate; //new Date()
    		} //console.log(unitCrypto)
    		//console.dir(crypto)
    	}; //  	unitCrypto.cipher = crypto.createCipheriv(unitCrypto.algoritm, unitCrypto.key, unitCrypto.iv)
    	//  	unitCrypto.decipher = crypto.createDecipheriv(unitCrypto.algoritm, unitCrypto.key, unitCrypto.iv)
    	//    unitCrypto.cipher = crypto.createCipheriv(unitCrypto.algoritm, Buffer.from(unitCrypto.key), unitCrypto.iv)
    	//  	unitCrypto.decipher = crypto.createDecipheriv(unitCrypto.algoritm, Buffer.from(unitCrypto.key), unitCrypto.iv)

    	const nmcliGeneralInit = {
    		"CONNECTIVITY": "?",
    		"STATE": "Not connected",
    		"WIFI": "?",
    		"WIFI-HW": "?",
    		"WWAN": "?",
    		"WWAN-HW": "?"
    	};

    	let nmcliGeneralState = "";
    	let connectionStatus = "is-info";
    	const unit = { nmcliGeneral: nmcliGeneralInit };

    	//let selectedUrlAvahi=''
    	//let ipAddressAvahi='10.42.0.1'
    	//setApiConfigUrl(protocol+ipAddressAvahi)
    	let sensorId = "";

    	let ipAddress = "";
    	let serviceUrl = "";
    	let isGettingAvahi = "";
    	let getAvahiLatest = new Date();
    	let getIpAddressLatest = new Date();
    	let inputRefSensorId;
    	let inputRefIpAddress;

    	const timerGetNmcliGeneral = function () {
    		$$invalidate(4, serviceUrl = getApiConfigUrl());

    		/*
      if (sensorId=='' && unitStore.unitId!='') {
        sensorId=unitStore.unitId
        console.log('x'+sensorId+'x')
        setApiConfigUrlAvahi(protocol+sensorId+'.local')
        //confirm({action:'ipAddressAvahi'})
      }
      console.log()
    */
    		getNmcliGeneral().then(result => {
    			var props;
    			$$invalidate(1, unit.nmcliGeneral = result.data, unit);
    			updateCrypto(unit.nmcliGeneral.iv, unit.nmcliGeneral.ivDate);

    			if (nmcliGeneralState !== unit.nmcliGeneral.STATE) {
    				nmcliGeneralState = unit.nmcliGeneral.STATE;

    				if (nmcliGeneralState.substr(0, 9) == "connected") {
    					$$invalidate(0, connectionStatus = "is-success");

    					props = {
    						type: "is-success",
    						position: "is-bottom-right",
    						icon: true,
    						duration: 3000
    					};

    					Svelma.Notification.create({
    						message: "Er is (weer) verbinding met de sensorkit! ",
    						...props
    					});
    				} else {
    					$$invalidate(0, connectionStatus = "is-danger");

    					props = {
    						type: "is-warning",
    						position: "is-bottom-right",
    						icon: true,
    						duration: 3000
    					};

    					Svelma.Notification.create({
    						message: "Er is geen verbinding met de sensorkit.",
    						...props
    					});
    				}
    			}
    		}).catch(error => {
    			var props;
    			console.log("getNmcliGeneral catch");
    			console.log(error);
    			$$invalidate(0, connectionStatus = "is-danger");

    			if (nmcliGeneralState !== "timeout") {
    				nmcliGeneralState = "timeout";

    				props = {
    					type: "is-danger",
    					position: "is-bottom-right",
    					icon: true,
    					duration: 3000
    				};

    				Svelma.Notification.create({
    					message: "Er is geen verbinding met de sensorkit! ",
    					...props
    				});
    			}

    			$$invalidate(1, unit.nmcliGeneral = nmcliGeneralInit, unit);
    		});
    	};

    	function confirm(param) {
    		switch (param.action) {
    			case "ipAddressAvahi":
    				isGettingAvahi = "is-loading";
    				//postPublicKey()
    				$$invalidate(3, ipAddress = "");
    				setApiConfigUrlAvahi(protocol$1 + sensorId + ".local");
    				getIpAvahi().then(result => {
    					//            console.dir(JSON.parse(result))
    					//            console.dir(result.data)
    					$$invalidate(3, ipAddress = result.data.ipAvahi);

    					setApiConfigUrl(protocol$1 + sensorId + ".local");
    					isGettingAvahi = "";

    					var props = {
    						type: "is-success",
    						position: "is-bottom-right",
    						icon: true,
    						duration: 4000
    					};

    					Svelma.Notification.create({
    						message: "Met ID " + sensorId + " is IP-adres " + ipAddress + " gevonden.",
    						...props
    					});
    				}).catch(error => {
    					//          console.log('getIpAvahi catch')
    					//          console.log(error)
    					isGettingAvahi = "";

    					var props = {
    						type: "is-danger",
    						position: "is-bottom-right",
    						icon: true,
    						duration: 4000
    					};

    					Svelma.Notification.create({
    						message: "Opvragen IP-adres sensorId " + sensorId + " is niet gelukt.",
    						...props
    					});
    				});
    				return;
    			case "useIpAddress":
    				setApiConfigUrl(protocol$1 + ipAddress);
    				return;
    			default:
    				Dialog.confirm("Default action:none").then(thenHandler);
    		}
    	}

    	onMount(async () => {
    		// get nmcli general info when module is activated like status of network
    		console.log("onmount van nmcli-general start");

    		var currentUrl = window.location;
    		unitStore.unitId = "";
    		unitStore.unitUrl = "10.42.0.1";

    		if (currentUrl.hostname.substr(4, 6) == ".local") {
    			unitStore.unitId = currentUrl.hostname.substr(0, 4);
    			$$invalidate(2, sensorId = unitStore.unitId);
    			setApiConfigUrlAvahi(protocol$1 + sensorId + ".local");
    			unitStore.unitUrl = currentUrl.hostname;
    			$$invalidate(4, serviceUrl = currentUrl.hostname);
    			confirm({ action: "ipAddressAvahi" });
    		} else {
    			if (currentUrl.hostname == "localhost" || currentUrl.hostname == "nm.aprisensor.nl") {
    				$$invalidate(3, ipAddress = unitStore.unitUrl);
    				$$invalidate(4, serviceUrl = unitStore.unitUrl);
    				confirm({ action: "useIpAddress" });
    			} else {
    				// currentUrl.hostname!='10.42.0.1' or lokal ip-address
    				unitStore.unitUrl = currentUrl.hostname;

    				$$invalidate(3, ipAddress = currentUrl.hostname);
    				$$invalidate(4, serviceUrl = currentUrl.hostname);
    				confirm({ action: "useIpAddress" });
    			}
    		}

    		console.log("onmount van nmcli-general before timerGetNmcliGeneral");
    		timerGetNmcliGeneral();
    		setInterval(timerGetNmcliGeneral, 3000);
    		console.log("onmount van nmcli-general end");
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<Nmcli_general> was created with unknown prop '${key}'`);
    	});

    	function input0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			inputRefSensorId = $$value;
    			$$invalidate(7, inputRefSensorId);
    		});
    	}

    	function input0_input_handler() {
    		sensorId = this.value;
    		$$invalidate(2, sensorId);
    	}

    	const keypress_handler = e => {
    		var props = {};

    		// no double call
    		if (new Date().getTime() - getAvahiLatest.getTime() < 1000) {
    			return;
    		}

    		$$invalidate(5, getAvahiLatest = new Date());

    		if (e.charCode == 13) {
    			if (sensorId && $sensorIdValidity.valid == true) {
    				props = {
    					type: "is-info",
    					position: "is-bottom-right",
    					icon: true,
    					duration: 4000
    				};

    				Svelma.Notification.create({
    					message: "Met ID " + sensorId + " wordt geprobeerd om een IP-adres op te vragen.",
    					...props
    				});

    				confirm({ action: "ipAddressAvahi" });
    			} else {
    				props = {
    					type: "is-warning",
    					position: "is-bottom-right",
    					icon: true,
    					duration: 4000
    				};

    				Svelma.Notification.create({
    					message: "Het opgegeven ID is niet juist (combinatie vier letter of cijfers)",
    					...props
    				});
    			}
    		}
    	};

    	const change_handler = e => {
    		var props = {};

    		// no double call
    		if (new Date().getTime() - getAvahiLatest.getTime() < 1000) {
    			return;
    		}

    		$$invalidate(5, getAvahiLatest = new Date());

    		if (sensorId && $sensorIdValidity.valid == true) {
    			props = {
    				type: "is-info",
    				position: "is-bottom-right",
    				icon: true,
    				duration: 4000
    			};

    			Svelma.Notification.create({
    				message: "Met ID " + sensorId + " wordt geprobeerd om een IP-adres op te vragen.",
    				...props
    			});

    			confirm({ action: "ipAddressAvahi" });
    		}
    	};

    	const blur_handler = e => {
    		if (sensorId == undefined || sensorId == null || sensorId == "") return;

    		if (sensorId && $sensorIdValidity.valid == false) {
    			inputRefSensorId.focus();
    		}
    	};

    	function input1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			inputRefIpAddress = $$value;
    			$$invalidate(8, inputRefIpAddress);
    		});
    	}

    	function input1_input_handler() {
    		ipAddress = this.value;
    		$$invalidate(3, ipAddress);
    	}

    	const keypress_handler_1 = e => {
    		var props = {};

    		// no double call
    		if (new Date().getTime() - getIpAddressLatest.getTime() < 1000) {
    			return;
    		}

    		$$invalidate(6, getIpAddressLatest = new Date());

    		if (e.charCode == 13) {
    			if (ipAddress && $ipAddressNumValidity.valid == true) {
    				props = {
    					type: "is-info",
    					position: "is-bottom-right",
    					icon: true,
    					duration: 4000
    				};

    				Svelma.Notification.create({
    					message: "Met IP-adress " + ipAddress + " wordt geprobeerd contact te maken met de sensorkit.",
    					...props
    				});

    				confirm({ action: "useIpAddress" });
    			} else {
    				props = {
    					type: "is-warning",
    					position: "is-bottom-right",
    					icon: true,
    					duration: 4000
    				};

    				Svelma.Notification.create({
    					message: "Het opgegeven IP-adres is niet correct (voorbeeld: 10.42.0.1 of 192.168.0.100)",
    					...props
    				});
    			}
    		}
    	};

    	const change_handler_1 = e => {
    		var props = {};

    		// no double call
    		if (new Date().getTime() - getIpAddressLatest.getTime() < 1000) {
    			return;
    		}

    		$$invalidate(6, getIpAddressLatest = new Date());

    		if (ipAddress && $ipAddressNumValidity.valid == true) {
    			props = {
    				type: "is-info",
    				position: "is-bottom-right",
    				icon: true,
    				duration: 4000
    			};

    			Svelma.Notification.create({
    				message: "Met IP-adress " + ipAddress + " wordt geprobeerd contact te maken met de sensorkit.",
    				...props
    			});

    			confirm({ action: "useIpAddress" });
    		} else {
    			props = {
    				type: "is-warning",
    				position: "is-bottom-right",
    				icon: true,
    				duration: 4000
    			};

    			Svelma.Notification.create({
    				message: "Het opgegeven IP-adres is niet correct (voorbeeld: 10.42.0.1 of 192.168.0.100)",
    				...props
    			});
    		}
    	};

    	const blur_handler_1 = e => {
    		if (ipAddress == undefined || ipAddress == null || ipAddress == "") return;

    		if (ipAddress && $ipAddressNumValidity.valid == false) {
    			inputRefIpAddress.focus();
    		}
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		getNmcliGeneral,
    		getIpAvahi,
    		setApiConfigUrlAvahi,
    		setApiConfigUrl,
    		getApiConfigUrl,
    		getApiConfigPort,
    		Svelma,
    		Button,
    		unitCrypto,
    		LoginStore,
    		unitStore,
    		emailValidator,
    		requiredValidator,
    		sensorIdValidator,
    		ipAddressNumValidator,
    		createFieldValidator,
    		sensorIdValidity,
    		sensorIdValidate,
    		ipAddressNumValidity,
    		ipAddressNumValidate,
    		updateCrypto,
    		protocol: protocol$1,
    		nmcliGeneralInit,
    		nmcliGeneralState,
    		connectionStatus,
    		unit,
    		sensorId,
    		ipAddress,
    		serviceUrl,
    		isGettingAvahi,
    		getAvahiLatest,
    		getIpAddressLatest,
    		inputRefSensorId,
    		inputRefIpAddress,
    		timerGetNmcliGeneral,
    		confirm,
    		$sensorIdValidity,
    		$ipAddressNumValidity
    	});

    	$$self.$inject_state = $$props => {
    		if ("nmcliGeneralState" in $$props) nmcliGeneralState = $$props.nmcliGeneralState;
    		if ("connectionStatus" in $$props) $$invalidate(0, connectionStatus = $$props.connectionStatus);
    		if ("sensorId" in $$props) $$invalidate(2, sensorId = $$props.sensorId);
    		if ("ipAddress" in $$props) $$invalidate(3, ipAddress = $$props.ipAddress);
    		if ("serviceUrl" in $$props) $$invalidate(4, serviceUrl = $$props.serviceUrl);
    		if ("isGettingAvahi" in $$props) isGettingAvahi = $$props.isGettingAvahi;
    		if ("getAvahiLatest" in $$props) $$invalidate(5, getAvahiLatest = $$props.getAvahiLatest);
    		if ("getIpAddressLatest" in $$props) $$invalidate(6, getIpAddressLatest = $$props.getIpAddressLatest);
    		if ("inputRefSensorId" in $$props) $$invalidate(7, inputRefSensorId = $$props.inputRefSensorId);
    		if ("inputRefIpAddress" in $$props) $$invalidate(8, inputRefIpAddress = $$props.inputRefIpAddress);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		connectionStatus,
    		unit,
    		sensorId,
    		ipAddress,
    		serviceUrl,
    		getAvahiLatest,
    		getIpAddressLatest,
    		inputRefSensorId,
    		inputRefIpAddress,
    		$sensorIdValidity,
    		$ipAddressNumValidity,
    		sensorIdValidity,
    		sensorIdValidate,
    		ipAddressNumValidity,
    		ipAddressNumValidate,
    		confirm,
    		input0_binding,
    		input0_input_handler,
    		keypress_handler,
    		change_handler,
    		blur_handler,
    		input1_binding,
    		input1_input_handler,
    		keypress_handler_1,
    		change_handler_1,
    		blur_handler_1
    	];
    }

    class Nmcli_general extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$p, create_fragment$p, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nmcli_general",
    			options,
    			id: create_fragment$p.name
    		});
    	}
    }

    /* src/Tooltip.svelte generated by Svelte v3.31.1 */

    const file$p = "src/Tooltip.svelte";

    function create_fragment$q(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*text*/ ctx[0]);
    			add_location(span, file$p, 4, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 1) set_data_dev(t, /*text*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$q.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$q($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tooltip", slots, []);
    	let { text = "wow tooltip" } = $$props;
    	const writable_props = ["text"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tooltip> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ text });

    	$$self.$inject_state = $$props => {
    		if ("text" in $$props) $$invalidate(0, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [text];
    }

    class Tooltip$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$q, create_fragment$q, safe_not_equal, { text: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tooltip",
    			options,
    			id: create_fragment$q.name
    		});
    	}

    	get text() {
    		throw new Error("<Tooltip>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Tooltip>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function tooltip(node, options) {

    	let component;

    	node.addEventListener('mouseover', attachTooltip);
    	node.addEventListener('mouseout', removeTooltip);

    	function attachTooltip() {
    		component = new options.content({
    			target: node,
    			props: { text: options.text }
    		});
    	}

    	function removeTooltip() {
    		component.$destroy();
    	}

    	return {
    		destroy() {
    			node.removeEventListener('mouseover', attachTooltip);
    			node.removeEventListener('mouseout', removeTooltip);
    		}
    	};
    }

    /* node_modules/fa-svelte/src/Icon.svelte generated by Svelte v3.31.1 */

    const file$q = "node_modules/fa-svelte/src/Icon.svelte";

    function create_fragment$r(ctx) {
    	let svg;
    	let path_1;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path_1 = svg_element("path");
    			attr_dev(path_1, "fill", "currentColor");
    			attr_dev(path_1, "d", /*path*/ ctx[0]);
    			add_location(path_1, file$q, 7, 2, 129);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "class", svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-1d15yci"));
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", /*viewBox*/ ctx[2]);
    			add_location(svg, file$q, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path_1);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*path*/ 1) {
    				attr_dev(path_1, "d", /*path*/ ctx[0]);
    			}

    			if (dirty & /*classes*/ 2 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*classes*/ ctx[1]) + " svelte-1d15yci"))) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*viewBox*/ 4) {
    				attr_dev(svg, "viewBox", /*viewBox*/ ctx[2]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$r.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$r($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Icon", slots, []);
    	let { icon } = $$props;
    	let path = [];
    	let classes = "";
    	let viewBox = "";

    	$$self.$$set = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), exclude_internal_props($$new_props)));
    		if ("icon" in $$new_props) $$invalidate(3, icon = $$new_props.icon);
    	};

    	$$self.$capture_state = () => ({ icon, path, classes, viewBox });

    	$$self.$inject_state = $$new_props => {
    		$$invalidate(4, $$props = assign(assign({}, $$props), $$new_props));
    		if ("icon" in $$props) $$invalidate(3, icon = $$new_props.icon);
    		if ("path" in $$props) $$invalidate(0, path = $$new_props.path);
    		if ("classes" in $$props) $$invalidate(1, classes = $$new_props.classes);
    		if ("viewBox" in $$props) $$invalidate(2, viewBox = $$new_props.viewBox);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 8) {
    			 $$invalidate(2, viewBox = "0 0 " + icon.icon[0] + " " + icon.icon[1]);
    		}

    		 $$invalidate(1, classes = "fa-svelte " + ($$props.class ? $$props.class : ""));

    		if ($$self.$$.dirty & /*icon*/ 8) {
    			 $$invalidate(0, path = icon.icon[4]);
    		}
    	};

    	$$props = exclude_internal_props($$props);
    	return [path, classes, viewBox, icon];
    }

    class Icon$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$r, create_fragment$r, safe_not_equal, { icon: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Icon",
    			options,
    			id: create_fragment$r.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[3] === undefined && !("icon" in props)) {
    			console.warn("<Icon> was created without expected prop 'icon'");
    		}
    	}

    	get icon() {
    		throw new Error("<Icon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Icon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var faWindowClose = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'window-close';
    var width = 512;
    var height = 512;
    var ligatures = [];
    var unicode = 'f410';
    var svgPathData = 'M464 32H48C21.5 32 0 53.5 0 80v352c0 26.5 21.5 48 48 48h416c26.5 0 48-21.5 48-48V80c0-26.5-21.5-48-48-48zm-83.6 290.5c4.8 4.8 4.8 12.6 0 17.4l-40.5 40.5c-4.8 4.8-12.6 4.8-17.4 0L256 313.3l-66.5 67.1c-4.8 4.8-12.6 4.8-17.4 0l-40.5-40.5c-4.8-4.8-4.8-12.6 0-17.4l67.1-66.5-67.1-66.5c-4.8-4.8-4.8-12.6 0-17.4l40.5-40.5c4.8-4.8 12.6-4.8 17.4 0l66.5 67.1 66.5-67.1c4.8-4.8 12.6-4.8 17.4 0l40.5 40.5c4.8 4.8 4.8 12.6 0 17.4L313.3 256l67.1 66.5z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faWindowClose = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    var faPlus = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'plus';
    var width = 448;
    var height = 512;
    var ligatures = [];
    var unicode = 'f067';
    var svgPathData = 'M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faPlus = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    var faDoorOpen = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'door-open';
    var width = 640;
    var height = 512;
    var ligatures = [];
    var unicode = 'f52b';
    var svgPathData = 'M624 448h-80V113.45C544 86.19 522.47 64 496 64H384v64h96v384h144c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM312.24 1.01l-192 49.74C105.99 54.44 96 67.7 96 82.92V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h336V33.18c0-21.58-19.56-37.41-39.76-32.17zM264 288c-13.25 0-24-14.33-24-32s10.75-32 24-32 24 14.33 24 32-10.75 32-24 32z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faDoorOpen = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    var faDoorClosed = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'door-closed';
    var width = 640;
    var height = 512;
    var ligatures = [];
    var unicode = 'f52a';
    var svgPathData = 'M624 448H512V50.8C512 22.78 490.47 0 464 0H175.99c-26.47 0-48 22.78-48 50.8V448H16c-8.84 0-16 7.16-16 16v32c0 8.84 7.16 16 16 16h608c8.84 0 16-7.16 16-16v-32c0-8.84-7.16-16-16-16zM415.99 288c-17.67 0-32-14.33-32-32s14.33-32 32-32 32 14.33 32 32c.01 17.67-14.32 32-32 32z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faDoorClosed = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    var faWifi = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'wifi';
    var width = 640;
    var height = 512;
    var ligatures = [];
    var unicode = 'f1eb';
    var svgPathData = 'M634.91 154.88C457.74-8.99 182.19-8.93 5.09 154.88c-6.66 6.16-6.79 16.59-.35 22.98l34.24 33.97c6.14 6.1 16.02 6.23 22.4.38 145.92-133.68 371.3-133.71 517.25 0 6.38 5.85 16.26 5.71 22.4-.38l34.24-33.97c6.43-6.39 6.3-16.82-.36-22.98zM320 352c-35.35 0-64 28.65-64 64s28.65 64 64 64 64-28.65 64-64-28.65-64-64-64zm202.67-83.59c-115.26-101.93-290.21-101.82-405.34 0-6.9 6.1-7.12 16.69-.57 23.15l34.44 33.99c6 5.92 15.66 6.32 22.05.8 83.95-72.57 209.74-72.41 293.49 0 6.39 5.52 16.05 5.13 22.05-.8l34.44-33.99c6.56-6.46 6.33-17.06-.56-23.15z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faWifi = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    var faCheck = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'check';
    var width = 512;
    var height = 512;
    var ligatures = [];
    var unicode = 'f00c';
    var svgPathData = 'M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faCheck = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    var faInfo = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, '__esModule', { value: true });
    var prefix = 'fas';
    var iconName = 'info';
    var width = 192;
    var height = 512;
    var ligatures = [];
    var unicode = 'f129';
    var svgPathData = 'M20 424.229h20V279.771H20c-11.046 0-20-8.954-20-20V212c0-11.046 8.954-20 20-20h112c11.046 0 20 8.954 20 20v212.229h20c11.046 0 20 8.954 20 20V492c0 11.046-8.954 20-20 20H20c-11.046 0-20-8.954-20-20v-47.771c0-11.046 8.954-20 20-20zM96 0C56.235 0 24 32.235 24 72s32.235 72 72 72 72-32.235 72-72S135.764 0 96 0z';

    exports.definition = {
      prefix: prefix,
      iconName: iconName,
      icon: [
        width,
        height,
        ligatures,
        unicode,
        svgPathData
      ]};

    exports.faInfo = exports.definition;
    exports.prefix = prefix;
    exports.iconName = iconName;
    exports.width = width;
    exports.height = height;
    exports.ligatures = ligatures;
    exports.unicode = unicode;
    exports.svgPathData = svgPathData;
    });

    /* src/nmcli-connection-show.svelte generated by Svelte v3.31.1 */

    const { console: console_1$3 } = globals;
    const file$r = "src/nmcli-connection-show.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[37] = list[i];
    	child_ctx[38] = list;
    	child_ctx[39] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[40] = list[i];
    	child_ctx[39] = i;
    	return child_ctx;
    }

    // (282:2) {#if unit.nmcliConnections !=undefined }
    function create_if_block_2$7(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_3$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*unit*/ ctx[1].nmcliConnections.error != undefined) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$7.name,
    		type: "if",
    		source: "(282:2) {#if unit.nmcliConnections !=undefined }",
    		ctx
    	});

    	return block;
    }

    // (285:4) {:else}
    function create_else_block$4(ctx) {
    	let div1;
    	let div0;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t1;
    	let th1;
    	let t3;
    	let th2;
    	let t4;
    	let tbody;
    	let current;
    	let each_value_1 = /*unit*/ ctx[1].nmcliConnections;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Name";
    			t1 = space();
    			th1 = element("th");
    			th1.textContent = "Device";
    			t3 = space();
    			th2 = element("th");
    			t4 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(th0, file$r, 290, 12, 9262);
    			add_location(th1, file$r, 291, 12, 9288);
    			add_location(th2, file$r, 292, 12, 9316);
    			add_location(tr, file$r, 289, 10, 9245);
    			add_location(thead, file$r, 288, 8, 9227);
    			add_location(tbody, file$r, 295, 8, 9367);
    			attr_dev(table, "class", "table is-striped is-narrow svelte-ikylq0");
    			add_location(table, file$r, 287, 6, 9176);
    			attr_dev(div0, "class", "column is-narrow");
    			add_location(div0, file$r, 286, 6, 9139);
    			attr_dev(div1, "class", "columns is-mobile is-centered");
    			add_location(div1, file$r, 285, 4, 9089);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t1);
    			append_dev(tr, th1);
    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(table, t4);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*confirm, unit, iconFaWindowClose, iconFaWifi, iconFaCheck*/ 36098) {
    				each_value_1 = /*unit*/ ctx[1].nmcliConnections;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(285:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (283:4) {#if unit.nmcliConnections.error !=undefined }
    function create_if_block_3$5(ctx) {
    	let div;
    	let t0;
    	let t1_value = /*unit*/ ctx[1].nmcliConnections.error.message + "";
    	let t1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text("ERROR: ");
    			t1 = text(t1_value);
    			attr_dev(div, "class", "general error svelte-ikylq0");
    			add_location(div, file$r, 283, 6, 8994);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*unit*/ 2 && t1_value !== (t1_value = /*unit*/ ctx[1].nmcliConnections.error.message + "")) set_data_dev(t1, t1_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$5.name,
    		type: "if",
    		source: "(283:4) {#if unit.nmcliConnections.error !=undefined }",
    		ctx
    	});

    	return block;
    }

    // (298:10) {#if connection.TYPE =='wifi' }
    function create_if_block_4$3(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*connection*/ ctx[40].NAME + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*connection*/ ctx[40].DEVICE + "";
    	let t2;
    	let t3;
    	let td2;
    	let span0;
    	let current_block_type_index;
    	let if_block;
    	let span0_todo_use_tooltip_value;
    	let t4;
    	let span1;
    	let icon;
    	let t5;
    	let td3;
    	let t6;
    	let current;
    	let mounted;
    	let dispose;
    	const if_block_creators = [create_if_block_5$1, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (/*connection*/ ctx[40].DEVICE == "--") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*connection*/ ctx[40]);
    	}

    	icon = new Icon$1({
    			props: { icon: /*iconFaWindowClose*/ ctx[8] },
    			$$inline: true
    		});

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[18](/*connection*/ ctx[40]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			span0 = element("span");
    			if_block.c();
    			t4 = space();
    			span1 = element("span");
    			create_component(icon.$$.fragment);
    			t5 = space();
    			td3 = element("td");
    			t6 = space();
    			add_location(td0, file$r, 299, 14, 9506);
    			add_location(td1, file$r, 300, 14, 9547);
    			set_style(span0, "font-size", "2em");
    			set_style(span0, "color", "#3298dc");
    			attr_dev(span0, "todo_use:tooltip", span0_todo_use_tooltip_value = { content: Tooltip$1, text: "Connect" });
    			attr_dev(span0, "aria-label", "Open");
    			add_location(span0, file$r, 302, 17, 9612);
    			set_style(span1, "font-size", "2em");
    			set_style(span1, "color", "red");
    			attr_dev(span1, "tooltip", "Delete");
    			attr_dev(span1, "aria-label", "Delete");
    			add_location(span1, file$r, 313, 17, 10145);
    			add_location(td2, file$r, 301, 14, 9590);
    			add_location(td3, file$r, 324, 14, 10702);
    			add_location(tr, file$r, 298, 12, 9487);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, span0);
    			if_blocks[current_block_type_index].m(span0, null);
    			append_dev(td2, t4);
    			append_dev(td2, span1);
    			mount_component(icon, span1, null);
    			append_dev(td2, t5);
    			append_dev(tr, td3);
    			append_dev(tr, t6);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span0, "click", click_handler_1, false, false, false),
    					listen_dev(span1, "click", click_handler_2, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*unit*/ 2) && t0_value !== (t0_value = /*connection*/ ctx[40].NAME + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*unit*/ 2) && t2_value !== (t2_value = /*connection*/ ctx[40].DEVICE + "")) set_data_dev(t2, t2_value);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(span0, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if_blocks[current_block_type_index].d();
    			destroy_component(icon);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$3.name,
    		type: "if",
    		source: "(298:10) {#if connection.TYPE =='wifi' }",
    		ctx
    	});

    	return block;
    }

    // (310:21) {:else}
    function create_else_block_1$1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon$1({
    			props: { icon: /*iconFaCheck*/ ctx[11] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(310:21) {:else}",
    		ctx
    	});

    	return block;
    }

    // (308:20) {#if connection.DEVICE=='--'}
    function create_if_block_5$1(ctx) {
    	let icon;
    	let current;

    	icon = new Icon$1({
    			props: { icon: /*iconFaWifi*/ ctx[10] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(icon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(icon, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(icon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(308:20) {#if connection.DEVICE=='--'}",
    		ctx
    	});

    	return block;
    }

    // (297:10) {#each unit.nmcliConnections as connection , i}
    function create_each_block_1(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*connection*/ ctx[40].TYPE == "wifi" && create_if_block_4$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*connection*/ ctx[40].TYPE == "wifi") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*unit*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_4$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(297:10) {#each unit.nmcliConnections as connection , i}",
    		ctx
    	});

    	return block;
    }

    // (390:10) {#if accessPoint.CHAN<14000}
    function create_if_block$h(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*accessPoint*/ ctx[37].SSID != "--" && create_if_block_1$c(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*accessPoint*/ ctx[37].SSID != "--") {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*wifiListArray*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$c(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$h.name,
    		type: "if",
    		source: "(390:10) {#if accessPoint.CHAN<14000}",
    		ctx
    	});

    	return block;
    }

    // (391:10) {#if accessPoint.SSID!='--'}
    function create_if_block_1$c(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*accessPoint*/ ctx[37].SSID + "";
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*accessPoint*/ ctx[37].CHAN + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*accessPoint*/ ctx[37].SIGNAL + "";
    	let t4;
    	let t5;
    	let td3;
    	let input;
    	let t6;
    	let td4;
    	let button0;
    	let icon0;
    	let button0_class_value;
    	let t7;
    	let button1;
    	let icon1;
    	let button1_class_value;
    	let t8;
    	let current;
    	let mounted;
    	let dispose;

    	function input_input_handler() {
    		/*input_input_handler*/ ctx[19].call(input, /*each_value*/ ctx[38], /*i*/ ctx[39]);
    	}

    	icon0 = new Icon$1({
    			props: { icon: /*iconFaPlus*/ ctx[9] },
    			$$inline: true
    		});

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[20](/*accessPoint*/ ctx[37]);
    	}

    	icon1 = new Icon$1({
    			props: { icon: /*iconFaPlus*/ ctx[9] },
    			$$inline: true
    		});

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[21](/*accessPoint*/ ctx[37]);
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			input = element("input");
    			t6 = space();
    			td4 = element("td");
    			button0 = element("button");
    			create_component(icon0.$$.fragment);
    			t7 = space();
    			button1 = element("button");
    			create_component(icon1.$$.fragment);
    			t8 = space();
    			attr_dev(td0, "class", "tdssid svelte-ikylq0");
    			add_location(td0, file$r, 392, 14, 12865);
    			add_location(td1, file$r, 394, 14, 12974);
    			add_location(td2, file$r, 396, 14, 13063);
    			attr_dev(input, "class", "password svelte-ikylq0");
    			attr_dev(input, "name", "Wachtwoord");
    			attr_dev(input, "xtype", "password");
    			attr_dev(input, "autocapitalize", "off");
    			attr_dev(input, "placeholder", "Wifi wachtwoord");
    			add_location(input, file$r, 400, 17, 13225);
    			add_location(td3, file$r, 399, 18, 13203);
    			attr_dev(button0, "name", "m1");
    			attr_dev(button0, "class", button0_class_value = "button is-primary " + /*isConnectingAP*/ ctx[3] + " svelte-ikylq0");
    			attr_dev(button0, "aria-label", "Add connection");
    			add_location(button0, file$r, 404, 16, 13443);
    			attr_dev(button1, "name", "m2");
    			attr_dev(button1, "class", button1_class_value = "button is-info " + /*isConnectingAP*/ ctx[3] + " svelte-ikylq0");
    			attr_dev(button1, "aria-label", "Add connection");
    			add_location(button1, file$r, 409, 15, 13810);
    			add_location(td4, file$r, 403, 14, 13422);
    			add_location(tr, file$r, 391, 12, 12846);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, input);
    			set_input_value(input, /*accessPoint*/ ctx[37].password);
    			append_dev(tr, t6);
    			append_dev(tr, td4);
    			append_dev(td4, button0);
    			mount_component(icon0, button0, null);
    			append_dev(td4, t7);
    			append_dev(td4, button1);
    			mount_component(icon1, button1, null);
    			append_dev(tr, t8);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", input_input_handler),
    					listen_dev(button0, "click", stop_propagation(prevent_default(click_handler_3)), false, true, true),
    					listen_dev(button1, "click", stop_propagation(prevent_default(click_handler_4)), false, true, true)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty[0] & /*wifiListArray*/ 4) && t0_value !== (t0_value = /*accessPoint*/ ctx[37].SSID + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty[0] & /*wifiListArray*/ 4) && t2_value !== (t2_value = /*accessPoint*/ ctx[37].CHAN + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty[0] & /*wifiListArray*/ 4) && t4_value !== (t4_value = /*accessPoint*/ ctx[37].SIGNAL + "")) set_data_dev(t4, t4_value);

    			if (dirty[0] & /*wifiListArray*/ 4 && input.value !== /*accessPoint*/ ctx[37].password) {
    				set_input_value(input, /*accessPoint*/ ctx[37].password);
    			}

    			if (!current || dirty[0] & /*isConnectingAP*/ 8 && button0_class_value !== (button0_class_value = "button is-primary " + /*isConnectingAP*/ ctx[3] + " svelte-ikylq0")) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (!current || dirty[0] & /*isConnectingAP*/ 8 && button1_class_value !== (button1_class_value = "button is-info " + /*isConnectingAP*/ ctx[3] + " svelte-ikylq0")) {
    				attr_dev(button1, "class", button1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(icon0.$$.fragment, local);
    			transition_in(icon1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(icon0.$$.fragment, local);
    			transition_out(icon1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_component(icon0);
    			destroy_component(icon1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$c.name,
    		type: "if",
    		source: "(391:10) {#if accessPoint.SSID!='--'}",
    		ctx
    	});

    	return block;
    }

    // (389:10) {#each wifiListArray as accessPoint , i}
    function create_each_block$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*accessPoint*/ ctx[37].CHAN < 14000 && create_if_block$h(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*accessPoint*/ ctx[37].CHAN < 14000) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*wifiListArray*/ 4) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$h(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(389:10) {#each wifiListArray as accessPoint , i}",
    		ctx
    	});

    	return block;
    }

    // (466:27) <Button type="is-primary">
    function create_default_slot_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Button");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(466:27) <Button type=\\\"is-primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (464:4) <Field position="is-centered">
    function create_default_slot_3(ctx) {
    	let input;
    	let t;
    	let div;
    	let button;
    	let current;
    	input = new Input({ $$inline: true });

    	button = new Button({
    			props: {
    				type: "is-primary",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "control");
    			add_location(div, file$r, 465, 6, 15924);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(464:4) <Field position=\\\"is-centered\\\">",
    		ctx
    	});

    	return block;
    }

    // (471:27) <Button type="is-primary">
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Button");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(471:27) <Button type=\\\"is-primary\\\">",
    		ctx
    	});

    	return block;
    }

    // (469:4) <Field grouped position="is-right">
    function create_default_slot_1$1(ctx) {
    	let input;
    	let t;
    	let div;
    	let button;
    	let current;
    	input = new Input({ $$inline: true });

    	button = new Button({
    			props: {
    				type: "is-primary",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(input.$$.fragment);
    			t = space();
    			div = element("div");
    			create_component(button.$$.fragment);
    			attr_dev(div, "class", "control");
    			add_location(div, file$r, 470, 6, 16069);
    		},
    		m: function mount(target, anchor) {
    			mount_component(input, target, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);
    			mount_component(button, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const button_changes = {};

    			if (dirty[1] & /*$$scope*/ 2048) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(input.$$.fragment, local);
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(input.$$.fragment, local);
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(input, detaching);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1$1.name,
    		type: "slot",
    		source: "(469:4) <Field grouped position=\\\"is-right\\\">",
    		ctx
    	});

    	return block;
    }

    // (462:0) <Modal bind:active={connectModalActive}>
    function create_default_slot$4(ctx) {
    	let p;
    	let field0;
    	let t;
    	let field1;
    	let current;

    	field0 = new Field({
    			props: {
    				position: "is-centered",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	field1 = new Field({
    			props: {
    				grouped: true,
    				position: "is-right",
    				$$slots: { default: [create_default_slot_1$1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			p = element("p");
    			create_component(field0.$$.fragment);
    			t = space();
    			create_component(field1.$$.fragment);
    			attr_dev(p, "class", "form is-4by3");
    			add_location(p, file$r, 462, 2, 15842);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			mount_component(field0, p, null);
    			append_dev(p, t);
    			mount_component(field1, p, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const field0_changes = {};

    			if (dirty[1] & /*$$scope*/ 2048) {
    				field0_changes.$$scope = { dirty, ctx };
    			}

    			field0.$set(field0_changes);
    			const field1_changes = {};

    			if (dirty[1] & /*$$scope*/ 2048) {
    				field1_changes.$$scope = { dirty, ctx };
    			}

    			field1.$set(field1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(field0.$$.fragment, local);
    			transition_in(field1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(field0.$$.fragment, local);
    			transition_out(field1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    			destroy_component(field0);
    			destroy_component(field1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$4.name,
    		type: "slot",
    		source: "(462:0) <Modal bind:active={connectModalActive}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$s(ctx) {
    	let div2;
    	let h10;
    	let t1;
    	let div0;
    	let span0;
    	let t2;
    	let br0;
    	let t3;
    	let br1;
    	let t4;
    	let t5;
    	let br2;
    	let br3;
    	let t6;
    	let i0;
    	let b0;
    	let t8;
    	let i1;
    	let t10;
    	let div1;
    	let button0;
    	let t11;
    	let button0_class_value;
    	let t12;
    	let button1;
    	let t14;
    	let t15;
    	let div4;
    	let h11;
    	let t17;
    	let div3;
    	let span1;
    	let t18;
    	let icon;
    	let t19;
    	let t20;
    	let div5;
    	let button2;
    	let t21;
    	let button2_class_value;
    	let t22;
    	let button3;
    	let t23;
    	let button3_class_value;
    	let t24;
    	let progress;
    	let t25;
    	let t26;
    	let t27;
    	let div8;
    	let div7;
    	let div6;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t29;
    	let th1;
    	let t31;
    	let th2;
    	let t33;
    	let th3;
    	let t35;
    	let th4;
    	let t37;
    	let tbody;
    	let t38;
    	let div9;
    	let span2;
    	let i2;
    	let b1;
    	let t40;
    	let i3;
    	let t42;
    	let br4;
    	let br5;
    	let t43;
    	let i4;
    	let b2;
    	let t45;
    	let i5;
    	let t47;
    	let br6;
    	let br7;
    	let t48;
    	let br8;
    	let br9;
    	let t49;
    	let modal;
    	let updating_active;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block = /*unit*/ ctx[1].nmcliConnections != undefined && create_if_block_2$7(ctx);

    	icon = new Icon$1({
    			props: {
    				class: "is-primary",
    				icon: /*iconFaPlus*/ ctx[9]
    			},
    			$$inline: true
    		});

    	let each_value = /*wifiListArray*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	function modal_active_binding(value) {
    		/*modal_active_binding*/ ctx[22].call(null, value);
    	}

    	let modal_props = {
    		$$slots: { default: [create_default_slot$4] },
    		$$scope: { ctx }
    	};

    	if (/*connectModalActive*/ ctx[0] !== void 0) {
    		modal_props.active = /*connectModalActive*/ ctx[0];
    	}

    	modal = new Modal({ props: modal_props, $$inline: true });
    	binding_callbacks.push(() => bind(modal, "active", modal_active_binding));

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			h10 = element("h1");
    			h10.textContent = "4. Configureren wifi-netwerk";
    			t1 = space();
    			div0 = element("div");
    			span0 = element("span");
    			t2 = text("Hier configureert en activeert u de wifi-verbinding op de sensorkit. De\n    knop 'Ververs' laat de geconfigureerde netwerken zien.\n    Met de knop 'AccessPoint' zal de sensorkit naar accespoint omschakelen,\n    een eigen wifi-netwerk starten.");
    			br0 = element("br");
    			t3 = text("\n    De knoppen bij de netwerkverbindingen zijn voor het activeren of verwijderen.");
    			br1 = element("br");
    			t4 = text("\n    Bij 5. kunt u een nieuw wifi-netwerk toevoegen.");
    			t5 = space();
    			br2 = element("br");
    			br3 = element("br");
    			t6 = space();
    			i0 = element("i");
    			b0 = element("b");
    			b0.textContent = "Uw wifi-netwerk gewijzigd?:";
    			t8 = space();
    			i1 = element("i");
    			i1.textContent = "Als uw wifi-netwerk is gewijzigd (bv. andere router of nieuw wachtwoord)\n      zal de sensorkit geen verbinding meer kunnen maken en omschakelen naar accesspoint.\n      Dan opnieuw configureren door eerst het gewijzigde wifi-netwerk te verwijderen\n      en het nieuwe / aangepaste netwerk toevoegen.";
    			t10 = space();
    			div1 = element("div");
    			button0 = element("button");
    			t11 = text("Ververs");
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "AccessPoint";
    			t14 = space();
    			if (if_block) if_block.c();
    			t15 = space();
    			div4 = element("div");
    			h11 = element("h1");
    			h11.textContent = "5. Wifi-netwerk toevoegen";
    			t17 = space();
    			div3 = element("div");
    			span1 = element("span");
    			t18 = text("De onderstaande lijst met lokale wifi-netwerken bevat de wifi-netwerken\n    welke door de sensorkit zijn 'gezien' ('Toon lijst').\n    Als uw wifi-netwerk in de lijst voorkomt, kunt u daarbij het wachtwoord\n    opgeven en met de groene plus knop (");
    			create_component(icon.$$.fragment);
    			t19 = text(") dit\n    netwerk toevoegen aan de configuratie bij 4.");
    			t20 = space();
    			div5 = element("div");
    			button2 = element("button");
    			t21 = text("Toon lijst");
    			t22 = space();
    			button3 = element("button");
    			t23 = text("Ververs");
    			t24 = space();
    			progress = element("progress");
    			t25 = text(/*wifiListProgressCount*/ ctx[7]);
    			t26 = text("%");
    			t27 = space();
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "SSID";
    			t29 = space();
    			th1 = element("th");
    			th1.textContent = "K";
    			t31 = space();
    			th2 = element("th");
    			th2.textContent = "S";
    			t33 = space();
    			th3 = element("th");
    			th3.textContent = "Password";
    			t35 = space();
    			th4 = element("th");
    			th4.textContent = "Connect";
    			t37 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t38 = space();
    			div9 = element("div");
    			span2 = element("span");
    			i2 = element("i");
    			b1 = element("b");
    			b1.textContent = "Uw wifi-netwerk staat niet in de lijst?:";
    			t40 = space();
    			i3 = element("i");
    			i3.textContent = "Met de \"Ververs\"-knop kunt u de lijst met lokale wifi-netwerken opnieuw\n        laten bepalen. Let er daarbij wel op dat de sensorkit, als deze als\n        accesspoint functioneert, tijdelijk het eigen wifi netwerk uitschakelt\n        en dat uw apparaat dan mogelijk automatisch terug verbindt met uw\n        standaard netwerk.\n        In dat geval dient u uw apparaat opnieuw verbinden met het wifi-netwerk van de\n        sensorkit als deze weer is geactiveerd. Om dit automatisch omschakelen te\n        voorkomen kunt u tijdelijk op uw apparaat voor uw eigen wifi-netwerk, het\n        automatisch verbinden uitschakelen";
    			t42 = space();
    			br4 = element("br");
    			br5 = element("br");
    			t43 = space();
    			i4 = element("i");
    			b2 = element("b");
    			b2.textContent = "Lijst blijft leeg?:";
    			t45 = space();
    			i5 = element("i");
    			i5.textContent = "Als er geen lokale wifi-netwerken worden getoond, controleer dan bij 3.\n        of er nog verbinding is met de sensorkit service en of de wifi-verbinding\n        nog goed staat.";
    			t47 = space();
    			br6 = element("br");
    			br7 = element("br");
    			t48 = space();
    			br8 = element("br");
    			br9 = element("br");
    			t49 = space();
    			create_component(modal.$$.fragment);
    			attr_dev(h10, "class", "svelte-ikylq0");
    			add_location(h10, file$r, 258, 2, 7705);
    			add_location(br0, file$r, 264, 35, 8060);
    			add_location(br1, file$r, 265, 81, 8146);
    			add_location(span0, file$r, 261, 2, 7812);
    			add_location(br2, file$r, 267, 4, 8214);
    			add_location(br3, file$r, 267, 9, 8219);
    			attr_dev(i0, "class", "fas fa-info");
    			add_location(i0, file$r, 268, 4, 8229);
    			add_location(b0, file$r, 268, 31, 8256);
    			add_location(i1, file$r, 269, 4, 8295);
    			attr_dev(div0, "class", "info-blok svelte-ikylq0");
    			add_location(div0, file$r, 260, 2, 7786);
    			attr_dev(button0, "class", button0_class_value = "button is-info " + /*isRefreshingConnections*/ ctx[6] + " svelte-ikylq0");
    			add_location(button0, file$r, 276, 4, 8653);
    			attr_dev(button1, "class", "button is-info");
    			add_location(button1, file$r, 277, 4, 8762);
    			attr_dev(div1, "class", "container");
    			add_location(div1, file$r, 275, 2, 8625);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$r, 257, 2, 7679);
    			attr_dev(h11, "class", "svelte-ikylq0");
    			add_location(h11, file$r, 354, 2, 11327);
    			add_location(span1, file$r, 357, 2, 11431);
    			attr_dev(div3, "class", "info-blok svelte-ikylq0");
    			add_location(div3, file$r, 356, 2, 11405);
    			attr_dev(div4, "class", "container");
    			add_location(div4, file$r, 353, 0, 11301);
    			attr_dev(button2, "class", button2_class_value = "button is-info " + /*isRefreshingWifiListCache*/ ctx[4] + " svelte-ikylq0");
    			add_location(button2, file$r, 366, 4, 11832);
    			attr_dev(button3, "class", button3_class_value = "button is-info " + /*isRefreshingWifiList*/ ctx[5] + " svelte-ikylq0");
    			add_location(button3, file$r, 367, 4, 11951);
    			attr_dev(progress, "class", "progress is-info");
    			progress.value = /*wifiListProgressCount*/ ctx[7];
    			attr_dev(progress, "max", "100");
    			add_location(progress, file$r, 368, 4, 12057);
    			add_location(div5, file$r, 365, 2, 11822);
    			add_location(th0, file$r, 376, 12, 12409);
    			add_location(th1, file$r, 378, 12, 12468);
    			add_location(th2, file$r, 380, 12, 12522);
    			add_location(th3, file$r, 383, 12, 12609);
    			add_location(th4, file$r, 384, 12, 12639);
    			add_location(tr, file$r, 375, 10, 12392);
    			add_location(thead, file$r, 374, 8, 12374);
    			add_location(tbody, file$r, 387, 8, 12697);
    			attr_dev(table, "class", "connection-table table is-striped is-narrow svelte-ikylq0");
    			add_location(table, file$r, 373, 6, 12306);
    			attr_dev(div6, "class", "column is-narrow");
    			add_location(div6, file$r, 372, 6, 12269);
    			attr_dev(div7, "class", "columns is-mobile is-centered");
    			add_location(div7, file$r, 371, 4, 12219);
    			attr_dev(div8, "class", "container info-blok svelte-ikylq0");
    			add_location(div8, file$r, 370, 2, 12181);
    			attr_dev(i2, "class", "fas fa-info");
    			add_location(i2, file$r, 439, 6, 14754);
    			add_location(b1, file$r, 439, 33, 14781);
    			add_location(i3, file$r, 440, 6, 14835);
    			add_location(br4, file$r, 449, 6, 15470);
    			add_location(br5, file$r, 449, 11, 15475);
    			attr_dev(i4, "class", "fas fa-info");
    			add_location(i4, file$r, 450, 6, 15487);
    			add_location(b2, file$r, 450, 33, 15514);
    			add_location(i5, file$r, 451, 6, 15547);
    			add_location(span2, file$r, 438, 4, 14741);
    			add_location(br6, file$r, 455, 4, 15748);
    			add_location(br7, file$r, 455, 9, 15753);
    			add_location(br8, file$r, 456, 4, 15763);
    			add_location(br9, file$r, 456, 9, 15768);
    			attr_dev(div9, "class", "container info-blok svelte-ikylq0");
    			add_location(div9, file$r, 437, 0, 14703);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, h10);
    			append_dev(div2, t1);
    			append_dev(div2, div0);
    			append_dev(div0, span0);
    			append_dev(span0, t2);
    			append_dev(span0, br0);
    			append_dev(span0, t3);
    			append_dev(span0, br1);
    			append_dev(span0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, br2);
    			append_dev(div0, br3);
    			append_dev(div0, t6);
    			append_dev(div0, i0);
    			append_dev(div0, b0);
    			append_dev(div0, t8);
    			append_dev(div0, i1);
    			append_dev(div2, t10);
    			append_dev(div2, div1);
    			append_dev(div1, button0);
    			append_dev(button0, t11);
    			append_dev(div1, t12);
    			append_dev(div1, button1);
    			append_dev(div2, t14);
    			if (if_block) if_block.m(div2, null);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, h11);
    			append_dev(div4, t17);
    			append_dev(div4, div3);
    			append_dev(div3, span1);
    			append_dev(span1, t18);
    			mount_component(icon, span1, null);
    			append_dev(span1, t19);
    			insert_dev(target, t20, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, button2);
    			append_dev(button2, t21);
    			append_dev(div5, t22);
    			append_dev(div5, button3);
    			append_dev(button3, t23);
    			append_dev(div5, t24);
    			append_dev(div5, progress);
    			append_dev(progress, t25);
    			append_dev(progress, t26);
    			insert_dev(target, t27, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t29);
    			append_dev(tr, th1);
    			append_dev(tr, t31);
    			append_dev(tr, th2);
    			append_dev(tr, t33);
    			append_dev(tr, th3);
    			append_dev(tr, t35);
    			append_dev(tr, th4);
    			append_dev(table, t37);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			insert_dev(target, t38, anchor);
    			insert_dev(target, div9, anchor);
    			append_dev(div9, span2);
    			append_dev(span2, i2);
    			append_dev(span2, b1);
    			append_dev(span2, t40);
    			append_dev(span2, i3);
    			append_dev(span2, t42);
    			append_dev(span2, br4);
    			append_dev(span2, br5);
    			append_dev(span2, t43);
    			append_dev(span2, i4);
    			append_dev(span2, b2);
    			append_dev(span2, t45);
    			append_dev(span2, i5);
    			append_dev(div9, t47);
    			append_dev(div9, br6);
    			append_dev(div9, br7);
    			append_dev(div9, t48);
    			append_dev(div9, br8);
    			append_dev(div9, br9);
    			insert_dev(target, t49, anchor);
    			mount_component(modal, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*nmcliConnectionShow*/ ctx[12], false, false, false),
    					listen_dev(button1, "click", /*click_handler*/ ctx[16], false, false, false),
    					listen_dev(button2, "click", /*nmcliDeviceWifiListCache*/ ctx[13], false, false, false),
    					listen_dev(button3, "click", /*nmcliDeviceWifiList*/ ctx[14], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty[0] & /*isRefreshingConnections*/ 64 && button0_class_value !== (button0_class_value = "button is-info " + /*isRefreshingConnections*/ ctx[6] + " svelte-ikylq0")) {
    				attr_dev(button0, "class", button0_class_value);
    			}

    			if (/*unit*/ ctx[1].nmcliConnections != undefined) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty[0] & /*unit*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$7(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (!current || dirty[0] & /*isRefreshingWifiListCache*/ 16 && button2_class_value !== (button2_class_value = "button is-info " + /*isRefreshingWifiListCache*/ ctx[4] + " svelte-ikylq0")) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (!current || dirty[0] & /*isRefreshingWifiList*/ 32 && button3_class_value !== (button3_class_value = "button is-info " + /*isRefreshingWifiList*/ ctx[5] + " svelte-ikylq0")) {
    				attr_dev(button3, "class", button3_class_value);
    			}

    			if (!current || dirty[0] & /*wifiListProgressCount*/ 128) set_data_dev(t25, /*wifiListProgressCount*/ ctx[7]);

    			if (!current || dirty[0] & /*wifiListProgressCount*/ 128) {
    				prop_dev(progress, "value", /*wifiListProgressCount*/ ctx[7]);
    			}

    			if (dirty[0] & /*isConnectingAP, confirm, wifiListArray, iconFaPlus*/ 33292) {
    				each_value = /*wifiListArray*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const modal_changes = {};

    			if (dirty[1] & /*$$scope*/ 2048) {
    				modal_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_active && dirty[0] & /*connectModalActive*/ 1) {
    				updating_active = true;
    				modal_changes.active = /*connectModalActive*/ ctx[0];
    				add_flush_callback(() => updating_active = false);
    			}

    			modal.$set(modal_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			transition_in(icon.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(modal.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			transition_out(icon.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(modal.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(div4);
    			destroy_component(icon);
    			if (detaching) detach_dev(t20);
    			if (detaching) detach_dev(div5);
    			if (detaching) detach_dev(t27);
    			if (detaching) detach_dev(div8);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t38);
    			if (detaching) detach_dev(div9);
    			if (detaching) detach_dev(t49);
    			destroy_component(modal, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$s.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function sleep(ms) {
    	return new Promise(resolve => setTimeout(resolve, ms));
    }

    function instance$s($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Nmcli_connection_show", slots, []);
    	let iconFaWindowClose = faWindowClose.faWindowClose;
    	let iconFaPlus = faPlus.faPlus;

    	//let iconFaPlusSquareO = faPlusSquareO;
    	let iconFaDoorOpen = faDoorOpen.faDoorOpen;

    	let iconFaDoorClosed = faDoorClosed.faDoorClosed;
    	let iconFaWifi = faWifi.faWifi;
    	let iconFaCheck = faCheck.faCheck;
    	let iconFaInfo = faInfo.faInfo;
    	const titleize = s => s.replace(/^([a-z])/, (_, r) => r.toUpperCase());
    	let connectModalActive = false;
    	let unit = {};
    	let wifiListArray = [];

    	// connections: {"NAME":"ap-5","UUID":"4d2838f2-b53d-4acc-8daf-8871f891771c","TYPE":"wifi","DEVICE":"wlp7s0"}
    	var isConnecting = "";

    	var isConnectingAP = "";
    	var isRefreshingWifiListCache = "";
    	var isRefreshingWifiList = "";
    	var isRefreshingConnections = "is-not-loading";
    	var isDeletingConnection = "";
    	var wifiListProgressCount = 0;

    	const nmcliConnectionShow = function () {
    		$$invalidate(6, isRefreshingConnections = "is-loading");

    		getNmcliConnectionShow().then(result => {
    			if (Array.isArray(result.data) == true) $$invalidate(1, unit.nmcliConnections = result.data, unit); else $$invalidate(1, unit.nmcliConnections = [], unit);
    			$$invalidate(6, isRefreshingConnections = "is-not-loading");
    		}).catch(error => {
    			console.log(error.message);
    			$$invalidate(1, unit.nmcliConnections = [], unit);
    			$$invalidate(6, isRefreshingConnections = "is-not-loading");
    		});
    	};

    	const nmcliConnectionDelete = function (connection) {
    		isDeletingConnection = "is-loading";

    		deleteNmcliConnection(connection).then(result => {
    			isDeletingConnection = "";
    			nmcliConnectionShow();
    		}).catch(error => {
    			console.log(error.message);
    			isDeletingConnection = "";
    		});
    	};

    	const nmcliDeviceHotspot = async function () {
    		const res = await getNmcliDeviceHotspot();

    		if (res.error) {
    			console.log(res.error.message);
    		}

    		//unit.nmcliConnections = res;
    		console.log("end of activation device hotspot function");
    	};

    	const nmcliDeviceWifiListCache = async function (connection) {
    		$$invalidate(4, isRefreshingWifiListCache = "is-loading");
    		$$invalidate(7, wifiListProgressCount = 1);

    		getNmcliDeviceWifiListCache().then(result => {
    			if (Array.isArray(result.data) == true) $$invalidate(2, wifiListArray = result.data);
    			$$invalidate(4, isRefreshingWifiListCache = "");
    			$$invalidate(7, wifiListProgressCount = 100);
    		}).catch(error => {
    			$$invalidate(4, isRefreshingWifiListCache = "");
    			$$invalidate(7, wifiListProgressCount = 100);
    		});
    	};

    	const nmcliDeviceWifiList = async function (connection) {
    		$$invalidate(5, isRefreshingWifiList = "is-loading");
    		$$invalidate(7, wifiListProgressCount = 1);

    		getNmcliDeviceWifiList().then(async result => {
    			if (result.status == 210) {
    				for (var i = wifiListProgressCount; i <= 100; i += 1) {
    					$$invalidate(7, wifiListProgressCount = i);
    					await sleep(140); // 100x 140ms =14s
    				}

    				getNmcliDeviceWifiListCache().then(result => {
    					if (Array.isArray(result.data) == true) $$invalidate(2, wifiListArray = result.data);
    					$$invalidate(5, isRefreshingWifiList = "");
    				}).catch(error => {
    					$$invalidate(5, isRefreshingWifiList = "");
    				});
    			} else {
    				$$invalidate(7, wifiListProgressCount = 100);
    				$$invalidate(5, isRefreshingWifiList = "");
    				if (Array.isArray(result.data) == true) $$invalidate(2, wifiListArray = result.data); else $$invalidate(2, wifiListArray = []);
    			}
    		}).catch(error => {
    			console.log(error.message);
    			$$invalidate(5, isRefreshingWifiList = "");
    			$$invalidate(2, wifiListArray = []);
    		});
    	};

    	const nmcliDeviceConnect = async function (connection) {
    		isConnecting = "is-loading";

    		await postNmcliDeviceConnect(connection).then(result => {
    			isConnecting = "";
    			nmcliConnectionShow();
    		}).catch(error => {
    			console.log(error.message);
    			isConnecting = "";
    		});
    	};

    	const nmcliApConnect = function (param) {
    		$$invalidate(3, isConnectingAP = "is-loading");

    		postNmcliApConnect(param).then(result => {
    			$$invalidate(3, isConnectingAP = "");
    			nmcliConnectionShow();
    		}).catch(error => {
    			$$invalidate(3, isConnectingAP = "");
    			console.log(error.message);
    		});
    	};

    	//let deleteModalShow=''
    	let focusedConnection = {};

    	const confirmDelete = function (connection) {
    		//console.log(connection)
    		focusedConnection = connection;
    	}; //deleteModalShow ='is-active'

    	const thenHandler = result => Toast.create(`You ${result ? "confirmed" : "canceled"}`);

    	const deleteConnection = connection => {
    		console.log("verwijder connectie: ");
    		console.log(connection);
    		nmcliConnectionDelete(connection);
    	};

    	function confirm(param) {
    		var _param = param;
    		console.dir(_param);

    		switch (_param.action) {
    			case "deleteConnection":
    				return Dialog$1.confirm({
    					message: "Wilt u deze wifi-configuratie verwijderen?",
    					title: "Verwijder connectie: " + _param.connection.NAME,
    					type: "is-light",
    					icon: "times-circle"
    				}).then(result => {
    					if (result) {
    						_param.connection.key = _param.key;
    						deleteConnection(_param.connection);
    					}
    				}).catch(error => {
    					
    				});
    			case "connectAccessPoint":
    				return Dialog$1.confirm({
    					message: "Wilt u dit accesspoint gebruiken?",
    					title: "Verbinden met wifi accesspoint : " + _param.ssid,
    					type: "is-info",
    					icon: "times-circle"
    				}).then(result => {
    					if (result) {
    						console.log("test");
    						console.log(_param.method);
    						console.log(result);
    						nmcliApConnect(_param);
    					}
    				}).catch(error => {
    					
    				});
    			case "deviceConnect":
    				return Dialog$1.confirm({
    					message: "Wilt u de sensorkit aan dit wifi accesspoint verbinden?",
    					title: "Connect wifi: " + _param.connection.NAME,
    					type: "is-info",
    					icon: "times-circle"
    				}).then(result => {
    					console.log("then");

    					if (result) {
    						_param.connection.key = _param.key;
    						nmcliDeviceConnect(_param.connection);
    					}
    				}).catch(error => {
    					console.log("catch");
    				});
    			case "nmcliDeviceHotspot":
    				return Dialog$1.confirm({
    					message: "Wilt u de accespoint functie van de sensorkit activeren?",
    					title: "Activeer sensorkit als accespoint",
    					type: "is-info",
    					icon: "times-circle"
    				}).then(result => {
    					console.log("then");

    					if (result) {
    						nmcliDeviceHotspot();
    					}
    				}).catch(error => {
    					console.log("catch");
    				});
    			default:
    				Dialog$1.confirm("Default action:none").then(thenHandler).catch(error => {
    					
    				});
    		}
    	}

    	onMount(async () => {
    		// get nmcli general info when module is activated like status of network
    		nmcliConnectionShow();
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Nmcli_connection_show> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		confirm({ action: "nmcliDeviceHotspot" });
    	};

    	const click_handler_1 = connection => {
    		confirm({
    			action: "deviceConnect",
    			key: "uuid",
    			connection
    		});
    	};

    	const click_handler_2 = connection => confirm({
    		action: "deleteConnection",
    		key: "uuid",
    		connection
    	});

    	function input_input_handler(each_value, i) {
    		each_value[i].password = this.value;
    		$$invalidate(2, wifiListArray);
    	}

    	const click_handler_3 = accessPoint => confirm({
    		action: "connectAccessPoint",
    		ssid: accessPoint.SSID,
    		passwd: accessPoint.password,
    		method: "1"
    	});

    	const click_handler_4 = accessPoint => confirm({
    		action: "connectAccessPoint",
    		ssid: accessPoint.SSID,
    		passwd: accessPoint.password,
    		method: "2"
    	});

    	function modal_active_binding(value) {
    		connectModalActive = value;
    		$$invalidate(0, connectModalActive);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		Tooltip: Tooltip$1,
    		tooltip,
    		Icon: Icon$1,
    		faWindowClose: faWindowClose.faWindowClose,
    		faPlus: faPlus.faPlus,
    		faDoorOpen: faDoorOpen.faDoorOpen,
    		faDoorClosed: faDoorClosed.faDoorClosed,
    		faWifi: faWifi.faWifi,
    		faCheck: faCheck.faCheck,
    		faInfo: faInfo.faInfo,
    		iconFaWindowClose,
    		iconFaPlus,
    		iconFaDoorOpen,
    		iconFaDoorClosed,
    		iconFaWifi,
    		iconFaCheck,
    		iconFaInfo,
    		getNmcliConnectionShow,
    		getNmcliDeviceHotspot,
    		getNmcliDeviceWifiList,
    		getNmcliDeviceWifiListCache,
    		postNmcliDeviceConnect,
    		postNmcliApConnect,
    		deleteNmcliConnection,
    		setApiConfigUrl,
    		getApiConfigUrl,
    		setApiConfigPort,
    		getApiConfigPort,
    		setApiConfigUrlAvahi,
    		getApiConfigUrlAvahi,
    		Button,
    		Modal,
    		Dialog: Dialog$1,
    		Toast,
    		Field,
    		Input,
    		titleize,
    		connectModalActive,
    		unit,
    		wifiListArray,
    		isConnecting,
    		isConnectingAP,
    		isRefreshingWifiListCache,
    		isRefreshingWifiList,
    		isRefreshingConnections,
    		isDeletingConnection,
    		wifiListProgressCount,
    		sleep,
    		nmcliConnectionShow,
    		nmcliConnectionDelete,
    		nmcliDeviceHotspot,
    		nmcliDeviceWifiListCache,
    		nmcliDeviceWifiList,
    		nmcliDeviceConnect,
    		nmcliApConnect,
    		focusedConnection,
    		confirmDelete,
    		thenHandler,
    		deleteConnection,
    		confirm
    	});

    	$$self.$inject_state = $$props => {
    		if ("iconFaWindowClose" in $$props) $$invalidate(8, iconFaWindowClose = $$props.iconFaWindowClose);
    		if ("iconFaPlus" in $$props) $$invalidate(9, iconFaPlus = $$props.iconFaPlus);
    		if ("iconFaDoorOpen" in $$props) iconFaDoorOpen = $$props.iconFaDoorOpen;
    		if ("iconFaDoorClosed" in $$props) iconFaDoorClosed = $$props.iconFaDoorClosed;
    		if ("iconFaWifi" in $$props) $$invalidate(10, iconFaWifi = $$props.iconFaWifi);
    		if ("iconFaCheck" in $$props) $$invalidate(11, iconFaCheck = $$props.iconFaCheck);
    		if ("iconFaInfo" in $$props) iconFaInfo = $$props.iconFaInfo;
    		if ("connectModalActive" in $$props) $$invalidate(0, connectModalActive = $$props.connectModalActive);
    		if ("unit" in $$props) $$invalidate(1, unit = $$props.unit);
    		if ("wifiListArray" in $$props) $$invalidate(2, wifiListArray = $$props.wifiListArray);
    		if ("isConnecting" in $$props) isConnecting = $$props.isConnecting;
    		if ("isConnectingAP" in $$props) $$invalidate(3, isConnectingAP = $$props.isConnectingAP);
    		if ("isRefreshingWifiListCache" in $$props) $$invalidate(4, isRefreshingWifiListCache = $$props.isRefreshingWifiListCache);
    		if ("isRefreshingWifiList" in $$props) $$invalidate(5, isRefreshingWifiList = $$props.isRefreshingWifiList);
    		if ("isRefreshingConnections" in $$props) $$invalidate(6, isRefreshingConnections = $$props.isRefreshingConnections);
    		if ("isDeletingConnection" in $$props) isDeletingConnection = $$props.isDeletingConnection;
    		if ("wifiListProgressCount" in $$props) $$invalidate(7, wifiListProgressCount = $$props.wifiListProgressCount);
    		if ("focusedConnection" in $$props) focusedConnection = $$props.focusedConnection;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		connectModalActive,
    		unit,
    		wifiListArray,
    		isConnectingAP,
    		isRefreshingWifiListCache,
    		isRefreshingWifiList,
    		isRefreshingConnections,
    		wifiListProgressCount,
    		iconFaWindowClose,
    		iconFaPlus,
    		iconFaWifi,
    		iconFaCheck,
    		nmcliConnectionShow,
    		nmcliDeviceWifiListCache,
    		nmcliDeviceWifiList,
    		confirm,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler,
    		click_handler_3,
    		click_handler_4,
    		modal_active_binding
    	];
    }

    class Nmcli_connection_show extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$s, create_fragment$s, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Nmcli_connection_show",
    			options,
    			id: create_fragment$s.name
    		});
    	}
    }

    const key = "userContext";

    const initialValue = null;

    /* src/App.svelte generated by Svelte v3.31.1 */

    const { console: console_1$4 } = globals;

    const file$s = "src/App.svelte";

    function create_fragment$t(ctx) {
    	let main;
    	let h1;
    	let t1;
    	let nmcligeneral;
    	let t2;
    	let nmcliconnectionshow;
    	let current;
    	nmcligeneral = new Nmcli_general({ $$inline: true });
    	nmcliconnectionshow = new Nmcli_connection_show({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			h1.textContent = "ApriSensor Network Manager";
    			t1 = space();
    			create_component(nmcligeneral.$$.fragment);
    			t2 = space();
    			create_component(nmcliconnectionshow.$$.fragment);
    			attr_dev(h1, "class", "svelte-1707v2a");
    			add_location(h1, file$s, 92, 1, 2591);
    			attr_dev(main, "class", "svelte-1707v2a");
    			add_location(main, file$s, 49, 0, 1264);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(main, t1);
    			mount_component(nmcligeneral, main, null);
    			append_dev(main, t2);
    			mount_component(nmcliconnectionshow, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(nmcligeneral.$$.fragment, local);
    			transition_in(nmcliconnectionshow.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(nmcligeneral.$$.fragment, local);
    			transition_out(nmcliconnectionshow.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(nmcligeneral);
    			destroy_component(nmcliconnectionshow);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$t.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$t($$self, $$props, $$invalidate) {
    	let $LoginStore;
    	validate_store(LoginStore, "LoginStore");
    	component_subscribe($$self, LoginStore, $$value => $$invalidate(0, $LoginStore = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let email = "";
    	let password = "";
    	let loginStatus = 0; // 0=not logged in, 1=logging in 2=logged in
    	let loginSubmit = "test";
    	let loginModal; //= false

    	onMount(() => {
    		console.log("onmount van App start");
    		console.log("onmount van App end");
    	});

    	const submit = ({ email, password }) => new Promise((resolve, reject) => {
    			console.log("xx");

    			setTimeout(
    				() => {
    					setContext(key, {
    						name: "Foo",
    						lastName: "Bar",
    						email: "foo@bar.com"
    					});

    					resolve();
    				},
    				1000
    			);
    		});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		setContext,
    		onMount,
    		Svelma,
    		Field,
    		Input,
    		Button,
    		Modal: Modal$1,
    		LoginForm,
    		Login2: Openiod_login,
    		LoginStore,
    		unitStore,
    		NmcliGeneral: Nmcli_general,
    		NmcliConnectionShow: Nmcli_connection_show,
    		userContextKey: key,
    		userContextInitialValue: initialValue,
    		email,
    		password,
    		loginStatus,
    		loginSubmit,
    		loginModal,
    		submit,
    		$LoginStore
    	});

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) email = $$props.email;
    		if ("password" in $$props) password = $$props.password;
    		if ("loginStatus" in $$props) loginStatus = $$props.loginStatus;
    		if ("loginSubmit" in $$props) loginSubmit = $$props.loginSubmit;
    		if ("loginModal" in $$props) $$invalidate(5, loginModal = $$props.loginModal);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 {
    		if (loginModal == true) {
    			set_store_value(LoginStore, $LoginStore.loginProcess = true, $LoginStore);
    		} else set_store_value(LoginStore, $LoginStore.loginProcess = false, $LoginStore);
    	}

    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$t, create_fragment$t, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$t.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
