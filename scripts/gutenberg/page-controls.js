// Page-owned enhancement of editable controls; the WordPress plugin stays unchanged.
export function initializePageControls(root) {
  for (const placeholder of root.querySelectorAll('[data-ui]')) {
    const encoded = placeholder.getAttribute('data-ui');
    if (!encoded.startsWith('{"lenremontPage":1,')) continue;
    const settings = JSON.parse(encoded);
    let target = placeholder;
    if (settings.kind === 'select') {
      target = document.createElement('select');
      for (const { name, value } of placeholder.attributes)
        if (name !== 'data-ui' && name !== 'role') target.setAttribute(name, value);
      for (const item of placeholder.querySelectorAll('[role="option"]'))
        target.add(new Option(item.textContent, item.getAttribute('data-name'), false, item.getAttribute('aria-selected') === 'true'));
      target.classList.remove('lr-gutenberg-select');
      placeholder.replaceWith(target);
    } else if (settings.kind === 'video') {
      const figure = placeholder.querySelector('figure');
      target = figure.querySelector('video');
      for (const name of figure.classList)
        if (!name.startsWith('wp-block-')) target.classList.add(name);
      figure.className = 'wp-block-video';
    } else if (settings.kind === 'time') {
      target = document.createElement('time');
      for (const { name,value } of placeholder.attributes) target.setAttribute(name,value);
      target.append(...placeholder.childNodes);
      placeholder.replaceWith(target);
    }
    for (const [name,value] of Object.entries(settings.attributes)) target.setAttribute(name,value);
    target.removeAttribute('data-ui');
  }
}
