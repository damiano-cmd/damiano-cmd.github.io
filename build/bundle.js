
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
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
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    // unfortunately this can't be a constant as that wouldn't be tree-shakeable
    // so we cache the result instead
    let crossorigin;
    function is_crossorigin() {
        if (crossorigin === undefined) {
            crossorigin = false;
            try {
                if (typeof window !== 'undefined' && window.parent) {
                    void window.parent.document;
                }
            }
            catch (error) {
                crossorigin = true;
            }
        }
        return crossorigin;
    }
    function add_resize_listener(node, fn) {
        const computed_style = getComputedStyle(node);
        if (computed_style.position === 'static') {
            node.style.position = 'relative';
        }
        const iframe = element('iframe');
        iframe.setAttribute('style', 'display: block; position: absolute; top: 0; left: 0; width: 100%; height: 100%; ' +
            'overflow: hidden; border: 0; opacity: 0; pointer-events: none; z-index: -1;');
        iframe.setAttribute('aria-hidden', 'true');
        iframe.tabIndex = -1;
        const crossorigin = is_crossorigin();
        let unsubscribe;
        if (crossorigin) {
            iframe.src = "data:text/html,<script>onresize=function(){parent.postMessage(0,'*')}</script>";
            unsubscribe = listen(window, 'message', (event) => {
                if (event.source === iframe.contentWindow)
                    fn();
            });
        }
        else {
            iframe.src = 'about:blank';
            iframe.onload = () => {
                unsubscribe = listen(iframe.contentWindow, 'resize', fn);
            };
        }
        append(node, iframe);
        return () => {
            if (crossorigin) {
                unsubscribe();
            }
            else if (unsubscribe && iframe.contentWindow) {
                unsubscribe();
            }
            detach(iframe);
        };
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
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
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
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
            managed_styles.forEach(info => {
                const { stylesheet } = info;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                info.rules = {};
            });
            managed_styles.clear();
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
            const d = (program.b - t);
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
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
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
            mount_component(component, options.target, options.anchor, options.customElement);
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.46.0' }, detail), true));
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

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
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
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const SR = writable(true);



    const aboutmeen = [
        "Hello, I am 17 years old and I am a:",
        [
            "I am a self tought programmer and full stack web developer and I am based in Bosnia. I started learning web-dev at age 15 and didn't stop since. What realy got me in to programming is wanting to create cool stuff and apps, that is when I discoverd that I have a knack for programming and coding.",
            0,
            "The first programming language I learned is Python and then right after that I learned JavaScript. The primary thing I do is full stack web-dev but I also do Python application programming and development. I am an amature by all means, I don't do not have a fulltime job in my profession. It's been I fun journey learing programming and web development and design.",
            0,
            "My plan is to expand in to mobile development with Fluter, web/desktop development with Electronjs, QT6 and learn Redis and mySQL for back-end databases.",
            0,
            "I love doing personal projects and creating my own web apps and programms. I made this site to show of my web design and web development skills. You can go and see my first portfolio site in my project section.",
            0,
            "I would love to help you out with your projects if I can. So shoot me an email and we'll talk."
        ]
    ];
    const omeni = [
        "Zdravo, ime mi je David, imam 17 godina, ja sam:",
        [
            "Idem u srednju školu u kojoj učim programiranje ali sam i samostalno naučio puno toga. Nalazim se u Bosni. Počeo sam učiti web-development sa 15 godina i od tad učim sve više. Ono što me je uvelo u programiranje je želja da pravim interesantne stvari i aplikacije. Tad sam saznao da imam talenat za programiranje.",
            0,
            "Prvi programski jezik koji sam naučio je Python, a zatim JavaScript. Glavna stvar koju radim je full stack web-development ali isto radim Python programiranje i aplikativni development. Amater sam i još nisam imao posao u svojoj profesiji. Bilo je zabavno učiti programiranje i web-development i dizajn.",
            0,
            "Plan mi je da naučim mobile development sa Fluter-om, web/desktop development sa Electronjs, QT6 i naučiti Redis i mySQL za back-end baze podataka.",
            0,
            "Volim raditi lične projekte i praviti svoje web aplikacije i programe. Napravio sam ovaj sajt da pokažem svoje web-dizajn i web-development vještine. Moj prvi porfolio sajt se može naći u projekt sekciji.",
            0,
            "Volio bih da pomognem svojim klijentima oko njihovih projekata. Dajem i instrukcije. Pošaljite mi email i pričaćemo."
        ]
    ];
    const aboutme = writable(omeni);



    const skillsen = {
        "Languages": [
            {
                "img": "html.png",
                "title": "HTML",
                "text": "Proficient at using HTML.",
                subtext: "Nothing much to say, it is what it is."
            },
            {
                "img": "css.png",
                "title": "CSS",
                "text": "Very good with CSS, plus Sass.",
                subtext: "I don't like to use vanilla CSS."
            },
            {
                "img": "sass.png",
                "title": "SCSS",
                "text": "I also know SCSS/SASS.",
                subtext: "I use Sass because its better then CSS."
            },
            {
                "img": "js.jpg",
                "title": "JavaScript",
                "text": "Intermediate-Advanced at JavaScript.",
                subtext: "I know a good amount of vanilla js but i don't use it much."
            },
            {
                "img": "python.png",
                "title": "Python programming",
                "text": "Intermediate skill level at python programming.",
                subtext: "I know the basics and some modules for creating apps and programmes."
            },
            {
                "img": "cpp.png",
                "title": "C++ programming",
                "text": "Fairly good at C++.",
                subtext: "Didn't use it that much. More for personal projects."
            }
        ],
        "Frontend": [
            {
                "img": "react.png",
                "title": "React",
                "text": "Good at React + Next.js.",
                subtext: "This is the first framework that i learned."
            },
            {
                "img": "nextjs.png",
                "title": "Next.js",
                "text": "I'm ok with it but I don't like to work in it.",
                subtext: "This is the second framework I learnd. I made a proof of concept webapp, it's not a well desiged but it does what I want from it."
            },
            {
                "img": "svelte.png",
                "title": "Sveltejs",
                "text": "Intermediate skill level at the Svelte.js framework.",
                subtext: "This is my preferred framework of choise."
            }
        ],
        "Backend": [
            {
                "img": "nodejs.png",
                "title": "Node",
                "text": "This is the backend solution I use when making a website or app.",
                subtext: "This is the only backend runtime I use for my apps."
            },
            {
                "img": "expressjs.png",
                "title": "Express.js",
                "text": "Express is a backend server framework that I use in combination with Node.",
                subtext: "Also the only backend framework I know and it is good."
            },
            {
                "img": "rest.png",
                "title": "Rest API",
                "text": "I know how to make RESTful API's.",
                subtext: "I have a plan to learn graphQL."
            },
            {
                "img": "mongo.png",
                "title": "Mongo",
                "text": "Mongo is my backend database of chosise.",
                subtext: "I plan to add redist and mySQL to my repertoar."
            }
        ]
    };
    const vjestine = {
        "Programski Jezici": [
            {
                "img": "html.png",
                "title": "HTML",
                "text": "Dobar u HTML-u.",
                subtext: "Obični HTML ništa posebno."
            },
            {
                "img": "css.png",
                "title": "CSS",
                "text": "Veoma dobar u CSS-u i Sass-u.",
                subtext: "Ne volim koristiti obicni CSS."
            },
            {
                "img": "sass.png",
                "title": "SCSS",
                "text": "Znam SCSS/SASS.",
                subtext: "Koristim sass jer je bolji od CSS-a."
            },
            {
                "img": "js.jpg",
                "title": "JavaScript",
                "text": "Srednje-Napredan nivo vještine u JavaScript.",
                subtext: "Veoma dobro znam vanilla JavaScript ali ga toliko ne koristim."
            },
            {
                "img": "python.png",
                "title": "Python programiranje",
                "text": "Napredan nivo vještine u Python programiranju.",
                subtext: ""
            },
            {
                "img": "cpp.png",
                "title": "C++ programiranje",
                "text": "Vješt u C++.",
                subtext: ""
            }
        ],
        "Front-end": [
            {
                "img": "react.png",
                "title": "React",
                "text": "Dobar u React + Next.js.",
                subtext: "Ovo je prvi framework koji sam naučio."
            },
            {
                "img": "nextjs.png",
                "title": "Next.js",
                "text": "Ovaj framework je uredan.",
                subtext: "Sa njim sam napravio jednu web aplikaciju."
            },
            {
                "img": "svelte.png",
                "title": "Sveltejs",
                "text": "Srednji novi vještine u Svelte.js framework-u.",
                subtext: ""
            }
        ],
        "Back-end": [
            {
                "img": "nodejs.png",
                "title": "Node",
                "text": "Ovo je back-end rešenje koje koristim za web aplikacije ili sajtove.",
                subtext: ""
            },
            {
                "img": "expressjs.png",
                "title": "Express.js",
                "text": "Express je back-end framework koji služi za jednostavnije pravljenje servera.",
                subtext: ""
            },
            {
                "img": "rest.png",
                "title": "Rest API",
                "text": "Znam kako praviti RESTful API-ove.",
                subtext: "Imam plan da naučim graphQL."
            },
            {
                "img": "mongo.png",
                "title": "Mongo",
                "text": "MongoDB je baza podataka u kojoj radim.",
                subtext: "Imam plan da dodam Redis i mySQL na svoj repertoar."
            }
        ]
    };
    const skills = writable(vjestine);



    const servicesen = [
        {
            "img": "web-dev.png",
            "title": "Front End Web Development",
            "text": "I can develope and programme a full front-end web app or website using Svelte or Reach, by the clients liking to make it how they want it. I can also make it a PWA (Prograssive web add)."
        },
        {
            "img": "responsive.png",
            "title": "Responsive Design",
            "text": "I will add responsive design to a webapp that I am developing or to an already existing website for all devices from desktop to moblie."
        },
        {
            "img": "backend.png",
            "title": "Backend development",
            "text": "With Nodejs, Expressjs and MongoDB I will make a full back-end web server with a database connected. I can also add REST API on the server and configure the server to do what the client needs."
        },
        {
            "img": "js.jpg",
            "title": "JavaScript Programming",
            "text": "Vanilla JavaScript and Node.js programming and support is a service that I can give to my clients. Tutoring JS is available."
        },
        {
            "img": "MERN.png",
            "title": "MERN full stack development",
            "text": "I can make, update and manage a fullstack MERN web application. I will costomize the webapp to the clients liking and add functionality."
        },
        {
            "img": "nextjs-white.png",
            "title": "SSR framework development",
            "text": "The only SSR framework I know is Next.js and I have used it before to make a web-application. I can make a web-app with Next.js to the clients liking or manage an existing app."
        },
        {
            "img": "python.png",
            "title": "Python Scripting",
            "text": "Python scripting, making python apps and programmes this is what I provide to my clients. Tutoring python is available."
        },
        {
            "img": "cpp.png",
            "title": "C++ Programming",
            "text": "I can help you with C++ programming."
        }
    ];
    const usluge = [
        {
            "img": "web-dev.png",
            "title": "Front-End Web Development",
            "text": "Programiram i dizajniram cijelu front-end aplikaciju koristeći Svelte or Reach, sve po mjeri i želji klijenta. Mogu isto dodati PWA (Prograssive Web App)."
        },
        {
            "img": "responsive.png",
            "title": "Responzivan Dizajn",
            "text": "Dodajem responzivan dizajn na vebsajt koji izrađujem ili na već gotov vebsajt za sve uređaje od desktop-a do mobilnih telefona."
        },
        {
            "img": "backend.png",
            "title": "Backend development",
            "text": "Sa Nodejs, Expressjs i MongoDB pravim back-end server sa povezanom bazom podataka, ugrađenim REST API po klijentovim potrebama."
        },
        {
            "img": "js.jpg",
            "title": "JavaScript Programiranje",
            "text": "Programiranje i pomoć u običnom JavaScript-u i Node.js-u je usluga koju dajem svojem klijentima. Podučavanje JS-a je opcija."
        },
        {
            "img": "MERN.png",
            "title": "MERN full stack development",
            "text": "Izrada, obnova i odražavanje fullstek MERN web aplikacije. Sve je prilagođeno po mjeri."
        },
        {
            "img": "nextjs-white.png",
            "title": "SSR framework development",
            "text": "SSR framework koji koristim za izradu novih i obnovu starih aplikacija je Next.js."
        },
        {
            "img": "python.png",
            "title": "Python Scriptovanje",
            "text": "Svojim klijentima pružam Python scriptovanje i pravljenje Python aplikacija i programa. Podučavanje Python-a je opcija."
        },
        {
            "img": "cpp.png",
            "title": "C++ Programiranje",
            "text": "Podučavam C++ programiranje."
        }
    ];
    const services = writable(usluge);


    const projectsen = [
        {
            img: "/img/npm_logo.png",
            title: "Svelte Sharp UI",
            text: "This is my custom npm Svelte UI Component package!",
            link: "https://www.npmjs.com/package/svelte-sharp-ui"
        },
        {
            img: "/img/npm_logo.png",
            title: "Svelte ScrollFX (Deprecated)",
            text: "My npm package that add some scroll effects to svelte apps.",
            link: "https://www.npmjs.com/package/ssfx"
        },
        {
            img: "/img/npm_logo.png",
            title: "Svelte FX",
            text: "This is a derivative of Svelte ScrollFX but it addes more effects.",
            link: "https://www.npmjs.com/package/svfx"
        },
        {
            img: "https://traceer.herokuapp.com/static/favicon.png",
            title: "Traceer",
            text: "My first project that is posted online. It is a MERN + Next.js full stack app.",
            link: "https://traceer.herokuapp.com/"
        },
        {
            img: "/img/console.png",
            title: "Custom console app",
            text: "Made this console in python, it does some basic stuff.",
            link: "https://github.com/damiano-cmd/simple-console"
        },
        {
            img: "/img/QtBS4.png",
            title: "BeautifulSoupGUI",
            text: "This is a GUI for BeautifulSoup4 build with PyQt5, it scrapes the web and return the results.",
            link: "https://github.com/damiano-cmd/BSGUI/"
        },
        {
            img: "/img/SBBE.png",
            title: "Shadow Browser",
            text: "Browser extention that decrypts any know encrypeted text on a page and looks for encryption keys. Currently deprecated.",
            link: "https://github.com/damiano-cmd/ShadowBrowser"
        },
        {
            img: "/img/svelteBlank.png",
            title: "Todo app",
            text: "Just a simple, well designed todo app.",
            link: "https://damiano-cmd.github.io/my-todo-app/"
        },
        {
            img: "https://damiano-cmd.github.io/my-old-portfilio/favicon.ico",
            title: "My old portfolio site",
            text: "My first portfolio.",
            link: "https://damiano-cmd.github.io/my-old-portfilio/"
        },
    ];
    const projekti = [
        {
            img: "/img/npm_logo.png",
            title: "Svelte Sharp UI",
            text: "NPM modul sa Svelte UI Componentima.",
            link: "https://www.npmjs.com/package/svelte-sharp-ui"
        },
        {
            img: "/img/npm_logo.png",
            title: "Svelte ScrollFX (Napušteno)",
            text: "NPM modul koji dodaje animacije i scrolling efekte.",
            link: "https://www.npmjs.com/package/ssfx"
        },
        {
            img: "/img/npm_logo.png",
            title: "Svelte FX",
            text: "Dirivitiv Svelte ScrollFX-a sa više efekata.",
            link: "https://www.npmjs.com/package/svfx"
        },
        {
            img: "https://traceer.herokuapp.com/static/favicon.png",
            title: "Traceer",
            text: "Prvi projekat koji sam stavio online. To je MERN + Next.js fullstek aplikacija.",
            link: "https://traceer.herokuapp.com/"
        },
        {
            img: "/img/console.png",
            title: "Console aplikacija",
            text: "Ovo sam napravio u Python-u, radi neke osnovne stvari.",
            link: "https://github.com/damiano-cmd/simple-console"
        },
        {
            img: "/img/QtBS4.png",
            title: "BeautifulSoupGUI",
            text: "GUI aplikacija za BeautifulSoup4 napravljena u PyQt5, ovo kopa po vebsajtovima i izbacuje rezultate.",
            link: "https://github.com/damiano-cmd/BSGUI/"
        },
        {
            img: "/img/SBBE.png",
            title: "Shadow Browser",
            text: "Brauser ekstensija koja dekriptuje sav encriptovan text , koji je enkriptovan ovim istim alatom, na veb stranici. Trenutno napušten.",
            link: "https://github.com/damiano-cmd/ShadowBrowser"
        },
        {
            img: "/img/svelteBlank.png",
            title: "'Todo' aplikacija",
            text: "Jednostavna i ljepo dizajnirana 'todo' aplikacija.",
            link: "https://damiano-cmd.github.io/my-todo-app/"
        },
        {
            img: "https://damiano-cmd.github.io/my-old-portfilio/favicon.ico",
            title: "Moj stari portfolio sajt",
            text: "Moj prvi portfolio.",
            link: "https://damiano-cmd.github.io/my-old-portfilio/"
        },
    ];
    const projects = writable(projekti);

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 } = {}) {
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

    /* src/Components/Navigation.svelte generated by Svelte v3.46.0 */
    const file$f = "src/Components/Navigation.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (22:0) {#if y != 0}
    function create_if_block$2(ctx) {
    	let div;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "navDrop");
    			add_location(div, file$f, 22, 0, 368);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 100 }, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, { duration: 100 }, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(22:0) {#if y != 0}",
    		ctx
    	});

    	return block;
    }

    // (34:8) {#each links as i}
    function create_each_block$4(ctx) {
    	let li;
    	let button;
    	let t0_value = /*i*/ ctx[8] + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[6](/*i*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(button, "class", "svelte-ihprq6");
    			add_location(button, file$f, 35, 16, 735);
    			attr_dev(li, "class", "svelte-ihprq6");
    			add_location(li, file$f, 34, 12, 713);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*links*/ 1 && t0_value !== (t0_value = /*i*/ ctx[8] + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(34:8) {#each links as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$f(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let t0;
    	let nav;
    	let img;
    	let img_src_value;
    	let t1;
    	let button;
    	let span0;
    	let t2;
    	let span1;
    	let t3;
    	let span2;
    	let t4;
    	let ul;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[4]);
    	let if_block = /*y*/ ctx[1] != 0 && create_if_block$2(ctx);
    	let each_value = /*links*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			nav = element("nav");
    			img = element("img");
    			t1 = space();
    			button = element("button");
    			span0 = element("span");
    			t2 = space();
    			span1 = element("span");
    			t3 = space();
    			span2 = element("span");
    			t4 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (!src_url_equal(img.src, img_src_value = "/favicon.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-ihprq6");
    			add_location(img, file$f, 26, 4, 449);
    			attr_dev(span0, "class", "svelte-ihprq6");
    			add_location(span0, file$f, 28, 8, 550);
    			attr_dev(span1, "class", "m svelte-ihprq6");
    			add_location(span1, file$f, 29, 8, 572);
    			attr_dev(span2, "class", "svelte-ihprq6");
    			add_location(span2, file$f, 30, 8, 604);
    			attr_dev(button, "class", "burgar svelte-ihprq6");
    			add_location(button, file$f, 27, 4, 485);
    			attr_dev(ul, "class", "links svelte-ihprq6");
    			toggle_class(ul, "move", /*ison*/ ctx[2]);
    			add_location(ul, file$f, 32, 4, 636);
    			attr_dev(nav, "class", "svelte-ihprq6");
    			add_location(nav, file$f, 25, 0, 438);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, nav, anchor);
    			append_dev(nav, img);
    			append_dev(nav, t1);
    			append_dev(nav, button);
    			append_dev(button, span0);
    			append_dev(button, t2);
    			append_dev(button, span1);
    			append_dev(button, t3);
    			append_dev(button, span2);
    			append_dev(nav, t4);
    			append_dev(nav, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "scroll", () => {
    						scrolling = true;
    						clearTimeout(scrolling_timeout);
    						scrolling_timeout = setTimeout(clear_scrolling, 100);
    						/*onwindowscroll*/ ctx[4]();
    					}),
    					listen_dev(button, "click", /*click_handler*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 2 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[1]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (/*y*/ ctx[1] != 0) {
    				if (if_block) {
    					if (dirty & /*y*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*navigate, links, ison*/ 13) {
    				each_value = /*links*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*ison*/ 4) {
    				toggle_class(ul, "move", /*ison*/ ctx[2]);
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(nav);
    			destroy_each(each_blocks, detaching);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Navigation', slots, []);
    	let { links = [] } = $$props;
    	const displatch = createEventDispatcher();
    	let y;
    	let ison = false;

    	function navigate(link) {
    		displatch("navigate", { link });
    	}

    	const writable_props = ['links'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Navigation> was created with unknown prop '${key}'`);
    	});

    	function onwindowscroll() {
    		$$invalidate(1, y = window.pageYOffset);
    	}

    	const click_handler = () => {
    		$$invalidate(2, ison = !ison);
    	};

    	const click_handler_1 = i => {
    		navigate(i);
    		$$invalidate(2, ison = false);
    	};

    	$$self.$$set = $$props => {
    		if ('links' in $$props) $$invalidate(0, links = $$props.links);
    	};

    	$$self.$capture_state = () => ({
    		fade,
    		createEventDispatcher,
    		links,
    		displatch,
    		y,
    		ison,
    		navigate
    	});

    	$$self.$inject_state = $$props => {
    		if ('links' in $$props) $$invalidate(0, links = $$props.links);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('ison' in $$props) $$invalidate(2, ison = $$props.ison);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [links, y, ison, navigate, onwindowscroll, click_handler, click_handler_1];
    }

    class Navigation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { links: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Navigation",
    			options,
    			id: create_fragment$f.name
    		});
    	}

    	get links() {
    		throw new Error("<Navigation>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set links(value) {
    		throw new Error("<Navigation>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function Animation(args = {name, duration, delay, timing, once, reset}) {
      let {name = undefined, duration = 1000, delay = 0, timing = "ease", once = false, reset = false} = args;
      if (name != undefined) {
        return ({target = document.createElement()}) => {
          setTimeout(() => {
            target.style.animationName = name;
            target.style.animationDuration = duration.toString() + "ms";
            target.style.animationTimingFunction = timing;
            if (!reset) {
              target.style.animationFillMode = "forwards";
            }
            if (!once) {
              setTimeout(() => {
                target.style.animationName = '';
              }, duration);
            }
          }, delay);
        };
      }
    }

    function ImageSlade(node, args = {images: [], timing: 1000, fadeTiming: 500}) {

      let {images, timing, fadeTiming} = args;

      let error = false;

      if (node.children.length != 0) {
        error = true;
        alert("You need the element to be empty for the image slide to work!");
      }
      if (images.length < 1) {
        error = true;
        alert("You need to put in some images for the image slide ti work!");
      }

      if (error == false) {


        let imagefornt = document.createElement("img");

        node.style.position = "relative";
        node.style.overflow = "hidden";
        node.style.backgroundSize = "100% 100%";

        imagefornt.setAttribute("src", images[0]);
        node.appendChild(imagefornt);


        switchTransition();
        function switchTransition() {

          node.style.backgroundImage = `url(${images[0]})`;
          setTimeout(() => {
            
            images.push(images.shift());
            imagefornt.setAttribute("src", images[0]);
            imagefornt.style.opacity = "0";


            let it = 0;
            let int = setInterval(() => {
              it += fadeTiming/100;
              imagefornt.style.opacity = it/fadeTiming;
            }, fadeTiming/100);

            setTimeout(() => {
              clearInterval(int);
              imagefornt.style.opacity = 1;
            }, fadeTiming);

            setTimeout(switchTransition, timing+fadeTiming);

          }, 10);
        }

      }

    }

    function Sequence({wholeDuration, animations = [], sequencer = "sametime"}) {
      if (!["sametime", "tail"].includes(sequencer)) {
        console.log("Sequencer is not correct!");
      }

      let sequence = [];
      let elemnts = [];
      let place = 0;

      function run() {
        for (let i = 0; i < elemnts.length; i++) {
          elemnts[i]();
        }
      }

      for (let i = 0; i < animations.length; i++) {

        if (sequencer == "tail") {
          let {duration = 1000, delay = 0} = animations[i];
          if (animations[i]["delay"] != undefined) {
            animations[i].delay += place;
          } else {
            animations[i]["delay"] = place;
          }
          place += duration;
        }
        
        let anim = Animation(animations[i]);

        sequence.push((node) => {
          elemnts.push(() => {
            anim({target: node});
          });
        });

      }

      return [run, sequence];
    }

    function scrollFunctions(node, params = {
        fromTop: 0, 
        fromBottom: 0, 
        onscreen: undefined, 
        enterscreen: undefined, 
        leavescreen: undefined, 
        entertop: undefined, 
        leavetop: undefined, 
        leavebottom: undefined, 
        enterbottom: undefined
    }) {
      let {
        fromTop, 
        fromBottom, 

        onscreen, 
        enterscreen,
        leavescreen,

        entertop,
        leavetop,

        leavebottom,
        enterbottom
      } = params;
      if (onscreen != undefined && typeof onscreen != "function") {
        onscreen = Animation(onscreen);
      }
      if (enterscreen != undefined && typeof enterscreen != "function") {
        enterscreen = Animation(enterscreen);
      }
      if (leavescreen != undefined && typeof leavescreen != "function") {
        leavescreen = Animation(leavescreen);
      }
      if (entertop != undefined && typeof entertop != "function") {
        entertop = Animation(entertop);
      }
      if (leavetop != undefined && typeof leavetop != "function") {
        leavetop = Animation(leavetop);
      }
      if (leavebottom != undefined && typeof leavebottom != "function") {
        leavebottom = Animation(leavebottom);
      }
      if (enterbottom != undefined && typeof enterbottom != "function") {
        enterbottom = Animation(enterbottom);
      }
      
      let is_scroll_to = false;
      let is_scroll_past = false;
      let is_on_screen = false;

      const handleScroll = () => {

        let scrl;
        let offsetTop;

        if (typeof fromBottom == "string")
        {
          let fromBottomP = window.innerHeight*(parseInt(fromBottom)/100);
          scrl = window.innerHeight+window.scrollY-fromBottomP;
        } else {
          scrl = window.innerHeight+window.scrollY-fromBottom;
        }

        if (typeof fromTop == "string")
        {
          let fromTopP = window.innerHeight*(parseInt(fromTop)/100);
          offsetTop = window.scrollY+fromTopP;
        } else {
          offsetTop = window.scrollY+fromTop;
        }

        let offsetBottom = node.offsetTop+node.clientHeight;
        
        if (node.offsetTop < scrl && !is_scroll_to) {
          node.dispatchEvent(new CustomEvent("entertop"));
          if (entertop != undefined) {
            entertop({target: node});
          }
          is_scroll_to = true;
        }
        if (node.offsetTop > scrl && is_scroll_to == true) {
          node.dispatchEvent(new CustomEvent("leavetop"));
          if (leavetop != undefined) {
            leavetop({target: node});
          }
          is_scroll_to = false;
        }

        if (offsetBottom < offsetTop && !is_scroll_past) {
          node.dispatchEvent(new CustomEvent("leavebottom"));
          if (leavebottom != undefined) {
            leavebottom({target: node});
          }
          is_scroll_past = true;
        }
        if (offsetBottom > offsetTop && is_scroll_past == true) {
          node.dispatchEvent(new CustomEvent("enterbottom"));
          if (enterbottom != undefined) {
            enterbottom({target: node});
          }
          is_scroll_past = false;
        }

        if (is_scroll_to && !is_scroll_past) {
          node.dispatchEvent(new CustomEvent("onscreen"));
          if (onscreen != undefined) {
            onscreen({target: node});
          }
          if (is_on_screen == false) {
            node.dispatchEvent(new CustomEvent("enterscreen"));
            if (enterscreen != undefined) {
              enterscreen({target: node});
            }
            is_on_screen = true;
          }
        } else if (is_on_screen == true) {
          node.dispatchEvent(new CustomEvent("leavescreen"));
          if (leavescreen != undefined) {
            leavescreen({target: node});
          }
          is_on_screen = false;
        }

      };

      window.addEventListener("scroll", handleScroll, true);

      return {
        destroy() {
          window.removeEventListener("scroll", handleScroll, true);
        }
      }
    }

    function typeAnimation(node, args = {duration:1000, delay:0, once:false}) {
      let {duration, delay, once} = args;
      let text;
      let arr;
      let played = false;

      function main() {

        text = node.innerText;
        node.innerText = "";

        {

          arr = ["", ...text.split("")];

        }
      }

      function typeFunc() {
        if (arr.length > 0) {
          node.innerText += (arr[0] == " ") ? arr.shift() + arr.shift() : arr.shift();
          setTimeout(typeFunc, duration / text.length);
        }
      }

      function play() {
        if (!played) {
          setTimeout(typeFunc, duration / text.length + delay);
          if (once) played = true;
        }
      }

      if (node != undefined) {
        main();
        {
          play();
        }
      } else {
        return [
          (nodeasign, args = {}) => {
            duration = args.duration || 1000;
            delay = args.delay || 0;

            node = nodeasign;
            main();
          },
          play
        ]
      }
      
    }

    function typeCorectionAnimation(node, args = {duration:1000, delay:0, corections:[], playtype:"normal"}) {
      let {duration, delay, corections, playtype} = args;
      let played = false;

      let text;

      let i = 0;
      let letter = 0;
      let interval;

      function main() {

        {

          text = node.innerText;
          node.innerText = text.replace("%", "");
          
        }
      }

      function Type() { 

        let text2 = corections[i].substring(0, letter + 1);
        node.innerHTML = text.replace("%", text2);
        letter++;

        if(text2 === corections[i]) {
          clearInterval(interval);
          if (playtype == "pingpong") {
            setTimeout(function() {
              interval = setInterval(Delete, duration / corections[i].length / 2);
            }, delay);
          } else {
            
            if(i == (corections.length - 1))
              i = 0;
            else
              i++;
            
            letter = 0;
            setTimeout(function() {
              interval = setInterval(Type, duration / corections[i].length);
            }, delay);
          }
        }
      }

      function Delete() {

        let text2 = corections[i].substring(0, letter + 1);
        node.innerHTML = text.replace("%", text2);
        letter--;

        if(text2 === '') {
          clearInterval(interval);

          if(i == (corections.length - 1))
            i = 0;
          else
            i++;
          
          letter = 0;

          setTimeout(function() {
            interval = setInterval(Type, duration / corections[i].length);
          }, delay);
        }
      }

      function play() {
        if (!played) {
          setTimeout(() => {
            interval = setInterval(Type, duration / corections[i].length);
          }, delay);
          played = true;
        }
      }

      if (node != undefined) {

        main();

        {
          play();
        }

      } else {
        return [
          (nodeasign, args = {}) => {
            duration = args.duration || 1000;
            delay = args.delay || 0;
            corections = args.corections || [];
            playtype = args.playtype || "normal";

            node = nodeasign;
            main();
          },
          play
        ];
      }
    }

    /* src/Components/TopOfPage.svelte generated by Svelte v3.46.0 */

    const { window: window_1 } = globals;
    const file$e = "src/Components/TopOfPage.svelte";

    function create_fragment$e(ctx) {
    	let div6;
    	let div1;
    	let div0;
    	let t0;
    	let span;
    	let div5;
    	let h1;
    	let t1_value = /*text*/ ctx[4][Math.floor(Math.random() * /*text*/ ctx[4].length)] + "";
    	let t1;
    	let t2;
    	let div3;
    	let p0;
    	let t4;
    	let p1;

    	let t5_value = (/*sr*/ ctx[0]
    	? "Email za instrukcije: "
    	: "Tutoring Email: ") + "";

    	let t5;
    	let t6;
    	let t7;
    	let div2;
    	let p2;
    	let t9;
    	let a;
    	let div3_resize_listener;
    	let t11;
    	let div4;
    	let img;
    	let img_src_value;
    	let div4_resize_listener;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			span = element("span");
    			div5 = element("div");
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			div3 = element("div");
    			p0 = element("p");
    			p0.textContent = "Email: damiandeni.biz@gmail.com";
    			t4 = space();
    			p1 = element("p");
    			t5 = text(t5_value);
    			t6 = text(" david.casovi@gmail.com");
    			t7 = space();
    			div2 = element("div");
    			p2 = element("p");
    			p2.textContent = "Github:";
    			t9 = space();
    			a = element("a");
    			a.textContent = "https://github.com/damiano-cmd";
    			t11 = space();
    			div4 = element("div");
    			img = element("img");
    			attr_dev(div0, "class", "imgc svelte-6rc3uh");
    			add_location(div0, file$e, 52, 8, 1073);
    			attr_dev(div1, "class", "container svelte-6rc3uh");
    			add_location(div1, file$e, 51, 4, 1041);
    			attr_dev(h1, "class", "svelte-6rc3uh");
    			add_location(h1, file$e, 66, 12, 1437);
    			attr_dev(p0, "class", "svelte-6rc3uh");
    			add_location(p0, file$e, 72, 16, 1681);
    			attr_dev(p1, "class", "svelte-6rc3uh");
    			add_location(p1, file$e, 75, 16, 1826);
    			attr_dev(p2, "class", "svelte-6rc3uh");
    			add_location(p2, file$e, 79, 20, 2053);
    			attr_dev(a, "href", "https://github.com/damiano-cmd");
    			attr_dev(a, "target", "_blank");
    			add_location(a, file$e, 80, 20, 2139);
    			attr_dev(div2, "class", "lip svelte-6rc3uh");
    			add_location(div2, file$e, 78, 16, 2015);
    			attr_dev(div3, "class", "data svelte-6rc3uh");
    			add_render_callback(() => /*div3_elementresize_handler*/ ctx[6].call(div3));
    			add_location(div3, file$e, 71, 12, 1620);
    			if (!src_url_equal(img.src, img_src_value = "/img/signature.svg")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "#");
    			attr_dev(img, "class", "svelte-6rc3uh");
    			add_location(img, file$e, 90, 16, 2567);
    			attr_dev(div4, "class", "sign svelte-6rc3uh");
    			add_render_callback(() => /*div4_elementresize_handler*/ ctx[7].call(div4));
    			toggle_class(div4, "sing_repos", /*repos*/ ctx[1]);
    			add_location(div4, file$e, 89, 12, 2481);
    			attr_dev(div5, "class", "text svelte-6rc3uh");
    			add_location(div5, file$e, 65, 8, 1406);
    			attr_dev(span, "class", "overlay svelte-6rc3uh");
    			add_location(span, file$e, 64, 4, 1375);
    			attr_dev(div6, "class", "top svelte-6rc3uh");
    			add_location(div6, file$e, 50, 0, 1018);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div1);
    			append_dev(div1, div0);
    			append_dev(div6, t0);
    			append_dev(div6, span);
    			append_dev(span, div5);
    			append_dev(div5, h1);
    			append_dev(h1, t1);
    			append_dev(div5, t2);
    			append_dev(div5, div3);
    			append_dev(div3, p0);
    			append_dev(div3, t4);
    			append_dev(div3, p1);
    			append_dev(p1, t5);
    			append_dev(p1, t6);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, p2);
    			append_dev(div2, t9);
    			append_dev(div2, a);
    			div3_resize_listener = add_resize_listener(div3, /*div3_elementresize_handler*/ ctx[6].bind(div3));
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, img);
    			div4_resize_listener = add_resize_listener(div4, /*div4_elementresize_handler*/ ctx[7].bind(div4));

    			if (!mounted) {
    				dispose = [
    					listen_dev(window_1, "resize", /*reSize*/ ctx[5], false, false, false),
    					action_destroyer(ImageSlade.call(null, div0, {
    						images: ["/img/backDrop.png", "/img/backDrop2.png"],
    						timing: 5000,
    						fadeTiming: 1000
    					})),
    					action_destroyer(typeAnimation.call(null, h1, { duration: 2500, delay: 2500 })),
    					action_destroyer(typeAnimation.call(null, p0, { delay: 3000, duration: 1000 })),
    					action_destroyer(typeAnimation.call(null, p1, { delay: 4000, duration: 1000 })),
    					action_destroyer(typeAnimation.call(null, p2, { delay: 5000, duration: 250 })),
    					action_destroyer(typeAnimation.call(null, a, { delay: 5250, duration: 750 }))
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*text*/ 16 && t1_value !== (t1_value = /*text*/ ctx[4][Math.floor(Math.random() * /*text*/ ctx[4].length)] + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*sr*/ 1 && t5_value !== (t5_value = (/*sr*/ ctx[0]
    			? "Email za instrukcije: "
    			: "Tutoring Email: ") + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*repos*/ 2) {
    				toggle_class(div4, "sing_repos", /*repos*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			div3_resize_listener();
    			div4_resize_listener();
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TopOfPage', slots, []);
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(0, sr = r);
    	});

    	let repos = false;
    	let aSize;
    	let bSize;

    	let texten = [
    		"Welcome, what do you need?",
    		"Hello there!",
    		"A Web Developer and Python programmer.",
    		"Need a developer? Here I am!",
    		"Need tutoring, look no further.",
    		"Need a developer, look no further.",
    		"Anything I can help you with?"
    	];

    	let text = [
    		"Kako vam mogu pomoći?",
    		"Dobrodošli!",
    		"Web Developer i Python programer.",
    		"Treba vam developer?",
    		"Trebaju vam instrukcije?",
    		"Kako vam mogu pomoći?"
    	];

    	if (!sr) {
    		text = texten;
    	}

    	function reSize() {
    		if (window.innerWidth >= 4 * bSize + aSize) {
    			$$invalidate(1, repos = false);
    		} else {
    			$$invalidate(1, repos = true);
    		}
    	}

    	reSize();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TopOfPage> was created with unknown prop '${key}'`);
    	});

    	function div3_elementresize_handler() {
    		aSize = this.clientWidth;
    		$$invalidate(2, aSize);
    	}

    	function div4_elementresize_handler() {
    		bSize = this.clientWidth;
    		$$invalidate(3, bSize);
    	}

    	$$self.$capture_state = () => ({
    		typeAnimation,
    		ImageSlade,
    		SR,
    		sr,
    		repos,
    		aSize,
    		bSize,
    		texten,
    		text,
    		reSize
    	});

    	$$self.$inject_state = $$props => {
    		if ('sr' in $$props) $$invalidate(0, sr = $$props.sr);
    		if ('repos' in $$props) $$invalidate(1, repos = $$props.repos);
    		if ('aSize' in $$props) $$invalidate(2, aSize = $$props.aSize);
    		if ('bSize' in $$props) $$invalidate(3, bSize = $$props.bSize);
    		if ('texten' in $$props) texten = $$props.texten;
    		if ('text' in $$props) $$invalidate(4, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sr,
    		repos,
    		aSize,
    		bSize,
    		text,
    		reSize,
    		div3_elementresize_handler,
    		div4_elementresize_handler
    	];
    }

    class TopOfPage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TopOfPage",
    			options,
    			id: create_fragment$e.name
    		});
    	}
    }

    /* src/Components/AboutMe.svelte generated by Svelte v3.46.0 */
    const file$d = "src/Components/AboutMe.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (60:16) {:else}
    function create_else_block(ctx) {
    	let t_value = /*i*/ ctx[9] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*text*/ 2 && t_value !== (t_value = /*i*/ ctx[9] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(60:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (58:16) {#if typeof i == "number"}
    function create_if_block$1(ctx) {
    	let br0;
    	let br1;

    	const block = {
    		c: function create() {
    			br0 = element("br");
    			br1 = element("br");
    			add_location(br0, file$d, 58, 20, 1695);
    			add_location(br1, file$d, 58, 24, 1699);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, br0, anchor);
    			insert_dev(target, br1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(br0);
    			if (detaching) detach_dev(br1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(58:16) {#if typeof i == \\\"number\\\"}",
    		ctx
    	});

    	return block;
    }

    // (57:12) {#each text[1] as i}
    function create_each_block$3(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[9] == "number") return create_if_block$1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(57:12) {#each text[1] as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div2;
    	let h1;
    	let t1_value = (/*sr*/ ctx[0] ? "O meni" : "About Me") + "";
    	let t1;
    	let t2;
    	let div1;
    	let p0;
    	let t3_value = /*text*/ ctx[1][0] + "";
    	let t3;
    	let t4;
    	let p1;
    	let typeCorectionAnimation_action;
    	let t6;
    	let p2;
    	let mounted;
    	let dispose;
    	let each_value = /*text*/ ctx[1][1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div2 = element("div");
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			p0 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			p1 = element("p");
    			p1.textContent = "%|";
    			t6 = space();
    			p2 = element("p");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			if (!src_url_equal(img.src, img_src_value = "/img/personal.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "#");
    			attr_dev(img, "class", "svelte-1pvngcv");
    			add_location(img, file$d, 33, 8, 842);
    			attr_dev(div0, "class", "personal svelte-1pvngcv");
    			add_location(div0, file$d, 32, 4, 800);
    			attr_dev(h1, "class", "svelte-1pvngcv");
    			add_location(h1, file$d, 36, 8, 923);
    			attr_dev(p0, "class", "svelte-1pvngcv");
    			add_location(p0, file$d, 40, 12, 1046);
    			attr_dev(p1, "class", "color svelte-1pvngcv");
    			add_location(p1, file$d, 43, 12, 1105);
    			attr_dev(div1, "class", "flex svelte-1pvngcv");
    			add_location(div1, file$d, 39, 8, 1004);
    			attr_dev(p2, "class", "svelte-1pvngcv");
    			add_location(p2, file$d, 55, 8, 1586);
    			attr_dev(div2, "class", "text svelte-1pvngcv");
    			add_location(div2, file$d, 35, 4, 895);
    			attr_dev(div3, "class", "background svelte-1pvngcv");
    			add_location(div3, file$d, 27, 0, 667);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div3, t0);
    			append_dev(div3, div2);
    			append_dev(div2, h1);
    			append_dev(h1, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, p1);
    			append_dev(div2, t6);
    			append_dev(div2, p2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(p2, null);
    			}

    			if (!mounted) {
    				dispose = [
    					action_destroyer(/*anim1*/ ctx[4].call(null, div0)),
    					action_destroyer(/*anim2*/ ctx[5].call(null, h1)),
    					action_destroyer(typeCorectionAnimation_action = typeCorectionAnimation.call(null, p1, {
    						corections: /*sr*/ ctx[0]
    						? [
    								"JS Developer ",
    								"Python programer ",
    								"Freelencer ",
    								"Full Stek Developer "
    							]
    						: [
    								"JS Developer ",
    								"Python programmer ",
    								"Freelancer ",
    								"Full Stack Developer "
    							],
    						duration: 2000,
    						delay: 1000,
    						playtype: "pingpong"
    					})),
    					action_destroyer(/*anim3*/ ctx[6].call(null, div1)),
    					action_destroyer(/*anim*/ ctx[3].call(null, p2)),
    					action_destroyer(scrollFunctions.call(null, div3, { fromTop: 64, fromBottom: "50" })),
    					listen_dev(div3, "enterscreen", /*enterscreen_handler*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sr*/ 1 && t1_value !== (t1_value = (/*sr*/ ctx[0] ? "O meni" : "About Me") + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*text*/ 2 && t3_value !== (t3_value = /*text*/ ctx[1][0] + "")) set_data_dev(t3, t3_value);

    			if (typeCorectionAnimation_action && is_function(typeCorectionAnimation_action.update) && dirty & /*sr*/ 1) typeCorectionAnimation_action.update.call(null, {
    				corections: /*sr*/ ctx[0]
    				? [
    						"JS Developer ",
    						"Python programer ",
    						"Freelencer ",
    						"Full Stek Developer "
    					]
    				: [
    						"JS Developer ",
    						"Python programmer ",
    						"Freelancer ",
    						"Full Stack Developer "
    					],
    				duration: 2000,
    				delay: 1000,
    				playtype: "pingpong"
    			});

    			if (dirty & /*text*/ 2) {
    				each_value = /*text*/ ctx[1][1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(p2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('AboutMe', slots, []);

    	let sequ = Sequence({
    		sequencer: "normal",
    		animations: [
    			{
    				name: "inBottom",
    				duration: 1500,
    				once: true
    			},
    			{
    				name: "inBottom",
    				duration: 1500,
    				once: true
    			},
    			{
    				name: "inBottom",
    				duration: 1500,
    				once: true
    			},
    			{
    				name: "inBottom",
    				duration: 1500,
    				once: true
    			}
    		]
    	});

    	let [triger, [anim, anim1, anim2, anim3]] = sequ;
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(0, sr = r);
    	});

    	let text;

    	aboutme.subscribe(r => {
    		$$invalidate(1, text = r);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AboutMe> was created with unknown prop '${key}'`);
    	});

    	const enterscreen_handler = () => triger();

    	$$self.$capture_state = () => ({
    		scrollFunctions,
    		Animation,
    		typeCorectionAnimation,
    		Sequence,
    		sequ,
    		triger,
    		anim,
    		anim1,
    		anim2,
    		anim3,
    		SR,
    		aboutme,
    		sr,
    		text
    	});

    	$$self.$inject_state = $$props => {
    		if ('sequ' in $$props) sequ = $$props.sequ;
    		if ('triger' in $$props) $$invalidate(2, triger = $$props.triger);
    		if ('anim' in $$props) $$invalidate(3, anim = $$props.anim);
    		if ('anim1' in $$props) $$invalidate(4, anim1 = $$props.anim1);
    		if ('anim2' in $$props) $$invalidate(5, anim2 = $$props.anim2);
    		if ('anim3' in $$props) $$invalidate(6, anim3 = $$props.anim3);
    		if ('sr' in $$props) $$invalidate(0, sr = $$props.sr);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sr, text, triger, anim, anim1, anim2, anim3, enterscreen_handler];
    }

    class AboutMe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AboutMe",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    /* src/Components/Skill.svelte generated by Svelte v3.46.0 */
    const file$c = "src/Components/Skill.svelte";

    // (44:2) {#if hovering || is_big}
    function create_if_block(ctx) {
    	let div2;
    	let div0;
    	let img_1;
    	let img_1_src_value;
    	let t0;
    	let div1;
    	let h2;
    	let t1;
    	let t2;
    	let p0;
    	let t3;
    	let t4;
    	let br;
    	let t5;
    	let p1;
    	let t6;
    	let div2_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img_1 = element("img");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p0 = element("p");
    			t3 = text(/*text*/ ctx[2]);
    			t4 = space();
    			br = element("br");
    			t5 = space();
    			p1 = element("p");
    			t6 = text(/*subtext*/ ctx[3]);
    			if (!src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[0])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", "#");
    			attr_dev(img_1, "class", "svelte-8beqld");
    			add_location(img_1, file$c, 46, 8, 1081);
    			attr_dev(div0, "class", "container svelte-8beqld");
    			add_location(div0, file$c, 45, 6, 1049);
    			attr_dev(h2, "class", "svelte-8beqld");
    			add_location(h2, file$c, 49, 8, 1150);
    			attr_dev(p0, "class", "svelte-8beqld");
    			add_location(p0, file$c, 50, 8, 1175);
    			add_location(br, file$c, 51, 8, 1197);
    			attr_dev(p1, "class", "svelte-8beqld");
    			add_location(p1, file$c, 52, 8, 1210);
    			attr_dev(div1, "class", "dec svelte-8beqld");
    			add_location(div1, file$c, 48, 6, 1124);
    			attr_dev(div2, "class", "article svelte-8beqld");
    			toggle_class(div2, "popup", /*is_big*/ ctx[7] == false);
    			add_location(div2, file$c, 44, 4, 971);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img_1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p0);
    			append_dev(p0, t3);
    			append_dev(div1, t4);
    			append_dev(div1, br);
    			append_dev(div1, t5);
    			append_dev(div1, p1);
    			append_dev(p1, t6);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*img*/ 1 && !src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[0])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (!current || dirty & /*text*/ 4) set_data_dev(t3, /*text*/ ctx[2]);
    			if (!current || dirty & /*subtext*/ 8) set_data_dev(t6, /*subtext*/ ctx[3]);

    			if (dirty & /*is_big*/ 128) {
    				toggle_class(div2, "popup", /*is_big*/ ctx[7] == false);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, scale, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(44:2) {#if hovering || is_big}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let article;
    	let div2;
    	let div0;
    	let img_1;
    	let img_1_src_value;
    	let t0;
    	let div1;
    	let h2;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let article_resize_listener;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowresize*/ ctx[8]);
    	let if_block = (/*hovering*/ ctx[6] || /*is_big*/ ctx[7]) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			div2 = element("div");
    			div0 = element("div");
    			img_1 = element("img");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*text*/ ctx[2]);
    			t4 = space();
    			if (if_block) if_block.c();
    			if (!src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[0])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", "#");
    			attr_dev(img_1, "class", "svelte-8beqld");
    			add_location(img_1, file$c, 36, 6, 820);
    			attr_dev(div0, "class", "container svelte-8beqld");
    			add_location(div0, file$c, 35, 4, 789);
    			attr_dev(h2, "class", "svelte-8beqld");
    			add_location(h2, file$c, 39, 6, 883);
    			attr_dev(p, "class", "svelte-8beqld");
    			add_location(p, file$c, 40, 6, 906);
    			attr_dev(div1, "class", "dec svelte-8beqld");
    			add_location(div1, file$c, 38, 4, 859);
    			attr_dev(div2, "class", "article svelte-8beqld");
    			toggle_class(div2, "hide", /*is_big*/ ctx[7]);
    			add_location(div2, file$c, 34, 2, 741);
    			attr_dev(article, "class", "svelte-8beqld");
    			add_render_callback(() => /*article_elementresize_handler*/ ctx[9].call(article));
    			toggle_class(article, "top", /*hovering*/ ctx[6] == true);
    			add_location(article, file$c, 26, 0, 470);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div2);
    			append_dev(div2, div0);
    			append_dev(div0, img_1);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(article, t4);
    			if (if_block) if_block.m(article, null);
    			article_resize_listener = add_resize_listener(article, /*article_elementresize_handler*/ ctx[9].bind(article));
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "resize", /*onwindowresize*/ ctx[8]),
    					action_destroyer(scrollFunctions.call(null, article, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(article, "enterscreen", Animation({ name: "inBottom", once: true }), false, false, false),
    					listen_dev(article, "mouseleave", /*mouseleave_handler*/ ctx[10], false, false, false),
    					listen_dev(article, "mouseenter", /*mouseenter_handler*/ ctx[11], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*img*/ 1 && !src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[0])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (!current || dirty & /*text*/ 4) set_data_dev(t3, /*text*/ ctx[2]);

    			if (dirty & /*is_big*/ 128) {
    				toggle_class(div2, "hide", /*is_big*/ ctx[7]);
    			}

    			if (/*hovering*/ ctx[6] || /*is_big*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*hovering, is_big*/ 192) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(article, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*hovering*/ 64) {
    				toggle_class(article, "top", /*hovering*/ ctx[6] == true);
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
    			if (detaching) detach_dev(article);
    			if (if_block) if_block.d();
    			article_resize_listener();
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('Skill', slots, []);
    	let { img } = $$props;
    	let { title } = $$props;
    	let { text } = $$props;
    	let { subtext } = $$props;
    	let hovering;
    	let is_big = false;
    	let wwidth = 0;
    	let cwidth = 0;

    	function main() {
    		if (parseInt(wwidth / cwidth) < 2) {
    			$$invalidate(7, is_big = true);
    		} else {
    			$$invalidate(7, is_big = false);
    		}
    	}

    	const writable_props = ['img', 'title', 'text', 'subtext'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Skill> was created with unknown prop '${key}'`);
    	});

    	function onwindowresize() {
    		$$invalidate(4, wwidth = window.innerWidth);
    	}

    	function article_elementresize_handler() {
    		cwidth = this.clientWidth;
    		$$invalidate(5, cwidth);
    	}

    	const mouseleave_handler = () => $$invalidate(6, hovering = false);
    	const mouseenter_handler = () => $$invalidate(6, hovering = true);

    	$$self.$$set = $$props => {
    		if ('img' in $$props) $$invalidate(0, img = $$props.img);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('subtext' in $$props) $$invalidate(3, subtext = $$props.subtext);
    	};

    	$$self.$capture_state = () => ({
    		scale,
    		scrollFunctions,
    		Animation,
    		img,
    		title,
    		text,
    		subtext,
    		hovering,
    		is_big,
    		wwidth,
    		cwidth,
    		main
    	});

    	$$self.$inject_state = $$props => {
    		if ('img' in $$props) $$invalidate(0, img = $$props.img);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('subtext' in $$props) $$invalidate(3, subtext = $$props.subtext);
    		if ('hovering' in $$props) $$invalidate(6, hovering = $$props.hovering);
    		if ('is_big' in $$props) $$invalidate(7, is_big = $$props.is_big);
    		if ('wwidth' in $$props) $$invalidate(4, wwidth = $$props.wwidth);
    		if ('cwidth' in $$props) $$invalidate(5, cwidth = $$props.cwidth);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*wwidth, cwidth*/ 48) {
    			wwidth && cwidth && main();
    		}
    	};

    	return [
    		img,
    		title,
    		text,
    		subtext,
    		wwidth,
    		cwidth,
    		hovering,
    		is_big,
    		onwindowresize,
    		article_elementresize_handler,
    		mouseleave_handler,
    		mouseenter_handler
    	];
    }

    class Skill extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { img: 0, title: 1, text: 2, subtext: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Skill",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*img*/ ctx[0] === undefined && !('img' in props)) {
    			console.warn("<Skill> was created without expected prop 'img'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<Skill> was created without expected prop 'title'");
    		}

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<Skill> was created without expected prop 'text'");
    		}

    		if (/*subtext*/ ctx[3] === undefined && !('subtext' in props)) {
    			console.warn("<Skill> was created without expected prop 'subtext'");
    		}
    	}

    	get img() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get subtext() {
    		throw new Error("<Skill>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set subtext(value) {
    		throw new Error("<Skill>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Skills.svelte generated by Svelte v3.46.0 */

    const { Object: Object_1 } = globals;
    const file$b = "src/Components/Skills.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (25:12) {#each skl[e] as i}
    function create_each_block_1(ctx) {
    	let skill;
    	let current;

    	skill = new Skill({
    			props: {
    				img: "/img/" + /*i*/ ctx[5].img,
    				title: /*i*/ ctx[5].title,
    				text: /*i*/ ctx[5].text,
    				subtext: /*i*/ ctx[5].subtext
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(skill.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(skill, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const skill_changes = {};
    			if (dirty & /*skl*/ 2) skill_changes.img = "/img/" + /*i*/ ctx[5].img;
    			if (dirty & /*skl*/ 2) skill_changes.title = /*i*/ ctx[5].title;
    			if (dirty & /*skl*/ 2) skill_changes.text = /*i*/ ctx[5].text;
    			if (dirty & /*skl*/ 2) skill_changes.subtext = /*i*/ ctx[5].subtext;
    			skill.$set(skill_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(skill.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(skill.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(skill, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(25:12) {#each skl[e] as i}",
    		ctx
    	});

    	return block;
    }

    // (22:4) {#each Object.keys(skl) as e}
    function create_each_block$2(ctx) {
    	let h2;
    	let t0_value = /*e*/ ctx[2] + "";
    	let t0;
    	let t1;
    	let section;
    	let t2;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*skl*/ ctx[1][/*e*/ ctx[2]];
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
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			attr_dev(h2, "class", "svelte-5vzvso");
    			add_location(h2, file$b, 22, 8, 546);
    			attr_dev(section, "class", "svelte-5vzvso");
    			add_location(section, file$b, 23, 8, 681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			append_dev(section, t2);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, h2, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(h2, "enterscreen", Animation({ name: "inBottom", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*skl*/ 2) && t0_value !== (t0_value = /*e*/ ctx[2] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*skl, Object*/ 2) {
    				each_value_1 = /*skl*/ ctx[1][/*e*/ ctx[2]];
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
    						each_blocks[i].m(section, t2);
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
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(22:4) {#each Object.keys(skl) as e}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let div;
    	let h1;
    	let t0_value = (/*sr*/ ctx[0] ? "Moje Vještine" : "My Skills") + "";
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = Object.keys(/*skl*/ ctx[1]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-5vzvso");
    			add_location(h1, file$b, 18, 4, 328);
    			attr_dev(div, "class", "list svelte-5vzvso");
    			add_location(div, file$b, 17, 0, 305);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, h1, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(h1, "enterscreen", Animation({ name: "inBottom", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*sr*/ 1) && t0_value !== (t0_value = (/*sr*/ ctx[0] ? "Moje Vještine" : "My Skills") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*skl, Object, Animation*/ 2) {
    				each_value = Object.keys(/*skl*/ ctx[1]);
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
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Skills', slots, []);
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(0, sr = r);
    	});

    	let skl;

    	skills.subscribe(r => {
    		$$invalidate(1, skl = r);
    	});

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Skills> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		skills,
    		Skill,
    		scrollFunctions,
    		Animation,
    		SR,
    		sr,
    		skl
    	});

    	$$self.$inject_state = $$props => {
    		if ('sr' in $$props) $$invalidate(0, sr = $$props.sr);
    		if ('skl' in $$props) $$invalidate(1, skl = $$props.skl);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sr, skl];
    }

    class Skills extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Skills",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/Components/Service.svelte generated by Svelte v3.46.0 */
    const file$a = "src/Components/Service.svelte";

    function create_fragment$a(ctx) {
    	let article;
    	let div0;
    	let img_1;
    	let img_1_src_value;
    	let t0;
    	let div1;
    	let h2;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			article = element("article");
    			div0 = element("div");
    			img_1 = element("img");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*text*/ ctx[2]);
    			if (!src_url_equal(img_1.src, img_1_src_value = "/img/" + /*img*/ ctx[0])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", "#");
    			attr_dev(img_1, "class", "svelte-my398q");
    			add_location(img_1, file$a, 11, 8, 298);
    			attr_dev(div0, "class", "container svelte-my398q");
    			add_location(div0, file$a, 10, 4, 151);
    			attr_dev(h2, "class", "svelte-my398q");
    			add_location(h2, file$a, 14, 8, 489);
    			attr_dev(p, "class", "svelte-my398q");
    			add_location(p, file$a, 15, 8, 514);
    			attr_dev(div1, "class", "dec svelte-my398q");
    			add_location(div1, file$a, 13, 4, 347);
    			attr_dev(article, "class", "svelte-my398q");
    			add_location(article, file$a, 9, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, div0);
    			append_dev(div0, img_1);
    			append_dev(article, t0);
    			append_dev(article, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, div0, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(div0, "enterscreen", Animation({ name: "inSideLeft", once: true }), false, false, false),
    					action_destroyer(scrollFunctions.call(null, div1, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(div1, "enterscreen", Animation({ name: "inSideRight", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*img*/ 1 && !src_url_equal(img_1.src, img_1_src_value = "/img/" + /*img*/ ctx[0])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (dirty & /*text*/ 4) set_data_dev(t3, /*text*/ ctx[2]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			mounted = false;
    			run_all(dispose);
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
    	validate_slots('Service', slots, []);
    	let { img } = $$props;
    	let { title } = $$props;
    	let { text } = $$props;
    	const writable_props = ['img', 'title', 'text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Service> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('img' in $$props) $$invalidate(0, img = $$props.img);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({
    		scrollFunctions,
    		Animation,
    		img,
    		title,
    		text
    	});

    	$$self.$inject_state = $$props => {
    		if ('img' in $$props) $$invalidate(0, img = $$props.img);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [img, title, text];
    }

    class Service extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { img: 0, title: 1, text: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Service",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*img*/ ctx[0] === undefined && !('img' in props)) {
    			console.warn("<Service> was created without expected prop 'img'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<Service> was created without expected prop 'title'");
    		}

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<Service> was created without expected prop 'text'");
    		}
    	}

    	get img() {
    		throw new Error("<Service>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<Service>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Service>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Service>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Service>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Service>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Services.svelte generated by Svelte v3.46.0 */
    const file$9 = "src/Components/Services.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (22:4) {#each service as i}
    function create_each_block$1(ctx) {
    	let article;
    	let current;

    	article = new Service({
    			props: {
    				img: /*i*/ ctx[2].img,
    				title: /*i*/ ctx[2].title,
    				text: /*i*/ ctx[2].text
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(article.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(article, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const article_changes = {};
    			if (dirty & /*service*/ 2) article_changes.img = /*i*/ ctx[2].img;
    			if (dirty & /*service*/ 2) article_changes.title = /*i*/ ctx[2].title;
    			if (dirty & /*service*/ 2) article_changes.text = /*i*/ ctx[2].text;
    			article.$set(article_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(article.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(article.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(article, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(22:4) {#each service as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div;
    	let h1;
    	let t0_value = (/*sr*/ ctx[0] ? "Usluge" : "Services") + "";
    	let t0;
    	let t1;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*service*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-1ypay7o");
    			add_location(h1, file$9, 18, 4, 344);
    			attr_dev(div, "class", "bord svelte-1ypay7o");
    			add_location(div, file$9, 17, 0, 321);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, h1, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(h1, "enterscreen", Animation({ name: "inBottom", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*sr*/ 1) && t0_value !== (t0_value = (/*sr*/ ctx[0] ? "Usluge" : "Services") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*service*/ 2) {
    				each_value = /*service*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Services', slots, []);
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(0, sr = r);
    	});

    	let service;

    	services.subscribe(r => {
    		$$invalidate(1, service = r);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Services> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		services,
    		Article: Service,
    		scrollFunctions,
    		Animation,
    		SR,
    		sr,
    		service
    	});

    	$$self.$inject_state = $$props => {
    		if ('sr' in $$props) $$invalidate(0, sr = $$props.sr);
    		if ('service' in $$props) $$invalidate(1, service = $$props.service);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sr, service];
    }

    class Services extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Services",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/Components/Project.svelte generated by Svelte v3.46.0 */
    const file$8 = "src/Components/Project.svelte";

    function create_fragment$8(ctx) {
    	let article;
    	let img_1;
    	let img_1_src_value;
    	let t0;
    	let h2;
    	let t1;
    	let t2;
    	let p;
    	let t3;
    	let t4;
    	let a;
    	let t5;
    	let t6_value = (/*sr*/ ctx[4] ? "Link za projekat" : "Link to project") + "";
    	let t6;
    	let t7;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			article = element("article");
    			img_1 = element("img");
    			t0 = space();
    			h2 = element("h2");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			p = element("p");
    			t3 = text(/*text*/ ctx[2]);
    			t4 = space();
    			a = element("a");
    			t5 = text("[");
    			t6 = text(t6_value);
    			t7 = text("]");
    			if (!src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[0])) attr_dev(img_1, "src", img_1_src_value);
    			attr_dev(img_1, "alt", "#");
    			attr_dev(img_1, "class", "svelte-1m15ivy");
    			add_location(img_1, file$8, 16, 2, 353);
    			attr_dev(h2, "class", "svelte-1m15ivy");
    			add_location(h2, file$8, 17, 2, 379);
    			add_location(p, file$8, 18, 2, 398);
    			attr_dev(a, "href", /*link*/ ctx[3]);
    			attr_dev(a, "target", "_blank");
    			attr_dev(a, "class", "svelte-1m15ivy");
    			add_location(a, file$8, 19, 2, 414);
    			attr_dev(article, "class", "svelte-1m15ivy");
    			add_location(article, file$8, 15, 0, 229);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, img_1);
    			append_dev(article, t0);
    			append_dev(article, h2);
    			append_dev(h2, t1);
    			append_dev(article, t2);
    			append_dev(article, p);
    			append_dev(p, t3);
    			append_dev(article, t4);
    			append_dev(article, a);
    			append_dev(a, t5);
    			append_dev(a, t6);
    			append_dev(a, t7);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, article, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(article, "enterscreen", Animation({ name: "inScale", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*img*/ 1 && !src_url_equal(img_1.src, img_1_src_value = /*img*/ ctx[0])) {
    				attr_dev(img_1, "src", img_1_src_value);
    			}

    			if (dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);
    			if (dirty & /*text*/ 4) set_data_dev(t3, /*text*/ ctx[2]);
    			if (dirty & /*sr*/ 16 && t6_value !== (t6_value = (/*sr*/ ctx[4] ? "Link za projekat" : "Link to project") + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*link*/ 8) {
    				attr_dev(a, "href", /*link*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			mounted = false;
    			run_all(dispose);
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

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Project', slots, []);
    	let { img } = $$props;
    	let { title } = $$props;
    	let { text } = $$props;
    	let { link } = $$props;
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(4, sr = r);
    	});

    	const writable_props = ['img', 'title', 'text', 'link'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Project> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('img' in $$props) $$invalidate(0, img = $$props.img);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('link' in $$props) $$invalidate(3, link = $$props.link);
    	};

    	$$self.$capture_state = () => ({
    		scrollFunctions,
    		Animation,
    		img,
    		title,
    		text,
    		link,
    		SR,
    		sr
    	});

    	$$self.$inject_state = $$props => {
    		if ('img' in $$props) $$invalidate(0, img = $$props.img);
    		if ('title' in $$props) $$invalidate(1, title = $$props.title);
    		if ('text' in $$props) $$invalidate(2, text = $$props.text);
    		if ('link' in $$props) $$invalidate(3, link = $$props.link);
    		if ('sr' in $$props) $$invalidate(4, sr = $$props.sr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [img, title, text, link, sr];
    }

    class Project extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { img: 0, title: 1, text: 2, link: 3 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Project",
    			options,
    			id: create_fragment$8.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*img*/ ctx[0] === undefined && !('img' in props)) {
    			console.warn("<Project> was created without expected prop 'img'");
    		}

    		if (/*title*/ ctx[1] === undefined && !('title' in props)) {
    			console.warn("<Project> was created without expected prop 'title'");
    		}

    		if (/*text*/ ctx[2] === undefined && !('text' in props)) {
    			console.warn("<Project> was created without expected prop 'text'");
    		}

    		if (/*link*/ ctx[3] === undefined && !('link' in props)) {
    			console.warn("<Project> was created without expected prop 'link'");
    		}
    	}

    	get img() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set img(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get link() {
    		throw new Error("<Project>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set link(value) {
    		throw new Error("<Project>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Components/Projects.svelte generated by Svelte v3.46.0 */
    const file$7 = "src/Components/Projects.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    // (23:4) {#each proj as i}
    function create_each_block(ctx) {
    	let project;
    	let current;

    	project = new Project({
    			props: {
    				img: /*i*/ ctx[2].img,
    				title: /*i*/ ctx[2].title,
    				text: /*i*/ ctx[2].text,
    				link: /*i*/ ctx[2].link
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(project.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(project, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const project_changes = {};
    			if (dirty & /*proj*/ 2) project_changes.img = /*i*/ ctx[2].img;
    			if (dirty & /*proj*/ 2) project_changes.title = /*i*/ ctx[2].title;
    			if (dirty & /*proj*/ 2) project_changes.text = /*i*/ ctx[2].text;
    			if (dirty & /*proj*/ 2) project_changes.link = /*i*/ ctx[2].link;
    			project.$set(project_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(project.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(project.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(project, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(23:4) {#each proj as i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div;
    	let h1;
    	let t0_value = (/*sr*/ ctx[0] ? "Projekti" : "Projects") + "";
    	let t0;
    	let t1;
    	let section;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*proj*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h1, "class", "svelte-2zf27s");
    			add_location(h1, file$7, 18, 2, 297);
    			attr_dev(section, "class", "flex svelte-2zf27s");
    			add_location(section, file$7, 21, 2, 462);
    			attr_dev(div, "class", "svelte-2zf27s");
    			add_location(div, file$7, 17, 0, 289);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h1);
    			append_dev(h1, t0);
    			append_dev(div, t1);
    			append_dev(div, section);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, h1, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(h1, "enterscreen", Animation({ name: "inBottom", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*sr*/ 1) && t0_value !== (t0_value = (/*sr*/ ctx[0] ? "Projekti" : "Projects") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*proj*/ 2) {
    				each_value = /*proj*/ ctx[1];
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
    						each_blocks[i].m(section, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Projects', slots, []);
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(0, sr = r);
    	});

    	let proj;

    	projects.subscribe(r => {
    		$$invalidate(1, proj = r);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Projects> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Project,
    		scrollFunctions,
    		Animation,
    		projects,
    		SR,
    		sr,
    		proj
    	});

    	$$self.$inject_state = $$props => {
    		if ('sr' in $$props) $$invalidate(0, sr = $$props.sr);
    		if ('proj' in $$props) $$invalidate(1, proj = $$props.proj);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sr, proj];
    }

    class Projects extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Projects",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/Components/FormMail.svelte generated by Svelte v3.46.0 */
    const file$6 = "src/Components/FormMail.svelte";

    function create_fragment$6(ctx) {
    	let div;
    	let span;
    	let h1;
    	let t0_value = (/*sr*/ ctx[0] ? "Kontaktiraj me" : "Contact Me") + "";
    	let t0;
    	let t1;
    	let form;
    	let input0;
    	let t2;
    	let input1;
    	let t3;
    	let input2;
    	let t4;
    	let input3;
    	let t5;
    	let input4;
    	let t6;
    	let input5;
    	let t7;
    	let input6;
    	let input6_placeholder_value;
    	let t8;
    	let input7;
    	let input7_placeholder_value;
    	let t9;
    	let textarea;
    	let textarea_placeholder_value;
    	let t10;
    	let button;
    	let t11_value = (/*sr*/ ctx[0] ? "Pošalji" : "Send") + "";
    	let t11;
    	let t12;
    	let p;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span = element("span");
    			h1 = element("h1");
    			t0 = text(t0_value);
    			t1 = space();
    			form = element("form");
    			input0 = element("input");
    			t2 = space();
    			input1 = element("input");
    			t3 = space();
    			input2 = element("input");
    			t4 = space();
    			input3 = element("input");
    			t5 = space();
    			input4 = element("input");
    			t6 = space();
    			input5 = element("input");
    			t7 = space();
    			input6 = element("input");
    			t8 = space();
    			input7 = element("input");
    			t9 = space();
    			textarea = element("textarea");
    			t10 = space();
    			button = element("button");
    			t11 = text(t11_value);
    			t12 = space();
    			p = element("p");
    			p.textContent = "Copyright © 2022";
    			attr_dev(h1, "class", "svelte-9uw5k9");
    			add_location(h1, file$6, 11, 4, 170);
    			attr_dev(input0, "type", "hidden");
    			attr_dev(input0, "name", "_subject");
    			input0.value = "New contact!";
    			attr_dev(input0, "class", "svelte-9uw5k9");
    			add_location(input0, file$6, 13, 6, 307);
    			attr_dev(input1, "type", "hidden");
    			attr_dev(input1, "name", "_captcha");
    			input1.value = "false";
    			attr_dev(input1, "class", "svelte-9uw5k9");
    			add_location(input1, file$6, 14, 6, 372);
    			attr_dev(input2, "type", "hidden");
    			attr_dev(input2, "name", "_autoresponse");
    			input2.value = "Thanks you for contacting me. We will be in touch soon!";
    			attr_dev(input2, "class", "svelte-9uw5k9");
    			add_location(input2, file$6, 15, 6, 430);
    			attr_dev(input3, "type", "hidden");
    			attr_dev(input3, "name", "_next");
    			input3.value = "/";
    			attr_dev(input3, "class", "svelte-9uw5k9");
    			add_location(input3, file$6, 16, 6, 543);
    			attr_dev(input4, "type", "hidden");
    			attr_dev(input4, "name", "_template");
    			input4.value = "table";
    			attr_dev(input4, "class", "svelte-9uw5k9");
    			add_location(input4, file$6, 17, 6, 594);
    			attr_dev(input5, "type", "email");
    			attr_dev(input5, "name", "email");
    			attr_dev(input5, "placeholder", "Email");
    			input5.required = true;
    			attr_dev(input5, "class", "svelte-9uw5k9");
    			add_location(input5, file$6, 18, 6, 653);
    			attr_dev(input6, "type", "text");
    			attr_dev(input6, "name", "name");
    			attr_dev(input6, "placeholder", input6_placeholder_value = /*sr*/ ctx[0] ? "Ime" : "Name");
    			input6.required = true;
    			attr_dev(input6, "class", "svelte-9uw5k9");
    			add_location(input6, file$6, 26, 6, 895);
    			attr_dev(input7, "type", "text");
    			attr_dev(input7, "name", "subject");
    			attr_dev(input7, "placeholder", input7_placeholder_value = /*sr*/ ctx[0] ? "Tema" : "Subject");
    			input7.required = true;
    			attr_dev(input7, "class", "svelte-9uw5k9");
    			add_location(input7, file$6, 34, 6, 1152);
    			attr_dev(textarea, "name", "Message");
    			attr_dev(textarea, "id", "Message");
    			attr_dev(textarea, "placeholder", textarea_placeholder_value = /*sr*/ ctx[0] ? "Poruka" : "Message");
    			attr_dev(textarea, "cols", "30");
    			attr_dev(textarea, "rows", "10");
    			attr_dev(textarea, "class", "svelte-9uw5k9");
    			add_location(textarea, file$6, 42, 6, 1415);
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "svelte-9uw5k9");
    			add_location(button, file$6, 51, 6, 1716);
    			attr_dev(form, "action", "https://formsubmit.co/damiandeni.biz@gmail.com");
    			attr_dev(form, "method", "POST");
    			attr_dev(form, "class", "svelte-9uw5k9");
    			add_location(form, file$6, 12, 4, 224);
    			attr_dev(span, "class", "svelte-9uw5k9");
    			add_location(span, file$6, 10, 2, 159);
    			attr_dev(p, "class", "svelte-9uw5k9");
    			add_location(p, file$6, 54, 2, 1801);
    			attr_dev(div, "class", "svelte-9uw5k9");
    			add_location(div, file$6, 9, 0, 151);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span);
    			append_dev(span, h1);
    			append_dev(h1, t0);
    			append_dev(span, t1);
    			append_dev(span, form);
    			append_dev(form, input0);
    			append_dev(form, t2);
    			append_dev(form, input1);
    			append_dev(form, t3);
    			append_dev(form, input2);
    			append_dev(form, t4);
    			append_dev(form, input3);
    			append_dev(form, t5);
    			append_dev(form, input4);
    			append_dev(form, t6);
    			append_dev(form, input5);
    			append_dev(form, t7);
    			append_dev(form, input6);
    			append_dev(form, t8);
    			append_dev(form, input7);
    			append_dev(form, t9);
    			append_dev(form, textarea);
    			append_dev(form, t10);
    			append_dev(form, button);
    			append_dev(button, t11);
    			append_dev(div, t12);
    			append_dev(div, p);

    			if (!mounted) {
    				dispose = [
    					action_destroyer(scrollFunctions.call(null, input5, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(input5, "enterscreen", Animation({ name: "inSideLeft", once: true }), false, false, false),
    					action_destroyer(scrollFunctions.call(null, input6, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(input6, "enterscreen", Animation({ name: "inSideRight", once: true }), false, false, false),
    					action_destroyer(scrollFunctions.call(null, input7, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(input7, "enterscreen", Animation({ name: "inSideLeft", once: true }), false, false, false),
    					action_destroyer(scrollFunctions.call(null, textarea, { fromBottom: 200, fromTop: 64 })),
    					listen_dev(textarea, "enterscreen", Animation({ name: "inSideRight", once: true }), false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*sr*/ 1 && t0_value !== (t0_value = (/*sr*/ ctx[0] ? "Kontaktiraj me" : "Contact Me") + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*sr*/ 1 && input6_placeholder_value !== (input6_placeholder_value = /*sr*/ ctx[0] ? "Ime" : "Name")) {
    				attr_dev(input6, "placeholder", input6_placeholder_value);
    			}

    			if (dirty & /*sr*/ 1 && input7_placeholder_value !== (input7_placeholder_value = /*sr*/ ctx[0] ? "Tema" : "Subject")) {
    				attr_dev(input7, "placeholder", input7_placeholder_value);
    			}

    			if (dirty & /*sr*/ 1 && textarea_placeholder_value !== (textarea_placeholder_value = /*sr*/ ctx[0] ? "Poruka" : "Message")) {
    				attr_dev(textarea, "placeholder", textarea_placeholder_value);
    			}

    			if (dirty & /*sr*/ 1 && t11_value !== (t11_value = (/*sr*/ ctx[0] ? "Pošalji" : "Send") + "")) set_data_dev(t11, t11_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('FormMail', slots, []);
    	let sr;

    	SR.subscribe(r => {
    		$$invalidate(0, sr = r);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<FormMail> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollFunctions, Animation, SR, sr });

    	$$self.$inject_state = $$props => {
    		if ('sr' in $$props) $$invalidate(0, sr = $$props.sr);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [sr];
    }

    class FormMail extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormMail",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/Components/Svgs/TiltBottom.svelte generated by Svelte v3.46.0 */

    const file$5 = "src/Components/Svgs/TiltBottom.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M1200 120L0 16.48 0 0 1200 0 1200 120z");
    			attr_dev(path, "class", "shape-fill svelte-24kc3");
    			add_location(path, file$5, 8, 6, 153);
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1200 120");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-24kc3");
    			add_location(svg, file$5, 3, 2, 25);
    			attr_dev(div, "class", "curve1 svelte-24kc3");
    			add_location(div, file$5, 1, 0, 1);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TiltBottom', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TiltBottom> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class TiltBottom extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TiltBottom",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/Components/Svgs/WaveTop.svelte generated by Svelte v3.46.0 */
    const file$4 = "src/Components/Svgs/WaveTop.svelte";

    function create_fragment$4(ctx) {
    	let div1;
    	let div0;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M985.66,92.83C906.67,72,823.78,31,743.84,14.19c-82.26-17.34-168.06-16.33-250.45.39-57.84,11.73-114,31.07-172,41.86A600.21,600.21,0,0,1,0,27.35V120H1200V95.8C1132.19,118.92,1055.71,111.31,985.66,92.83Z");
    			attr_dev(path, "class", "shape-fill svelte-1haxzbn");
    			add_location(path, file$4, 9, 3, 233);
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1200 120");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-1haxzbn");
    			add_location(svg, file$4, 7, 2, 115);
    			attr_dev(div0, "class", "curve2 svelte-1haxzbn");
    			add_location(div0, file$4, 5, 1, 90);
    			attr_dev(div1, "class", "limit svelte-1haxzbn");
    			add_location(div1, file$4, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WaveTop', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WaveTop> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollFunctions, Animation });
    	return [];
    }

    class WaveTop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WaveTop",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/Components/Svgs/WaveBottom.svelte generated by Svelte v3.46.0 */
    const file$3 = "src/Components/Svgs/WaveBottom.svelte";

    function create_fragment$3(ctx) {
    	let div1;
    	let div0;
    	let svg;
    	let path0;
    	let path1;
    	let path2;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "d", "M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z");
    			attr_dev(path0, "opacity", ".25");
    			attr_dev(path0, "class", "shape-fill svelte-1vc0h8n");
    			add_location(path0, file$3, 8, 8, 237);
    			attr_dev(path1, "d", "M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z");
    			attr_dev(path1, "opacity", ".5");
    			attr_dev(path1, "class", "shape-fill svelte-1vc0h8n");
    			add_location(path1, file$3, 9, 8, 510);
    			attr_dev(path2, "d", "M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z");
    			attr_dev(path2, "class", "shape-fill svelte-1vc0h8n");
    			add_location(path2, file$3, 10, 8, 933);
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1200 120");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-1vc0h8n");
    			add_location(svg, file$3, 7, 4, 118);
    			attr_dev(div0, "class", "waveO svelte-1vc0h8n");
    			add_location(div0, file$3, 5, 2, 91);
    			attr_dev(div1, "class", "limit svelte-1vc0h8n");
    			add_location(div1, file$3, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(svg, path2);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WaveBottom', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WaveBottom> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollFunctions, Animation });
    	return [];
    }

    class WaveBottom extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WaveBottom",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/Components/Svgs/TriTop.svelte generated by Svelte v3.46.0 */
    const file$2 = "src/Components/Svgs/TriTop.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M1200 0L0 0 598.97 114.72 1200 0z");
    			attr_dev(path, "class", "shape-fill svelte-kn9rz0");
    			add_location(path, file$2, 7, 6, 207);
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1200 120");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-kn9rz0");
    			add_location(svg, file$2, 6, 2, 90);
    			attr_dev(div, "class", "tri svelte-kn9rz0");
    			add_location(div, file$2, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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
    	validate_slots('TriTop', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TriTop> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ scrollFunctions, Animation });
    	return [];
    }

    class TriTop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TriTop",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/Components/Svgs/TiltTop.svelte generated by Svelte v3.46.0 */

    const file$1 = "src/Components/Svgs/TiltTop.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M1200 120L0 16.48 0 0 1200 0 1200 120z");
    			attr_dev(path, "class", "shape-fill svelte-h4wgqj");
    			add_location(path, file$1, 6, 6, 159);
    			attr_dev(svg, "data-name", "Layer 1");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "viewBox", "0 0 1200 120");
    			attr_dev(svg, "preserveAspectRatio", "none");
    			attr_dev(svg, "class", "svelte-h4wgqj");
    			add_location(svg, file$1, 5, 2, 42);
    			attr_dev(div, "class", "tilt svelte-h4wgqj");
    			add_location(div, file$1, 3, 0, 20);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
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

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TiltTop', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TiltTop> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class TiltTop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TiltTop",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.46.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let navigation;
    	let t0;
    	let main_1;
    	let div1;
    	let topofpage;
    	let t1;
    	let div0;
    	let tilt;
    	let t2;
    	let div2;
    	let about;
    	let t3;
    	let tiltbottom;
    	let t4;
    	let div3;
    	let skills_1;
    	let t5;
    	let wavetop;
    	let t6;
    	let div4;
    	let service;
    	let t7;
    	let wavebottom;
    	let t8;
    	let div7;
    	let div5;
    	let projects_1;
    	let t9;
    	let div6;
    	let tritop;
    	let t10;
    	let div8;
    	let formmail;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[4]);
    	add_render_callback(/*onwindowresize*/ ctx[5]);

    	navigation = new Navigation({
    			props: { links: /*links*/ ctx[3] },
    			$$inline: true
    		});

    	navigation.$on("navigate", /*navigate_handler*/ ctx[6]);
    	topofpage = new TopOfPage({ $$inline: true });
    	tilt = new TiltTop({ $$inline: true });
    	about = new AboutMe({ $$inline: true });
    	tiltbottom = new TiltBottom({ $$inline: true });
    	skills_1 = new Skills({ $$inline: true });
    	wavetop = new WaveTop({ $$inline: true });
    	service = new Services({ $$inline: true });
    	wavebottom = new WaveBottom({ $$inline: true });
    	projects_1 = new Projects({ $$inline: true });
    	tritop = new TriTop({ $$inline: true });
    	formmail = new FormMail({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(navigation.$$.fragment);
    			t0 = space();
    			main_1 = element("main");
    			div1 = element("div");
    			create_component(topofpage.$$.fragment);
    			t1 = space();
    			div0 = element("div");
    			create_component(tilt.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			create_component(about.$$.fragment);
    			t3 = space();
    			create_component(tiltbottom.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			create_component(skills_1.$$.fragment);
    			t5 = space();
    			create_component(wavetop.$$.fragment);
    			t6 = space();
    			div4 = element("div");
    			create_component(service.$$.fragment);
    			t7 = space();
    			create_component(wavebottom.$$.fragment);
    			t8 = space();
    			div7 = element("div");
    			div5 = element("div");
    			create_component(projects_1.$$.fragment);
    			t9 = space();
    			div6 = element("div");
    			create_component(tritop.$$.fragment);
    			t10 = space();
    			div8 = element("div");
    			create_component(formmail.$$.fragment);
    			attr_dev(div0, "class", "sh svelte-u1w3hl");
    			add_location(div0, file, 90, 2, 1971);
    			attr_dev(div1, "class", "svelte-u1w3hl");
    			add_location(div1, file, 88, 1, 1947);
    			attr_dev(div2, "class", "white svelte-u1w3hl");
    			add_location(div2, file, 94, 1, 2018);
    			attr_dev(div3, "class", "white svelte-u1w3hl");
    			add_location(div3, file, 98, 1, 2076);
    			attr_dev(div4, "class", "white svelte-u1w3hl");
    			add_location(div4, file, 102, 1, 2133);
    			attr_dev(div5, "class", "white svelte-u1w3hl");
    			add_location(div5, file, 107, 2, 2202);
    			attr_dev(div6, "class", "sh svelte-u1w3hl");
    			add_location(div6, file, 110, 2, 2249);
    			attr_dev(div7, "class", "svelte-u1w3hl");
    			add_location(div7, file, 106, 1, 2194);
    			attr_dev(div8, "class", "sh svelte-u1w3hl");
    			add_location(div8, file, 114, 1, 2297);
    			attr_dev(main_1, "class", "svelte-u1w3hl");
    			add_location(main_1, file, 87, 0, 1921);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(navigation, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main_1, anchor);
    			append_dev(main_1, div1);
    			mount_component(topofpage, div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			mount_component(tilt, div0, null);
    			append_dev(main_1, t2);
    			append_dev(main_1, div2);
    			mount_component(about, div2, null);
    			append_dev(div2, t3);
    			mount_component(tiltbottom, div2, null);
    			append_dev(main_1, t4);
    			append_dev(main_1, div3);
    			mount_component(skills_1, div3, null);
    			append_dev(div3, t5);
    			mount_component(wavetop, div3, null);
    			append_dev(main_1, t6);
    			append_dev(main_1, div4);
    			mount_component(service, div4, null);
    			append_dev(div4, t7);
    			mount_component(wavebottom, div4, null);
    			append_dev(main_1, t8);
    			append_dev(main_1, div7);
    			append_dev(div7, div5);
    			mount_component(projects_1, div5, null);
    			append_dev(div7, t9);
    			append_dev(div7, div6);
    			mount_component(tritop, div6, null);
    			append_dev(main_1, t10);
    			append_dev(main_1, div8);
    			mount_component(formmail, div8, null);
    			/*main_1_binding*/ ctx[7](main_1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(window, "scroll", () => {
    						scrolling = true;
    						clearTimeout(scrolling_timeout);
    						scrolling_timeout = setTimeout(clear_scrolling, 100);
    						/*onwindowscroll*/ ctx[4]();
    					}),
    					listen_dev(window, "resize", /*onwindowresize*/ ctx[5])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*y*/ 2 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*y*/ ctx[1]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			const navigation_changes = {};
    			if (dirty & /*links*/ 8) navigation_changes.links = /*links*/ ctx[3];
    			navigation.$set(navigation_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(navigation.$$.fragment, local);
    			transition_in(topofpage.$$.fragment, local);
    			transition_in(tilt.$$.fragment, local);
    			transition_in(about.$$.fragment, local);
    			transition_in(tiltbottom.$$.fragment, local);
    			transition_in(skills_1.$$.fragment, local);
    			transition_in(wavetop.$$.fragment, local);
    			transition_in(service.$$.fragment, local);
    			transition_in(wavebottom.$$.fragment, local);
    			transition_in(projects_1.$$.fragment, local);
    			transition_in(tritop.$$.fragment, local);
    			transition_in(formmail.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(navigation.$$.fragment, local);
    			transition_out(topofpage.$$.fragment, local);
    			transition_out(tilt.$$.fragment, local);
    			transition_out(about.$$.fragment, local);
    			transition_out(tiltbottom.$$.fragment, local);
    			transition_out(skills_1.$$.fragment, local);
    			transition_out(wavetop.$$.fragment, local);
    			transition_out(service.$$.fragment, local);
    			transition_out(wavebottom.$$.fragment, local);
    			transition_out(projects_1.$$.fragment, local);
    			transition_out(tritop.$$.fragment, local);
    			transition_out(formmail.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(navigation, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main_1);
    			destroy_component(topofpage);
    			destroy_component(tilt);
    			destroy_component(about);
    			destroy_component(tiltbottom);
    			destroy_component(skills_1);
    			destroy_component(wavetop);
    			destroy_component(service);
    			destroy_component(wavebottom);
    			destroy_component(projects_1);
    			destroy_component(tritop);
    			destroy_component(formmail);
    			/*main_1_binding*/ ctx[7](null);
    			mounted = false;
    			run_all(dispose);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let sr_codes = ["BA", "BIH", "HR", "HRV", "ME", "MNE", "RS", "SRB"];
    	let main;
    	let y;
    	let height;
    	let linksen = ["Home", "About Me", "Professions", "Services", "Projects", "Contact Me"];
    	let links = ["Glavno", "O meni", "Moje Vještine", "Usluge", "Projekti", "Kontaktiraj me"];

    	fetch("https://ipapi.co/json").then(res => res.text()).then(data => {
    		let dat = JSON.parse(data);

    		if (!sr_codes.includes(dat['country'])) {
    			skills.set(skillsen);
    			services.set(servicesen);
    			projects.set(projectsen);
    			aboutme.set(aboutmeen);
    			$$invalidate(3, links = linksen);
    			SR.set(false);
    		}
    	}).catch(err => {
    		if (err) throw err;
    		skills.set(skillsen);
    		services.set(servicesen);
    		projects.set(projectsen);
    		aboutme.set(aboutmeen);
    		$$invalidate(3, links = linksen);
    		SR.set(false);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function onwindowscroll() {
    		$$invalidate(1, y = window.pageYOffset);
    	}

    	function onwindowresize() {
    		$$invalidate(2, height = window.innerHeight);
    	}

    	const navigate_handler = e => {
    		let off = main.children[links.indexOf(e.detail.link)].offsetTop;
    		$$invalidate(1, y = off + (off > 0 ? 1 : 0));
    	};

    	function main_1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			main = $$value;
    			$$invalidate(0, main);
    		});
    	}

    	$$self.$capture_state = () => ({
    		SR,
    		skills,
    		skillsen,
    		services,
    		servicesen,
    		projects,
    		projectsen,
    		aboutme,
    		aboutmeen,
    		sr_codes,
    		Navigation,
    		TopOfPage,
    		About: AboutMe,
    		Skills,
    		Service: Services,
    		Projects,
    		FormMail,
    		TiltBottom,
    		WaveTop,
    		WaveBottom,
    		TriTop,
    		Tilt: TiltTop,
    		main,
    		y,
    		height,
    		linksen,
    		links
    	});

    	$$self.$inject_state = $$props => {
    		if ('sr_codes' in $$props) sr_codes = $$props.sr_codes;
    		if ('main' in $$props) $$invalidate(0, main = $$props.main);
    		if ('y' in $$props) $$invalidate(1, y = $$props.y);
    		if ('height' in $$props) $$invalidate(2, height = $$props.height);
    		if ('linksen' in $$props) linksen = $$props.linksen;
    		if ('links' in $$props) $$invalidate(3, links = $$props.links);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		main,
    		y,
    		height,
    		links,
    		onwindowscroll,
    		onwindowresize,
    		navigate_handler,
    		main_1_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
