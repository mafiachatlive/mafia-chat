function loadTab(tabName) {
  const htmlFile = `${tabName}.html`;
  const jsFile = `${tabName}.js`;

  fetch(htmlFile)
    .then(res => res.text())
    .then(html => {
      document.getElementById('render-area').innerHTML = html;

      const oldScript = document.getElementById('tab-script');
      if (oldScript) oldScript.remove();

      const script = document.createElement('script');
      script.id = 'tab-script';
      script.src = jsFile;
      document.body.appendChild(script);
    })
    .catch(err => {
      document.getElementById('render-area').innerHTML = `<p style="color:red;">Error loading ${tabName}</p>`;
    });
}
