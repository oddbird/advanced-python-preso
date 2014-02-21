(function ( document, window ) {
  'use strict';

  // LIs in top-level UL/OL (i.e. not notes) in data-reveal:1 step are innerSteps
  [].slice.call(document.querySelectorAll(
    '.step[data-reveal="1"] > ul > li, .step[data-reveal="1"] > ol > li'
  )).forEach( function (elem) {
    elem.classList.add('innerStep');
  });

})(document, window);


$(function () {
  $('.step').each(function () {
    var slide = $(this);
    var emph = slide.attr('data-emphasize-lines');
    var linenos = slide.find('.code .ln').html('&nbsp;');
    if (emph) {
      emph.split(',').forEach(function (num) {
        linenos.eq(parseInt(num, 10)-1).addClass('emphasized');
      });
    }
  });
});
