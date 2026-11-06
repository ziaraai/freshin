<script>
(() => {
    const form = document.getElementById('installation-form');
    const button = document.getElementById('installation-submit');
    const status = document.getElementById('installation-status');
    const originalLabel = button.innerHTML;
    let submitting = false;
    let slowRequestTimer;

    form.addEventListener('submit', (event) => {
        if (submitting) {
            event.preventDefault();
            return;
        }
        // Keep native form submission and redirects, including server validation errors.
        submitting = true;
        button.disabled = true;
        button.textContent = 'Installing…';
        form.setAttribute('aria-busy', 'true');
        status.hidden = false;
        status.textContent = 'Installation is running. Please keep this page open and do not submit again.';
        status.focus();
        slowRequestTimer = window.setTimeout(() => {
            status.textContent = 'Still waiting for the server. Do not submit again. If a timeout or error appears, check the Plesk and Laravel logs before retrying; installation may still be running.';
        }, 30000);
    });

    // Browsers can restore the disabled button when navigating back from a response.
    window.addEventListener('pageshow', (event) => {
        if (!event.persisted) return;
        window.clearTimeout(slowRequestTimer);
        submitting = false;
        button.disabled = false;
        button.innerHTML = originalLabel;
        form.removeAttribute('aria-busy');
        status.hidden = false;
        status.textContent = 'Before submitting again, check whether the previous installation completed. If it failed, review its error first.';
    });
})();
</script>
