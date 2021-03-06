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
    var stepNums = slide.attr('data-emphasize-lines-step');
    var linenos = slide.find('.code .ln');
    var emphasizeLine = function (num) {
      var ln = linenos.eq(parseInt(num, 10)-1);
      return $('<span class="emphasized">&nbsp;</span>').insertBefore(ln);
    };
    if (!slide.data('keep-linenos')) {
      linenos.html('');
    }
    if (stepNums) {
      stepNums.split(',').forEach(function (num) {
        var emph = emphasizeLine(num);
        $('<span class="emphasized marker">&nbsp;</span>').insertBefore(emph);
        emph.addClass('innerStep');
      });
    }

    slide.get(0).addEventListener('impress:innerstep', function () {
      slide.find('.innerStep').removeClass('last').filter('.stepped').last().addClass('last');
    });
  });

  $('.cite .cite_label').html('&mdash; ');
});
