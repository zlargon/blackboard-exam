(function () {
  // Search Button
  function addSearchButton(ele, text) {
    const button = document.createElement('button');
    button.appendChild(document.createTextNode('search'));
    button.onclick = function () {

      // copy to clipboard
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      // google search
      window.open(`https://www.google.com/search?q=${JSON.stringify(text)}`, '_blank');
    }

    ele.appendChild(button);
  }

  // add search buttons for questions
  const legends = document.getElementsByTagName('legend');
  for (const ele of legends) {
    const text = ele.innerText.trim();
    addSearchButton(ele, text);
  }

  // add search buttons for options
  const trs = document.querySelectorAll('table.multiple-choice-table tr');
  for (const ele of trs) {
    const text = ele.getElementsByTagName('label')[0].innerText.trim();
    addSearchButton(ele, text);
  }
})();

