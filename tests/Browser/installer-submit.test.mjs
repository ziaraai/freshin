import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../resources/views/vendor/installer/partials/submit-status.blade.php', import.meta.url), 'utf8').replace(/<\/?script>/g, '');
function setup() {
    const events = {};
    const attributes = {};
    const form = {
        addEventListener: (name, callback) => { events[name] = callback; },
        setAttribute: (name, value) => { attributes[name] = value; },
        removeAttribute: (name) => { delete attributes[name]; },
    };
    const button = { innerHTML: 'Install', disabled: false };
    const status = { hidden: true, focus() { this.focused = true; } };
    let timer;
    const window = {
        addEventListener: (name, callback) => { events[name] = callback; },
        setTimeout: (callback) => { timer = callback; return 1; },
        clearTimeout: () => { timer = undefined; },
    };
    const elements = { 'installation-form': form, 'installation-submit': button, 'installation-status': status };
    runInNewContext(source, { window, document: { getElementById: (id) => elements[id] } });
    const submit = () => {
        let prevented = false;
        events.submit({ preventDefault() { prevented = true; } });
        return prevented;
    };
    return { button, status, attributes, events, submit, wait: () => timer() };
}

test('first submit navigates normally while subsequent clicks and Enter submissions are blocked', () => {
    const ui = setup();
    assert.equal(ui.submit(), false);
    assert.equal(ui.button.disabled, true);
    assert.equal(ui.attributes['aria-busy'], 'true');
    assert.equal(ui.status.hidden, false);
    assert.equal(ui.status.focused, true);
    assert.match(ui.status.textContent, /running/);
    assert.equal(ui.submit(), true);
});

test('a slow request keeps submissions blocked rather than automatically retrying', () => {
    const ui = setup();
    ui.submit();
    ui.wait();
    assert.match(ui.status.textContent, /Plesk and Laravel logs/);
    assert.equal(ui.button.disabled, true);
    assert.equal(ui.submit(), true);
});

test('back navigation restores the form with a warning about the previous installation', () => {
    const ui = setup();
    ui.submit();
    ui.events.pageshow({ persisted: true });
    assert.equal(ui.button.disabled, false);
    assert.equal(ui.button.innerHTML, 'Install');
    assert.equal(ui.attributes['aria-busy'], undefined);
    assert.match(ui.status.textContent, /check whether the previous installation completed/);
    assert.equal(ui.submit(), false);
});
