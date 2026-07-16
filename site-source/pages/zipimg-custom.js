(() => {
  const brandPattern = /zippic/gi;
  const oldEmail = 'imkelen009@gmail.com';
  const newEmail = '1653440843@qq.com';

  function replaceText(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        return /zippic/i.test(node.nodeValue || '') || (node.nodeValue || '').includes(oldEmail)
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      node.nodeValue = node.nodeValue.replace(brandPattern, match => match === match.toUpperCase() ? 'ZIPIMG' : match[0] === 'Z' ? 'ZipImg' : 'zipimg').replaceAll(oldEmail, newEmail);
    }
  }

  function customize() {
    replaceText(document.body);
    const brandedTitle = document.title.replace(brandPattern, 'ZipImg');
    if (document.title !== brandedTitle) document.title = brandedTitle;
    document.querySelectorAll('meta[content]').forEach(meta => {
      meta.content = meta.content.replace(brandPattern, 'zipimg').replaceAll(oldEmail, newEmail);
    });
    document.querySelectorAll('[alt], [title]').forEach(element => {
      if (element.alt) element.alt = element.alt.replace(brandPattern, 'ZipImg');
      if (element.title) element.title = element.title.replace(brandPattern, 'ZipImg');
    });
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      if (link.href.includes(oldEmail)) link.href = `mailto:${newEmail}`;
    });
    document.querySelectorAll('header a[href*="/blog"]').forEach(link => {
      const item = link.closest('li');
      if (item) item.remove();
      else link.remove();
    });
    document.querySelectorAll('a.__cf_email__, a[href*="/cdn-cgi/l/email-protection"]').forEach(link => {
      link.classList.remove('__cf_email__');
      link.removeAttribute('data-cfemail');
      link.href = `mailto:${newEmail}`;
      link.textContent = newEmail;
    });

    const footer = document.querySelector('footer');
    if (footer) {
      footer.classList.add('zipimg-footer');
      const friendLabel = [...footer.querySelectorAll('span')].find(span => span.textContent?.includes('友情链接'));
      const friendGroup = friendLabel?.closest('.flex.gap-6');
      if (friendGroup) friendGroup.remove();
    }
  }

  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      customize();
    });
  };

  const observer = new MutationObserver(schedule);
  const start = () => {
    setTimeout(() => {
      customize();
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }, 2500);
  };
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
